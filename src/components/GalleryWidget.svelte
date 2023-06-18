<svelte:options accessors />

<div class="knob-container">
	<!-- svelte-ignore a11y-click-events-have-key-events -->
	<div
		class="knob"
		on:click={() => {
			gallery_open = !gallery_open
      canvas_image = get_current_canvas_as_image()
      canvas_image_src = canvas_image.src
      // console.log(canvas_image_elem)
      console.log(canvas_image.src)
		}}> 
		{@html solveIcon}
	</div>
	{#if gallery_open}
		<div id="gallery-container-outer">
			<div id="gallery-container">
				<div id="top-bar">
					<div>Project</div>
					<!-- svelte-ignore a11y-click-events-have-key-events -->
					<div
						id="back-button"
						on:click={() => {
							gallery_open = !gallery_open
						}}>
						{@html forbidIcon}
					</div>
				</div>
        <img src="{canvas_image_src}" id="canvas-preview-img" alt="" />
				<div id="gallery-elements">
					{#each gallery_elements as element, i}
						<div id="element">
							{element.name}
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
	import forbidIcon from '/../public/forbid.svg'
	import getToken from 'getToken'
	import {Dropbox} from 'dropbox'
	import type {Project} from 'stuff'

	let gallery_open = false

  let canvas_image: HTMLImageElement | undefined = undefined
  let canvas_image_src: string = ""
  
	export let current_project: Project
	export let get_current_canvas_as_image: () => HTMLImageElement

	class Element {
		name: string
		constructor(name: string) {
			this.name = name
		}
	}

	let gallery_elements: Element[] = []

	var CLIENT_ID = 'jxpyhv2cqozub0c'
	// Parses the url and gets the access token if it is in the urls hash
	function getAccessTokenFromUrl() {
		//  return utils.parseQueryString(window.location.hash).access_token;
	}

	// If the user was just redirected from authenticating, the urls hash will
	// contain the access token.
	function isAuthenticated() {
		const token = getToken
		// return !!getAccessTokenFromUrl();
		return token
	}

	// Render a list of items to #files
	// function renderItems(items) {
	//   var filesContainer = document.getElementById('files');
	//   items.forEach(function(item) {
	//     var li = document.createElement('li');
	//     li.innerHTML = item.name;
	//     filesContainer.appendChild(li);
	//   });
	// }

	// This example keeps both the authenticate and non-authenticated setions
	// in the DOM and uses this function to show/hide the correct section.
	// function showPageSection(elementId) {
	//   document.getElementById(elementId).style.display = 'block';
	// }
  let dbx = new Dropbox({accessToken: isAuthenticated()})

  const refetch_canvases = ()=>{
		dbx
			.filesListFolder({path: ''})
			.then(function (response) {
				console.log(response)
				gallery_elements = []
				for (let element of response.result.entries) {
					gallery_elements.push(new Element(element.name))
				}
			})
			.catch(function (error) {
				console.error(error.error || error)
			})

  }

	if (isAuthenticated()) {
    refetch_canvases()
		dbx
			.filesUpload({
				path: '/amog.js',
				contents: 'asdgmo:125125',
			})
			.then((r) => {
				console.log(r)
			})
		// showPageSection('authed-section');

		// Create an instance of Dropbox with the access token and use it to
		// fetch and render the files in the users root directory.
		// var dbx = new Dropbox.Dropbox({ accessToken: getAccessTokenFromUrl() });
		// dbx.filesListFolder({path: ''})
		//   .then(function(response) {
		//     renderItems(response.result.entries);
		//   })
		//   .catch(function(error) {
		//     console.error(error.error || error);
		//   });
	} else {
		// showPageSection('pre-auth-section');

		// Set the login anchors href using dbx.getAuthenticationUrl()
		let dbx = new Dropbox({clientId: CLIENT_ID})

		// var authUrl = dbx.auth.getAuthenticationUrl('http://localhost:8080/auth')
		//   .then((authUrl) => {
		//     document.getElementById('authlink').href = authUrl;
		//   })
	}
  
</script>

<style>
	* {
		user-select: none;
		-webkit-tap-highlight-color: transparent;
	}
  #canvas-preview-img{
    max-width: 12rem;
    width: 12rem;
    height: 12rem;
    /* max-width: 5rem; */
    /* aspect-ratio:unset; */
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
	}
	#gallery-container {
		margin-top: 1rem;
		overflow: scroll;
		height: 100%;
		max-width: 40rem;
		width: 100%;
		display: flex;
		flex-direction: column;
		align-items: center;
	}
	#back-button > :global(svg) {
		fill: white;
		width: 3rem;
		aspect-ratio: 1/1;
		cursor: pointer;
	}
	#top-bar {
		width: 100%;
		font-size: 2rem;
		display: flex;
		justify-content: space-around;
	}
	#gallery-elements {
		display: flex;
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
		margin-bottom: 1.25rem;
		margin-right: 1rem;
		pointer-events: all;
		user-select: none;
	}

	.knob {
		cursor: pointer;
		display: block;
		aspect-ratio: 1/1;
		height: 100%;
		/* height: 80%; */
		padding: 0;
		border-radius: 50%;
		color: var(--text-color);
		transform-origin: 50% 50%;
	}

	.knob :global(svg) {
		fill: white;
		width: 100%;
		height: 100%;
	}
</style>
