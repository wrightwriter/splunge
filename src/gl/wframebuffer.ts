import {ifExistsAElseB, loop} from './utils'
import {Texture} from './wtexture'
import {BindGroup} from './wbindgroup'
// import { Vec3 } from "./wmath"

export class FrameBuffer {
	static framebuffers: FrameBuffer[] = []
	// readonly textures: Texture[] = []
	_textures: Array<Texture> = []
	_back_textures: Array<Texture> = []
	readonly depthTexture?: Texture
	readonly _renderPassDescriptor: GPURenderPassDescriptor
	readonly _renderPassDescriptorBack: GPURenderPassDescriptor

	_bind_group: BindGroup
	_bind_group_back: BindGroup

	private commandEncoder: GPUCommandEncoder
	private passEncoder: GPURenderPassEncoder

	label?: string = undefined

	// private _fb_back: WebGLFramebuffer = undefined
	pongable: boolean = false
	needs_pong: boolean = false
	pong_idx: number = 0

	public get bind_group(): BindGroup {
		if (this.pong_idx === 0) return this._bind_group
		else return this._bind_group_back
	}
	public get bind_group_back(): BindGroup {
		if (this.pong_idx === 0) return this._bind_group_back
		else return this._bind_group
	}

	public get textures(): Array<Texture> {
		if (this.pong_idx === 0) return this._textures
		else return this._back_textures
	}
	public get back_textures(): Array<Texture> {
		if (this.pong_idx === 0) return this._back_textures
		else return this._textures
	}

	public get renderPassDescriptor(): GPURenderPassDescriptor {
		if (this.pong_idx === 0) return this._renderPassDescriptor
		else return this._renderPassDescriptorBack
	}
	public get renderPassDescriptorBack(): GPURenderPassDescriptor {
		if (this.pong_idx === 0) return this._renderPassDescriptorBack
		else return this._renderPassDescriptor
	}

	public pong() {
		this.pong_idx = 1 - this.pong_idx
		this.needs_pong = false
	}

	// 🔧
	constructor({
		resolution,
		depth,
		attachmentTextures: attachmentTextures,
		format,
		pongable,
		label,
	}: {
		resolution?: number[]
		depth?: boolean
		attachmentTextures?: number | Array<Texture>
		format?: GPUTextureFormat
		pongable?: boolean
		label?: string
	}) {
		this.pongable = !!pongable
		const attachmentsAreTextures = typeof attachmentTextures === 'object'

		if (!attachmentsAreTextures) attachmentTextures = ifExistsAElseB(attachmentTextures, 1)

		if (!resolution)
			if (attachmentTextures instanceof Array) {
				resolution = [attachmentTextures[0].width, attachmentTextures[0].height, 1]
			} else {
				resolution = [wgpu.width, wgpu.height, 1]
			}

		const iters = this.pongable ? 2 : 1

		for (let i = 0; i < iters; i++) {
			let colorAttachments: GPURenderPassColorAttachment[] = []
			let textures: Texture[] = []

			if (!attachmentsAreTextures) {
				loop(attachmentTextures as number, (i) => {
					const tex = new Texture({
						width: resolution[0],
						height: resolution[1],
						framebuffer: this,
						format,
						label: label ? label + '_tex_' + i : undefined,
					})
					textures.push(tex)
					colorAttachments.push({
						view: tex.view,
						clearValue: {r: 0, g: 0, b: 0, a: 0},
						loadOp: 'clear',
						storeOp: 'store',
					})
				})
			} else {
				for (let tex of attachmentTextures as Array<Texture>) {
					let t: Texture
					if (i === 0) {
						textures.push((t = tex))
					} else {
						textures.push((t = tex.clone()))
					}
					if (!t.attachedFramebuffers.includes(this)) {
						t.attachedFramebuffers.push(this)
					}
					colorAttachments.push({
						view: t.view,
						clearValue: {r: 0, g: 0, b: 0, a: 0},
						loadOp: 'clear',
						storeOp: 'store',
					})
				}
			}

			const renderPassDescriptor: GPURenderPassDescriptor = {
				colorAttachments: colorAttachments,
				label: this.label,
			}
			if (i === 0) {
				this._renderPassDescriptor = renderPassDescriptor
				this._textures = textures
			} else {
				this._renderPassDescriptorBack = renderPassDescriptor
				this._back_textures = textures
			}

			if (i === 0) {
				this._bind_group = new BindGroup([this._textures[0]])
			} else {
				this._bind_group_back = new BindGroup([this._back_textures[0]])
			}
		}

		if (depth) {
			this.depthTexture = new Texture({
				width: resolution[0],
				height: resolution[1],
				depth: resolution[2],
				depthTex: true,
				framebuffer: this,
			})
			this.renderPassDescriptor.depthStencilAttachment = {
				view: this.depthTexture.view,
				depthClearValue: 1,
				depthLoadOp: 'clear',
				depthStoreOp: 'store',
				// stencilClearValue: 0,
				// stencilLoadOp: "clear",
				// stencilStoreOp: 'store',
			}
		}
		FrameBuffer.framebuffers.push(this)
		wgpu.beginCommandEncoder()
		this.startPass()
		this.endPass()
	}

	// ♻
	refresh() {
		let i = 0
		for (let colorAttachment of this._renderPassDescriptor.colorAttachments) {
			const tex = this._textures[i]
			colorAttachment.view = tex.view
			i++
		}
		i = 0
		if (this.pongable) {
			for (let colorAttachment of this._renderPassDescriptorBack.colorAttachments) {
				const tex = this._back_textures[i]
				colorAttachment.view = tex.view
				i++
			}
		}
		if (this.depthTexture) this.renderPassDescriptor.depthStencilAttachment.view = this.depthTexture.view
	}

	startPass() {
		this.commandEncoder = wgpu.currPass.commandEncoder
		this.passEncoder = this.commandEncoder.beginRenderPass(this.renderPassDescriptor)
		wgpu.currPass.passEncoder = this.passEncoder
		wgpu.currPass.framebuffer = this
		return this.passEncoder
	}
	endPass() {
		this.passEncoder.end()
	}
}
