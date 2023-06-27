<svelte:options accessors />

<script lang="ts">
	import { mod } from "@0b5vr/experimental"
	import chroma from "chroma-js"

	export let colour: Array<number>;
	// export let colour_r: number;
	// export let colour_g: number;
	// export let colour_b: number;
	// export let just_finished_pick: boolean
	
	// $: valueRange = max - min;
	// $: rotation = startRotation + (value - min) / valueRange * rotRange;
  let container


  const re_render_colour = (colour_r, colour_g, colour_b)=>{
    if(container){
      container.style.setProperty('--color', `rgba(${
      255 * Math.pow(colour_r, 0.45454545454545454545)}, ${
      255 * Math.pow(colour_g, 0.45454545454545454545)}, ${
      255 * Math.pow(colour_b, 0.45454545454545454545)}, ${
      255 * Math.pow(1.0, 0.45454545454545454545)})`)
    }
  }

	export let update_display = (colour_r, colour_g, colour_b)=>{re_render_colour(colour_r, colour_g, colour_b)}
  
	// $: col = `rgba(${colour[0]}, ${colour[1]}, ${colour[2]}, ${colour[3]})`;
	$: re_render_colour(colour[0], colour[1], colour[2]);
	// $: if(update_display) {re_render_colour(colour_r, colour_g, colour_b); update_display = false}

	const pixelRange = 200
	let value = [0, 0]
	const min = 0
	const max = 4

	export let dragging: boolean = false
	export let stopped_dragging: boolean = false

	let startY = 0,
		startValue = [0, 0],
		startX = 0

	$: valueRange = max - min
	// $: rotation = startRotation + (value - min) / valueRange * rotRange;

	function clamp(num, min, max) {
		return Math.max(min, Math.min(num, max))
	}

	function pointerMove({clientX, clientY}) {
		const valueDiffY = (valueRange * (startY - clientY)) / pixelRange
		const  valueDiffX = (valueRange * (startX - clientX)) / pixelRange

    const chroma_gl = (col: number[]) => {
      return chroma.gl(col[0], col[1], col[2])
    }
    const chroma_oklch = (col: number[]) => {
      return chroma.oklch(col[0], col[1], col[2])
    }

    
    let col = chroma_gl(startValue).oklch()

    col[0] += valueDiffY*0.3
    col[2] += valueDiffX*360*0.3
    col[0] = clamp(col[0], 0, 1)
    col[1] = clamp(col[1], 0, 1)
    col[2] = mod(col[2], 360)

    // @ts-ignore
    col = chroma_oklch(col).gl()
    colour[0] = col[0]
    colour[1] = col[1]
    colour[2] = col[2]
	}

	function pointerDown(e: PointerEvent) {
		dragging = true
		const {clientX, clientY} = e
		startY = clientY
		startX = clientX
		startValue = [colour[0], colour[1], colour[2], 1]

		window.addEventListener('pointermove', pointerMove)
		window.addEventListener('pointerup', pointerUp)
		e.stopPropagation()
	}

	function pointerUp() {
		dragging = false
		stopped_dragging = true
		console.log('up')
		window.removeEventListener('pointermove', pointerMove)
		window.removeEventListener('pointerup', pointerUp)
	}
	
</script>

<div draggable="false" class='knob-container' bind:this={container} on:pointerdown={pointerDown} >
</div>

<style>
  .knob-container{
    box-sizing: border-box;
    -webkit-box-sizing: border-box;
    &:hover{
      cursor: pointer;
    }
    margin-right: 0.5rem;
    aspect-ratio: 2/1;
    max-height: 100%;
    height: 100%;
    display: flex;
    background-color: var(--color);
  }  
</style>