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
				bind:stopped_dragging={brush_size_widget_stopped_dragging}
				bind:brushResizeStart={brushResizeStart}
				bind:brushResizeMove={brushResizeMove}
				bind:brushResizeEnd={brushResizeEnd}
				 />
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
				<!-- <RGBSliders bind:colour={stroke_col} /> -->
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
						// let [img, blob] = await temp_stroke_fb.back_textures[0].read_back_image(true)
						let [img, blob] = await canvas_fb.back_textures[0].read_back_image(true)

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
					pick_from_canvas={async () => await pick_from_canvas()}
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

	import {resizeIfNeeded as resizeDefaultFrameBufferIfNeeded} from 'gl_utils'

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
	import chroma, { lab } from 'chroma-js'
	import {Hash, abs, pow, tau, mix, max, log2} from 'wmath'
	import {clamp, lerp, mod, smoothstep} from '@0b5vr/experimental'
	import {BrushTexture, DexieSketchDB, Project, Utils} from 'stuff'
	import {BlendingColourSpace, BrushPreset, BrushStroke, BrushType, DrawParams} from 'brush_stroke'
	import {Drawer} from 'drawer'
	import { VertexBuffer } from 'gl/wvertexbuffer'
	import { FrameBuffer, QuadVerts, Shader, StorageBuffer, Texture, Thing, UniformBuffer, WrightGPU } from 'gl/wgpu'
	import { BindGroup, type BindGroupElement } from 'gl/wbindgroup'
	// import { FrameBuffer } from 'gl/FrameBuffer'
	// import { VertexBuffer, UBO } from 'gl/Buffer'
	// import { Texture } from 'gl/Texture'
	// import { ShaderProgram } from 'gl/ShaderProgram'
	// import { Thing } from 'gl/Thing'
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

	let brushResizeStart : (clientX: number, clientY: number, is_vs_adjusting: boolean)=>void
	let brushResizeMove : (valueDiffX: number, valueDiffY: number)=>void
	let brushResizeEnd : () => void

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
	const undo_cache_steps = 60
	const temp_fbs_count = 15
	const hash = new Hash()
	let io: IO
	let gl: WebGL2RenderingContext
	let project = new Project()
	let project_pending_load: Project
	let is_temp_project: boolean

	// GL stuff
	let default_framebuffer: FrameBuffer
	let canvas_fb: FrameBuffer
	// let temp_stroke_fb: FrameBuffer
	let temp_stroke_fbs: FrameBuffer[]
	let temp_stroke_fbs_bind_group: BindGroup
	let temp_undo_fb_a: FrameBuffer
	let temp_undo_fb_b: FrameBuffer

	let webgpu_back_texture: Texture
	
	let compositeThing: Thing
	let brushStrokeThing: Thing
	let postThing: Thing
	let brushPreviewThing: Thing
	let pickerPreviewThing: Thing
	let colourPreviewThing: Thing
	
	let param_buff: VertexBuffer	
	let quad_buff: VertexBuffer	
	let drawer_buff_a: VertexBuffer
	let drawer_buff_b: VertexBuffer

	let temp_undo_fb_a_idx = 100000
	let temp_undo_fb_b_idx = 100000
	
	let sharedBindGroup: BindGroup
	let sharedBindGroupTempTextures: BindGroup

	let drawer: Drawer
	let ubo: UniformBuffer

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
	let resize_project: (sz: number[])=>Promise<void>
	let trigger_colour_display_update: (colour_r, colour_g, colour_b)=>void

	const set_shared_uniforms = () => {
		// ubo.sz = 0
		ubo.mappedArr[0] = canvas_fb._textures[0].res[0]
		ubo.mappedArr[1] = canvas_fb._textures[0].res[1]
		ubo.mappedArr[2] = default_framebuffer.textures[0].res[0]
		ubo.mappedArr[3] = default_framebuffer.textures[0].res[1]
		ubo.mappedArr[4] = isOnMobile ? 1 : 0
		ubo.mappedArr[5] = zoom[0]
		ubo.mappedArr[6] = panning[0]
		ubo.mappedArr[7] = panning[1]
		ubo.mappedArr[8] = blending_colour_space
		ubo.mappedArr[15 - 3 - 4] = stroke_col[0]
		ubo.mappedArr[15 - 2 - 4] =stroke_col[1] 
		ubo.mappedArr[15 - 1 - 4] =stroke_col[2] 
		// ubo.mappedArr[15 - 1 - 1] = brush_sz[0]
		// ubo.mappedArr[15 - 4] =brush_sz[0] 
		ubo.mappedArr[15 - 3] = io.mouse_pos[0]
		ubo.mappedArr[15 - 2] = io.mouse_pos[1] 
		ubo.mappedArr[15 - 1] = brush_sz[0]
		ubo.mappedArr[15] = brush_sz[1] 

		ubo.mappedArr[15 + 1] = picked_col[0]
		ubo.mappedArr[15 + 2] = picked_col[1] 
		ubo.mappedArr[15 + 3] = picked_col[2] 
		ubo.mappedArr[16 + 4] = temp_stroke_fbs.length
		// ubo.mappedArr[15 - 0] = zoom[0]
		// ubo.upload()
		ubo.sz = 32
		ubo.upload()
	}

	const pick_from_canvas = async () => {
		
		let coord = Utils.texture_NDC_to_texture_pixel_coords(
			Utils.screen_NDC_to_canvas_NDC([...io.mouse_pos], default_framebuffer.textures[0], canvas_fb.back_textures[0], zoom[0], panning),
			canvas_fb.back_textures[0],
		)
		let c = await canvas_fb.back_textures[0].read_back_pixel(coord)
		// console.log(c)

		picked_col = [...c]
		// picked_col[0] = c[0] / 255
		// picked_col[1] = c[1] / 255
		// picked_col[2] = c[2] / 255
		// picked_col[0] = pow(picked_col[0], 0.45454545454545)
		// picked_col[1] = pow(picked_col[1], 0.45454545454545)
		// picked_col[2] = pow(picked_col[2], 0.45454545454545)
		picked_col.pop()
		return c
		// return [1,1,1]
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

	const init_web_gl = async () => {
		window.wgpu = new WrightGPU(canvasElement)
		await window.wgpu.initializeGPU()
		default_framebuffer = wgpu.defaultFramebuffer
		window.isOnMobile = Utils.isOnMobile()

		const userAgentRes = [canvasElement.clientWidth, canvasElement.clientWidth]



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

		quad_buff = new VertexBuffer({bufferDataArray: QuadVerts, pads: [2]})

		canvas_fb = new FrameBuffer({depth: false, pongable: true, format: "rgba32float", label: "canvas_fb", attachmentTextures: [
			new Texture({label: "canvas_fb_tex"}),
		]});


    param_buff = new VertexBuffer(
      { bufferDataArray: new Float32Array(16 * 1_000_00) ,pads: [2]}
    )
		
		
		temp_stroke_fbs = []
		let temp_stroke_textures = []
		for(let i = 0; i < temp_fbs_count; i++){
			temp_stroke_fbs.push(
				new FrameBuffer({depth: false, pongable: false, format: "rgba32float", label: "stroke_fb_" + i, attachmentTextures: [
					new Texture({label: "stroke_fb_tex_" + i}),
				]})
			)
			temp_stroke_textures.push(temp_stroke_fbs[temp_stroke_fbs.length - 1].textures[0])
		}
		temp_stroke_fbs_bind_group = new BindGroup(temp_stroke_textures)


		temp_undo_fb_a = new FrameBuffer({depth: false, pongable: false, format: "rgba16float", label: "temp_undo_fb", attachmentTextures: [
			new Texture({label: "temp_undo_fb_tex"}),
		]})
		temp_undo_fb_b = new FrameBuffer({depth: false, pongable: false, format: "rgba16float", label: "temp_undo_fb_b", attachmentTextures: [
			new Texture({label: "temp_undo_fb_b_tex"}),
		]})
		// webgpu_back_fb = new FrameBuffer({depth: false, pongable: false, format: "rgba16float", label: "temp_undo_fb_b", attachmentTextures: [
		// 	new Texture({label: "webgpu_back_fb"}),
		// ]})
		webgpu_back_texture = new Texture({
			label: "webgpu_back_texture",
			format: "bgra8unorm",
			usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC | GPUTextureUsage.COPY_DST,
			height: wgpu.height,
			width: wgpu.width
		})

    
    drawer_buff_a = new VertexBuffer(
      { bufferDataArray: new Float32Array(312500 * 10) ,pads: [2]}
    )
    drawer_buff_b = new VertexBuffer(
      { bufferDataArray: new Float32Array(312500 * 10) ,pads: [2]}
    )    
		

		window.ubo = ubo
		sharedBindGroup = new BindGroup([
      ubo = new UniformBuffer(),
      {
        addressModeU: "repeat",
        addressModeV: "repeat",
        magFilter: "linear",
        minFilter: "linear",
        mipmapFilter: "linear",
      },
      drawer_buff_a,
      drawer_buff_b,
      param_buff,
      noise_tex,
      brush_textures[0].gpu_tex,
      brush_textures[1].gpu_tex,
      brush_textures[2].gpu_tex,
      brush_textures[3].gpu_tex,
      brush_textures[4].gpu_tex,
      brush_textures[5].gpu_tex,
      brush_textures[6].gpu_tex,
    ])
		const sharedBindGroupTempTexturesElements: BindGroupElement[] = [
      ubo,
      {
        addressModeU: "repeat",
        addressModeV: "repeat",
        magFilter: "linear",
        minFilter: "linear",
        mipmapFilter: "linear",
      },
      drawer_buff_a,
      drawer_buff_b,
      param_buff,
    ]
		for(let temp_tex of temp_stroke_textures){
			sharedBindGroupTempTexturesElements.push(temp_tex)
		}

		sharedBindGroupTempTextures = new BindGroup(sharedBindGroupTempTexturesElements)
		brushStrokeThing = new Thing(
			[], 
			new Shader(
				require("../shaders/brush_long_vert.wgsl"),
				require("../shaders/brush_long_frag.wgsl"),
				"brush_long_vert",
				"brush_long_frag",
			),
      canvas_fb, 
      // [Sketch.sharedBindGroup, new BindGroup([canvasFb.textures[0]])]
      [
        sharedBindGroup, 
        // new BindGroup([canvasFb.textures[0]])
      ],{
        colorStates: [
          {
              format: 'bgra8unorm',
              blend:{
                color:{
                  operation: "add",
                  srcFactor: "src-alpha",
                  dstFactor: "one-minus-src-alpha",
                },
                alpha: {
                  operation: "add",
                  srcFactor: "one",
                  dstFactor: "one-minus-src-alpha",
                }
              }
          },
        ],
				label: "brush_stroke_thing"
      }
		)
		const composite_stroke_to_canvas_program = new Shader(
      wgpu.getFullScreenQuadVert(),
			require("../shaders/composite_frag.wgsl"),
			"composite_vert",
			"composite_frag",
		)

    compositeThing = new Thing([],
      composite_stroke_to_canvas_program,
      canvas_fb, 
      [
        sharedBindGroupTempTextures,
        new BindGroup([canvas_fb.textures[0]]),
        // new BindGroup([temp_stroke_fbs[0].textures[0]]),
				// temp_stroke_fbs_bind_group
      ],{label: "composite_thing"}
    )
		postThing = new Thing([],new Shader(
			require("../shaders/post_vert.wgsl"),
			require("../shaders/post_frag.wgsl"),
				"post_vert",
				"post_frag",
			),
      wgpu.defaultFramebuffer, 
      [
        sharedBindGroup,
        new BindGroup([canvas_fb.textures[0]]),
        new BindGroup([temp_stroke_fbs[0].textures[0]]),
				// temp_stroke_fbs_bind_group
      ],{label: "post_thing"}
    )
		brushPreviewThing = new Thing([],new Shader(
			require("../shaders/brush_preview_vert.wgsl"),
			require("../shaders/brush_preview_frag.wgsl"),
				"brush_preview_vert",
				"brush_preview_frag",
			),
      wgpu.defaultFramebuffer, 
      [
        sharedBindGroup,
      ],{label: "brush_preview_thing"}
    )
		pickerPreviewThing = new Thing([],new Shader(
			require("../shaders/picker_preview_vert.wgsl"),
			require("../shaders/picker_preview_frag.wgsl"),
				"picker_preview_vert",
				"picker_preview_frag",
			),
      wgpu.defaultFramebuffer, 
      [
        sharedBindGroup,
      ],{label: "picker_preview_thing"}
    )
		colourPreviewThing = new Thing([],new Shader(
			require("../shaders/colour_preview_vert.wgsl"),
			require("../shaders/colour_preview_frag.wgsl"),
				"colour_preview_vert",
				"colour_preview_frag",
			),
      wgpu.defaultFramebuffer, 
      [
        sharedBindGroup,
      ],{label: "picker_preview_thing"}
    )
	// let brushPreviewThing: Thing
	// let pickerPreviewThing: Thing
	// let colourPreviewThing: Thing

  
			
			

		resizeDefaultFrameBufferIfNeeded(
			canvasElement,
			default_framebuffer,
			webgpu_back_texture,
			userAgentRes,
			(e) => {},
			()=>{set_shared_uniforms()}
		)
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
		document.addEventListener('contextmenu', (event) => event.preventDefault())
		window.history.pushState(null, "", window.location.href);
		window.addEventListener('popstate', ()=> {
			window.history.pushState(null, "", window.location.href);
		});


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
			brush_presets[0].tex_lch_dynamics[1] = 0.8
			brush_presets[0].tex_lch_dynamics[2] = 1.0

			brush_presets[0].stroke_opacity_dynamics[0] = 0.5
			brush_presets[0].stroke_size_dynamics[0] = 0.
			// brush_presets[0].noise_stretch[0] = curr_brush.noise_stretch[0] = 0
			// brush_presets[0].noise_stretch[1] = curr_brush.noise_stretch[1] = 0.1
			curr_brush.tex_stretch[0] = brush_presets[0].tex_stretch[0]
			curr_brush.tex_stretch[1] = brush_presets[0].tex_stretch[1]
		}
		{
			brush_presets[1].selected_brush_type = BrushType.Blobs
			brush_presets[1].selected_brush_texture = brush_textures[6]
			brush_presets[1].tex_stretch[0] = 0.5 + 1/20
			brush_presets[1].tex_stretch[1] = 0.5 + 1/20
			brush_presets[1].tex_distort[0] = 0
			brush_presets[1].tex_distort[1] = 0
			brush_presets[1].stroke_opacity_dynamics[0] = 1
			brush_presets[1].stroke_opacity_dynamics[1] = 1
			brush_presets[1].stroke_size_dynamics[0] = 0
			brush_presets[1].stroke_size_dynamics[1] = 1
		}
		{
			brush_presets[2].selected_brush_type = BrushType.Tri
			brush_presets[2].selected_brush_texture = brush_textures[5]
			brush_presets[2].tex_stretch[0] = 0.5 + 1/20 - 1/40
			brush_presets[2].tex_stretch[1] = 0.5 + 1/20 - 1/40
			brush_presets[2].tex_distort[0] = 0
			brush_presets[2].tex_distort[1] = 0
			brush_presets[2].stroke_opacity_dynamics[0] = 1
			brush_presets[2].stroke_opacity_dynamics[1] = 1
			brush_presets[2].stroke_size_dynamics[0] = 0
			brush_presets[2].stroke_size_dynamics[1] = 1
		}


		{
			brush_presets[5].selected_brush_type = BrushType.Long
			brush_presets[5].selected_brush_texture = brush_textures[4]
			brush_presets[5].tex_grit = 1.0
			brush_presets[5].stroke_opacity_dynamics[0] = 0
			brush_presets[5].stroke_opacity_dynamics[1] = 1
			brush_presets[5].stroke_size_dynamics[0] = 0
			brush_presets[5].stroke_size_dynamics[1] = 1
			brush_presets[5].tex_distort_amt = 0.16
			brush_presets[5].tex_distort[0] = 0.294
			brush_presets[5].tex_distort[1] = 0
		}
		modals = [chaosSemiModal, dynamicsSemiModal, texDynamicsSemiModal]
	}

	onMount(async () => {
		io = new IO()
		await init_web_gl()
		await init_other_stuff()
		// post_canvas_program.zoom_loc = gl.getUniformLocation(post_canvas_program.program, "zoom")
		// post_canvas_program.panning_loc = gl.getUniformLocation(post_canvas_program.program, "panning")
		// post_canvas_program.blending_colour_space_loc = gl.getUniformLocation(post_canvas_program.program, "blending_colour_space")
		
		// const brush_long_program = new ShaderProgram(require('shaders/brush_long.vert'), require('shaders/brush_long.frag'))
		

		//! ------------------- POST
		let frame = 0

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
      canvas_fb.textures[0],
      wgpu.defaultFramebuffer,
      drawer_buff_a, drawer_buff_b, param_buff
    )
    const composite_stroke = () => {
		  // TO WRITE
      let encoder = canvas_fb.startPass()

			compositeThing.bind_pipeline(encoder)
      compositeThing.bindGroups[0].bind_to_idx(encoder, 0)
      canvas_fb.bind_group_back.bind_to_idx(encoder, 1)
      // compositeThing.bindGroups[2].bind_to_idx(encoder, 2)
      
      // quad_buff.bind(encoder, 0)
			encoder.draw(
				quad_buff.vertCnt,
				1,
				0,
				project.brush_strokes.length - 1
			)

			canvas_fb.endPass()
			// temp_stroke_fb.clear()
		}
		
		const draw_n_strokes =  (start_idx: number | undefined, end_idx: number | undefined, full_redraw: boolean = false): number=>{
			let k = 0

			start_idx = start_idx ?? 0
			end_idx = end_idx ?? project.brush_strokes.length
			
			if (full_redraw){
				drawer.reset()
				param_buff.offs = 0
				param_buff.sz = 0
				for(k = 0; k < project.brush_strokes.length; k++){
					const stroke = project.brush_strokes[k]
					drawer.push_any_stroke(stroke, false)
				}

				drawer_buff_a.upload()
				drawer_buff_b.upload()
				param_buff.upload()
			}
			

			k = start_idx


			let modulo = (end_idx - start_idx) % temp_stroke_fbs.length
			modulo = temp_stroke_fbs.length - modulo

			
			let j = 0
			
			const total_its = Math.floor((end_idx + modulo - start_idx - 0.5 ) /(temp_fbs_count )  + 1);
			let iters_temp_stroke: number = 0
			
      wgpu.beginCommandEncoder()
			// for(let amogus of drawer.recorded_drawcalls){
			let passEncoder: GPURenderPassEncoder
			for(;k < end_idx + modulo; ){
				j = 0
				iters_temp_stroke = temp_stroke_fbs.length
				// iters_temp_stroke = 1
				const is_last_iter = k + temp_stroke_fbs.length === end_idx + modulo 
				if(is_last_iter){ 
					iters_temp_stroke -= modulo
				}

				for(; j < temp_stroke_fbs.length; j++){
					if(j >= iters_temp_stroke && total_its === 1){
						const potato = 3
						break
					}
					passEncoder = temp_stroke_fbs[j].startPass()
					if(j < iters_temp_stroke) {
						brushStrokeThing.bind_pipeline(passEncoder)
						brushStrokeThing.bindGroups[0].bind_to_idx(passEncoder, 0)
						drawer.draw_stroke_idx(k + j, passEncoder)
					}
					temp_stroke_fbs[j].endPass()
				}


        passEncoder = canvas_fb.startPass()
        {
          compositeThing.bind_pipeline(passEncoder)

          compositeThing.bindGroups[0].bind_to_idx(passEncoder, 0)
          canvas_fb.bind_group_back.bind_to_idx(passEncoder, 1)
          passEncoder.draw(quad_buff.vertCnt, 1, 0, k)
        }
        canvas_fb.endPass()

        canvas_fb.pong()
				
				k += temp_stroke_fbs.length
				if(full_redraw){
					const undo_offs = (end_idx % undo_cache_steps)
					if(end_idx < undo_cache_steps){
						if(k === temp_stroke_fbs.length){
							// temp_undo_fb_a.clear()
							temp_undo_fb_a.startPass() // needed?
							temp_undo_fb_a.endPass()
							temp_undo_fb_a_idx = 0
						}
					} else {
						if(k === end_idx - undo_offs){
							// copy_fb_to_fb(canvas_fb.fb_back, temp_undo_fb_a.fb, canvas_fb._textures[0].res)
							wgpu.copy_texture_to_texture(
								canvas_fb.back_textures[0],
								temp_undo_fb_a.textures[0],
							)
							temp_undo_fb_a_idx = k
						} else if(k === end_idx - undo_offs - undo_cache_steps){
							// copy_fb_to_fb(canvas_fb.fb_back, temp_undo_fb_b.fb, canvas_fb._textures[0].res)
							wgpu.copy_texture_to_texture(
								canvas_fb.back_textures[0],
								temp_undo_fb_b.textures[0],
							)
							temp_undo_fb_b_idx = k
						}
					}
				}

			}
			for(let i = 0; i < iters_temp_stroke; i++){
				temp_stroke_fbs[i].startPass()
				temp_stroke_fbs[i].endPass()
			}
			temp_stroke_fbs[0].startPass()
			temp_stroke_fbs[0].endPass()
			// if(its === 1){

			// }
			// if(its === 1){
			// 	for(let i = 0; i < iters_temp_stroke; i++){
			// 		temp_stroke_fbs[i].startPass()
			// 		temp_stroke_fbs[i].endPass()					
			// 	}
			// } else {
			// 	temp_stroke_fbs[0].startPass()
			// 	temp_stroke_fbs[0].endPass()
			// }

			if(end_idx === 0){
				wgpu.copy_texture_to_texture(
					canvas_fb.back_textures[0],
					temp_undo_fb_a.textures[0],
				)
				temp_undo_fb_a_idx = 0
			} 
			redraw_needed = true

			return j
		}


		const redraw_whole_project = async () => {
			console.log('REDRAW EVERYTHING')
			console.time("REDRAW ALL")

			canvas_fb.startPass()
			canvas_fb.endPass() 
			canvas_fb.pong()

			draw_n_strokes(
        0,
        project.brush_strokes.length 
        // - redo_history_length
        , true
			)

			console.timeEnd("REDRAW ALL")
		}

		resize_project = async (new_sz: number[]) => {
			project.canvasRes = [...new_sz]
			for(let fb of temp_stroke_fbs){
				fb.textures[0].resize(new_sz)
			}
			canvas_fb._back_textures[0].resize(new_sz)
			canvas_fb._textures[0].resize(new_sz)
			temp_undo_fb_a.textures[0].resize(new_sz)
			temp_undo_fb_b.textures[0].resize(new_sz)
			for(let tex of Texture.textures){
				if(tex.bind_groups)
					for(let bind_group of tex.bind_groups){
						bind_group.rebuild()
					}
			}
			set_shared_uniforms()
			full_redraw_needed = true
			project_has_been_modified = false
			redo_history_length = 0
			await wgpu.flushPasses()
		}
		
		let load_project = async (new_project: Project) =>{
			project = new Project()
			project.canvasRes[0] = Math.floor(project.canvasRes[0]) // ???
			project.canvasRes[1] = Math.floor(project.canvasRes[1]) // ???
			project_has_been_modified = false
			redo_history_length = 0
			for (let key of Object.keys(new_project as Object)) {
				// @ts-ignore
				project[key] = new_project[key]
			}
			project.canvasRes = [...new_project.canvasRes]
			await wgpu.flushPasses()
			await resize_project(project.canvasRes)
			await wgpu.flushPasses()
			temp_undo_fb_a.startPass()
			temp_undo_fb_a.endPass()
			temp_undo_fb_b.startPass()
			temp_undo_fb_b.endPass()
			canvas_fb.startPass()
			canvas_fb.endPass()
			temp_stroke_fbs[0].startPass()
			temp_stroke_fbs[0].endPass()
			await redraw_whole_project()
      await wgpu.flushPasses()
			console.log(project)
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
		
		const handle_input_actions = async ()=>{
			if(io.pen_button_just_pressed){
				// console.log(e)
				console.log('pen button press')
				mouse_over_colour_picker = true
				if(io.pen_button_press_pos[0] > 0.){
					colAdjustStart(
						io.mouse_pos[0], 
						io.mouse_pos[1], 
						io.pen_button_press_pos[1] > 0.0
					)
				} else {
					brushResizeStart(io.mouse_pos[0], io.mouse_pos[1], true)
				}
			} else if (io.pen_button_down){

				if(io.pen_button_press_pos[0] > 0.){
					colAdjustMove(io.delta_mouse_pos[0]*250, io.delta_mouse_pos[1]*250)
				} else {
					brushResizeMove(io.delta_mouse_pos[0]*500, io.delta_mouse_pos[1]*500)
				}
			} else if(io.pen_button_just_unpressed){
				mouse_over_colour_picker = false
				redraw_needed = true

				if(io.pen_button_press_pos[0] > 0.){
					colAdjustEnd()
				} else {
					brushResizeEnd()
				}
			}
			if (io.getKey('AltLeft').down) {
				if (io.getKey('AltLeft').just_pressed) {
					picking = true
				}
				await pick_from_canvas()
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
					floating_modal_message.set("Redo")
					// ---- DRAW ONE
					draw_n_strokes(idx_before,idx_now) 
					if(idx_now % undo_cache_steps === 0){
						// ---- HIT CACHE
						// save to cache
						const res = canvas_fb.textures[0].res
						if(temp_undo_fb_a_idx === idx_now){
							wgpu.copy_texture_to_texture(
								canvas_fb.back_textures[0],
								temp_undo_fb_a.textures[0],
							)
						} else {
							// ) // needless copy
							wgpu.copy_texture_to_texture(
								temp_undo_fb_a.textures[0],
								temp_undo_fb_b.textures[0],
							)
							wgpu.copy_texture_to_texture(
								canvas_fb.back_textures[0],
								temp_undo_fb_a.textures[0],
							)
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
					floating_modal_message.set("Undo")
					const is_undo_fb_a = ( idx_now >= temp_undo_fb_a_idx && idx_now < temp_undo_fb_a_idx + undo_cache_steps )
					const is_undo_fb_b =  ( idx_now >= temp_undo_fb_b_idx  && idx_now < temp_undo_fb_b_idx + undo_cache_steps )
					const undo_fb = is_undo_fb_a ? temp_undo_fb_a : is_undo_fb_b ? temp_undo_fb_b : undefined;
					if(idx_before % undo_cache_steps === 0){
						// ---- FIND CACHE FB HIT

						if(undo_fb === undefined) {
							// ---- DIDN'T HIT UNDO FB
							const res = canvas_fb.textures[0].res


							canvas_fb.startPass()
							canvas_fb.endPass()
							canvas_fb.pong()

							let idx = idx_before - undo_cache_steps * 2
							if(idx < 0.){
								// GENERATE B CACHE
								draw_n_strokes(0, temp_undo_fb_a_idx = idx_before - undo_cache_steps)

								wgpu.copy_texture_to_texture(
									canvas_fb.back_textures[0],
									temp_undo_fb_a.textures[0],
								)
								
							} else {
								// GENERATE B CACHE
								draw_n_strokes(0, temp_undo_fb_b_idx = idx)
								wgpu.copy_texture_to_texture(
									canvas_fb.back_textures[0],
									temp_undo_fb_b.textures[0],
								)

								draw_n_strokes(temp_undo_fb_b_idx, temp_undo_fb_a_idx = idx_before - undo_cache_steps)

								wgpu.copy_texture_to_texture(
									canvas_fb.back_textures[0],
									temp_undo_fb_a.textures[0],
								)
							}
							// DRAW FROM PREV CACHE TO CANVAS
							draw_n_strokes( idx_before - undo_cache_steps, project.brush_strokes.length - redo_history_length)
						} else {
							// HIT UNDO FB
							wgpu.copy_texture_to_texture(
								undo_fb.textures[0],
								canvas_fb.back_textures[0],
							)
							// DRAW FROM PREV CACHE TO CANVAS
							draw_n_strokes( idx_before - undo_cache_steps, idx_now)
						}
					} else {
						// ---- NO CACHE HIT
						// DRAW FROM PREV CACHE TO CANVAS
						{
							wgpu.copy_texture_to_texture(
								undo_fb.textures[0],
								canvas_fb.back_textures[0],
							)
							const undo_mod_offs = idx_now % undo_cache_steps
							draw_n_strokes( idx_now - undo_mod_offs, idx_now)
						}
					}
					// gl.activeTexture(gl.TEXTURE15)
					// canvas_fb.pong()
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
						drawer.pop_stroke()
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
						canvas_fb._textures[0],
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

		const create_media_recorder = (canvas: HTMLCanvasElement) => {
			let options: any = {audioBitsPerSecond: 0, videoBitsPerSecond: 8000000}

			const types = ['video/webm;codecs=h264', 'video/webm;codecs=vp9', 'video/webm;codecs=vp8']

			for (let type of types) {
				if (MediaRecorder.isTypeSupported(type)) {
					options.mimeType = type
				}
			}
			if (!options.mimeType) {
				options.mimeType = 'video/webm'
			}

			const mediaRecorder = new MediaRecorder(canvas.captureStream(), options)
			const chunks = []
			// mediaRecorder.set

			mediaRecorder.ondataavailable = function (e) {
				if (e.data.size > 0) {
					// @ts-ignore
					chunks.push(e.data)
				}
			}

			mediaRecorder.onstop = function () {
				let blob = new Blob(chunks, {type: 'video/mp4'})
				const url = window.URL.createObjectURL(blob)
				let a = document.createElement('a')
				document.body.appendChild(a)
				// @ts-ignore
				a.style = 'display: none'
				a.href = url
				a.download = 'drawing.mp4'
				a.click()
				window.URL.revokeObjectURL(url)
				chunks.length = 0
			}

			return mediaRecorder
		}
		
		const video_recording_if_needed = async () =>{
				if(!recording && recording_pending){
					// canvas_fb.clear()
					// canvas_fb.pong()
					// canvas_fb.clear()
					canvas_fb.startPass()
					canvas_fb.endPass()
					canvas_fb.pong()

					default_framebuffer.textures[0].res = [canvas_fb.textures[0].width, canvas_fb.textures[0].height]
					canvasElement.width = default_framebuffer.textures[0].width = default_framebuffer.textures[0].res[0]
					canvasElement.height = default_framebuffer.textures[0].height = default_framebuffer.textures[0].res[1]


					// @ts-ignore
					// if (!window.media_recorder) {
					window.media_recorder = create_media_recorder(canvasElement)
					// }

					
					
					zoom[0] = 1
					panning[0] = 0
					panning[1] = 0
					set_shared_uniforms()

					recording_stroke_idx = 0
					recording_pending = false
					recording = true
				} else {
					if (window.media_recorder.state === 'inactive') {
						window.media_recorder.start()
					}
					wgpu.defaultFramebuffer.textures[0].texture = wgpu.context.getCurrentTexture()
					wgpu.defaultFramebuffer.renderPassDescriptor.colorAttachments[0].view = 
						wgpu.defaultFramebuffer.textures[0].view = 
							wgpu.defaultFramebuffer.textures[0].texture.createView()
					if(recording_stroke_idx === project.brush_strokes.length - 1){
						// finish
						// if (window.media_recorder.state !== "inactive") {
								window.media_recorder.stop();
						// }                 
						recording_stroke_idx += 1
					} else if(recording_stroke_idx === project.brush_strokes.length){
						recording = false
						recording_pending = false

						resizeDefaultFrameBufferIfNeeded(
							canvasElement, 
							default_framebuffer, 
							webgpu_back_texture,
							[canvasElement.clientWidth, canvasElement.clientHeight], 
							(e) => {}, 
							()=>{set_shared_uniforms()}
						)
						// for(let tex of Texture.textures){
						// 	if(tex.bind_groups)
						// 		for(let bind_group of tex.bind_groups){
						// 			bind_group.rebuild()
						// 		}
						// }
						full_redraw_needed = true
					} else {
						// canvas_fb.back_textures[0].bind_to_unit(1)
						// canvas_fb.clear()
						// temp_stroke_fb.clear()
						// canvas_fb.startPass()

						draw_n_strokes(recording_stroke_idx, recording_stroke_idx + 1, false)



						default_framebuffer.startPass()
						let passEncoder = wgpu.currPass.passEncoder as GPURenderPassEncoder
						{ 

							postThing.bind_pipeline(passEncoder)
							// quad_buff.bind(passEncoder )
							// sharedBindGroup.bind_to_idx(passEncoder, 0)
							postThing.bindGroups[0].bind_to_idx(passEncoder, 0)
							canvas_fb.bind_group_back.bind_to_idx(passEncoder, 1)
							postThing.bindGroups[2].bind_to_idx(passEncoder, 2)
							passEncoder.draw(quad_buff.vertCnt, 1, 0, project.brush_strokes.length - 1)
						}
						default_framebuffer.endPass()
						
						// canvas_fb.pong()
						// gl.viewport(0, 0, default_framebuffer._textures[0].res[0], default_framebuffer._textures[0].res[1])
						// gl.bindFrameBuffer(gl.FRAMEBUFFER, default_framebuffer.fb)
						// gl.clear(gl.COLOR_BUFFER_BIT)

						// FrameBuffer.currently_bound = default_framebuffer // not needed?

						// post_canvas_program.use()

						// canvas_fb.back_textures[0].bind_to_unit(1)
						
						// gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)

						// canvas_fb.pong()
						
						recording_stroke_idx++
					}
				}

				await wgpu.flushPasses()
		}
		

		const draw = async (_t: number) => {
			if(recording_pending || recording){
				await video_recording_if_needed()
				requestAnimationFrame(draw)
				return
			}
			redraw_needed = false
			if (frame === 1){
				redraw_needed = true
			}
			const new_t = _t / 1000
			delta_t = new_t - t
			t = new_t
			io.tick()
			resizeDefaultFrameBufferIfNeeded(
				canvasElement, 
				default_framebuffer, 
				webgpu_back_texture,
				default_framebuffer._textures[0].res, 
				(v: boolean) => {
					redraw_needed = v
				},
				()=>{set_shared_uniforms()}
			)
      wgpu.defaultFramebuffer.textures[0].texture = wgpu.context.getCurrentTexture()
      wgpu.defaultFramebuffer.renderPassDescriptor.colorAttachments[0].view = 
        wgpu.defaultFramebuffer.textures[0].view = 
          wgpu.defaultFramebuffer.textures[0].texture.createView()

			if(full_redraw_needed){
				redraw_whole_project()
			}

			await handle_input_actions()

			// ----- RECORD STROKE / DRAW
			if ((io.mouse_just_pressed || (io.mouse_down && io.mouse_just_moved)) && io.pointerType !== 'touch') {
				project_has_been_modified = true
				redraw_needed = true
				record_stroke()
				
				if(drawer.recorded_drawcalls.length === project.brush_strokes.length + 1){
					drawer.pop_stroke()
				}
				let p = wgpu.currPass
				drawer.push_any_stroke(brush_stroke, true)
				
				let passEncoder = temp_stroke_fbs[0].startPass()
				{
          brushStrokeThing.bind_pipeline(passEncoder)
          brushStrokeThing.bindGroups[0].bind_to_idx(passEncoder, 0)
          drawer.draw_stroke_idx(drawer.recorded_drawcalls.length - 1, passEncoder)
				}
				temp_stroke_fbs[0].endPass()
			}
			// ----- COMPOSITE NEW STROKE
			if (io.mouse_just_unpressed && io.pointerType !== 'touch' && !(undo_pending || redo_pending)) {
				project.push_stroke(brush_stroke)
				if(frame % 5 === 0 || !isOnMobile){
					// @ts-ignore
					// project.brush_strokes[project.brush_strokes.length - 1].brush_texture.gpu_tex = {}
					brush_stroke.brush_texture.gpu_tex = {}
					// brush_stroke.brush_texture = {}
					if(is_temp_project){
						window.sketch_db.table("temp_sketch").put({id: project.id, data: project},1)
					} else {
						window.sketch_db.table("sketch").update(project.id, {data: project})
					}
				}
				redraw_needed = true

				ubo.mappedArr[16 + 4] = 1
				ubo.upload()
				composite_stroke()
				canvas_fb.pong()
				if(project.brush_strokes.length % undo_cache_steps === 0){
					wgpu.copy_texture_to_texture(
						temp_undo_fb_a.textures[0],
						temp_undo_fb_b.textures[0],
					)
					wgpu.copy_texture_to_texture(
						canvas_fb.back_textures[0],
						temp_undo_fb_a.textures[0],
					)
					temp_undo_fb_b_idx = temp_undo_fb_a_idx 
					temp_undo_fb_a_idx = project.brush_strokes.length
				}
				temp_stroke_fbs[0].startPass()
				temp_stroke_fbs[0].endPass()
			}

			if (brush_size_widget_dragging || brush_size_widget_stopped_dragging) redraw_needed = true

			// ----- REDRAW
			if (redraw_needed) {
				
				set_shared_uniforms()

				// ------- MIPMAPS
				// if(canvas_fb._textures[0].props.mipmapped){
				// 	gl.bindTexture(gl.TEXTURE_2D, canvas_fb._textures[0].tex)
				// 	gl.generateMipmap(gl.TEXTURE_2D)
				// 	gl.bindTexture(gl.TEXTURE_2D, canvas_fb._back_textures[0].tex)
				// 	gl.generateMipmap(gl.TEXTURE_2D)
				// 	gl.bindTexture(gl.TEXTURE_2D, null)
				// }
				// if(temp_stroke_fb.textures[0].props.mipmapped){
				// 	gl.bindTexture(gl.TEXTURE_2D, temp_stroke_fb.textures[0].tex)
				// 	gl.generateMipmap(gl.TEXTURE_2D)
				// 	gl.bindTexture(gl.TEXTURE_2D, null)
				// }


				let passEncoder = wgpu.defaultFramebuffer.startPass()
				// encoder = wgpu.currPass
				{
					// @ts-ignore
					postThing.bind_pipeline(passEncoder)
					// let i = 0
					// for(let bind_group of postThing.bindGroups){
					// 	bind_group.bind_to_idx(passEncoder, i++)
					// }
					postThing.bindGroups[0].bind_to_idx(passEncoder, 0)
					canvas_fb.bind_group_back.bind_to_idx(passEncoder, 1)
					postThing.bindGroups[2].bind_to_idx(passEncoder, 2)

					// quad_buff.bind(passEncoder )
					// quad_buff.draw(passEncoder )
					passEncoder.draw(
						quad_buff.vertCnt,
						1,
						0,
						// project.brush_strokes.length - 1
						0
					)

					if (brush_size_widget_dragging) {
						brushPreviewThing.bind_pipeline(passEncoder)
						passEncoder.draw(quad_buff.vertCnt, 1, 0, 0)
					}
					if((mouse_over_colour_picker && !brush_size_widget_dragging)){
						colourPreviewThing.bind_pipeline(passEncoder)
						passEncoder.draw(quad_buff.vertCnt, 1, 0, 0)
					}
					if (picking) {
						pickerPreviewThing.bind_pipeline(passEncoder)
						passEncoder.draw(quad_buff.vertCnt, 1, 0, 0)
					}
				}
				wgpu.defaultFramebuffer.endPass()

				wgpu.copy_texture_to_texture(
					wgpu.defaultFramebuffer.textures[0],
					webgpu_back_texture,
				)
			} else {
				wgpu.copy_texture_to_texture(
					webgpu_back_texture,
					wgpu.defaultFramebuffer.textures[0]
				)
			}

      await wgpu.flushPasses()
			
      
			brush_size_widget_stopped_dragging = false
			redo_pending = false
			undo_pending = false
			full_redraw_needed = false
			mouse_over_colour_picker_finished = false
			io.tick_end()
			frame++

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
