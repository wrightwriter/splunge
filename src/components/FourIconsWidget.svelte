<svelte:options accessors />

<script lang="ts">
	import {gallery_open} from 'store'
	// import Knob from "./Knob.svelte"
</script>


<div id='four-icons' style={$gallery_open?  "display: contents;" : ""}>
  <slot></slot>
</div>

<style lang="scss">
  #four-icons{
    // width: 100%;
    // max-height: unset !important;
    height: 100%;
    aspect-ratio: 1/1;
    display: grid;
    // height: 100%;
    grid-template-columns: 2fr 1fr;
    grid-template-rows: 1fr 1fr;
    width: 5rem;
    transform: scale(0.7);
    transform-origin: top;
    // padding: 0rem 1rem;
    // align-items: center;
    // > *:last-of-type {
    //   margin-left: auto;
    //   margin-right: 0px;
    // }
    >:global(div:not(:first-of-type)){
      height: 100%;
      max-height: unset;
      margin: 0;
    }
    >:global(div:first-of-type){
      grid-column: 1 / -1;
    }
  }
</style>