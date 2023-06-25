<svelte:options accessors />

<script lang="ts">
	import { mod } from "@0b5vr/experimental"
	import chroma from "chroma-js"

	export let colour: Array<number>;
	export let just_finished_pick: boolean
	
	// $: valueRange = max - min;
	// $: rotation = startRotation + (value - min) / valueRange * rotRange;
  let container


  const re_render_colour = (colour)=>{
    if(container){
      container.style.setProperty('--color', `rgba(${
      255 * Math.pow(colour[0], 0.45454545454545454545)}, ${
      255 * Math.pow(colour[1], 0.45454545454545454545)}, ${
      255 * Math.pow(colour[2], 0.45454545454545454545)}, ${
      255 * Math.pow(colour[3], 0.45454545454545454545)})`)
    }
  }
  
	// $: col = `rgba(${colour[0]}, ${colour[1]}, ${colour[2]}, ${colour[3]})`;
	$: re_render_colour(colour);
	$: if(just_finished_pick) re_render_colour(colour);

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
    // col[1] += (-0.5 + hash.valueNoiseSmooth(t * 100 * curr_brush.chaos_speed + 100, 2)) * curr_brush.chaos * curr_brush.chaos_lch[1] 
    // col[2] += hue_jitt_amt*(-0.5 + hash.valueNoiseSmooth(t * 100 * curr_brush.chaos_speed + 200, 2)) * 300 * curr_brush.chaos * curr_brush.chaos_lch[2]
    col[0] = clamp(col[0], 0, 1)
    col[1] = clamp(col[1], 0, 1)
    col[2] = mod(col[2], 360)

    // @ts-ignore
    col = chroma_oklch(col).gl()
    colour[0] = col[0]
    colour[1] = col[1]
    colour[2] = col[2]
		// brush_sz[0] = clamp(startValue[0] - valueDiffX, min, max)
		// brush_sz[1] = clamp(startValue[1] + valueDiffY, min, max)
	}

	function pointerDown(e: PointerEvent) {
		dragging = true
		const {clientX, clientY} = e
		startY = clientY
		startX = clientX
		startValue = [...colour]

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
    max-height: 75%;
    height: 100%;
    display: flex;
    background-color: var(--color);
  }  

  .knob {
    display: block;
    aspect-ratio: 1/1;
    height: 100%;
    /* height: 80%; */
    padding: 0;
  }
</style>