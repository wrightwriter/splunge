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

  @import "/../styles/icon.scss" scoped; 
</style>
