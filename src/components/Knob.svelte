<svelte:options accessors />

<script lang="ts">
	import { min } from 'wmath'
	import SemiModal from './SemiModal.svelte'
	import {onMount} from 'svelte'
	import { saturate } from '@0b5vr/experimental'

	export let value
  
  export let triggerModal: undefined | ((modal: SemiModal)=>void) = undefined
  export let modal: SemiModal | undefined = undefined
  
  export let modalHidden = true
  export let title = ""

  let titleElement: HTMLDivElement

	const rotRange = 2 * Math.PI * 0.83;

	let startY = 0
  let startX = 0;
  let startValue = 0
	$: rotation = (value);
  
	const pointerMove = ({ clientX, clientY }) => {
		let scale = 3./min(document.documentElement.clientWidth, document.documentElement.clientHeight) 

		let valueDiff = (startY - clientY) * scale;
		valueDiff -= (startX - clientX) *scale;
		value = saturate(startValue + valueDiff)
	}
	
	const pointerDown = (e: PointerEvent) => {
    let { clientX, clientY } = e
		startY = clientY;
		startX = clientX;
		startValue = value;

		window.addEventListener('pointermove', pointerMove);
		window.addEventListener('pointerup', pointerUp);
    e.stopPropagation() 
	}
	
	function pointerUp() {
		window.removeEventListener('pointermove', pointerMove);
		window.removeEventListener('pointerup', pointerUp);
	}
  

  onMount(()=>{
    let pointerDown
    let pointerUp = ()=>{
      if(modal){
        triggerModal?.(modal)
        modalHidden = modal.hidden as boolean
      }
      titleElement.removeEventListener( "pointerdown", pointerDown)
    }
    pointerDown = ()=>{
      titleElement.removeEventListener("pointerup", pointerUp)
      titleElement.addEventListener("pointerup", pointerUp)
    }
    titleElement.addEventListener("pointerdown", pointerDown)
  })

</script>


<div draggable="false" class='knob-container-container'>
  <div class='knob-container'>
    <div class="knob" on:pointerdown={pointerDown} >
      <!-- <svg style="transform:rotate(calc({rotation} * 1rad))"  width='100%' height='100%' viewBox="0 0 100 100"> -->
      <svg style={`
        background-image: conic-gradient(
          transparent ${0}deg,
          white ${0+5}deg,
          white ${value*155*2}deg, 
          transparent ${value*155*2 + 5}deg , 
          transparent ${0}deg
          ); 
        // transparent ${0 - 2}deg;
        transform: rotate(-155deg);
        border-radius: 100%;
      `}  width='100%' height='100%' viewBox="0 0 100 100">
        <!-- border-radius: 1000rem;
        background-image: conic-gradient(pink 1.14rad, transparent 0); -->
        ;

        <g fill="none" stroke="none">
          <path stroke-width="10" d="M50 40 l0 -50" />
        </g>
      </svg>
    </div>
  </div>
  <div 
    class="title {triggerModal ? "menu-toggle" : ""}" 
    bind:this={titleElement}
    style='{!modalHidden && "outline: 1px solid white; outline-offset: 0.1rem;"} {modal && "cursor: pointer;"}'
    >{title}</div>
</div>

<style lang="scss">
  .knob-container-container{
    aspect-ratio: 1/1;
    // max-height: 50%;
    margin-top: 0.5rem;
    margin-right: 0.5rem;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    pointer-events: all;
    user-select: none;
    >.title.menu-toggle{
      background: white;
      color: black;
    }
    >.title {
      
      cursor: pointer;
      /* position: absolute; */
      font-size: 0.8rem !important;
      /* position: absolute; */
      margin-top: 0.5rem;
      color: white;
      width: 100%;
      text-align: center;
      font-weight: bolder;
      top: 5.5rem;
      user-select: none;
    }
    >.knob-container{
      box-sizing: border-box;
      -webkit-box-sizing: border-box;
      &:hover{
        cursor: pointer;
      }
      aspect-ratio: 1/1;
      /* width: 40px;
      height: 40px; */
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      background-image: conic-gradient(from 45deg,
        var(--secondary-color) 0deg 15deg,
        white 60deg 60deg,
        rgba(0,0,0,0) 120deg 240deg,
        white 300deg 300deg,
        var(--secondary-color) 345deg 360deg
      );
      border-radius: 50%;
      outline: 0.2rem solid white;
    }
    >.knob {
      display: block;
      aspect-ratio: 1/1;
      height: 100%;
      /* height: 80%; */
      padding: 0;
      border-radius: 50%;
      color: var(--text-color);
      background-color: var(--tertiary-color);
      // box-shadow: 0 0 .3em rgba(255, 255, 255, 0.3) inset;
      transform-origin: 50% 50%;
    }

    >.knob :global(svg){
      width: 100%;
      height: 100%;
      border-radius: 1000%;
      transform: rotate(-155deg);
    }
  }

</style>