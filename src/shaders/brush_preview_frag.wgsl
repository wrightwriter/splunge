

      // @group(0) @binding(4)
      // var<storage, read> stroke_params: array<mat4x4f>;

      @group(0) @binding(0)
      var<uniform> u: array<v4, 10>;

      @fragment
      fn main(
        @builtin(position) U: v4,
        @location(0) uv: v2,
        ) -> @location(0) v4 {

        
        var col = vec4f(1);

        // var canvasR = v2(u[0][0], u[0][1]);
        // var R = v2(u[0][2], u[0][3]);
        
        // var u = uv;
        // u = abs(u) 
        //   - 0.5/css_contain(vec2f(1), canvasR,R);
        // ;
        // var rect_sdf = max(u.x,u.y);
        // rect_sdf = -1.;
        // if(rect_sdf >0.)
        //   col.xyz = vec3(0);
        // col.w = 1.0;

        return col;
      }