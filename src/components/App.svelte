<main>
	<div id="bar-container">
		<div id="bar">
			<Knob bind:value={stroke_col[0]} title={'R'} />
			<Knob bind:value={stroke_col[1]} title={'G'} />
			<Knob bind:value={stroke_col[2]} title={'B'} />
			<ColourDisplay bind:colour={stroke_col} bind:just_finished_pick={just_finished_pick} />

			<Knob bind:this={chaosKnob} bind:value={curr_brush.chaos} title={'Chaos'} triggerModal={openModal} modal={chaosSemiModal} />
			<BrushSizeWidget
				bind:brush_sz={brush_sz}
				canvas_res={canvasRes}
				bind:dragging={brushSizeWidgetDragging}
				bind:stopped_dragging={brushSizeWidgetStoppedDragging} />
			<Knob
				bind:this={dynamicsKnob}
				bind:value={curr_brush.dynamics}
				title={'Dynamics'}
				triggerModal={openModal}
				modal={dynamicsSemiModal} />
			<Knob
				bind:this={texDynamicsKnob}
				bind:value={curr_brush.tex_dynamics}
				title={'Tex'}
				triggerModal={openModal}
				modal={texDynamicsSemiModal} />
			<!-- <BrushTypeWidget bind:selected_brush_type={curr_brush.selected_brush_type} /> -->
			<BrushTypeWidget bind:curr_brush={curr_brush} />
			<BrushPresetWidget bind:brush_presets={brush_presets} bind:selected_brush_preset={curr_brush} />
			<UndoRedoWidget
				undo={() => {
					undo_pending = true
					floating_modal_message.set("undo")
				}}
				redo={() => {
					redo_pending = true
				}} />
			<GalleryWidget
				bind:current_project={project}
				get_current_canvas_as_image={async () => {
					let [img, blob] = await canvas_read_tex.read_back_image(true)
					return [img, blob]
				}} 
				new_project={()=>{ 
					new_project_pending = true 
				}}
				load_project={(project)=>{ 
					project_pending_load = project
				}}
				bind:project_has_been_modified={project_has_been_modified}
				bind:is_safe_to_switch_to_new_project={is_safe_to_switch_to_new_project}
				/>
			<FloatingModal />
			<PickColourWidget
				pick_from_canvas={() => pick_from_canvas()}
				bind:picking={picking}
				bind:just_finished_pick={just_finished_pick} />
		</div>
		<SemiModal bind:this={chaosSemiModal} knob={chaosKnob}>
			<Knob bind:value={curr_brush.chaos_lch[0]} title={'Chaos L'} />
			<Knob bind:value={curr_brush.chaos_lch[1]} title={'Chaos C'} />
			<Knob bind:value={curr_brush.chaos_lch[2]} title={'Chaos H'} />
			<Knob bind:value={curr_brush.chaos_speed} title={'Chaos Speed'} />
		</SemiModal>
		<SemiModal bind:this={dynamicsSemiModal} knob={dynamicsKnob}>
			<Knob bind:value={curr_brush.stroke_opacity_dynamics[0]} title={'Opacity min'} />
			<Knob bind:value={curr_brush.stroke_opacity_dynamics[1]} title={'Opacity max'} />
			<Knob bind:value={curr_brush.stroke_size_dynamics[0]} title={'Size min'} />
			<Knob bind:value={curr_brush.stroke_size_dynamics[1]} title={'Size max'} />
			<Knob bind:value={curr_brush.rot_jitter} title={'Rot jitt'} />
			<Knob bind:value={curr_brush.pos_jitter} title={'Pos jitt'} />
		</SemiModal>
		<SemiModal bind:this={texDynamicsSemiModal} knob={texDynamicsKnob}>
			<Knob bind:value={curr_brush.tex_lch_dynamics[0]} title={'Tex V'} />
			<Knob bind:value={curr_brush.tex_lch_dynamics[1]} title={'Tex S'} />
			<Knob bind:value={curr_brush.tex_lch_dynamics[2]} title={'Tex H'} />
			<Knob bind:value={curr_brush.tex_stretch[0]} title={'Stretch X'} />
			<Knob bind:value={curr_brush.tex_stretch[1]} title={'Stretch Y'} />
			<TextureWidget bind:brush_textures={brush_textures} bind:selected_brush_texture={curr_brush.selected_brush_texture} />
		</SemiModal>
	</div>
	<canvas id="canvas" bind:this={canvasElement} />
