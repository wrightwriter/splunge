import {Texture} from 'gl_utils'
import {pow} from 'wmath'

export enum BrushType {
	Blobs,
	Long,
	Tri,
}

export function assert(v: boolean) {
	if (!v) debugger
}

export class Utils {
	static gamma_correct(u: number[], inverse: boolean = false, modify: boolean = false) {
		const exponent = inverse ? 1 / 0.45454545454545 : 0.45454545454545
		if (!modify) u = [...u]
		u.forEach((v, i, a) => {
			a[i] = pow(v, exponent)
		})
		return u
	}
	static css_contain(u: number[], input_res: number[], tex_res: number[]): number[] {
		let user_res = input_res
		let canvas_res = tex_res

		let input_ratio = user_res[0] / user_res[1]
		let tex_ratio = canvas_res[0] / canvas_res[1]
		let ratio = input_ratio / tex_ratio

		if (ratio > 1) {
			return [u[0] * ratio, u[1]]
		} else {
			return [u[0], u[1] / ratio]
		}
	}
	static screen_NDC_to_canvas_NDC(u: number[], user_tex: Texture, canvas_tex: Texture, zoom: number, pan: number[]): number[] {
		let user_res = user_tex.res
		let canvas_res = canvas_tex.res

		u = [...u]

		let input_ratio = user_res[0] / user_res[1]
		let tex_ratio = canvas_res[0] / canvas_res[1]
		let ratio = input_ratio / tex_ratio

		if (ratio > 1) {
			u[0] *= ratio / zoom
			u[1] /= zoom

			let cont = Utils.css_contain([1, 1], user_res, canvas_res)

			u[0] -= pan[0] * cont[0]
			u[1] -= pan[1] * cont[1]
		} else {
			// u[1] -= (1 - ratio) * 0.5
			u[0] /= zoom
			u[1] /= ratio / zoom
		}
		return u
	}
	static texture_NDC_to_texture_pixel_coords(u: number[], tex: Texture): number[] {
		return [(u[0] * 0.5 + 0.5) * tex.res[0], (u[1] * 0.5 + 0.5) * tex.res[1]]
	}
}

export class DrawParams {
	tex_dynamics: number = 0.3
	tex_lch_dynamics: number[] = [0, 0, 0.2]
	tex_stretch: number[] = [1, 0.2]
	constructor(tex_dynamics: number, tex_lch_dynamics: number[], tex_stretch: number[]) {
		this.tex_dynamics = tex_dynamics
		this.tex_lch_dynamics = [...tex_lch_dynamics]
		this.tex_stretch = [...tex_stretch]
	}
}

export class Project {
	id: number = Date.now()
	saved: boolean = false
	brush_strokes: BrushStroke[] = []
	constructor() {}
	push_stroke(stroke: BrushStroke) {
		this.brush_strokes.push(stroke)
	}
}
export class BrushStroke {
	brush_type: BrushType
	draw_params: DrawParams
	positions: number[] = []
	rotations: number[] = []
	sizes: number[] = []
	opacities: number[] = []
	colours: number[] = []

	idx: number = 0
	constructor(brush_type: BrushType, draw_params: DrawParams) {
		this.draw_params = draw_params
		this.brush_type = brush_type
	}
	push_stroke(position: number[], rotation: number[], size: number[], opacity: number, colour: number[]) {
		// assert(position.length === 2)
		// assert(rotation.length === 2)
		// assert(colour.length === 3)
		const curr_idx = this.idx
		this.positions.length += 2
		this.rotations.length += 2
		this.sizes.length += 2
		this.opacities.length += 1
		this.colours.length += 3
		this.positions[curr_idx * 2] = position[0]
		this.positions[curr_idx * 2 + 1] = position[1]
		this.sizes[curr_idx * 2] = size[0]
		this.sizes[curr_idx * 2 + 1] = size[1]
		this.rotations[curr_idx * 2] = rotation[0]
		this.rotations[curr_idx * 2 + 1] = rotation[1]
		this.opacities[curr_idx] = opacity
		this.colours[curr_idx * 3] = colour[0]
		this.colours[curr_idx * 3 + 1] = colour[1]
		this.colours[curr_idx * 3 + 2] = colour[2]
		this.idx++
	}
}
