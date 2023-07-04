import {pause_on_gl_error} from 'gl_utils'
import {log2, min, pow} from 'wmath'
import {Framebuffer} from './Framebuffer'

export class Texture {
	// @ts-ignore
	tex: WebGLTexture
	internal_format: number
	format: number
	type: number
	res: Array<number>

	private is_float: boolean
	mipmapped: boolean
	private mip_levels: number

	constructor(res: number[], internal_format: number = gl.RGBA, mipmapped = false, mip_levels: number = 0) {
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
		this.res = [...res]
		this.internal_format = internal_format

		this.mipmapped = mipmapped
		this.mip_levels = mip_levels

		this.is_float = eq_any(internal_format, [gl.RGBA32F, gl.RGBA16F, gl.RGB16F, gl.RGB32F])

		let comp_cnt = 4
		if (eq_any(internal_format, [gl.RGBA32F, gl.RGBA16F, gl.RGBA, gl.RGBA16I, gl.RGBA16UI, gl.RGBA32I, gl.RGBA8I, gl.RGBA8UI])) {
			comp_cnt = 4
		}
		if (eq_any(internal_format, [gl.RGB32F, gl.RGB16F, gl.RGB, gl.RGB16I, gl.RGB16UI, gl.RGB32I, gl.RGB8I, gl.RGB8UI])) {
			comp_cnt = 3
		}

		this.format = comp_cnt === 4 ? gl.RGBA : gl.RGB
		this.type = this.is_float ? gl.FLOAT : gl.UNSIGNED_BYTE

		if (eq_any(internal_format, [gl.RGBA8UI, gl.RGBA16UI, gl.RGBA32UI, gl.RGB8UI, gl.RGB16UI, gl.RGB32UI])) {
			this.type = gl.UNSIGNED_INT
		}
		if (eq_any(internal_format, [gl.RGBA8I, gl.RGBA16I, gl.RGBA32I, gl.RGB8I, gl.RGB16I, gl.RGB32I])) {
			this.type = gl.INT
		}
		this.recreate()
	}
	recreate() {
		// @ts-ignore
		this.tex = gl.createTexture()

		gl.bindTexture(gl.TEXTURE_2D, this.tex)

		if (this.is_float) {
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
		} else {
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
		}
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)

		if (this.mipmapped) {
			if (this.mip_levels === 0) {
				if (this.res[0] > 4 && this.res[1] > 4) {
					gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR)
					gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
					gl.texStorage2D(gl.TEXTURE_2D, log2(min(this.res[0], this.res[1])), this.internal_format, this.res[0], this.res[1])
				} else {
					gl.texImage2D(gl.TEXTURE_2D, 0, this.internal_format, this.res[0], this.res[1], 0, this.format, this.type, null)
				}
			}
			pause_on_gl_error()
		} else {
			gl.texImage2D(gl.TEXTURE_2D, 0, this.internal_format, this.res[0], this.res[1], 0, this.format, this.type, null)
		}
		// console.log(gl.isTexture(this.tex))

		if (!gl.isTexture(this.tex)) {
			console.error('TEXTURE INCOMPLETE')
		}
	}

	resize(new_res: number[]) {
		this.res = [...new_res]
		if (this.mipmapped) {
			gl.deleteTexture(this.tex)
			this.recreate()
		} else {
			gl.activeTexture(gl.TEXTURE15)
			gl.bindTexture(gl.TEXTURE_2D, this.tex)
			gl.texImage2D(gl.TEXTURE_2D, 0, this.internal_format, this.res[0], this.res[1], 0, this.format, this.type, null)
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
		const tex = new Texture([img.naturalWidth, img.naturalHeight], gl.RGBA8, true, 0)
		// tex.upload_from_cpu(img)
		// gl.getTexParameter(gl.TEXTURE_2D, gl.TYPE)
		gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, tex.res[0], tex.res[1], tex.format, tex.type, img)
		gl.generateMipmap(gl.TEXTURE_2D)
		pause_on_gl_error()
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
		return new Texture(this.res, this.internal_format, this.mipmapped, this.mip_levels)
	}
	bind_to_unit(unit: number) {
		gl.activeTexture(gl.TEXTURE0 + unit)
		gl.bindTexture(gl.TEXTURE_2D, this.tex)
	}

	read_back_array(offs: number[] = [0, 0], read_back_res: number[] = [...this.res]): Uint8Array | Float32Array {
		let temp_fb = gl.createFramebuffer() as WebGLFramebuffer
		let prev_bound_fb = Framebuffer.currently_bound
		gl.bindFramebuffer(gl.FRAMEBUFFER, temp_fb)
		gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.tex, 0)

		// const data = new Uint8Array(this.res[0] * this.res[1] * 4)

		const data = this.is_float
			? new Float32Array(read_back_res[0] * read_back_res[1] * 4)
			: new Uint8Array(read_back_res[0] * read_back_res[1] * 4)
		gl.readPixels(offs[0], offs[1], read_back_res[0], read_back_res[1], this.format, this.type, data)
		// console.log(data)
		gl.deleteFramebuffer(temp_fb)
		gl.bindFramebuffer(gl.FRAMEBUFFER, prev_bound_fb.fb)
		return data
	}
	read_back_pixel(offs: number[]): Array<number> {
		let data = this.read_back_array(offs, [1, 1])
		if (this.is_float) {
			data.forEach((e, i, a) => {
				a[i] *= 255
			})
		}
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
		let data_reflected: Float32Array | Uint8Array = new Float32Array(data.length)

		let i = 0
		let idx = 0
		for (let pixel of data) {
			if (i === 3) {
				if (this.is_float) {
					data[idx] = 255
				} else {
					data[idx] = 255
				}
				i = -1
			} else {
				if (gamma_correct) {
					if (this.is_float) {
						data[idx] = 255 * pow(data[idx], 0.4545454545)
					} else {
						data[idx] = 255 * pow(data[idx] / 255, 0.4545454545)
					}
				}
				// data[idx] *= 240
			}
			idx++
			i++
		}

		for (let y = 0; y < read_back_res[1]; y++) {
			for (let x = 0; x < read_back_res[0]; x++) {
				const idx = y * read_back_res[0] * 4 + x * 4
				const idx_refl = (read_back_res[1] - y - 1) * read_back_res[0] * 4 + x * 4
				data_reflected[idx + 0] = data[idx_refl]
				data_reflected[idx + 1] = data[idx_refl + 1]
				data_reflected[idx + 2] = data[idx_refl + 2]
				data_reflected[idx + 3] = data[idx_refl + 3]
			}
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

		const imageData = context.createImageData(canvas.width, canvas.height)
		imageData.data.set(data_reflected)
		context.putImageData(imageData, 0, 0)
		const img = new Image()
		img.src = canvas.toDataURL()

		canvas.remove()
		// @ts-ignore
		return [img, blob]
	}
}
