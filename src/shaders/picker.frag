#pragma glslify: import('./_top_includes.glsl')

#pragma glslify: import('./_rand.glsl')

#pragma glslify: import('./_chroma.glsl')


uniform vec3 picked_col;

in vec2 uv;
out vec4 col;
void main() {
  col.xyz = picked_col;
  
  vec2 u = uv;
  u = abs(u) - 0.8;
  float rect_sdf = max(u.x,u.y);
  if(rect_sdf >0.)
    col.xyz = vec3(1);

  col.w = 1.;
}