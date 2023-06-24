<svelte:options accessors />

<div class="knob-container">
	<button on:click={async()=>await log_into_dropbox()} class:hide={authed} >
		LOG INTO DB
	</button>
	<!-- svelte-ignore a11y-click-events-have-key-events -->
	<div
		class="knob"
		on:click={async () => {
			gallery_open = !gallery_open
			let [_canvas_image, blob] = await get_current_canvas_as_image()
			canvas_image = _canvas_image
			canvas_image_src = canvas_image.src
			canvas_image_blob = blob
			console.log(canvas_image.src)
		}}>
		{@html solveIcon}
	</div>
	{#if gallery_open}
		<div id="gallery-container-outer">
			<div id="gallery-container">
				<div id="top-bar">
					<div id="project-title">Project</div>
					<!-- svelte-ignore a11y-click-events-have-key-events -->
					<div
						id="back-button"
						on:click={() => {
							gallery_open = !gallery_open
						}}>
						{@html forbidIcon}
					</div>
				</div>
				<div id="current-project">
					<img src={canvas_image_src} id="canvas-preview-img" alt="" />
					<div id="project-options">
						<!-- svelte-ignore a11y-click-events-have-key-events -->
						<div id="project-save-button" on:click={save_to_dropbox}>
							<div id="project-save-button-title">Save to dropbox</div>
							<div class="icon" style="transform: translate(0px,0.2rem);">
								{@html captureIcon}
							</div>
						</div>
						<!-- svelte-ignore a11y-click-events-have-key-events -->
						<!-- <div id="project-save-button" on:click={()=>{
							localStorage.setItem('project', JSON.stringify(project))
						}}>
							<div id="project-save-button-title">Save to localStorage</div>
							<div class="icon" style="transform: translate(0px,0.2rem);">
								{@html captureIcon}
							</div>
						</div> -->
						<!-- svelte-ignore a11y-click-events-have-key-events -->
						<div id="project-save-button" on:click={download_image}>
							<div id="project-save-button-title">Download</div>
							<div class="icon" style="transform: scale(1.34);">
								{@html downloadIcon}
							</div>
						</div>
						<div id="project-save-button" class="date">
							<div id="project-save-button-title">{format_time(current_project.id)}</div>
							<div class="icon">
								{@html timeIcon}
							</div>
						</div>

					</div>
				</div>
				<div id="options-bar">
					<!-- svelte-ignore a11y-click-events-have-key-events -->
					<div id="button" on:click={async () => { 
						let safe = await is_safe_to_switch_to_new_project()
						safe = safe ? safe : confirm('Are you sure you want to create another project? This one is not saved.')
						if(safe){
							new_project()
							gallery_open = false
						}
					}}>
						<div>
							New file
						</div>
						{@html launchIcon}
					</div>
				</div>
				<div id="gallery-elements">
					{#each gallery_elements as element, i}
						<!-- svelte-ignore a11y-click-events-have-key-events -->
						<div id="element" on:click={async ()=>{
							let safe = await is_safe_to_switch_to_new_project()
							safe = safe ? safe : confirm('Are you sure you want to switch to another project? This one is not saved.')
							if(safe){
								let proj = await dbx.filesDownload({
									path: '/' + element.name + '.json'
								});
								// @ts-ignore
								let binary = await proj.result.fileBlob.text()
								let binary_json = JSON.parse(binary)
								load_project(binary_json)
								gallery_open = false
							}
						}} 
						style={ Number(element.name) === current_project.id ? "border: 0.1rem solid white;" : ""}
						>
							<!-- {element.name} -->
							<div id="element-name">
								{format_time(element.name)}
							</div>
							<img draggable="false" src={element.image_src} id="canvas-preview-img" alt="" />
						</div>
					{/each}
				</div>
			</div>
		</div>
	{/if}
</div>

<script lang="ts">
	// @ts-ignore
	import solveIcon from '/../public/solve.svg'
	// @ts-ignore
	import launchIcon from '/../public/launch.svg'
	// @ts-ignore
	import forbidIcon from '/../public/forbid.svg'
	// @ts-ignore
	import captureIcon from '/../public/capture.svg'
	// @ts-ignore
	import downloadIcon from '/../public/download.svg'
	// @ts-ignore
	import timeIcon from '/../public/time.svg'
	import getToken from 'getToken'
	import {Dropbox, DropboxAuth} from 'dropbox'
	import type {Project} from 'stuff'
	import { onMount } from 'svelte'
	import { type files } from "dropbox"
	import { DropboxAuther } from 'dropbox_auth'
	import { element } from 'svelte/internal'
	import {floating_modal_message} from 'store'

	export let current_project: Project
	export let get_current_canvas_as_image: () => Promise<[HTMLImageElement, Blob]>
	export let new_project: () => void
	export let load_project: (project: Project) => void
	export let project_has_been_modified: boolean

	const format_time = (t: number | string): string =>{
		return new Date(Number(t)).toLocaleString('en-GB', {
			hourCycle: 'h23',
			day: "2-digit",
			month: "2-digit",
			year: "numeric",
			hour: "2-digit",
			minute: "2-digit"
		}).replace(',','')
	}

	let gallery_open = false

	let canvas_image: HTMLImageElement | undefined = undefined
	let canvas_image_blob: Blob | undefined = undefined
	let canvas_image_src: string = ''


	class Element {
		name: string
		image_src: string
		constructor(name: string, image_src: string) {
			this.name = name
			this.image_src = image_src
		}
	}
	
	let dbx: Dropbox
	const dbx_auther = new DropboxAuther()

	let authed = false
	let gallery_elements: Element[] = []

	const log_into_dropbox = async ()=> {
		await dbx_auther.doAuth()
	}
	
	export const is_safe_to_switch_to_new_project = async (): Promise<boolean> =>{
		let project_is_saved_to_dropbox = false

		if(!dbx_auther.authed){
			project_is_saved_to_dropbox = true
		} else {
			let response = await dbx.filesListFolder({path: ''})
			for (let element of response.result.entries) {
				let proj_name = Number(element.name.slice(0,-5))
				if(proj_name === current_project.id){
					project_is_saved_to_dropbox = true
					break
				}
			}
		}

		if(project_has_been_modified || !project_is_saved_to_dropbox){
			return false
		} else {
			return true
		}
	}

	const download_image = async ()=>{
		const link = document.createElement('a');
		link.href = (canvas_image as HTMLImageElement).src
		link.download = current_project.id + '.png';
		link.click();
	}
	const refetch_canvases = async () => {
		let response = await dbx.filesListFolder({path: ''})
		console.log(response)
		gallery_elements = []
		for (let element of response.result.entries) {
			if(element.name.endsWith(".json")){
				let proj_name = element.name.slice(0,-5)
				let image = await dbx.filesDownload({
					path: '/' + proj_name + '.png'
				})
				// @ts-ignore
				let binary: Blob = image.result.fileBlob
				const blobToDataURL = (blob: Blob): Promise<string> => {
					return new Promise<string>((resolve, reject) => {
						const reader = new FileReader();
						reader.onload = _e => resolve(reader.result as string);
						reader.onerror = _e => reject(reader.error);
						reader.onabort = _e => reject(new Error("Read aborted"));
						reader.readAsDataURL(blob);
					});
				}
				// console.log(
				// 		await blobToDataURL(binary)
				// )
				// gallery_elements.push(new Element(
				// 	proj_name,
				// 	await blobToDataURL(binary)
				// ))
				gallery_elements = [... gallery_elements, new Element(
					proj_name,
					await blobToDataURL(binary)
				)]
			}
		}
	}
	const save_to_dropbox = async ()=>{
		floating_modal_message.set("Starting upload to dropbox.")
		let r = await dbx.filesUpload({
			path: '/' + current_project.id + '.json',
			contents: JSON.stringify(current_project),
			// @ts-ignore
			mode: "overwrite"
		})
		r = await dbx.filesUpload({
			path: '/' + current_project.id + '.png',
			contents: await (await fetch(((canvas_image as HTMLImageElement).src))).blob(),
			// @ts-ignore
			mode: "overwrite"
		})
		floating_modal_message.set("Upload to dropbox succesful.")
		project_has_been_modified = false
		await refetch_canvases()
	}


	onMount(async () => {
		await dbx_auther.try_init_dropbox()
		authed = dbx_auther.authed
		dbx = dbx_auther.dbx
		if(authed){
			refetch_canvases()
		}
	})


</script>

<style lang="scss">
	* {
		user-select: none;
		-webkit-tap-highlight-color: transparent;
	}
	#canvas-preview-img {
		/* max-width: 12rem; */
		height: 12rem;
		/* max-width: 5rem; */
		/* aspect-ratio:unset; */
	}
	.hide{
		display: none;
	}
	:global(#gallery-container::-webkit-scrollbar){
		background: black;
	}
	:global(#gallery-container::-webkit-scrollbar-track){
		background: grey;
	}
	:global(#gallery-container::-webkit-scrollbar-thumb){
		background: white; 
	}
	#gallery-container-outer {
		position: fixed;
		display: flex;
		flex-direction: column;
		align-items: center;
		width: 100vw;
		height: 100vh;
		left: 0;
		top: 0;
		z-index: 100;
		background: black;
		#gallery-container {
			// scrollbar-color: #6969dd #e0e0e0;
			// scrollbar-width: thin;
			overflow-y: overlay;
			scrollbar-gutter: stable both-edges;
			margin-top: 1rem;
			// overflow: scroll;
			height: 100%;
			max-width: 40rem;
			width: 100%;
			display: flex;
			flex-direction: column;
			align-items: center;
			#top-bar {
				#project-title {
					margin-left: 0.5rem;
				}
				margin-bottom: 1rem;
				width: 100%;
				font-size: 2rem;
				display: flex;
				justify-content: space-between;
			}
			#options-bar {
				* {
					font-size: 0.95rem;
					:global(svg){
						fill: white;
					}
				}
				#button{
					display: flex;
					cursor: pointer;
					padding: 0rem 0.2rem;
					&:active{
						filter: invert(1);
						background: black;
					}
				}
				margin-bottom: 1rem;
				width: 100%;
				font-size: 2rem;
				display: flex;
				justify-content: space-between;
			}
			#back-button > :global(svg) {
				&:active{
					filter: invert(1);
					background: black;
				}
				transform: scale(1.5) translate(0.2rem, 0px);
				fill: white;
				width: 3rem;
				aspect-ratio: 1/1;
				cursor: pointer;
			}
			#gallery-elements {
				width: 100%;
				display: grid;
				grid-template-columns: repeat(3, 1fr);
				gap: 10px;
				grid-auto-rows: minmax(100px, auto);
				#element{
					cursor: pointer;
					// pointer-events: none;
					user-select: none;
					#element-name{
						margin-bottom: 0.5rem;
					}
					&:active{
						background: white;
						*{
							color: black;
						}
					}
				}
			}
			#current-project {
				display: flex;
				justify-content: space-between;
				width: 100%;
				margin-bottom: 1rem;

				#project-options {
					display: flex;
					flex-direction: column;
					justify-content: space-between;
					* {
						font-size: 1.3rem;
					}

					#project-save-button-title {
						// margin: auto;
						margin-right: 0.5rem;
					}
					#project-save-button {
						&:active{
							filter: invert(1);
							background: black;
						}
						.icon {
							width: 2rem;
						}
						margin-right: 1.5rem;
						cursor: pointer;
						justify-content: flex-end;
						display: flex;
						flex-direction: row;
						align-items: center;
						height: 2rem;
						max-width: 30rem;
						width: 100%;
						* {
							font-size: 1.0rem;
						}
						// &.date{
						// 	* {
						// 		font-size: 0.6rem;
						// 	}
						// }
					}
					#project-save-button :global(svg) {
						// margin-right: 0rem;
						aspect-ratio: 1/1;
						fill: white;
					}
				}
			}
		}
	}
	.knob-container {
		box-sizing: border-box;
		-webkit-box-sizing: border-box;
		/* width: 40px;
    height: 40px; */
		aspect-ratio: 1/1;
		max-height: 50%;
		height: 100%;
		display: flex;
		justify-content: center;
		align-items: center;
		margin-right: 1rem;
		pointer-events: all;
		user-select: none;
		margin-bottom: auto;
		margin-top: auto;
    margin-right: 0rem;
	}

	.knob {
		&:active {
			filter: invert(1);
			background: black;
		}
		cursor: pointer;
		display: block;
		aspect-ratio: 1/1;
		height: 100%;
		/* height: 80%; */
		padding: 0;
		color: var(--text-color);
		transform-origin: 50% 50%;
	}

	.knob :global(svg) {
		fill: white;
		width: 100%;
		height: 100%;
	}
</style>


		<!-- const dataURLToBlob = async (dataURL) => {
			let BASE64_MARKER = ';base64,';

			if (dataURL.indexOf(BASE64_MARKER) == -1) {
					let parts = dataURL.split(',');
					let contentType = parts[0].split(':')[1];
					let raw = decodeURIComponent(parts[1]);

					return new Blob([raw], {type: contentType});
			}

			let parts = dataURL.split(BASE64_MARKER);
			let contentType = parts[0].split(':')[1];
			let raw = window.atob(parts[1]);
			let rawLength = raw.length;

			let uInt8Array = new Uint8Array(rawLength);

			for (let i = 0; i < rawLength; ++i) {
					uInt8Array[i] = raw.charCodeAt(i);
			}
			// TODO: REPLACE WITH THIS??
			const blob = await (await fetch(dataURL)).blob(); 
			return blob
			// add connect-src data: to your Content-Security-Policy

			return new Blob([uInt8Array], {type: contentType});
		} -->