import {ifExistsAElseB, loop} from './utils'

import {FrameBuffer} from './wframebuffer'
import {Texture} from './wtexture'
import {AbstractBindingContainer} from './wabstractbindingcontainer'
export * from './wframebuffer'
export * from './wtexture'
export * from './wthing'
export * from './wvertexbuffer'
export * from './wuniformbuffer'
export * from './wstoragebuffer'
export * from './wgeom'
export * from './wcompute'

// interface WTex {
//   texture: GPUTexture,
//   textureView: GPUTextureView,
//   width: number,
//   height: number,
//   depth: number,
// }

interface Encoder {
	commandEncoder: GPUCommandEncoder
	passEncoder?: GPURenderPassEncoder | GPUComputePassEncoder
	framebuffer?: FrameBuffer
}

export class WMipMapper {
	pipeline: GPURenderPipeline
	shader_module: GPUShaderModule
	sampler: GPUSampler

	constructor(wgpu: WrightGPU) {
		this.shader_module = wgpu.device.createShaderModule({
			label: 'textured quad shaders for mip level generation',
			code: /*wgsl*/ `
        struct VSOutput {
          @builtin(position) position: vec4f,
          @location(0) texcoord: vec2f,
        };

        @vertex fn vs(
          @builtin(vertex_index) vertexIndex : u32
        ) -> VSOutput {
          let pos = array(

            vec2f( 0.0,  0.0),  // center
            vec2f( 1.0,  0.0),  // right, center
            vec2f( 0.0,  1.0),  // center, top

            // 2st triangle
            vec2f( 0.0,  1.0),  // center, top
            vec2f( 1.0,  0.0),  // right, center
            vec2f( 1.0,  1.0),  // right, top
          );

          var vsOutput: VSOutput;
          let xy = pos[vertexIndex];
          vsOutput.position = vec4f(xy * 2.0 - 1.0, 0.0, 1.0);
          vsOutput.texcoord = vec2f(xy.x, 1.0 - xy.y);
          return vsOutput;
        }

        @group(0) @binding(0) var ourSampler: sampler;
        @group(0) @binding(1) var ourTexture: texture_2d<f32>;

        @fragment fn fs(fsInput: VSOutput) -> @location(0) vec4f {
          return textureSample(ourTexture, ourSampler, fsInput.texcoord);
        }
      `,
		})

		this.sampler = wgpu.device.createSampler({
			minFilter: 'linear',
		})
	}
	generateMips(texture: Texture) {
		if (!this.pipeline) {
			this.pipeline = wgpu.device.createRenderPipeline({
				label: 'mip level generator pipeline',
				layout: 'auto',
				vertex: {
					module: this.shader_module,
					entryPoint: 'vs',
				},
				fragment: {
					module: this.shader_module,
					entryPoint: 'fs',
					targets: [{format: texture.props.format}],
				},
			})
		}

		const encoder = wgpu.beginCommandEncoder().commandEncoder

		let width = texture.width
		let height = texture.height
		let baseMipLevel = 0
		while (width > 1 || height > 1) {
			width = Math.max(1, (width / 2) | 0)
			height = Math.max(1, (height / 2) | 0)

			const bindGroup = wgpu.device.createBindGroup({
				layout: this.pipeline.getBindGroupLayout(0),
				entries: [
					{binding: 0, resource: this.sampler},
					{binding: 1, resource: texture.texture.createView({baseMipLevel, mipLevelCount: 1})},
				],
			})

			++baseMipLevel

			const renderPassDescriptor: GPURenderPassDescriptor = {
				label: 'our basic canvas renderPass',
				colorAttachments: [
					{
						view: texture.texture.createView({baseMipLevel, mipLevelCount: 1}),
						clearValue: [0.3, 0.3, 0.3, 1],
						loadOp: 'clear',
						storeOp: 'store',
					},
				],
			}

			const pass = encoder.beginRenderPass(renderPassDescriptor)
			pass.setPipeline(this.pipeline)
			pass.setBindGroup(0, bindGroup)
			pass.draw(6) // call our vertex shader 6 times
			pass.end()
		}

		// const commandBuffer = encoder.finish()
		// wgpu.device.queue.submit([commandBuffer])
	}
}

export class WrightGPU {
	readonly device!: GPUDevice
	readonly gpu!: GPU
	readonly adapter!: GPUAdapter
	readonly queue!: GPUQueue
	readonly canvas!: HTMLCanvasElement
	readonly context!: GPUCanvasContext
	readonly limits!: GPUSupportedLimits

