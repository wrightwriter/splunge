import {Float16, ifExistsAElseB, loop} from './utils'
import {BindGroup} from './wbindgroup'
import {FrameBuffer} from './wframebuffer'

export class Texture {
	static textures: Texture[] = []

	public bind_groups: BindGroup[] = []

	public attachedFramebuffers: FrameBuffer[] = []
	public texture: GPUTexture
	public view: GPUTextureView
	public width: number
	public height: number
	public depth: number

	public res: number[] = []

	public type: GPUTextureSampleType
	public internal_type: GPUTextureSampleType

	public props: {
		depthTex: boolean
		usage: GPUTextureUsage
		format: GPUTextureFormat
		mipmapped: boolean
		label?: string
	}

	public clone(): Texture {
		let props = {...this.props}
		props.label += '_clone'
		return new Texture(props)
	}

	private create() {
		this.res[0] = this.width
		this.res[1] = this.height
		const props = this.props
		const textureDescriptor: GPUTextureDescriptor = {
			size: [this.width, this.height],
			// @ts-ignore
			// dimension: args.depth > 1 ? "3d" : "2d",
			// format: args.depthTex ? "depth24plus-stencil8" : "rgba32float",
			// format: props.depthTex ? "depth24plus" : "rgba32float",
			format: props.format,
			label: props.label,
			// @ts-ignore
			usage: props.usage,
		}
		const getNumMipLevels = () => {
			const maxSize = Math.max(this.width, this.height)
			return (1 + Math.log2(maxSize)) | 0
		}
		if (props.mipmapped) {
			const mip_levels = getNumMipLevels()
			textureDescriptor.mipLevelCount = mip_levels
		}

		const tex = wgpu.device.createTexture(textureDescriptor)
		const texView = tex.createView()

		this.texture = tex
		this.view = texView

		if (this.props.mipmapped) wgpu.mipmapper.generateMips(this)
	}
	// static fromArray({data}:{data: Vector4[][]}): Texture{
	//   let canvas = document.createElement("canvas")
	//   canvas.width = data[0].length
	//   canvas.height = data.length
	//   document.body.appendChild(canvas)

	//   canvas.style.opacity = "0"

	//   const imageData = canvas.getContext("2d").createImageData(canvas.width, canvas.height)

	//   loop(imageData.height, y=>{
	//     loop(imageData.width, x=>{
	//       const index = (x + y * imageData.width);
	//       const inputPix = data[y][x]
	//       imageData.data[index * 4 + 0] = inputPix.x * 255
	//       imageData.data[index * 4 + 1] = inputPix.y * 255
	//       imageData.data[index * 4 + 2] = inputPix.z * 255
	//       imageData.data[index * 4 + 3] = inputPix.w * 255
	//     })
	//   })

	//   canvas.getContext("2d").putImageData(imageData,0,0)

	//   const tex = new Texture({
	//     width: canvas.width,
	//     height: canvas.height,
	//     format: "rgba8unorm"
	//   })

	//   Sketch.wgpu.device.queue.copyExternalImageToTexture(
	//     {source:canvas},
	//     {texture: tex.texture} ,
	//     [canvas.width, canvas.height]
	//   )

	//   document.body.removeChild(canvas)
	//   canvas = null

