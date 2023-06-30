<svelte:options accessors />

<div class="knob-container-container">
	{#each brush_types as brush_type, i}
		<div
			class="title menu-toggle"
			bind:this={elements[i]}
			role="button"
			tabindex="0"
			on:click={() => {
				curr_brush.selected_brush_type = BrushType[brush_type]
				let k = 0
				for (let element of elements) {
					if (k === i) {
						element.style.outline = '1px solid white'
						element.style.outlineOffset = '0rem'
					} else {
						element.style.outline = '0px solid white'
					}
					k++
				}
			}}
			style="cursor: pointer;">
			{@html i === 0 ? brush_blobs_icon : i === 1 ? brush_long_icon : brush_triangles_icon}
		</div>
	{/each}
</div>

<script lang="ts">
	import {BrushPreset, BrushType} from 'brush_stroke'
	import {onMount} from 'svelte'

	// @ts-ignore
	import brush_blobs_icon from '/../public/brush-blobs.svg'
	// @ts-ignore
	import brush_long_icon from '/../public/brush-long.svg'
	// @ts-ignore
	import brush_triangles_icon from '/../public/brush-triangles.svg'

	export let curr_brush: BrushPreset
	let selected_brush_type: BrushType

	let elements: HTMLDivElement[] = []
	let brush_types: string[] = []
	for (let type of Object.keys(BrushType).filter((v) => isNaN(Number(v)))) {
		brush_types.push(type)
		elements.length++
	}

	const update_styles = () => {
		let k = 0
		try {
			for (let element of elements) {
				let brush_type_int = BrushType[brush_types[k]]
				if (brush_type_int === selected_brush_type) {
					element.style.outline = '1px solid white'
					element.style.outlineOffset = '0.1rem'
				} else {
					element.style.outline = '0px solid white'
				}
				k++
			}
		} catch (_) {}
	}

	$: {
		selected_brush_type = curr_brush.selected_brush_type
		update_styles()
	}

	onMount(() => {
		update_styles()
	})
</script>

<style lang="scss">
	.knob-container-container {
    aspect-ratio: unset;
    display: grid;
    grid-template-columns: 1fr 1fr;
		grid-column-gap: 0.4rem;
		grid-row-gap: 0.4rem;

    pointer-events: all;
    user-select: none;
    cursor: pointer;

    overflow: visible;
    height: 100%;
    width: 4rem;
    max-width: unset;
		padding: 0.2rem;
    >.title.menu-toggle {
      :global(svg) {
        fill: white;
        &:active {
          filter: invert(1);
          background: black;
        }
				height: 100%;
				width: 100%;
      }
      user-select: none;
      width: 100%;
      height: 100%;
    }
	}
</style>
