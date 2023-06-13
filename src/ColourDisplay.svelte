<svelte:options accessors />

<script lang="ts">
	export let colour: Array<number>;
	
	// $: valueRange = max - min;
	// $: rotation = startRotation + (value - min) / valueRange * rotRange;
  let container


  
	// $: col = `rgba(${colour[0]}, ${colour[1]}, ${colour[2]}, ${colour[3]})`;
	$: document.documentElement.style.setProperty('--color', `rgba(${
    255 * Math.pow(colour[0], 0.45454545454545454545)}, ${
    255 * Math.pow(colour[1], 0.45454545454545454545)}, ${
    255 * Math.pow(colour[2], 0.45454545454545454545)}, ${
    255 * Math.pow(colour[3], 0.45454545454545454545)})`);;
	// $: col = `rgba(#{rgba.join(', ')});`;
  
  // $: {
  //   const [r, g, b, a] = colour;
  //   // @ts-ignore
  //   if($container){
  //     $container.style.backgroundColor = `rgba(${r}, ${g}, ${b}, ${a})`;
  //     console.log("amog")
  //   }
  // } 
	
</script>

<div class='knob-container' bind:this={container}
>

</div>

<style>
  .knob-container{
    box-sizing: border-box;
    -webkit-box-sizing: border-box;
    &:hover{
      cursor: pointer;
    }
    margin-right: 0.5rem;
    aspect-ratio: 4/1;
    max-height: 50%;
    height: 100%;
    display: flex;
    background-color: var(--color);
  }  

  .knob {
    display: block;
    aspect-ratio: 1/1;
    height: 100%;
    /* height: 80%; */
    padding: 0;
  }
</style>