#pragma glslify: import('./_top_includes.glsl')

#pragma glslify: import('./_blend.glsl')

uniform int blending_colour_space;
in vec2 uv;
out vec4 col;


vec4 sample_tex_mobile(sampler2D tex, vec2 fruv, ivec2 ifuv){
  ivec3 st = ivec3(1,1,0);
  return mix(
    mix(
      texelFetch(tex,ifuv,0),
      texelFetch(tex,ifuv + st.xz,0),
      // smoothstep(0.,1.,fruv.x)
      fruv.x
    ),
    mix(
      texelFetch(tex,ifuv + st.zy,0),
      texelFetch(tex,ifuv + st.xy,0),
      // smoothstep(0.,1.,fruv.x)
      fruv.x
    ),
    // smoothstep(0.,1.,fruv.y)
    fruv.y
  );
}
vec4 sample_tex_desktop(sampler2D tex, vec2 uv){

    vec2 dx = dFdx(uv.xy);
    vec2 dy = dFdy(uv.xy);

    vec2 textureRes = vec2(textureSize(tex,0));

    dx *= clamp( 0.5 * log2(dot(dx * textureRes, dx * textureRes)), 0., 1.);
    dy *= clamp( 0.5 * log2(dot(dy * textureRes, dy * textureRes)), 0., 1.);

    float _Bias = -1.;
    vec2 uvOffsets = vec2(0.125, 0.375);
    vec2 offsetUV = vec2(0.0, 0.0);
    
    vec4 col = vec4(0);
    // supersampled using 2x2 rotated grid
    // half4 col = 0;
    offsetUV.xy = uv.xy + uvOffsets.x * dx + uvOffsets.y * dy;
    col += texture(tex, offsetUV, _Bias);
    offsetUV.xy = uv.xy - uvOffsets.x * dx - uvOffsets.y * dy;
    col += texture(tex, offsetUV, _Bias);
    offsetUV.xy = uv.xy + uvOffsets.y * dx - uvOffsets.x * dy;
    col += texture(tex, offsetUV, _Bias);
    offsetUV.xy = uv.xy - uvOffsets.y * dx + uvOffsets.x * dy;
    col += texture(tex, offsetUV, _Bias);
    col *= 0.25;
    return col;
}
void main() {
  col = vec4(1);
  
  vec4 _temp_tex;
  
  if(is_on_mobile > 0.5){
    ivec2 ifuv = ivec2(uv*canvasR);
    vec2 fruv = fract(uv*canvasR);

    col.xyz = sample_tex_mobile(canvas_back, fruv, ifuv).xyz;
    _temp_tex = sample_tex_mobile(temp_tex, fruv, ifuv);
  } else {
    col.xyz = sample_tex_desktop(canvas_back,uv).xyz;
    // col.xyz = texture(canvas_back, uv).xyz;
    // _temp_tex = texture(temp_tex, uv);    

    ivec2 ifuv = ivec2(uv*canvasR);
    vec2 fruv = fract(uv*canvasR);

    // _temp_tex = sample_tex_desktop(temp_tex,uv);
    // _temp_tex = texelFetch(temp_tex,ivec2(uv*canvasR),0);
    _temp_tex = texture(temp_tex,uv);

    // _temp_tex = sample_tex_mobile(temp_tex, fruv, ifuv);    
  }


  // // if(temp_tex.w > 0.)
  if(_temp_tex.w > 0.0)
    col = blend_brushstroke(
      col,
      _temp_tex,
      blending_colour_space
    );
 
    
  col = pow(col,vec4(0.454545454545)); 
  col.w = 1.;
}    

  
  
		 