	width: number
	height: number

	defaultFramebuffer: FrameBuffer

	mipmapper: WMipMapper

	encoders: Encoder[] = []
	public get currPass() {
		if (this.encoders.length == 0) {
			this.beginCommandEncoder()
		}
		return this.encoders[this.encoders.length - 1]
	}

	// 🔧
	constructor(canvas: HTMLCanvasElement) {
		window.wgpu = this
		this.canvas = canvas
	}

	copy_texture_to_texture(tex_src: Texture, tex_dst: Texture) {
		this.currPass.commandEncoder.copyTextureToTexture(
			{
				texture: tex_src.texture,
			},
			{
				texture: tex_dst.texture,
			},
			{
				width: tex_src.width,
				height: tex_src.height,
			},
			// [tex_a.width, tex_a.height, 1]
		)
	}

	public endFrame() {
		for (let fb of FrameBuffer.framebuffers) {
			if (fb.pongable) {
				// fb.pong()
			}
		}
	}

	public beginCommandEncoder(): Encoder {
		const commandEncoder = wgpu.device.createCommandEncoder()
		const pass = {
			commandEncoder: commandEncoder,
		}
		this.encoders.push(pass)
		return pass
	}

	// ♻
	public async flushPasses() {
		if (wgpu.encoders.length > 0) {
			let commandBuffers: GPUCommandBuffer[] = []
			for (let pass of wgpu.encoders) {
				commandBuffers.push(pass.commandEncoder.finish())
			}
			wgpu.encoders.length = 0
			wgpu.queue.submit(commandBuffers)
		}
	}

	// 🔧
	public async initializeGPU(args?: {canvasConfig: GPUCanvasConfiguration}) {
		args = ifExistsAElseB(args, {})

		this.width = this.canvas.width = this.canvas.clientWidth * window.devicePixelRatio
		this.height = this.canvas.height = this.canvas.clientHeight * window.devicePixelRatio

		// @ts-ignore
		this.gpu = navigator.gpu
		// @ts-ignore
		this.adapter = await this.gpu.requestAdapter()
		// @ts-ignore
		this.device = await this.adapter.requestDevice()
		// @ts-ignore
		this.queue = this.device.queue
		// @ts-ignore
		this.context = this.canvas.getContext('webgpu')

		if (!this.adapter || !this.device) {
			window.alert('Error in adapter or device setup.')
			return
		}

		const adapterFeatures = this.adapter.features

		adapterFeatures.forEach((value) => {
			console.log(value)
		})

		// @ts-ignore
		this.limits = this.adapter.limits

		this.context.configure({
			device: this.device,
			// size: [this.width, this.height],
			format: 'bgra8unorm',
			usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC | GPUTextureUsage.COPY_DST, // ?
			// @ts-ignore
			alphaMode: 'opaque',
		})

		const defaultTex = this.context.getCurrentTexture()
		const defaultTexView = defaultTex.createView()

		this.defaultFramebuffer = Object.create(FrameBuffer.prototype)

		// const depthTex = new Texture({depthTex: true, framebuffer: this.defaultFramebuffer})

		const wDefaultTex: Texture = Object.create(Texture.prototype)
		wDefaultTex.texture = defaultTex
		wDefaultTex.view = defaultTexView
		wDefaultTex.width = this.width
		wDefaultTex.height = this.height
		wDefaultTex.depth = 1
		// @ts-ignore
		wDefaultTex.defaultTex = true
		wDefaultTex.props = {
			depthTex: false,
			// @ts-ignore
			usage: GPUTextureUsage.RENDER_ATTACHMENT,
			format: 'bgra8unorm',
		}
		Texture.textures.push(wDefaultTex)

		// @ts-ignore
		this.defaultFramebuffer._textures = [wDefaultTex]
		// @ts-ignore
		// this.defaultFramebuffer.depthTexture = depthTex
		this.defaultFramebuffer.depthTexture = undefined

		this.defaultFramebuffer.pongable = false
		this.defaultFramebuffer.needs_pong = false
		this.defaultFramebuffer.pong_idx = 0

		this.defaultFramebuffer.textures[0].width = this.canvas.width
		this.defaultFramebuffer.textures[0].height = this.canvas.height
		this.defaultFramebuffer.textures[0].res = [this.canvas.width, this.canvas.height]

		wDefaultTex.attachedFramebuffers = [this.defaultFramebuffer]

		const defaultFbRPDescriptor: GPURenderPassDescriptor = {
			colorAttachments: [
				{
					view: defaultTexView,
					clearValue: {r: 0, g: 0, b: 0.0, a: 1.0},
					loadOp: 'clear',
					storeOp: 'store',
					// loadOp: "clear",
				},
			],
			// depthStencilAttachment:{
			//   view: depthTex.view,

			//   depthClearValue: 1,
			//   depthLoadOp: "clear",
			//   depthStoreOp: 'store',
			// }
		}
		// @ts-ignore
		this.defaultFramebuffer._renderPassDescriptor = defaultFbRPDescriptor
		this.mipmapper = new WMipMapper(this)
	}

