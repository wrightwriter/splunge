<svelte:options accessors />

<script lang="ts">
	import Knob from "./Knob.svelte"

	// export let child
  export let hidden: boolean = true
  export let knob: Knob
</script>


<div id='bar' style='{hidden ? "display: none;" : ""}'>
  <slot></slot>
</div>

<style lang="scss">
  #bar {
    background: black;
    // position: absolute;
    width: 100%;
    height: 100px;
    display: flex;
    padding: 0rem 1rem;
    align-items: center;
    > *:last-of-type {
      margin-left: auto;
      margin-right: 0px;
    }
  }
</style>