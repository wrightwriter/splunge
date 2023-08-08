import {VertexBuffer} from './wvertexbuffer'
import {Shader} from './wgpu'
import {AbstractBindingContainer} from './wabstractbindingcontainer'
import {FrameBuffer} from './wframebuffer'
import {BindGroup} from './wbindgroup'

interface ThingParams {
	colorStates?: Array<GPUColorTargetState>
	label?: string
}
export class Thing extends AbstractBindingContainer {
	// @ts-ignore
	protected override pipeline: GPURenderPipeline
	// @ts-ignore
	protected override pipelineDescriptor: GPURenderPipelineDescriptor
	private shader: Shader
	private depthStencilState: GPUDepthStencilState

	private buffs: VertexBuffer[] = []

	private params: ThingParams = undefined

	// static things: Thing[] = []

	// protected override refreshPipeline(): void {
	//   super.refreshPipeline()
	// }

	// 🔧
	constructor(
		vertexBuffers: Array<VertexBuffer> | null,
		shader: Shader,
		fb: FrameBuffer,
		bindGroups: BindGroup[],
		params: ThingParams = {},
	) {
		super()
		// Thing.things.push(this)
		// this.buffs.push(vertexBuffers)
		this.buffs = [...vertexBuffers]
		this.bindGroups = [...bindGroups]

		this.shader = shader
		this.params = params ?? undefined

		// this.bindGroupLayouts.push(Sketch.sharedUniforms.bindGroupLayout)

		// const layout = Sketch.wgpu.device.createPipelineLayout({
		//   bindGroupLayouts: this.bindGroupLayouts
		// })
		const vertState: GPUVertexState = {
			module: shader.vertModule,
			entryPoint: 'main',
		}

		if (vertexBuffers) {
			vertState.buffers = []
			for (let buff of vertexBuffers) {
				// @ts-ignore
				vertState.buffers.push({
					arrayStride: buff.stride,
					attributes: buff.attributeDescriptors,
				})
			}
		}

		// interface GPUBlendComponent {
		//   operation?: GPUBlendOperation;
		//   srcFactor?: GPUBlendFactor;
		//   dstFactor?: GPUBlendFactor;
		// }

		// interface GPUBlendState {
		//   color: GPUBlendComponent;
		//   alpha: GPUBlendComponent;
		// }
		// 🌀 Color/Blend State
		const colorState: GPUColorTargetState = {
			format: 'bgra8unorm',
			// blend:{
			//   color:{
			//     operation: "add",
			//     srcFactor: "src-alpha",
			//     dstFactor: "one-minus-src-alpha",
			//   },
			//   alpha: {
			//     operation: "add",
			//     srcFactor: "one",
			//     dstFactor: "one-minus-src-alpha",
			//   }
			// }
		}
		const fragState: GPUFragmentState = {
			module: shader.fragModule,
			entryPoint: 'main',
			targets: params.colorStates ?? [colorState],
		}

		const primitiveState: GPUPrimitiveState = {
			frontFace: 'cw',
			cullMode: 'none',
			topology: 'triangle-list',
		}
		;(this.depthStencilState = {
			depthWriteEnabled: true,
			depthCompare: 'less',
			format: 'depth24plus', // to sync this with the depth format
		}),
			(this.pipelineDescriptor = {
				label: params.label,
				layout: 'auto',
				vertex: vertState,
				fragment: fragState,
				primitive: primitiveState,
				depthStencil: this.depthStencilState,
			})

		// this.vertexBuffers.push(vertexBuffer.getInstance(this.pipelineDescriptor))

		// this.pipeline = vertexBuffer.pipeline // ?

		this.attach_fb(fb)
		super.refreshPipeline()
	}

	attach_fb(fb: FrameBuffer) {
		const pipelineFormat: GPUTextureFormat = this.pipelineDescriptor.fragment.targets[0].format
		const pipelineDepthStencil: GPUDepthStencilState = this.pipelineDescriptor.depthStencil
		const passFormat = fb.textures[0].props.format
		const fbDepthTex = fb.depthTexture

		// @ts-ignore
		const frag_targets_cnt: number = this.pipelineDescriptor.fragment.targets.length

		if (pipelineFormat !== passFormat || frag_targets_cnt !== fb.textures.length) {
			if (!this.params) {
				this.pipelineDescriptor.fragment.targets = []
				for (let tex of fb.textures) {
					const colorState: GPUColorTargetState = {
						format: tex.props.format,
					}
					// @ts-ignore
					this.pipelineDescriptor.fragment.targets.push(colorState)
				}
			} else {
				let i = 0
				for (let tex of fb.textures) {
					this.pipelineDescriptor.fragment.targets[i].format = tex.props.format
					i++
				}
			}
		}
		if (!fbDepthTex && pipelineDepthStencil) {
			this.pipelineDescriptor.depthStencil = undefined
		} else if (
			(fbDepthTex && !pipelineDepthStencil) ||
			(pipelineDepthStencil && fbDepthTex && pipelineDepthStencil.format !== fbDepthTex.props.format)
		) {
			this.depthStencilState.format = fbDepthTex.props.format
			this.pipelineDescriptor.depthStencil = this.depthStencilState
		}
	}

	// 🔥
	bind_pipeline(passEncoder: GPURenderPassEncoder | GPUComputePassEncoder) {
		// @ts-ignore
		passEncoder.setPipeline(this.pipeline)
	}
}
