<svelte:options accessors />

<script lang="ts">
  import {floating_modal_message} from "store"
  let displayed_message: string | undefined = undefined
  
  const display_time = 0.5
  const fade_in_t = 0.2
  const fade_out_t = 0.2
  
  let fading_in = true

  let opacity = 0
  
  let timeouts: NodeJS.Timeout[]= []
  
  floating_modal_message.subscribe(message=>{
    if(message){
      displayed_message = message
      opacity = 1
      fading_in = true
      for(let timeout of timeouts){
        clearTimeout(timeout)
      }
      timeouts.length = 0
      timeouts.push(
        setTimeout(
          ()=>{
            opacity = 0
            fading_in = false
          }, display_time * 1000
        )
      )
      timeouts.push( 
        setTimeout(
          ()=>{
            displayed_message = undefined
          }, display_time * 1000 + fade_out_t * 1000
        )
      )
      floating_modal_message.set(undefined)
    }
  })
</script>


<div id="floating-modal">
 <div id="text" style={
  `opacity: ${opacity};
  transition: opacity ${fading_in ? fade_in_t : fade_out_t}s;`
} >
  {displayed_message}
 </div>
</div>

<style lang="scss">
  *{
    pointer-events: none;
  }
  #floating-modal {
		// position: fixed;
		position: absolute;
		width: fit-content;
		height: fit-content;
    top: 30%;
    left: 50%;
    transform: translate(-50%, -50%);
		z-index: 1000000000000000;
    #text{
      backdrop-filter: blur(0.3rem) invert(0.3);
      padding: 1rem;
      border-radius: 0.5rem;
      pointer-events: none;
    }
  }
</style>