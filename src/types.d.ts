export declare global {
	interface Window {
		gl: WebGL2RenderingContext
	}
	interface PointerEvent {
		altitudeAngle: number
		azimuthAngle: number
	}
}

// window.webAudio = window.webAudio || {};
