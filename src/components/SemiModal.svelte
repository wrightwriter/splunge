<svelte:options accessors />

<script lang="ts">
	import Knob from "./Knob.svelte"
	import { fade, slide } from 'svelte/transition';

	// export let child
  export let hidden: boolean = true
  export let knob: Knob
</script>


{#if !hidden}
<div id='bar' transition:slide={{duration: 200}}>
  <slot></slot>
</div>
{/if}

<style lang="scss">
  #bar {
    background: black;
    // position: absolute;
    width: 100%;
    height: 100px;
    display: flex;
    padding: 0rem 1rem;
    align-items: center;
    justify-content: flex-end;
    >*:last-of-type {
      margin-left: auto;
      margin-right: 0px;
    }
  }
</style>