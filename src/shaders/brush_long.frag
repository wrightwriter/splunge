#pragma glslify: import('./_top_includes.glsl')
#pragma glslify: import('./_chroma.glsl')
#pragma glslify: import('./_rand.glsl')


uniform mat4 brush_params;
// uniform int brush_texture_idx;
// uniform vec3 tex_hsv_dynamics;
// uniform vec2 noise_stretch;
// uniform vec2 tex_stretch;

in vec2 uv;
in vec4 vCol;
out vec4 col;

vec4 sample_brush_tex(int idx, vec2 uv){
  if(idx == 0){
    return texture(brush_texture[0],uv,-1.);
  }
  if(idx == 1){
    return texture(brush_texture[1],uv,-1.);
  }
  if(idx == 2){
    return texture(brush_texture[2],uv,-1.);
  }
  if(idx == 3){
    return texture(brush_texture[3],uv,-1.);
  }
  if(idx == 4){
    return texture(brush_texture[4],uv,-1.);
  }
  if(idx == 5){
    return texture(brush_texture[5],uv,-1.);
  }
  if(idx == 6){
    return texture(brush_texture[6],uv,-1.);
  } 
  // if(idx == 7){
  //   return texture(brush_texture[7],uv);
  // }
  // if(idx == 8){
  //   return texture(brush_texture_8,uv);
  // }
  // if(idx == 9){
  //   return texture(brush_texture_9,uv);
  // }
  // if(idx == 10){
  //   return texture(brush_texture_10,uv);
  // }
  // if(idx == 11){
  //   return texture(brush_texture_11,uv);
  // }
  // if(idx == 12){
  //   return texture(brush_texture_12,uv);
  // }
}

float sdBox(vec2 p, vec2 sz){
    p = abs(p) - sz;
    return max(p.x,p.y);
}
void main() {

  int brush_texture_idx = int(brush_params[0][0]+0.5);
  vec3 tex_hsv_dynamics = vec3(brush_params[0][1], brush_params[0][2], brush_params[0][3]);
  vec2 noise_stretch = vec2(brush_params[1][0], brush_params[1][1]);
  vec2 tex_stretch = vec2(brush_params[1][2], brush_params[0][3]);
  col = vec4(1);
  // col.xyz = stroke_col.xyz;
  
  vec2 u = uv - 0.5;
  
  vec2 boxSz = vec2(0.49);
  
  float pi = 3.14159265359;
  float tau = 2.*pi;

  col = vCol;
  {
    col.xyz = srgb_to_oklch(col.xyz);

    vec2 nuv = uv*2120.;
    nuv *= noise_stretch;
    float n = (valueNoise(nuv)*2. - 1.);

    col.z += 5.5* n * tex_hsv_dynamics.z;
    col.x += n * tex_hsv_dynamics.x;
    col.y += n * tex_hsv_dynamics.y;

    col.x = clamp(col.x, 0., 1.);
    col.y = clamp(col.y, 0., 1.);
    col.z = mod(col.z, tau);
    col.xyz = oklch_to_srgb(col.xyz);
  }
  
  {
    vec2 dx = dFdx(uv.xy);
    vec2 dy = dFdy(uv.xy);
    
    float sd = sdBox(u,boxSz);
    // sd = sdBox(u,boxSz - fwidth(sd)); // ?

    float fw = fwidth((sd));
    
    #define render(pos)  (1.-step(0.,sdBox(pos,boxSz)))
        
    
    float brush_alpha = sample_brush_tex(
      brush_texture_idx, 
      fract(((uv - 0.5) * tex_stretch) + 0.5)
      // fract(uv*4.)
    ).w;

    if(brush_alpha > 0.001){
      if(fw < 0.004){
        col.w *= smoothstep(1.,0.,(sd)/fw);
      } else{
        // col.w *= smoothstep(1.,0.,(sd)/fw);

          float w = 0.;
          float _Bias = 1.;
          vec2 uvOffsets = vec2(0.125, 0.375);
          vec2 offsetUV = vec2(0.0, 0.0);

          offsetUV.xy = u.xy + uvOffsets.x * dx + uvOffsets.y * dy;
          w += render(offsetUV.xy);
          offsetUV.xy = u.xy - uvOffsets.x * dx - uvOffsets.y * dy;
          w += render(offsetUV.xy);
          offsetUV.xy = u.xy + uvOffsets.y * dx - uvOffsets.x * dy;
          w += render(offsetUV.xy);
          offsetUV.xy = u.xy - uvOffsets.y * dx + uvOffsets.x * dy;
          w += render(offsetUV.xy);
          w *= 1./4.;
          col.w *= w;
          
          // uvOffsets = uvOffsets * rot(0.25*acos(-1.));
          // offsetUV.xy = u.xy + uvOffsets.x * dx + uvOffsets.y * dy;
          // w += render(offsetUV.xy);
          // offsetUV.xy = u.xy - uvOffsets.x * dx - uvOffsets.y * dy;
          // w += render(offsetUV.xy);
          // offsetUV.xy = u.xy + uvOffsets.y * dx - uvOffsets.x * dy;
          // w += render(offsetUV.xy);
          // offsetUV.xy = u.xy - uvOffsets.y * dx + uvOffsets.x * dy;
          // w += render(offsetUV.xy);

          // w /= 8.;
          // col.w *= w;
          //col.x = 1.;
      }
      col.w *= brush_alpha;
    } else {
      col = vec4(0);
    }
  }
}