
#pragma glslify: import('./spectral.glsl')

vec4 blend_brushstroke(vec4 col, vec4 stroke){
  // col.xyz = mix(col.xyz, stroke.xyz, stroke.w); 
  if(stroke.w < 0.99999999)
    col.xyz = spectral_mix(col.xyz, stroke.xyz, stroke.w);
  else
    col.xyz = mix(col.xyz, stroke.xyz, stroke.w);
  
  return col;
}