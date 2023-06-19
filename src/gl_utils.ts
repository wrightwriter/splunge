import {isThisTypeNode} from 'typescript'
import {pow} from 'wmath'

let gl: WebGL2RenderingContext
export function init_utils() {
	gl = window.gl
	gl.defaultVao = gl.createVertexArray() as WebGLVertexArrayObject
	gl.bindVertexArray(gl.defaultVao)
}
export function resizeIfNeeded(
	canvas: HTMLCanvasElement,
	default_framebuffer: Framebuffer,
	client_res: number[],
	set_redraw_needed: (v: boolean) => void,
) {
	const displayWidth = canvas.clientWidth
	const displayHeight = canvas.clientHeight

	const needResize = canvas.width !== displayWidth || canvas.height !== displayHeight

	if (needResize) {
		client_res[0] = canvas.width = displayWidth
		client_res[1] = canvas.height = displayHeight
		// console.log('RESIZED')
		// console.log(client_res)
		// console.log(canvas)
		set_redraw_needed(true)
	}

	// @ts-ignore
	default_framebuffer._textures[0].res = [...client_res]

	return needResize
}
export class Texture {
	tex: WebGLTexture
	res: Array<number>

	clone(): Texture {
		return new Texture(this.res)
	}

	read_back_array(offs: number[] = [0, 0], read_back_res: number[] = [...this.res]): Uint8Array {
		let temp_fb = gl.createFramebuffer() as WebGLFramebuffer
		let prev_bound_fb = Framebuffer.currently_bound
		gl.bindFramebuffer(gl.FRAMEBUFFER, temp_fb)
		gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.tex, 0)

		// const data = new Uint8Array(this.res[0] * this.res[1] * 4)
		const data = new Uint8Array(read_back_res[0] * read_back_res[1] * 4)
		gl.readPixels(offs[0], offs[1], read_back_res[0], read_back_res[1], gl.RGBA, gl.UNSIGNED_BYTE, data)
		// console.log(data)
		gl.deleteFramebuffer(temp_fb)
		gl.bindFramebuffer(gl.FRAMEBUFFER, prev_bound_fb.fb)
		return data
	}
	read_back_pixel(offs: number[]): Array<number> {
		let data = this.read_back_array(offs, [1, 1])
		data[3] = 255
		// @ts-ignore
		return Array.from(data)
	}
	async read_back_image(
		gamma_correct: boolean = false,
		offs: number[] = [0, 0],
		read_back_res: number[] = [...this.res],
	): Promise<[HTMLImageElement, Blob]> {
		let data = this.read_back_array(offs, read_back_res)

		let i = 0
		let idx = 0
		for (let pixel of data) {
			if (i === 3) {
				data[idx] = 255
				i = -1
			} else {
				if (gamma_correct) {
					data[idx] = 255 * pow(data[idx] / 255, 0.4545454545)
				}
				// data[idx] *= 240
			}
			idx++
			i++
		}

		// Create a 2D canvas to store the result
		const canvas = document.createElement('canvas')
		canvas.width = this.res[0]
		canvas.height = this.res[1]
		const context = canvas.getContext('2d') as CanvasRenderingContext2D

		let blob: Blob

		const getCanvasBlob = (canvas: HTMLCanvasElement): Promise<Blob> => {
			return new Promise(function (resolve, reject) {
				canvas.toBlob(function (blob) {
					// @ts-ignore
					resolve(blob)
				}, 'image/png')
			})
		}

		blob = await getCanvasBlob(canvas)
		console.log('BLORGUBS')
		console.log(blob)

		// canvas.toBlob((b) => {
		// 	blob = b as Blob
		// 	console.log('BLOB A')
		// 	console.log(blob)
		// }, 'image/png')

		// console.log('BLOB B')
		// console.log(blob)

		const imageData = context.createImageData(canvas.width, canvas.height)
		imageData.data.set(data)
		context.putImageData(imageData, 0, 0)
		const img = new Image()
		img.src = canvas.toDataURL()

		canvas.remove()
		// @ts-ignore
		return [img, blob]
	}
	constructor(res: number[]) {
		// @ts-ignore
		this.tex = gl.createTexture()
		this.res = [...res]
		gl.bindTexture(gl.TEXTURE_2D, this.tex)

		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, res[0], res[1], 0, gl.RGBA, gl.UNSIGNED_BYTE, null)

		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)

		// console.log(gl.isTexture(this.tex))

		if (!gl.isTexture(this.tex)) {
			console.error('TEXTURE INCOMPLETE')
		}
	}
}
export class Framebuffer {
	static currently_bound: Framebuffer
	static framebuffers: Framebuffer[] = []
	private _textures: Array<Texture>
	private _back_textures: Array<Texture>
	public get textures(): Array<Texture> {
		if (this.pong_idx === 0) return this._textures
		else return this._back_textures
	}
	public get back_textures(): Array<Texture> {
		if (this.pong_idx === 0) return this._back_textures
		else return this._textures
	}

