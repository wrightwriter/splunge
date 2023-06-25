#pragma glslify: import('./_top_includes.glsl')

uniform int brush_texture_idx;

in vec2 uv;
in vec4 vCol;
out vec4 col;
void main() {
  col = vec4(1);
  // col.xyz = stroke_col.xyz;
  
  // vec2 u = uv;
  // u = abs(u) - 2.;
  // float rect_sdf = max(u.x,u.y);
  // float fw = abs(fwidth(rect_sdf));
  // rect_sdf += fw;
  
  // col.w = smoothstep(fw,0.,rect_sdf);

  // col.xyz *= texture(brush_textures[1],uv).xyz;
  // col.w = 1.;
  // col.xyz *= 1.;
  col.w = 1.;

  col = vCol;
  
  // col.xyz = uv.xyx;
  // col.w *= sample_brush_tex(1, uv).w;
  col.w *= sample_brush_tex(brush_texture_idx, uv).w;
  // col.w *= pow(texture(brush_texture[brush_texture_idx],uv).w,1.0);
  // col.xyz /= pow(max(col.w,0.001),0.2);
  // col.w = length(uv - 0.5) < 0.25 ? 1. : 0.; 
  // col.xyz = uv.xyx;

  // col.xyz = texture(canvas,uv).xyz;
}