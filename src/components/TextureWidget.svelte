<svelte:options accessors />

<div class="knob-container-container">
	<!-- svelte-ignore a11y-missing-attribute -->
	<!-- svelte-ignore a11y-click-events-have-key-events -->
	<img
		src={selected_brush_texture ? selected_brush_texture.path : ''}
		on:click={() => {
			dropdown_toggled = !dropdown_toggled
		}} />
	{#if dropdown_toggled}
		<div id="dropdown">
			{#each brush_textures as texture, i}
				{#if texture !== selected_brush_texture}
					<!-- svelte-ignore a11y-missing-attribute -->
					<!-- svelte-ignore a11y-click-events-have-key-events -->
					<img
						src={texture.path}
						on:click={() => {
							selected_brush_texture = texture
							dropdown_toggled = false
						}} />
				{/if}
			{/each}
		</div>
	{/if}
</div>

<script lang="ts">
	import {BrushType} from 'brush_stroke'
	import type {BrushTexture} from 'stuff'
	import {onMount} from 'svelte'

	export let brush_textures: Array<BrushTexture>
	export let selected_brush_texture: BrushTexture

	let dropdown_toggled = false
	// let elements: HTMLDivElement[] = []
	// let brush_types: string[] = [ ]
	// for(let type of Object.keys(BrushType).filter((v) => isNaN(Number(v)))){
	//   brush_types.push(type)
	//   elements.length++
	// }

	onMount(() => {
		// let k = 0
		// for(let element of elements){
		//   let brush_type = brush_types[k]
		//   let brush_type_int = BrushType[brush_types[k]]
		//   if(brush_type_int === selected_brush_type){
		//     element.style.outline = '1px solid white'
		//     element.style.outlineOffset = '0.1rem'
		//   } else {
		//     element.style.outline = '0px solid white'
		//   }
		//   k++
		// }
	})
</script>

<style lang="scss">
	* {
		user-select: none;
		-webkit-tap-highlight-color: transparent;
	}
	img {
		&:active {
			filter: invert(1);
			background: black;
		}
		// pointer-events: none;
	}
	.knob-container-container {
		z-index: 9999999999999;
		aspect-ratio: 1/1;
		max-height: 50%;
		margin-bottom: auto;
		margin-top: auto;
		margin-right: 1.5rem;
		display: block;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		pointer-events: all;
		user-select: none;
		cursor: pointer;
		min-width: 7rem;

		border: 1px solid white;
		min-width: 0px;
		aspect-ratio: 1/1;
		height: 100%;
		#dropdown {
			display: flex;
			flex-direction: column;
			position: static;
			height: unset;
			background: black;
			// top: 88px;
			> img {
				z-index: 10000000;
				aspect-ratio: 1/1;
				width: 100%;
				// position: static;
			}
		}
		> img {
			aspect-ratio: 1/1;
			height: 100%;
		}
	}
</style>
