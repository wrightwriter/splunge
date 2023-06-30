<svelte:options accessors />

<script lang="ts">
	import Knob from "./Knob.svelte"
	import { fade, slide } from 'svelte/transition';
	import {gallery_open} from 'store'

	// export let child
  export let hidden: boolean = true
  export let knob: Knob
</script>


{#if !hidden}
<div id='bar' transition:slide={{duration: 200}} style={$gallery_open ? "display: none;" : ""}>
  <slot></slot>
</div>
{/if}

<style lang="scss">
  #bar {
		z-index: 0 !important;
    background: black;
    // position: absolute;
    width: 100%;
    height: 6rem;
    display: flex;
    padding: 0rem 1rem;
    align-items: center;
    justify-content: flex-end;
    flex-wrap: wrap;
    background: black;
    // position: absolute;
    width: 100%;
    // height: 6rem;
    display: flex;
    // padding: 0rem 1rem;
    align-items: center;
    >:global(div) {
      max-height: 4rem;
      height: 100%;
      &:not(:first-of-type){
        margin-left: 0.25rem;
      }

      margin-right: 0.25rem;
      // max-height: 2.5rem;	
      z-index: 1;
      &:last-of-type {
        margin-right: 4rem;
      }
    }
  }
</style>