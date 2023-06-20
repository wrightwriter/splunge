#version 300 es
precision highp float;
precision highp int;
// uniform float time;
// uniform float frame;
// uniform float zoom;
// uniform vec2 panning;
// uniform vec2 R;
// uniform vec2 canvasR;
// uniform vec4 stroke_col;
// uniform vec2 stroke_pos;
// uniform float stroke_opacity;
uniform vec3 tex_lch_dynamics;
uniform vec2 tex_stretch;
// uniform vec2 tilt;
// uniform vec2 brush_sz;
// uniform float pressure;
uniform sampler2D canvas;
uniform sampler2D canvas_back;
uniform sampler2D canvas_read;
uniform sampler2D temp_tex;


			// ubo.buff.upload_external_array([
			// 	t, 
			// 	zoom, 
			// 	frame, 
			// 	... default_framebuffer.textures[0].res,
			// 	... panning, 
			// 	...canvas_read_tex.res, 
			// 	...brush_pos_ndc_canvas,
			// 	... brush_pos_ndc_screen, 
			// 	... col, 
			// 	... brush_sz, 
			// 	stroke_opacity,
			// 	... brush_rot, 
			// 	io.pressure, 
			// 	io.mouse_down ? 1 : 0, 
			// ])
// THIS IS CALLED A UNIFORM BLOCK
uniform Settings {
  vec4 stroke_col;
  vec2 panning;
  vec2 canvasR;
  vec2 stroke_pos;
  vec2 stroke_pos_screen;
  vec2 R;
  vec2 brush_sz;
  vec2 tilt;
  float time;
  float zoom;
  float frame;
  float stroke_opacity;
  float pressure;
  // vec3 tex_lch_dynamics;
  // vec2 tex_stretch;
};

#define rot(a) mat2(cos(a),-sin(a),sin(a),cos(a))
vec2[] positions = vec2[4](
  vec2(-1, -1), vec2(1, -1), vec2(-1, 1),vec2(1, 1)
);