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
// uniform vec3 tex_lch_dynamics;
// uniform vec2 tex_stretch;
// uniform vec2 tilt;
// uniform vec2 brush_sz;
// uniform float pressure;
uniform sampler2D canvas_back;
uniform sampler2D temp_tex;
uniform sampler2D canvas_a;
uniform sampler2D canvas_b;

uniform sampler2D brush_texture[7];

// uniform sampler2D brush_texture_0;
// uniform sampler2D brush_texture_1;
// uniform sampler2D brush_texture_2;
// uniform sampler2D brush_texture_3;
// uniform sampler2D brush_texture_4;
// uniform sampler2D brush_texture_5;
// uniform sampler2D brush_texture_6;
// uniform sampler2D brush_texture_7;
// uniform sampler2D brush_texture_8;
// uniform sampler2D brush_texture_9;
// uniform sampler2D brush_texture_10;
// uniform sampler2D brush_texture_11;
// uniform sampler2D brush_texture_12;

vec4 sample_brush_tex(int idx, vec2 uv){
  if(idx == 0){
    return texture(brush_texture[0],uv);
  }
  if(idx == 1){
    return texture(brush_texture[1],uv);
  }
  if(idx == 2){
    return texture(brush_texture[2],uv);
  }
  if(idx == 3){
    return texture(brush_texture[3],uv);
  }
  if(idx == 4){
    return texture(brush_texture[4],uv);
  }
  if(idx == 5){
    return texture(brush_texture[5],uv);
  }
  if(idx == 6){
    return texture(brush_texture[6],uv);
  } 
  // if(idx == 7){
  //   return texture(brush_texture[7],uv);
  // }
  // if(idx == 8){
  //   return texture(brush_texture_8,uv);
  // }
  // if(idx == 9){
  //   return texture(brush_texture_9,uv);
  // }
  // if(idx == 10){
  //   return texture(brush_texture_10,uv);
  // }
  // if(idx == 11){
  //   return texture(brush_texture_11,uv);
  // }
  // if(idx == 12){
  //   return texture(brush_texture_12,uv);
  // }
}
// uniform float canvas_idx;
uniform Settings {
  vec2 canvasR;
  vec2 R;
  float time;
  float canvas_idx;
};

#define rot(a) mat2(cos(a),-sin(a),sin(a),cos(a))
vec2[] positions = vec2[4](
  vec2(-1, -1), vec2(1, -1), vec2(-1, 1),vec2(1, 1)
);