	//   return tex
	// }
	// 🔧
	constructor(args: {
		width?: number
		height?: number
		depth?: number
		depthTex?: boolean
		usage?: GPUTextureUsage | number
		framebuffer?: FrameBuffer
		format?: GPUTextureFormat
		mipmapped?: boolean
		label?: string
	}) {
		args.width = args.width ?? wgpu.width
		args.height = args.height ?? wgpu.height
		args.depth = args.depth ?? 1
		args.mipmapped = args.mipmapped ?? false

		const depthTexUsage = GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING
		args.format = ifExistsAElseB(args.format, args.depthTex ? 'depth24plus' : 'rgba16float')
		let texUsage =
			GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.COPY_SRC
		if (
			args.format === 'rg16float' ||
			args.format === 'r16float' ||
			args.format === 'r16uint' ||
			args.format === 'bgra8unorm-srgb' ||
			args.format === 'rgba8unorm-srgb' ||
			args.format === 'rg8sint' ||
			args.format === 'rg8uint' ||
			args.format === 'rg8snorm' ||
			args.format === 'rg8unorm' ||
			args.format === 'r8sint' ||
			args.format === 'r8uint' ||
			args.format === 'r8snorm' ||
			args.format === 'r8unorm'
		) {
		} else {
			texUsage = texUsage | GPUTextureUsage.STORAGE_BINDING
		}
		args.usage = ifExistsAElseB(
			args.usage,
			args.depthTex ? depthTexUsage : texUsage, // ?

			// GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC :
			// GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST  // ?
		)

		// | "float"
		// | "unfilterable-float"
		// | "depth"
		// | "sint"
		// | "uint";

		if (args.framebuffer) this.attachedFramebuffers.push(args.framebuffer)

		this.width = args.width
		this.height = args.height
		this.depth = args.depth
		// @ts-ignore

		this.props = JSON.parse(JSON.stringify(args)) // TODO: copy???

		if (args.format.match('snorm') || args.format.match('unorm') || args.format.match('float')) {
			this.type = 'float'
			this.internal_type = 'float'
			if (args.format.match('snorm') || args.format.match('unorm')) {
				this.internal_type = 'float'
			}
		} else if (args.format.match('uint')) {
			this.type = 'uint'
			this.internal_type = 'uint'
		} else if (args.format.match('sint')) {
			this.type = 'sint'
			this.internal_type = 'sint'
		} else {
			this.type = 'depth'
			this.internal_type = 'depth'
		}

		this.create()
		if (this.props.mipmapped) wgpu.mipmapper.generateMips(this)

		Texture.textures.push(this)
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
		const imageBitmap = await createImageBitmap(img)

		const tex = new Texture({
			format: 'rgba8unorm',
			usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT,
			width: imageBitmap.width,
			height: imageBitmap.height,
			mipmapped: true,
			label: img_path,
		})

		wgpu.queue.copyExternalImageToTexture({source: imageBitmap, flipY: false}, tex, [tex.width, tex.height])

		if (tex.props.mipmapped) wgpu.mipmapper.generateMips(tex)
		// const tex = new Texture([img.naturalWidth, img.naturalHeight], gl.RGBA8, true, 0)
		// tex.upload_from_cpu(img)
		// gl.getTexParameter(gl.TEXTURE_2D, gl.TYPE)
		// gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, tex.res[0], tex.res[1], tex.format, tex.type, img)
		// gl.generateMipmap(gl.TEXTURE_2D)
		// pause_on_gl_error()
		// Not needed?
		// gl.finish()
		img.remove()
		return tex
	}

