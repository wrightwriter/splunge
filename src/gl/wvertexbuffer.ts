import { loop } from "./utils"
import { StorageBuffer } from "./wstoragebuffer"

export class VertexBuffer extends StorageBuffer{
  public attributeDescriptors: GPUVertexAttribute[] = []
  public vertBufferLayouts: GPUVertexBufferLayout[] = []
  public stride: number
  public pads: number[]
  public vertCnt: number
  public offsets: number[]
  
  // getInstance(pipelineDescriptor: GPURenderPipelineDescriptor): VertexBufferInstance {
  //   return new VertexBufferInstance(this, pipelineDescriptor)
  // }

  // draw(passEncoder: GPURenderPassEncoder){
  //   passEncoder.setPipeline(this.pipeline)
  //   passEncoder.setVertexBuffer(0, this.vb._buff)
  //   passEncoder.draw(this.vb.vertCnt, 1, 0, 0)
  // }
  
  bind(passEncoder: GPURenderPassEncoder | GPUComputePassEncoder, slot: number = 0){
    // @ts-ignore
    passEncoder.setVertexBuffer(slot, this._buff)
  }
  
  draw(passEncoder: GPURenderPassEncoder | GPUComputePassEncoder){
    // @ts-ignore
    passEncoder.draw(this.vertCnt, 1, 0, 0)
  }

  // 🔧
  constructor(
    { bufferDataArray, pads}: 
    {
      bufferDataArray: Float32Array | Int32Array; 
      pads: number[];
    }
  ){
    super()
    

    if(pads.length === 0){
      throw "Need attributes"
    }
    
    let offsets = []

    let stride = 0

    loop(pads.length, i =>{
      this.attributeDescriptors.push({
        shaderLocation: i,
        offset: 0,
        // @ts-ignore
        format: 'float32x' + pads[i]
      })
      // * TODO - there is one vert buffer layout
      // this.vertBufferLayouts.push({
      //   attributes: [this.attributeDescriptors[i]],
      //   arrayStride: 4 * pads[i],
      //   stepMode: "vertex"
      // })
      offsets.push(stride)
      stride += pads[i]
    })
    this.vertCnt = bufferDataArray.length / stride
    stride *= 4

    
    super.create(
      ((bufferDataArray.byteLength + 3) & ~3),
      GPUBufferUsage.VERTEX | GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
      bufferDataArray,
      true,
      false
    )

    this.stride = stride
    this.pads = pads 
    this.offsets = offsets
  }
}
