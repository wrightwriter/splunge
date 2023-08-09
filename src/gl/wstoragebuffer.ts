import {ifExistsAElseB, loop} from './utils'

export class StorageBuffer {
	public _buff: GPUBuffer
	protected type: GPUBufferBindingType
	public mappedArr?: Float32Array | Int32Array
	public hasDynamicOffset: boolean = false
	protected totalFloatSz: number = 0
	sz: number = 0
	offs: number = 0

	public get buff(): GPUBuffer {
		return this._buff
	}

	public create(
		size: number = 1400,
		usage: number = GPUBufferUsage.COPY_DST | GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
		array?: Float32Array | Int32Array,
		mapped = false,
		uniform = false,
	): StorageBuffer {
		this.type = uniform ? 'uniform' : 'storage'

		// if(mapped || array){
		if (array) {
			if (array instanceof Float32Array) {
				this.mappedArr = new Float32Array(array.length)
				this.mappedArr.set(array)
			} else if (array instanceof Int32Array) {
				this.mappedArr = new Int32Array(array.length)
				this.mappedArr.set(array)
			}
		} else this.mappedArr = new Float32Array(size)
		// }

		this.totalFloatSz = size

		this._buff = wgpu.device.createBuffer({
			mappedAtCreation: false,
			size: size * 4,
			usage,
		})

		// let arrayBuffer: ArrayBuffer = this._buff.getMappedRange()

		// new Float32Array(arrayBuffer).set(this.mappedArr)

		// this._buff.unmap()

		return this
	}

	public upload_range(start: number, end: number) {
		const sz_in_bytes = end * this.mappedArr.BYTES_PER_ELEMENT
		const offs_in_bytes = start * this.mappedArr.BYTES_PER_ELEMENT
		wgpu.queue.writeBuffer(
			this.buff,
			offs_in_bytes,
			this.mappedArr.buffer,
			offs_in_bytes,
			// this.mappedArr.buffer.byteLength
			sz_in_bytes,
		)
	}

	public upload() {
		const sz_in_bytes = this.sz * this.mappedArr.BYTES_PER_ELEMENT
		const offs_in_bytes = this.offs * this.mappedArr.BYTES_PER_ELEMENT
		wgpu.queue.writeBuffer(
			this.buff,
			offs_in_bytes,
			this.mappedArr.buffer,
			offs_in_bytes,
			// this.mappedArr.buffer.byteLength
			sz_in_bytes,
		)
	}

	public uploadMapped() {
		wgpu.queue.writeBuffer(this.buff, 0, this.mappedArr.buffer, 0, this.mappedArr.buffer.byteLength)
	}

	public clear(endLastPass: boolean = true, offset?: number, size?: number) {
		offset = ifExistsAElseB(offset, 0)
		size = ifExistsAElseB(this.mappedArr.buffer.byteLength, 0)

		if (endLastPass) {
			wgpu.flushPasses()
		}

		const commandEncoder = wgpu.device.createCommandEncoder()

		wgpu.encoders.push({
			commandEncoder: commandEncoder,
		})
		commandEncoder.clearBuffer(this.buff, offset, size)
	}

	constructor() {}
}
