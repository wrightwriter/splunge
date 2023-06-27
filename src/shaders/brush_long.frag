#pragma glslify: import('./_top_includes.glsl')
#pragma glslify: import('./_chroma.glsl')
#pragma glslify: import('./_rand.glsl')

uniform int brush_texture_idx;
uniform vec3 tex_hsv_dynamics;
uniform vec2 tex_stretch;

in vec2 uv;
in vec4 vCol;
out vec4 col;
// float sdBox( in vec2 p, in vec2 b ) {
//     vec2 d = abs(p)-b;
//     return length(max(d,0.0)) + min(max(d.x,d.y),0.0);
// }

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
  col = vec4(1);
  // col.xyz = stroke_col.xyz;
  
  vec2 u = uv - 0.5;
  
  vec2 boxSz = vec2(0.49);

  col = vCol;
  {
    col.xyz = srgb_to_oklch(col.xyz);

    vec2 nuv = uv*2120.;
    nuv *= tex_stretch;
    float n = (valueNoise(nuv)*2. - 1.);

    col.z += 5.5*n * tex_hsv_dynamics.z;
    col.x += n * tex_hsv_dynamics.x;
    col.y += n * tex_hsv_dynamics.y;
    // col.x -= valueNoise(uv*120.)*0.6;

    col.x = clamp(col.x, 0., 1.);
    col.y = clamp(col.y, 0., 1.);
    // col.z = clamp(col.z, 0., acos(-1.)*2.);
    col.z = mod(col.z, acos(-1.)*2.);
    col.xyz = oklch_to_srgb(col.xyz);
  }
  
  {
    // col.w = smoothstep(1.,0.,(rect_sdf)/abs(fwidth(rect_sdf)));
    vec2 dx = dFdx(uv.xy);
    vec2 dy = dFdy(uv.xy);
    
    float sd = sdBox(u,boxSz);
    sd = sdBox(u,boxSz - fwidth(sd));
    // float sd = sdBox(u,boxSz);

    float fw = fwidth((sd));
    
    #define render(pos)  (1.-step(0.,sdBox(pos,boxSz)))
        

    
    if(fw < 0.004){
      col.w *= smoothstep(1.,0.,(sd)/fw);
    } else{
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
        
        uvOffsets = uvOffsets * rot(0.25*acos(-1.));
        offsetUV.xy = u.xy + uvOffsets.x * dx + uvOffsets.y * dy;
        w += render(offsetUV.xy);
        offsetUV.xy = u.xy - uvOffsets.x * dx - uvOffsets.y * dy;
        w += render(offsetUV.xy);
        offsetUV.xy = u.xy + uvOffsets.y * dx - uvOffsets.x * dy;
        w += render(offsetUV.xy);
        offsetUV.xy = u.xy - uvOffsets.y * dx + uvOffsets.x * dy;
        w += render(offsetUV.xy);

        w /= 8.;
        col.w *= w;
        //col.x = 1.;
    }

    col.w *= sample_brush_tex(brush_texture_idx, uv).w;
    // col.w *= texture(brush_texture[1],uv,-4.).w;
  }
  // col.xyz = uv.xyx;
  // col.w *= sample_brush_tex(1, uv).w;
  // col.w *= pow(texture(brush_texture[brush_texture_idx],uv).w,1.0);
  // col.xyz /= pow(max(col.w,0.001),0.2);
  // col.w = length(uv - 0.5) < 0.25 ? 1. : 0.; 
  // col.xyz = uv.xyx;

  // col.xyz = texture(canvas,uv).xyz;
}