<svelte:options accessors />

<script lang="ts">
  import {floating_modal_message} from "store"
  let displayed_message: string | undefined = undefined
  
  const display_time = 1
  const fade_in_t = 0.2
  const fade_out_t = 1
  
  let fading_in = true

  let opacity = 0
  
  floating_modal_message.subscribe(message=>{
    if(message){
      displayed_message = message
      opacity = 1
      fading_in = true
      setTimeout(()=>{
        opacity = 0
        fading_in = false
        setTimeout(()=>{
          displayed_message = undefined
        }, fade_out_t * 1000)
      }, display_time * 1000)
      floating_modal_message.set(undefined)
    }
  })
</script>


<!-- {#if displayed_message} -->
  <div id="floating-modal">
   <div id="text" style={
    `opacity: ${opacity};
    transition: opacity ${fading_in ? fade_in_t : fade_out_t}s;`
  } >
    {displayed_message}
   </div>
  </div>
<!-- {/if} -->

<style lang="scss">
  *{
    pointer-events: none;
  }
  #floating-modal {
		position: fixed;
		width: fit-content;
		height: fit-content;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
		z-index: 100;
    #text{
      backdrop-filter: blur(0.3rem) invert(0.3);
      padding: 1rem;
      border-radius: 0.5rem;
      pointer-events: none;
    }
  }
</style>