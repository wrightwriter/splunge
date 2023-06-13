let gl: WebGL2RenderingContext
export function init_utils() {
	gl = window.gl
}
export function resizeIfNeeded(canvas: HTMLCanvasElement, default_framebuffer: Framebuffer, res: number[]) {
	const displayWidth = canvas.clientWidth
	const displayHeight = canvas.clientHeight

	const needResize = canvas.width !== displayWidth || canvas.height !== displayHeight

	if (needResize) {
		res[0] = canvas.width = displayWidth
		res[1] = canvas.height = displayHeight
		console.log('RESIZED')
		console.log(res)
		console.log(canvas)
	}

	default_framebuffer.textures[0].res = [...res]

	return needResize
}
export class Texture {
	tex: WebGLTexture
	res: Array<number>

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

		console.log(gl.isTexture(this.tex))

		if (!gl.isTexture(this.tex)) {
			console.error('TEXTURE INCOMPLETE')
		}
	}
}
export class Framebuffer {
	textures: Array<Texture>
	fb: WebGLFramebuffer
	default: boolean = false
	constructor(tex: Array<Texture>) {
		this.fb = gl.createFramebuffer() as WebGLFramebuffer
		this.textures = [...tex]
		gl.bindFramebuffer(gl.FRAMEBUFFER, this.fb)

		let i = 0
		for (let tex of this.textures) {
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
	start_draw() {
		let draw_buffs: number[] = []

		if (!this.default) {
			let i = 0
			for (let tex of this.textures) {
				draw_buffs.push(gl.COLOR_ATTACHMENT0 + i)
				i++
			}
		} else {
			draw_buffs = [gl.BACK]
		}

		gl.viewport(0, 0, this.textures[0].res[0], this.textures[0].res[1])
		// console.log(this)
		gl.bindFramebuffer(gl.FRAMEBUFFER, this.fb)
		// gl.drawBuffers(draw_buffs)
	}
	clear(colour: number[]) {
		gl.clearColor(colour[0], colour[1], colour[2], colour[3])
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
		// console.log(gl.getError())
	}
}

export class ShaderProgram {
	program: WebGLProgram
	loadShader(type: number, source: string) {
		const shader = gl.createShader(type) as WebGLShader

		gl.shaderSource(shader, source)
		gl.compileShader(shader)
		if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
			console.log(`An error occurred compiling the shaders: ${gl.getShaderInfoLog(shader)}`)
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
			console.log(`Unable to initialize the shader program: ${gl.getProgramInfoLog(shaderProgram)}`)
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
