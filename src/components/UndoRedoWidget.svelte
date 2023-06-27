<svelte:options accessors />

<script lang="ts">
  // @ts-ignore
  import undoIcon from "/../public/undo.svg"
  // @ts-ignore
  import redoIcon from "/../public/redo.svg" 
  
  
  export let redo: ()=>void
  export let undo: ()=>void
  
</script>

<div class='knob-container'>
  <div class="knob" on:click={()=>undo()}>
    {@html undoIcon}
  </div>
  <div class="knob" on:click={()=>redo()}>
    {@html redoIcon}
  </div>
</div>


<style>
  *{
    user-select: none;
    -webkit-tap-highlight-color:transparent;
  }
  .knob-container{
    cursor: pointer;
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
    border-radius: 50%;
    margin-right: 1rem;
    margin-bottom: auto;
    margin-top: auto;
    pointer-events: all;
    user-select: none;
  }  

  .knob {
    &:active{
      filter: invert(1);
      background: black;
    }
    display: block;
    aspect-ratio: 1/1;
    height: 100%;
    /* height: 80%; */
    padding: 0;
    color: var(--text-color);
    fill: white;
    transform-origin: 50% 50%;
  }

  .knob :global(svg){
    fill: white;
    width: 100%;
    height: 100%;
  }
</style>