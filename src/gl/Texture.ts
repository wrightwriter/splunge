import {pow} from 'wmath'
import {Framebuffer} from './Framebuffer'

export class Texture {
	tex: WebGLTexture
	internal_format: number
	format: number
	type: number
	res: Array<number>

	constructor(res: number[], internal_format: number = gl.RGBA) {
		const eq_any = (a: any, b: any[]): boolean => {
			let eq = false
			b.forEach((b) => {
				if (b === a) {
					eq = true
					// return eq
				}
			})
			return eq
		}
		// @ts-ignore
		this.tex = gl.createTexture()
		this.res = [...res]
		this.internal_format = internal_format

		const is_float = eq_any(internal_format, [gl.RGBA32F, gl.RGBA16F, gl.RGB16F, gl.RGB32F])

		let comp_cnt = 4
		if (eq_any(internal_format, [gl.RGBA32F, gl.RGBA16F, gl.RGBA, gl.RGBA16I, gl.RGBA16UI, gl.RGBA32I])) {
			comp_cnt = 4
		}
		if (eq_any(internal_format, [gl.RGB32F, gl.RGB16F, gl.RGB, gl.RGB16I, gl.RGB16UI, gl.RGB32I])) {
			comp_cnt = 3
		}

		this.format = comp_cnt === 4 ? gl.RGBA : gl.RGB
		this.type = is_float ? gl.FLOAT : gl.UNSIGNED_BYTE

		gl.bindTexture(gl.TEXTURE_2D, this.tex)

		gl.texImage2D(gl.TEXTURE_2D, 0, internal_format, res[0], res[1], 0, this.format, this.type, null)

		if (is_float) {
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
		} else {
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
		}
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)

		// console.log(gl.isTexture(this.tex))

		if (!gl.isTexture(this.tex)) {
			console.error('TEXTURE INCOMPLETE')
		}
	}
	static async from_image_path(img_path: string): Promise<Texture> {
		function loadImage(url: string): Promise<HTMLImageElement> {
			return new Promise((resolve) => {
				const image = new Image()
				image.addEventListener('load', () => {
					resolve(image)
				})
				image.src = url
			})
		}

		const img = await loadImage(img_path)
		const tex = new Texture([img.naturalWidth, img.naturalHeight])
		tex.upload_from_cpu(img)
		// Not needed?
		gl.finish()
		img.remove()
		return tex
	}

	upload_from_cpu(image: HTMLImageElement | number[] | Float32Array) {
		if (image instanceof HTMLImageElement) {
			gl.texImage2D(gl.TEXTURE_2D, 0, this.internal_format, this.res[0], this.res[1], 0, this.format, this.type, image)
		} else {
			debugger
		}
	}

	clone(): Texture {
		return new Texture(this.res, this.internal_format)
	}
	bind_to_unit(unit: number) {
		gl.activeTexture(gl.TEXTURE0 + unit)
		gl.bindTexture(gl.TEXTURE_2D, this.tex)
	}

	read_back_array(offs: number[] = [0, 0], read_back_res: number[] = [...this.res]): Uint8Array {
		let temp_fb = gl.createFramebuffer() as WebGLFramebuffer
		let prev_bound_fb = Framebuffer.currently_bound
		gl.bindFramebuffer(gl.FRAMEBUFFER, temp_fb)
		gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.tex, 0)

		// const data = new Uint8Array(this.res[0] * this.res[1] * 4)
		const data = new Uint8Array(read_back_res[0] * read_back_res[1] * 4)
		gl.readPixels(offs[0], offs[1], read_back_res[0], read_back_res[1], this.format, this.type, data)
		// console.log(data)
		gl.deleteFramebuffer(temp_fb)
		gl.bindFramebuffer(gl.FRAMEBUFFER, prev_bound_fb.fb)
		return data
	}
	read_back_pixel(offs: number[]): Array<number> {
		let data = this.read_back_array(offs, [1, 1])
		data[3] = 255
		// @ts-ignore
		return Array.from(data)
	}
	async read_back_image(
		gamma_correct: boolean = false,
		offs: number[] = [0, 0],
		read_back_res: number[] = [...this.res],
	): Promise<[HTMLImageElement, Blob]> {
		let data = this.read_back_array(offs, read_back_res)

		let i = 0
		let idx = 0
		for (let pixel of data) {
			if (i === 3) {
				data[idx] = 255
				i = -1
			} else {
				if (gamma_correct) {
					data[idx] = 255 * pow(data[idx] / 255, 0.4545454545)
				}
				// data[idx] *= 240
			}
			idx++
			i++
		}

		// Create a 2D canvas to store the result
		const canvas = document.createElement('canvas')
		canvas.width = this.res[0]
		canvas.height = this.res[1]
		const context = canvas.getContext('2d') as CanvasRenderingContext2D

		let blob: Blob

		const getCanvasBlob = (canvas: HTMLCanvasElement): Promise<Blob> => {
			return new Promise(function (resolve, reject) {
				canvas.toBlob(function (blob) {
					// @ts-ignore
					resolve(blob)
				}, 'image/png')
			})
		}

		blob = await getCanvasBlob(canvas)
		console.log('BLORGUBS')
		console.log(blob)

		// canvas.toBlob((b) => {
		// 	blob = b as Blob
		// 	console.log('BLOB A')
		// 	console.log(blob)
		// }, 'image/png')

		// console.log('BLOB B')
		// console.log(blob)

		const imageData = context.createImageData(canvas.width, canvas.height)
		imageData.data.set(data)
		context.putImageData(imageData, 0, 0)
		const img = new Image()
		img.src = canvas.toDataURL()

		canvas.remove()
		// @ts-ignore
		return [img, blob]
	}
}
