<svelte:options accessors />

<div class="knob-container-container">
	<div class="title">
		Texture
	</div>
	<div class="img-container">
	<img
		src={selected_brush_texture ? selected_brush_texture.path : ''}
		on:click={() => {
			dropdown_toggled = !dropdown_toggled
		}} />
	</div>
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
		// margin-top: auto;
		margin-right: 1.5rem;
		display: block;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		pointer-events: all;
		user-select: none;
		cursor: pointer;
		min-width: 7rem;

		height: 100%;
		
    min-height: 4rem;
    margin-top: 0;
		.title{
			font-size: 0.8rem;
		}
		#dropdown {
			display: flex;
			flex-direction: column;
			position: static;
			height: unset;
			background: black;
			// top: 88px;
			img {
				z-index: 10000000;
				aspect-ratio: 1/1;
				width: 100%;
				height: unset;
				// position: static;
			}
		}
		.img-container{
			overflow: hidden;
			border: 1px solid white;
			aspect-ratio: 1/1;
			height: 100%;
			width: unset;
			img {
				aspect-ratio: 1/1;
				width: 100%;
				height: unset;
			}
			
		}
	}
</style>
