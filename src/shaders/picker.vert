#pragma glslify: import('./_top_includes.glsl')
#pragma glslify: import('./_aspect_ratio.glsl')

out vec2 uv;
void main(){
  gl_Position = vec4(positions[gl_VertexID],0,1);
  uv = gl_Position.xy;
  gl_Position.xy *= ndc_aspect_correct(vec2(0.05), R);
  gl_Position.xy += stroke_pos;
}