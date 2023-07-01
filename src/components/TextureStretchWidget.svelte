<svelte:options accessors />

<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
	class="knob-container-container"
	on:pointerdown={pointerDown}
	on:dblclick={()=>{
		selected_brush_preset.tex_stretch[0] = 0.5
		selected_brush_preset.tex_stretch[1] = 0.5
	}}
>
	<div class="title">
		Tex stretch
	</div>
	<div class="img-container">
		<img
			src={selected_brush_texture ? selected_brush_texture.path : ''}
			style={`
				transform: scale(${1 + (selected_brush_preset.tex_stretch[0] - 0.5)*10}, ${1 + (selected_brush_preset.tex_stretch[1] - 0.5)*10});
			`}
		/>
	</div>
</div>

<script lang="ts">
	import type { BrushPreset } from 'brush_stroke'
	import type {BrushTexture} from 'stuff'
	import { clamp, min } from 'wmath'

	export let selected_brush_texture: BrushTexture
	export let selected_brush_preset: BrushPreset

	let dragging: boolean = false
	let stopped_dragging: boolean = false

	let startY = 0
	let startValue = [0, 0]
	let startX = 0

	const pointerMove = ({clientX, clientY}) => {
		const scale = 10./min(document.documentElement.clientWidth, document.documentElement.clientHeight) 

		const valueDiffY = (startY - clientY) * scale
		const valueDiffX = (startX - clientX) * scale

		// brush_sz[0] = clamp(startValue[0] - valueDiffX,0,5)
		// brush_sz[1] = clamp(startValue[1] + valueDiffY,0,5)
		selected_brush_preset.tex_stretch[0] = clamp(startValue[0] - valueDiffX,0,1)
		selected_brush_preset.tex_stretch[1] = clamp(startValue[1] + valueDiffY,0,1)
	}

	const pointerDown = (e: PointerEvent) => {
		dragging = true
		const {clientX, clientY} = e
		startY = clientY
		startX = clientX
		startValue = [...selected_brush_preset.tex_stretch]

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

<style lang="scss">
	// img {
	// 	&:active {
	// 		// filter: invert(1);
	// 		// background: black;
	// 	}
	// 	// pointer-events: none;
	// }
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
