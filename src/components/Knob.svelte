<svelte:options accessors />

<script lang="ts">
	import { min } from 'wmath'
	import SemiModal from './SemiModal.svelte'
	import {onMount} from 'svelte'

	export let value
  
  export let triggerModal: undefined | ((modal: SemiModal)=>void) = undefined
  export let modal: SemiModal | undefined = undefined
  let knobElement: HTMLElement
  
  export let modalHidden = true
  export let title = ""

	const rotRange = 2 * Math.PI * 0.83;

	let startY = 0
  let startX = 0;
  let startValue = 0
	$: rotation = -Math.PI * 0.83 + (value) * rotRange;
  
  
	
	function clamp(num, min, max) {
		return Math.max(min, Math.min(num, max));
	}
	
	function pointerMove({ clientX, clientY }) {
		let scale = 3./min(document.documentElement.clientWidth, document.documentElement.clientHeight) 

		let valueDiff = (startY - clientY) * scale;
		valueDiff -= (startX - clientX) *scale;
		value = clamp(startValue + valueDiff, 0, 1)
	}
	
	function pointerDown(e: PointerEvent) {
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
  
  let titleElement

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
    <div class="knob" style="transform:rotate(calc({rotation} * 1rad))" on:pointerdown={pointerDown} >
      <svg width='100%' height='100%' viewBox="0 0 100 100">
        <g fill="none" stroke="currentColor">
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

<style>
  *{
    user-select: none;
    -webkit-tap-highlight-color:transparent;
  }
  .knob-container-container{
    aspect-ratio: 1/1;
    max-height: 50%;
    margin-top: 0.5rem;
    margin-right: 0.5rem;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    pointer-events: all;
    user-select: none;
  }
  .knob-container{
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
      var(--tertiary-color) 60deg 60deg,
      var(--darken-color) 120deg 240deg,
      var(--tertiary-color) 300deg 300deg,
      var(--secondary-color) 345deg 360deg
    );
    box-shadow: -.15em .15em .05em .02em rgba(0, 0, 0, 0.3);
    border-radius: 50%;
    border: 0.2rem solid white;
  }
  .knob-container-container>.title.menu-toggle{
    background: white;
    color: black;
  }
  .knob-container-container>.title {
    
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

  .knob {
    display: block;
    aspect-ratio: 1/1;
    height: 100%;
    /* height: 80%; */
    padding: 0;
    border-radius: 50%;
    color: var(--text-color);
    background-color: var(--tertiary-color);
    box-shadow: 0 0 .3em rgba(255, 255, 255, 0.3) inset;
    transform-origin: 50% 50%;
  }

  .knob svg{
    width: 100%;
    height: 100%;
  }
</style>