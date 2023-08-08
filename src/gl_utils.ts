import {FrameBuffer} from 'gl/wframebuffer'
import {Texture} from 'gl/wtexture'

export function resizeIfNeeded(
	canvas: HTMLCanvasElement,
	default_framebuffer: FrameBuffer,
	webgpu_back_texture: Texture,
	client_res: number[],
	set_redraw_needed: (v: boolean) => void,
	set_shared_uniforms: Function,
) {
	const displayWidth = canvas.clientWidth
	const displayHeight = canvas.clientHeight

	const needResize = canvas.width !== displayWidth || canvas.height !== displayHeight

	if (needResize) {
		client_res[0] =
			wgpu.defaultFramebuffer._textures[0].width =
			wgpu.defaultFramebuffer._textures[0].res[0] =
			canvas.width =
				displayWidth
		client_res[1] =
			wgpu.defaultFramebuffer._textures[0].height =
			wgpu.defaultFramebuffer._textures[0].res[1] =
			canvas.height =
				displayHeight
		webgpu_back_texture.resize([client_res[0], client_res[1]])

		set_redraw_needed(true)

		// default_framebuffer._textures[0].res = [...client_res]
	}

	set_shared_uniforms()
	return needResize
}
