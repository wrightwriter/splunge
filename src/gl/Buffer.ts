import {pause_on_gl_error} from 'gl_utils'
import {type AttribPointerParams} from './Thing'

export class UBO {
	// buff: WebGLBuffer = gl.createBuffer() as WebGLBuffer
	buff: VertexBuffer
	uniforms: (number | string)[] = []
	constructor() {
		// gl.bindBuffer(gl.UNIFORM_BUFFER, this.buff)
		// gl.bufferData(gl.UNIFORM_BUFFER, 32 * 4, gl.DYNAMIC_DRAW)
		// this.buff = new VertexBuffer(0, gl.FLOAT, 32 * 4 * 4 * 4, gl.UNIFORM_BUFFER)
		this.buff = new VertexBuffer(0, gl.FLOAT, 96, gl.UNIFORM_BUFFER)
		gl.bindBufferBase(gl.UNIFORM_BUFFER, 0, this.buff.buff)
	}
}

export class VertexBuffer {
	buff: WebGLBuffer

	cpu_buff: Float32Array | Int32Array | Uint32Array
	type: number
	usage: number

	stride: number
	single_vert_sz: number
	sz: number
	max_sz: number

	constructor(single_vert_sz: number, type: number = gl.FLOAT, max_size: number = 10000000, usage: number = gl.ARRAY_BUFFER) {
		this.buff = gl.createBuffer() as WebGLBuffer
		this.usage = usage
		gl.bindBuffer(usage, this.buff)
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

		// gl.bufferData(gl.ARRAY_BUFFER, this.cpu_buff, gl.DYNAMIC_DRAW)
		// gl.bufferData(usage, this.cpu_buff.length * this.cpu_buff.BYTES_PER_ELEMENT, gl.DYNAMIC_DRAW)
		gl.bufferData(usage, this.cpu_buff.byteLength, gl.DYNAMIC_DRAW)
		this.sz = 0
	}

	bindToAttrib(idx: number, params: AttribPointerParams | undefined = undefined) {
		if (params) {
			gl.bindBuffer(this.usage, this.buff)
			gl.vertexAttribPointer(
				idx,
				params.vert_sz ?? this.single_vert_sz,
				params.type ?? this.type,
				false,
				params.stride ?? this.stride,
				params.offset ?? 0,
			)
		} else {
			gl.bindBuffer(this.usage, this.buff)
			gl.vertexAttribPointer(idx, this.single_vert_sz, this.type, false, this.stride, 0)
		}
	}
	push_vert(vert: number[]) {
		if (vert.length !== this.single_vert_sz) {
			// debugger
		}
		for (let v of vert) {
			this.cpu_buff[this.sz++] = v
		}
	}
	upload_external_array(input_buff: number[] | Float32Array) {
		if (input_buff instanceof Array) {
			gl.bindBuffer(this.usage, this.buff)
			let _buff = Float32Array.from(input_buff)
			this.sz = _buff.length
			// const sz_in_bytes = _buff.length * _buff.BYTES_PER_ELEMENT
			const sz_in_bytes = _buff.byteLength

			// console.log('BEGIN BUFF PRINT')
			// console.log(_buff)
			// console.log('len')
			// console.log(_buff.length)
			// console.log('sz byes')
			// console.log(sz_in_bytes)
			// if (_buff.length > 0) gl.bufferData(gl.ARRAY_BUFFER, _buff, gl.DYNAMIC_DRAW, 0, sz_in_bytes)
			// if (_buff.length > 0) gl.bufferData(gl.ARRAY_BUFFER, _buff, gl.DYNAMIC_DRAW, 0)
			// if (_buff.length > 0) gl.bufferData(gl.ARRAY_BUFFER, _buff, gl.DYNAMIC_DRAW, 0, sz_in_bytes)
			// gl.bufferData(gl.ARRAY_BUFFER, _buff, gl.DYNAMIC_DRAW, 0, sz_in_bytes)

			// gl.bufferSubData(this.usage, 0, _buff, 0, sz_in_bytes)
			gl.bufferSubData(this.usage, 0, _buff)
			pause_on_gl_error()
		} else {
			gl.bindBuffer(this.usage, this.buff)
			// const sz_in_bytes = input_buff.length * input_buff.BYTES_PER_ELEMENT
			const sz_in_bytes = input_buff.byteLength
			// gl.bufferData(gl.ARRAY_BUFFER, input_buff, gl.DYNAMIC_DRAW, 0, sz_in_bytes)
			// gl.bufferSubData(gl.ARRAY_BUFFER, 0, input_buff, 0, sz_in_bytes)
			// gl.bufferData(gl.ARRAY_BUFFER, sz_in_bytes, gl.DYNAMIC_DRAW)
			// gl.bufferSubData(gl.ARRAY_BUFFER, 0, input_buff, 0, sz_in_bytes)
			gl.bufferSubData(this.usage, 0, input_buff)

			// gl.bufferSubData(gl.ARRAY_BUFFER,0, input_buff.buffer, gl.DYNAMIC_DRAW)
			// @ts-ignore
			// gl.bufferSubData(gl.ARRAY_BUFFER, input_buff.buffer, gl.DYNAMIC_DRAW)
			pause_on_gl_error()
		}
	}
	upload() {
		gl.bindBuffer(this.usage, this.buff)
		const sz_in_bytes = this.sz * this.cpu_buff.BYTES_PER_ELEMENT
		// gl.bufferData(gl.ARRAY_BUFFER, this.cpu_buff, gl.DYNAMIC_DRAW, 0, sz_in_bytes)
		gl.bufferSubData(this.usage, 0, this.cpu_buff, 0, sz_in_bytes)
		pause_on_gl_error()
	}
}
