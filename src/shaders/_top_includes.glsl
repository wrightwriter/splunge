#version 300 es
precision highp float;
precision highp int;
uniform float time;
uniform int frame;
uniform float zoom;
uniform vec2 panning;
uniform vec2 R;
uniform vec2 canvasR;
uniform vec4 stroke_col;
uniform vec2 stroke_pos;
uniform float stroke_opacity;
uniform vec3 tex_lch_dynamics;
uniform vec2 tex_stretch;
uniform vec2 tilt;
uniform vec2 brush_sz;
uniform float pressure;
uniform sampler2D canvas;
uniform sampler2D canvas_back;
uniform sampler2D canvas_read;
uniform sampler2D temp_tex;

#define rot(a) mat2(cos(a),-sin(a),sin(a),cos(a))
vec2[] positions = vec2[4](
  vec2(-1, -1), vec2(1, -1), vec2(-1, 1),vec2(1, 1)
);