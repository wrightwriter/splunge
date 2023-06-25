#pragma glslify: import('./_top_includes.glsl')

#pragma glslify: import('./_blend.glsl')

uniform float pong_idx;
uniform int blending_colour_space;
in vec2 uv;
out vec4 col;
void main() {
  col = texture(canvas_back,uv);

  // if(pong_idx < 0.5 ){
  //   col = texture(canvas_a,uv);
  //   // col.xyzw = vec4(1);
  // } else {
  //   col = texture(canvas_b,uv); 
  //   // col.xyzw = vec4(0);
  // }

  vec4 temp_tex = texture(temp_tex,uv);
  // col.xyz = mix(col.xyz, temp_tex.xyz, temp_tex.w);
 
  if(temp_tex.w > 0.000001)
    col = blend_brushstroke(col,temp_tex,blending_colour_space); 
}      