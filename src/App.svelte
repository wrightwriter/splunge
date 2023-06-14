<main>
	<div id="bar-container">
		<div id="bar">
			<Knob bind:value={stroke_col[0]} title={"R"} />
			<Knob bind:value={stroke_col[1]} title={"G"} />
			<Knob bind:value={stroke_col[2]} title={"B"} />
			<ColourDisplay bind:colour={stroke_col} />

			<Knob bind:value={chaos} title={"Chaos"} triggerModal={(modal)=>{openModal(modal)}} modal={chaosSemiModal} />
		</div>
		<SemiModal bind:this={chaosSemiModal}>
			<Knob bind:value={chaos_lch[0]} title={"Chaos L"} />
			<Knob bind:value={chaos_lch[1]} title={"Chaos C"} />
			<Knob bind:value={chaos_lch[2]} title={"Chaos H"} />
			<Knob bind:value={chaos_speed} title={"Chaos Speed"} />
		</SemiModal>
	</div>
	<!-- {@html `<style> #bar>*:last-of-type{margin-left:auto; padding-right: 4rem;} </style>`}  -->
	<canvas id="canvas" bind:this={canvasElement} />
</main>

<script lang="ts">
	// import type monaco from 'monaco-editor';
	import {onMount} from 'svelte'
	import {onDestroy} from 'svelte'
	import {get} from 'svelte/store'

	import {Texture, Framebuffer, ShaderProgram, init_utils, resizeIfNeeded} from './gl_utils'

	import Knob from 'Knob.svelte'
	import ColourDisplay from 'ColourDisplay.svelte'
	import SemiModal from 'SemiModal.svelte'
	import {IO} from 'IO'
	import chroma from 'chroma-js'
	import {Hash} from 'wmath'
	import {clamp, mod} from '@0b5vr/experimental'
	let canvasElement: HTMLCanvasElement

	let chaosSemiModal: SemiModal

	let hash = new Hash()

	let modals: SemiModal[] = []

	let stroke_col: Array<number> = [0.5, 0, 0, 1]

	let chaos_lch: Array<number> = [0, 0, 0]
	let chaos_speed: number = 0.1

	let chaos: number = 0

	let io = new IO()

	let zoom = 1

	let gl: WebGL2RenderingContext

	let userRes: Array<number> = [0, 0]
	let canvasRes: Array<number> = [512 * 2, 512 * 2]
	let default_framebuffer: Framebuffer

	const openModal = (modal: SemiModal) => {
		for (let m of modals) {
			if (m === modal) {
				if (m.hidden) {
					m.hidden = false
				} else {
					m.hidden = true
				}
			} else {
				// m.hide()
				m.hidden = true
			}
		}
	}

	const initWebGL = () => {
		//@ts-ignore
		window.gl = gl = canvasElement.getContext('webgl2', {
			preserveDrawingBuffer: true,
			alpha: false,
		})
		userRes = [canvasElement.clientWidth, canvasElement.clientWidth]
		init_utils()

		default_framebuffer = Object.create(Framebuffer.prototype)
		default_framebuffer.default = true
		// @ts-ignore
		default_framebuffer.fb = null
		default_framebuffer.textures = [Object.create(Texture.prototype)]
		default_framebuffer.textures[0].res = [...userRes]

		resizeIfNeeded(canvasElement, default_framebuffer, userRes, (e) => {})

		gl.disable(gl.DEPTH_TEST)
		gl.enable(gl.BLEND)
	}
	const initOtherStuff = () => {
		modals = [chaosSemiModal]
	}

	const vs_prepend_includes = `#version 300 es
  uniform float time;
	uniform vec2 R;
	uniform vec2 canvasR;
	uniform vec2 stroke_pos;
	out vec2 uv;

	`

	const vs_prepend = `
  #define rot(a) mat2(cos(a),-sin(a),sin(a),cos(a))
  vec2[] positions = vec2[4](
    vec2(-1, -1), vec2(1, -1), vec2(-1, 1),vec2(1, 1)
  );

  gl_Position = vec4(positions[gl_VertexID],0,1);

	if(canvasR.x < canvasR.y){
		gl_Position.y /= canvasR.y/canvasR.x;
	} else {
		gl_Position.x /= canvasR.x/canvasR.y;
	}

	`

	onMount(async () => {
		initWebGL()
		initOtherStuff()

		const draw_temp_stroke_to_canvas_program = new ShaderProgram(
			// vs
			vs_prepend_includes +
				`void main(){` +
				vs_prepend +
				`	uv = gl_Position.xy*0.5 + 0.5;
}  
`,
			// fs
			`#version 300 es
  precision highp float;
  uniform float time;
  uniform sampler2D canvas;
  uniform sampler2D temp_tex;
	in vec2 uv;
  out vec4 col;
  void main() {
		col = vec4(1);
		col.xyz = texture(canvas,uv).xyz;

		vec4 temp_tex = texture(temp_tex,uv);
		col.xyz = mix(col.xyz, temp_tex.xyz, temp_tex.w);
		
		col = pow(col,vec4(0.454545454545));
  }
`,
		)

		const composite_canvas_program = new ShaderProgram(
			// vs
			vs_prepend_includes +
				`void main(){` +
				vs_prepend +
				`	uv = gl_Position.xy*0.5 + 0.5;
}  
`,
			// fs
			`#version 300 es
  precision highp float;
  uniform float time;
  uniform sampler2D canvas;
  uniform sampler2D temp_tex;
	in vec2 uv;
  out vec4 col;
  void main() {
		col = vec4(1);
		col.xyz = texture(canvas,uv).xyz;

		vec4 temp_tex = texture(temp_tex,uv);
		col.xyz = mix(col.xyz, temp_tex.xyz, temp_tex.w);
		
		col = pow(col,vec4(0.454545454545));
  }
`,
		)

		const draw_temp_stroke_program = new ShaderProgram(
			// vs
			vs_prepend_includes +
				`
			uniform float pressure;
			uniform vec2 tilt;
			void main(){
			` +
				vs_prepend +
				`	
				gl_Position.y *= 0.2;
				gl_Position.xy *= 0.2 * pressure;
				gl_Position.xy *= rot(-tilt.y);

	uv = gl_Position.xy*0.5 + 0.5;
	gl_Position.xy += stroke_pos;
}  
`,
			// fs
			`#version 300 es
  precision highp float;
  uniform float time;
  uniform sampler2D canvas;
	uniform vec4 stroke_col;
	uniform float pressure;
	uniform vec2 tilt;
	in vec2 uv;
  out vec4 col;
  void main() {
		col = vec4(1);
		col.xyz = stroke_col.xyz;
		// col.xyz = texture(canvas,uv).xyz;
  }
`,
		)
		default_framebuffer.start_draw()
		default_framebuffer.clear([0, 0, 0, 1])

		const canvas_tex = new Texture([canvasRes[0], canvasRes[1]])
		const canvas_fb = new Framebuffer([canvas_tex])
		canvas_fb.clear([0.1, 0, 0, 1])

		const temp_tex = new Texture([canvasRes[0], canvasRes[1]])
		const temp_fb = new Framebuffer([temp_tex])
		temp_fb.clear([0, 0, 0, 0])

		let frame = 0
		
		const set_shared_uniforms = (program: ShaderProgram, col: number[], t: number) => {
			program.setUniformFloat('time', t)
			program.setUniformVec('R', userRes)
			program.setUniformVec('canvasR', userRes)
			program.setUniformVec('stroke_pos', io.mouse_pos)
			program.setUniformVec('stroke_col', col)
			program.setUniformFloat('pressure', io.pressure)
			program.setUniformVec('tilt', io.tilt)
			program.setUniformTexture('canvas', canvas_tex, 0)
			program.setUniformTexture('temp_tex', temp_tex, 1)
		}
		const draw = (t: number) => {
			let redraw_needed = false
			if (frame === 0) redraw_needed = true
			t = t / 1000
			resizeIfNeeded(canvasElement, default_framebuffer, userRes, (v: boolean) => {
				redraw_needed = v
			})

			io.tick()

			if (io.mouse_pressed) {
				redraw_needed = true
				let col = [...stroke_col]

				{
					const chroma_gl = (col: number[]) => {
						return chroma.gl(col[0], col[1], col[2])
					}
					const chroma_oklch = (col: number[]) => {
						return chroma.oklch(col[0], col[1], col[2])
					}

					col = chroma_gl(col).oklch()
					// col[2] = (t*300)%300
					col[0] += hash.valueNoiseSmooth(t * 100 * chaos_speed, 2) * chaos * chaos_lch[0]
					col[1] += hash.valueNoiseSmooth(t * 100 * chaos_speed, 2) * chaos * chaos_lch[1]
					col[2] += hash.valueNoiseSmooth(t * 100 * chaos_speed, 2) * 300 * chaos * chaos_lch[2]
					col[0] = clamp(col[0], 0, 1)
					col[1] = clamp(col[1], 0, 1)
					col[2] = mod(col[2], 360)
					console.log(col[2])

					col = chroma_oklch(col).gl()
				}

				temp_fb.start_draw()
				draw_temp_stroke_program.use()
				set_shared_uniforms(draw_temp_stroke_program, col, t);
				gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
			}
			if (io.mouse_just_unpressed) {
				canvas_fb.start_draw()
				temp_fb.clear([0,0,0,0])
			}
			if (redraw_needed) {
				default_framebuffer.start_draw()
				default_framebuffer.clear([0, 0, 0, 1])

				composite_canvas_program.use()
				set_shared_uniforms(composite_canvas_program, [0,0,0,0], t);
				gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)

				// gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
			}

			io.tick_end()
			frame++
			requestAnimationFrame(draw)
		}
		;(() => {
			draw(0)
		})()
	})

	$: {
	}

	onDestroy(() => {})
</script>

<style lang="scss">
	.knob-container {
		padding: 1rem 0rem;
	}
	* {
		* {
			color: white;
			font-family: 'Jetbrains Mono';
		}
	}
	main {
		width: 100%;
		height: 100%;
		display: flex;
		flex-direction: column;
		#bar-container{
			width: 100%;
			position: absolute;
			display: flex;
			flex-direction: column;
			#bar {
				background: black;
				// position: absolute;
				width: 100%;
				height: 100px;
				display: flex;
				padding: 0rem 1rem;
				align-items: center;
				> *:last-of-type {
					margin-left: auto;
					margin-right: 0px;
				}
			}
		}
		canvas {
			width: 100%;
			height: 100%;
			display : block;
			margin: auto;
			padding: 0;
			// background-color: red;
		}

	}
</style>
