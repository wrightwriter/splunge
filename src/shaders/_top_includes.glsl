#version 300 es
precision highp float;
precision highp int;
uniform sampler2D canvas_back;
uniform sampler2D temp_tex;
uniform sampler2D canvas_a;
uniform sampler2D canvas_b;

uniform sampler2D brush_texture[7];

uniform Settings {
  vec2 canvasR;
  vec2 R;
  float time;
  float canvas_idx;
  float is_on_mobile;
};

#define rot(a) mat2(cos(a),-sin(a),sin(a),cos(a))
vec2[] positions = vec2[4](
  vec2(-1, -1), vec2(1, -1), vec2(-1, 1),vec2(1, 1)
);