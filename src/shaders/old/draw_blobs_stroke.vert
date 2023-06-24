#pragma glslify: import('./_top_includes.glsl')
out vec2 uv;
#pragma glslify: import('./_rand.glsl')
#pragma glslify: import('./_aspect_ratio.glsl')

void main(){
  seed += uint(frame);
  gl_Position = vec4(positions[gl_VertexID],0,1);
  uv = gl_Position.xy*0.5 + 0.5;

  // gl_Position.xy = ndc_aspect_correct(gl_Position.xy, R);

  // gl_Position.xy *= 0.5;
  // gl_Position.xy *= pressure;
  // gl_Position.xy *= rot(-tilt.y + rot_jitter );
  gl_Position.xy *= ndc_aspect_correct(brush_sz*0.5, canvasR);
  gl_Position.xy *= rot(-tilt.y );
  gl_Position.xy += stroke_pos;

  // gl_Position.xy += panning;
  // gl_Position.xy -= zoom*panning/ndc_aspect_correct(vec2(1), canvasR);
  // gl_Position.xy /= zoom;
  // gl_Position.xy -= panning / css_contain(vec2(1), canvasR, R);
  // gl_Position.xy += pos_jitter;
}  