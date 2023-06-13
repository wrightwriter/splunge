<main>
	<div id="error">{error}</div>

  {#if !webAudioInitialized}
    <div id="modal">
      <div>Please click so web audio can awake</div>
    </div>
  {/if}
	<div id="bar">
		<!-- svelte-ignore missing-declaration -->
		<Knob bind:this={knob_components['1']} bind:value={knobs[0]} />
		<Knob bind:this={knob_components['2']} bind:value={knobs[1]} />
		<Knob bind:this={knob_components['3']} bind:value={knobs[2]} />
		<Knob bind:this={knob_components['4']} bind:value={knobs[3]} />
		<Indicators bind:this={indicators_component} bind:outputs={indicators_outputs} />
		<PlayButton bind:paused={paused} bind:this={playButton} />
	</div>
	<div id="monaco" bind:this={editorContainer} />
	{@html `<style> #bar>*:last-of-type{margin-left:auto; padding-right: 4rem;} </style>`}
</main>

<script lang="ts">
	// import type monaco from 'monaco-editor';
	import {onMount} from 'svelte'
	import {onDestroy} from 'svelte'
	import * as Monaco from 'monaco-editor/esm/vs/editor/editor.api'
	import {_monaco} from 'store'
	import {get} from 'svelte/store'
	import initMonaco from 'initMonaco'
	// import ts, { Diagnostic } from "typescript";
	// import internal from 'stream'
	// import Test from 'Test.svelte'

	import Knob from 'Knob.svelte'
	import PlayButton from 'PlayButton.svelte'
	import Indicators from 'Indicators.svelte'
	// console.log(Knob)

	export let monaco: typeof Monaco
	// const eslint = require('eslint');
	// import eslint from 'eslint';
	// const { Linter } = eslint;
	// const linter = new Linter();

	let loops: Array<Function> = []
	let timeouts: Array<NodeJS.Timeout> = []
	let intervals: Array<NodeJS.Timeout> = []

	const NOTE_ON = 144
	const NOTE_OFF = 128

	let playButton: PlayButton

	// @ts-ignore
	const knob_components: {string: Knob} = {}
	const knobs: Array<number> = [0, 0, 0, 0]

	let indicators_component: Indicators
	let indicators_outputs: Array<Array<boolean>>

	let js_code = ''

	// @ts-ignore
	let editorContainer: HTMLElement
	let error: any = ''

	let webAudio: AudioContext
  let webAudioInitialized: boolean = false

	let midiAccess: MIDIAccess
	let outputs: Array<MIDIOutput> = []
	let inputs: Array<MIDIInput> = []
  
  const webAudioAwakeListener = async (e)=>{
    if(webAudio.state === "suspended"){
      await webAudio.resume()
      webAudioInitialized = true
    }
  }
  document.addEventListener( "click",  webAudioAwakeListener)

  $: {
    if(webAudioInitialized)
      document.removeEventListener("click", webAudioAwakeListener)
  }

	async function initMidi() {
		midiAccess = await navigator.requestMIDIAccess()
		let i = 0
		for (const output of midiAccess.outputs.values()) {
			outputs.push(output)
			i++
			console.log(output)
		}
		i = 0
		for (const input of midiAccess.inputs.values()) {
			inputs.push(input)

			let input_idx = i
			input.onmidimessage = (event) => {
				const command = event.data[0]
				if (indicators_outputs) {
					if (command == NOTE_ON) indicators_outputs[input_idx][0] = true
					else if (command == NOTE_OFF) indicators_outputs[input_idx][0] = false
					else if (command >= NOTE_OFF && command <= NOTE_OFF + 16) {
						indicators_outputs[input_idx][command - NOTE_OFF] = false
					} else if (command >= NOTE_ON && command <= NOTE_ON + 16) {
						indicators_outputs[input_idx][command - NOTE_ON] = true
					}
				}
			}

			// }
			i++
			console.log(input)
		}
		if (i == 0) alert('No midi inputs')
	}

	const play = (ch: number, t: number, note: number, len: number = 0.2, vel: number = 1) => {
		if (t < 0) return
		vel = Math.min(vel, 127)
		note = Math.min(note, 127)
		let timeout_start = setTimeout(() => {
			outputs[0].send([NOTE_ON + ch, 41 + note, vel * 127])
			let timeout_stop = setTimeout(() => {
				outputs[0].send([NOTE_OFF + ch, 41 + note, vel * 127])
				timeouts.splice(timeouts.indexOf(timeout_stop), 1)
			}, 1000 * len)
			timeouts.splice(timeouts.indexOf(timeout_start), 1)
			timeouts.push(timeout_stop)
		}, 1000 * t)
		timeouts.push(timeout_start)
		// setTimeout(()=>{
		//   outputs[ch].send([NOTE_OFF, 41 + note, 0x7f]);
		// }, 60*1000*(t+len))
	}

	const code_prepend = `
    const BPM = 128;
    const beat = (60./BPM);
    const bar = beat*4;
    const msr = 16*bar;
    const qbeat = (beat/4);
    class Loop{
        play(a,b,c,d,e){
          // console.log("OFFS IS")
          // console.log(this.offs)
            play(a,b - this.offs*0,c,d,e)
        }
        constructor(t,init,cb){
            this.t = t; this.offs = 0
            this.it = 0
            this.cb = ()=>{cb.bind(this)(); this.it++}
            if(init)
                init()
        }
    }
    `

	function reset_everything() {
		indicators_outputs?.forEach((output, idx, v) => {
			output?.forEach((e, idx) => {
				output[idx] = false
			})
		})

		for (let timeout of timeouts) {
			clearTimeout(timeout)
		}
		timeouts.length = 0
		for (let output of outputs) {
			for (let i = 0; i < 128; i++) {
        for (let k = 0; k < 16; k++) {
          output.send([NOTE_OFF + k, i, 0x7f])
        }
			}
		}
		loops.length = 0
		for (let interval of intervals) {
			clearInterval(interval)
		}
		intervals.length = 0
		let fn = new Function('webAudio', 'intervals', 'loops', 'play', 'knobs', code_prepend + js_code)
		fn(webAudio, intervals, loops, play, knobs)

		intervals.length = loops.length
	}

	function try_start_playback() {
		try {
			reset_everything()
			let i = 0
			for (let loop of loops) {
				console.log(loop)
				// @ts-ignore
				let loop_t: number = loop.t
				let t_offs = webAudio.currentTime % loop_t
				let t_left = loop_t - t_offs
				// @ts-ignore
				// loop.offs = t_offs
				loop.offs = t_offs
				// @ts-ignore
				loop.cb()
				// @ts-ignore
				// console.log(webAudio.currentTime)
				// console.log(loop.t)
        console.log("OFFS SHOULD BE")
        // console.log()
				console.log(t_offs)
				// console.log(t_left)
				let _i = i

        let timeout_t = t_left
				timeouts.push(
					setTimeout(() => {
            console.log("START BAR")
            console.log(timeout_t)
						// @ts-ignore
            loop.offs = 0
						// @ts-ignore
            loop.cb()
						intervals[_i] = setInterval(() => {
							// @ts-ignore
							loop.cb()
						}, loop_t * 1000)
					}, timeout_t * 1000),
				)
				i+=1
			}
		} catch (_error) {
			// debugger;
			console.log(_error)
			// @ts-ignore
			console.log(_error.lineNumber)
			// @ts-ignore
			console.log(_error.stack.split('\n')[4])
			alert(_error)
			error = _error
		}
	}

	onMount(async () => {
		webAudio = new AudioContext()
		intervals = []
		loops = []

		// @ts-ignore
		// window.timeouts = timeouts

		await initMidi()

		let succ_compile = true

		function get_code(editor: Monaco.editor.IStandaloneCodeEditor) {
			let ts_code = editor.getValue()
			let js_code = ts_code
			return js_code
		}

		function try_compile(js_code: string, model: Monaco.editor.ITextModel): Worker {
			const worker_code =
				`
          const webAudio = { currentTime: 0 };
          const intervals = [];
          const loops = []; const play = (ch, t, note, len = 0.2, vel = 128)=>{}; const knobs = [0,0,0,0]
        ` +
				code_prepend +
				js_code

			const worker = new Worker(URL.createObjectURL(new Blob([worker_code])))
			worker.onerror = (e) => {
				// error while compiling code
				let line = e.lineno - 4 - 7 - 14
				monaco.editor.setModelMarkers(model, 'owner', [
					{
						startLineNumber: line,
						startColumn: e.colno,
						endLineNumber: line,
						endColumn: model.getLineMaxColumn(line),
						message: e.message,
						severity: e.type === 'error' ? monaco.MarkerSeverity.Error : monaco.MarkerSeverity.Warning,
					},
				])
				error = line + ': ' + e.message
				console.log(e)
				succ_compile = false

				worker.terminate()
				e.preventDefault()
			}
			return worker
		}

		let [_monaco, vimContext] = await initMonaco(editorContainer, async (editor, monaco) => {
			error = ''
			const model = monaco.editor.getModels()[0]
			monaco.editor.setModelMarkers(model, 'owner', [])
			js_code = get_code(editor)

			let worker = try_compile(js_code, model)

			setTimeout(() => {
				try {
					worker.terminate()
				} catch (e) {}

				if (succ_compile) {
					error = ''
					try_start_playback()
				}
			}, 200)
		})
		monaco = _monaco
	})

	let paused = false

	$: {
		// if(playButton){
		if (paused) {
			reset_everything()
		} else {
			try_start_playback()
		}
	}

	onDestroy(() => {
		monaco?.editor.getModels().forEach((model) => model.dispose())
	})
	// let knobs: Array<Knob> = [0,0,0,0]
</script>

<style lang="scss">
	.knob-container {
		padding: 1rem 0rem;
	}
	* {
		* {
			color: white;
			font-family: 'Jetbrains Mono';
		}
		#bar {
			background: black;
			width: 100%;
			height: 100px;
			display: flex;
			padding: 0rem 1rem;
			align-items: center;
			> *:last-of-type {
				margin-left: auto;
				margin-right: 0px;
			}
			// :last-child{
			// }
		}

		// div#bar>*:last-of-type{

		#error {
			font-size: 0.78rem;
			background-color: rgb(136, 18, 10);
		}
	}
	/* #bottom *{
  } */
	#monaco {
		width: 100%;
		height: 100%;
	}

	main {
		width: 100%;
		height: 100%;
		display: flex;
		flex-direction: column;
	}

	h1 {
		color: #ff3e00;
		text-transform: uppercase;
		font-size: 4em;
		font-weight: 100;
	}

	@media (min-width: 640px) {
		main {
			max-width: none;
		}
	}
  #modal {
    position: absolute;
    width: 100%;
    height: 100%;
    display: flex;
    z-index: 99999;
    justify-content: center;
    backdrop-filter: blur(20px);
    >div{
      margin: auto;
    }
  }
</style>
