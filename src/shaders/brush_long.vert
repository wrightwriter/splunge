#pragma glslify: import('./vs_prepend_includes.glsl')

layout(location = 0) in vec4 pos;
void main(){
  // gl_Position.xy *= brush_sz;
  gl_Position = vec4(pos.xy,0,1);
  gl_Position.xy *= 0.5;

  uv = gl_Position.xy*0.5 + 0.5;
}  