<svelte:options accessors />

<script lang="ts">
	import { BrushPreset, BrushType } from 'brush_stroke'
	import {onMount} from 'svelte'

  // export let selected_brush_type: BrushType;
  export let brush_presets: BrushPreset[]
  export let selected_brush_preset: BrushPreset

  let elements: HTMLDivElement[] = []
  for(let preset of brush_presets){
    elements.length++
  }
  // let brush_types: string[] = [ ]
  // for(let type of Object.keys(BrushType).filter((v) => isNaN(Number(v)))){
  //   brush_types.push(type)
  //   elements.length++
  // }

  onMount(()=>{
    let k = 0 
    for(let element of elements){
      // let brush_type = brush_types[k]
      // let brush_type_int = BrushType[brush_types[k]]
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
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <div 
      class="title menu-toggle" 
      bind:this={elements[i]}
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
    max-height: 50%;
    margin-top: 0.7rem;
    margin-bottom: auto;
    margin-right: 3.25rem;

    display: grid;
    // height: 100%;
    grid-template-columns: fit-content(8ch) fit-content(8ch) 1fr;
    // grid-auto-rows: minmax(67px, auto);

    /* justify-content: center; */
    /* align-items: center; */
    pointer-events: all;
    user-select: none;
    cursor: pointer;
    width: fit-content;
    /* min-width: 7rem; */
  }
  .knob-container-container>.title.menu-toggle{
    background: white;
    color: black;
  }
  .knob-container-container>.title {
    
    padding: 0.2rem;
    /* position: absolute; */
    font-size: 0.8rem !important;
    /* position: absolute; */
    margin: 0.3rem;
    color: white;
    // width: 100%;
    text-align: center;
    font-weight: bolder;
    // top: 5.5rem;
    user-select: none;
  }
</style>