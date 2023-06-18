#pragma glslify: import('./_top_includes.glsl')

#pragma glslify: import('./_blend.glsl')

in vec2 uv;
out vec4 col;
void main() {
  col = vec4(1);


  // col.xyz = texture(canvas_back,uv).xyz;
  col.xyz = texture(canvas_read,uv).xyz;
  // col.z = 1.;
  // col.x = uv.x;
  // col.y = uv.x;
  // vec4 temp_tex = texture(temp_tex,uv);
  vec2 temp_tex_res = vec2(textureSize(temp_tex,0));
  vec4 temp_tex = texture(temp_tex,floor(uv*temp_tex_res)/temp_tex_res + 0.5/temp_tex_res);
  // if(temp_tex.w > 0.)
  if(temp_tex.w > 0.0)
    col = blend_brushstroke(col,temp_tex);
 
    
  col = pow(col,vec4(0.454545454545)); 
}    

  
  
		 