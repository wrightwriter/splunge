import {Framebuffer, ShaderProgram, Texture, Thing} from 'gl_utils'
import {BrushStroke, BrushType, Utils} from 'stuff'
import {cos, floor, sin} from 'wmath'

let gl: WebGL2RenderingContext
export class Drawer {
	draw_blobs_stroke_program: ShaderProgram
	brush_triangulated_program: ShaderProgram
	set_shared_uniforms: Function
	canvas_tex: Texture
	default_framebuffer: Framebuffer
	t: number = 0

	constructor(
		draw_blobs_stroke_program: ShaderProgram,
		brush_triangulated_program: ShaderProgram,
		set_shared_uniforms: Function,
		_gl: WebGL2RenderingContext,
		canvas_tex: Texture,
		default_framebuffer: Framebuffer,
	) {
		this.set_shared_uniforms = set_shared_uniforms
		this.draw_blobs_stroke_program = draw_blobs_stroke_program
		this.canvas_tex = canvas_tex
		this.default_framebuffer = default_framebuffer
		this.brush_triangulated_program = brush_triangulated_program
		gl = _gl
	}

	draw_blobs_stroke(
		_col: number[],
		_opacity: number,
		_pos: number[],
		_rot: number[],
		_sz: number[],
		_tex_lch_dynamics: number[],
		_tex_stretch: number[],
	) {
		let draw_blobs_stroke_program = this.draw_blobs_stroke_program
		let set_shared_uniforms = this.set_shared_uniforms
		draw_blobs_stroke_program.use()
		set_shared_uniforms(draw_blobs_stroke_program, _col, this.t)

		draw_blobs_stroke_program.setUniformVec('stroke_pos', _pos)
		draw_blobs_stroke_program.setUniformVec('stroke_col', _col)
		// draw_temp_stroke_program.setUniformVec('brush_sz', brush_sz)
		draw_blobs_stroke_program.setUniformVec('brush_sz', _sz)
		draw_blobs_stroke_program.setUniformFloat('stroke_opacity', _opacity)
		draw_blobs_stroke_program.setUniformVec('tilt', _rot)
		draw_blobs_stroke_program.setUniformVec('tex_lch_dynamics', [
			_tex_lch_dynamics[0],
			_tex_lch_dynamics[1],
			_tex_lch_dynamics[2],
		])
		draw_blobs_stroke_program.setUniformVec('tex_stretch', [_tex_stretch[0], _tex_stretch[1]])
		gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
	}

