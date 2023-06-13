<main>
	<div id="bar">
		<Knob bind:value={stroke_col[0]} title={"R"} />
		<Knob bind:value={stroke_col[1]} title={"G"} />
		<Knob bind:value={stroke_col[2]} title={"B"} />
		<ColourDisplay bind:colour={stroke_col} />
	</div>
	<!-- {@html `<style> #bar>*:last-of-type{margin-left:auto; padding-right: 4rem;} </style>`}  -->
	<canvas id="canvas" bind:this={canvasElement} />
</main>

<script lang="ts">
	// import type monaco from 'monaco-editor';
	import {onMount} from 'svelte'
	import {onDestroy} from 'svelte'
	import {get} from 'svelte/store'
	import initMonaco from 'initMonaco'

	import {Texture, Framebuffer, ShaderProgram, init_utils, resizeIfNeeded} from './gl_utils'

	import Knob from 'Knob.svelte'
	import PlayButton from 'PlayButton.svelte'
	import ColourDisplay from 'ColourDisplay.svelte'
	let canvasElement: HTMLCanvasElement

	let stroke_col: Array<number> = [0.5, 0, 0, 1]

	let mouse_pos: Array<number> = [0, 0]
	let mouse_down: boolean = false

	let zoom = 1

	let gl: WebGL2RenderingContext

	let userRes: Array<number> = [0, 0]
	let canvasRes: Array<number> = [512, 512]
	let default_framebuffer: Framebuffer

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

		resizeIfNeeded(canvasElement, default_framebuffer, userRes)

		gl.disable(gl.DEPTH_TEST)
		gl.enable(gl.BLEND)
	}
	const initOtherStuff = () => {
		window.addEventListener('mousemove', (e) => {
			function getRelativeMousePosition(event, target) {
				target = target || event.target
				var rect = target.getBoundingClientRect()

				return {
					x: event.clientX - rect.left,
					y: event.clientY - rect.top,
				}
			}
			// assumes target or event.target is canvas
			function getNoPaddingNoBorderCanvasRelativeMousePosition(event, target) {
				target = target || event.target
				var pos = getRelativeMousePosition(event, target)

				pos.x = (pos.x * target.width) / target.clientWidth
				pos.y = (pos.y * target.height) / target.clientHeight

				return pos
			}

			const pos = getNoPaddingNoBorderCanvasRelativeMousePosition(e, gl.canvas)

			// pos is in pixel coordinates for the canvas.
			// so convert to WebGL clip space coordinates
			const x = (pos.x / gl.canvas.width) * 2 - 1
			const y = (pos.y / gl.canvas.height) * -2 + 1

			mouse_pos = [x, y]
		})

		window.addEventListener('mousedown', () => {
			mouse_down = true
		})
		window.addEventListener('mouseup', () => {
			mouse_down = false
		})
	}

	const vs_prepend = `#version 300 es
  uniform float time;
	uniform vec2 R;
	uniform vec2 canvasR;
	uniform vec2 stroke_pos;
	out vec2 uv;
void main(){
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

		const draw_canvas_program = new ShaderProgram(
			// vs
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

		const draw_stroke_program = new ShaderProgram(
			// vs
			vs_prepend +
				`	gl_Position.xy *= 0.2;
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
	in vec2 uv;
  out vec4 col;
  void main() {
		col = vec4(1);
		col.xyz = stroke_col.xyz;
		// col.xyz = texture(canvas,uv).xyz;
  }
`,
		)

		const draw_tex = new Texture([canvasRes[0], canvasRes[1]])
		const draw_fb = new Framebuffer([draw_tex])
		draw_fb.clear([0.1, 0, 0, 1])

		const temp_tex = new Texture([canvasRes[0], canvasRes[1]])
		const temp_fb = new Framebuffer([temp_tex])
		temp_fb.clear([0, 0, 0, 0])

		let mouse_down_prev = mouse_down
		let mouse_pressed = false
		let mouse_just_unpressed = false
		let mouse_just_pressed = false

		const draw = (t: number) => {
			t = t / 1000
			resizeIfNeeded(canvasElement, default_framebuffer, userRes)

			if (mouse_down !== mouse_down_prev) {
				if (mouse_down) {
					mouse_pressed = true
					mouse_just_pressed = true
				} else {
					mouse_pressed = false
					mouse_just_unpressed = true
				}
			}
			if(mouse_pressed){
					temp_fb.start_draw()
					draw_stroke_program.use()
					draw_stroke_program.setUniformFloat('time', t)
					draw_stroke_program.setUniformVec('R', userRes)
					draw_stroke_program.setUniformVec('canvasR', userRes)
					draw_stroke_program.setUniformVec('stroke_pos', mouse_pos)
					draw_stroke_program.setUniformVec('stroke_col', stroke_col)
					gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
			}
			if(mouse_just_unpressed){
					temp_fb.clear([0, 0, 0, 0])
			}

			{
				default_framebuffer.start_draw()
				default_framebuffer.clear([0, 0, 0, 1])

				draw_canvas_program.use()
				draw_canvas_program.setUniformFloat('time', t)
				draw_canvas_program.setUniformVec('R', userRes)
				draw_canvas_program.setUniformVec('canvasR', userRes)
				draw_canvas_program.setUniformTexture('canvas', draw_tex, 0)
				draw_canvas_program.setUniformTexture('temp_tex', temp_tex, 1)
				// draw_canvas_program.setUniformInt('compositing', 0)
				gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)

				// draw_canvas_program.setUniformInt('compositing', 1)
				// gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)				
			}

			mouse_just_pressed = false
			mouse_just_unpressed = false
			mouse_down_prev = mouse_down

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
		#bar {
			background: black;
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
