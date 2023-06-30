import {Texture} from './Texture'

export class ShaderProgram {
	[x: string]: WebGLUniformLocation | null
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
	constructor(vs: string, fs: string) {
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
		gl.useProgram(this.program)
		gl.uniformBlockBinding(this.program, 0, 0)
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
