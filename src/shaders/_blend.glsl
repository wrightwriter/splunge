
#pragma glslify: import('./spectral.glsl')

#pragma glslify: import('./_chroma.glsl')

vec4 blend_brushstroke(vec4 col, vec4 stroke, int blending_colour_space){
  // col.xyz = mix(col.xyz, stroke.xyz, stroke.w); 
  
  int mode = blending_colour_space;
  
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
      col.xy = mix(col.xy, stroke.xy,stroke.w);
      float tau = acos(-1.) * 2.;
      float h_a = stroke.z;
      float h_b = stroke.z + tau;
      float dist_a = abs(col.z - h_a);
      float dist_b = abs(col.z - h_b);
      if(dist_a < dist_b){
        col.z = mix(col.z, h_a, stroke.w);
      } else {
        col.z = mix(col.z, h_b, stroke.w);
      }
      col.z = mod(col.z, tau);

      col.xyz = oklch_to_srgb( col.xyz );
    } else {
      col.xyz = mix(col.xyz, stroke.xyz, stroke.w);
    }
    col.w = max(col.w, stroke.w);
  }

  return col; 
}