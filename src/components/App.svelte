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
				bind:resize_project={resize_project}
				bind:project_has_been_modified={project_has_been_modified}
				bind:is_safe_to_switch_to_new_project={is_safe_to_switch_to_new_project}
				/>
			<FloatingModal />
			<PickColourWidget
				pick_from_canvas={() => pick_from_canvas()}
				bind:picking={picking}
				bind:just_finished_pick={just_finished_pick} />
			<BlendingColourSpaceWidget bind:selected_colour_space={blending_colour_space}/>
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
			<Knob bind:value={curr_brush.tex_stretch[0]} title={'Stretch X'} />
			<Knob bind:value={curr_brush.tex_stretch[1]} title={'Stretch Y'} />
			<Knob bind:value={curr_brush.tex_lch_dynamics[0]} title={'Tex V'} />
			<Knob bind:value={curr_brush.tex_lch_dynamics[1]} title={'Tex S'} />
			<Knob bind:value={curr_brush.tex_lch_dynamics[2]} title={'Tex H'} />
			<TextureWidget bind:brush_textures={brush_textures} bind:selected_brush_texture={curr_brush.selected_brush_texture} />
		</SemiModal>
	</div>
	<canvas id="canvas" bind:this={canvasElement} />
</main>


<script lang="ts">
	// import type monaco from 'monaco-editor';
	import {onMount} from 'svelte'
	import {onDestroy} from 'svelte'
	import {floating_modal_message} from 'store'

	import {resizeIfNeeded as resizeDefaultFramebufferIfNeeded, print_on_gl_error, init_gl_error_handling} from 'gl_utils'

	import Knob from './Knob.svelte'
	import BrushSizeWidget from './BrushSizeWidget.svelte'
	import BrushTypeWidget from './BrushTypeWidget.svelte'
	import BrushPresetWidget from './BrushPresetWidget.svelte'
	import UndoRedoWidget from './UndoRedoWidget.svelte'
	import GalleryWidget from './GalleryWidget.svelte'
	import FloatingModal from './FloatingModal.svelte'
	import PickColourWidget from './PickColourWidget.svelte'
	import TextureWidget from './TextureWidget.svelte'
	import BlendingColourSpaceWidget from './BlendingColourSpaceWidget.svelte'

	import ColourDisplay from './ColourDisplay.svelte'
	import SemiModal from './SemiModal.svelte'
	import {IO} from 'IO'
	import chroma from 'chroma-js'
	import {Hash, abs, cos, floor, pow, sin, tau, tri, mix, max, log2} from 'wmath'
	import {clamp, lerp, mod, smootheststep, smoothstep} from '@0b5vr/experimental'
	import {BrushTexture, Project, Utils} from 'stuff'
	import {BlendingColourSpace, BrushPreset, BrushStroke, BrushType, DrawParams} from 'brush_stroke'
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
	let zoom = Float32Array.from([1])
	window.zoom = zoom
	let desired_zoom = 1
	let panning_temp_pinch: number[] = [0, 0]
	let panning: number[] = [0, 0]
	let userAgentRes: Array<number> = [0, 0]
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

	let blending_colour_space = BlendingColourSpace.OkLCH

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
	let resize_project: (sz: number[])=>void
	let is_safe_to_switch_to_new_project
	
	let full_redraw_needed: boolean = false

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
		ubo.buff.cpu_buff[4] = isOnMobile ? 1 : 0
		ubo.buff.upload()
	}

	const pick_from_canvas = () => {
		let coord = Utils.texture_NDC_to_texture_pixel_coords(
			Utils.screen_NDC_to_canvas_NDC([...io.mouse_pos], default_framebuffer.textures[0], canvas_read_tex, zoom[0], panning),
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
		window.isOnMobile = Utils.isOnMobile()
		//@ts-ignore
		window.gl = gl = canvasElement.getContext('webgl2', {
			preserveDrawingBuffer: true,
			alpha: false,
			premultipliedAlpha: false,
			antialias: true
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

		canvas_tex = new Texture([project.canvasRes[0], project.canvasRes[1]], gl.RGBA16F, !isOnMobile) 
		canvas_fb = new Framebuffer([canvas_tex], true)
		

		ubo = new UBO()
		window.ubo = ubo
		

		resizeDefaultFramebufferIfNeeded(canvasElement, default_framebuffer, userAgentRes, (e) => {}, ()=>{set_shared_uniforms()})
		set_shared_uniforms()

		gl.disable(gl.CULL_FACE)
		gl.disable(gl.DEPTH_TEST)
		gl.enable(gl.BLEND)
		
		// gl.blend
		gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA,);
		gl.blendEquationSeparate(gl.FUNC_ADD, gl.FUNC_ADD) 
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
			await BrushTexture.create(require("/../public/images/brow.webp").default, 0)
		)
		brush_textures.push(
			await BrushTexture.create(require("/../public/images/charcoal.webp").default, 1)
		)
		brush_textures.push(
			await BrushTexture.create(require("/../public/images/circle.webp").default, 2)
		)
		brush_textures.push(
			await BrushTexture.create(require("/../public/images/gradient_bottom_to_top.webp").default, 3)
		)
		brush_textures.push(
			await BrushTexture.create(require("/../public/images/oil_01.webp").default, 4)
		)
		brush_textures.push(
			await BrushTexture.create(require("/../public/images/oil_taper.webp").default, 5)
		)
		brush_textures.push(
			await BrushTexture.create(require("/../public/images/square.webp").default, 6)
		)
		brush_textures = [...brush_textures]

		for(let brush of brush_presets){
			brush.selected_brush_texture = brush_textures[0]
		}
		
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

		const temp_tex = new Texture([project.canvasRes[0], project.canvasRes[1]], gl.RGBA16F, !isOnMobile)
		const temp_stroke_fb = new Framebuffer([temp_tex])
		temp_stroke_fb.clear([0, 0, 0, 0])

		//! ------------------- SHADERS
		const init_texture_uniforms = (program: ShaderProgram) =>{
			program.setUniformTexture('temp_tex', temp_tex, 0)
			program.setUniformTexture('canvas_back', canvas_fb.back_textures[0], 1)
			program.setUniformTexture('canvas_b', canvas_fb._textures[0], 2)
			program.setUniformTexture('canvas_a', canvas_fb._back_textures[0], 3)
			
			const start_idx = 4
			const brush_tex_units: number[] = []
			brush_textures.forEach((brush_tex, i )=>{
				// const name = `brush_texture_${i}`
				const name = `brush_texture[${i}]`
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
		const composite_stroke_to_canvas_b_program = new ShaderProgram(
			require('shaders/composite_temp_stroke_to_canvas.vert'),
			require('shaders/composite_temp_stroke_to_canvas_b.frag'),
		)
		const post_canvas_program = new ShaderProgram(require('shaders/post_canvas.vert'), require('shaders/post_canvas.frag'))
		//@ts-ignore
		post_canvas_program.zoom_loc = gl.getUniformLocation(post_canvas_program.program, "zoom")
		//@ts-ignore
		post_canvas_program.panning_loc = gl.getUniformLocation(post_canvas_program.program, "panning")
		//@ts-ignore
		post_canvas_program.blending_colour_space_loc = gl.getUniformLocation(post_canvas_program.program, "blending_colour_space")
		
		const brush_long_program = new ShaderProgram(require('shaders/brush_long.vert'), require('shaders/brush_long.frag'))

		brush_preview_program.use()
		init_texture_uniforms(brush_preview_program)
		picker_program.use()
		init_texture_uniforms(picker_program)
		composite_stroke_to_canvas_program.use()
		init_texture_uniforms(composite_stroke_to_canvas_program)
		composite_stroke_to_canvas_b_program.use()
		init_texture_uniforms(composite_stroke_to_canvas_b_program)
		//@ts-ignore
		composite_stroke_to_canvas_program.blending_colour_space_loc = gl.getUniformLocation(composite_stroke_to_canvas_program.program, "blending_colour_space")

		//@ts-ignore
		composite_stroke_to_canvas_b_program.blending_colour_space_loc = gl.getUniformLocation(composite_stroke_to_canvas_b_program.program, "blending_colour_space")

		post_canvas_program.use()
		init_texture_uniforms(post_canvas_program)

		brush_long_program.use()
		init_texture_uniforms(brush_long_program)
		//@ts-ignore
		brush_long_program.brush_texture_idx_loc = gl.getUniformLocation(brush_long_program.program, "brush_texture_idx")
		//@ts-ignore
		brush_long_program.tex_hsv_dynamics_loc = gl.getUniformLocation(brush_long_program.program, "tex_hsv_dynamics")
		//@ts-ignore
		brush_long_program.tex_stretch_loc = gl.getUniformLocation(brush_long_program.program, "tex_stretch")
		

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

		let brush_stroke = new BrushStroke(
			curr_brush.selected_brush_type, 
			new DrawParams(curr_brush.tex_dynamics, curr_brush.tex_lch_dynamics, curr_brush.tex_stretch, BlendingColourSpace.Pigments),
				curr_brush.selected_brush_texture
			)


		drawer = new Drawer(
			gl,
			canvas_tex,
			default_framebuffer,
		)
		const composite_stroke = () => {
			// gl.disable(gl.BLEND)
			canvas_fb.bind()
			canvas_fb.clear([0,0,0,0])

			const comp_program = canvas_fb.pong_idx === 0 ? composite_stroke_to_canvas_program : composite_stroke_to_canvas_b_program
			if(canvas_fb.pong_idx === 0){
				
			}
			comp_program.use()
			// composite_stroke_to_canvas_program.setUniformFloat("pong_idx", canvas_fb.pong_idx)
			// @ts-ignore
			gl.uniform1i(comp_program.blending_colour_space_loc, blending_colour_space)
			canvas_fb.back_textures[0].bind_to_unit(1)
			gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
			temp_stroke_fb.clear()
		}

		const redraw_whole_project = () => {
			console.log('REDRAW EVERYTHING')
			console.time("REDRAW ALL")
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
				drawer.push_any_stroke(stroke)
				k++
			}
			k = 0
			drawer.brush_buffer.upload_all_buffs()
			const brush_shader = drawer.brush_buffer.shader
			brush_shader.use()
			// composite_stroke_to_canvas_program.setUniformTexture('canvas_back', canvas_fb.back_textures[0], 1)

			let prev_colour_space = -1
			let prev_colour_space_b = -1
			let prev_brush_tex_idx = -1
			
			let prev_hsv_dynamics = [0,0,0]
			let prev_tex_stretch = [0,0]
			// let prev_brush_tex_idx = -1

			gl.useProgram(composite_stroke_to_canvas_program.program)

			composite_stroke_to_canvas_program.setUniformTexture('canvas_b', canvas_fb._textures[0], 2)
			composite_stroke_to_canvas_program.setUniformTexture('canvas_a', canvas_fb._back_textures[0], 3)
			composite_stroke_to_canvas_b_program.setUniformTexture('canvas_b', canvas_fb._textures[0], 2)
			composite_stroke_to_canvas_b_program.setUniformTexture('canvas_a', canvas_fb._back_textures[0], 3)

			gl.activeTexture(gl.TEXTURE15)
			let comp_program = composite_stroke_to_canvas_program
			gl.clearColor(0,0,0,0)
			gl.viewport(0, 0, project.canvasRes[0], project.canvasRes[1])

			for(let amogus of drawer.recorded_drawcalls){
				const new_tex_stretch = project.brush_strokes[k].draw_params.tex_stretch
				const new_hsv_dynamics = project.brush_strokes[k].draw_params.tex_lch_dynamics

				const new_brush_tex_idx = project.brush_strokes[k].brush_texture.idx
				const new_col_space = project.brush_strokes[k].draw_params.blending_colour_space

				gl.bindFramebuffer(gl.FRAMEBUFFER, temp_stroke_fb.fb)
				gl.clear(gl.COLOR_BUFFER_BIT)

				brush_shader.use()

				if(new_brush_tex_idx !== prev_brush_tex_idx){
					// @ts-ignore
					gl.uniform1i(brush_shader.brush_texture_idx_loc, prev_brush_tex_idx = new_brush_tex_idx )
				}
				if(
					prev_hsv_dynamics[0] !== new_hsv_dynamics[0] || 
					prev_hsv_dynamics[1] !== new_hsv_dynamics[1] || 
					prev_hsv_dynamics[2] !== new_hsv_dynamics[2] 
				){
					// @ts-ignore
					gl.uniform3fv(brush_shader.tex_hsv_dynamics_loc, project.brush_strokes[k].draw_params.tex_lch_dynamics )
				}
				if(
					prev_tex_stretch[0] !== new_tex_stretch[0] || 
					prev_tex_stretch[1] !== new_tex_stretch[1] 
				){
					// @ts-ignore
					gl.uniform2fv(brush_shader.tex_stretch_loc, project.brush_strokes[k].draw_params.tex_stretch )
				}

				drawer.draw_stroke_idx(k)

				gl.bindFramebuffer(gl.FRAMEBUFFER, canvas_fb.fb)

				comp_program = canvas_fb.pong_idx === 0 ? composite_stroke_to_canvas_program : composite_stroke_to_canvas_b_program
				comp_program.use()

				if(canvas_fb.pong_idx === 0){
					if(new_col_space !== prev_colour_space){
						// @ts-ignore
						gl.uniform1i(comp_program.blending_colour_space_loc, prev_colour_space = new_col_space)
					}
				} else {
					if(new_col_space !== prev_colour_space_b){
						// @ts-ignore
						gl.uniform1i(comp_program.blending_colour_space_loc, prev_colour_space_b = new_col_space)
					}
				}

				gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)

				canvas_fb.pong()
				
				prev_hsv_dynamics[0] = new_hsv_dynamics[0]
				prev_hsv_dynamics[1] = new_hsv_dynamics[1]
				prev_hsv_dynamics[2] = new_hsv_dynamics[2] 
				prev_tex_stretch[0] = new_tex_stretch[0]
				prev_tex_stretch[1] = new_tex_stretch[1]
				k++
			}
			redraw_needed = true
			temp_stroke_fb.clear()

			console.timeEnd("REDRAW ALL")
		}
		resize_project = (new_sz: number[]): void => {
			project.canvasRes = [...new_sz]
			temp_stroke_fb.textures[0].resize(new_sz)
			canvas_fb.back_textures[0].resize(new_sz)
			canvas_fb.textures[0].resize(new_sz)
			canvas_fb.recreate()
			canvas_fb.back_textures[0].bind_to_unit(1)
			temp_stroke_fb.recreate()
			temp_stroke_fb.textures[0].bind_to_unit(0)
			set_shared_uniforms()
			full_redraw_needed = true
			project_has_been_modified = false
			redo_history_length = 0
		}
		
		let load_project = (new_project: Project) =>{
			project = new Project()
			// NOT NEEDED
			// for (let key of Object.keys(project as Object)){
			// 	delete project[key]
			// } 
			project_has_been_modified = false
			redo_history_length = 0
			for (let key of Object.keys(new_project as Object)) {
				// @ts-ignore
				project[key] = new_project[key]
			}
			project.canvasRes = [...new_project.canvasRes]
			resize_project(project.canvasRes)
			redraw_whole_project()
		}
		let local_storage_proj = localStorage.getItem('project')

		if (local_storage_proj) {
			local_storage_proj = JSON.parse(local_storage_proj)
			// @ts-ignore
			load_project(local_storage_proj)
		} else {
			// load_project(new Project())
			load_project(new Project())
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

			redraw_needed = true // TOREMOVE
			
			// const get_pinch_zoom = (pinch_zoom: number): number=>{

			// }

			if(io.just_finished_pinch){
				zoom[0] = desired_zoom = pow(2, log2(desired_zoom) + io.pinch_zoom)
				// panning[0] = panning_temp_pinch[0]
				// panning[1] = panning_temp_pinch[1]
			}
			if(io.two_finger_pinch){
				redraw_needed = true
				// zoom = mix(zoom,desired_zoom + io.pinch_zoom,delta_t*20)
				zoom[0] = pow(2,log2(desired_zoom)  + io.pinch_zoom)
				if(io.just_started_pinch){
					panning_temp_pinch[0] = panning[0]
					panning_temp_pinch[1] = panning[1]
				}
				panning[0] = panning_temp_pinch[0] + io.pinch_pos[0]
				panning[1] = panning_temp_pinch[1] - io.pinch_pos[1]
			} else if(abs(desired_zoom - zoom[0]) > 0.00000001 ){
				redraw_needed = true
				zoom[0] = mix(zoom[0],desired_zoom,delta_t*20)
			}
			if (frame === 0 || picking || just_finished_pick || io.mouse_wheel || io.mmb_down) {
				redraw_needed = true
				if (just_finished_pick) {
					let coords = Utils.screen_NDC_to_canvas_NDC(
						[...io.mouse_pos],
						default_framebuffer.textures[0],
						canvas_fb._textures[0],
						zoom[0],
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
					panning[0] += io.delta_mouse_pos[0] / zoom[0]
					panning[1] += io.delta_mouse_pos[1] / zoom[0]
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
					brush_stroke = new BrushStroke(curr_brush.selected_brush_type, new DrawParams(
						curr_brush.tex_dynamics, curr_brush.tex_lch_dynamics, curr_brush.tex_stretch,
						blending_colour_space
						), curr_brush.selected_brush_texture)
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
						zoom[0],
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

					brush_rot[1] += 10*curr_brush.rot_jitter * (2 * hash.valueNoiseSmooth(t * 10 + 100, 2) - 1)

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
			resizeDefaultFramebufferIfNeeded(canvasElement, default_framebuffer, userAgentRes, (v: boolean) => {
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
			
			if(full_redraw_needed){
				redraw_whole_project()
			}

			handle_input_actions()

			// ----- RECORD STROKE / DRAW
			if ((io.mouse_just_pressed || (io.mouse_down && io.mouse_just_moved)) && io.pointerType !== 'touch') {
				project_has_been_modified = true
				redraw_needed = true
				record_stroke()
				// gl.enable(gl.BLEND)
				temp_stroke_fb.clear()
				temp_stroke_fb.bind()
				// drawer.draw_any_stroke(brush_stroke, t, brush_buffer, zoom, panning)
				drawer.brush_buffer = brush_buffer
				drawer.reset()
				drawer.push_any_stroke(brush_stroke)
				drawer.brush_buffer.upload_all_buffs()
				const brush_shader = drawer.brush_buffer.shader
				brush_shader.use()
				// @ts-ignore
				gl.uniform1i(brush_shader.brush_texture_idx_loc, curr_brush.selected_brush_texture.idx )
				// @ts-ignore
				gl.uniform3fv(brush_shader.tex_hsv_dynamics_loc, curr_brush.tex_lch_dynamics )
				// @ts-ignore
				gl.uniform2fv(brush_shader.tex_stretch_loc, curr_brush.tex_stretch )
				drawer.draw_stroke_idx(0)
			}
			// ----- COMPOSITE
			if (io.mouse_just_unpressed && io.pointerType !== 'touch' && !(undo_pending || redo_pending)) {
				if(frame % 25 === 0 || !isOnMobile){
					localStorage.setItem('project', JSON.stringify(project))
					// floating_modal_message.set("saved")
				}
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
				if(canvas_fb._textures[0].mipmapped){
					gl.bindTexture(gl.TEXTURE_2D, canvas_fb._textures[0].tex)
					gl.generateMipmap(gl.TEXTURE_2D)
					gl.bindTexture(gl.TEXTURE_2D, canvas_fb._back_textures[0].tex)
					gl.generateMipmap(gl.TEXTURE_2D)
					gl.bindTexture(gl.TEXTURE_2D, null)
				}
				if(temp_stroke_fb.textures[0].mipmapped){
					gl.bindTexture(gl.TEXTURE_2D, temp_stroke_fb.textures[0].tex)
					gl.generateMipmap(gl.TEXTURE_2D)
					gl.bindTexture(gl.TEXTURE_2D, null)
				}

				default_framebuffer.clear([0, 0, 0, 1])
				default_framebuffer.bind()

				post_canvas_program.use()

				// @ts-ignore
				gl.uniform1f(post_canvas_program.zoom_loc, zoom)
				// @ts-ignore
				gl.uniform2fv(post_canvas_program.panning_loc, panning)
				// @ts-ignore
				gl.uniform1i(post_canvas_program.blending_colour_space_loc, blending_colour_space)
				canvas_fb.back_textures[0].bind_to_unit(1)
				gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)

				if (brushSizeWidgetDragging) {
					brush_preview_program.use()
					brush_preview_program.setUniformFloat("zoom", zoom[0])
					brush_preview_program.setUniformVec("brush_sz", brush_sz)
					gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
				}

				if (picking) {
					picker_program.use()
					picker_program.setUniformVec('picked_col', picked_col)
					picker_program.setUniformVec('picker_pos', [...io.mouse_pos])
					gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
				}
			}
			print_on_gl_error()
			brushSizeWidgetStoppedDragging = false
			redo_pending = false
			undo_pending = false
			full_redraw_needed = false
			io.tick_end()
			frame++
			for (let framebuffer of Framebuffer.framebuffers) {
				if (framebuffer.needs_pong) {
					framebuffer.pong()
				}
			}
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
				>:global(div) {
					max-height: 2.5rem;	
				}
				flex-wrap: wrap;
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
