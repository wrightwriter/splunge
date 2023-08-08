      @group(0) @binding(0)
      var<uniform> u: array<v4, 10>;

      @fragment
      fn main(
        @builtin(position) U: v4,
        @location(0) uv: v2,
        ) -> @location(0) v4 {

        var picked_col = v3(u[2][0], u[2][1], u[2][2]);

        picked_col = pow(picked_col,vec3f(0.454545454545));


        var col = vec4f(picked_col,1);
  
        var u = uv - 0.5;
        u = abs(u) - 0.4;
        var rect_sdf = max(u.x,u.y);
        if(rect_sdf >0.){
          col = vec4f(1);
        }

        return col;
      }