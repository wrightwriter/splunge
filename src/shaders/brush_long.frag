#pragma glslify: import('./_top_includes.glsl')

in vec2 uv;
in vec4 vCol;
out vec4 col;
void main() {
  col = vec4(1);
  // col.xyz = stroke_col.xyz;
  
  vec2 u = uv;
  u = abs(u) - 2.;
  float rect_sdf = max(u.x,u.y);
  float fw = abs(fwidth(rect_sdf));
  rect_sdf += fw;
  
  col.w = smoothstep(fw,0.,rect_sdf);
  // col.w = 1.;
  // col.xyz *= 1.;
  col = vCol;
  // col.xy = uv.xy;

  // col.xyz = texture(canvas,uv).xyz;
}