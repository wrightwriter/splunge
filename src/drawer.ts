import {BrushStroke, BrushType} from 'brush_stroke'
import {FrameBuffer} from 'gl/wframebuffer'
import {StorageBuffer} from 'gl/wstoragebuffer'
import {Texture} from 'gl/wtexture'
import {Thing} from 'gl/wthing'
import {max} from 'wmath'
// // import {FrameBuffer} from ''
// import {StorageBuffer} from 'utils/wstoragebuffer'
// import {Texture} from 'utils/wtexture'
// import {Thing} from 'utils/wthing'

const cos = Math.cos
const sin = Math.sin

const get_subarray = (arr: Float32Array, offs_begin: number, offs_end: number): [Float32Array, number] => {
	return [arr.subarray(offs_begin, offs_end), offs_end - 1]
}

const get_circ_pos_from_ang = (a: number) => {
	const c = cos(-a)
	const s = sin(-a)
	return [c, s]
}

export class Drawer {
	canvas_tex: Texture
	default_framebuffer: FrameBuffer
	// @ts-ignore
	brush_buffer: Thing
	buffs: StorageBuffer[] = []
	param_buff: StorageBuffer
	zoom: number = 0
	panning: number[] = [0, 0]
	t: number = 0
	idx: number = 0
	temp_array_a: Float32Array = new Float32Array(1_000_00)
	temp_array_b: Float32Array = new Float32Array(1_000_00)

	recorded_drawcalls: number[] = []

	constructor(
		canvas_tex: Texture,
		default_framebuffer: FrameBuffer,
		buff_a: StorageBuffer,
		buff_b: StorageBuffer,
		param_buff: StorageBuffer,
	) {
		this.buffs = [buff_a, buff_b]
		this.param_buff = param_buff
		this.canvas_tex = canvas_tex
		this.default_framebuffer = default_framebuffer
	}

	reset() {
		this.idx = 0
		this.recorded_drawcalls.length = 0
		// this.recorded_drawcalls = []
		this.buffs[0].sz = 0
		this.buffs[1].sz = 0
	}

