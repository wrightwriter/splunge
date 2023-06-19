<svelte:options accessors />

<script lang="ts">
	export let colour: Array<number>;
	export let just_finished_pick: boolean
	
	// $: valueRange = max - min;
	// $: rotation = startRotation + (value - min) / valueRange * rotRange;
  let container


  const re_render_colour = (colour)=>{
    if(container){
      container.style.setProperty('--color', `rgba(${
      255 * Math.pow(colour[0], 0.45454545454545454545)}, ${
      255 * Math.pow(colour[1], 0.45454545454545454545)}, ${
      255 * Math.pow(colour[2], 0.45454545454545454545)}, ${
      255 * Math.pow(colour[3], 0.45454545454545454545)})`)
    }
  }
  
	// $: col = `rgba(${colour[0]}, ${colour[1]}, ${colour[2]}, ${colour[3]})`;
	$: re_render_colour(colour);
	$: if(just_finished_pick) re_render_colour(colour);
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
    aspect-ratio: 2/1;
    max-height: 75%;
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