	public getPassThroughVert(): string {
		return require('../shaders/passthroughVert.wgsl')
	}
	public getFullScreenQuadVert(): string {
		return require('../shaders/fullscreenQuad.wgsl')
	}
}

// 🔢
export class ShaderCompute {
	public readonly compModule: GPUShaderModule
	constructor(compString: string) {
		compString = ShaderImports + compString
		this.compModule = wgpu.device.createShaderModule({code: compString})
	}
}

// 🎈
export class Shader {
	public readonly vertModule: GPUShaderModule
	public readonly fragModule: GPUShaderModule
	constructor(vertString: string, fragString: string, label_vert?: string, label_frag?: string) {
		vertString = ShaderImports + vertString
		fragString = ShaderImports + fragString
		;(this.vertModule = wgpu.device.createShaderModule({code: vertString})),
			(this.fragModule = wgpu.device.createShaderModule({code: fragString}))
	}
	// static from_files(vert_path: string, frag_path: string): Shader {
	// 	return new Shader(require(vert_path), require(frag_path), vert_path, frag_path)
	// }
}

export const ShaderImports = /* wgsl */ `
  alias iv4 = vec4<i32>;
  alias iv3 = vec3<i32>;
  alias iv2 = vec2<i32>;

  alias uv4 = vec4<u32>;
  alias uv3 = vec3<u32>;
  alias uv2 = vec2<u32>;
  alias v4 = vec4<f32>;
  alias v3 = vec3<f32>;
  alias v2 = vec2<f32>;
  alias m2 = mat2x2<f32>;
  alias m3 = mat3x3<f32>;
  alias m4 = mat4x4<f32>;
  alias float = f32;

  alias int = i32;
  alias uint = u32;

  // struct Camera {
  //   view: m4,
  //   proj: m4,
  //   invView: m4,
  //   pos: v3,
  //   near: float,
  //   far: float,
  // }

  // @group(0) @binding(1)
  // var<uniform> cam: Camera;

  // struct UBO {
  //   resolution: v2,
  //   time: float,
  //   deltaTime: float,
  //   frame: float,
  //   mouse: v4,
  // }
  // @group(0) @binding(0)
  // var<uniform> u: UBO;

  fn rot(a: float)-> m2{
    return m2(
      cos(a), -sin(a),
      sin(a), cos(a)
    );
  }

  fn rotX3(a: float) -> m3{
    let r = rot(a);

    return m3(
      1.,0.,0.,
      0.,r[0][0],r[0][1],
      0.,r[1][0],r[1][1]
    );
  }

  fn rotY3(a: float) -> m3{
    let r = rot(a);

    return m3(
      r[0][0],0.,r[0][1],
      0.,1.,0.,
      r[1][0],0.,r[1][1]
    );
  }

  fn rotZ3(a: float) -> m3{
    let r = rot(a);

    return m3(
      r[0][0],r[0][1],0.,
      r[1][0],r[1][1],0.,
      0.,0.,1.
    );
  }

fn css_contain(_u: vec2f, input_res: vec2f, tex_res: vec2f) -> vec2f{
    var u = _u;
	var input_ratio = (input_res.x/input_res.y);
	var tex_ratio = (tex_res.x/tex_res.y);
	var ratio = input_ratio / tex_ratio;
	
	if(ratio < 1.){
		// gl_Position.x -= ( 1. - 1./ratio)*0.5;
		u.x *= ratio;
	} else {
		// gl_Position.y -= ( 1. - ratio)*0.5;
		u.y /= ratio;
	}
  return u;
}

fn ndc_aspect_correct( _u: vec2f, r: vec2f) -> vec2f{
    var u = _u;
	if(r.x < r.y){
		u.y /= r.y/r.x;
	} else {
		u.x /= r.x/r.y;
	}
  return u;
}
  
fn mul3( m: mat3x3f, v: vec3f ) -> vec3f{
    return vec3f(dot(v,m[0]),dot(v,m[1]),dot(v,m[2]));
}

fn mul3b( v: vec3f, m: mat3x3f ) -> vec3f {return mul3(m,v);}

fn srgb2oklab(c: vec3f) -> vec3f {
    
    var m1 = mat3x3f(
        0.4122214708,0.5363325363,0.0514459929,
        0.2119034982,0.6806995451,0.1073969566,
        0.0883024619,0.2817188376,0.6299787005
    );
    
    var lms: vec3f = mul3(m1,c);
    
    lms = pow(max(lms,vec3f(0.)),vec3f(1./3.));

    var m2 = mat3x3f(
        0.2104542553,0.7936177850,-0.0040720468,
        1.9779984951,-2.4285922050,0.4505937099,
        0.0259040371,0.7827717662,-0.8086757660
    );
    
    return mul3(m2,lms);
}

fn oklab2srgb(c: vec3f) -> vec3f
{
    var m1 = mat3x3f(
        1.0000000000,0.3963377774,0.2158037573,
        1.0000000000,-0.1055613458,-0.0638541728,
        1.0000000000,-0.0894841775,-1.2914855480
    );

    var lms: vec3f = mul3(m1,c);
    
    lms = lms * lms * lms;
  
    var m2 = mat3x3f(
        4.0767416621,-3.3077115913,0.2309699292,
        -1.2684380046,2.6097574011,-0.3413193965,
        -0.0041960863,-0.7034186147,1.7076147010
    );
    return mul3(m2,lms);
}

fn lab2lch( c: vec3f ) -> vec3f{return vec3f(c.x,sqrt((c.y*c.y) + (c.z * c.z)),atan2(c.z,c.y));}

fn lch2lab( c: vec3f ) -> vec3f{return vec3f(c.x,c.y*cos(c.z),c.y*sin(c.z));}

fn srgb_to_oklch( c: vec3f ) -> vec3f { return lab2lch(srgb2oklab(c)); }
fn oklch_to_srgb( c: vec3f ) -> vec3f { return oklab2srgb(lch2lab(c)); }
fn fmod(a: float, b: float) -> float {return a % b;}


fn blend_brushstroke(_col: vec4f, _stroke: vec4f, blending_colour_space: int) -> vec4f{
  // col.xyz = mix(col.xyz, stroke.xyz, stroke.w); 
  var col = _col.xyz;
  
  var stroke = _stroke.xyz;
  var mode: int = blending_colour_space;

  var pi = 3.14159265358979323846;
  var tau = pi * 2.;
  
  var alpha = _stroke.w;
  
  if(alpha > 0.00000001){
    // float interpolant = stroke.w;

    stroke = stroke/max(alpha,0.001);
    
    if(mode == 0){
      // col = spectral_mix(col.xyz, clamp(stroke.xyz,0.00001,0.99999), stroke.w);
      // if(stroke.w > 0.99999)
      //   col.xyz = stroke.xyz;
    } else if(mode == 1){
      if (col.x < 0.001 && col.y < 0.001 && col.z < 0.001){
        col = vec3f(0.00625);
      }
      col = srgb_to_oklch( col );
      stroke = srgb_to_oklch( stroke );

      col.x = mix(col.x, stroke.x, alpha);
      col.y = mix(col.y, stroke.y, alpha);

      // col.z = mix(col.z, stroke.z, alpha);
      var h_a = stroke.z;
      var h_b = stroke.z + tau;
      var dist_a = abs(col.z - h_a);
      var dist_b = abs(col.z - h_b);
      if(dist_a < dist_b){
        col.z = mix(col.z, h_a, alpha);
      } else {
        col.z = mix(col.z, h_b, alpha);
      }
      col.z = fmod(col.z + tau + tau, tau);

      col = oklch_to_srgb( col);
      col = max(col,vec3f(0));
      col = min(col,vec3f(1));
    } else {
      col = mix(col, stroke, alpha);
    }
    alpha = max(_col.w, alpha);
  }

  return vec4f(col,alpha); 
}
  

  // @group(3) @binding(9)
  // var<storage, write> tex: array<float>;
`