	private getRowPadding(width: number): number {
		// It is a webgpu requirement that BufferCopyView.layout.bytes_per_row % COPY_BYTES_PER_ROW_ALIGNMENT(256) == 0
		// So we calculate padded_bytes_per_row by rounding unpadded_bytes_per_row
		// up to the next multiple of COPY_BYTES_PER_ROW_ALIGNMENT.
		// https://en.wikipedia.org/wiki/Data_structure_alignment#Computing_padding
		const bytesPerPixel = 4 * 4
		const unpaddedBytesPerRow = width * bytesPerPixel
		const align = 256
		const paddedBytesPerRowPadding = (align - (unpaddedBytesPerRow % align)) % align
		const paddedBytesPerRow = unpaddedBytesPerRow + paddedBytesPerRowPadding

		return paddedBytesPerRow
	}
	async read_back_array(
		offs: number[] = [0, 0],
		read_back_res: number[] = [this.width, this.height],
	): Promise<Uint8Array | Float32Array | Uint16Array> {
		let padded = this.getRowPadding(this.width)
		// padded = this.width * 4 * 4
		// let pad_fr = 256 - padded % 256
		// padded += pad_fr

		const buff_sz = this.height * padded
		const buff = wgpu.device.createBuffer({
			usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST,
			size: buff_sz,
		})
		const comm = wgpu.device.createCommandEncoder()
		comm.copyTextureToBuffer(
			{texture: this.texture},
			{
				buffer: buff,
				bytesPerRow: padded,
				rowsPerImage: this.height,
			},
			{
				width: this.width,
				height: this.height,
			},
		)
		wgpu.queue.submit([comm.finish()])
		await buff.mapAsync(GPUMapMode.READ)

		const mapped_buff = buff.getMappedRange(0, buff_sz)
		const mapped_buff_bits = new Uint16Array(mapped_buff.slice(0))
		const bbbbbb = new Uint16Array(this.width * this.height * 4)

		// const arr = new Uint16Array(mapped_buff_bits.length)
		// for (let i = 0; i < arr.length; i++) {
		// 	if (i % 4 === 3) {=
		// 		arr[i] = 1
		// 	} else {
		// 		arr[i] = Float16.uncached_fromBits(mapped_buff_bits[i])
		// 	}
		// }

		for (let y = 0; y < this.height; y++) {
			const offs = (y * padded) / 2
			const y_offs = (this.height - 1 - y) * this.width * 4
			for (let x = 0; x < this.width * 4; x++) {
				// const idx = offs + x
				// const idx_refl = (read_back_res[1] - y - 1) * read_back_res[0] * 4 + x * 4
				// const idx_refl = this.width - 1 - x
				// const idx_refl = x
				bbbbbb[y_offs + x] =
					mapped_buff_bits[
						// x + y * (padded + pad_fr)
						x + offs
					]
			}
		}

		// for (let y = 0; y < read_back_res[1]; y++) {
		// 	for (let x = 0; x < read_back_res[0]; x++) {
		// 		const idx = y * read_back_res[0] * 4 + x * 4
		// 		const idx_refl = (read_back_res[1] - y - 1) * read_back_res[0] * 4 + x * 4
		// 		data_reflected[idx + 0] = data[idx_refl]
		// 		data_reflected[idx + 1] = data[idx_refl + 1]
		// 		data_reflected[idx + 2] = data[idx_refl + 2]
		// 		data_reflected[idx + 3] = data[idx_refl + 3]
		// 	}
		// }

		let data_b = new Float32Array(this.width * this.height * 4)

		for (let y = 0; y < this.height; y++) {
			for (let x = 0; x < this.width; x++) {
				const idx = y * this.width * 4 + x * 4
				const a = Float16.uncached_fromBits(bbbbbb[idx + 0])
				const b = Float16.uncached_fromBits(bbbbbb[idx + 1])
				const c = Float16.uncached_fromBits(bbbbbb[idx + 2])
				// const d =

				data_b[idx + 0] = Math.pow(a, 0.454545454545) * 255
				data_b[idx + 1] = Math.pow(b, 0.454545454545) * 255
				data_b[idx + 2] = Math.pow(c, 0.454545454545) * 255
				data_b[idx + 3] = 255
			}
		}

		buff.unmap()
		buff.destroy()
		return data_b
	}
	async read_back_pixel(offs: number[]): Promise<Array<number>> {
		// if(offs)
		offs[0] = Math.floor(offs[0])
		offs[1] = Math.floor(offs[1])

		if (offs[0] < 0 || offs[0] > this.width - 1 || offs[1] < 0 || offs[1] > this.height - 1) {
			return [0, 0, 0, 0]
		}
		const buff = wgpu.device.createBuffer({
			usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST,
			size: 4 * 4,
		})
		const comm = wgpu.device.createCommandEncoder()
		comm.copyTextureToBuffer(
			{
				texture: this.texture,
				origin: [offs[0], offs[1], 0],
			},
			{
				buffer: buff,
				offset: 0,
			},
			{
				width: 1,
				height: 1,
			},
		)
		wgpu.queue.submit([comm.finish()])
		await buff.mapAsync(GPUMapMode.READ)

		const mapped_buff = buff.getMappedRange(0, 4 * 4)
		const data = new Int16Array(mapped_buff.slice(0))
		const datab = new Float32Array(4)

		datab[0] = Float16.uncached_fromBits(data[0])
		datab[1] = Float16.uncached_fromBits(data[1])
		datab[2] = Float16.uncached_fromBits(data[2])
		datab[3] = 1
		datab[0] = Math.pow(datab[0], 0.454545454545)
		datab[1] = Math.pow(datab[1], 0.454545454545)
		datab[2] = Math.pow(datab[2], 0.454545454545)
		// datab[2] = data[0]

		// if (this.type === 'float') {
		// data.forEach((e, i, a) => {
		// 	a[i] *= 100
		// })
		// // }
		// data[3] = 255
		// data[0]
		return Array.from(datab)
	}

