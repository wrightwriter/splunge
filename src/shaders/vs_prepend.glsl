
  gl_Position = vec4(positions[gl_VertexID],0,1);

	if(R.x < R.y){
		gl_Position.y /= R.y/R.x;
	} else {
		gl_Position.x /= R.x/R.y;
	}
