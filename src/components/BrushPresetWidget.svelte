<svelte:options accessors />

<script lang="ts">
	import { BrushPreset} from 'brush_stroke'
	import {onMount} from 'svelte'

  export let brush_presets: BrushPreset[]
  export let selected_brush_preset: BrushPreset

  let elements: HTMLDivElement[] = []
  for(let preset of brush_presets){
    elements.length++
  }

  onMount(()=>{
    let k = 0 
    for(let element of elements){
      if(selected_brush_preset === brush_presets[k]){
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
  {#each brush_presets as preset, i}
    <div 
      class="title menu-toggle" 
      bind:this={elements[i]}
      role="button" tabindex="0" 
      on:click={()=>{
        selected_brush_preset = preset
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
      >{i.toString()}</div>
  {/each}
</div>
  
<style lang="scss">
  .knob-container-container{
    aspect-ratio: unset;
    display: grid;
    pointer-events: all;
    user-select: none;
    cursor: pointer;
    // width: fit-content;
    grid-template-columns: 1fr 1fr 1fr;
    
    overflow: hidden;
    height: 100%;
    width: 4rem;
    // max-height: unset !important;
    margin: 0;
    margin-top: auto;
    margin-bottom: auto;
    max-width: unset;
    // width: fit-content;
    margin-right: 1rem;
    >.title.menu-toggle{
      background: white;
      color: black;
      width: 100%;
      height: 100%;
    }
    >.title {
      padding: 0.0rem;
      font-size: 0.8rem !important;
      margin: 0.0rem;
      color: white;
      text-align: center;
      font-weight: bolder;
      user-select: none;
    }
  }
</style>