<main>
	<div id="bar-container">
		<div id="bar">

			<Knob bind:this={chaosKnob} bind:value={curr_brush.chaos} title={'Chaos'} triggerModal={openModal} modal={chaosSemiModal} />
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
			<BrushSizeWidget
				bind:brush_sz={brush_sz}
				bind:dragging={brush_size_widget_dragging}
				bind:stopped_dragging={brush_size_widget_stopped_dragging} />
			<div 
				style={`
					height: 100%; 
					display: flex; 
					aspect-ratio: 6/1;
					height: 5rem;
					display: flex;
					width: 38rem;
					min-height: 6.6rem;
				`}
				on:pointerenter={()=>{mouse_over_colour_picker = true}}
				on:pointerleave={()=>{mouse_over_colour_picker = false; mouse_over_colour_picker_finished = true}}
			>
				<RGBSliders bind:colour={stroke_col} />
				<ColourDisplay 
					bind:colour={stroke_col} 
					bind:update_display={trigger_colour_display_update} 
					bind:colAdjustStart={colAdjustStart}
					bind:colAdjustMove={colAdjustMove}
					bind:colAdjustEnd={colAdjustEnd}
					/>
			</div>
			<!-- <BrushTypeWidget bind:selected_brush_type={curr_brush.selected_brush_type} /> -->
			<BrushTypeWidget bind:curr_brush={curr_brush} />
			<BrushPresetWidget bind:brush_presets={brush_presets} bind:selected_brush_preset={curr_brush} />
			<!-- <FourIconsWidget> -->
				<UndoRedoWidget
					undo={() => {
						undo_pending = true
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
					bind:is_temp_project={is_temp_project}
					bind:recording_pending={recording_pending}
					bind:resize_project={resize_project}
					bind:project_has_been_modified={project_has_been_modified}
					bind:is_safe_to_switch_to_new_project={is_safe_to_switch_to_new_project}
					/>
				<PickColourWidget
					pick_from_canvas={() => pick_from_canvas()}
					bind:picking={picking}
					bind:just_finished_pick={just_finished_pick} />
			<!-- </FourIconsWidget> -->
			<BlendingColourSpaceWidget bind:selected_colour_space={blending_colour_space}/>
			<FloatingModal />
		</div>
		<SemiModal bind:this={chaosSemiModal} knob={chaosKnob}>
			<Sliders 
				bind:value_1={curr_brush.chaos_lch[0]} 
				bind:value_2={curr_brush.chaos_lch[1]} 
				bind:value_3={curr_brush.chaos_lch[2]} 
				names={["Chaos L", "Chaos C", "Chaos H"]} />
			<Knob bind:value={curr_brush.chaos_speed} title={'Chaos Speed'} />
		</SemiModal>
		<SemiModal bind:this={dynamicsSemiModal} knob={dynamicsKnob}>
			<Sliders bind:value_1={curr_brush.stroke_opacity_dynamics[0]} bind:value_2={curr_brush.stroke_opacity_dynamics[1]} names={["Opacity min", "Opacity max"]} />
			<Sliders bind:value_1={curr_brush.stroke_size_dynamics[0]} bind:value_2={curr_brush.stroke_size_dynamics[1]} names={["Size min", "Size max"]} />
			<Knob bind:value={curr_brush.rot_jitter} title={'Rot jitt'} />
			<Knob bind:value={curr_brush.pos_jitter} title={'Pos jitt'} />
		</SemiModal>
		<SemiModal bind:this={texDynamicsSemiModal} knob={texDynamicsKnob}>
			<Knob bind:value={curr_brush.tex_grit} title={'Grit'} />
			<Knob bind:value={curr_brush.tex_distort_amt} title={'Distort Amt'} />
			<Knob bind:value={curr_brush.tex_distort[0]} title={'Distort X'} />
			<Knob bind:value={curr_brush.tex_distort[1]} title={'Distort Y'} />
			<Sliders 
				bind:value_1={curr_brush.tex_lch_dynamics[0]} 
				bind:value_2={curr_brush.tex_lch_dynamics[1]} 
				bind:value_3={curr_brush.tex_lch_dynamics[2]} 
				names={["Noise V", "Noise S", "Noise H"]} />
			<TextureStretchWidget bind:selected_brush_texture={curr_brush.selected_brush_texture} bind:selected_brush_preset={curr_brush}/>
			<TextureWidget bind:brush_textures={brush_textures} bind:selected_brush_texture={curr_brush.selected_brush_texture} />
		</SemiModal>
	</div>
	<canvas draggable="false" id="canvas" bind:this={canvasElement} />
</main>


<script lang="ts">
	import {onMount} from 'svelte'
	import {onDestroy} from 'svelte'
	import {floating_modal_message} from 'store'

	import {resizeIfNeeded as resizeDefaultFramebufferIfNeeded, print_on_gl_error, init_gl_error_handling, copy_fb_to_texture, copy_fb_to_fb} from 'gl_utils'

	import Knob from './Knob.svelte'
	import BrushSizeWidget from './BrushSizeWidget.svelte'
	import BrushTypeWidget from './BrushTypeWidget.svelte'
	import BrushPresetWidget from './BrushPresetWidget.svelte'
	import UndoRedoWidget from './UndoRedoWidget.svelte'
	import GalleryWidget from './GalleryWidget.svelte'
	import FloatingModal from './FloatingModal.svelte'
	import PickColourWidget from './PickColourWidget.svelte'
	import TextureWidget from './TextureWidget.svelte'
	import TextureStretchWidget from './TextureStretchWidget.svelte'
	import BlendingColourSpaceWidget from './BlendingColourSpaceWidget.svelte'

	import RGBSliders from './RGBSliders.svelte'
	import Sliders from './Sliders.svelte'
	import ColourDisplay from './ColourDisplay.svelte'
	import SemiModal from './SemiModal.svelte'
	import FourIconsWidget from './FourIconsWidget.svelte'
	import {IO} from 'IO'
	import chroma from 'chroma-js'
	import {Hash, abs, pow, tau, mix, max, log2} from 'wmath'
	import {clamp, lerp, mod, smoothstep} from '@0b5vr/experimental'
	import {BrushTexture, DexieSketchDB, Project, Utils} from 'stuff'
	import {BlendingColourSpace, BrushPreset, BrushStroke, BrushType, DrawParams} from 'brush_stroke'
	import {Drawer} from 'drawer'
	import { Framebuffer } from 'gl/Framebuffer'
	import { VertexBuffer, UBO } from 'gl/Buffer'
	import { Texture } from 'gl/Texture'
	import { ShaderProgram } from 'gl/ShaderProgram'
	import { Thing } from 'gl/Thing'
	// import Dexie, { type DBCoreRangeType } from "dexie"


	window.sketch_db = new DexieSketchDB()

	// let dexies = new Dexie('my db')

	// Elements
	let canvasElement: HTMLCanvasElement
	let chaosSemiModal: SemiModal
	let dynamicsSemiModal: SemiModal
	let texDynamicsSemiModal: SemiModal
	let modals: SemiModal[] = []
	let chaosKnob: Knob
	let dynamicsKnob: Knob
	let texDynamicsKnob: Knob
	

	// UI State
	let brush_size_widget_dragging: boolean
	let brush_size_widget_stopped_dragging: boolean
	let new_project_pending: boolean = false
	let recording_pending: boolean = false
	let recording_stroke_idx: number = 0
	let recording: boolean = false
	let undo_pending: boolean = false
	let redo_pending: boolean = false
	let mouse_over_colour_picker = false
	let mouse_over_colour_picker_finished = false
	let picking: boolean
	let just_finished_pick: boolean
	let picked_col: number[] = [0, 0, 0]
	let project_has_been_modified = false
	let is_safe_to_switch_to_new_project
	let full_redraw_needed: boolean = false

	let colAdjustStart : (clientX: number, clientY: number, is_vs_adjusting: boolean)=>void
	let colAdjustMove : (valueDiffX: number, valueDiffY: number)=>void
	let colAdjustEnd : () => void

	const zoom = window.zoom = Float32Array.from([1])
	let desired_zoom = 1
	const panning_temp_pinch = new Float32Array(2)
	let panning = new Float32Array(2)
	let brush_presets: BrushPreset[] = [
		new BrushPreset(),
		new BrushPreset(),
		new BrushPreset(),
		new BrushPreset(),
		new BrushPreset(),
		new BrushPreset(),
	]
	let brush_textures: Array<BrushTexture> = []
	let noise_tex: Texture 


	// Internals
	const undo_cache_steps = 15
	const hash = new Hash()
	let io: IO
	let gl: WebGL2RenderingContext
	let project = new Project()
	let project_pending_load: Project
	let is_temp_project: boolean

	// GL stuff
	let default_framebuffer: Framebuffer
	let canvas_fb: Framebuffer
	let canvas_read_tex: Texture
	let temp_undo_fb_a: Framebuffer
	let temp_undo_fb_b: Framebuffer
	
	let temp_undo_fb_a_idx = 100000
	let temp_undo_fb_b_idx = 100000

	let drawer: Drawer
	let ubo: UBO

	// Drawing params
	let stroke_col: Array<number> = [0.5, 0.4, 0.3, 1]
	let stroke_opacity = 0
	let brush_rot: number[] = [0, 0]
	let brush_pos_ndc_screen: number[] = [0, 0]
	let brush_pos_ndc_canvas: number[] = [0, 0]
	let brush_sz: number[] = [1, 0.5]
	
	let curr_brush: BrushPreset = brush_presets[0]
	let blending_colour_space = BlendingColourSpace.OkLCH

	let brush_params_mat = new Float32Array(16)

	// Funcs
	let resize_project: (sz: number[])=>void
	let trigger_colour_display_update: (colour_r, colour_g, colour_b)=>void

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
		window.gl = gl = canvasElement.getContext('webgl2', {
			preserveDrawingBuffer: true,
			alpha: false,
			premultipliedAlpha: false,
			antialias: true
		}) as WebGL2RenderingContext
		gl.getExtension('OES_texture_float');
		gl.getExtension('OES_texture_float_linear');
		gl.getExtension('EXT_color_buffer_float');


		gl.debugEnabled = process.env.NODE_ENV === 'development'
		gl.debugEnabled = false
		init_gl_error_handling()

		const userAgentRes = [canvasElement.clientWidth, canvasElement.clientWidth]

		default_framebuffer = Object.create(Framebuffer.prototype)
		default_framebuffer.default = true
		default_framebuffer.pongable = false
		default_framebuffer.needs_pong = false
		default_framebuffer.pong_idx = 0
		// @ts-ignore
		default_framebuffer._fb = null
		default_framebuffer._textures = [Object.create(Texture.prototype)]
		default_framebuffer.textures[0].res = [...userAgentRes]

		default_framebuffer.bind()

		canvas_fb = new Framebuffer([
			new Texture([project.canvasRes[0], project.canvasRes[1]], gl.RGBA16F, !isOnMobile) 
		], true)

		temp_undo_fb_a = new Framebuffer([
			new Texture([project.canvasRes[0], project.canvasRes[1]], gl.RGBA16F, false) 
		], false)

		temp_undo_fb_b = new Framebuffer([
			new Texture([project.canvasRes[0], project.canvasRes[1]], gl.RGBA16F, false) 
		], false)

		

		ubo = new UBO()
		window.ubo = ubo
		

		resizeDefaultFramebufferIfNeeded(canvasElement, default_framebuffer, userAgentRes, (e) => {}, ()=>{set_shared_uniforms()})
		set_shared_uniforms()

		gl.disable(gl.CULL_FACE)
		gl.disable(gl.DEPTH_TEST)
		gl.enable(gl.BLEND)
		
		gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA,);
		gl.blendEquationSeparate(gl.FUNC_ADD, gl.FUNC_ADD) 
	}
	const init_other_stuff = async () => {
		window.addEventListener("dragstart",(event)=>{
			event.preventDefault();
		})
		if ("wakeLock" in navigator) {
			try{
				const wakeLock = await navigator.wakeLock.request("screen");
			} catch(_){

			}
		} 
		io = new IO()
		document.addEventListener('contextmenu', (event) => event.preventDefault())
		window.history.pushState(null, "", window.location.href);
		window.addEventListener('popstate', ()=> {
			window.history.pushState(null, "", window.location.href);
		});

		noise_tex = await Texture.from_image_path(require("../../public/images/noise_tex.webp").default)

		brush_textures.push(
			await BrushTexture.create(require("../../public/images/brow.webp").default, 0)
		)
		brush_textures.push(
			await BrushTexture.create(require("../../public/images/charcoal.webp").default, 1)
		)
		brush_textures.push(
			await BrushTexture.create(require("../../public/images/circle.webp").default, 2)
		)
		brush_textures.push(
			await BrushTexture.create(require("../../public/images/gradient_bottom_to_top.webp").default, 3)
		)
		brush_textures.push(
			await BrushTexture.create(require("../../public/images/oil_01.webp").default, 4)
		)
		brush_textures.push(
			await BrushTexture.create(require("../../public/images/oil_taper.webp").default, 5)
		)
		brush_textures.push(
			await BrushTexture.create(require("../../public/images/square.webp").default, 6)
		)
		brush_textures = [...brush_textures]

		for(let brush of brush_presets){
			brush.selected_brush_texture = brush_textures[0]
		}

		{
			brush_presets[0].selected_brush_type = BrushType.Long
			brush_presets[0].selected_brush_texture = brush_textures[4]
			brush_presets[0].tex_stretch[0] = 0.5 + 1/20
			brush_presets[0].tex_stretch[1] = 0.5 + 1/20
			brush_presets[0].tex_distort[0] = 0.294
			brush_presets[0].tex_distort[1] = 0
			brush_presets[0].tex_distort_amt = 0.18
			// brush_presets[0].noise_stretch[0] = curr_brush.noise_stretch[0] = 0
			// brush_presets[0].noise_stretch[1] = curr_brush.noise_stretch[1] = 0.1
			curr_brush.tex_stretch[0] = brush_presets[0].tex_stretch[0]
			curr_brush.tex_stretch[1] = brush_presets[0].tex_stretch[1]
		}
		{
			brush_presets[1].selected_brush_type = BrushType.Blobs
			brush_presets[1].selected_brush_texture = brush_textures[0]
			brush_presets[1].tex_stretch[0] = 0.5 + 1/20
			brush_presets[1].tex_stretch[1] = 0.5 + 1/20
			brush_presets[1].tex_distort[0] = 0
			brush_presets[1].tex_distort[1] = 0
			// brush_presets[1].noise_stretch[0] = curr_brush.noise_stretch[0] = 0
			// brush_presets[1].noise_stretch[1] = curr_brush.noise_stretch[1] = 0.1
			
		}
		modals = [chaosSemiModal, dynamicsSemiModal, texDynamicsSemiModal]
	}

	onMount(async () => {
		init_web_gl()
		await init_other_stuff()

		default_framebuffer.bind()
		default_framebuffer.clear([0, 0, 0, 1])
 
		canvas_fb.clear([0, 0, 0, 0])
		canvas_fb.pong()
		canvas_fb.back_textures[0].bind_to_unit(1)
		canvas_fb.clear([0, 0, 0, 0])

		const temp_stroke_fb = new Framebuffer([
			new Texture([project.canvasRes[0], project.canvasRes[1]], gl.RGBA16F, !isOnMobile)
		])
		temp_stroke_fb.clear([0, 0, 0, 0])

		//! ------------------- SHADERS
		const init_texture_uniforms = (program: ShaderProgram) =>{
			program.setUniformTexture('temp_tex', temp_stroke_fb.textures[0], 0)
			program.setUniformTexture('canvas_back', canvas_fb.back_textures[0], 1)
			program.setUniformTexture('canvas_b', canvas_fb._textures[0], 2)
			program.setUniformTexture('canvas_a', canvas_fb._back_textures[0], 3)
			
			const brush_tex_start_idx = 5
			brush_textures.forEach((brush_tex, i )=>{
				const name = `brush_texture[${i}]`
				console.log(name)
				const brush_textures_loc = gl.getUniformLocation(program.program, name)
				brush_tex.gpu_tex.bind_to_unit(brush_tex_start_idx + i)				
				gl.uniform1i(brush_textures_loc, brush_tex_start_idx + i);
			})
			 
			noise_tex.bind_to_unit(brush_tex_start_idx + brush_textures.length)				
			const noise_tex_loc = gl.getUniformLocation(program.program, "noise_tex")
			gl.uniform1i(noise_tex_loc, brush_tex_start_idx + brush_textures.length);
			// gl.activeTexture(gl.TEXTURE0) // TODELETE
			gl.activeTexture(gl.TEXTURE0) // TODELETE
		}
		const brush_preview_program = new ShaderProgram(require('shaders/brush_preview.vert'), require('shaders/brush_preview.frag'))
		const colour_preview_program = new ShaderProgram(require('shaders/colour_preview.vert'), require('shaders/colour_preview.frag'))
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
		post_canvas_program.zoom_loc = gl.getUniformLocation(post_canvas_program.program, "zoom")
		post_canvas_program.panning_loc = gl.getUniformLocation(post_canvas_program.program, "panning")
		post_canvas_program.blending_colour_space_loc = gl.getUniformLocation(post_canvas_program.program, "blending_colour_space")
		
		const brush_long_program = new ShaderProgram(require('shaders/brush_long.vert'), require('shaders/brush_long.frag'))

		brush_preview_program.use()
		init_texture_uniforms(brush_preview_program)
		colour_preview_program.use()
		init_texture_uniforms(colour_preview_program)
		picker_program.use()
		init_texture_uniforms(picker_program)
		composite_stroke_to_canvas_program.use()
		init_texture_uniforms(composite_stroke_to_canvas_program)
		composite_stroke_to_canvas_b_program.use()
		init_texture_uniforms(composite_stroke_to_canvas_b_program)
		composite_stroke_to_canvas_program.blending_colour_space_loc = gl.getUniformLocation(composite_stroke_to_canvas_program.program, "blending_colour_space")
		composite_stroke_to_canvas_b_program.blending_colour_space_loc = gl.getUniformLocation(composite_stroke_to_canvas_b_program.program, "blending_colour_space")

		post_canvas_program.use()
		init_texture_uniforms(post_canvas_program)

		brush_long_program.use()
		init_texture_uniforms(brush_long_program)
		brush_long_program.brush_params_loc = gl.getUniformLocation(brush_long_program.program, "brush_params")
		

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
			new DrawParams(
				curr_brush.tex_dynamics, 
				curr_brush.tex_lch_dynamics, 
				// curr_brush.noise_stretch, 
				curr_brush.tex_stretch, 
				curr_brush.tex_distort, 
				curr_brush.tex_distort_amt, 
				curr_brush.tex_grit, 
				BlendingColourSpace.Pigments
				),
				curr_brush.selected_brush_texture
			)


		drawer = new Drawer(
			gl,
			canvas_fb.textures[0],
			default_framebuffer,
		)
		const composite_stroke = () => {
			canvas_fb.bind()
			canvas_fb.clear()

			const comp_program = canvas_fb.pong_idx === 0 ? composite_stroke_to_canvas_program : composite_stroke_to_canvas_b_program
			if(canvas_fb.pong_idx === 0){
				
			}
			comp_program.use()
			gl.uniform1i(comp_program.blending_colour_space_loc, blending_colour_space)
			canvas_fb.back_textures[0].bind_to_unit(1)
			gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
			temp_stroke_fb.clear()
		}
		
		const draw_n_strokes = (start_idx: number | undefined, end_idx: number | undefined, full_redraw: boolean = false)=>{
			let k = 0
			
			drawer.brush_buffer = brush_buffer
			drawer.reset()
			
			start_idx = start_idx ?? 0
			end_idx = end_idx ?? project.brush_strokes.length
			
			for(k = start_idx; k < end_idx; k++){
				const stroke = project.brush_strokes[k]
				drawer.push_any_stroke(stroke)
			}

			drawer.brush_buffer.upload_all_buffs()
			const brush_shader = drawer.brush_buffer.shader
			brush_shader.use()

			let prev_colour_space = -1
			let prev_colour_space_b = -1
			let prev_brush_tex_idx = -1
			
			let prev_hsv_dynamics = [-9999,-9999,-9999]
			// let prev_noise_stretch = [-9999,-9999]
			let prev_tex_stretch = [-9999,-9999]
			let prev_tex_distort = [-9999,-9999]
			let prev_tex_distort_amt = -9999
			let prev_tex_grit = -9999


			gl.useProgram(composite_stroke_to_canvas_program.program)

			canvas_fb._textures[0].bind_to_unit(2)
			canvas_fb._back_textures[0].bind_to_unit(3)

			gl.activeTexture(gl.TEXTURE15)
			let comp_program = composite_stroke_to_canvas_program
			gl.clearColor(0,0,0,0)
			gl.viewport(0, 0, project.canvasRes[0], project.canvasRes[1])

			k = start_idx
			let j = 0
			
			for(let amogus of drawer.recorded_drawcalls){
				// const new_noise_stretch = project.brush_strokes[k].draw_params.noise_stretch
				const new_tex_stretch = project.brush_strokes[k].draw_params.tex_stretch
				const new_tex_distort = project.brush_strokes[k].draw_params.tex_distort
				const new_tex_distort_amt = project.brush_strokes[k].draw_params.tex_distort_amt
				const new_tex_grit = project.brush_strokes[k].draw_params.tex_grit
				const new_hsv_dynamics = project.brush_strokes[k].draw_params.tex_lch_dynamics

				const new_brush_tex_idx = project.brush_strokes[k].brush_texture.idx
				const new_col_space = project.brush_strokes[k].draw_params.blending_colour_space

				gl.bindFramebuffer(gl.FRAMEBUFFER, temp_stroke_fb.fb)
				gl.clear(gl.COLOR_BUFFER_BIT)

				brush_shader.use()

				if(
					new_brush_tex_idx !== prev_brush_tex_idx ||
					prev_hsv_dynamics[0] !== new_hsv_dynamics[0] || 
					prev_hsv_dynamics[1] !== new_hsv_dynamics[1] || 
					prev_hsv_dynamics[2] !== new_hsv_dynamics[2] ||
					// prev_noise_stretch[0] !== new_noise_stretch[0] || 
					// prev_noise_stretch[1] !== new_noise_stretch[1] ||
					prev_tex_stretch[0] !== new_tex_stretch[0] || 
					prev_tex_stretch[1] !== new_tex_stretch[1] ||
					prev_tex_distort[0] !== new_tex_distort[0] || 
					prev_tex_distort[1] !== new_tex_distort[1]  ||
					prev_tex_distort_amt !== new_tex_distort_amt ||
					prev_tex_grit !== new_tex_grit
					){
					brush_params_mat[0] = new_brush_tex_idx
					brush_params_mat[1] = new_hsv_dynamics[0]
					brush_params_mat[2] = new_hsv_dynamics[1]
					brush_params_mat[3] = new_hsv_dynamics[2]
					// brush_params_mat[4] = new_noise_stretch[0]
					// brush_params_mat[5] = new_noise_stretch[1]
					brush_params_mat[6] = new_tex_stretch[0]
					brush_params_mat[7] = new_tex_stretch[1] 
					brush_params_mat[8] = new_tex_distort[0]
					brush_params_mat[9] = new_tex_distort[1] 
				  brush_params_mat[10] = new_tex_distort_amt
				  brush_params_mat[11] = new_tex_grit
					gl.uniformMatrix4fv(brush_shader.brush_params_loc, false, brush_params_mat)
				}

				drawer.draw_stroke_idx(j)

				gl.bindFramebuffer(gl.FRAMEBUFFER, canvas_fb.fb)

				comp_program = canvas_fb.pong_idx === 0 ? composite_stroke_to_canvas_program : composite_stroke_to_canvas_b_program
				comp_program.use()

				if(canvas_fb.pong_idx === 0){
					if(new_col_space !== prev_colour_space){
						gl.uniform1i(comp_program.blending_colour_space_loc, prev_colour_space = new_col_space)
					}
				} else {
					if(new_col_space !== prev_colour_space_b){
						gl.uniform1i(comp_program.blending_colour_space_loc, prev_colour_space_b = new_col_space)
					}
				}

				gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)

				canvas_fb.pong()
				
				if(full_redraw){
					const offs = (end_idx % undo_cache_steps)
					if(end_idx < undo_cache_steps){
						if(j === 0){
							// copy_fb_to_fb(canvas_fb.fb_back, temp_undo_fb_a.fb, canvas_fb._textures[0].res)
							temp_undo_fb_a.clear()
							temp_undo_fb_a_idx = 0
						}
					} else {
						if(j === end_idx - offs - 1){
							copy_fb_to_fb(canvas_fb.fb_back, temp_undo_fb_a.fb, canvas_fb._textures[0].res)
							temp_undo_fb_a_idx = j + 1
						} else if(j === end_idx - offs - undo_cache_steps - 1){
							copy_fb_to_fb(canvas_fb.fb_back, temp_undo_fb_b.fb, canvas_fb._textures[0].res)
							temp_undo_fb_b_idx = j + 1
						}
					}
				}
				
				prev_hsv_dynamics[0] = new_hsv_dynamics[0]
				prev_hsv_dynamics[1] = new_hsv_dynamics[1]
				prev_hsv_dynamics[2] = new_hsv_dynamics[2] 
				prev_tex_stretch[0] = new_tex_stretch[0]
				prev_tex_stretch[1] = new_tex_stretch[1]
				prev_tex_distort[0] = new_tex_distort[0]
				prev_tex_distort[1] = new_tex_distort[1]
				prev_tex_distort_amt = new_tex_distort_amt
				prev_tex_grit = new_tex_grit
				k++
				j++
			}
			if(end_idx === 0){
				copy_fb_to_fb(canvas_fb.fb_back, temp_undo_fb_a.fb, canvas_fb._textures[0].res)
				temp_undo_fb_a_idx = 0
			} 
			redraw_needed = true
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


			draw_n_strokes(0, project.brush_strokes.length - redo_history_length, true)

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
			temp_undo_fb_a.textures[0].resize(new_sz)
			temp_undo_fb_a.recreate()
			temp_undo_fb_b.textures[0].resize(new_sz)
			temp_undo_fb_b.recreate()
			set_shared_uniforms()
			full_redraw_needed = true
			project_has_been_modified = false
			redo_history_length = 0
		}
		
		let load_project = (new_project: Project) =>{
			project = new Project()
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
		const create_new_project = async () => {
			load_project(new Project())
			await window.sketch_db.table("temp_sketch").put({id: project.id, data: project},1)
			localStorage.setItem("curr_proj_id", String(-1))
			is_temp_project = true
		}
		let local_storage_curr_proj_id = localStorage.getItem("curr_proj_id")

		if (local_storage_curr_proj_id) {
			is_temp_project = Number(local_storage_curr_proj_id) < 0
			let proj: Project
			if(is_temp_project){
				proj = (await window.sketch_db.table("temp_sketch").toArray())[0].data
			} else {
				let dexie_local_storage_entry = await window.sketch_db.table("sketch").get(Number(local_storage_curr_proj_id))
				proj = dexie_local_storage_entry.data
			}
			try{
				load_project(proj)
				localStorage.setItem(
					"curr_proj_id", 
					is_temp_project ? String(-1) : String(project.id)
				)
			} catch(e){
				console.log("Couldn't load project, creating new one.")
			}
		} else {
			await create_new_project()
		}
		
		const handle_input_actions = ()=>{
			if(io.pen_button_just_pressed){
				// console.log(e)
				console.log('pen button press')
				mouse_over_colour_picker = true
				colAdjustStart(io.mouse_pos[0], io.mouse_pos[1], true)
			} else if (io.pen_button_down){
				colAdjustMove(io.delta_mouse_pos[0]*1000, io.delta_mouse_pos[1]*1000)
			} else if(io.pen_button_just_unpressed){
				mouse_over_colour_picker = false
				redraw_needed = true
				colAdjustEnd()
			}
			if (io.getKey('AltLeft').down) {
				if (io.getKey('AltLeft').just_pressed) {
					picking = true
				}
				pick_from_canvas()
			} else if (io.getKey('AltLeft').just_unpressed) {
				just_finished_pick = true
				picking = false
			}

			if(mouse_over_colour_picker || mouse_over_colour_picker_finished){
				redraw_needed = true
			}

			if(io.just_finished_pinch){
				zoom[0] = desired_zoom = pow(2, log2(desired_zoom) + io.pinch_zoom)
			}
			if(io.two_finger_pinch){
				redraw_needed = true
				zoom[0] = pow(2,log2(desired_zoom)  + io.pinch_zoom)
				if(io.just_started_pinch){
					panning_temp_pinch[0] = panning[0]
					panning_temp_pinch[1] = panning[1]
				}
				panning[0] = panning_temp_pinch[0] + io.pinch_pos[0]
				panning[1] = panning_temp_pinch[1] - io.pinch_pos[1]
			} else if(abs(desired_zoom - zoom[0]) > 0.001 ){
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
					if (coords[0] > -1 && coords[0] < 1 && coords[1] > -1 && coords[1] < 1) {
						// stroke_col = [...picked_col]
						stroke_col[0] = picked_col[0]
						stroke_col[1] = picked_col[1]
						stroke_col[2] = picked_col[2]
						Utils.gamma_correct(stroke_col, true, true)
						stroke_col[3] = 1
						// stroke_col = [...stroke_col]
						trigger_colour_display_update(stroke_col[0], stroke_col[1], stroke_col[2])
					}
					console.log(coords)
					just_finished_pick = false
					picking = false
					console.log("finished pick")
				}
				if (io.mmb_down) {
					panning[0] += io.delta_mouse_pos[0] / zoom[0]
					panning[1] += io.delta_mouse_pos[1] / zoom[0]
				}
				if (io.mouse_wheel) {
					if (io.mouse_wheel > 0) {
						desired_zoom *= 1.2
					} else {
						desired_zoom /= 1.2
					}
				}
			}

			
			let l_ctrl_down = io.getKey('ControlLeft').down
			let l_shift_down = io.getKey('ShiftLeft').down
			let z_just_pressed = io.getKey('KeyZ').just_pressed
			const idx_before = project.brush_strokes.length - redo_history_length
			if (redo_pending || (l_shift_down && l_ctrl_down && z_just_pressed)) {
				// * --------- REDO --------- * //
				redo_history_length -= 1
				const idx_now = idx_before + 1
				if (redo_history_length >= 0) { 
					// ---- DRAW ONE
					temp_stroke_fb.clear()
					draw_n_strokes(idx_before,idx_now) 
					if(idx_now % undo_cache_steps === 0){
						// ---- HIT CACHE
						// save to cache
						const res = canvas_fb.textures[0].res
						if(temp_undo_fb_a_idx === idx_now){
							copy_fb_to_fb( canvas_fb.fb_back, temp_undo_fb_a.fb, res)
						} else {
							copy_fb_to_fb( temp_undo_fb_a.fb, temp_undo_fb_b.fb, res) // needless copy
							copy_fb_to_fb( canvas_fb.fb_back, temp_undo_fb_a.fb, res)
							temp_undo_fb_b_idx = temp_undo_fb_a_idx 
							temp_undo_fb_a_idx = idx_now 
						}
					} else {
					}
				} else { 
					// clamp
					redo_history_length = 0 
					floating_modal_message.set("Last redo")
				}
			} else if (undo_pending || (l_ctrl_down && z_just_pressed)) {
				// * --------- UNDO --------- * //
				redo_history_length += 1
				const idx_now = idx_before - 1
				if (redo_history_length <= project.brush_strokes.length) { 
					const is_undo_fb_a = ( idx_now >= temp_undo_fb_a_idx && idx_now < temp_undo_fb_a_idx + undo_cache_steps )
					const is_undo_fb_b =  ( idx_now >= temp_undo_fb_b_idx  && idx_now < temp_undo_fb_b_idx + undo_cache_steps )
					const undo_fb = is_undo_fb_a ? temp_undo_fb_a : is_undo_fb_b ? temp_undo_fb_b : undefined;
					if(idx_before % undo_cache_steps === 0){
						// ---- FIND CACHE FB HIT

						if(undo_fb === undefined) {
							// ---- DIDN'T HIT UNDO FB
							const res = canvas_fb.textures[0].res

							canvas_fb.clear()
							canvas_fb.pong()
						  canvas_fb.back_textures[0].bind_to_unit(1)
							canvas_fb.clear()

							let idx = idx_before - undo_cache_steps * 2
							if(idx < 0.){
								// GENERATE B CACHE
								temp_stroke_fb.clear()
								draw_n_strokes(0, temp_undo_fb_a_idx = idx_before - undo_cache_steps)

								copy_fb_to_fb(
									canvas_fb.fb_back,
									temp_undo_fb_a.fb, 
									res
								)
								
							} else {
								// GENERATE B CACHE
								temp_stroke_fb.clear()
								draw_n_strokes(0, temp_undo_fb_b_idx = idx)
								// write b cache
								copy_fb_to_fb(
									canvas_fb.fb_back,
									temp_undo_fb_b.fb, 
									res
								)

								temp_stroke_fb.clear()
								draw_n_strokes(temp_undo_fb_b_idx, temp_undo_fb_a_idx = idx_before - undo_cache_steps)

								copy_fb_to_fb(
									canvas_fb.fb_back,
									temp_undo_fb_a.fb, 
									res
								)
							}
							// DRAW FROM PREV CACHE TO CANVAS
							temp_stroke_fb.clear()
							draw_n_strokes( idx_before - undo_cache_steps, project.brush_strokes.length - redo_history_length)
						} else {
							// HIT UNDO FB
							copy_fb_to_fb(undo_fb.fb,canvas_fb.fb_back, canvas_fb.textures[0].res)
							// DRAW FROM PREV CACHE TO CANVAS
							temp_stroke_fb.clear()
							draw_n_strokes( idx_before - undo_cache_steps, idx_now)
						}
					} else {
						// ---- NO CACHE HIT
						// DRAW FROM PREV CACHE TO CANVAS
						{
							copy_fb_to_fb((undo_fb as Framebuffer).fb,canvas_fb.fb_back, canvas_fb.textures[0].res)
							canvas_fb.back_textures[0].bind_to_unit(1)
							temp_stroke_fb.clear()
							const undo_mod_offs = idx_now % undo_cache_steps
							draw_n_strokes( idx_now - undo_mod_offs, idx_now)
						}
					}
					gl.activeTexture(gl.TEXTURE15)
				} else { 
					// clamp
					redo_history_length -= 1 
					floating_modal_message.set("Last undo")
				}
			}
		}
		
		const record_stroke = ()=>{
				if (io.mouse_just_pressed && !(redo_pending || undo_pending)) {
					brush_stroke = new BrushStroke(curr_brush.selected_brush_type, new DrawParams(
						curr_brush.tex_dynamics, curr_brush.tex_lch_dynamics,
						// curr_brush.tex_stretch,
						[(curr_brush.tex_stretch[0] - 0.5)*20., (curr_brush.tex_stretch[1] - 0.5)*20.],
						curr_brush.tex_distort,
						curr_brush.tex_distort_amt,
						curr_brush.tex_grit,
						blending_colour_space
						), curr_brush.selected_brush_texture)
					for (let i = 0; i < redo_history_length; i++) {
						project.brush_strokes.pop()
					}
					redo_history_length = 0
				}

				brush_rot = [...io.tilt]

				for(let i = 0; i < io.mouse_positions_during_last_frame_cnt; i++){
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
					if(curr_brush.pos_jitter > 0.01){
						brush_pos_ndc_canvas[0] += curr_brush.pos_jitter * (2 * hash.valueNoiseSmooth(t * 100 + 251, 2) - 1)
						brush_pos_ndc_canvas[1] += curr_brush.pos_jitter * (2 * hash.valueNoiseSmooth(t * 100 + 1251, 2) - 1)
					}

					let col = [...stroke_col]

					if(curr_brush.chaos > 0.01) {
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

					if(curr_brush.rot_jitter > 0.01) {
						brush_rot[1] += 10*curr_brush.rot_jitter * (2 * hash.valueNoiseSmooth(t * 10 + 100, 2) - 1)
					}

					let sz = [...brush_sz]

					let size_pressure_weight = lerp(curr_brush.stroke_size_dynamics[0],curr_brush. stroke_size_dynamics[1], io.pressure)
					let size_tilt_weight = lerp(0.4, 1, io.tilt[0] / tau)
					// TODO: sz dynamics
					sz[0] *= size_pressure_weight * size_tilt_weight
					sz[1] *= size_pressure_weight * size_tilt_weight

					brush_stroke.push_stroke(brush_pos_ndc_canvas, brush_rot, sz, stroke_opacity, col)
				}
		}
		
		const video_recording_if_needed = () =>{
				if(!recording){
					canvas_fb.clear()
					canvas_fb.pong()
					canvas_fb.clear()

					default_framebuffer.textures[0].res = [...canvas_fb.textures[0].res]
					canvasElement.width = canvas_fb.textures[0].res[0]
					canvasElement.height = canvas_fb.textures[0].res[1]
					set_shared_uniforms()

					recording_stroke_idx = 0
					recording_pending = false
					recording = true
					gl.uniform1f(post_canvas_program.zoom_loc, 1)
					gl.uniform2fv(post_canvas_program.panning_loc, [0,0])
				} else {
					if(recording_stroke_idx === project.brush_strokes.length - 1){
						// finish
						if (window.media_recorder.state !== "inactive") {
								window.media_recorder.stop();
						}                 
						recording = false

						resizeDefaultFramebufferIfNeeded(
							canvasElement, 
							default_framebuffer, 
							[canvasElement.clientWidth, canvasElement.clientHeight], 
							(e) => {}, 
							()=>{set_shared_uniforms()}
						)
						full_redraw_needed = true
					} else {
						canvas_fb.back_textures[0].bind_to_unit(1)
						canvas_fb.clear()
						temp_stroke_fb.clear()

						draw_n_strokes(recording_stroke_idx, recording_stroke_idx + 1, false)

						gl.viewport(0, 0, default_framebuffer._textures[0].res[0], default_framebuffer._textures[0].res[1])
						gl.bindFramebuffer(gl.FRAMEBUFFER, default_framebuffer.fb)
						gl.clear(gl.COLOR_BUFFER_BIT)

						Framebuffer.currently_bound = default_framebuffer // not needed?

						post_canvas_program.use()

						canvas_fb.back_textures[0].bind_to_unit(1)
						
						gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
						
						recording_stroke_idx++
					}
				}
			
		}

		const draw = (_t: number) => {
			if(recording_pending || recording){
				video_recording_if_needed()
				requestAnimationFrame(draw)
				return
			}
			redraw_needed = false
			const new_t = _t / 1000
			delta_t = new_t - t
			t = new_t
			resizeDefaultFramebufferIfNeeded(
				canvasElement, 
				default_framebuffer, 
				default_framebuffer._textures[0].res, 
				(v: boolean) => {
					redraw_needed = v
				},
				()=>{set_shared_uniforms()}
			)
			io.tick()
			
			
			if(full_redraw_needed){
				redraw_whole_project()
			}

			handle_input_actions()

			// ----- RECORD STROKE / DRAW
			if ((io.mouse_just_pressed || (io.mouse_down && io.mouse_just_moved)) && io.pointerType !== 'touch') {
				project_has_been_modified = true
				redraw_needed = true
				record_stroke()
				temp_stroke_fb.clear()
				temp_stroke_fb.bind()
				drawer.brush_buffer = brush_buffer
				drawer.reset()
				drawer.push_any_stroke(brush_stroke)
				drawer.brush_buffer.upload_all_buffs()
				const brush_shader = drawer.brush_buffer.shader
				brush_shader.use()

				brush_params_mat[0] = curr_brush.selected_brush_texture.idx
				brush_params_mat[1] = brush_stroke.draw_params.tex_lch_dynamics[0]
				brush_params_mat[2] = brush_stroke.draw_params.tex_lch_dynamics[1]
				brush_params_mat[3] = brush_stroke.draw_params.tex_lch_dynamics[2]
				// brush_params_mat[4] = brush_stroke.draw_params.noise_stretch[0]
				// brush_params_mat[5] = brush_stroke.draw_params.noise_stretch[1]
				brush_params_mat[6] = brush_stroke.draw_params.tex_stretch[0]
				brush_params_mat[7] = brush_stroke.draw_params.tex_stretch[1] 
				brush_params_mat[8] = brush_stroke.draw_params.tex_distort[0]
				brush_params_mat[9] = brush_stroke.draw_params.tex_distort[1] 
				brush_params_mat[10] = brush_stroke.draw_params.tex_distort_amt
				brush_params_mat[11] = brush_stroke.draw_params.tex_grit

				gl.uniformMatrix4fv(brush_shader.brush_params_loc, false, brush_params_mat)

				drawer.draw_stroke_idx(0)
			}
			// ----- COMPOSITE NEW STROKE
			if (io.mouse_just_unpressed && io.pointerType !== 'touch' && !(undo_pending || redo_pending)) {
				project.push_stroke(brush_stroke)
				if(frame % 5 === 0 || !isOnMobile){
					// @ts-ignore
					project.brush_strokes[project.brush_strokes.length - 1].brush_texture.gpu_tex = {}
					if(is_temp_project){
						window.sketch_db.table("temp_sketch").put({id: project.id, data: project},1)
					} else {
						window.sketch_db.table("sketch").update(project.id, {data: project})
					}
				}
				redraw_needed = true
				composite_stroke()
				canvas_fb.pong()
				canvas_fb.back_textures[0].bind_to_unit(1)
				if(project.brush_strokes.length % undo_cache_steps === 0){
					const res = canvas_fb.textures[0].res
					copy_fb_to_fb(temp_undo_fb_a.fb, temp_undo_fb_b.fb, res) // needless copy
					copy_fb_to_fb(canvas_fb.fb_back, temp_undo_fb_a.fb, res)
					temp_undo_fb_b_idx = temp_undo_fb_a_idx 
					temp_undo_fb_a_idx = project.brush_strokes.length
				}
			}

			if (brush_size_widget_dragging || brush_size_widget_stopped_dragging) redraw_needed = true

			// ----- REDRAW
			if (redraw_needed) {
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

				// gl.clearColor(0,0,0,1)
				gl.viewport(0, 0, default_framebuffer._textures[0].res[0], default_framebuffer._textures[0].res[1])
				gl.bindFramebuffer(gl.FRAMEBUFFER, default_framebuffer.fb)
				gl.clear(gl.COLOR_BUFFER_BIT)

				Framebuffer.currently_bound = default_framebuffer // not needed?

				post_canvas_program.use()

				gl.uniform1f(post_canvas_program.zoom_loc, zoom[0])
				gl.uniform2fv(post_canvas_program.panning_loc, panning)
				gl.uniform1i(post_canvas_program.blending_colour_space_loc, blending_colour_space)
				canvas_fb.back_textures[0].bind_to_unit(1)
				gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
				
				if((mouse_over_colour_picker && !brush_size_widget_dragging)){
					colour_preview_program.use()
					colour_preview_program.setUniformVec("brush_sz", brush_sz)
					colour_preview_program.setUniformVec("colour", stroke_col)
					gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
				}

				if (brush_size_widget_dragging) {
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
			brush_size_widget_stopped_dragging = false
			redo_pending = false
			undo_pending = false
			full_redraw_needed = false
			mouse_over_colour_picker_finished = false
			canvas_read_tex = canvas_fb.back_textures[0]
			io.tick_end()
			frame++
			for (let framebuffer of Framebuffer.framebuffers) {
				if (framebuffer.needs_pong) {
					framebuffer.pong()
				}
			}

			if(new_project_pending){
				create_new_project().then(_=>{
					new_project_pending = false
					requestAnimationFrame(draw)
					return
				})
			}
			if(project_pending_load){
				load_project(project_pending_load)
				localStorage.setItem("curr_proj_id", String(project.id))
				is_temp_project = false
				// @ts-ignore
				project_pending_load = undefined
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
	:global(*) {
		color: white;
		font-family: 'JetBrains Mono';
		font-weight: 900;
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
				z-index: 0;
				>:global(div) {
					max-height: 4rem;
					height: 100%;
					margin-bottom: auto;
					&:not(:first-of-type){
						margin-left: 0.25rem;
					}
					margin-right: 0.25rem;
					z-index: 1;
				}
				flex-wrap: wrap;
				background: black;
				width: 100%;
				display: flex;
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
		}
	}
</style>