	fill_buff_for_long_brush(brush_stroke: BrushStroke, brush_buffer: Thing) {
		let draw_blobs_stroke_program = this.draw_blobs_stroke_program
		let set_shared_uniforms = this.set_shared_uniforms
		brush_buffer.buffs[0].sz = 0
		brush_buffer.buffs[1].sz = 0
		const iters = brush_stroke.positions.length / 2 - 1
		const aspect_correction = Utils.screen_NDC_to_canvas_NDC([1, 1], this.default_framebuffer.textures[0], this.canvas_tex)
		for (let i = 0; i < iters; i++) {
			// #define rot(a) mat2(cos(a),-sin(a),sin(a),cos(a))
			const get_circ_pos_from_ang = (a: number) => {
				const c = cos(-a)
				const s = sin(-a)
				return [c, s]
			}

			const add_ang_to_pos = (pos: number[], ang_offs: number[], positive: boolean, amt: number): number[] => {
				if (positive) {
					pos[0] += (ang_offs[0] * amt) / aspect_correction[0]
					pos[1] += (ang_offs[1] * amt) / aspect_correction[1]
				} else {
					pos[0] -= (ang_offs[0] * amt) / aspect_correction[0]
					pos[1] -= (ang_offs[1] * amt) / aspect_correction[1]
				}
				return pos
			}
			// brush_stroke.
			let curr_sz = brush_stroke.sizes[i * 2]
			let next_sz = brush_stroke.sizes[i * 2 + 2]

			let curr_ang = get_circ_pos_from_ang(brush_stroke.rotations[i * 2 + 1])
			let next_ang = get_circ_pos_from_ang(brush_stroke.rotations[i * 2 + 3])

			let curr_pos = [brush_stroke.positions[i * 2], brush_stroke.positions[i * 2 + 1]]
			let next_pos = [brush_stroke.positions[i * 2 + 2], brush_stroke.positions[i * 2 + 3]]

			let curr_pos_left = add_ang_to_pos([...curr_pos], curr_ang, true, curr_sz)
			let curr_pos_right = add_ang_to_pos([...curr_pos], curr_ang, false, curr_sz)

			let next_pos_left = add_ang_to_pos([...next_pos], next_ang, true, next_sz)
			let next_pos_right = add_ang_to_pos([...next_pos], next_ang, false, next_sz)

			let curr_col = [brush_stroke.colours[i * 3], brush_stroke.colours[i * 3 + 1], brush_stroke.colours[i * 3 + 2]]
			let curr_opacity = brush_stroke.opacities[i]

			let next_col = [brush_stroke.colours[i * 3 + 3], brush_stroke.colours[i * 3 + 4], brush_stroke.colours[i * 3 + 5]]
			let next_opacity = brush_stroke.opacities[i + 1]

			const curr_v = i / iters
			const next_v = (i + 1) / iters

			brush_buffer.buffs[0].push_vert([...curr_pos_left, 0, curr_v])
			brush_buffer.buffs[1].push_vert([...curr_col, curr_opacity])
			brush_buffer.buffs[0].push_vert([...curr_pos_right, 1, curr_v])
			brush_buffer.buffs[1].push_vert([...curr_col, curr_opacity])
			brush_buffer.buffs[0].push_vert([...next_pos_left, 0, next_v])
			brush_buffer.buffs[1].push_vert([...next_col, next_opacity])

			brush_buffer.buffs[0].push_vert([...curr_pos_right, 1, curr_v])
			brush_buffer.buffs[1].push_vert([...curr_col, curr_opacity])
			brush_buffer.buffs[0].push_vert([...next_pos_left, 0, next_v])
			brush_buffer.buffs[1].push_vert([...next_col, next_opacity])
			brush_buffer.buffs[0].push_vert([...next_pos_right, 1, next_v])
			brush_buffer.buffs[1].push_vert([...next_col, next_opacity])
		}
	}

	draw_any_stroke(stroke: BrushStroke, t: number, brush_buffer: Thing) {
		this.t = t
		if (stroke.brush_type === BrushType.Blobs) {
			for (let i = 0; i < stroke.positions.length / 2; i++) {
				let pos = [stroke.positions[i * 2], stroke.positions[i * 2 + 1]]
				let sz = [stroke.sizes[i * 2], stroke.sizes[i * 2 + 1]]
				let col = [stroke.colours[i * 3], stroke.colours[i * 3 + 1], stroke.colours[i * 3 + 2]]
				let opacity = stroke.opacities[i]
				let rot = [stroke.rotations[i * 2], stroke.rotations[i * 2 + 1]]
				this.draw_blobs_stroke(
					[...col, 1],
					opacity,
					pos,
					rot,
					sz,
					stroke.draw_params.tex_lch_dynamics,
					stroke.draw_params.tex_stretch,
				)
			}
		} else if (stroke.brush_type === BrushType.Long) {
			this.fill_buff_for_long_brush(stroke, brush_buffer)
			this.set_shared_uniforms(brush_buffer.shader, [0, 0, 0, 0], t)
			brush_buffer.upload_all_buffs()
			brush_buffer.draw()
		} else if (stroke.brush_type === BrushType.Tri) {
			const Tess2 = require('tess2')
			let positions = [...stroke.positions]
			positions.forEach((v, i, a) => {
				a[i] = (v + 1) * 1000
				a[i] = floor(a[i])
			})
			// let triangles = earcut(stroke.positions)
			let triangles = Tess2.tesselate({
				contours: [positions],
				windingRule: Tess2.WINDING_ODD,
				elementType: Tess2.POLYGONS,
				polySize: 3,
				vertexSize: 2,
			}).elements
			triangles.forEach((v, i, a) => {
				a[i] = v / 1000 - 0.5
			})
			brush_buffer.buffs[0].upload_external_buff(triangles)
			brush_buffer.buffs[1].upload_external_buff(triangles)
			this.set_shared_uniforms(brush_buffer.shader, [0, 0, 0, 0], t)
			brush_buffer.draw_with_external_shader(this.brush_triangulated_program)

			// brush_buffer.buffs[0].push_vert([...curr_pos_left, 0, curr_v])
			// brush_buffer.buffs[1].push_vert([...curr_col, curr_opacity])
		}
	}
}
