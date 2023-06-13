<svelte:options accessors />

<script lang="ts">
	// export let values;


  export let outputs: Array<Array<boolean>> = new Array(16);
  
  for(let i = 0; i < 16; i++){
    let channels: Array<boolean> = []
    for(let k = 0; k < 16; k++){
      channels.push(false)
    }
    outputs[i] = channels
  }
	
	// let startY = 0, startValue = 0;
	// $: valueRange = max - min;
	// $: rotation = startRotation + (value - min) / valueRange * rotRange;
	
</script>

<div class='indicators'>
  {#each outputs as channels, i}
    <div class='indicators-y'>
      {#each channels as channel, k}
        {#if channel}
          <div class='indicators-x indicator-active'>
          </div>
        {/if}
        {#if !channel}
          <div class='indicators-x'>
          </div>
        {/if}
      {/each}
    </div>
  {/each}
</div>

<style lang="scss">
  .indicators{
    height: 100%;
    display: flex;
    flex-direction: column;
    .indicators-y{
      display: flex;
      flex-direction: row;
      height: 100%;
      aspect-ratio: 1/1;
      .indicators-x{
    // border: 1px solid white;
        // background: grey;
        height: 100%;
        aspect-ratio: 1/1;
      }
      .indicator-active{
        background: white !important;
      }
    }
  }  

</style>