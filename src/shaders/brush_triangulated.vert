#pragma glslify: import('./vs_prepend_includes.glsl')

layout(location = 0) in vec4 pos;
layout(location = 1) in vec4 col;
out vec4 vCol;
void main(){
  // gl_Position.xy *= brush_sz;
  gl_Position = vec4(pos.xy,0,1);
  
  vCol = col;

  uv = pos.zw;
}  