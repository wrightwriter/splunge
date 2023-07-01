<svelte:options accessors />

<script lang="ts">
	import {onMount} from 'svelte'

	export let colour: number[]

  let colour_idx = 0

  // @ts-ignore
  let elements: HTMLDivElement[] = [0,0,0]
  // @ts-ignore
  let inners: HTMLDivElement[] = [0,0,0]

	let startY = 0
  let startX = 0;
  let startValue = 0
	
	const clamp = (num, min, max) => {
		return Math.max(min, Math.min(num, max));
	}

  // @ts-ignore
  $: { if(colour[0] && isNaN(elements[0])) update_style(0) }
  // @ts-ignore
  $: { if(colour[1] && isNaN(elements[1])) update_style(1) }
  // @ts-ignore
  $: { if(colour[2] && isNaN(elements[2])) update_style(2) }
  
  const update_style = (idx: number) =>{
    inners[idx].style.transform = `scaleX(${colour[idx]})`
  }
	
	const pointerMove = ({ clientX, clientY }) => {
		let scale = 0.25/elements[colour_idx].clientWidth

		let valueDiff = -(startX - clientX) *scale;
		valueDiff += (startY - clientY) *scale;
		colour[colour_idx] = clamp(startValue + valueDiff, 0, 1)
    update_style(colour_idx)
	}
	
	const pointerDown = (e: PointerEvent) => {
    let { clientX, clientY } = e
		startY = clientY;
		startX = clientX;
		startValue = colour[colour_idx];
    update_style(colour_idx)

		window.addEventListener('pointermove', pointerMove);
		window.addEventListener('pointerup', pointerUp);
	}
	
	const pointerUp = () => {
		window.removeEventListener('pointermove', pointerMove);
		window.removeEventListener('pointerup', pointerUp);
	}
  
  onMount(()=>{
    update_style(0)
    update_style(1)
    update_style(2)
  })
  
</script>


<div draggable="false" class='knob-container-container'>

  <!-- {#} -->
  {#each colour as col_element, i}
    {#if i !== 3}
      <div class='knob-container'
        on:pointerdown={(e)=>{
          colour_idx = i
          pointerDown(e)
          e.stopPropagation() 
        }}
        bind:this={elements[i]}
      >
         <div class='inner' 
          style={
            i === 0 ? "background:  rgb(238, 0, 107);" 
            : i === 1 ? "background: rgb(0, 222, 107);" 
            : "background: rgb(0, 85, 255);"
           }
           bind:this={inners[i]}
         />
      </div>
    {/if}
  {/each}
</div>

<style lang="scss">
  .knob-container-container{
    // max-height: 100% !important;
    margin-left: 0px;
    margin-right: 0px;
    // aspect-ratio: 2/1;
    /* max-height: 50%; */
    height: 100%;
    width: 100%;
    // width: 14rem;
    /* margin-top: 0.5rem; */
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    pointer-events: all;
    user-select: none;
  }
  .knob-container{
    height: 100%;
    width: 100%;
    margin-right: auto;
    .inner{
      transform-origin: left;
      height: 100%;
      width: 100%;
      
    }
    
  }
</style>