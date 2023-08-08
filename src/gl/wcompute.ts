import {ifExistsAElseB, loop} from './utils'

import {FrameBuffer} from './wframebuffer'
import {Texture} from './wtexture'
import {AbstractBindingContainer} from './wabstractbindingcontainer'
import {ShaderCompute, ShaderImports} from './wgpu'
import {StorageBuffer} from './wstoragebuffer'

type ComputeBuffer = Texture

// 🔢
export class ComputeProgram extends AbstractBindingContainer {
	// @ts-ignore
	protected override pipeline!: GPUComputePipeline
	// @ts-ignore
	protected override pipelineDescriptor: GPUComputePipelineDescriptor

	private computePassDescriptor: GPUComputePassDescriptor
	private computeShader: ShaderCompute

	private commandEncoder: GPUCommandEncoder
	private passEncoder: GPUComputePassEncoder

	private boundBuffer: ComputeBuffer

	constructor({compString, buffer}: {compString: string; buffer?: ComputeBuffer}) {
		super()

		this.computeShader = new ShaderCompute(compString)

		this.pipelineDescriptor = {
			compute: {
				module: this.computeShader.compModule,
				entryPoint: 'main',
			},
			layout: 'auto',
		}
		// this.pipeline = Sketch.wgpu.device.createComputePipeline(this.pipelineDescriptor)

		this.boundBuffer = buffer

		this.computePassDescriptor = {}
	}

	runBound({endLastPass}: {endLastPass?: boolean}) {
		if (process.env.DEV) {
			if (!this.boundBuffer) throw 'Pls gib me buffer'
		}

		if (this.boundBuffer instanceof Texture) {
			this.runTex({endLastPass, texture: this.boundBuffer})
		}
	}

	runTex({endLastPass, texture}: {endLastPass?: boolean; texture: Texture}) {
		const workGroupSz = [Math.ceil(texture.width / 16), Math.ceil(texture.height / 16), 1]

		this.runSz({endLastPass, workGroupSz})
	}

	runBuffer({endLastPass, buffer}: {endLastPass?: boolean; buffer: StorageBuffer}) {
		const workGroupSz = [Math.ceil(buffer.mappedArr.length / 256), 1, 1]

		this.runSz({endLastPass, workGroupSz})
	}

	runSz({endLastPass, workGroupSz}: {endLastPass?: boolean; workGroupSz: number[]}) {
		endLastPass = ifExistsAElseB(endLastPass, true)

		if (endLastPass) {
			wgpu.flushPasses()
		}

		this.commandEncoder = wgpu.device.createCommandEncoder()
		this.passEncoder = this.commandEncoder.beginComputePass(this.computePassDescriptor)

		wgpu.encoders.push({
			commandEncoder: this.commandEncoder,
			passEncoder: this.passEncoder,
		})

		let i = 0

		this.passEncoder.setPipeline(this.pipeline)
		// this.passEncoder.dispatch(workGroupSz.x, workGroupSz.y, workGroupSz.z)
		// @ts-ignore
		this.passEncoder.dispatchWorkgroups(workGroupSz.x, workGroupSz.y, workGroupSz.z)
	}
}