	fill_buff_for_blob_brush(stroke: BrushStroke) {
		// const brush_buffer = this.brush_buffer
		let iters = stroke.positions.length / 2 - 1
		iters = max(iters, 0)

		let aspect_correction = [0, 0]
		if (this.canvas_tex.width > this.canvas_tex.height) {
			aspect_correction[0] = this.canvas_tex.height / this.canvas_tex.width
			aspect_correction[1] = 1
		} else {
			aspect_correction[0] = 1
			aspect_correction[1] = this.canvas_tex.width / this.canvas_tex.height
		}

		const add_ang_to_pos = (
			pos: number[],
			ang_x: number[],
			ang_y: number[],
			positive: boolean,
			sz_x: number,
			sz_y: number,
		): number[] => {
			if (positive) {
				pos[0] += ang_x[0] * sz_x * aspect_correction[0]
				pos[1] += ang_x[1] * sz_x * aspect_correction[1]
				pos[0] += ang_y[0] * sz_y * aspect_correction[0]
				pos[1] += ang_y[1] * sz_y * aspect_correction[1]
			} else {
				pos[0] -= ang_x[0] * sz_x * aspect_correction[0]
				pos[1] -= ang_x[1] * sz_x * aspect_correction[1]
				pos[0] += ang_y[0] * sz_y * aspect_correction[0]
				pos[1] += ang_y[1] * sz_y * aspect_correction[1]
			}
			return pos
		}

		let idx = this.buffs[0].sz
		for (let i = 0; i < iters; i++) {
			let sz_x = stroke.sizes[i * 2] / 2
			let sz_y = stroke.sizes[i * 2 + 1] / 2
			// let next_sz = brush_stroke.sizes[i * 2 + 2]

			let ang_x = get_circ_pos_from_ang(stroke.rotations[i * 2 + 1])
			let ang_y = [ang_x[1], -ang_x[0]]
			// let next_ang = get_circ_pos_from_ang(brush_stroke.rotations[i * 2 + 3])
			// let next_ang_b = [curr_ang[1],-curr_ang[0]]

			let curr_pos = [stroke.positions[i * 2], stroke.positions[i * 2 + 1]]
			// curr_pos[0] += offs_x
			// curr_pos[1] += offs_y
			// let next_pos = [brush_stroke.positions[i * 2 + 2], brush_stroke.positions[i * 2 + 3]]

			let curr_pos_left = add_ang_to_pos([...curr_pos], ang_x, ang_y, true, sz_x, sz_y)
			let curr_pos_right = add_ang_to_pos([...curr_pos], ang_x, ang_y, false, sz_x, sz_y)

			let next_pos_left = [...curr_pos_left]
			let next_pos_right = [...curr_pos_right]

			// ----------------- OFFS
			next_pos_left[0] -= ang_y[0] * sz_y * aspect_correction[0] * 2
			next_pos_left[1] -= ang_y[1] * sz_y * aspect_correction[1] * 2
			next_pos_right[0] -= ang_y[0] * sz_y * aspect_correction[0] * 2
			next_pos_right[1] -= ang_y[1] * sz_y * aspect_correction[1] * 2
			// pos[1] += (ang_offs_b[1] * amt_b) / aspect_correction[1]

			let curr_col = [stroke.colours[i * 3], stroke.colours[i * 3 + 1], stroke.colours[i * 3 + 2]]
			let curr_opacity = stroke.opacities[i]

			const curr_v = i / iters
			const next_v = (i + 1) / iters

			// this.buffs[0].push_vert([...curr_pos_left, 0, curr_v])
			// this.buffs[1].push_vert([...curr_col, curr_opacity])
			this.buffs[0].mappedArr[idx] = curr_pos_left[0]
			this.buffs[1].mappedArr[idx++] = curr_col[0]
			this.buffs[0].mappedArr[idx] = curr_pos_left[1]
			this.buffs[1].mappedArr[idx++] = curr_col[1]
			this.buffs[0].mappedArr[idx] = 0
			this.buffs[1].mappedArr[idx++] = curr_col[2]
			this.buffs[0].mappedArr[idx] = 0
			this.buffs[1].mappedArr[idx++] = curr_opacity

			// this.buffs[0].push_vert([...curr_pos_right, 1, curr_v])
			// this.buffs[1].push_vert([...curr_col, curr_opacity])
			this.buffs[0].mappedArr[idx] = curr_pos_right[0]
			this.buffs[1].mappedArr[idx++] = curr_col[0]
			this.buffs[0].mappedArr[idx] = curr_pos_right[1]
			this.buffs[1].mappedArr[idx++] = curr_col[1]
			this.buffs[0].mappedArr[idx] = 1
			this.buffs[1].mappedArr[idx++] = curr_col[2]
			this.buffs[0].mappedArr[idx] = 0
			this.buffs[1].mappedArr[idx++] = curr_opacity

			// this.buffs[0].push_vert([...next_pos_left, 0, next_v])
			// this.buffs[1].push_vert([...curr_col, curr_opacity])
			this.buffs[0].mappedArr[idx] = next_pos_left[0]
			this.buffs[1].mappedArr[idx++] = curr_col[0]
			this.buffs[0].mappedArr[idx] = next_pos_left[1]
			this.buffs[1].mappedArr[idx++] = curr_col[1]
			this.buffs[0].mappedArr[idx] = 0
			this.buffs[1].mappedArr[idx++] = curr_col[2]
			this.buffs[0].mappedArr[idx] = 1
			this.buffs[1].mappedArr[idx++] = curr_opacity

			// this.buffs[0].push_vert([...curr_pos_right, 1, curr_v])
			// this.buffs[1].push_vert([...curr_col, curr_opacity])
			this.buffs[0].mappedArr[idx] = curr_pos_right[0]
			this.buffs[1].mappedArr[idx++] = curr_col[0]
			this.buffs[0].mappedArr[idx] = curr_pos_right[1]
			this.buffs[1].mappedArr[idx++] = curr_col[1]
			this.buffs[0].mappedArr[idx] = 1
			this.buffs[1].mappedArr[idx++] = curr_col[2]
			this.buffs[0].mappedArr[idx] = 0
			this.buffs[1].mappedArr[idx++] = curr_opacity

			// this.buffs[0].push_vert([...next_pos_left, 0, next_v])
			// this.buffs[1].push_vert([...curr_col, curr_opacity])
			this.buffs[0].mappedArr[idx] = next_pos_left[0]
			this.buffs[1].mappedArr[idx++] = curr_col[0]
			this.buffs[0].mappedArr[idx] = next_pos_left[1]
			this.buffs[1].mappedArr[idx++] = curr_col[1]
			this.buffs[0].mappedArr[idx] = 0
			this.buffs[1].mappedArr[idx++] = curr_col[2]
			this.buffs[0].mappedArr[idx] = 1
			this.buffs[1].mappedArr[idx++] = curr_opacity

			// this.buffs[0].push_vert([...next_pos_right, 1, next_v])
			// this.buffs[1].push_vert([...curr_col, curr_opacity])
			this.buffs[0].mappedArr[idx] = next_pos_right[0]
			this.buffs[1].mappedArr[idx++] = curr_col[0]
			this.buffs[0].mappedArr[idx] = next_pos_right[1]
			this.buffs[1].mappedArr[idx++] = curr_col[1]
			this.buffs[0].mappedArr[idx] = 1
			this.buffs[1].mappedArr[idx++] = curr_col[2]
			this.buffs[0].mappedArr[idx] = 1
			this.buffs[1].mappedArr[idx++] = curr_opacity
		}
		this.buffs[0].sz += iters * 6 * 4
		this.buffs[1].sz += iters * 6 * 4
		this.recorded_drawcalls.push(this.buffs[0].sz)
	}

