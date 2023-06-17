<main>
	<div id="bar-container">
		<div id="bar">
			<Knob bind:value={stroke_col[0]} title={'R'} />
			<Knob bind:value={stroke_col[1]} title={'G'} />
			<Knob bind:value={stroke_col[2]} title={'B'} />
			<ColourDisplay bind:colour={stroke_col} />

			<Knob bind:this={chaosKnob} bind:value={chaos} title={'Chaos'} triggerModal={openModal} modal={chaosSemiModal} />
			<BrushSizeWidget bind:brush_sz={brush_sz} canvas_res={canvasRes} bind:dragging={brushSizeWidgetDragging} bind:stopped_dragging={brushSizeWidgetStoppedDragging} />
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
			<UndoRedoWidget undo={()=>{undo_pending = true}} redo={()=>{redo_pending = true}} />
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
			<Knob bind:value={stroke_size_dynamics[0]} title={'Size min'} />
			<Knob bind:value={stroke_size_dynamics[1]} title={'Size max'} />
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
	import UndoRedoWidget from 'UndoRedoWidget.svelte'
	import ColourDisplay from 'ColourDisplay.svelte'
	import SemiModal from 'SemiModal.svelte'
	import {IO} from 'IO'
	import chroma from 'chroma-js'
	import {Hash, cos, sin, tau} from 'wmath'
	import {clamp, lerp, mod} from '@0b5vr/experimental'
	import {BrushStroke, BrushType, DrawParams, Project} from 'stuff'
	import earcut from "earcut"

	// Init
	let hash = new Hash()
	let io: IO
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
	let brushSizeWidgetStoppedDragging: boolean
	let chaosKnob: Knob
	let dynamicsKnob: Knob
	let texDynamicsKnob: Knob

	// Drawing params
	let stroke_col: Array<number> = [0.5, 0.4, 0.3, 1]
	let stroke_opacity = 0
	let brush_rot: number[] = [0, 0]
	let brush_pos: number[] = [0, 0]
	let brush_sz: number[] = [0.4, 0.05]
	let selected_brush_type: BrushType = BrushType.Blobs

	let chaos_lch: Array<number> = [0.3, 0.3, 0.5]
	let chaos_speed: number = 0.3
	let chaos: number = 0.3

	let dynamics: number = 0.3
	let stroke_opacity_dynamics: number[] = [0, 1]
	let stroke_size_dynamics: number[] = [0.7, 1]
	let rot_jitter: number = 0
	let pos_jitter: number = 0

	let tex_dynamics: number = 0.3
	let tex_lch_dynamics: number[] = [0, 0, 0.2]
	let tex_stretch: number[] = [1, 0.2]
	
	let undo_pending: boolean = false
	let redo_pending: boolean = false

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
		io = new IO()
		document.addEventListener('contextmenu', (event) => event.preventDefault())
		modals = [chaosSemiModal, dynamicsSemiModal, texDynamicsSemiModal]
	}

	onMount(async () => {
		initWebGL()
		initOtherStuff()

		//! ------------------- SHADERS
		const brush_preview_program = new ShaderProgram(
			require('./shaders/brush_preview.vert'),
			require('./shaders/brush_preview.frag'),
		)
		const draw_temp_stroke_program = new ShaderProgram(
			require('./shaders/draw_temp_stroke.vert'),
			require('./shaders/draw_temp_stroke.frag'),
		)
		const composite_temp_stroke_to_canvas_program = new ShaderProgram(
			require('./shaders/composite_temp_stroke_to_canvas.vert'),
			require('./shaders/composite_temp_stroke_to_canvas.frag'),
		)
		const brush_triangulated_program = new ShaderProgram(
			require('./shaders/brush_triangulated.vert'),
			require('./shaders/brush_triangulated.frag'),
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

		let brush_buffer = new Thing(
			[
				new VertexBuffer(4, gl.FLOAT),
				new VertexBuffer(4, gl.FLOAT),
			],
			gl.TRIANGLES,
			new ShaderProgram(require('./shaders/brush_long.vert'), require('./shaders/brush_long.frag')),
		)

		let brush_buffer_b = new Thing(
			[
				new VertexBuffer(4, gl.FLOAT),
				new VertexBuffer(4, gl.FLOAT),
			],
			gl.TRIANGLES,
			new ShaderProgram(require('./shaders/brush_long.vert'), require('./shaders/brush_long.frag')),
		)

		let t: number = 0
		let redraw_needed = false

		let redo_history_length = 0

		let project = new Project()
		let brush_stroke = new BrushStroke(selected_brush_type, new DrawParams(tex_dynamics, tex_lch_dynamics, tex_stretch))

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

		const draw_blobs_stroke = (
			_col: number[],
			_opacity: number,
			_pos: number[],
			_rot: number[],
			_sz: number[],
			_tex_lch_dynamics: number[],
			_tex_stretch: number[],
		) => {
			draw_temp_stroke_program.use()
			set_shared_uniforms(draw_temp_stroke_program, _col, t)

			draw_temp_stroke_program.setUniformVec('stroke_pos', _pos)
			draw_temp_stroke_program.setUniformVec('stroke_col', _col)
			// draw_temp_stroke_program.setUniformVec('brush_sz', brush_sz)
			draw_temp_stroke_program.setUniformVec('brush_sz', _sz)
			draw_temp_stroke_program.setUniformFloat('stroke_opacity', _opacity)
			draw_temp_stroke_program.setUniformVec('tilt', _rot)
			draw_temp_stroke_program.setUniformVec('tex_lch_dynamics', [
				_tex_lch_dynamics[0],
				_tex_lch_dynamics[1],
				_tex_lch_dynamics[2],
			])
			draw_temp_stroke_program.setUniformVec('tex_stretch', [_tex_stretch[0], _tex_stretch[1]])
			gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
		}

		const composite_stroke = () => {
			canvas_fb.start_draw()
			composite_temp_stroke_to_canvas_program.use()
			set_shared_uniforms(composite_temp_stroke_to_canvas_program, [0, 0, 0, 0], t)
			gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)

			temp_stroke_fb.clear([0, 0, 0, 0])
		}
		const fill_buff_for_long_brush = (
			brush_stroke: BrushStroke,
			brush_buffer: Thing
			)=> {
			brush_buffer.buffs[0].sz = 0
			brush_buffer.buffs[1].sz = 0
			const iters = brush_stroke.positions.length / 2 - 1
			for (let i = 0; i < iters; i++){
				// #define rot(a) mat2(cos(a),-sin(a),sin(a),cos(a))
				const get_circ_pos_from_ang = (a: number) => {
					const c = cos(-a)
					const s = sin(-a)
					return [c, s]
				}
				const add_ang_to_pos = (
					pos: number[], ang_offs: number[], positive: boolean, amt: number
				): number[] => {
					if (positive) {
						pos[0] += ang_offs[0] * amt
						pos[1] += ang_offs[1] * amt
					} else {
						pos[0] -= ang_offs[0] * amt
						pos[1] -= ang_offs[1] * amt
					}
					return pos
				}
				// brush_stroke.
				let curr_sz =  brush_stroke.sizes[i*2];
				let next_sz =  brush_stroke.sizes[i*2 + 2];

				let curr_ang = get_circ_pos_from_ang(brush_stroke.rotations[i * 2 + 1])
				let next_ang = get_circ_pos_from_ang(brush_stroke.rotations[i * 2 + 3])

				let curr_pos = [brush_stroke.positions[i * 2], brush_stroke.positions[i * 2 + 1]]
				let next_pos = [brush_stroke.positions[i * 2 + 2], brush_stroke.positions[i * 2 + 3]]

				let curr_pos_left = add_ang_to_pos([...curr_pos], curr_ang, true, curr_sz)
				let curr_pos_right = add_ang_to_pos([...curr_pos], curr_ang, false, curr_sz)

				let next_pos_left = add_ang_to_pos([...next_pos], next_ang, true, next_sz)
				let next_pos_right = add_ang_to_pos([...next_pos], next_ang, false, next_sz)

				let curr_col = [brush_stroke.colours[i * 3], brush_stroke.colours[i * 3 + 1], brush_stroke.colours[i * 3 + 2]]
				let curr_opacity = brush_stroke.opacities[i]

				let next_col = [brush_stroke.colours[i * 3 + 3], brush_stroke.colours[i * 3 + 4], brush_stroke.colours[i * 3 + 5]]
				let next_opacity = brush_stroke.opacities[i + 1]

				const curr_v = i/iters
				const next_v = (i + 1)/iters

				brush_buffer.buffs[0].push_vert([...curr_pos_left, 0, curr_v])
				brush_buffer.buffs[1].push_vert([...curr_col, curr_opacity])
				brush_buffer.buffs[0].push_vert([...curr_pos_right, 1, curr_v])
				brush_buffer.buffs[1].push_vert([...curr_col, curr_opacity])
				brush_buffer.buffs[0].push_vert([...next_pos_left, 0, next_v])
				brush_buffer.buffs[1].push_vert([...next_col, next_opacity])

				brush_buffer.buffs[0].push_vert([...curr_pos_right, 1, curr_v])
				brush_buffer.buffs[1].push_vert([...curr_col, curr_opacity])
				brush_buffer.buffs[0].push_vert([...next_pos_left, 0, next_v])
				brush_buffer.buffs[1].push_vert([...next_col, next_opacity])
				brush_buffer.buffs[0].push_vert([...next_pos_right, 1, next_v])
				brush_buffer.buffs[1].push_vert([...next_col, next_opacity])
			}

		}
		
		const draw_any_stroke = (stroke: BrushStroke)=>{
			if(stroke.brush_type === BrushType.Blobs){
				for (let i = 0; i < stroke.positions.length / 2; i++) {
					let pos = [stroke.positions[i * 2], stroke.positions[i * 2 + 1]]
					let sz = [stroke.sizes[i * 2], stroke.sizes[i * 2 + 1]]
					let col = [stroke.colours[i * 3], stroke.colours[i * 3 + 1], stroke.colours[i * 3 + 2]]
					let opacity = stroke.opacities[i]
					let rot = [stroke.rotations[i * 2], stroke.rotations[i * 2 + 1]]
					draw_blobs_stroke(
						[...col, 1],
						 opacity, 
						 pos, 
						 rot, 
						 sz,
						 stroke.draw_params.tex_lch_dynamics, 
						 stroke.draw_params.tex_stretch
					 )
				}
			} else if (stroke.brush_type === BrushType.Long){
				fill_buff_for_long_brush( stroke, brush_buffer_b)
				set_shared_uniforms(brush_buffer.shader, [0, 0, 0, 0], t)
				brush_buffer_b.upload_all_buffs()
				brush_buffer_b.draw()
			} else if (stroke.brush_type === BrushType.Tri){
				let triangles = earcut(stroke.positions)
				brush_buffer_b.buffs[0].upload_external_buff(triangles)
				brush_buffer_b.buffs[1].upload_external_buff(triangles)
				set_shared_uniforms(brush_buffer.shader, [0, 0, 0, 0], t)
				brush_buffer_b.draw_with_external_shader(brush_triangulated_program)

				// brush_buffer.buffs[0].push_vert([...curr_pos_left, 0, curr_v])
				// brush_buffer.buffs[1].push_vert([...curr_col, curr_opacity])
			}
		}

		const redraw_whole_project = () => {
			console.log('undo or redo')
			canvas_fb.clear()
			canvas_fb.pong_idx = 1 - canvas_fb.pong_idx
			canvas_fb.clear()
			canvas_fb.pong_idx = 1 - canvas_fb.pong_idx

			temp_stroke_fb.clear()

			let k = 0
			for (let stroke of project.brush_strokes) {
				if (k >= project.brush_strokes.length - redo_history_length) break
				temp_stroke_fb.start_draw()
				draw_any_stroke(stroke)
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
			if ( redo_pending || (l_shift_down && l_ctrl_down && z_just_pressed)) {
				console.log("REDOO")
				redo_history_length -= 1
				if (redo_history_length >= 0) redraw_whole_project()
				else redo_history_length = 0
			} else if (undo_pending || (l_ctrl_down && z_just_pressed)) {
				console.log("UNDOOO")
				redo_history_length += 1
				redraw_whole_project()
			}

			// ----- TEMP
			if (io.mouse_down && io.pointerType !== "touch") {
				redraw_needed = true
				if (io.mouse_just_pressed && !(redo_pending || undo_pending)) {
					brush_stroke = new BrushStroke(selected_brush_type, new DrawParams(tex_dynamics, tex_lch_dynamics, tex_stretch))
					for (let i = 0; i < redo_history_length; i++) {
						project.brush_strokes.pop()
					}
					redo_history_length = 0 
					console.log(brush_stroke)
					console.log("SET REDO HISTORY TO 0")
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

				let sz = [...brush_sz]

				let size_pressure_weight = lerp(stroke_size_dynamics[0], stroke_size_dynamics[1], io.pressure)
				let size_tilt_weight = lerp(0.4, 1, io.tilt[0]/tau)
				// TODO: sz dynamics
				sz[0] *= size_pressure_weight*size_tilt_weight
				sz[1] *= size_pressure_weight*size_tilt_weight

				brush_stroke.push_stroke(brush_pos, brush_rot, sz, stroke_opacity, col)

				temp_stroke_fb.start_draw()
				draw_any_stroke(brush_stroke)
			}
			// ----- COMPOSITE
			if (io.mouse_just_unpressed && io.pointerType !== "touch" && !(undo_pending || redo_pending)) {
				console.log(brush_stroke)
				project.push_stroke(brush_stroke)
				redraw_needed = true

				composite_stroke()
				canvas_read_tex = canvas_fb.textures[0]
			}

			if (brushSizeWidgetDragging || brushSizeWidgetStoppedDragging) redraw_needed = true

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

			}
			if (gl.getError() !== 0) {
				console.log(gl.getError())
			}
			brushSizeWidgetStoppedDragging = false
			redo_pending = false
			undo_pending = false
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
