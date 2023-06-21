#pragma glslify: import('./_top_includes.glsl')
#pragma glslify: import('./_aspect_ratio.glsl')

uniform float zoom;
uniform vec2 brush_sz;
out vec2 uv;
void main(){
  gl_Position = vec4(positions[gl_VertexID],0,1);
  uv = gl_Position.xy;
  // gl_Position.xy *= css_contain(brush_sz*0.25*zoom, canvasR,R);
  // gl_Position.xy *= brush_sz*0.5*zoom;
  // gl_Position.xy /= css_contain(vec2(1), canvasR,R);
  gl_Position.xy *= ndc_aspect_correct(brush_sz*0.225*zoom, canvasR);
  gl_Position.xy = css_contain(gl_Position.xy, canvasR,R);
  // gl_Position.xy *= ndc_aspect_correct(vec2(1), canvasR);
}  