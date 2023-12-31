import {WrightGPU} from 'gl/wgpu'
import {UBO} from 'gl_utils'
import {Project} from 'stuff'
import Dexie from '../node_modules/dexie/dist/dexie'

export declare global {
	var ubo: UBO
	var isOnMobile: boolean
	var sketch_db: Dexie
	// interface DexieSketchEntry {
	// 	data: Project
	// }
	// interface Dexie {
	// 	sketch: Dexie.Table<DexieSketchEntry, number>
	// }
	var wgpu: WrightGPU
	interface Window {
		zoom: Float32Array
		media_recorder: MediaRecorder
	}
	interface PointerEvent {
		altitudeAngle: number
		azimuthAngle: number
	}
	interface WebGL2RenderingContext {
		defaultVao: WebGLVertexArrayObject
		glEnums: Object
		enumStringToValue: Object
		debugEnabled: boolean
	}
	interface User {
		email: string
		name: string
		imageUrl: string
	}
	declare module '*.svg' {
		const content: string
		export default content
	}
}
