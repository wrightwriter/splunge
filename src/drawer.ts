import {Utils} from 'stuff'
import {BrushStroke, BrushType} from 'brush_stroke'
import {cos, floor, sin} from 'wmath'
import earcut from 'earcut'
import libtess from 'libtess'
import {Framebuffer} from 'gl/Framebuffer'
import {Texture} from 'gl/Texture'
import {Thing} from 'gl/Thing'
const tessy = (function initTesselator() {
	// function called for each vertex of tesselator output
	function vertexCallback(data, polyVertArray) {
		// console.log(data[0], data[1]);
		polyVertArray[polyVertArray.length] = data[0]
		polyVertArray[polyVertArray.length] = data[1]
	}
	function begincallback(type) {
		if (type !== libtess.primitiveType.GL_TRIANGLES) {
			console.log('expected TRIANGLES but got type: ' + type)
		}
	}
	function errorcallback(errno) {
		console.log('error callback')
		console.log('error number: ' + errno)
	}
	// callback for when segments intersect and must be split
	function combinecallback(coords, data, weight) {
		// console.log('combine callback');
		return [coords[0], coords[1], coords[2]]
	}
	function edgeCallback(flag) {
		// don't really care about the flag, but need no-strip/no-fan behavior
		// console.log('edge flag: ' + flag);
	}

	const tessy = new libtess.GluTesselator()
	// tessy.gluTessProperty(libtess.gluEnum.GLU_TESS_WINDING_RULE, libtess.windingRule.GLU_TESS_WINDING_POSITIVE);
	tessy.gluTessCallback(libtess.gluEnum.GLU_TESS_VERTEX_DATA, vertexCallback)
	tessy.gluTessCallback(libtess.gluEnum.GLU_TESS_BEGIN, begincallback)
	tessy.gluTessCallback(libtess.gluEnum.GLU_TESS_ERROR, errorcallback)
	tessy.gluTessCallback(libtess.gluEnum.GLU_TESS_COMBINE, combinecallback)
	tessy.gluTessCallback(libtess.gluEnum.GLU_TESS_EDGE_FLAG, edgeCallback)

	return tessy
})()

function triangulate(contours) {
	// libtess will take 3d verts and flatten to a plane for tesselation
	// since only doing 2d tesselation here, provide z=1 normal to skip
	// iterating over verts only to get the same answer.
	// comment out to test normal-generation code
	tessy.gluTessNormal(0, 0, 1)

	const triangleVerts = []
	tessy.gluTessBeginPolygon(triangleVerts)

	for (let i = 0; i < contours.length; i++) {
		tessy.gluTessBeginContour()
		let contour = contours[i]
		for (let j = 0; j < contour.length; j += 2) {
			const coords = [contour[j], contour[j + 1], 0]
			tessy.gluTessVertex(coords, coords)
		}
		tessy.gluTessEndContour()
	}

	// finish polygon (and time triangulation process)
	// const startTime = window.nowish()
	tessy.gluTessEndPolygon()
	// const endTime = window.nowish()
	// console.log('tesselation time: ' + (endTime - startTime).toFixed(2) + 'ms')

	return triangleVerts
}

const get_subarray = (arr: Float32Array, offs_begin: number, offs_end: number): [Float32Array, number] => {
	return [arr.subarray(offs_begin, offs_end), offs_end - 1]
}

const get_circ_pos_from_ang = (a: number) => {
	const c = cos(-a)
	const s = sin(-a)
	return [c, s]
}

let gl: WebGL2RenderingContext
export class Drawer {
	canvas_tex: Texture
	default_framebuffer: Framebuffer
	// @ts-ignore
	brush_buffer: Thing
	zoom: number = 0
	panning: number[] = [0, 0]
	t: number = 0
	idx: number = 0
	temp_array_a: Float32Array = new Float32Array(1_000_00)
	temp_array_b: Float32Array = new Float32Array(1_000_00)

	recorded_drawcalls: number[] = []

	constructor(_gl: WebGL2RenderingContext, canvas_tex: Texture, default_framebuffer: Framebuffer) {
		this.canvas_tex = canvas_tex
		this.default_framebuffer = default_framebuffer
		gl = _gl
	}

	reset() {
		this.idx = 0
		this.recorded_drawcalls.length = 0
		// this.recorded_drawcalls = []
		this.brush_buffer.buffs[0].sz = 0
		this.brush_buffer.buffs[1].sz = 0
	}

