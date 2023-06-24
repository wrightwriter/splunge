import {VertexBuffer} from './Buffer'
import {ShaderProgram} from './ShaderProgram'

export interface BuffBinding {
	buff: VertexBuffer
	params?: AttribPointerParams
}
export interface AttribPointerParams {
	vert_sz?: number
	stride?: number
	type?: number
	offset?: number
}
export interface DrawParams {
	prim_type?: number
	draw_cnt?: number
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
		gl.bindVertexArray(this.vao)
		let i = 0
		for (let buff of this.buffs) {
			gl.enableVertexAttribArray(i)
			buff.bindToAttrib(i)
			i++
		}
	}
	static draw_external_buffs_and_shader(buffs: BuffBinding[], shader: ShaderProgram, params: DrawParams) {
		shader.use()
		// gl.bindVertexArray(gl.defaultVao)
		// gl.disableVertexAttribArray(0)
		// gl.disableVertexAttribArray(1)
		let i = 0
		// for (let buff of buffs) {
		// 	gl.enableVertexAttribArray(i)
		// 	buff.buff.bindToAttrib(i, buff.params ?? undefined)
		// 	i++
		// }
		params.prim_type = params.prim_type ?? gl.TRIANGLES
		params.draw_cnt = params.draw_cnt ?? buffs[0].buff.sz / buffs[0].buff.single_vert_sz

		if (params.prim_type === gl.TRIANGLES) {
			gl.drawArrays(gl.TRIANGLES, 0, params.draw_cnt)
			console.log('DREW')
			console.log(params.draw_cnt)
		} else {
			alert('bleep bloop errrorrr')
		}
	}

	upload_all_buffs() {
		for (let buff of this.buffs) {
			buff.upload()
		}
	}
	draw_with_external_shader(shader: ShaderProgram) {
		shader.use()
		if (this.prim_type === gl.TRIANGLES) {
			let draw_cnt = this.buffs[0].sz / this.buffs[0].single_vert_sz
			gl.drawArrays(this.prim_type, 0, draw_cnt)
		} else {
			alert('bleep bloop errrorrr')
		}
		// gl.bindVertexArray(gl.defaultVao)
	}

	draw(offs: number = 0) {
		this.draw_with_external_shader(this.shader)
	}
}
