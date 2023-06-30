<svelte:options accessors />

<script lang="ts">
  import undoIcon from "/../public/undo.svg"
  import redoIcon from "/../public/redo.svg" 
  
  
  export let redo: ()=>void
  export let undo: ()=>void
  
</script>

<!-- <svelte:fragment> -->
  <div class='knob-container'>
    <div class="knob" on:click={()=>undo()}>
      {@html undoIcon}
    </div>
  </div>
  <div class='knob-container'>
    <div class="knob" on:click={()=>redo()}>
      {@html redoIcon}
    </div>
  </div>
<!-- </svelte:fragment> -->


<!-- <style src='/../styles/icon.scss'> </style> -->
<style lang="scss">

  @import "/../styles/icon.scss" scoped; 
  
  .knob-container{
    // aspect-ratio: unset; 
  }

</style>