	fill_buff_for_long_brush(stroke: BrushStroke) {
		// const brush_buffer = this.brush_buffer
		let iters = stroke.positions.length / 2 - 1
		iters = max(iters, 0)
		let aspect_correction = [0, 0]
		if (this.canvas_tex.width > this.canvas_tex.height) {
			aspect_correction[0] = this.canvas_tex.height / this.canvas_tex.width
			aspect_correction[1] = 1
		} else {
			aspect_correction[0] = 1
			aspect_correction[1] = this.canvas_tex.width / this.canvas_tex.height
		}

		const add_ang_to_pos = (
			pos: number[],
			ang_offs: number[],
			positive: boolean,
			amt: number,
			aspect_correction: number[],
		): number[] => {
			if (positive) {
				pos[0] += ang_offs[0] * amt * aspect_correction[0]
				pos[1] += ang_offs[1] * amt * aspect_correction[1]
			} else {
				pos[0] -= ang_offs[0] * amt * aspect_correction[0]
				pos[1] -= ang_offs[1] * amt * aspect_correction[1]
			}
			return pos
		}

		let idx = this.buffs[0].sz

		for (let i = 0; i < iters; i++) {
			// #define rot(a) mat2(cos(a),-sin(a),sin(a),cos(a))
			// brush_stroke.
			let curr_sz = stroke.sizes[i * 2] * 0.5
			let next_sz = stroke.sizes[i * 2 + 2] * 0.5

			let curr_ang = get_circ_pos_from_ang(stroke.rotations[i * 2 + 1])
			let next_ang = get_circ_pos_from_ang(stroke.rotations[i * 2 + 3])

			let curr_pos = [stroke.positions[i * 2], stroke.positions[i * 2 + 1]]
			let next_pos = [stroke.positions[i * 2 + 2], stroke.positions[i * 2 + 3]]

			let curr_pos_left = add_ang_to_pos([...curr_pos], curr_ang, true, curr_sz, aspect_correction)
			let curr_pos_right = add_ang_to_pos([...curr_pos], curr_ang, false, curr_sz, aspect_correction)

			let next_pos_left = add_ang_to_pos([...next_pos], next_ang, true, next_sz, aspect_correction)
			let next_pos_right = add_ang_to_pos([...next_pos], next_ang, false, next_sz, aspect_correction)

			let curr_col = [stroke.colours[i * 3], stroke.colours[i * 3 + 1], stroke.colours[i * 3 + 2]]
			let curr_opacity = stroke.opacities[i]

			let next_col = [stroke.colours[i * 3 + 3], stroke.colours[i * 3 + 4], stroke.colours[i * 3 + 5]]
			let next_opacity = stroke.opacities[i + 1]

			const curr_v = i / iters
			const next_v = (i + 1) / iters

			// this.buffs[0].push_vert([...curr_pos_left, 0, curr_v])
			// this.buffs[1].push_vert([...curr_col, curr_opacity])
			this.buffs[0].mappedArr[idx] = curr_pos_left[0]
			this.buffs[1].mappedArr[idx++] = curr_col[0]
			this.buffs[0].mappedArr[idx] = curr_pos_left[1]
			this.buffs[1].mappedArr[idx++] = curr_col[1]
			this.buffs[0].mappedArr[idx] = 0
			this.buffs[1].mappedArr[idx++] = curr_col[2]
			this.buffs[0].mappedArr[idx] = curr_v
			this.buffs[1].mappedArr[idx++] = curr_opacity

			// this.buffs[0].push_vert([...curr_pos_right, 1, curr_v])
			// this.buffs[1].push_vert([...curr_col, curr_opacity])
			this.buffs[0].mappedArr[idx] = curr_pos_right[0]
			this.buffs[1].mappedArr[idx++] = curr_col[0]
			this.buffs[0].mappedArr[idx] = curr_pos_right[1]
			this.buffs[1].mappedArr[idx++] = curr_col[1]
			this.buffs[0].mappedArr[idx] = 1
			this.buffs[1].mappedArr[idx++] = curr_col[2]
			this.buffs[0].mappedArr[idx] = curr_v
			this.buffs[1].mappedArr[idx++] = curr_opacity

			// this.buffs[0].push_vert([...next_pos_left, 0, next_v])
			// this.buffs[1].push_vert([...next_col, next_opacity])
			this.buffs[0].mappedArr[idx] = next_pos_left[0]
			this.buffs[1].mappedArr[idx++] = next_col[0]
			this.buffs[0].mappedArr[idx] = next_pos_left[1]
			this.buffs[1].mappedArr[idx++] = next_col[1]
			this.buffs[0].mappedArr[idx] = 0
			this.buffs[1].mappedArr[idx++] = next_col[2]
			this.buffs[0].mappedArr[idx] = next_v
			this.buffs[1].mappedArr[idx++] = next_opacity

			// this.buffs[0].push_vert([...curr_pos_right, 1, curr_v])
			// this.buffs[1].push_vert([...curr_col, curr_opacity])

			this.buffs[0].mappedArr[idx] = curr_pos_right[0]
			this.buffs[1].mappedArr[idx++] = curr_col[0]
			this.buffs[0].mappedArr[idx] = curr_pos_right[1]
			this.buffs[1].mappedArr[idx++] = curr_col[1]
			this.buffs[0].mappedArr[idx] = 1
			this.buffs[1].mappedArr[idx++] = curr_col[2]
			this.buffs[0].mappedArr[idx] = curr_v
			this.buffs[1].mappedArr[idx++] = curr_opacity

			// this.buffs[0].push_vert([...next_pos_left, 0, next_v])
			// this.buffs[1].push_vert([...next_col, next_opacity])
			this.buffs[0].mappedArr[idx] = next_pos_left[0]
			this.buffs[1].mappedArr[idx++] = next_col[0]
			this.buffs[0].mappedArr[idx] = next_pos_left[1]
			this.buffs[1].mappedArr[idx++] = next_col[1]
			this.buffs[0].mappedArr[idx] = 0
			this.buffs[1].mappedArr[idx++] = next_col[2]
			this.buffs[0].mappedArr[idx] = next_v
			this.buffs[1].mappedArr[idx++] = next_opacity

			// this.buffs[0].push_vert([...next_pos_right, 1, next_v])
			// this.buffs[1].push_vert([...next_col, next_opacity])
			this.buffs[0].mappedArr[idx] = next_pos_right[0]
			this.buffs[1].mappedArr[idx++] = next_col[0]
			this.buffs[0].mappedArr[idx] = next_pos_right[1]
			this.buffs[1].mappedArr[idx++] = next_col[1]
			this.buffs[0].mappedArr[idx] = 1
			this.buffs[1].mappedArr[idx++] = next_col[2]
			this.buffs[0].mappedArr[idx] = next_v
			this.buffs[1].mappedArr[idx++] = next_opacity
		}
		this.buffs[0].sz += iters * 6 * 4
		this.buffs[1].sz += iters * 6 * 4
		this.recorded_drawcalls.push(this.buffs[0].sz)
	}
	fill_buff_for_triangulated_brush(stroke: BrushStroke) {
		// const brush_buffer = this.brush_buffer
		const {colours, opacities, positions} = stroke
		// let positions = [...stroke.positions]
		// const [new_triangles, offs] = get_subarray(this.temp_array_a, 0, positions.length * 3)
		// const [new_cols] = get_subarray(this.temp_array_a, offs, offs + (positions.length / 2) * 3 * 4)
		let iters = positions.length / 2 - 1
		iters = max(iters, 0)

		let idx = this.buffs[0].sz
		for (let i = 0; i < iters; i++) {
			let u = 0
			let v = 0
			// this.buffs[1].push_vert([...curr_col, curr_opacity])

			// new_triangles[i * 3 * 2] = positions[0]
			// new_triangles[i * 3 * 2 + 1] = positions[0 + 1]
			// new_cols[i * 3 * 4] = stroke.colours[0]
			// new_cols[i * 3 * 4 + 1] = stroke.colours[1]
			// new_cols[i * 3 * 4 + 2] = stroke.colours[2]
			// new_cols[i * 3 * 4 + 3] = stroke.opacities[0]
			// this.buffs[0].push_vert([positions[0], positions[1], u, v])
			// this.buffs[1].push_vert([colours[0], colours[1], colours[2], opacities[1]])
			this.buffs[0].mappedArr[idx] = positions[0]
			this.buffs[1].mappedArr[idx++] = colours[0]
			this.buffs[0].mappedArr[idx] = positions[1]
			this.buffs[1].mappedArr[idx++] = colours[1]
			this.buffs[0].mappedArr[idx] = i / (iters + 1)
			this.buffs[1].mappedArr[idx++] = colours[2]
			this.buffs[0].mappedArr[idx] = 0
			this.buffs[1].mappedArr[idx++] = opacities[1]

			// new_triangles[i * 3 * 2 + 2] = positions[i * 2]
			// new_triangles[i * 3 * 2 + 3] = positions[i * 2 + 1]
			// new_cols[i * 3 * 4 + 4] = stroke.colours[i * 3]
			// new_cols[i * 3 * 4 + 5] = stroke.colours[i * 3 + 1]
			// new_cols[i * 3 * 4 + 6] = stroke.colours[i * 3 + 2]
			// new_cols[i * 3 * 4 + 7] = stroke.opacities[i]
			// this.buffs[0].push_vert([positions[i * 2], positions[i * 2 + 1], u, v])
			// this.buffs[1].push_vert([colours[i * 3], colours[i * 3 + 1], colours[i * 3 + 2], opacities[i]])

			this.buffs[0].mappedArr[idx] = positions[i * 2]
			this.buffs[1].mappedArr[idx++] = colours[i * 3]
			this.buffs[0].mappedArr[idx] = positions[i * 2 + 1]
			this.buffs[1].mappedArr[idx++] = colours[i * 3 + 1]
			this.buffs[0].mappedArr[idx] = i / (iters + 1)
			this.buffs[1].mappedArr[idx++] = colours[i * 3 + 2]
			this.buffs[0].mappedArr[idx] = 1
			this.buffs[1].mappedArr[idx++] = opacities[i]

			// new_triangles[i * 3 * 2 + 4] = positions[i * 2 + 2]
			// new_triangles[i * 3 * 2 + 5] = positions[i * 2 + 3]
			// new_cols[i * 3 * 4 + 8] = stroke.colours[i * 3 + 3]
			// new_cols[i * 3 * 4 + 9] = stroke.colours[i * 3 + 4]
			// new_cols[i * 3 * 4 + 10] = stroke.colours[i * 3 + 5]
			// new_cols[i * 3 * 4 + 11] = stroke.opacities[i + 1]
			// this.buffs[0].push_vert([positions[i * 2 + 2], positions[i * 2 + 3], u, v])
			// this.buffs[1].push_vert([colours[i * 3 + 3], colours[i * 3 + 4], colours[i * 3 + 5], opacities[i + 1]])
			this.buffs[0].mappedArr[idx] = positions[i * 2 + 2]
			this.buffs[1].mappedArr[idx++] = colours[i * 3 + 3]
			this.buffs[0].mappedArr[idx] = positions[i * 2 + 3]
			this.buffs[1].mappedArr[idx++] = colours[i * 3 + 4]
			this.buffs[0].mappedArr[idx] = (i + 1) / (iters + 1)
			this.buffs[1].mappedArr[idx++] = colours[i * 3 + 5]
			this.buffs[0].mappedArr[idx] = 1
			this.buffs[1].mappedArr[idx++] = opacities[i + 1]
		}
		this.buffs[0].sz += iters * 3 * 4
		this.buffs[1].sz += iters * 3 * 4
		// this.buffs[0].upload_external_array(new_triangles)
		// this.buffs[1].upload_external_array(new_cols)
		this.recorded_drawcalls.push(this.buffs[0].sz)
	}

