
vec2 css_contain(vec2 u, vec2 input_res, vec2 tex_res){
	float input_ratio = (input_res.x/input_res.y);
	float tex_ratio = (tex_res.x/tex_res.y);
	float ratio = input_ratio / tex_ratio;
	
	if(ratio < 1.){
		// gl_Position.x -= ( 1. - 1./ratio)*0.5;
		u.x *= ratio;
	} else {
		// gl_Position.y -= ( 1. - ratio)*0.5;
		u.y /= ratio;
	}
  return u;
}

vec2 ndc_aspect_correct(vec2 u, vec2 r){
	if(r.x < r.y){
		u.y /= r.y/r.x;
	} else {
		u.x /= r.x/r.y;
	}
  return u;
}
