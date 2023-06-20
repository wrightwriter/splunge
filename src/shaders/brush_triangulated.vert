#pragma glslify: import('./_top_includes.glsl')
out vec2 uv;

layout(location = 0) in vec2 pos;
layout(location = 1) in vec4 col;
out vec4 vCol;
void main(){
  // gl_Position.xy *= brush_sz;
  gl_Position = vec4(pos.xy,0,1);
  
  vCol = col;
  // vCol = vec4(1);

  // uv = pos.zw;
}  