<main>
	<div id="bar-container">
		<div id="bar">
			<Knob bind:value={stroke_col[0]} title={'R'} />
			<Knob bind:value={stroke_col[1]} title={'G'} />
			<Knob bind:value={stroke_col[2]} title={'B'} />
			<ColourDisplay bind:colour={stroke_col} />

			<Knob bind:this={chaosKnob} bind:value={chaos} title={'Chaos'} triggerModal={openModal} modal={chaosSemiModal} />
			<BrushSizeWidget
				bind:brush_sz={brush_sz}
				canvas_res={canvasRes}
				bind:dragging={brushSizeWidgetDragging}
				bind:stopped_dragging={brushSizeWidgetStoppedDragging} />
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
			<UndoRedoWidget
				undo={() => {
					undo_pending = true
				}}
				redo={() => {
					redo_pending = true
				}} />
			<GalleryWidget
				bind:current_project={project}
				get_current_canvas_as_image={() => {
					let img = canvas_read_tex.read_back_image(true)
					return img
				}} />
			<PickColourWidget
				pick_from_canvas={() => pick_from_canvas()}
				bind:picking={picking}
				bind:just_finished_pick={just_finished_pick} />
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

<svelte:head>
	<!-- <script async defer src="https://apis.google.com/js/api.js" on:load={handleGApiLoad}></script> -->
	<!-- <script async defer src="https://accounts.google.com/gsi/client" on:load={handleGLClientLoad}></script> -->
</svelte:head>

