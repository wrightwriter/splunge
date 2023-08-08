export type BindGroupElement = Texture | UniformBuffer | StorageBuffer | GPUSamplerDescriptor

import {Texture} from './wtexture'
import {UniformBuffer} from './wuniformbuffer'
import {StorageBuffer} from './wstoragebuffer'

export class BindGroup {
	private _bindGroup: GPUBindGroup
	private _bindGroupLayout: GPUBindGroupLayout

	public get bindGroupLayout() {
		return this._bindGroupLayout
	}
	public get bindGroup() {
		return this._bindGroup
	}

	public bind_to_idx(encoder: GPURenderPassEncoder | GPUComputePassEncoder, idx: number, offs?: number[]) {
		encoder.setBindGroup(idx, this.bindGroup, offs)
	}

	elements: BindGroupElement[] = []

	// ♻
	rebuild() {
		const bindGroupEntries: GPUBindGroupEntry[] = []
		const bindGroupLayoutEntries: GPUBindGroupLayoutEntry[] = []

		let i = 0
		for (let element of this.elements) {
			if (element instanceof Texture) {
				let tex = element
				if (!tex.bind_groups.includes(this)) tex.bind_groups.push(this)
				bindGroupLayoutEntries.push({
					binding: i,
					visibility: GPUShaderStage.COMPUTE | GPUShaderStage.FRAGMENT | GPUShaderStage.VERTEX,
					texture: {
						sampleType: tex.internal_type,
						// tex.type === "float" ? "unfilterable-float" : tex.type // shit
						// tex.props.depthTex ? "depth" :
						//   tex.props.
						//   "unfilterable-float"
					},
				})
				bindGroupEntries.push({
					binding: i,
					resource: tex.view,
				})
			} else if (element instanceof StorageBuffer) {
				bindGroupEntries.push({
					binding: i,
					resource:
						element instanceof UniformBuffer
							? {
									buffer: element.buff,
							  }
							: {
									buffer: element.buff,
									size: element.mappedArr.byteLength,
									offset: 0,
							  },
				})
				bindGroupLayoutEntries.push({
					binding: i,
					visibility: GPUShaderStage.FRAGMENT | GPUShaderStage.VERTEX | GPUShaderStage.COMPUTE,
					buffer: {
						type: element instanceof UniformBuffer ? 'uniform' : 'read-only-storage',
						hasDynamicOffset: element.hasDynamicOffset,
					},
				})
			} else {
				let samp_desc = element as GPUSamplerDescriptor
				let sampler = wgpu.device.createSampler(samp_desc)
				bindGroupEntries.push({
					binding: i,
					resource: sampler,
				})
				bindGroupLayoutEntries.push({
					binding: i,
					visibility: GPUShaderStage.COMPUTE | GPUShaderStage.FRAGMENT | GPUShaderStage.VERTEX,
					sampler: {
						// type: "filtering"
						type: samp_desc.minFilter === 'linear' ? 'filtering' : 'non-filtering',
					},
				})
			}
			// } else if (writableObj instanceof Texture){
			//   bindGroupLayoutEntries.push({
			//     binding: parseInt(idx),
			//     visibility: GPUShaderStage.COMPUTE | GPUShaderStage.FRAGMENT,
			//     storageTexture: {
			//       format: writableObj.props.format,
			//       access: "write-only"
			//     }
			//   })
			//   bindGroupEntries.push({
			//     binding: parseInt(idx),
			//     resource: writableObj.view
			//   })

			// }

			i++
		}

		this._bindGroupLayout = wgpu.device.createBindGroupLayout({
			entries: bindGroupLayoutEntries,
		})

		this._bindGroup = wgpu.device.createBindGroup({
			layout: this._bindGroupLayout,
			entries: bindGroupEntries,
		})
	}

	// 🔧
	constructor(elements: BindGroupElement[]) {
		this.elements = elements

		this.rebuild()
	}
}
