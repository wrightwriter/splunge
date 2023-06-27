import {Texture} from './Texture'

export class Framebuffer {
	static currently_bound: Framebuffer
	static framebuffers: Framebuffer[] = []
	_textures: Array<Texture>
	_back_textures: Array<Texture>
	private _fb: WebGLFramebuffer
	// @ts-ignore
	private _fb_back: WebGLFramebuffer = undefined
	default: boolean = false
	pongable: boolean = false
	needs_pong: boolean = false
	pong_idx: number = 0

	public get textures(): Array<Texture> {
		if (this.pong_idx === 0) return this._textures
		else return this._back_textures
	}
	public get back_textures(): Array<Texture> {
		if (this.pong_idx === 0) return this._back_textures
		else return this._textures
	}

	public get fb(): WebGLFramebuffer {
		if (this.pong_idx === 0) return this._fb
		else return this._fb_back
	}

	public pong() {
		this.pong_idx = 1 - this.pong_idx
		this.needs_pong = false
	}

	public recreate() {
		if (this.pongable) {
			gl.bindFramebuffer(gl.FRAMEBUFFER, this._fb_back)

			let i = 0
			for (let tex of this._back_textures) {
				gl.framebufferTexture2D(
					gl.FRAMEBUFFER,
					gl.COLOR_ATTACHMENT0 + i,
					gl.TEXTURE_2D,
					tex.tex,
					0, // level, this is the mipmap level
				)
			}

			if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
				console.error('FRAMEBUFFER INCOMPLETE')
			}
		}

		gl.bindFramebuffer(gl.FRAMEBUFFER, this._fb)

		let i = 0
		for (let tex of this._textures) {
			gl.framebufferTexture2D(
				gl.FRAMEBUFFER,
				gl.COLOR_ATTACHMENT0 + i,
				gl.TEXTURE_2D,
				tex.tex,
				0, // level, this is the mipmap level
			)
			i++
		}

		if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
			console.error('FRAMEBUFFER INCOMPLETE')
		}
	}
	constructor(textures: Array<Texture>, pongable: boolean = false) {
		this._fb = gl.createFramebuffer() as WebGLFramebuffer
		this._textures = [...textures]
		this.pongable = pongable
		this._back_textures = []

		if (this.pongable) {
			this._fb_back = gl.createFramebuffer() as WebGLFramebuffer
			for (let tex of this.textures) {
				this._back_textures.push(tex.clone())
			}
		}

		this.recreate()

		if (this !== Framebuffer.currently_bound) gl.bindFramebuffer(gl.FRAMEBUFFER, Framebuffer.currently_bound._fb)
		Framebuffer.framebuffers.push(this)
	}
	bind() {
		if (this.pongable) this.needs_pong = true
		let draw_buffs: number[] = []

		if (this.default) {
			draw_buffs = [gl.BACK]
		} else {
			let i = 0
			for (let tex of this.textures) {
				draw_buffs.push(gl.COLOR_ATTACHMENT0 + i)
				i++
			}
		}

		gl.viewport(0, 0, this.textures[0].res[0], this.textures[0].res[1])
		gl.bindFramebuffer(gl.FRAMEBUFFER, this.fb)
		Framebuffer.currently_bound = this
		// gl.drawBuffers(draw_buffs)
	}
	clear(colour: number[] = [0, 0, 0, 0]) {
		if (this.fb !== Framebuffer.currently_bound.fb) gl.bindFramebuffer(gl.FRAMEBUFFER, this.fb)
		gl.clearColor(colour[0], colour[1], colour[2], colour[3])
		gl.clear(gl.COLOR_BUFFER_BIT)
		if (this.fb !== Framebuffer.currently_bound.fb) gl.bindFramebuffer(gl.FRAMEBUFFER, Framebuffer.currently_bound.fb)
	}
}
