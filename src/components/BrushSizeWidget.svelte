<svelte:options accessors />

<div class="knob-container-container" class:knob-selected={dragging} on:pointerdown={pointerDown}>
	<div class="knob-container">
		<div class="knob">
			{@html brushSizeIcon}
		</div>
	</div>
</div>

<script lang="ts">
	import { clamp, min } from 'wmath'
	import brushSizeIcon from '/../public/copy.svg'

	export let brush_sz: number[] = [0.2, 0.2]

	export let dragging: boolean = false
	export let stopped_dragging: boolean = false

	let startY = 0
	let startValue = [0, 0]
	let startX = 0

	let prevX = 0
	let prevY = 0

	export let brushResizeStart = (clientX: number, clientY: number)=>{
		dragging = true
		prevY = startY = clientY
		prevX = startX = clientX
		// startValue = [...brush_sz]
		startValue[0] = brush_sz[0]
		startValue[1] = brush_sz[1]
	}

	export let brushResizeMove = (valueDiffX: number, valueDiffY: number) => {
		const scale = 10./min(document.documentElement.clientWidth, document.documentElement.clientHeight) 
		// const scale = 1./min(document.documentElement.clientWidth, document.documentElement.clientHeight) 
		brush_sz[0] += valueDiffX * scale
		brush_sz[1] += valueDiffY * scale
		brush_sz[0] = clamp(brush_sz[0], 0.0, 5.0)
		brush_sz[1] = clamp(brush_sz[1], 0.0, 5.0)
	}

	export let brushResizeEnd = () => {
		dragging = false
		stopped_dragging = true
	}

	const pointerMove = ({clientX, clientY}) => {
		const valueDiffY = clientY - prevY
		const valueDiffX = clientX - prevX 

		brushResizeMove(valueDiffX, -valueDiffY)
		prevX = clientX
		prevY = clientY
	}

	const pointerDown = (e: PointerEvent) => {
		brushResizeStart(e.clientX, e.clientY)
		window.addEventListener('pointermove', pointerMove)
		window.addEventListener('pointerup', pointerUp)
		e.stopPropagation()
	}

	const pointerUp = () => {
		brushResizeEnd()
		window.removeEventListener('pointermove', pointerMove)
		window.removeEventListener('pointerup', pointerUp)
	}
</script>

<style lang="scss">
  @import "/../styles/icon.scss" scoped; 
	.knob-container-container {
		width: 0px;
		aspect-ratio: 1/1;

		&:active{
			filter: invert(1);
		}
		margin-top: auto;
		margin-bottom: auto;

		.knob{
			&:active{
				filter: invert(0);
				background: black;
			}
		}
		
    // max-height: unset !important;
    // display: flex;
    // align-items: center;
		&:hover {
			cursor: pointer;
		}
		// height: 100%;
		.knob-container{
			margin-left: 0;
			margin-right: 0;
			// padding: 0.3rem;
		}
	}

</style>
