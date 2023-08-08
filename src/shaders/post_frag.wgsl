

      @group(0) @binding(4)
      var<storage, read> stroke_params: array<mat4x4f>;

      @group(0) @binding(0)
      var<uniform> u: array<v4, 10>;

      @group(0) @binding(1)
      var samp: sampler;

      @group(1) @binding(0)
      var canvas_tex: texture_2d<f32>;

      @group(2) @binding(0)
      var temp_stroke_tex: texture_2d<f32>;

      @fragment
      fn main(
        @builtin(position) U: v4,
        @location(0) uv: v2,
        @location(1) @interpolate(flat) instance_id: u32,
        // @location(0) inCol: v4
        ) -> @location(0) v4 {
        var uvn = uv*0.5 + 0.5;
        uvn.y = 1. - uvn.y;

        var canvasR = v2(u[0][0], u[0][1]);

        var blending_colour_space = stroke_params[instance_id][3][3];
        
        // var stroke_uv = vec2f(0., canvasR.y) - vec2f(-U.x,U.y);
        // var stroke = textureLoad(temp_tex, iv2(stroke_uv),0);

        // var col = textureLoad(tex, iv2(U.xy),0);
        var col = textureSample(canvas_tex, samp, clamp(uv,v2(0),v2(1 - 1./canvasR)));

        var _uv = uv;
        _uv.y = 1. - _uv.y;
        var stroke = textureSample(temp_stroke_tex, samp, _uv);
        if(stroke.w > 0.000001){
          col = blend_brushstroke(
            col,
            stroke,
            int(blending_colour_space)  
          ); 
        }
        col.w = 1.0;
        // var stroke = textureLoad(temp_tex, iv2(stroke_uv),0);
        // col = mix(col, vec4f(1,0,0,1), stroke.w);
        col = pow(col,v4(0.4545454545454545454545));
        col.w = 1.0;

        return col;
      }