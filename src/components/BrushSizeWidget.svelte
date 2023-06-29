<svelte:options accessors />

<div class="knob-container-container" class:knob-selected={dragging} on:pointerdown={pointerDown}>
	<div class="knob-container">
		<div class="knob">
			<!-- { if (paused) @html pause} -->
			<!-- {#if paused}
			{@html playingIcon}
			{/if} -->

			{@html brushSizeIcon}

			<!-- <svg width='100%' height='100%' viewBox="0 0 100 100">
				<g fill="none" stroke="currentColor">
					<path stroke-width="10" d="M50 40 l0 -50" />
				</g>
			</svg> -->
		</div>
	</div>
</div>

<script lang="ts">
	// @ts-ignore
	import brushSizeIcon from '/../public/copy.svg'

	export let brush_sz: number[] = [0.2, 0.2]
	// export let canvas_res: number[]

	export let pixelRange = 200
	let value = [0, 0]
	let min = 0
	let max = 4

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
		let valueDiffY = (valueRange * (startY - clientY)) / pixelRange
		let valueDiffX = (valueRange * (startX - clientX)) / pixelRange
		brush_sz[0] = clamp(startValue[0] - valueDiffX, min, max)
		brush_sz[1] = clamp(startValue[1] + valueDiffY, min, max)
	}

	function pointerDown(e: PointerEvent) {
		dragging = true
		let {clientX, clientY} = e
		// console.log({ clientY });
		console.log('down')
		startY = clientY
		startX = clientX
		startValue = [...brush_sz]

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

<style lang="scss">
	* {
		user-select: none;
		-webkit-tap-highlight-color: transparent;
	}
  @import "/../styles/icon.scss" scoped; 

	// .knob-selected {
		// filter: invert(1);
		// :global(svg) {
		// 	background: black;
		// }
	// }
	.knob-container-container {
		
    max-height: unset !important;
    display: flex;
    align-items: center;
		&:hover {
			cursor: pointer;
		}
		height: 100%;
	}

	.knob-container{
		padding: 0.3rem;
	}
</style>
