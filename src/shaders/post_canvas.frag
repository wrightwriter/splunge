#pragma glslify: import('./fs_prepend_includes.glsl')

#pragma glslify: import('./_blend.glsl')

in vec2 uv;
out vec4 col;
void main() {
  col = vec4(1);


  col.xyz = texture(canvas_back,uv).xyz;
  vec4 temp_tex = texture(temp_tex,uv);
  // if(temp_tex.w > 0.)
  if(temp_tex.w > 0.000001)
    col = blend_brushstroke(col,temp_tex);
 
    
  col = pow(col,vec4(0.454545454545)); 
}    

  
  
		 