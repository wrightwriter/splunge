import {Framebuffer} from 'gl/Framebuffer'
import {validateHeaderValue} from 'http'
import {isThisTypeNode} from 'typescript'
import {pow} from 'wmath'

// let gl: WebGL2RenderingContext

export function init_gl_error_handling() {
	if (!gl.debugEnabled) return
	gl.glEnums = {}
	gl.enumStringToValue = {}
	for (let propertyName in gl) {
		if (typeof gl[propertyName] === 'number') {
			gl.glEnums[gl[propertyName]] = propertyName
			gl.enumStringToValue[propertyName] = gl[propertyName]
		}
	}
}

export function gl_enum_to_string(value): string {
	// checkInit();
	const name = window.gl.glEnums[value]
	return name !== undefined ? 'gl.' + name : '/*UNKNOWN WebGL ENUM*/ 0x' + value.toString(16) + ''
}
export function print_on_gl_error() {
	if (!gl.debugEnabled) return
	let err = window.gl.getError()
	if (err !== 0) {
		console.error(err)
		console.error(gl_enum_to_string(err))
	}
}
export function pause_on_gl_error() {
	if (!gl.debugEnabled) return
	let err = window.gl.getError()
	if (err !== 0) {
		console.error(err)
		console.error(gl_enum_to_string(err))
		// debugger
	}
}

export function resizeIfNeeded(
	canvas: HTMLCanvasElement,
	default_framebuffer: Framebuffer,
	client_res: number[],
	set_redraw_needed: (v: boolean) => void,
	set_shared_uniforms: Function,
) {
	const displayWidth = canvas.clientWidth
	const displayHeight = canvas.clientHeight

	const needResize = canvas.width !== displayWidth || canvas.height !== displayHeight

	if (needResize) {
		client_res[0] = canvas.width = displayWidth
		client_res[1] = canvas.height = displayHeight
		// console.log('RESIZED')
		// console.log(client_res)
		// console.log(canvas)
		set_redraw_needed(true)
		// @ts-ignore
		default_framebuffer._textures[0].res = [...client_res]
		set_shared_uniforms()
	}

	return needResize
}

export function finish_frame() {
	for (let framebuffer of Framebuffer.framebuffers) {
		if (framebuffer.needs_pong) {
			// console.log('ponged')
			// framebuffer.pong_idx = 1 - framebuffer.pong_idx
			// framebuffer.needs_pong = false
			framebuffer.pong()
		}
	}
}