</main>


<script lang="ts">
	// import type monaco from 'monaco-editor';
	import {onMount} from 'svelte'
	import {onDestroy} from 'svelte'
	import {get, writable} from 'svelte/store'
	import {floating_modal_message} from 'store'

	import {resizeIfNeeded, finish_frame, print_on_gl_error, init_gl_error_handling} from 'gl_utils'

	import Knob from './Knob.svelte'
	import BrushSizeWidget from './BrushSizeWidget.svelte'
	import BrushTypeWidget from './BrushTypeWidget.svelte'
	import BrushPresetWidget from './BrushPresetWidget.svelte'
	import UndoRedoWidget from './UndoRedoWidget.svelte'
	import GalleryWidget from './GalleryWidget.svelte'
	import FloatingModal from './FloatingModal.svelte'
	import PickColourWidget from './PickColourWidget.svelte'
	import TextureWidget from './TextureWidget.svelte'

	import ColourDisplay from './ColourDisplay.svelte'
	import SemiModal from './SemiModal.svelte'
	import {IO} from 'IO'
	import chroma from 'chroma-js'
	import {Hash, abs, cos, floor, pow, sin, tau, tri, mix, max} from 'wmath'
	import {clamp, lerp, mod, smootheststep, smoothstep} from '@0b5vr/experimental'
	import {BrushTexture, Project, Utils} from 'stuff'
	import {BrushPreset, BrushStroke, BrushType, DrawParams} from 'brush_stroke'
	import earcut from 'earcut'
	import {Dropbox} from 'dropbox'
	import getToken from 'getToken'
	import Dexie from 'dexie';
	import {Drawer} from 'drawer'
	import { Framebuffer } from 'gl/Framebuffer'
	import { VertexBuffer, UBO } from 'gl/Buffer'
	import { Texture } from 'gl/Texture'
	import { ShaderProgram } from 'gl/ShaderProgram'
	import { Thing } from 'gl/Thing'

	// Init
	let hash = new Hash()
	let io: IO
	let gl: WebGL2RenderingContext
	let zoom = 1
	let desired_zoom = 1
	let panning: number[] = [0, 0]
	let userAgentRes: Array<number> = [0, 0]
	let canvasRes: Array<number> = [512 * 1, 512 * 2]
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
	
	
	let brush_presets: BrushPreset[] = []
	for(let i = 0; i < 6; i++){
		brush_presets.push(new BrushPreset())
	}
	let curr_brush: BrushPreset = brush_presets[0]


	// let selected_brush_type: BrushType = BrushType.Blobs

	// let chaos_lch: Array<number> = [0, 0, 1]
	// let chaos_speed: number = 0.3
	// let chaos: number = 0.7

	// let dynamics: number = 0.3
	// let stroke_opacity_dynamics: number[] = [0, 1]
	// let stroke_size_dynamics: number[] = [0.7, 1]
	// let rot_jitter: number = 0
	// let pos_jitter: number = 0

	// let tex_dynamics: number = 0.3
	// let tex_lch_dynamics: number[] = [0, 0, 0.02]
	// let tex_stretch: number[] = [1, 0.2]

	// let selected_brush_texture: BrushTexture

	let brush_textures: Array<BrushTexture> = []

	



	let new_project_pending: boolean = false
	let undo_pending: boolean = false
	let redo_pending: boolean = false
	let picking: boolean
	let just_finished_pick: boolean
	let picked_col: number[] = [0, 0, 0]

	let project = new Project()
	let project_pending_load: Project
	let project_has_been_modified = false
	let is_safe_to_switch_to_new_project

	let canvas_tex: Texture
	let canvas_fb: Framebuffer
	let canvas_read_tex: Texture

	let drawer: Drawer
	let ubo: UBO

	const set_shared_uniforms = () => {
		ubo.buff.sz = 0
		ubo.buff.cpu_buff[0] = canvas_fb._textures[0].res[0]
		ubo.buff.cpu_buff[1] = canvas_fb._textures[0].res[1]
		ubo.buff.cpu_buff[2] = default_framebuffer.textures[0].res[0]
		ubo.buff.cpu_buff[3] = default_framebuffer.textures[0].res[1]
		ubo.buff.upload()
	}

	const pick_from_canvas = () => {
		let coord = Utils.texture_NDC_to_texture_pixel_coords(
			Utils.screen_NDC_to_canvas_NDC([...io.mouse_pos], default_framebuffer.textures[0], canvas_read_tex, zoom, panning),
			canvas_read_tex,
		)
		let c = canvas_read_tex.read_back_pixel(coord)
		// console.log(c)

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

	const init_web_gl = () => {
		//@ts-ignore
		window.gl = gl = canvasElement.getContext('webgl2', {
			preserveDrawingBuffer: true,
			alpha: true,
			premultipliedAlpha: false
		})
		gl.getExtension('OES_texture_float');
		gl.getExtension('OES_texture_float_linear');
		gl.getExtension('EXT_color_buffer_float');


		gl.debugEnabled = process.env.NODE_ENV === 'development'
		gl.debugEnabled = false
		init_gl_error_handling()

		userAgentRes = [canvasElement.clientWidth, canvasElement.clientWidth]

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

		default_framebuffer.bind()

		canvas_tex = new Texture([canvasRes[0], canvasRes[1]], gl.RGBA16F) 
		canvas_fb = new Framebuffer([canvas_tex], true)

		ubo = new UBO()
		window.ubo = ubo
		

		resizeIfNeeded(canvasElement, default_framebuffer, userAgentRes, (e) => {}, ()=>{set_shared_uniforms()})
		set_shared_uniforms()

		gl.disable(gl.CULL_FACE)
		gl.disable(gl.DEPTH_TEST)
		gl.enable(gl.BLEND)
		// gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

		// gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE);
		// gl.blendEquationSeparate(gl.FUNC_ADD, gl.FUNC_ADD)
		
		// gl.blend
		gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA,);
		gl.blendEquationSeparate(gl.FUNC_ADD, gl.FUNC_ADD) 
		

		// gl.blendEquationSeparate(gl.ONE, gl.MAX)
		// gl.blendFuncSeparate(gl.FUNC_ADD)
		// gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.MAX, gl.MAX);
	}
	const init_other_stuff = async () => {
		io = new IO()
		document.addEventListener('contextmenu', (event) => event.preventDefault())
		// @ts-ignore
		window.history.pushState(null, null, window.location.href);
		window.addEventListener('popstate', ()=> {
			// @ts-ignore
			window.history.pushState(null, null, window.location.href);
		});

		brush_textures.push(
			await BrushTexture.create(require("/../public/images/brow.webp").default)
		)
		brush_textures.push(
			await BrushTexture.create(require("/../public/images/charcoal.webp").default)
		)
		brush_textures.push(
			await BrushTexture.create(require("/../public/images/circle.webp").default)
		)
		brush_textures.push(
			await BrushTexture.create(require("/../public/images/gradient_bottom_to_top.webp").default)
		)
		brush_textures.push(
			await BrushTexture.create(require("/../public/images/oil_01.webp").default)
		)
		brush_textures.push(
			await BrushTexture.create(require("/../public/images/oil_taper.webp").default)
		)
		brush_textures.push(
			await BrushTexture.create(require("/../public/images/square.webp").default)
		)
		brush_textures = [...brush_textures]

		curr_brush.selected_brush_texture = brush_textures[0]
		
		// window.onbeforeunload = async ()=> {
		// 	const is_safe = await is_safe_to_switch_to_new_project()
		// 	console.log(is_safe)
		// 	// if(!){
		// 		return 'Do you want to leave this page?';
		// 	// } else {
		// 	return "amog"
		// 	// }
		// }
		modals = [chaosSemiModal, dynamicsSemiModal, texDynamicsSemiModal]
	}

	onMount(async () => {
		init_web_gl()
		await init_other_stuff()

		default_framebuffer.bind()
		default_framebuffer.clear([0, 0, 0, 1])
 
		// canvas_tex = new Texture([canvasRes[0], canvasRes[1]], gl.RGBA16F)
		canvas_fb.clear([0, 0, 0, 0])
		canvas_fb.pong()
		canvas_fb.back_textures[0].bind_to_unit(1)
		canvas_fb.clear([0, 0, 0, 0])

		const temp_tex = new Texture([canvasRes[0], canvasRes[1]], gl.RGBA16F)
		const temp_stroke_fb = new Framebuffer([temp_tex])
		temp_stroke_fb.clear([0, 0, 0, 0])

		// @ts-ignore
		// const delay = ms => new Promise(res => setTimeout(res, ms));
		
		// await delay(3000)

		//! ------------------- SHADERS
		const init_texture_uniforms = (program: ShaderProgram) =>{
			program.setUniformTexture('temp_tex', temp_tex, 0)
			program.setUniformTexture('canvas_back', canvas_fb.back_textures[0], 1)
			program.setUniformTexture('canvas_b', canvas_fb._textures[0], 2)
			program.setUniformTexture('canvas_a', canvas_fb._back_textures[0], 3)
			
			const start_idx = 4
			const brush_tex_units: number[] = []
			brush_textures.forEach((brush_tex, i )=>{
				const name = `brush_texture_${i}`
				console.log(name)
				// const brush_textures_loc = gl.getUniformLocation(program.program, name)
				const brush_textures_loc = gl.getUniformLocation(program.program, name)

				brush_tex.gpu_tex.bind_to_unit(start_idx + i)				
				gl.uniform1i(brush_textures_loc, start_idx + i);
			})
			gl.activeTexture(gl.TEXTURE0) // TODELETE
		}
		const brush_preview_program = new ShaderProgram(require('shaders/brush_preview.vert'), require('shaders/brush_preview.frag'))
		const picker_program = new ShaderProgram(require('shaders/picker.vert'), require('shaders/picker.frag'))
		const composite_stroke_to_canvas_program = new ShaderProgram(
			require('shaders/composite_temp_stroke_to_canvas.vert'),
			require('shaders/composite_temp_stroke_to_canvas.frag'),
		)
		const post_canvas_program = new ShaderProgram(require('shaders/post_canvas.vert'), require('shaders/post_canvas.frag'))
		//@ts-ignore
		post_canvas_program.zoom_loc = gl.getUniformLocation(post_canvas_program.program, "zoom")
		//@ts-ignore
		post_canvas_program.panning_loc = gl.getUniformLocation(post_canvas_program.program, "panning")
		
		const brush_long_program = new ShaderProgram(require('shaders/brush_long.vert'), require('shaders/brush_long.frag'))

		brush_preview_program.use()
		init_texture_uniforms(brush_preview_program)
		picker_program.use()
		init_texture_uniforms(picker_program)
		composite_stroke_to_canvas_program.use()
		init_texture_uniforms(composite_stroke_to_canvas_program)
		post_canvas_program.use()
		init_texture_uniforms(post_canvas_program)
		brush_long_program.use()
		init_texture_uniforms(brush_long_program)
		

		//! ------------------- POST
		let frame = 0
		canvas_read_tex = canvas_fb.textures[0]


		let brush_buffer = new Thing(
			[new VertexBuffer(4, gl.FLOAT), new VertexBuffer(4, gl.FLOAT)],
			gl.TRIANGLES,
			brush_long_program
		)
		gl.bindVertexArray(brush_buffer.vao)
		

		let t: number = 0
		let delta_t: number = 0
		let redraw_needed = false

		let redo_history_length = 0

		let brush_stroke = new BrushStroke(curr_brush.selected_brush_type, new DrawParams(curr_brush.tex_dynamics, curr_brush.tex_lch_dynamics, curr_brush.tex_stretch))


		drawer = new Drawer(
			gl,
			canvas_tex,
			default_framebuffer,
		)

		const composite_stroke = () => {
			gl.disable(gl.BLEND)
			canvas_fb.bind()
			canvas_fb.clear([0,0,0,0])
			composite_stroke_to_canvas_program.use()
			composite_stroke_to_canvas_program.setUniformFloat("pong_idx", canvas_fb.pong_idx)
			canvas_fb.back_textures[0].bind_to_unit(1)
			gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
			temp_stroke_fb.clear()
		}

		const redraw_whole_project = () => {
			console.log('REDRAW EVERYTHING')
			canvas_fb.clear()
			canvas_fb.pong()
			canvas_fb.back_textures[0].bind_to_unit(1)
			canvas_fb.clear()
			temp_stroke_fb.clear()

			let k = 0
			
			drawer.brush_buffer = brush_buffer
			drawer.reset()
			for (let stroke of project.brush_strokes) {
				if (k >= project.brush_strokes.length - redo_history_length) break
				// drawer.draw_any_stroke(stroke, t, brush_buffer_b, zoom, [0, 0])
				drawer.push_any_stroke(stroke)
				k++
			}
			k = 0
			drawer.brush_buffer.upload_all_buffs()
			drawer.brush_buffer.shader.use()
			// composite_stroke_to_canvas_program.setUniformTexture('canvas_back', canvas_fb.back_textures[0], 1)

			for(let amogus of drawer.recorded_drawcalls){
				// gl.viewport(0, 0, this.textures[0].res[0], this.textures[0].res[1])
				// gl.bindFramebuffer(gl.FRAMEBUFFER, this.fb)
				// Framebuffer.currently_bound = this
				// gl.drawBuffers(draw_buffs)
				gl.enable(gl.BLEND)
				temp_stroke_fb.bind()
				temp_stroke_fb.clear()
				drawer.brush_buffer.shader.use()
				drawer.draw_stroke_idx(k)


				canvas_fb.bind()
				canvas_fb.clear()
				gl.disable(gl.BLEND)
				composite_stroke_to_canvas_program.use()
			  composite_stroke_to_canvas_program.setUniformFloat("pong_idx", canvas_fb.pong_idx)
				gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)

				canvas_fb.pong()
				canvas_fb.back_textures[0].bind_to_unit(1)
				k++
			}
			redraw_needed = true
		}
		
		let load_project = (new_project: Project) =>{
			project = new Project()
			project_has_been_modified = false
			redo_history_length = 0
			for (let key of Object.keys(new_project as Object)) {
				// @ts-ignore
				project[key] = new_project[key]
			}
			redraw_whole_project()
		}
		let local_storage_proj = localStorage.getItem('project')

		if (local_storage_proj) {
			local_storage_proj = JSON.parse(local_storage_proj)
			// @ts-ignore
			load_project(local_storage_proj)
		}
		
		const handle_input_actions = ()=>{
			if (io.getKey('AltLeft').down) {
				if (io.getKey('AltLeft').just_pressed) {
					picking = true
				}
				pick_from_canvas()
			} else if (io.getKey('AltLeft').just_unpressed) {
				just_finished_pick = true
				picking = false
			}
			if(abs(desired_zoom - zoom) > 0.00000001 ){
				redraw_needed = true
				zoom = mix(zoom,desired_zoom,delta_t*20)
			}
			if (frame === 0 || picking || just_finished_pick || io.mouse_wheel || io.mmb_down) {
				redraw_needed = true
				if (just_finished_pick) {
					let coords = Utils.screen_NDC_to_canvas_NDC(
						[...io.mouse_pos],
						default_framebuffer.textures[0],
						canvas_fb._textures[0],
						zoom,
						panning,
					)
					if (coords[0] > 0 && coords[0] < 1 && coords[1] > 0 && coords[1] < 1) {
						stroke_col = [...picked_col]
						stroke_col = Utils.gamma_correct(stroke_col, true)
						stroke_col[3] = 1
						stroke_col = [...stroke_col]
						just_finished_pick = false
					}
				}
				if (io.mmb_down) {
					panning[0] += io.delta_mouse_pos[0] / zoom
					panning[1] += io.delta_mouse_pos[1] / zoom
					// console.log(panning)
				}
				if (io.mouse_wheel) {
					if (io.mouse_wheel > 0) {
						// zoom *= 2
						desired_zoom *= 1.2
					} else {
						desired_zoom /= 1.2
					}
				}
			}

			// ----- UNDO_REDO
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
		}
		
		const record_stroke = ()=>{
				if (io.mouse_just_pressed && !(redo_pending || undo_pending)) {
					brush_stroke = new BrushStroke(curr_brush.selected_brush_type, new DrawParams(curr_brush.tex_dynamics, curr_brush.tex_lch_dynamics, curr_brush.tex_stretch))
					for (let i = 0; i < redo_history_length; i++) {
						project.brush_strokes.pop()
					}
					redo_history_length = 0
					console.log(brush_stroke)
					console.log('SET REDO HISTORY TO 0')
				}

				brush_rot = [...io.tilt]

				for(let i = 0; i < io.mouse_positions_during_last_frame_cnt; i++){
					// brush_pos_ndc_screen = [...io.mouse_pos]
					brush_pos_ndc_screen = [
						io.mouse_positions_during_last_frame[i*2],
						io.mouse_positions_during_last_frame[i*2 + 1]
					]
					brush_pos_ndc_canvas = Utils.screen_NDC_to_canvas_NDC(
						brush_pos_ndc_screen,
						default_framebuffer.textures[0],
						canvas_read_tex,
						zoom,
						panning,
					)
					brush_pos_ndc_canvas[0] += curr_brush.pos_jitter * (2 * hash.valueNoiseSmooth(t * 100 + 251, 2) - 1)
					brush_pos_ndc_canvas[1] += curr_brush.pos_jitter * (2 * hash.valueNoiseSmooth(t * 100 + 1251, 2) - 1)

					let col = [...stroke_col]

					{
						const chroma_gl = (col: number[]) => {
							return chroma.gl(col[0], col[1], col[2])
						}
						const chroma_oklch = (col: number[]) => {
							return chroma.oklch(col[0], col[1], col[2])
						}

						
						col = chroma_gl(col).oklch()
						const c = col[1]

						let hue_jitt_amt = (1-pow(c ,0.2)*1.2)*4
						hue_jitt_amt = max(hue_jitt_amt,0)
						hue_jitt_amt += pow(smoothstep(0.,1.,1-c) ,57.)*2.2
						
						
						col[0] += (-0.5 + hash.valueNoiseSmooth(t * 100 * curr_brush.chaos_speed, 2)) * curr_brush.chaos * curr_brush.chaos_lch[0]
						col[1] += (-0.5 + hash.valueNoiseSmooth(t * 100 * curr_brush.chaos_speed + 100, 2)) * curr_brush.chaos * curr_brush.chaos_lch[1] 
						col[2] += hue_jitt_amt*(-0.5 + hash.valueNoiseSmooth(t * 100 * curr_brush.chaos_speed + 200, 2)) * 300 * curr_brush.chaos * curr_brush.chaos_lch[2]
						col[0] = clamp(col[0], 0, 1)
						col[1] = clamp(col[1], 0, 1)
						col[2] = mod(col[2], 360)

						col = chroma_oklch(col).gl()
					}
					{
						stroke_opacity = lerp(curr_brush.stroke_opacity_dynamics[0], curr_brush.stroke_opacity_dynamics[1], io.pressure)
					}

					brush_rot[1] += curr_brush.rot_jitter * (2 * hash.valueNoiseSmooth(t * 10 + 100, 2) - 1)

					let sz = [...brush_sz]

					let size_pressure_weight = lerp(curr_brush.stroke_size_dynamics[0],curr_brush. stroke_size_dynamics[1], io.pressure)
					let size_tilt_weight = lerp(0.4, 1, io.tilt[0] / tau)
					// TODO: sz dynamics
					sz[0] *= size_pressure_weight * size_tilt_weight
					sz[1] *= size_pressure_weight * size_tilt_weight

					brush_stroke.push_stroke(brush_pos_ndc_canvas, brush_rot, sz, stroke_opacity, col)
				}
		}

		const draw = (_t: number) => {
			redraw_needed = false
			const new_t = _t / 1000
			delta_t = new_t - t
			t = new_t
			resizeIfNeeded(canvasElement, default_framebuffer, userAgentRes, (v: boolean) => {
				redraw_needed = v
			},()=>{set_shared_uniforms()})
			io.tick()
			
			if(new_project_pending){
				load_project(new Project())
				new_project_pending = false
			}
			if(project_pending_load){
				load_project(project_pending_load)
				// @ts-ignore
				project_pending_load = undefined
			}

			handle_input_actions()

			// ----- RECORD STROKE / DRAW
			if ((io.mouse_just_pressed || (io.mouse_down && io.mouse_just_moved)) && io.pointerType !== 'touch') {
				project_has_been_modified = true
				redraw_needed = true
				record_stroke()
				gl.enable(gl.BLEND)
				temp_stroke_fb.clear()
				temp_stroke_fb.bind()
				// drawer.draw_any_stroke(brush_stroke, t, brush_buffer, zoom, panning)
				drawer.brush_buffer = brush_buffer
				drawer.reset()
				drawer.push_any_stroke(brush_stroke)
				drawer.brush_buffer.upload_all_buffs()
				drawer.brush_buffer.shader.use()
				// set_shared_uniforms(t)
				drawer.draw_stroke_idx(0)
			}
			// ----- COMPOSITE
			if (io.mouse_just_unpressed && io.pointerType !== 'touch' && !(undo_pending || redo_pending)) {
				// localStorage.setItem('project', JSON.stringify(project))
				console.log(brush_stroke)
				project.push_stroke(brush_stroke)
				redraw_needed = true
				composite_stroke()
				canvas_fb.pong()
				canvas_fb.back_textures[0].bind_to_unit(1)
			}

			if (brushSizeWidgetDragging || brushSizeWidgetStoppedDragging) redraw_needed = true

			// ----- REDRAW
			if (redraw_needed) {
				// gl.disable(gl.BLEND)
				default_framebuffer.clear([0, 0, 0, 1])
				default_framebuffer.bind()

				post_canvas_program.use()

				// @ts-ignore
				gl.uniform1f(post_canvas_program.zoom_loc, zoom)
				// @ts-ignore
				gl.uniform2fv(post_canvas_program.panning_loc, panning)
				// post_canvas_program.setUniformFloat("zoom", zoom)
				// post_canvas_program.setUniformVec("panning", panning)
				canvas_fb.back_textures[0].bind_to_unit(1)
				// set_shared_uniforms(t)
				gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)

				if (brushSizeWidgetDragging) {
					brush_preview_program.use()
					brush_preview_program.setUniformFloat("zoom", zoom)
					brush_preview_program.setUniformVec("brush_sz", brush_sz)
					// set_shared_uniforms(t)
					gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
				}

				if (picking) {
					picker_program.use()
					// set_shared_uniforms(t)
					picker_program.setUniformVec('picked_col', picked_col)
					picker_program.setUniformVec('picker_pos', [...io.mouse_pos])
					gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
				}
			}
			print_on_gl_error()
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
