<svelte:options accessors />

<script lang="ts">
	import { BrushType } from 'stuff'
	import {onMount} from 'svelte'

  export let selected_brush_type: BrushType;

  let elements: HTMLDivElement[] = []
  let brush_types: string[] = [ ]
  for(let type of Object.keys(BrushType).filter((v) => isNaN(Number(v)))){
    brush_types.push(type)
    elements.length++
  }
  
  const updateOutline = ()=>{

  }

  onMount(()=>{
    let k = 0 
    for(let element of elements){
      let brush_type = brush_types[k]
      let brush_type_int = BrushType[brush_types[k]]
      if(brush_type_int === selected_brush_type){
        element.style.outline = '1px solid white'
        element.style.outlineOffset = '0.1rem'
      } else {
        element.style.outline = '0px solid white'
      }
      k++
    }
  })
</script>


<div class='knob-container-container'>
  {#each brush_types as brush_type, i}
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <div 
      class="title menu-toggle" 
      bind:this={elements[i]}
      on:click={()=>{
        selected_brush_type = BrushType[brush_type]
        let k = 0
        for(let element of elements){
          if(k === i){
            element.style.outline = '1px solid white'
            element.style.outlineOffset = '0.1rem'
          } else {
            element.style.outline = '0px solid white'
          }
          k++
        }
      }}
      style='cursor: pointer;'
      >{brush_type}</div>
  {/each}
</div>
  
<style>
  *{
    user-select: none;
    -webkit-tap-highlight-color:transparent;
  }
  .knob-container-container{
    aspect-ratio: 1/1;
    max-height: 50%;
    margin-top: 0.5rem;
    margin-bottom: auto;
    margin-right: 0.5rem;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    pointer-events: all;
    user-select: none;
    cursor: pointer;
    min-width: 7rem;
  }
  .knob-container-container>.title.menu-toggle{
    background: white;
    color: black;
  }
  .knob-container-container>.title {
    
    /* position: absolute; */
    font-size: 0.8rem !important;
    /* position: absolute; */
    margin-top: 0.5rem;
    color: white;
    width: 100%;
    text-align: center;
    font-weight: bolder;
    top: 5.5rem;
    user-select: none;
  }
</style>