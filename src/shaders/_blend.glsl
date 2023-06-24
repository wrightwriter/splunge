
#pragma glslify: import('./spectral.glsl')

#pragma glslify: import('./_chroma.glsl')

vec4 blend_brushstroke(vec4 col, vec4 stroke){
  // col.xyz = mix(col.xyz, stroke.xyz, stroke.w); 
  
  int mode = 0;
  
  if(stroke.w > 0.00000001){
    // float interpolant = stroke.w;
    stroke.xyz = stroke.xyz/max(stroke.w,0.001);
    
    if(mode == 0){
      col.xyz = spectral_mix(col.xyz, stroke.xyz, stroke.w);
      if(stroke.w > 0.99999)
        col.xyz = stroke.xyz;
    } else if(mode == 1){
      col.xyz = srgb_to_oklch( col.xyz );
      stroke.xyz = srgb_to_oklch( stroke.xyz );
      col.xyz = mix(col.xyz, stroke.xyz,stroke.w);
      col.xyz = oklch_to_srgb( col.xyz );
    } else {
      col.xyz = mix(col.xyz, stroke.xyz, stroke.w);
    }
    col.w = max(col.w, stroke.w);
  }

  return col; 
}