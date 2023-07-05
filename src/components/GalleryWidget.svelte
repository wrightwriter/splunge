<svelte:options accessors />

<div class="knob-container">
	<div
		class="knob"
		role="button"
		tabindex="0"
		on:click={async () => {
			gallery_open.set(true)
			canvases_finished_loading = false
			let [_canvas_image, blob] = await (get_current_canvas_as_image())
			canvas_image = _canvas_image
			canvas_image_src = canvas_image.src
			canvas_image_blob = blob

			if(current_project.saved){
				await window.sketch_db.table("image").put({id: current_project.id, data: canvas_image_src})
			}
			refetch_canvases()
			canvases_finished_loading = true

			console.log(canvas_image.src)
		}}>
		{@html solveIcon}
	</div>
	{#if $gallery_open}
		<div id="gallery-container-outer" in:fade={{duration: 200}}>
			<div id="gallery-container">
				<div id="top-bar">
					<div id="project-title">Project</div>
					<div
						id="back-button"
						role="button"
						tabindex="0"
						on:click={() => {
							gallery_open.set(false)
						}}>
						{@html forbidIcon}
					</div>
				</div>
				<div id="current-project">
					<img src={canvas_image_src} id="canvas-preview-img" alt="" />
					<div id="project-options">
						<div id="project-save-button" role="button" tabindex="0" on:click={record_video}>
							<div id="project-save-button-title">Export to video</div>
							<div class="icon" style="transform: translate(0px,0.2rem);">
								{@html captureIcon}
							</div>
						</div>
						<div id="project-save-button" role="button" tabindex="0" on:click={save_to_dropbox}>
							<div id="project-save-button-title">Save to storage</div>
							<div class="icon" style="transform: translate(0px,0.2rem);">
								{@html captureIcon}
							</div>
						</div>
						<!-- <div id="project-save-button" on:click={()=>{
							localStorage.setItem('project', JSON.stringify(project))
						}}>
							<div id="project-save-button-title">Save to localStorage</div>
							<div class="icon" style="transform: translate(0px,0.2rem);">
								{@html captureIcon}
							</div>
						</div> -->
						<div id="project-save-button" on:click={download_image} role="button" tabindex="0">
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
					<div
						id="button"
						on:click={async () => {
							let safe = await is_safe_to_switch_to_new_project()
							safe = safe ? safe : confirm('Are you sure you want to create another project? This one is not saved.')
							if (safe) {
								new_project()
								// gallery_open = false
								gallery_open.set(false)
							}
						}}
						role="button"
						tabindex="0">
						<div>New file</div>
						{@html launchIcon}
					</div>
					<div
						id="button"
						on:click={async () => {
							size_modal_opened = true
							resize_widget_canvas_size[0] = current_project.canvasRes[0]
							resize_widget_canvas_size[1] = current_project.canvasRes[1]
						}}
						role="button"
						tabindex="0">
						<div>Resize</div>
						{@html resizeIcon}
						<!-- {@html launchIcon} -->
					</div>
					<div draggable="false"  id="size-modal" style={size_modal_opened ? '' : 'display: none;'}>
						<div
							id="back-button"
							role="button"
							tabindex="0"
							on:click={() => {
								size_modal_opened = false
							}}
							style="margin-bottom: 0.45rem;">
							{@html forbidIcon}
						</div>
						<div style="margin-bottom: 1rem;">Resize canvas</div>
						<div draggable="false" style="margin-bottom: 1rem;">
							{floor(resize_widget_canvas_size[0])} x {floor(resize_widget_canvas_size[1])}
						</div>
						<div
							style={`
							background: white;
							width: 10rem;
							aspect-ratio: 1/${resize_widget_canvas_size[1] / resize_widget_canvas_size[0]}
						`}
							on:pointerdown={resize_widget_pointer_down} />
						<div
							role="button"
							tabindex="0"
							id="back-button"
							class="ok-button"
							on:click={() => {
								resize_widget_canvas_size[0] = floor(resize_widget_canvas_size[0])
								resize_widget_canvas_size[1] = floor(resize_widget_canvas_size[1])
								resize_project(resize_widget_canvas_size)
								size_modal_opened = false
								// gallery_open = false
								gallery_open.set(false)
							}}
							style="margin-top: 1.14rem;">
							{@html okIcon}
						</div>
					</div>
				</div>
				<div id="gallery-elements">
					{#if canvases_finished_loading}
						{#each gallery_elements as element, i}
							<div
								id="element"
								on:click={async () => {
									let safe = await is_safe_to_switch_to_new_project()
									safe = safe ? safe : confirm('Are you sure you want to switch to another project? This one is not saved.')
									if (safe) {
										let sketches = (await window.sketch_db.table("sketch").toArray())
										for(let e of sketches){
											let s = e.data
											if(s.id === Number(element.name)){
												// @ts-ignore
												load_project(s)
												gallery_open.set(false)
												return
											}
										}
									}
								}}
								role="button"
								tabindex="0"
								style={Number(element.name) === current_project.id ? 'border: 0.1rem solid white;' : ''}>
								<div id="element-name">
									{format_time(element.name)}
								</div>
								{#if element.image_src}
									<img draggable="false" src={element.image_src} id="canvas-preview-img" alt="" />
								{/if}
							</div>
						{/each}
					{/if}
				</div>
			</div>
		</div>
	{/if}
</div>

<script lang="ts">
	import solveIcon from '/../public/solve.svg'
	import launchIcon from '/../public/launch.svg'
	import resizeIcon from '/../public/resize.svg'
	import forbidIcon from '/../public/forbid.svg'
	import okIcon from '/../public/ok.svg'
	import captureIcon from '/../public/capture.svg'
	import downloadIcon from '/../public/download.svg'
	import timeIcon from '/../public/time.svg'

	import type {DexieImageEntry, DexieSketchEntry, Project} from 'stuff'
	import {onMount} from 'svelte'
	import {floating_modal_message} from 'store'
	import {gallery_open} from 'store'

	import {fade} from 'svelte/transition'
	import {floor} from 'wmath'

	export let current_project: Project
	export let is_temp_project: boolean
	export let get_current_canvas_as_image: () => Promise<[HTMLImageElement, Blob]>
	let canvases_finished_loading = true
	export let resize_project: (new_size: number[]) => void
	export let new_project: () => void
	export let load_project: (project: Project) => void
	export let project_has_been_modified: boolean

	const format_time = (t: number | string): string => {
		return new Date(Number(t))
			.toLocaleString('en-GB', {
				hourCycle: 'h23',
				day: '2-digit',
				month: '2-digit',
				year: 'numeric',
				hour: '2-digit',
				minute: '2-digit',
			})
			.replace(',', '')
	}

	// let gallery_open = false
	let size_modal_opened = false

	let canvas_image: HTMLImageElement | undefined = undefined
	let canvas_image_blob: Blob | undefined = undefined
	let canvas_image_src: string = ''

	export let recording_pending: boolean
	const resize_widget_pixel_range = 200
	const min = 0
	const max = 4

	let resize_widget_canvas_size = [0, 0]
	let resize_widget_start_y = 0
	let resize_wdiget_start_value = [0, 0]
	let resize_widget_start_x = 0

	$: valueRange = max - min

	class Element {
		name: string
		image_src: string
		constructor(name: string, image_src: string) {
			this.name = name
			this.image_src = image_src
		}
	}


	let gallery_elements: Element[] = []



	export const is_safe_to_switch_to_new_project = async (): Promise<boolean> => {
		let project_is_saved_to_dropbox = false

		let sketches = (await window.sketch_db.table("sketch").toArray())
		for(let e of sketches){
			let s = e.data
			if(s.id === current_project.id){
				project_is_saved_to_dropbox = true
				break
			}
		}

		if (project_has_been_modified || !project_is_saved_to_dropbox) {
			return false
		} else {
			return true
		}
	}

	const download_image = async () => {
		const link = document.createElement('a')
		link.href = (canvas_image as HTMLImageElement).src
		link.download = current_project.id + '.png'
		link.click()
	}


	const record_video = async () => {
		const createMediaRecorder = (canvas: HTMLCanvasElement) => {
			let options: any = {audioBitsPerSecond: 0, videoBitsPerSecond: 8000000}

			const types = ['video/webm;codecs=h264', 'video/webm;codecs=vp9', 'video/webm;codecs=vp8']

			for (let type of types) {
				if (MediaRecorder.isTypeSupported(type)) {
					options.mimeType = type
				}
			}
			if (!options.mimeType) {
				options.mimeType = 'video/webm'
			}

			const mediaRecorder = new MediaRecorder(canvas.captureStream(), options)
			const chunks = []
			// mediaRecorder.set

			mediaRecorder.ondataavailable = function (e) {
				if (e.data.size > 0) {
					// @ts-ignore
					chunks.push(e.data)
				}
			}

			mediaRecorder.onstop = function () {
				let blob = new Blob(chunks, {type: 'video/mp4'})
				chunks.length = 0
				const url = window.URL.createObjectURL(blob)
				let a = document.createElement('a')
				document.body.appendChild(a)
				// @ts-ignore
				a.style = 'display: none'
				a.href = url
				a.download = 'drawing.mp4'
				a.click()
				window.URL.revokeObjectURL(url)
			}

			return mediaRecorder
		}

		// @ts-ignore

		if (!window.media_recorder) {
			window.media_recorder = createMediaRecorder(document.querySelector('canvas') as HTMLCanvasElement)
		}

		if (window.media_recorder.state === 'inactive') {
			window.media_recorder.start()
		}
		recording_pending = true
	}
	const refetch_canvases = async () => {
		gallery_elements = []
		const blobToDataURL = (blob: Blob): Promise<string> => {
			return new Promise<string>((resolve, reject) => {
				const reader = new FileReader()
				reader.onload = (_e) => resolve(reader.result as string)
				reader.onerror = (_e) => reject(reader.error)
				reader.onabort = (_e) => reject(new Error('Read aborted'))
				reader.readAsDataURL(blob)
			})
		}

		// await curr_canvas_as_image_promise
		let sketches: DexieSketchEntry[] = (await window.sketch_db.table("sketch").toArray())
		let images: DexieImageEntry[] = (await window.sketch_db.table("image").toArray())

		for (let element of sketches) {
			let sketch = element.data
			let proj_name = sketch.id

			let image: Blob | undefined = undefined;
			
			for(let i of images){
				if(i.id === proj_name){	
					image = i.data
				}
			}

			let el
			if(image){
				// @ts-ignore
				el = new Element(proj_name.toString(), image)
			} else {
				// @ts-ignore
				el = new Element(proj_name.toString(), undefined)
			}
			gallery_elements = [...gallery_elements, el]
		}
	}
	const save_to_dropbox = async () => {
		floating_modal_message.set('Starting upload to dropbox.')

		current_project.saved = true
		let new_data = { id: current_project.id, data: current_project }
		// if(!s){
		// 	await window.sketch_db.table("sketch").add(new_data)
		// } else {
		// 	await window.sketch_db.table("sketch").update(new_data.id, new_data)
		// }
		await window.sketch_db.table("sketch").put(new_data, new_data.id)


		await window.sketch_db.table("image").put({id: current_project.id, data: canvas_image_src})

		floating_modal_message.set('Upload to dropbox succesful.')
		project_has_been_modified = false
		is_temp_project = false
		await refetch_canvases()
	}


	function resize_widget_pointer_move({clientX, clientY}) {
		let valueDiffY = (valueRange * (resize_widget_start_y - clientY)) / resize_widget_pixel_range
		let valueDiffX = (valueRange * (resize_widget_start_x - clientX)) / resize_widget_pixel_range

		resize_widget_canvas_size[0] = resize_wdiget_start_value[0] - valueDiffX * 1000
		resize_widget_canvas_size[1] = resize_wdiget_start_value[1] + valueDiffY * 1000
		// brush_sz[0] = clamp(startValue[0] - valueDiffX, min, max)
		// brush_sz[1] = clamp(startValue[1] + valueDiffY, min, max)
	}

	function resize_widget_pointer_down(e: PointerEvent) {
		let {clientX, clientY} = e
		console.log('down')

		resize_widget_start_y = clientY
		resize_widget_start_x = clientX
		resize_wdiget_start_value = [...resize_widget_canvas_size]

		window.addEventListener('pointermove', resize_widget_pointer_move)
		window.addEventListener('pointerup', resize_widget_pointer_up)
		e.stopPropagation()
	}

	function resize_widget_pointer_up() {
		window.removeEventListener('pointermove', resize_widget_pointer_move)
		window.removeEventListener('pointerup', resize_widget_pointer_up)
	}

	onMount(async () => {
		// refetch_canvases()
	})
</script>

<style lang="scss">
	#canvas-preview-img {
		/* max-width: 12rem; */
		height: 12rem;
		/* max-width: 5rem; */
		/* aspect-ratio:unset; */
	}
	.hide {
		display: none;
	}
	:global(#gallery-container::-webkit-scrollbar) {
		background: black;
	}
	:global(#gallery-container::-webkit-scrollbar-track) {
		background: grey;
	}
	:global(#gallery-container::-webkit-scrollbar-thumb) {
		background: white;
	}
	#db-login-button {
		font-size: 3rem;
		border-radius: 0px;
		margin-bottom: 2rem;
		cursor: pointer;
		&:active {
			filter: invert(1);
		}
	}
	#size-modal {
		position: fixed;
		display: flex;
		flex-direction: column;
		align-items: center;
		width: 100vw;
		height: 100vh;
		left: 0;
		top: 0;
		z-index: 101;
		background: black;
		justify-content: center;
		touch-action: none;
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
					:global(svg) {
						fill: white;
					}
				}
				#button {
					display: flex;
					align-items: center;
					cursor: pointer;
					padding: 0rem 0.2rem;
					height: 100%;
					:global(svg) {
						height: 100%;
					}
					&:active {
						filter: invert(1);
						background: black;
					}
				}
				align-items: center;
				margin-bottom: 1rem;
				width: 100%;
				font-size: 2rem;
				display: flex;
				justify-content: space-between;
			}
			.ok-button :global(svg) {
				transform: scale(0.96) !important;
			}
			#back-button > :global(svg) {
				&:active {
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
				#element {
					cursor: pointer;
					// pointer-events: none;
					user-select: none;
					#element-name {
						margin-bottom: 0.5rem;
					}
					&:active {
						background: white;
						* {
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
						&:active {
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
							font-size: 1rem;
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
	// @import "/../styles/icon.scss" scoped;
	.knob-container {
		box-sizing: border-box;
		-webkit-box-sizing: border-box;
		/* width: 40px;
    height: 40px; */
		aspect-ratio: 1/1;
		// max-height: 50%;
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
