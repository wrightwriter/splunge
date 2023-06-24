#pragma glslify: import('./_top_includes.glsl')

#pragma glslify: import('./_blend.glsl')

in vec2 uv;
out vec4 col;
void main() {
  col = vec4(1);
  

  vec2 tuv = uv;
  vec2 fuv = floor(uv*R)/R;
  vec2 fruv = fract(uv*R);
  vec3 st = vec3(1./R,0);
  col.xyz = mix(
    mix(
      texture(canvas_back,fuv).xyz,
      texture(canvas_back,fuv + st.xz).xyz,
      fruv.x
    ),
    mix(
      texture(canvas_back,fuv + st.zy).xyz,
      texture(canvas_back,fuv + st.xy).xyz,
      fruv.x
    ),
    fruv.y
  ); 

  // if(canvas_idx < 0.5 ){
  //   col.xyz = texture(canvas_a,uv).xyz;
  // } else {
  //   col.xyz = texture(canvas_b,uv).xyz; 
  // }
  vec2 temp_tex_res = vec2(textureSize(temp_tex,0));
  vec4 temp_tex = texture(temp_tex,floor(uv*temp_tex_res)/temp_tex_res + 0.5/temp_tex_res);
  // if(temp_tex.w > 0.)
  if(temp_tex.w > 0.0)
    col = blend_brushstroke(col,temp_tex);
 
    
  col = pow(col,vec4(0.454545454545)); 
  col.w = 1.;
}    

  
  
		 