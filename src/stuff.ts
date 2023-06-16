export enum BrushType {
	Blobs,
	Long,
}

export function assert(v: boolean) {
	if (!v) debugger
}

// export class BrushState{
//   pos: number[]
//   constructor(pos)
// }

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
	opacities: number[] = []
	colours: number[] = []

	idx: number = 0
	constructor(brush_type: BrushType, draw_params: DrawParams) {
		this.draw_params = draw_params
		this.brush_type = brush_type
	}
	push_stroke(position: number[], rotation: number[], opacity: number, colour: number[]) {
		// assert(position.length === 2)
		// assert(rotation.length === 2)
		// assert(colour.length === 3)
		const curr_idx = this.idx
		this.positions.length += 2
		this.rotations.length += 2
		this.opacities.length += 1
		this.colours.length += 3
		this.positions[curr_idx * 2] = position[0]
		this.positions[curr_idx * 2 + 1] = position[1]
		this.rotations[curr_idx * 2] = rotation[0]
		this.rotations[curr_idx * 2 + 1] = rotation[1]
		this.opacities[curr_idx] = opacity
		this.colours[curr_idx * 3] = colour[0]
		this.colours[curr_idx * 3 + 1] = colour[1]
		this.colours[curr_idx * 3 + 2] = colour[2]
		this.idx++
	}
}