	fill_buff_for_blob_brush(stroke: BrushStroke) {
		const brush_buffer = this.brush_buffer
		const iters = stroke.positions.length / 2 - 1

		let aspect_correction = [0, 0]
		if (this.canvas_tex.res[0] > this.canvas_tex.res[1]) {
			aspect_correction[0] = this.canvas_tex.res[1] / this.canvas_tex.res[0]
			aspect_correction[1] = 1
		} else {
			aspect_correction[0] = 1
			aspect_correction[1] = this.canvas_tex.res[0] / this.canvas_tex.res[1]
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

		let idx = brush_buffer.buffs[0].sz
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

			// brush_buffer.buffs[0].push_vert([...curr_pos_left, 0, curr_v])
			// brush_buffer.buffs[1].push_vert([...curr_col, curr_opacity])
			brush_buffer.buffs[0].cpu_buff[idx] = curr_pos_left[0]
			brush_buffer.buffs[1].cpu_buff[idx++] = curr_col[0]
			brush_buffer.buffs[0].cpu_buff[idx] = curr_pos_left[1]
			brush_buffer.buffs[1].cpu_buff[idx++] = curr_col[1]
			brush_buffer.buffs[0].cpu_buff[idx] = 0
			brush_buffer.buffs[1].cpu_buff[idx++] = curr_col[2]
			brush_buffer.buffs[0].cpu_buff[idx] = 0
			brush_buffer.buffs[1].cpu_buff[idx++] = curr_opacity

			// brush_buffer.buffs[0].push_vert([...curr_pos_right, 1, curr_v])
			// brush_buffer.buffs[1].push_vert([...curr_col, curr_opacity])
			brush_buffer.buffs[0].cpu_buff[idx] = curr_pos_right[0]
			brush_buffer.buffs[1].cpu_buff[idx++] = curr_col[0]
			brush_buffer.buffs[0].cpu_buff[idx] = curr_pos_right[1]
			brush_buffer.buffs[1].cpu_buff[idx++] = curr_col[1]
			brush_buffer.buffs[0].cpu_buff[idx] = 1
			brush_buffer.buffs[1].cpu_buff[idx++] = curr_col[2]
			brush_buffer.buffs[0].cpu_buff[idx] = 0
			brush_buffer.buffs[1].cpu_buff[idx++] = curr_opacity

			// brush_buffer.buffs[0].push_vert([...next_pos_left, 0, next_v])
			// brush_buffer.buffs[1].push_vert([...curr_col, curr_opacity])
			brush_buffer.buffs[0].cpu_buff[idx] = next_pos_left[0]
			brush_buffer.buffs[1].cpu_buff[idx++] = curr_col[0]
			brush_buffer.buffs[0].cpu_buff[idx] = next_pos_left[1]
			brush_buffer.buffs[1].cpu_buff[idx++] = curr_col[1]
			brush_buffer.buffs[0].cpu_buff[idx] = 0
			brush_buffer.buffs[1].cpu_buff[idx++] = curr_col[2]
			brush_buffer.buffs[0].cpu_buff[idx] = 1
			brush_buffer.buffs[1].cpu_buff[idx++] = curr_opacity

			// brush_buffer.buffs[0].push_vert([...curr_pos_right, 1, curr_v])
			// brush_buffer.buffs[1].push_vert([...curr_col, curr_opacity])
			brush_buffer.buffs[0].cpu_buff[idx] = curr_pos_right[0]
			brush_buffer.buffs[1].cpu_buff[idx++] = curr_col[0]
			brush_buffer.buffs[0].cpu_buff[idx] = curr_pos_right[1]
			brush_buffer.buffs[1].cpu_buff[idx++] = curr_col[1]
			brush_buffer.buffs[0].cpu_buff[idx] = 1
			brush_buffer.buffs[1].cpu_buff[idx++] = curr_col[2]
			brush_buffer.buffs[0].cpu_buff[idx] = 0
			brush_buffer.buffs[1].cpu_buff[idx++] = curr_opacity

			// brush_buffer.buffs[0].push_vert([...next_pos_left, 0, next_v])
			// brush_buffer.buffs[1].push_vert([...curr_col, curr_opacity])
			brush_buffer.buffs[0].cpu_buff[idx] = next_pos_left[0]
			brush_buffer.buffs[1].cpu_buff[idx++] = curr_col[0]
			brush_buffer.buffs[0].cpu_buff[idx] = next_pos_left[1]
			brush_buffer.buffs[1].cpu_buff[idx++] = curr_col[1]
			brush_buffer.buffs[0].cpu_buff[idx] = 0
			brush_buffer.buffs[1].cpu_buff[idx++] = curr_col[2]
			brush_buffer.buffs[0].cpu_buff[idx] = 1
			brush_buffer.buffs[1].cpu_buff[idx++] = curr_opacity

			// brush_buffer.buffs[0].push_vert([...next_pos_right, 1, next_v])
			// brush_buffer.buffs[1].push_vert([...curr_col, curr_opacity])
			brush_buffer.buffs[0].cpu_buff[idx] = next_pos_right[0]
			brush_buffer.buffs[1].cpu_buff[idx++] = curr_col[0]
			brush_buffer.buffs[0].cpu_buff[idx] = next_pos_right[1]
			brush_buffer.buffs[1].cpu_buff[idx++] = curr_col[1]
			brush_buffer.buffs[0].cpu_buff[idx] = 1
			brush_buffer.buffs[1].cpu_buff[idx++] = curr_col[2]
			brush_buffer.buffs[0].cpu_buff[idx] = 1
			brush_buffer.buffs[1].cpu_buff[idx++] = curr_opacity
		}
		brush_buffer.buffs[0].sz += iters * 6 * 4
		brush_buffer.buffs[1].sz += iters * 6 * 4
		this.recorded_drawcalls.push(this.brush_buffer.buffs[0].sz)
	}