	async read_back_image(
		gamma_correct: boolean = false,
		offs: number[] = [0, 0],
		read_back_res: number[] = [this.width, this.height],
	): Promise<[HTMLImageElement, Blob]> {
		let data = await this.read_back_array(offs, read_back_res)

		// for (let y = 0; y < read_back_res[1]; y++) {
		// 	for (let x = 0; x < read_back_res[0]; x++) {
		// 		const idx = y * read_back_res[0] * 4 + x * 4
		// 		const idx_refl = (read_back_res[1] - y - 1) * read_back_res[0] * 4 + x * 4
		// 		data_reflected[idx + 0] = data[idx_refl]
		// 		data_reflected[idx + 1] = data[idx_refl + 1]
		// 		data_reflected[idx + 2] = data[idx_refl + 2]
		// 		data_reflected[idx + 3] = data[idx_refl + 3]
		// 	}
		// }
		// data = data_reflected

		// Create a 2D canvas to store the result
		const canvas = document.createElement('canvas')
		canvas.width = this.width
		canvas.height = this.height
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
		// imageData.data.set(data_reflected)
		imageData.data.set(data)
		context.putImageData(imageData, 0, 0)
		const img = new Image()
		img.src = canvas.toDataURL()

		canvas.remove()
		// @ts-ignore
		return [img, blob]
	}
	async read_back_image_b(
		gamma_correct: boolean = false,
		offs: number[] = [0, 0],
		read_back_res: number[] = [this.width, this.height],
	): Promise<[HTMLImageElement, Blob]> {
		let data = await this.read_back_array(offs, read_back_res)

		let padded = this.getRowPadding(this.width)

		let data_b = new Float32Array(this.width * this.height * 4)

		for (let y = 0; y < this.height; y++) {
			for (let x = 0; x < this.width * 4; x++) {
				data_b[y * this.width * 4 + x] =
					data[
						// x + y * (padded + pad_fr)
						x + y * (padded / 4)
					]
			}
		}
		data = data_b

		// let data_reflected: Float32Array | Uint8Array = new Float32Array(data.length)

		// for (let y = 0; y < read_back_res[1]; y++) {
		// 	for (let x = 0; x < read_back_res[0]; x++) {
		// 		const idx = y * read_back_res[0] * 4 + x * 4
		// 		const idx_refl = (read_back_res[1] - y - 1) * read_back_res[0] * 4 + x * 4
		// 		data_reflected[idx + 0] = data[idx_refl]
		// 		data_reflected[idx + 1] = data[idx_refl + 1]
		// 		data_reflected[idx + 2] = data[idx_refl + 2]
		// 		data_reflected[idx + 3] = data[idx_refl + 3]
		// 	}
		// }
		// data = data_reflected

		// let i = 0
		// let idx = 0
		// for (let pixel of data) {
		// 	if (i === 3) {
		// 		data[idx] = 255
		// 		i = -1
		// 	} else {
		// 		// data[idx] *= 255
		// 		// data[idx] *= 100
		// 	}
		// 	data[idx] *= 255
		// 	// if (i === 3) {
		// 	// 	if (this.type === 'float') {
		// 	// 		data[idx] = 255
		// 	// 	} else {
		// 	// 		data[idx] = 255
		// 	// 	}
		// 	// 	i = -1
		// 	// } else {
		// 	// 	// data[idx] *= 250
		// 	// 	if (gamma_correct) {
		// 	// 		if (this.type === 'float') {
		// 	// 			data[idx] = 255 * Math.pow(data[idx], 0.4545454545)
		// 	// 		} else {
		// 	// 			data[idx] = 255 * Math.pow(data[idx] / 255, 0.4545454545)
		// 	// 		}
		// 	// 	}
		// 	// 	// data[idx] *= 240
		// 	// }
		// 	idx++
		// 	i++
		// }

		// Create a 2D canvas to store the result
		const canvas = document.createElement('canvas')
		canvas.width = this.width
		canvas.height = this.height
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
		// imageData.data.set(data_reflected)
		imageData.data.set(data)
		context.putImageData(imageData, 0, 0)
		const img = new Image()
		img.src = canvas.toDataURL()

		canvas.remove()
		// @ts-ignore
		return [img, blob]
	}
	// 🔳
	clear(colour: number[] = [0, 0, 0, 0]) {
		const passDescriptor: GPURenderPassDescriptor = {
			colorAttachments: [
				{
					view: this.view,
					clearValue: {r: colour[0], g: colour[1], b: colour[2], a: colour[3]},
					loadOp: 'clear',
					storeOp: 'store',
				},
			],
		}

		// const commandEncoder = wgpu.device.createCommandEncoder()
		const passEncoder = wgpu.currPass.commandEncoder.beginRenderPass(passDescriptor)
		passEncoder.end()
	}

	// ↖
	resize(size: number[]) {
		const width = size[0]
		const height = size[1]
		this.res[0] = this.width = width
		this.res[1] = this.height = height
		// this.depth = ifExistsAElseB(depth, this.depth)

		// @ts-ignore
		if (this.defaultTex) {
			const defaultTex = wgpu.context.getCurrentTexture()
			const defaultTexView = defaultTex.createView()
			this.texture = defaultTex
			this.view = defaultTexView
		} else {
			this.texture.destroy()
			this.create()
		}
		for (let framebuffer of this.attachedFramebuffers) {
			framebuffer.refresh()
		}
	}
}