	private _fb: WebGLFramebuffer
	// @ts-ignore
	private _fb_back: WebGLFramebuffer = undefined

	public get fb(): WebGLFramebuffer {
		if (this.pong_idx === 0) return this._fb
		else return this._fb_back
	}
	default: boolean = false
	pongable: boolean = false
	needs_pong: boolean = false
	pong_idx: number = 0
	constructor(textures: Array<Texture>, pongable: boolean = false) {
		this._fb = gl.createFramebuffer() as WebGLFramebuffer
		this._textures = [...textures]
		this.pongable = pongable
		this._back_textures = []
		if (pongable) {
			this._fb_back = gl.createFramebuffer() as WebGLFramebuffer
			for (let tex of textures) {
				this._back_textures.push(tex.clone())
			}
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
				i++
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

		if (this !== Framebuffer.currently_bound) gl.bindFramebuffer(gl.FRAMEBUFFER, Framebuffer.currently_bound._fb)
		Framebuffer.framebuffers.push(this)
	}
	start_draw() {
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
		gl.drawBuffers(draw_buffs)
	}
	clear(colour: number[] = [0, 0, 0, 0]) {
		if (this.fb !== Framebuffer.currently_bound.fb) gl.bindFramebuffer(gl.FRAMEBUFFER, this.fb)
		gl.clearColor(colour[0], colour[1], colour[2], colour[3])
		gl.clear(gl.COLOR_BUFFER_BIT)
		if (this.fb !== Framebuffer.currently_bound.fb) gl.bindFramebuffer(gl.FRAMEBUFFER, Framebuffer.currently_bound.fb)
	}
}

export class ShaderProgram {
	program: WebGLProgram
	loadShader(type: number, source: string) {
		source = source.replaceAll('export default "', ``)
		source = source.replaceAll('";', ``)
		source = source.replaceAll('"', ``)
		source = source.replaceAll(
			`\\n`,
			`
		`,
		)
		source = source.replace(
			/(.*)(#version 300 es)[\t\s]*/g,
			`$2
			`,
		)
		source = source.replaceAll(
			/(#define .+)[\t\s]*/g,
			`
		$1
		`,
		)
		source = source.replaceAll(
			/	+precision highp float;/gm,
			`precision highp float;
			`,
		)
		source = source.replaceAll(`\\t`, `	`)
		const shader = gl.createShader(type) as WebGLShader

		gl.shaderSource(shader, source)
		gl.compileShader(shader)
		if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
			console.error(`An error occurred compiling the shaders: ${gl.getShaderInfoLog(shader)}`)
			console.error(source)
		}
		return shader
	}
	constructor(vs, fs) {
		const vertexShader = this.loadShader(gl.VERTEX_SHADER, vs)
		const fragmentShader = this.loadShader(gl.FRAGMENT_SHADER, fs)

		const shaderProgram = gl.createProgram() as WebGLProgram
		gl.attachShader(shaderProgram, vertexShader)
		gl.attachShader(shaderProgram, fragmentShader)
		gl.linkProgram(shaderProgram)

		if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
			console.error(`Unable to initialize the shader program: ${gl.getProgramInfoLog(shaderProgram)}`)
			console.error(vs)
			console.error(fs)
		}
		this.program = shaderProgram
	}
	use() {
		gl.useProgram(this.program)
	}
	setUniformVec(name: string, vec: number[]) {
		if (vec.length == 2) gl.uniform2fv(gl.getUniformLocation(this.program, name), vec)
		else if (vec.length == 3) gl.uniform3fv(gl.getUniformLocation(this.program, name), vec)
		else if (vec.length == 4) gl.uniform4fv(gl.getUniformLocation(this.program, name), vec)
	}
	setUniformFloat(name: string, value: number) {
		gl.uniform1f(gl.getUniformLocation(this.program, name), value)
	}
	setUniformInt(name: string, value: number) {
		gl.uniform1i(gl.getUniformLocation(this.program, name), value)
	}
	setUniformTexture(name: string, texture: Texture, binding: number = 0) {
		gl.activeTexture(gl.TEXTURE0 + binding)
		gl.bindTexture(gl.TEXTURE_2D, texture.tex)
		gl.uniform1i(gl.getUniformLocation(this.program, name), binding)
	}
}

export function finish_frame() {
	for (let framebuffer of Framebuffer.framebuffers) {
		if (framebuffer.needs_pong) {
			// console.log('ponged')
			framebuffer.pong_idx = 1 - framebuffer.pong_idx
			framebuffer.needs_pong = false
		}
	}
}

export class Thing {
	vao: WebGLVertexArrayObject
	buffs: VertexBuffer[]
	shader: ShaderProgram
	prim_type: number

