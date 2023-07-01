<svelte:options accessors />

<script lang="ts">
	import {onMount} from 'svelte'

	// export let values: number[]
	export let value_1: number = -999
	export let value_2: number = -999
	export let value_3: number = -999
	export let names: string[]

  let value_idx = 0

  let elements: HTMLDivElement[] = []
  let inners: HTMLDivElement[] = []

	let startY = 0
  let startX = 0;
  let startValue = 0
	
	const clamp = (num, min, max) => {
		return Math.max(min, Math.min(num, max));
	}
  
  const get_value = (idx: number) => {
    return idx === 0 ? value_1 : idx === 1 ? value_2 : value_3
  }
  const set_value = (idx: number, v: number) => {
    if(idx === 0){
      value_1 = v
    } else if(idx === 1){
      value_2 = v
    } else if(idx === 2){
      value_3 = v
    }
  }

  // @ts-ignore
  $: { if(value_1 > -999 && elements.length > 0 && isNaN(elements[0])) update_style(0) }
  // @ts-ignore
  $: { if(value_2 > -999 && elements.length > 0 && isNaN(elements[1])) update_style(1) }
  // @ts-ignore
  $: { if(value_3 > -999 && elements.length > 0 && isNaN(elements[2])) update_style(2) }
  
  const update_style = (idx: number) =>{
    // inners[idx].style.transform = `scaleX(${[get_value(idx)]})`
    inners[idx].style.width = `${get_value(idx)*100}%`
  }
	
	const pointerMove = ({ clientX, clientY }) => {
		let scale = 1./elements[value_idx].clientWidth

		let valueDiff = -(startX - clientX) *scale;
		// valueDiff += (startY - clientY) *scale;
		const v = clamp(startValue + valueDiff, 0, 1)
    
    set_value(value_idx, v)
    update_style(value_idx)
	}
	
	const pointerDown = (e: PointerEvent) => {
    let { clientX, clientY } = e
		startY = clientY;
		startX = clientX;
		startValue = get_value(value_idx);
    update_style(value_idx)

		window.addEventListener('pointermove', pointerMove);
		window.addEventListener('pointerup', pointerUp);
	}
	
	const pointerUp = () => {
		window.removeEventListener('pointermove', pointerMove);
		window.removeEventListener('pointerup', pointerUp);
	}
  
  onMount(()=>{
    const cnt = names.length
    // let cnt = 0
    // if(value_3 > -999){
    //   cnt = 3
    // } else if(value_2 > -999){
    //   cnt = 2
    // } else {
    //   cnt = 1
    // }

    // update_style(0)
    // update_style(1)
    // update_style(2)
  })
  
</script>


<div draggable="false" class='knob-container-container'>

  <!-- {#} -->
  {#each names as name, i}
    <!-- {#if i !== 3} -->
     <div class='inner'
        on:pointerdown={(e)=>{
          value_idx = i
          pointerDown(e)
          e.stopPropagation() 
        }}
     >
      {name}          
     </div>
      <div class='knob-container'
        on:pointerdown={(e)=>{
          value_idx = i
          pointerDown(e)
          e.stopPropagation() 
        }}
        bind:this={elements[i]}
      >
         <div class='inner' 
          style={ "background: white;" }
           bind:this={inners[i]}
         />
      </div>
    <!-- {/if} -->
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
    justify-content: center;
    align-items: center;
    pointer-events: all;
    user-select: none;

    max-height: 6rem !important;
    max-width: 10rem;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }
  .inner{
    width: 100%;
    transform-origin: left;
    margin-right: auto;
    font-size: 0.8rem;
  }
  .knob-container{
    // height: 100%;
    width: 100%;
    margin-right: auto;
    height: 1rem !important;
    border-radius: 10.5rem;
    background: grey;
    .inner{
      height: 100%;
      border-radius: 10.5rem;
    }
    
  }
</style>