<script lang="ts">
	// import type monaco from 'monaco-editor';
	import {onMount} from 'svelte'
	import {onDestroy} from 'svelte'
	import {get, writable} from 'svelte/store'

	import {Texture, Framebuffer, ShaderProgram, init_utils, resizeIfNeeded, finish_frame, Thing, VertexBuffer} from 'gl_utils'

	import Knob from './Knob.svelte'
	import BrushSizeWidget from './BrushSizeWidget.svelte'
	import BrushTypeWidget from './BrushTypeWidget.svelte'
	import UndoRedoWidget from './UndoRedoWidget.svelte'
	import GalleryWidget from './GalleryWidget.svelte'
	import PickColourWidget from './PickColourWidget.svelte'

	import ColourDisplay from './ColourDisplay.svelte'
	import SemiModal from './SemiModal.svelte'
	import {IO} from 'IO'
	import chroma from 'chroma-js'
	import {Hash, cos, floor, pow, sin, tau, tri} from 'wmath'
	import {clamp, lerp, mod} from '@0b5vr/experimental'
	import {BrushStroke, BrushType, DrawParams, Project, Utils} from 'stuff'
	import earcut from 'earcut'
	import {Dropbox} from 'dropbox'
	import getToken from 'getToken'
	import {Drawer} from 'drawer'

	// Init
	let hash = new Hash()
	let io: IO
	let gl: WebGL2RenderingContext
	let zoom = 1
	let panning: number[] = [0,0]
	let userAgentRes: Array<number> = [0, 0]
	let canvasRes: Array<number> = [512 * 2, 512 * 4]
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
	let brush_pos_ndc_screen: number[] = [0, 0]
	let brush_pos_ndc_canvas: number[] = [0, 0]
	let brush_sz: number[] = [1, 0.2]
	let selected_brush_type: BrushType = BrushType.Blobs

	let chaos_lch: Array<number> = [0, 0, 1]
	let chaos_speed: number = 0.3
	let chaos: number = 0.7

	let dynamics: number = 0.3
	let stroke_opacity_dynamics: number[] = [0, 1]
	let stroke_size_dynamics: number[] = [0.7, 1]
	let rot_jitter: number = 0
	let pos_jitter: number = 0

	let tex_dynamics: number = 0.3
	let tex_lch_dynamics: number[] = [0, 0, 0.02]
	let tex_stretch: number[] = [1, 0.2]

	let undo_pending: boolean = false
	let redo_pending: boolean = false
	let picking: boolean
	let just_finished_pick: boolean
	let picked_col: number[] = [0, 0, 0]

	let project = new Project()

	let canvas_tex: Texture
	let canvas_fb: Framebuffer
	let canvas_read_tex: Texture

	let drawer: Drawer
	
	
	const pick_from_canvas=() => {
		let coord = Utils.texture_NDC_to_texture_pixel_coords(
			Utils.screen_NDC_to_canvas_NDC(
				io.mouse_pos, default_framebuffer.textures[0], canvas_read_tex, zoom, panning
			),
			canvas_read_tex,
		)
		let c = canvas_read_tex.read_back_pixel(coord)
		console.log(c)

		picked_col = [...c]
		picked_col[0] = c[0] / 255
		picked_col[1] = c[1] / 255
		picked_col[2] = c[2] / 255
		picked_col[0] = pow(picked_col[0], 0.45454545454545)
		picked_col[1] = pow(picked_col[1], 0.45454545454545)
		picked_col[2] = pow(picked_col[2], 0.45454545454545)
		picked_col.pop()
		return c
	}

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
	let glEnums
	let enumStringToValue
	const glEnumToString = (value):string => {
		// checkInit();
		var name = glEnums[value];
		return (name !== undefined) ? ("gl." + name) :
				("/*UNKNOWN WebGL ENUM*/ 0x" + value.toString(16) + "");
	}

	const initWebGL = () => {
		//@ts-ignore
		window.gl = gl = canvasElement.getContext('webgl2', {
			preserveDrawingBuffer: true,
			alpha: false,
		})
    glEnums = { };
		enumStringToValue = { };
		for (var propertyName in gl) {
			if (typeof gl[propertyName] == 'number') {
				glEnums[gl[propertyName]] = propertyName;
				enumStringToValue[propertyName] = gl[propertyName];
			}
		}
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
		const brush_preview_program = new ShaderProgram(require('shaders/brush_preview.vert'), require('shaders/brush_preview.frag'))
		const picker_program = new ShaderProgram(require('shaders/picker.vert'), require('shaders/picker.frag'))
		const draw_blobs_stroke_program = new ShaderProgram(
			require('shaders/draw_blobs_stroke.vert'),
			require('shaders/draw_blobs_stroke.frag'),
		)
		const composite_stroke_to_canvas_program = new ShaderProgram(
			require('shaders/composite_temp_stroke_to_canvas.vert'),
			require('shaders/composite_temp_stroke_to_canvas.frag'),
		)
		const brush_triangulated_program = new ShaderProgram(
			require('shaders/brush_triangulated.vert'),
			require('shaders/brush_triangulated.frag'),
		)
		//! ------------------- POST
		const post_canvas_program = new ShaderProgram(require('shaders/post_canvas.vert'), require('shaders/post_canvas.frag'))

		default_framebuffer.start_draw()
		default_framebuffer.clear([0, 0, 0, 1])

		canvas_tex = new Texture([canvasRes[0], canvasRes[1]])
		canvas_fb = new Framebuffer([canvas_tex], true)
		canvas_fb.clear([0, 0, 0, 0])
		canvas_fb.pong_idx = 1 - canvas_fb.pong_idx
		canvas_fb.clear([0, 0, 0, 0])

		const temp_tex = new Texture([canvasRes[0], canvasRes[1]])
		const temp_stroke_fb = new Framebuffer([temp_tex])
		temp_stroke_fb.clear([0, 0, 0, 0])

		let frame = 0
		canvas_read_tex = canvas_fb.textures[0]

		let brush_buffer = new Thing(
			[new VertexBuffer(4, gl.FLOAT), new VertexBuffer(4, gl.FLOAT)],
			gl.TRIANGLES,
			new ShaderProgram(require('shaders/brush_long.vert'), require('shaders/brush_long.frag')),
		)

		let brush_buffer_b = new Thing(
			[new VertexBuffer(4, gl.FLOAT), new VertexBuffer(4, gl.FLOAT)],
			gl.TRIANGLES,
			new ShaderProgram(require('shaders/brush_long.vert'), require('shaders/brush_long.frag')),
		)

		let t: number = 0
		let redraw_needed = false

		let redo_history_length = 0

		let brush_stroke = new BrushStroke(selected_brush_type, new DrawParams(tex_dynamics, tex_lch_dynamics, tex_stretch))

		const set_shared_uniforms = (program: ShaderProgram, col: number[], t: number) => {
			program.setUniformFloat('time', t)
			program.setUniformFloat('zoom', zoom)
			program.setUniformInt('frame', frame)
			program.setUniformVec('R', default_framebuffer.textures[0].res)
			program.setUniformVec('panning', panning)
			program.setUniformVec('canvasR', canvas_read_tex.res)
			program.setUniformVec('stroke_pos', brush_pos_ndc_canvas)
			program.setUniformVec('stroke_pos_screen', brush_pos_ndc_screen)
			program.setUniformVec('stroke_col', col)
			program.setUniformVec('brush_sz', brush_sz)
			program.setUniformFloat('stroke_opacity', stroke_opacity)
			program.setUniformVec('tilt', brush_rot)
			program.setUniformFloat('pressure', io.pressure)
			program.setUniformInt('mouse_down', io.mouse_down ? 1 : 0)
			program.setUniformTexture('canvas', canvas_fb.textures[0], 0)
			program.setUniformTexture('temp_tex', temp_tex, 1)
			program.setUniformTexture('canvas_back', canvas_fb.back_textures[0], 2)
			program.setUniformTexture('canvas_read', canvas_read_tex, 3)
		}

		drawer = new Drawer(
			draw_blobs_stroke_program,
			brush_triangulated_program,
			set_shared_uniforms,
			gl,
			canvas_tex,
			default_framebuffer,
		)

		const composite_stroke = () => {
			canvas_fb.start_draw()
			composite_stroke_to_canvas_program.use()
			set_shared_uniforms(composite_stroke_to_canvas_program, [0, 0, 0, 0], t)
			gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)

			temp_stroke_fb.clear([0, 0, 0, 0])
		}

		const redraw_whole_project = () => {
			console.log('REDRAW EVERYTHING')
			canvas_fb.clear()
			canvas_fb.pong_idx = 1 - canvas_fb.pong_idx
			canvas_fb.clear()
			canvas_fb.pong_idx = 1 - canvas_fb.pong_idx

			temp_stroke_fb.clear()

			let k = 0
			for (let stroke of project.brush_strokes) {
				if (k >= project.brush_strokes.length - redo_history_length) break
				temp_stroke_fb.start_draw()
				drawer.draw_any_stroke(stroke, t, brush_buffer_b, zoom, [0,0])
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
			t = _t / 1000
			resizeIfNeeded(canvasElement, default_framebuffer, userAgentRes, (v: boolean) => {
				redraw_needed = v
			})

			io.tick()
			if(io.getKey("AltLeft").down){
				if(io.getKey("AltLeft").just_pressed){
					picking = true
				}
				pick_from_canvas()
			} else if (io.getKey('AltLeft').just_unpressed){
				just_finished_pick = true
				picking = false
			}

			if (frame === 0 || picking || just_finished_pick || io.mouse_wheel || io.mmb_down) {
				redraw_needed = true
				if(just_finished_pick){
					let coords = Utils.screen_NDC_to_canvas_NDC(
						io.mouse_pos, default_framebuffer.textures[0], canvas_read_tex, zoom, panning
					)
					if(coords[0] > 0 && coords[0] < 1 && coords[1] > 0 && coords[1] < 1){
						stroke_col = [...picked_col]
						stroke_col = Utils.gamma_correct(stroke_col,true)
						stroke_col[3] = 1
						just_finished_pick = false
					}
				}
				if(io.mmb_down){
					panning[0] += io.delta_mouse_pos[0] / zoom
					panning[1] += io.delta_mouse_pos[1] / zoom
					// console.log(panning)
				}
				if (io.mouse_wheel) {
					if (io.mouse_wheel > 0) {
						zoom *= 2
					} else {
						zoom /= 2
					}
				}
			}
			


			let l_ctrl_down = io.getKey('ControlLeft').down
			let l_shift_down = io.getKey('ShiftLeft').down
			let z_just_pressed = io.getKey('KeyZ').just_pressed
			if (redo_pending || (l_shift_down && l_ctrl_down && z_just_pressed)) {
				redo_history_length -= 1
				if (redo_history_length >= 0) redraw_whole_project()
				else redo_history_length = 0
			} else if (undo_pending || (l_ctrl_down && z_just_pressed)) {
				redo_history_length += 1
				if (redo_history_length <= project.brush_strokes.length) redraw_whole_project()
				else redo_history_length -= 1
			}

			// ----- TEMP
			if ((io.mouse_just_pressed || (io.mouse_down && io.mouse_just_moved)) && io.pointerType !== 'touch') {
				redraw_needed = true
				if (io.mouse_just_pressed && !(redo_pending || undo_pending)) {
					brush_stroke = new BrushStroke(selected_brush_type, new DrawParams(tex_dynamics, tex_lch_dynamics, tex_stretch))
					for (let i = 0; i < redo_history_length; i++) {
						project.brush_strokes.pop()
					}
					redo_history_length = 0
					console.log(brush_stroke)
					console.log('SET REDO HISTORY TO 0')
				}

				brush_rot = [...io.tilt]

				brush_pos_ndc_screen = [...io.mouse_pos]
				brush_pos_ndc_canvas = Utils.screen_NDC_to_canvas_NDC(
					brush_pos_ndc_screen,
					default_framebuffer.textures[0],
					canvas_read_tex,
					zoom,
					panning
				)
				brush_pos_ndc_canvas[0] += pos_jitter * (2 * hash.valueNoiseSmooth(t * 100 + 251, 2) - 1)
				brush_pos_ndc_canvas[1] += pos_jitter * (2 * hash.valueNoiseSmooth(t * 100 + 1251, 2) - 1)

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

				brush_rot[1] += rot_jitter * (2 * hash.valueNoiseSmooth(t * 10 + 100, 2) - 1)

				let sz = [...brush_sz]

				let size_pressure_weight = lerp(stroke_size_dynamics[0], stroke_size_dynamics[1], io.pressure)
				let size_tilt_weight = lerp(0.4, 1, io.tilt[0] / tau)
				// TODO: sz dynamics
				sz[0] *= size_pressure_weight * size_tilt_weight
				sz[1] *= size_pressure_weight * size_tilt_weight

				brush_stroke.push_stroke(brush_pos_ndc_canvas, brush_rot, sz, stroke_opacity, col)

				temp_stroke_fb.start_draw()

				drawer.draw_any_stroke(brush_stroke, t, brush_buffer, zoom, panning)
			}
			// ----- COMPOSITE
			if (io.mouse_just_unpressed && io.pointerType !== 'touch' && !(undo_pending || redo_pending)) {
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

				if (picking) {
					picker_program.use()
					set_shared_uniforms(picker_program, [0, 0, 0, 0], t)
					// console.log("picked COL")
					// console.log(picked_col)
					picker_program.setUniformVec('picked_col', picked_col)
					picker_program.setUniformVec('stroke_pos', io.mouse_pos)
					gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
					// console.log("DRAW PICKER")
				}
			}
			let err = gl.getError() 
			if (err!== 0) {
				console.log(err)
				console.log(glEnumToString(err))
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
