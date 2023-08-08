import {BindGroup} from './wbindgroup'
import {StorageBuffer} from './wstoragebuffer'
import {Texture} from './wtexture'

export abstract class AbstractBindingContainer {
	public bindGroups: BindGroup[] = []

	protected pipeline: GPURenderPipeline | GPUComputePipeline
	protected pipelineDescriptor: GPURenderPipelineDescriptor | GPUComputePipelineDescriptor

	// 🔧
	constructor() {}

	// ♻
	protected refreshPipeline() {
		let i = 0
		let bind_group_layouts: GPUBindGroupLayout[] = []
		let bind_groups: GPUBindGroup[] = []
		for (let bindGroup of this.bindGroups) {
			bind_group_layouts.push(bindGroup.bindGroupLayout)
			bind_groups.push(bindGroup.bindGroup)
			i++
		}
		this.pipelineDescriptor.layout = wgpu.device.createPipelineLayout({
			bindGroupLayouts: bind_group_layouts,
		})

		if ((this.pipelineDescriptor as GPURenderPipelineDescriptor).vertex) {
			this.pipeline = wgpu.device.createRenderPipeline(this.pipelineDescriptor as GPURenderPipelineDescriptor)
		} else if ((this.pipelineDescriptor as GPUComputePipelineDescriptor).compute) {
			this.pipeline = wgpu.device.createComputePipeline(this.pipelineDescriptor as GPUComputePipelineDescriptor)
		} else {
			throw 'uuuh'
		}
	}
}