	fill_buff_for_long_brush(stroke: BrushStroke) {
		const brush_buffer = this.brush_buffer
		const iters = stroke.positions.length / 2 - 1
		let aspect_correction = [0, 0]
		if (this.canvas_tex.res[0] > this.canvas_tex.res[1]) {
			aspect_correction[0] = this.canvas_tex.res[1] / this.canvas_tex.res[0]
			aspect_correction[1] = 1
		} else {
			aspect_correction[0] = 1
			aspect_correction[1] = this.canvas_tex.res[0] / this.canvas_tex.res[1]
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

		let idx = brush_buffer.buffs[0].sz

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

			// brush_buffer.buffs[0].push_vert([...curr_pos_left, 0, curr_v])
			// brush_buffer.buffs[1].push_vert([...curr_col, curr_opacity])
			brush_buffer.buffs[0].cpu_buff[idx] = curr_pos_left[0]
			brush_buffer.buffs[1].cpu_buff[idx++] = curr_col[0]
			brush_buffer.buffs[0].cpu_buff[idx] = curr_pos_left[1]
			brush_buffer.buffs[1].cpu_buff[idx++] = curr_col[1]
			brush_buffer.buffs[0].cpu_buff[idx] = 0
			brush_buffer.buffs[1].cpu_buff[idx++] = curr_col[2]
			brush_buffer.buffs[0].cpu_buff[idx] = curr_v
			brush_buffer.buffs[1].cpu_buff[idx++] = curr_opacity

			// brush_buffer.buffs[0].push_vert([...curr_pos_right, 1, curr_v])
			// brush_buffer.buffs[1].push_vert([...curr_col, curr_opacity])
			brush_buffer.buffs[0].cpu_buff[idx] = curr_pos_right[0]
			brush_buffer.buffs[1].cpu_buff[idx++] = curr_col[0]
			brush_buffer.buffs[0].cpu_buff[idx] = curr_pos_right[1]
			brush_buffer.buffs[1].cpu_buff[idx++] = curr_col[1]
			brush_buffer.buffs[0].cpu_buff[idx] = 1
			brush_buffer.buffs[1].cpu_buff[idx++] = curr_col[2]
			brush_buffer.buffs[0].cpu_buff[idx] = curr_v
			brush_buffer.buffs[1].cpu_buff[idx++] = curr_opacity

			// brush_buffer.buffs[0].push_vert([...next_pos_left, 0, next_v])
			// brush_buffer.buffs[1].push_vert([...next_col, next_opacity])
			brush_buffer.buffs[0].cpu_buff[idx] = next_pos_left[0]
			brush_buffer.buffs[1].cpu_buff[idx++] = next_col[0]
			brush_buffer.buffs[0].cpu_buff[idx] = next_pos_left[1]
			brush_buffer.buffs[1].cpu_buff[idx++] = next_col[1]
			brush_buffer.buffs[0].cpu_buff[idx] = 0
			brush_buffer.buffs[1].cpu_buff[idx++] = next_col[2]
			brush_buffer.buffs[0].cpu_buff[idx] = next_v
			brush_buffer.buffs[1].cpu_buff[idx++] = next_opacity

			// brush_buffer.buffs[0].push_vert([...curr_pos_right, 1, curr_v])
			// brush_buffer.buffs[1].push_vert([...curr_col, curr_opacity])

			brush_buffer.buffs[0].cpu_buff[idx] = curr_pos_right[0]
			brush_buffer.buffs[1].cpu_buff[idx++] = curr_col[0]
			brush_buffer.buffs[0].cpu_buff[idx] = curr_pos_right[1]
			brush_buffer.buffs[1].cpu_buff[idx++] = curr_col[1]
			brush_buffer.buffs[0].cpu_buff[idx] = 1
			brush_buffer.buffs[1].cpu_buff[idx++] = curr_col[2]
			brush_buffer.buffs[0].cpu_buff[idx] = curr_v
			brush_buffer.buffs[1].cpu_buff[idx++] = curr_opacity

			// brush_buffer.buffs[0].push_vert([...next_pos_left, 0, next_v])
			// brush_buffer.buffs[1].push_vert([...next_col, next_opacity])
			brush_buffer.buffs[0].cpu_buff[idx] = next_pos_left[0]
			brush_buffer.buffs[1].cpu_buff[idx++] = next_col[0]
			brush_buffer.buffs[0].cpu_buff[idx] = next_pos_left[1]
			brush_buffer.buffs[1].cpu_buff[idx++] = next_col[1]
			brush_buffer.buffs[0].cpu_buff[idx] = 0
			brush_buffer.buffs[1].cpu_buff[idx++] = next_col[2]
			brush_buffer.buffs[0].cpu_buff[idx] = next_v
			brush_buffer.buffs[1].cpu_buff[idx++] = next_opacity

			// brush_buffer.buffs[0].push_vert([...next_pos_right, 1, next_v])
			// brush_buffer.buffs[1].push_vert([...next_col, next_opacity])
			brush_buffer.buffs[0].cpu_buff[idx] = next_pos_right[0]
			brush_buffer.buffs[1].cpu_buff[idx++] = next_col[0]
			brush_buffer.buffs[0].cpu_buff[idx] = next_pos_right[1]
			brush_buffer.buffs[1].cpu_buff[idx++] = next_col[1]
			brush_buffer.buffs[0].cpu_buff[idx] = 1
			brush_buffer.buffs[1].cpu_buff[idx++] = next_col[2]
			brush_buffer.buffs[0].cpu_buff[idx] = next_v
			brush_buffer.buffs[1].cpu_buff[idx++] = next_opacity
		}
		brush_buffer.buffs[0].sz += iters * 6 * 4
		brush_buffer.buffs[1].sz += iters * 6 * 4
		this.recorded_drawcalls.push(this.brush_buffer.buffs[0].sz)
	}
	fill_buff_for_triangulated_brush(stroke: BrushStroke) {
		const brush_buffer = this.brush_buffer
		const {colours, opacities, positions} = stroke
		// let positions = [...stroke.positions]
		// const [new_triangles, offs] = get_subarray(this.temp_array_a, 0, positions.length * 3)
		// const [new_cols] = get_subarray(this.temp_array_a, offs, offs + (positions.length / 2) * 3 * 4)
		const iters = positions.length / 2 - 1
		let idx = brush_buffer.buffs[0].sz
		for (let i = 0; i < iters; i++) {
			let u = 0
			let v = 0
			// brush_buffer.buffs[1].push_vert([...curr_col, curr_opacity])

			// new_triangles[i * 3 * 2] = positions[0]
			// new_triangles[i * 3 * 2 + 1] = positions[0 + 1]
			// new_cols[i * 3 * 4] = stroke.colours[0]
			// new_cols[i * 3 * 4 + 1] = stroke.colours[1]
			// new_cols[i * 3 * 4 + 2] = stroke.colours[2]
			// new_cols[i * 3 * 4 + 3] = stroke.opacities[0]
			// brush_buffer.buffs[0].push_vert([positions[0], positions[1], u, v])
			// brush_buffer.buffs[1].push_vert([colours[0], colours[1], colours[2], opacities[1]])
			brush_buffer.buffs[0].cpu_buff[idx] = positions[0]
			brush_buffer.buffs[1].cpu_buff[idx++] = colours[0]
			brush_buffer.buffs[0].cpu_buff[idx] = positions[1]
			brush_buffer.buffs[1].cpu_buff[idx++] = colours[1]
			brush_buffer.buffs[0].cpu_buff[idx] = i / (iters + 1)
			brush_buffer.buffs[1].cpu_buff[idx++] = colours[2]
			brush_buffer.buffs[0].cpu_buff[idx] = 0
			brush_buffer.buffs[1].cpu_buff[idx++] = opacities[1]

			// new_triangles[i * 3 * 2 + 2] = positions[i * 2]
			// new_triangles[i * 3 * 2 + 3] = positions[i * 2 + 1]
			// new_cols[i * 3 * 4 + 4] = stroke.colours[i * 3]
			// new_cols[i * 3 * 4 + 5] = stroke.colours[i * 3 + 1]
			// new_cols[i * 3 * 4 + 6] = stroke.colours[i * 3 + 2]
			// new_cols[i * 3 * 4 + 7] = stroke.opacities[i]
			// brush_buffer.buffs[0].push_vert([positions[i * 2], positions[i * 2 + 1], u, v])
			// brush_buffer.buffs[1].push_vert([colours[i * 3], colours[i * 3 + 1], colours[i * 3 + 2], opacities[i]])

			brush_buffer.buffs[0].cpu_buff[idx] = positions[i * 2]
			brush_buffer.buffs[1].cpu_buff[idx++] = colours[i * 3]
			brush_buffer.buffs[0].cpu_buff[idx] = positions[i * 2 + 1]
			brush_buffer.buffs[1].cpu_buff[idx++] = colours[i * 3 + 1]
			brush_buffer.buffs[0].cpu_buff[idx] = i / (iters + 1)
			brush_buffer.buffs[1].cpu_buff[idx++] = colours[i * 3 + 2]
			brush_buffer.buffs[0].cpu_buff[idx] = 1
			brush_buffer.buffs[1].cpu_buff[idx++] = opacities[i]

			// new_triangles[i * 3 * 2 + 4] = positions[i * 2 + 2]
			// new_triangles[i * 3 * 2 + 5] = positions[i * 2 + 3]
			// new_cols[i * 3 * 4 + 8] = stroke.colours[i * 3 + 3]
			// new_cols[i * 3 * 4 + 9] = stroke.colours[i * 3 + 4]
			// new_cols[i * 3 * 4 + 10] = stroke.colours[i * 3 + 5]
			// new_cols[i * 3 * 4 + 11] = stroke.opacities[i + 1]
			// brush_buffer.buffs[0].push_vert([positions[i * 2 + 2], positions[i * 2 + 3], u, v])
			// brush_buffer.buffs[1].push_vert([colours[i * 3 + 3], colours[i * 3 + 4], colours[i * 3 + 5], opacities[i + 1]])
			brush_buffer.buffs[0].cpu_buff[idx] = positions[i * 2 + 2]
			brush_buffer.buffs[1].cpu_buff[idx++] = colours[i * 3 + 3]
			brush_buffer.buffs[0].cpu_buff[idx] = positions[i * 2 + 3]
			brush_buffer.buffs[1].cpu_buff[idx++] = colours[i * 3 + 4]
			brush_buffer.buffs[0].cpu_buff[idx] = (i + 1) / (iters + 1)
			brush_buffer.buffs[1].cpu_buff[idx++] = colours[i * 3 + 5]
			brush_buffer.buffs[0].cpu_buff[idx] = 1
			brush_buffer.buffs[1].cpu_buff[idx++] = opacities[i + 1]
		}
		brush_buffer.buffs[0].sz += iters * 3 * 4
		brush_buffer.buffs[1].sz += iters * 3 * 4
		// brush_buffer.buffs[0].upload_external_array(new_triangles)
		// brush_buffer.buffs[1].upload_external_array(new_cols)
		this.recorded_drawcalls.push(this.brush_buffer.buffs[0].sz)
	}

	push_any_stroke(stroke: BrushStroke) {
		if (stroke.brush_type === BrushType.Blobs) {
			this.fill_buff_for_blob_brush(stroke)
		} else if (stroke.brush_type === BrushType.Long) {
			this.fill_buff_for_long_brush(stroke)
		} else if (stroke.brush_type === BrushType.Tri) {
			this.fill_buff_for_triangulated_brush(stroke)
		}
	}
	draw_stroke_idx(idx: number) {
		const draw_start = idx === 0 ? 0 : this.recorded_drawcalls[idx - 1]
		const draw_cnt = idx === 0 ? this.recorded_drawcalls[0] : this.recorded_drawcalls[idx] - this.recorded_drawcalls[idx - 1]
		gl.drawArrays(gl.TRIANGLES, draw_start / 4, draw_cnt / 4)
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
