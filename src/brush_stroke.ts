import {BrushTexture} from 'stuff'

export enum BlendingColourSpace {
	RGB,
	OkLCH,
	Pigments,
}

export class DrawParams {
	tex_dynamics: number = 0.3
	tex_lch_dynamics: number[] = [0, 0, 0.2]
	tex_stretch: number[] = [1, 0.2]
	tex_distort: number[] = [0, 0]
	tex_distort_amt: number = 0
	tex_grit: number = 0

	blending_colour_space = BlendingColourSpace.Pigments
	constructor(
		tex_dynamics: number,
		tex_lch_dynamics: number[],
		tex_stretch: number[],
		tex_distort: number[],
		tex_distort_amt: number,
		tex_grit: number,
		blending_colour_space: BlendingColourSpace,
	) {
		this.tex_dynamics = tex_dynamics
		this.tex_lch_dynamics = [...tex_lch_dynamics]
		this.tex_stretch = [...tex_stretch]
		this.tex_distort = [...tex_distort]
		this.tex_distort_amt = tex_distort_amt
		this.tex_grit = tex_grit
		this.blending_colour_space = blending_colour_space
	}
}

export class BrushPreset {
	selected_brush_type: BrushType = BrushType.Blobs

	chaos_lch: Array<number> = [0, 0, 1]
	chaos_speed: number = 0.3
	chaos: number = 0.7

	dynamics: number = 0.3
	stroke_opacity_dynamics: number[] = [0, 1]
	stroke_size_dynamics: number[] = [0.7, 1]
	rot_jitter: number = 0
	pos_jitter: number = 0

	// @ts-ignore
	selected_brush_texture: BrushTexture = undefined

	tex_dynamics: number = 0.3
	tex_lch_dynamics: number[] = [0, 0, 0.02]
	// noise_stretch: number[] = [1, 0.2]
	tex_stretch: number[] = [1, 0.2]
	tex_distort: number[] = [0, 0]
	tex_distort_amt: number = 0
	tex_grit: number = 0

	constructor() {}
}

export enum BrushType {
	Blobs,
	Long,
	Tri,
}
export class BrushStroke {
	brush_type: BrushType
	brush_texture: BrushTexture
	draw_params: DrawParams
	positions: number[] = []
	rotations: number[] = []
	sizes: number[] = []
	opacities: number[] = []
	colours: number[] = []

	idx: number = 0
	constructor(brush_type: BrushType, draw_params: DrawParams, brush_texture: BrushTexture) {
		this.draw_params = draw_params
		this.brush_type = brush_type
		this.brush_texture = brush_texture
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
