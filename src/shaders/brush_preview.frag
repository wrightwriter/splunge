#pragma glslify: import('./_top_includes.glsl')
#pragma glslify: import('./_aspect_ratio.glsl')

in vec2 uv;
out vec4 col;
void main() {
  col = vec4(1);
  
  vec2 u = uv;
  u = abs(u) 
    - 0.5/css_contain(vec2(1), canvasR,R);
  ;
  float rect_sdf = max(u.x,u.y);
  rect_sdf = -1.;
  if(rect_sdf >0.)
    col.xyz = vec3(0);

  col.w = 1.;
}