#pragma glslify: import('./fs_prepend_includes.glsl')

#pragma glslify: import('./_rand.glsl')

#pragma glslify: import('./_chroma.glsl')


in vec2 uv;
out vec4 col;
void main() {
  col = vec4(1);
  col.xyz = stroke_col.xyz;
  
  {
    col.xyz = srgb_to_oklch(col.xyz);

    vec2 nuv = uv*2120.;
    nuv *= tex_stretch;
    float n = (valueNoise(nuv)*2. - 1.);

    col.z += 5.5*n * tex_lch_dynamics.z;
    col.x += n * tex_lch_dynamics.x;
    col.y += n * tex_lch_dynamics.y;
    // col.x -= valueNoise(uv*120.)*0.6;

    col.x = clamp(col.x, 0., 1.);
    col.y = clamp(col.y, 0., 1.);
    // col.z = clamp(col.z, 0., acos(-1.)*2.);
    col.z = mod(col.z, acos(-1.)*2.);
    col.xyz = oklch_to_srgb(col.xyz);
  }
  
  
  
  vec2 u = uv;
  u = abs(u) - 0.6;
  float rect_sdf = max(u.x,u.y);
  float fw = abs(fwidth(rect_sdf));
  rect_sdf += fw;

  // col.w = smoothstep(fw,0.,rect_sdf)*stroke_opacity;
  col.w = stroke_opacity;
  
  col.xyz *= 1.;

  // col.xyz = texture(canvas,uv).xyz;
}