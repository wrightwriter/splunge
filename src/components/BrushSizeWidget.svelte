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

	const pointerMove = ({clientX, clientY}) => {
		const scale = 10./min(document.documentElement.clientWidth, document.documentElement.clientHeight) 

		const valueDiffY = (startY - clientY) * scale
		const valueDiffX = (startX - clientX) * scale

		brush_sz[0] = clamp(startValue[0] - valueDiffX,0,5)
		brush_sz[1] = clamp(startValue[1] + valueDiffY,0,5)
	}

	const pointerDown = (e: PointerEvent) => {
		dragging = true
		const {clientX, clientY} = e
		startY = clientY
		startX = clientX
		startValue = [...brush_sz]

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
  @import "/../styles/icon.scss" scoped; 
	.knob-container-container {
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
