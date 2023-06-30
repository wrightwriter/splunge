import {Framebuffer} from 'gl/Framebuffer'
import {Texture} from 'gl/Texture'

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
		debugger
	}
}

export function copy_fb_to_texture(in_framebuffer: WebGLFramebuffer, out_texture: Texture) {
	gl.bindFramebuffer(gl.FRAMEBUFFER, in_framebuffer)
	gl.bindTexture(gl.TEXTURE_2D, out_texture.tex)
	gl.copyTexImage2D(gl.TEXTURE_2D, 0, out_texture.internal_format, 0, 0, out_texture.res[0], out_texture.res[1], 0)
}
export function copy_fb_to_fb(in_framebuffer: WebGLFramebuffer, out_framebuffer: WebGLFramebuffer, res: number[]) {
	gl.bindFramebuffer(gl.READ_FRAMEBUFFER, in_framebuffer)
	gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, out_framebuffer)
	gl.blitFramebuffer(0, 0, res[0], res[1], 0, 0, res[0], res[1], gl.COLOR_BUFFER_BIT, gl.NEAREST)
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
		set_redraw_needed(true)
		// @ts-ignore
		default_framebuffer._textures[0].res = [...client_res]
		set_shared_uniforms()
	}

	return needResize
}
