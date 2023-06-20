import {UBO} from 'gl_utils'

export declare global {
	interface Window {
		gl: WebGL2RenderingContext
		ubo: UBO
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
}

declare module '*.svg' {
	const content: string
	export default content
}
