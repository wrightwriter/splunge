<svelte:options accessors />

<div class="knob-container-container" style="border: none;" >
	{#if !dropdown_toggled}
	<div style="border: none;">Blend space</div>
	<div style="border: 1px solid white;" class="space" on:click={()=>{
		dropdown_toggled = true
	}}>{BlendingColourSpace[selected_colour_space]}</div>
	{/if}
	{#if dropdown_toggled}
		<div id="dropdown">
			{#each Object.keys(BlendingColourSpace) as colour_space, i}
				{#if isNaN(BlendingColourSpace[colour_space])}
					<div role="button" class="space" tabindex="0" on:click={()=>{
						// @ts-ignore
						selected_colour_space = colour_space
						dropdown_toggled = false
					}} style= {
						// @ts-ignore
						colour_space  === selected_colour_space ?  "background: black; filter: invert(1);" : ""
					}>
						{BlendingColourSpace[colour_space]}
					</div>
				{/if}
			{/each}
		</div>
	{/if}
</div>

<script lang="ts">
	import {BlendingColourSpace, BrushType} from 'brush_stroke'

	export let selected_colour_space: BlendingColourSpace

	let dropdown_toggled = false
</script>

<style lang="scss">
	.space {
		&:active {
			filter: invert(1);
			background: black;
		}
	}
	.knob-container-container {
		z-index: 0 !important;
		margin-bottom: auto;
		margin-top: auto;
		margin-right: 1.5rem;
		display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: flex-start;
		pointer-events: all;
		user-select: none;
		cursor: pointer;
		// min-width: 7rem;
		width: 8rem;
		height: 100%;
		min-height: 6rem;

		border: 1px solid white;
		// min-width: 0px;
		#dropdown {
			display: flex;
			flex-direction: column;
			position: static;
			height: unset;
			background: black;
			> div {
				border: 1px solid white;
				z-index: 10000000;
				width: 100%;
			}
		}
	}
</style>
