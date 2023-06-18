<svelte:options accessors />

<script lang="ts">
  // @ts-ignore
  import pausedIcon from "/../public/pause.svg"
  // @ts-ignore
  import playingIcon from "/../public/play.svg"
  
  export let brush_sz: number[] = [0.2,0.2]
  export let canvas_res: number[] 

	export let pixelRange = 200;
	let value = [0,0];
  let min = 0;
  let max = 1;

  export let dragging: boolean = false;
  export let stopped_dragging: boolean = false;

	let startY = 0, startValue = [0,0], startX = 0;

	$: valueRange = max - min;
	// $: rotation = startRotation + (value - min) / valueRange * rotRange;

	function clamp(num, min, max) {
		return Math.max(min, Math.min(num, max));
	}
	
	function pointerMove({ clientX, clientY }) {
		let valueDiffY = valueRange * (startY - clientY) / pixelRange;
		let valueDiffX = valueRange * (startX - clientX) / pixelRange;
		brush_sz[0] = clamp(startValue[0] - valueDiffX, min, max)
		brush_sz[1] = clamp(startValue[1] + valueDiffY, min, max)
	}
	
	function pointerDown(e: PointerEvent) {
    dragging = true
    let { clientX, clientY } = e
		// console.log({ clientY });
    console.log("down")
		startY = clientY;
		startX = clientX;
		startValue = [...brush_sz];

		window.addEventListener('pointermove', pointerMove);
		window.addEventListener('pointerup', pointerUp);
    e.stopPropagation() 
	}
	
	function pointerUp() {
    dragging = false
    stopped_dragging = true
    console.log("up")
		window.removeEventListener('pointermove', pointerMove);
		window.removeEventListener('pointerup', pointerUp);
	}
  
</script>

<div class='knob-container'>
  <div 
    class='brush-preview'

  >
  </div>
  <div class="knob" on:pointerdown={pointerDown}>

    <!-- { if (paused) @html pause} -->
    <!-- {#if paused}
    {@html playingIcon}
    {/if} -->

    {@html pausedIcon}


  
    <!-- <svg width='100%' height='100%' viewBox="0 0 100 100">
      <g fill="none" stroke="currentColor">
        <path stroke-width="10" d="M50 40 l0 -50" />
      </g>
    </svg> -->
  </div>
</div>


<style>
  *{
    user-select: none;
    -webkit-tap-highlight-color:transparent;
  }
  .brush-preview {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }
  .knob-container{
    &:hover{
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
    background-image: conic-gradient(from 45deg,
      var(--secondary-color) 0deg 15deg,
      var(--tertiary-color) 60deg 60deg,
      var(--darken-color) 120deg 240deg,
      var(--tertiary-color) 300deg 300deg,
      var(--secondary-color) 345deg 360deg
    );
    box-shadow: -.15em .15em .05em .02em rgba(0,0,0,0.3);
    border-radius: 50%;
    margin-bottom: 1.25rem;
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
    border-radius: 50%;
    color: var(--text-color);
    background-color: var(--tertiary-color);
    box-shadow: 0 0 .3em rgba(255, 255, 255, 0.3) inset;
    fill: white;
    transform-origin: 50% 50%;
  }

  .knob svg{
    width: 100%;
    height: 100%;
  }
</style>