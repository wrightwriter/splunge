<svelte:options accessors />

<div bind:this={pickerElement} on:pointerdown={pointerDown} class="knob-container">
	<div class="knob" class:picking={picking}>
		{@html pickIcon}
	</div>
</div>

<script lang="ts">
	import pickIcon from '/../public/plug.svg'

	export let pick_from_canvas: () => Promise<number[]>
  
  let pickerElement: HTMLElement
  
  export let picking = false
  export let just_finished_pick = false

	async function pointerMove({ clientX, clientY }) {
  	await pick_from_canvas()
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

<style lang="scss">
	.picking{
		filter: invert(1);
		background: black;
	}

  @import "/../styles/icon.scss" scoped; 
	.knob-container {
		z-index: 0 !important;
	}
</style>
