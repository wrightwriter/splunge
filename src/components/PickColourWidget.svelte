<svelte:options accessors />

<div bind:this={pickerElement} on:pointerdown={pointerDown} class="knob-container">
	<div class="knob" class:picking={picking}>
		{@html pickIcon}
	</div>
</div>

<script lang="ts">
	// @ts-ignore
	import pickIcon from '/../public/plug.svg'

	export let pick_from_canvas: () => number[]
  
  let pickerElement: HTMLElement
  
  export let picking = false
  let picked_col = [0,0,0]
  export let just_finished_pick = false

	function pointerMove({ clientX, clientY }) {
   pick_from_canvas()

    // picked_col = [...c]
    // picked_col[0] = c[0]/255
    // picked_col[1] = c[1]/255
    // picked_col[2] = c[2]/255
		// let valueDiff = valueRange * (startY - clientY) / pixelRange;
		// valueDiff -= valueRange * (startX - clientX) / pixelRange;
		// value = clamp(startValue + valueDiff, min, max)
	}
	const pointerUp = () => {
    picking = false
    just_finished_pick = true
		window.removeEventListener('pointermove', pointerMove);
		window.removeEventListener('pointerup', pointerUp);
	}
	
	const pointerDown = (e: PointerEvent) => {
    picking = true
		window.addEventListener('pointermove', pointerMove);
		window.addEventListener('pointerup', pointerUp);
    e.stopPropagation() 
	}
	
</script>

<style>
	.picking{
		filter: invert();
		background: black;
	}
	* {
		user-select: none;
		-webkit-tap-highlight-color: transparent;
	}
	.knob-container {
		cursor: pointer;
		&:hover {
			cursor: pointer;
		}
		box-sizing: border-box;
		-webkit-box-sizing: border-box;
		/* width: 40px;
    height: 40px; */
		aspect-ratio: 1/1;
		max-height: 50%;
		height: 100%;
		display: flex;
		justify-content: center;
		align-items: center;
		/* border-radius: 50%; */
    margin-bottom: auto;
    margin-top: auto;
		margin-right: 1rem;
		pointer-events: all;
		user-select: none;
	}

	.knob {
		display: block;
		aspect-ratio: 1/1;
		height: 100%;
		/* height: 80%; */
		padding: 0;
		/* border-radius: 50%; */
		color: var(--text-color);
		fill: white;
		transform-origin: 50% 50%;
	}

	.knob :global(svg) {
		fill: white;
		width: 100%;
		height: 100%;
	}
</style>
