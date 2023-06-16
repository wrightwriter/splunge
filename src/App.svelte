<main>
	<div id="bar-container">
		<div id="bar">
			<Knob bind:value={stroke_col[0]} title={'R'} />
			<Knob bind:value={stroke_col[1]} title={'G'} />
			<Knob bind:value={stroke_col[2]} title={'B'} />
			<ColourDisplay bind:colour={stroke_col} />

			<Knob bind:this={chaosKnob} bind:value={chaos} title={'Chaos'} triggerModal={openModal} modal={chaosSemiModal} />
			<BrushSizeWidget bind:brush_sz={brush_sz} canvas_res={canvasRes} />
			<Knob
				bind:this={dynamicsKnob}
				bind:value={dynamics}
				title={'Dynamics'}
				triggerModal={openModal}
				modal={dynamicsSemiModal} />
			<Knob
				bind:this={texDynamicsKnob}
				bind:value={tex_dynamics}
				title={'Tex'}
				triggerModal={openModal}
				modal={texDynamicsSemiModal} />
			<BrushTypeWidget bind:selected_brush_type={selected_brush_type} />
		</div>
		<SemiModal bind:this={chaosSemiModal} knob={chaosKnob}>
			<Knob bind:value={chaos_lch[0]} title={'Chaos L'} />
			<Knob bind:value={chaos_lch[1]} title={'Chaos C'} />
			<Knob bind:value={chaos_lch[2]} title={'Chaos H'} />
			<Knob bind:value={chaos_speed} title={'Chaos Speed'} />
		</SemiModal>
		<SemiModal bind:this={dynamicsSemiModal} knob={dynamicsKnob}>
			<Knob bind:value={stroke_opacity_dynamics[0]} title={'Opacity min'} />
			<Knob bind:value={stroke_opacity_dynamics[1]} title={'Opacity max'} />
			<Knob bind:value={rot_jitter} title={'Rot jitt'} />
			<Knob bind:value={pos_jitter} title={'Pos jitt'} />
		</SemiModal>
		<SemiModal bind:this={texDynamicsSemiModal} knob={texDynamicsKnob}>
			<Knob bind:value={tex_lch_dynamics[0]} title={'Tex V'} />
			<Knob bind:value={tex_lch_dynamics[1]} title={'Tex S'} />
			<Knob bind:value={tex_lch_dynamics[2]} title={'Tex H'} />
			<Knob bind:value={tex_stretch[0]} title={'Stretch X'} />
			<Knob bind:value={tex_stretch[1]} title={'Stretch Y'} />
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

	import {Texture, Framebuffer, ShaderProgram, init_utils, resizeIfNeeded, finish_frame, Thing, VertexBuffer} from './gl_utils'

	import Knob from 'Knob.svelte'
	import BrushSizeWidget from 'BrushSizeWidget.svelte'
	import BrushTypeWidget from 'BrushTypeWidget.svelte'
	import ColourDisplay from 'ColourDisplay.svelte'
	import SemiModal from 'SemiModal.svelte'
	import {IO} from 'IO'
	import chroma from 'chroma-js'
	import {Hash} from 'wmath'
	import {clamp, lerp, mod} from '@0b5vr/experimental'
	import { type } from 'os'
	import { BrushStroke, BrushType, DrawParams, Project } from 'stuff'

	// Init
	let hash = new Hash()
	let io = new IO()
	let gl: WebGL2RenderingContext
	let zoom = 1
	let userAgentRes: Array<number> = [0, 0]
	let canvasRes: Array<number> = [512 * 2, 512 * 2]
	let default_framebuffer: Framebuffer

	// Elements
	let canvasElement: HTMLCanvasElement
	let chaosSemiModal: SemiModal
	let dynamicsSemiModal: SemiModal
	let texDynamicsSemiModal: SemiModal
	let modals: SemiModal[] = []
	let brushSizeWidgetDragging: boolean
	let chaosKnob: Knob
	let dynamicsKnob: Knob
	let texDynamicsKnob: Knob

	// Drawing params
	let stroke_col: Array<number> = [0.5, 0.4, 0.3, 1]
	let stroke_opacity = 0
	let brush_rot: number[] = [0,0]
	let brush_pos: number[] = [0,0]
	let brush_sz: number[] = [0.4, 0.05]
	let selected_brush_type: BrushType = BrushType.Blobs

	let chaos_lch: Array<number> = [0.3, 0.3, 0.5]
	let chaos_speed: number = 0.3
	let chaos: number = 0.3

	let dynamics: number = 0.3
	let stroke_opacity_dynamics: number[] = [0, 1]
	let rot_jitter: number = 0
	let pos_jitter: number = 0

	let tex_dynamics: number = 0.3
	let tex_lch_dynamics: number[] = [0., 0., 0.2]
	let tex_stretch: number[] = [1, 0.2]

	const openModal = (modal: SemiModal) => {
		for (let m of modals) {
			if (m === modal) {
				if (m.hidden) {
					m.hidden = false
					m.knob.modalHidden = false
				} else {
					m.hidden = true
					m.knob.modalHidden = true
				}
			} else {
				// m.hide()
				m.hidden = true
				m.knob.modalHidden = true
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


		gl.disable(gl.CULL_FACE)
		gl.disable(gl.DEPTH_TEST)
		// gl.enable(gl.BLEND)
	}
	const initOtherStuff = () => {
		document.addEventListener('contextmenu', (event) => event.preventDefault())
		modals = [chaosSemiModal, dynamicsSemiModal, texDynamicsSemiModal]
	}

	onMount(async () => {
		initWebGL()
		initOtherStuff()

		//! ------------------- BRUSH PREVIEW
		const brush_preview_program = new ShaderProgram(
			require('./shaders/brush_preview.vert'),
			require('./shaders/brush_preview.frag'),
		)
		//! ------------------- TEMP STROKE
		const draw_temp_stroke_program = new ShaderProgram(
			require('./shaders/draw_temp_stroke.vert'),
			require('./shaders/draw_temp_stroke.frag'),
		)
		//! ------------------- COMPOSITE TEMP STROKE
		const composite_temp_stroke_to_canvas_program = new ShaderProgram(
			require('./shaders/composite_temp_stroke_to_canvas.vert'),
			require('./shaders/composite_temp_stroke_to_canvas.frag'),
		)
		//! ------------------- POST
		const post_canvas_program = new ShaderProgram(require('./shaders/post_canvas.vert'), require('./shaders/post_canvas.frag'))

		default_framebuffer.start_draw()
		default_framebuffer.clear([0, 0, 0, 1])

		const canvas_tex = new Texture([canvasRes[0], canvasRes[1]])
		const canvas_fb = new Framebuffer([canvas_tex], true)
		canvas_fb.clear([0, 0, 0, 0])

		const temp_tex = new Texture([canvasRes[0], canvasRes[1]])
		const temp_stroke_fb = new Framebuffer([temp_tex])
		temp_stroke_fb.clear([0, 0, 0, 0])

		let frame = 0
		let canvas_read_tex = canvas_fb.textures[0]
		
		let thing = new Thing(
			[
				new VertexBuffer(4, gl.FLOAT)
			], 
			gl.TRIANGLES,
			new ShaderProgram(
				require('./shaders/brush_long.vert'),
				require('./shaders/brush_long.frag'),
			)
		)
		thing.buffs[0].push_vert([-1,-1,0,0])
		thing.buffs[0].push_vert([1,-1,0,0])
		thing.buffs[0].push_vert([0,1,0,0])
		thing.buffs[0].upload()

		let t: number = 0
		let redraw_needed = false
		
		let redo_history_length = 0
		
		let project = new Project()
		let brush_stroke = new BrushStroke(
			selected_brush_type, 
			new DrawParams(
				tex_dynamics,
				tex_lch_dynamics,
				tex_stretch
			)
		)


		const set_shared_uniforms = (program: ShaderProgram, col: number[], t: number) => {
			program.setUniformFloat('time', t)
			program.setUniformInt('frame', frame)
			program.setUniformVec('R', userAgentRes)
			program.setUniformVec('canvasR', canvasRes)
			program.setUniformVec('stroke_pos', brush_pos)
			program.setUniformVec('stroke_col', col)
			program.setUniformVec('brush_sz', brush_sz)
			program.setUniformFloat('stroke_opacity', stroke_opacity)
			program.setUniformVec('tilt', brush_rot)
			program.setUniformFloat('pressure', io.pressure)
			program.setUniformInt('mouse_down', io.mouse_down ? 1 : 0)
			program.setUniformInt('frame', frame)
			program.setUniformTexture('canvas', canvas_fb.textures[0], 0)
			program.setUniformTexture('temp_tex', temp_tex, 1)
			program.setUniformTexture('canvas_back', canvas_fb.back_textures[0], 2)
			program.setUniformTexture('canvas_read', canvas_read_tex, 3)
		}
		

		const draw_stroke = (
			_col: number[],
			_opacity: number,
			_pos: number[],
			_rot: number[],
			_tex_lch_dynamics: number[],					
			_tex_stretch: number[]
		)=>{
			temp_stroke_fb.start_draw()
			draw_temp_stroke_program.use()
			set_shared_uniforms(draw_temp_stroke_program, _col, t)

			draw_temp_stroke_program.setUniformVec('stroke_pos', _pos)
			draw_temp_stroke_program.setUniformVec('stroke_col', _col)
			draw_temp_stroke_program.setUniformVec('brush_sz', brush_sz)
			draw_temp_stroke_program.setUniformFloat('stroke_opacity', _opacity)
			draw_temp_stroke_program.setUniformVec('tilt', _rot)
			draw_temp_stroke_program.setUniformVec('tex_lch_dynamics', [
				_tex_lch_dynamics[0],
				_tex_lch_dynamics[1],
				_tex_lch_dynamics[2],
			])
			draw_temp_stroke_program.setUniformVec('tex_stretch', [
				_tex_stretch[0],
				_tex_stretch[1],
			])
			gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
		}

		const composite_stroke = ()=>{
			canvas_fb.start_draw()
			composite_temp_stroke_to_canvas_program.use()
			set_shared_uniforms(composite_temp_stroke_to_canvas_program, [0, 0, 0, 0], t)
			gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)

			temp_stroke_fb.clear([0, 0, 0, 0])
		}

		const redraw_whole_project = ()=>{
			console.log("undo")
			canvas_fb.clear()
			canvas_fb.pong_idx = 1 - canvas_fb.pong_idx
			canvas_fb.clear()
			canvas_fb.pong_idx = 1 - canvas_fb.pong_idx

			temp_stroke_fb.clear()

			let k = 0
			for(let stroke of project.brush_strokes){
				if(k >=	project.brush_strokes.length - redo_history_length )
					break
				for(let i = 0; i < stroke.positions.length/2 ; i++){
					let pos = [stroke.positions[i*2], stroke.positions[i*2 + 1]]
					let col = [stroke.colours[i*3], stroke.colours[i*3 + 1], stroke.colours[i*3 + 2]]
					let opacity = stroke.opacities[i]
					let rot = [stroke.rotations[i*2], stroke.rotations[i*2 + 1]]
					draw_stroke(
						[...col,1],opacity,pos,rot,
						stroke.draw_params.tex_lch_dynamics,
						stroke.draw_params.tex_stretch
					)
				}
				composite_stroke()
				canvas_read_tex = canvas_fb.textures[0]
				canvas_fb.pong_idx = 1 - canvas_fb.pong_idx
				canvas_fb.needs_pong = false
				k++
			}
			canvas_read_tex = canvas_fb.back_textures[0]

			redraw_needed = true
		}
		
		const draw = (_t: number) => {
			redraw_needed = false
			if (frame === 0) redraw_needed = true
			t = _t / 1000
			resizeIfNeeded(canvasElement, default_framebuffer, userAgentRes, (v: boolean) => {
				redraw_needed = v
			})

			io.tick()
			
			let l_ctrl_down = io.getKey('ControlLeft').down
			let l_shift_down = io.getKey('ShiftLeft').down
			let z_just_pressed = io.getKey('KeyZ').just_pressed
			if(l_shift_down && l_ctrl_down && z_just_pressed){
				redo_history_length -= 1
				if(redo_history_length >= 0)
					redraw_whole_project()
				else 
					redo_history_length = 0
			} else if (l_ctrl_down && z_just_pressed){
				redo_history_length += 1
				redraw_whole_project()
			}

			// ----- TEMP
			if (io.mouse_down) {
				redraw_needed = true
				if(io.mouse_just_pressed){
					brush_stroke = new BrushStroke(
						selected_brush_type,
						new DrawParams(
							tex_dynamics,
							tex_lch_dynamics,
							tex_stretch
						)
					)
					for(let i = 0; i < redo_history_length; i++){
						project.brush_strokes.pop()
					}
					redo_history_length = 0
					console.log(brush_stroke)
				}
				
				brush_rot = [...io.tilt]
				brush_pos = [...io.mouse_pos]

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
					col[1] += hash.valueNoiseSmooth(t * 100 * chaos_speed + 100, 2) * chaos * chaos_lch[1]
					col[2] += hash.valueNoiseSmooth(t * 100 * chaos_speed + 200, 2) * 300 * chaos * chaos_lch[2]
					col[0] = clamp(col[0], 0, 1)
					col[1] = clamp(col[1], 0, 1)
					col[2] = mod(col[2], 360)

					col = chroma_oklch(col).gl()
				}
				{
					stroke_opacity = lerp(stroke_opacity_dynamics[0], stroke_opacity_dynamics[1], io.pressure)
				}

				brush_pos[0] += pos_jitter * (2 * hash.valueNoiseSmooth(t * 100 + 251, 2) - 1)
				brush_pos[1] += pos_jitter * (2 * hash.valueNoiseSmooth(t * 100 + 1251, 2) - 1)
				
				brush_rot[1] += rot_jitter * (2 * hash.valueNoiseSmooth(t * 10 + 100, 2) - 1)
				

				brush_stroke.push_stroke(
					brush_pos,
					brush_rot,
					stroke_opacity,
					col
				)
				
				draw_stroke(
					col,
					stroke_opacity,
					brush_pos,
					brush_rot,
					tex_lch_dynamics,
					tex_stretch
				)
			}
			// ----- COMPOSITE
			if (io.mouse_just_unpressed) {
				console.log(brush_stroke)
				project.push_stroke(brush_stroke)
				redraw_needed = true

				composite_stroke()
				canvas_read_tex = canvas_fb.textures[0]
			}

			// redraw_needed = true

			if (brushSizeWidgetDragging) redraw_needed = true


			// redraw_needed = true
			// ----- REDRAW
			if (redraw_needed) {
				default_framebuffer.clear([0, 0, 0, 1])
				default_framebuffer.start_draw()

				post_canvas_program.use()
				set_shared_uniforms(post_canvas_program, [0, 0, 0, 0], t)
				gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)

				if (brushSizeWidgetDragging) {
					brush_preview_program.use()
					set_shared_uniforms(brush_preview_program, [0, 0, 0, 0], t)
					gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
				}
				
				set_shared_uniforms(thing.shader, [0,0,0,0], t)
				thing.draw()

				// gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
			}
			if (gl.getError() !== 0) {
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
		#bar-container {
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
			display: block;
			margin: auto;
			padding: 0;
			// background-color: red;
		}
	}
</style>
