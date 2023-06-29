#pragma glslify: import('./_top_includes.glsl')
#pragma glslify: import('./_aspect_ratio.glsl')

uniform vec4 colour;
in vec2 uv;
out vec4 col;
void main() {
  col = vec4(1);
  col.xyz = pow(colour.xyz,vec3(0.454545454545));

  vec2 u = uv;
  u = abs(u) - 0.8;
  float rect_sdf = max(u.x,u.y);
  if(rect_sdf >0.)
    col.xyz = vec3(0.5);
  
}
