#pragma glslify: import('./fs_prepend_includes.glsl')

#pragma glslify: import('./_blend.glsl')

in vec2 uv;
out vec4 col;
void main() {
  col = texture(canvas_back,uv);

  vec4 temp_tex = texture(temp_tex,uv);
  // col.xyz = mix(col.xyz, temp_tex.xyz, temp_tex.w);
 
  if(temp_tex.w > 0.000001)
    col = blend_brushstroke(col,temp_tex); 
}      