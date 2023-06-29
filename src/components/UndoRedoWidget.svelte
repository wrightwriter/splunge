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


<!-- <style src='/../styles/icon.scss'> </style> -->
<style lang="scss">
  *{
    user-select: none;
    -webkit-tap-highlight-color:transparent;
  } 

  @import "/../styles/icon.scss" scoped; 

</style>