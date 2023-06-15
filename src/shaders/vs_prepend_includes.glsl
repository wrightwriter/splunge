#version 300 es
precision highp float;
uniform float time;
uniform int frame;
uniform vec2 R;
uniform vec2 canvasR;
uniform vec2 stroke_pos;
uniform vec2 tilt;
uniform vec2 brush_sz;
uniform float pressure;
uniform sampler2D canvas;
uniform sampler2D canvas_back;
uniform sampler2D temp_tex;
out vec2 uv;

#define rot(a) mat2(cos(a),-sin(a),sin(a),cos(a))
vec2[] positions = vec2[4](
  vec2(-1, -1), vec2(1, -1), vec2(-1, 1),vec2(1, 1)
);

