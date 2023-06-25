<svelte:options accessors />

<div class="knob-container-container">
	<!-- svelte-ignore a11y-missing-attribute -->
	<!-- svelte-ignore a11y-click-events-have-key-events -->
	<div>{BlendingColourSpace[selected_colour_space]}</div>
	{#if dropdown_toggled}
		<div id="dropdown">
			{#each Object.keys(BlendingColourSpace) as colour_space, i}
				{#if BlendingColourSpace[colour_space]  !== selected_colour_space && isNaN(BlendingColourSpace[colour_space])}
					<!-- svelte-ignore a11y-missing-attribute -->
					<!-- svelte-ignore a11y-click-events-have-key-events -->
					<div on:click={()=>{
						// @ts-ignore
						selected_colour_space = colour_space
					}}>
						{BlendingColourSpace[colour_space]}
					</div>
					<!-- <img
						src={texture.path}
						on:click={() => {
							selected_brush_texture = texture
							dropdown_toggled = false
						}} /> -->
				{/if}
			{/each}
		</div>
	{/if}
</div>

<script lang="ts">
	import {BlendingColourSpace, BrushType} from 'brush_stroke'
	import type {BrushTexture} from 'stuff'
	import {onMount} from 'svelte'

	// export let brush_textures: Array<BrushTexture>
	export let selected_colour_space: BlendingColourSpace

	let dropdown_toggled = true

	onMount(() => {
	})
</script>

<style lang="scss">
	* {
		user-select: none;
		-webkit-tap-highlight-color: transparent;
	}
	div {
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
		#dropdown {
			display: flex;
			flex-direction: column;
			position: static;
			height: unset;
			background: black;
			// top: 88px;
			> div {
				z-index: 10000000;
				// aspect-ratio: 1/1;
				width: 100%;
				// position: static;
			}
		}
		> div {
		}
	}
</style>
