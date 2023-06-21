
#pragma glslify: import('./spectral.glsl')

#pragma glslify: import('./_chroma.glsl')

vec4 blend_brushstroke(vec4 col, vec4 stroke){
  // col.xyz = mix(col.xyz, stroke.xyz, stroke.w); 
  // if(stroke.w < 0.99999999)
  //   col.xyz = spectral_mix(col.xyz, stroke.xyz, stroke.w);
  // else
    // col.xyz = mix(col.xyz, stroke.xyz, stroke.w);
  col.xyz = srgb_to_oklch( col.xyz );
  stroke.xyz = srgb_to_oklch( stroke.xyz );
  col.xyz = mix(col.xyz, stroke.xyz, min(stroke.w,1.));
  col.xyz = oklch_to_srgb( col.xyz );
  
// vec3 oklch_to_srgb( in vec3 c ) { return oklab2srgb(lch2lab(c)); }

             
  return col; 
}