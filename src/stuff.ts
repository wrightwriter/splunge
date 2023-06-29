import {BrushStroke} from 'brush_stroke'
import {Texture} from 'gl/Texture'
import {pow} from 'wmath'

export function assert(v: boolean) {
	if (!v) debugger
}

export class BrushTexture {
	// @ts-ignore
	gpu_tex: Texture = undefined
	// @ts-ignore
	path: string = undefined
	// @ts-ignore
	idx: number

	static async create(path, idx: number): Promise<BrushTexture> {
		let gpu_tex = await Texture.from_image_path(path)

		return {
			gpu_tex,
			path,
			idx,
		}
	}
}

export class Project {
	id: number = Date.now()
	saved: boolean = false
	brush_strokes: BrushStroke[] = []
	canvasRes: number[] = [1024, 2048]
	// canvasRes: number[] = [2048, 1024]
	constructor() {}
	push_stroke(stroke: BrushStroke) {
		this.brush_strokes.push(stroke)
	}
}

export class Utils {
	static isOnMobile = (): boolean => {
		let check = false
		;(function (a) {
			if (
				/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(
					a,
				) ||
				/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(
					a.substr(0, 4),
				)
			)
				check = true
			// @ts-ignore
		})(navigator.userAgent || navigator.vendor || window.opera)
		return check
	}
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
			u[1] /= ratio * zoom

			let cont = Utils.css_contain([1, 1], user_res, canvas_res)

			u[0] -= pan[0] * cont[0]
			u[1] -= pan[1] * cont[1]
		}
		return u
	}
	static texture_NDC_to_texture_pixel_coords(u: number[], tex: Texture): number[] {
		return [(u[0] * 0.5 + 0.5) * tex.res[0], (u[1] * 0.5 + 0.5) * tex.res[1]]
	}
}