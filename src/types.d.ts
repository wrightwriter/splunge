import {UBO} from 'gl_utils'

export declare global {
	var gl: WebGL2RenderingContext
	var ubo: UBO
	interface Window {}
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
}

declare module '*.svg' {
	const content: string
	export default content
}
