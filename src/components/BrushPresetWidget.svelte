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
  *{
    user-select: none;
    -webkit-tap-highlight-color:transparent;
  }
  .knob-container-container{
    aspect-ratio: 1/1;
    max-height: 75%;
    margin-top: 0.7rem;
    margin-bottom: auto;
    margin-right: 2rem;

    display: grid;
    pointer-events: all;
    user-select: none;
    cursor: pointer;
    width: fit-content;
    grid-template-columns: 1fr 1fr 1fr;
    
    overflow: hidden;
    height: 100%;
    max-height: unset !important;
    margin: 0;
    max-width: unset;
    width: fit-content;
    margin-right: 1rem;
    >.title.menu-toggle{
      background: white;
      color: black;
      width: 49%;
      height: 70%;
    }
    >.title {
      padding: 0.2rem;
      font-size: 0.8rem !important;
      margin: 0.3rem;
      color: white;
      text-align: center;
      font-weight: bolder;
      user-select: none;
    }
  }
</style>