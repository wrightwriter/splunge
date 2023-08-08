// import { ifExistsAElseB, loop } from "./utils"
// import { Sketch } from "index"
// // import {Vec, Vec3, Vec4} from "./wmath"
// import { Matrix4, Vector, Vector3, Vector4 } from "@0b5vr/experimental"
import {StorageBuffer} from './wstoragebuffer'

export class SharedUniformValue {
	private v: any
	public readonly idx: number
	constructor(idx: number) {
		this.idx = idx
	}
	const(v: any = 0) {
		// this.set(v)
		this.value = v
	}
	get value() {
		return this.v
	}
	set value(v: any) {
		this.v = v
	}
}

export class UniformBuffer extends StorageBuffer {
	private sharedUniforms: {
		[index: string]: SharedUniformValue
	} = {}
	bindGroup: GPUBindGroup
	bindGroupLayout: GPUBindGroupLayout

	// 🔧
	constructor(maxSz: number = 1400) {
		super()

		this.create(maxSz * 4, GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST, null, true, true)
	}

	// public setUniform(name: string, value: any) {
	//   if (!this.sharedUniforms[name]) {
	//     const idx = Object.keys(this.sharedUniforms).length
	//     let uniformVal = new SharedUniformValue(idx)
	//     uniformVal.value = value
	//     this.sharedUniforms[name] = uniformVal

	//     if(!isNaN(value)){
	//       this.totalFloatSz += 1
	//     // } else if(value instanceof Vector2){
	//     //   this.totalFloatSz += 2
	//     } else if(value instanceof Vector3){
	//       this.totalFloatSz += 3
	//     } else if(value instanceof Vector4){
	//       this.totalFloatSz += 4
	//     } else if(value instanceof Matrix4){
	//       this.totalFloatSz += 4*4
	//     }
	//     this.mappedArr = new Float32Array(this.totalFloatSz)

	//   } else {
	//     let uniformVal = this.sharedUniforms[name]
	//     uniformVal.value = value
	//   }
	// }
	// public getUniform(name: string): any {
	//   const sharedUniform = this.sharedUniforms[name]
	//   return this.sharedUniforms[sharedUniform.idx].value
	// }

	// ♻
	// public async update(){
	//   // await this._uniformsBuff.mapAsync(GPUMapMode.WRITE)

	//   let padding = 0
	//   for(let [key, uniform] of Object.entries(this.sharedUniforms)){
	//     if(!isNaN(uniform.value)){
	//       this.mappedArr[padding] = uniform.value
	//       padding += 1
	//     // } else if(uniform.value instanceof Vector2){
	//     //   this.mappedArr[padding] = uniform.value.x
	//     //   this.mappedArr[padding + 1] = uniform.value.y
	//     //   padding += 2
	//     } else if(uniform.value instanceof Vector3){
	//       this.mappedArr[padding] = uniform.value.x
	//       this.mappedArr[padding + 1] = uniform.value.y
	//       this.mappedArr[padding + 2] = uniform.value.z
	//       padding += 3
	//     } else if(uniform.value instanceof Vector4){
	//       this.mappedArr[padding] = uniform.value.x
	//       this.mappedArr[padding + 1] = uniform.value.y
	//       this.mappedArr[padding + 2] = uniform.value.z
	//       this.mappedArr[padding + 3] = uniform.value.w
	//       padding += 4
	//     }else if(uniform.value instanceof Matrix4){
	//       for(let i = 0; i < 4*4; i++){
	//         this.mappedArr[padding + i] = uniform.value.elements[i]
	//       }
	//       padding += 4*4
	//     }
	//   }

	//   Sketch.wgpu.queue.writeBuffer(
	//     this.buff,0,
	//     // this.mappedArr.buffer,0, padding
	//     this.mappedArr.buffer,
	//     0,
	//     padding*4
	//   )

	//   // const uploadBuff = Sketch.wgpu.device.createBuffer({
	//   //   size: padding * 4,
	//   //   usage: GPUBufferUsage.COPY_SRC,
	//   //   mappedAtCreation: true
	//   // })

	//   // new Float32Array(uploadBuff.getMappedRange()).set(this.mappedArr)
	//   // uploadBuff.unmap()

	//   // bruh
	//   // const commandEncoder = Sketch.wgpu.device.createCommandEncoder()
	//   // commandEncoder.copyBufferToBuffer(uploadBuff,0, this._buff,0, padding*4)
	//   // const commandBuffer = commandEncoder.finish()

	//   // Sketch.wgpu.queue.submit([commandBuffer])

	//   // const renderPass = commandEncoder.beginRenderPass()
	//   // this._buff.unmap()
	// }
}
