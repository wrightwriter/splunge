<main>
	<div id="bar-container">
		<div id="bar">
			<Knob bind:value={stroke_col[0]} title={"R"} />
			<Knob bind:value={stroke_col[1]} title={"G"} />
			<Knob bind:value={stroke_col[2]} title={"B"} />
			<ColourDisplay bind:colour={stroke_col} />

			<Knob bind:value={chaos} title={"Chaos"} triggerModal={(modal)=>{openModal(modal)}} modal={chaosSemiModal} />
			<BrushSizeWidget bind:dragging={brushSizeWidgetDragging} bind:brush_sz={brush_sz} canvas_res={canvasRes} />
		</div>
		<SemiModal bind:this={chaosSemiModal}>
			<Knob bind:value={chaos_lch[0]} title={"Chaos L"} />
			<Knob bind:value={chaos_lch[1]} title={"Chaos C"} />
			<Knob bind:value={chaos_lch[2]} title={"Chaos H"} />
			<Knob bind:value={chaos_speed} title={"Chaos Speed"} />
		</SemiModal>
	</div>
	<!-- {@html `<style> #bar>*:last-of-type{margin-left:auto; padding-right: 4rem;} </style>`}  -->
	<canvas id="canvas" bind:this={canvasElement} />
</main>

<script lang="ts">
	// import type monaco from 'monaco-editor';
	import {onMount} from 'svelte'
	import {onDestroy} from 'svelte'
	import {get} from 'svelte/store'

	import {Texture, Framebuffer, ShaderProgram, init_utils, resizeIfNeeded, finish_frame} from './gl_utils'

	import Knob from 'Knob.svelte'
	import BrushSizeWidget from 'BrushSizeWidget.svelte'
	import ColourDisplay from 'ColourDisplay.svelte'
	import SemiModal from 'SemiModal.svelte'
	import {IO} from 'IO'
	import chroma from 'chroma-js'
	import {Hash} from 'wmath'
	import {clamp, mod} from '@0b5vr/experimental'


	// Init
	let hash = new Hash()
	let io = new IO()
	let gl: WebGL2RenderingContext
	let zoom = 1
	let userAgentRes: Array<number> = [0, 0]
	let default_framebuffer: Framebuffer

	// Elements
	let canvasElement: HTMLCanvasElement
	let chaosSemiModal: SemiModal
	let modals: SemiModal[] = []
	let brushSizeWidgetDragging: boolean


	// Drawing params
	let stroke_col: Array<number> = [0.5, 0.4, 0.3, 1]
	let chaos_lch: Array<number> = [0.3, 0.3, 0.5]
	let chaos_speed: number = 0.3
	let chaos: number = 0.3
	let brush_sz: number[] = [0.2,0.2]
	let canvasRes: Array<number> = [512 * 2, 512 * 2]

  
	const openModal = (modal: SemiModal) => {
		for (let m of modals) {
			if (m === modal) {
				if (m.hidden) {
					m.hidden = false
				} else {
					m.hidden = true
				}
			} else {
				// m.hide()
				m.hidden = true
			}
		}
	}

	const initWebGL = () => {
		//@ts-ignore
		window.gl = gl = canvasElement.getContext('webgl2', {
			preserveDrawingBuffer: true,
			alpha: false,
		})
		userAgentRes = [canvasElement.clientWidth, canvasElement.clientWidth]
		init_utils()

		default_framebuffer = Object.create(Framebuffer.prototype)
		default_framebuffer.default = true
		default_framebuffer.pongable = false
		default_framebuffer.needs_pong = false
		default_framebuffer.pong_idx = 0
		// @ts-ignore
		default_framebuffer._fb = null
		// @ts-ignore
		default_framebuffer._textures = [Object.create(Texture.prototype)]
		default_framebuffer.textures[0].res = [...userAgentRes]

		resizeIfNeeded(canvasElement, default_framebuffer, userAgentRes, (e) => {})

		gl.disable(gl.DEPTH_TEST)
		// gl.enable(gl.BLEND)
	}
	const initOtherStuff = () => {
		document.addEventListener('contextmenu', event => event.preventDefault());
		modals = [chaosSemiModal]
	}

	const vs_prepend_includes: string = require("./shaders/vs_prepend_includes.glsl")

	const fs_prepend_includes: string = require("./shaders/fs_prepend_includes.glsl")

	const vs_prepend: string = require("./shaders/vs_prepend.glsl")

	onMount(async () => {
		initWebGL()
		initOtherStuff()

		//! ------------------- BRUSH PREVIEW
		const brush_preview_program = new ShaderProgram(
			require("./shaders/brush_preview.vert")
		,
			require("./shaders/brush_preview.frag")
		,
		)
		//! ------------------- TEMP STROKE
		const draw_temp_stroke_program = new ShaderProgram(
			require("./shaders/draw_temp_stroke.vert"),
			require("./shaders/draw_temp_stroke.frag"),
		)
		

		//! ------------------- COMPOSITE TEMP STROKE
		const composite_temp_stroke_to_canvas_program = new ShaderProgram(
			// vs
			require("./shaders/composite_temp_stroke_to_canvas.vert"),
			// fs
			require("./shaders/composite_temp_stroke_to_canvas.frag"),
		)

		//! ------------------- POST
		const post_canvas_program = new ShaderProgram(
			require("./shaders/post_canvas.vert"),
			require("./shaders/post_canvas.frag"),
		)
		default_framebuffer.start_draw()
		default_framebuffer.clear([0, 0, 0, 1])

		const canvas_tex = new Texture([canvasRes[0], canvasRes[1]])
		const canvas_fb = new Framebuffer([canvas_tex], true)
		canvas_fb.clear([0, 0, 0, 0])

		const temp_tex = new Texture([canvasRes[0], canvasRes[1]])
		const temp_stroke_fb = new Framebuffer([temp_tex])
		temp_stroke_fb.clear([0, 0, 0, 0])

		let frame = 0
		
		const set_shared_uniforms = (program: ShaderProgram, col: number[], t: number) => {
			program.setUniformFloat('time', t)
			program.setUniformVec('R', userAgentRes)
			program.setUniformVec('canvasR', canvasRes)
			program.setUniformVec('stroke_pos', io.mouse_pos)
			program.setUniformVec('stroke_col', col)
			program.setUniformVec('brush_sz', brush_sz)
			program.setUniformFloat('pressure', io.pressure)
			program.setUniformVec('tilt', io.tilt)
			program.setUniformInt('mouse_down', io.mouse_down ? 1 : 0)
			program.setUniformInt('frame', frame)
			program.setUniformTexture('canvas', canvas_fb.textures[0], 0)
			program.setUniformTexture('temp_tex', temp_tex, 1)
			program.setUniformTexture('canvas_back', canvas_fb.back_textures[0], 2)
		}
		const draw = (t: number) => {
			let redraw_needed = false
			if (frame === 0) redraw_needed = true
			t = t / 1000
			resizeIfNeeded(canvasElement, default_framebuffer, userAgentRes, (v: boolean) => {
				redraw_needed = v
			})

			io.tick()

			// ----- TEMP
			if (io.mouse_down) {
				redraw_needed = true
				let col = [...stroke_col]

				{
					const chroma_gl = (col: number[]) => {
						return chroma.gl(col[0], col[1], col[2])
					}
					const chroma_oklch = (col: number[]) => {
						return chroma.oklch(col[0], col[1], col[2])
					}

					col = chroma_gl(col).oklch()
					// col[2] = (t*300)%300
					col[0] += hash.valueNoiseSmooth(t * 100 * chaos_speed, 2) * chaos * chaos_lch[0]
					col[1] += hash.valueNoiseSmooth(t * 100 * chaos_speed, 2) * chaos * chaos_lch[1]
					col[2] += hash.valueNoiseSmooth(t * 100 * chaos_speed, 2) * 300 * chaos * chaos_lch[2]
					col[0] = clamp(col[0], 0, 1)
					col[1] = clamp(col[1], 0, 1)
					col[2] = mod(col[2], 360)

					col = chroma_oklch(col).gl()
				}

				{
					temp_stroke_fb.start_draw()
					draw_temp_stroke_program.use()
					set_shared_uniforms(draw_temp_stroke_program, col, t);
					gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
				}
			}
			// ----- COMPOSITE
			if (io.mouse_just_unpressed) {
				redraw_needed = true
				canvas_fb.start_draw()
				composite_temp_stroke_to_canvas_program.use()
				set_shared_uniforms(composite_temp_stroke_to_canvas_program, [0,0,0,0], t);
				gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
				
				temp_stroke_fb.clear([0,0,0,0])
			}

			redraw_needed = true

			if(brushSizeWidgetDragging)
				redraw_needed = true
			
			// ----- REDRAW
			if (redraw_needed) {
				default_framebuffer.clear([0, 0, 0, 1])
				default_framebuffer.start_draw()
				// console.log("COMPOSITED")

				post_canvas_program.use()
				set_shared_uniforms(post_canvas_program, [0,0,0,0], t);
				gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
				
				if(brushSizeWidgetDragging){
					brush_preview_program.use()
					set_shared_uniforms(brush_preview_program, [0,0,0,0], t);
					gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
				}


				// gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
			}
			if(gl.getError() !== 0){
				console.log(gl.getError())
			}

			io.tick_end()
			frame++
			finish_frame()
			requestAnimationFrame(draw)
		}
		;(() => {
			draw(0)
		})()
	})

	$: {
	}

	onDestroy(() => {})
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
	}
	main {
		width: 100%;
		height: 100%;
		display: flex;
		flex-direction: column;
		#bar-container{
			width: 100%;
			position: absolute;
			display: flex;
			flex-direction: column;
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
		}
		canvas {
			width: 100%;
			height: 100%;
			display : block;
			margin: auto;
			padding: 0;
			// background-color: red;
		}

	}
</style>