	push_any_stroke(stroke: BrushStroke, upload: boolean) {
		const start_buff_sz_a = this.buffs[0].sz
		const start_buff_sz_b = this.buffs[1].sz

		if (stroke.brush_type === BrushType.Blobs) {
			this.fill_buff_for_blob_brush(stroke)
		} else if (stroke.brush_type === BrushType.Long) {
			this.fill_buff_for_long_brush(stroke)
		} else if (stroke.brush_type === BrushType.Tri) {
			this.fill_buff_for_triangulated_brush(stroke)
		}

		const new_tex_stretch = stroke.draw_params.tex_stretch
		const new_tex_distort = stroke.draw_params.tex_distort
		const new_tex_distort_amt = stroke.draw_params.tex_distort_amt
		const new_tex_grit = stroke.draw_params.tex_grit
		const new_hsv_dynamics = stroke.draw_params.tex_lch_dynamics

		const new_brush_tex_idx = stroke.brush_texture.idx
		const new_col_space = stroke.draw_params.blending_colour_space

		this.param_buff.mappedArr[this.param_buff.sz + 0] = new_brush_tex_idx
		this.param_buff.mappedArr[this.param_buff.sz + 1] = new_hsv_dynamics[0]
		this.param_buff.mappedArr[this.param_buff.sz + 2] = new_hsv_dynamics[1]
		this.param_buff.mappedArr[this.param_buff.sz + 3] = new_hsv_dynamics[2]
		// brush_params_mat[4] = new_noise_stretch[0]
		// brush_params_mat[5] = new_noise_stretch[1]
		this.param_buff.mappedArr[this.param_buff.sz + 6] = new_tex_stretch[0]
		this.param_buff.mappedArr[this.param_buff.sz + 7] = new_tex_stretch[1]
		this.param_buff.mappedArr[this.param_buff.sz + 8] = new_tex_distort[0]
		this.param_buff.mappedArr[this.param_buff.sz + 9] = new_tex_distort[1]
		this.param_buff.mappedArr[this.param_buff.sz + 10] = new_tex_distort_amt
		this.param_buff.mappedArr[this.param_buff.sz + 11] = new_tex_grit
		this.param_buff.mappedArr[this.param_buff.sz + 15] = new_col_space
		this.param_buff.sz += 16

		if (upload) {
			this.buffs[0].upload_range(start_buff_sz_a, this.buffs[0].sz)
			this.buffs[1].upload_range(start_buff_sz_b, this.buffs[1].sz)
			this.param_buff.upload_range(this.param_buff.sz - 16, this.param_buff.sz)
			// this.buffs[0].upload_range(0, this.buffs[0].sz + 100000)
			// this.buffs[1].upload_range(0, this.buffs[0].sz + 100000)
			// this.param_buff.upload_range(0, this.param_buff.sz + 10000)
		}
	}
	pop_stroke() {
		this.param_buff.sz -= 16
		this.param_buff.sz = max(this.param_buff.sz, 0)
		this.buffs[0].sz = this.buffs[1].sz = this.recorded_drawcalls[max(this.recorded_drawcalls.length - 2, 0)]
		this.recorded_drawcalls.pop()
	}

	draw_stroke_idx(idx: number, encoder: GPURenderPassEncoder | GPUComputePassEncoder) {
		let draw_start = idx === 0 ? 0 : this.recorded_drawcalls[idx - 1]
		let draw_cnt = idx === 0 ? this.recorded_drawcalls[0] : this.recorded_drawcalls[idx] - this.recorded_drawcalls[idx - 1]
		draw_cnt /= 4
		draw_start /= 4

		// console.log('draw cnt')
		// console.log(draw_cnt)
		// console.log(draw_start)
		if (draw_cnt > 0) (encoder as GPURenderPassEncoder).draw(draw_cnt, 1, draw_start, idx)
	}

	// draw_any_stroke(stroke: BrushStroke, t: number, brush_buffer: Thing, zoom: number, panning: number[]) {
	// 	this.brush_buffer = brush_buffer
	// 	this.t = t
	// 	this.zoom = zoom
	// 	this.panning[0] = panning[0]
	// 	this.panning[1] = panning[1]

	// 	brush_buffer.draw()
	// }
}