	constructor(buffs: VertexBuffer[], prim_type: number = gl.TRIANGLES, shader: ShaderProgram) {
		this.prim_type = prim_type
		this.shader = shader
		this.vao = gl.createVertexArray() as WebGLVertexArrayObject
		this.buffs = [...buffs]
	}

	upload_all_buffs() {
		for (let buff of this.buffs) {
			buff.upload()
		}
	}
	draw_with_external_shader(shader: ShaderProgram) {
		shader.use()
		gl.bindVertexArray(this.vao)
		let i = 0
		for (let buff of this.buffs) {
			gl.enableVertexAttribArray(i)
			buff.bindToAttrib(i)
			i++
		}

		if (this.prim_type === gl.TRIANGLES) {
			let draw_cnt = this.buffs[0].sz / this.buffs[0].single_vert_sz
			gl.drawArrays(this.prim_type, 0, draw_cnt)
		} else {
			alert('bleep bloop errrorrr')
		}
		gl.bindVertexArray(gl.defaultVao)
	}

	draw() {
		this.draw_with_external_shader(this.shader)
	}
}

export class VertexBuffer {
	buff: WebGLBuffer

	cpu_buff: Float32Array | Int32Array | Uint32Array
	type: number

	stride: number
	single_vert_sz: number
	sz: number
	max_sz: number

	bindToAttrib(idx: number) {
		gl.bindBuffer(gl.ARRAY_BUFFER, this.buff)
		gl.vertexAttribPointer(idx, this.single_vert_sz, this.type, false, this.stride, 0)
	}

	constructor(single_vert_sz: number, type: number = gl.FLOAT, max_size: number = 1000000) {
		this.buff = gl.createBuffer() as WebGLBuffer
		this.type = type

		this.single_vert_sz = single_vert_sz
		this.max_sz = max_size
		this.stride = 0

		if (type === gl.FLOAT) {
			this.cpu_buff = new Float32Array(max_size)
		} else if (type === gl.INT) {
			this.cpu_buff = new Int32Array(max_size)
		} else {
			this.cpu_buff = new Uint32Array(max_size)
		}
		this.sz = 0
	}
	push_vert(vert: number[]) {
		if (vert.length !== this.single_vert_sz) {
			debugger
		}
		for (let v of vert) {
			this.cpu_buff[this.sz++] = v
		}
	}
	upload_external_buff(input_buff: number[] | Float32Array) {
		if (input_buff instanceof Array) {
			gl.bindBuffer(gl.ARRAY_BUFFER, this.buff)
			let _buff = Float32Array.from(input_buff)
			this.sz = _buff.length
			// const sz_in_bytes = _buff.length * _buff.BYTES_PER_ELEMENT
			const sz_in_bytes = _buff.byteLength / 2

			console.log('BEGIN BUFF PRINT')
			console.log(_buff)
			console.log('len')
			console.log(_buff.length)
			console.log('sz byes')
			console.log(sz_in_bytes)
			// if (_buff.length > 0) gl.bufferData(gl.ARRAY_BUFFER, _buff, gl.DYNAMIC_DRAW, 0, sz_in_bytes)
			if (_buff.length > 0) gl.bufferData(gl.ARRAY_BUFFER, _buff, gl.DYNAMIC_DRAW, 0)
		} else {
			gl.bindBuffer(gl.ARRAY_BUFFER, input_buff)
			const sz_in_bytes = input_buff.length * input_buff.BYTES_PER_ELEMENT
			gl.bufferData(gl.ARRAY_BUFFER, input_buff, gl.DYNAMIC_DRAW, 0, sz_in_bytes)
		}
	}
	upload() {
		gl.bindBuffer(gl.ARRAY_BUFFER, this.buff)
		const sz_in_bytes = this.sz * this.cpu_buff.BYTES_PER_ELEMENT
		gl.bufferData(gl.ARRAY_BUFFER, this.cpu_buff, gl.DYNAMIC_DRAW, 0, sz_in_bytes)
	}
}
