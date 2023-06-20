export declare global {
	interface Window {
		gl: WebGL2RenderingContext
	}
	interface PointerEvent {
		altitudeAngle: number
		azimuthAngle: number
	}
	interface WebGL2RenderingContext {
		defaultVao: WebGLVertexArrayObject
		glEnums: Object
		enumStringToValue: Object
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
