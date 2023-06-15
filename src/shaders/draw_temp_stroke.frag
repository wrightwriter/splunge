#pragma glslify: import('./fs_prepend_includes.glsl')
in vec2 uv;
out vec4 col;
void main() {
  col = vec4(1);
  col.xyz = stroke_col.xyz;
  
  vec2 u = uv;
  u = abs(u) - 0.6;
  float rect_sdf = max(u.x,u.y);
  float fw = abs(fwidth(rect_sdf));
  rect_sdf += fw;

  
  col.w = smoothstep(fw,0.,rect_sdf);
  col.xyz *= 1.;

  // col.xyz = texture(canvas,uv).xyz;
}