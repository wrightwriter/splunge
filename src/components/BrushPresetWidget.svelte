<svelte:options accessors />

<div class="knob-container-container">
	{#each brush_presets as preset, i}
		<div
			class="title menu-toggle"
			bind:this={elements[i]}
			role="button"
			tabindex="0"
			on:click={() => {
				selected_brush_preset = preset
				let k = 0
				for (let element of elements) {
					if (k === i) {
						element.style.outline = '1px solid white'
            element.style.zIndex = '1'
						element.style.outlineOffset = '0.1rem'
					} else {
						element.style.outline = disabled_outline
            element.style.zIndex = '0'
						element.style.outlineOffset = disabled_outline_offs
					}
					k++
				}
			}}
			style="cursor: pointer;">
			<div>{i.toString()}</div>
      
			{@html 
        preset.selected_brush_type === BrushType.Blobs
				? brush_blobs_icon
				: preset.selected_brush_type === BrushType.Long
				? brush_long_icon
				: brush_triangles_icon + ($trigger_brush_preset_redraw ? "" : "")
      }
		</div>
	{/each}
</div>

<script lang="ts">
	import {BrushPreset, BrushType} from 'brush_stroke'
	import {onMount} from 'svelte'

	import brush_blobs_icon from '/../public/brush-blobs.svg'
	import brush_long_icon from '/../public/brush-long.svg'
	import brush_triangles_icon from '/../public/brush-triangles.svg'
	import { trigger_brush_preset_redraw } from 'store'

	export let brush_presets: BrushPreset[]
	export let selected_brush_preset: BrushPreset
  
  const disabled_outline_offs = '-0.3rem'
  const disabled_outline = '0.3rem solid black'

  const enabled_outline_offs = '0.1rem' 
  const enabled_outline ='1px solid white' 


	let elements: HTMLDivElement[] = []
	for (let preset of brush_presets) {
		elements.length++
	}

	onMount(() => {
		let k = 0
		for (let element of elements) {
			if (selected_brush_preset === brush_presets[k]) {
				element.style.outline = enabled_outline
        element.style.zIndex = '1'
				element.style.outlineOffset = enabled_outline_offs
			} else {
				element.style.outline = disabled_outline
        element.style.zIndex = '0'
				element.style.outlineOffset = disabled_outline_offs
			}
			k++
		}
	})
</script>

<style lang="scss">
	.knob-container-container {
		aspect-ratio: unset;
		display: grid;
		grid-template-columns: 1fr 1fr 1fr;
		// grid-column-gap: 0.4rem;
		// grid-row-gap: 0.4rem;

		pointer-events: all;
		user-select: none;
		cursor: pointer;

		overflow: visible;
		height: 100%;
		width: 5rem;
		max-width: unset;
		padding: 0.2rem;

    overflow: hidden;
    max-height: 6rem !important;
		* {
			color: black;
		}

		:global(svg) {
			fill: black;
			&:active {
				// background: black;
        // fill: white;
			}
			aspect-ratio: 1/1;
			// overflow: hidden;
			// height: 100%;
			width: 100%;
		}
		>.title.menu-toggle {
      &:active {
        filter: invert(1);
      }
			background: white;
      // padding: 0.1rem;
      // border: 0.3rem solid black;
      // outline: 0.3rem solid black;
			color: black;
			width: 100%;
			height: 100%;
		}
		>.title {
			padding: 0rem;
			font-size: 0.8rem !important;
			margin: 0rem;
			color: white;
			text-align: center;
			font-weight: bolder;
			user-select: none;
		}
	}
</style>
