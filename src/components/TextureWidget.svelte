<svelte:options accessors />

<div class="knob-container-container">
	<img
		src={selected_brush_texture ? selected_brush_texture.path : ''}
		on:click={() => {
			dropdown_toggled = !dropdown_toggled
		}} />
	{#if dropdown_toggled}
		<div id="dropdown">
			{#each brush_textures as texture, i}
				{#if texture !== selected_brush_texture}
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
	import type {BrushTexture} from 'stuff'

	export let brush_textures: Array<BrushTexture>
	export let selected_brush_texture: BrushTexture

	let dropdown_toggled = false

</script>

<style lang="scss">
	img {
		&:active {
			filter: invert(1);
			background: black;
		}
		// pointer-events: none;
	}
	.knob-container-container {
		z-index: 99;
		aspect-ratio: 1/1;
		// max-height: 50%;
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
