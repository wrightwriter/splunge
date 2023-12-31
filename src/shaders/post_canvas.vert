#pragma glslify: import('./_top_includes.glsl')
out vec2 uv;
#pragma glslify: import('./_aspect_ratio.glsl')

uniform float zoom;
uniform vec2 panning;
void main(){
  uv = positions[gl_VertexID];
  uv = uv*0.5 + 0.5;

  gl_Position = vec4(positions[gl_VertexID],0,1);
  gl_Position.xy += panning/css_contain(vec2(1), canvasR, R);
  gl_Position.xy = css_contain(gl_Position.xy, canvasR, R);
  gl_Position.xy *= zoom;
}  
			
