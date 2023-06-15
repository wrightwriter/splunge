#pragma glslify: import('./vs_prepend_includes.glsl')
#pragma glslify: import('./_rand.glsl')

uniform vec2 pos_jitter;
uniform float rot_jitter;
void main(){
  seed += uint(frame);
#pragma glslify: import('./vs_prepend.glsl')
  gl_Position.xy *= brush_sz;
  gl_Position.xy *= 0.5;
  gl_Position.xy *= pressure;
  gl_Position.xy *= rot(-tilt.y + rot_jitter );

  uv = gl_Position.xy*0.5 + 0.5;
  gl_Position.xy += stroke_pos;
  gl_Position.xy += pos_jitter;
}  