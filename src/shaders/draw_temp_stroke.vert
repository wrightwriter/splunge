#pragma glslify: import('./vs_prepend_includes.glsl')
void main(){
#pragma glslify: import('./vs_prepend.glsl')
  gl_Position.xy *= brush_sz;
  gl_Position.xy *= 0.5;
  gl_Position.xy *= pressure;
  gl_Position.xy *= rot(-tilt.y);

  uv = gl_Position.xy*0.5 + 0.5;
  gl_Position.xy += stroke_pos;
}  