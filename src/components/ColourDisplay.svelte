<svelte:options accessors />

<script lang="ts">
	import { mod } from "@0b5vr/experimental"
	import chroma from "chroma-js"
	import { clamp, min } from "wmath"

	import { fade } from 'svelte/transition';

	export let colour: Array<number>;
  let container: HTMLDivElement

  const re_render_colour = (colour_r: number, colour_g: number, colour_b: number)=>{
    if(container){
      container.style.setProperty('--color', `rgba(${
      255 * Math.pow(colour_r, 0.45454545454545454545)}, ${
      255 * Math.pow(colour_g, 0.45454545454545454545)}, ${
      255 * Math.pow(colour_b, 0.45454545454545454545)}, ${
      255 * Math.pow(1.0, 0.45454545454545454545)})`)
    }
  }
	export const update_display = (colour_r: number, colour_g: number, colour_b: number)=>{re_render_colour(colour_r, colour_g, colour_b)}
  
	$: re_render_colour(colour[0], colour[1], colour[2]);

	export let dragging: boolean = true
	export let stopped_dragging: boolean = false

	let startValue = [0, 0]
	
	let is_vs_adjusting = false
	
	let prevX = 0
	let prevY = 0

	const chroma_gl = (col: number[]) => {
		return chroma.gl(col[0], col[1], col[2])
	}
	const chroma_oklch = (col: number[]) => {
		return chroma.oklch(col[0], col[1], col[2])
	}

	const pointerMove = ({clientX, clientY}) => {
		const scale = 1./min(document.documentElement.clientWidth, document.documentElement.clientHeight) 
		const valueDiffY = -(clientY - prevY)
		const valueDiffX = clientX - prevX
		
		prevX = clientX
		prevY = clientY

    let col = chroma_gl(colour).oklch()

    col[0] += valueDiffY*1.0*scale
		if(is_vs_adjusting){
			col[1] += valueDiffX*0.5*scale
		} else{
			col[2] += valueDiffX*360*1.0*scale
		}
    col[0] = clamp(col[0], 0, 1)
    col[1] = clamp(col[1], 0, 1)
    col[2] = mod(col[2], 360)

    // @ts-ignore
    col = chroma_oklch(col).gl()
    colour[0] = col[0]
    colour[1] = col[1]
    colour[2] = col[2]
	}

	const pointerDown = (e: PointerEvent) => {
		dragging = true
		const {clientX, clientY} = e
		prevY = clientY
		prevX = clientX
		startValue = [colour[0], colour[1], colour[2], 1]


		const rect = container.getBoundingClientRect();
		const x_relative_to_element = (e.clientX - rect.left)/rect.width;
		
		is_vs_adjusting = x_relative_to_element > 0.5

		window.addEventListener('pointermove', pointerMove)
		window.addEventListener('pointerup', pointerUp)
		e.stopPropagation()
	}

	const pointerUp = () => {
		dragging = false
		stopped_dragging = true
		window.removeEventListener('pointermove', pointerMove)
		window.removeEventListener('pointerup', pointerUp)
	}
	
</script>

<div draggable="false" class='knob-container' bind:this={container} on:pointerdown={pointerDown} >
	{#if dragging}
	<div class="text-container" transition:fade={{duration: 200}} style={`opacity: ${is_vs_adjusting ? 0.5 : 1};`}>
		<div>
			V/H
		</div>
	</div>
	<div class="text-container" style={`opacity: ${is_vs_adjusting ? 1 : 0.5};`}>
		<div>
			V/S
		</div>
	</div>
	{/if}
</div>

<style lang="scss">
  .knob-container{
    // box-sizing: border-box;
    // -webkit-box-sizing: border-box;
		width: 100%;
    &:hover{
      cursor: pointer;
    }
		>div{
			width: 100%;
			height: 100%;
			text-align: center;
			user-select: none;
			filter: invert(1);
			filter: grayscale(1);
			color: black;
		}
		.text-container{
			display: flex;
			align-items: center;
			transform: translate(0px, -2.5%);
			justify-content: center;
		}
    margin-right: 0.5rem;
    // aspect-ratio: 1/1;
    display: flex;
    background-color: var(--color);
		// width: 14rem;
    height: 100%;
    // max-height: 100% !important;
    // align-items: center;
    // justify-content: space-around;
  }  
</style>