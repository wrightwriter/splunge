#pragma glslify: import('./_top_includes.glsl')

#pragma glslify: import('./_blend.glsl')

uniform int blending_colour_space;
in vec2 uv;
out vec4 col;
void main() {
  col = vec4(1);
  

  vec2 tuv = uv;
  vec2 fuv = floor(uv*R)/R;
  ivec2 ifuv = ivec2(uv*canvasR);
  vec2 fruv = fract(uv*canvasR);
  ivec3 st = ivec3(1,1,0);
  col.xyz = mix(
    mix(
      texelFetch(canvas_back,ifuv,0).xyz,
      texelFetch(canvas_back,ifuv + st.xz,0).xyz,
      smoothstep(0.,1.,fruv.x)
    ),
    mix(
      texelFetch(canvas_back,ifuv + st.zy,0).xyz,
      texelFetch(canvas_back,ifuv + st.xy,0).xyz,
      smoothstep(0.,1.,fruv.x)
    ),
    smoothstep(0.,1.,fruv.y)
  ); 
  // col.xyz = texelFetch(canvas_back, ifuv,0).xyz;

  // if(canvas_idx < 0.5 ){
  //   col.xyz = texture(canvas_a,uv).xyz;
  // } else {
  //   col.xyz = texture(canvas_b,uv).xyz; 
  // }
  vec2 temp_tex_res = vec2(textureSize(temp_tex,0));
  vec4 temp_tex = texture(temp_tex,floor(uv*temp_tex_res)/temp_tex_res + 0.5/temp_tex_res);
  // if(temp_tex.w > 0.)
  if(temp_tex.w > 0.0)
    col = blend_brushstroke(col,temp_tex,blending_colour_space);
 
    
  col = pow(col,vec4(0.454545454545)); 
  col.w = 1.;
}    

  
  
		 