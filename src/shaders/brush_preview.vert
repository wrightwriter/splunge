#pragma glslify: import('./_top_includes.glsl')
#pragma glslify: import('./_aspect_ratio.glsl')

uniform float zoom;
uniform vec2 brush_sz;
out vec2 uv;
void main(){
  gl_Position = vec4(positions[gl_VertexID],0,1);
  uv = gl_Position.xy;
  gl_Position.xy *= brush_sz*0.2125*zoom;

  vec2 aspect_correction;
  if (canvasR.x > canvasR.y) {
    aspect_correction.x = canvasR.y / canvasR.x;
    aspect_correction.y = 1.;
  } else {
    aspect_correction.x = 1.;
    aspect_correction.y = canvasR.x / canvasR.y;
  }
  gl_Position.xy *= aspect_correction;
  gl_Position.xy = css_contain(gl_Position.xy,canvasR,R);
}  