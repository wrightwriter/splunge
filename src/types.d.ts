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
	}
}

// window.webAudio = window.webAudio || {};
