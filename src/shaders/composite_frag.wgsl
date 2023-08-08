
      @group(0) @binding(0)
      var<uniform> u: array<v4, 10>;

      @group(0) @binding(1)
      var samp: sampler;

      @group(1) @binding(0)
      var canvas_back: texture_2d<f32>;

      @group(0) @binding(5)
      var temp_tex_0: texture_2d<f32>;
      @group(0) @binding(6)
      var temp_tex_1: texture_2d<f32>;
      @group(0) @binding(7)
      var temp_tex_2: texture_2d<f32>;
      @group(0) @binding(8)
      var temp_tex_3: texture_2d<f32>;
      @group(0) @binding(9)
      var temp_tex_4: texture_2d<f32>;

      @group(0) @binding(10)
      var temp_tex_5: texture_2d<f32>;
      @group(0) @binding(11)
      var temp_tex_6: texture_2d<f32>;
      @group(0) @binding(12)
      var temp_tex_7: texture_2d<f32>;
      @group(0) @binding(13)
      var temp_tex_8: texture_2d<f32>;
      @group(0) @binding(14)
      var temp_tex_9: texture_2d<f32>;
      @group(0) @binding(15)
      var temp_tex_10: texture_2d<f32>;
      @group(0) @binding(16)
      var temp_tex_11: texture_2d<f32>;

      @group(0) @binding(17)
      var temp_tex_12: texture_2d<f32>;
      @group(0) @binding(18)
      var temp_tex_13: texture_2d<f32>;
      @group(0) @binding(19)
      var temp_tex_14: texture_2d<f32>;

      fn load_tex(idx: int, stroke_uv: iv2) -> vec4f{
        if(idx == 0){
          return textureLoad(temp_tex_0, stroke_uv,0);
        } else if(idx == 1){
          return textureLoad(temp_tex_1, stroke_uv,0);
        } else if(idx == 2){
          return textureLoad(temp_tex_2, stroke_uv,0);
        } else if(idx == 3){
          return textureLoad(temp_tex_3, stroke_uv,0);
        } else if(idx == 4){
          return textureLoad(temp_tex_4, stroke_uv,0);
        } else if(idx == 5){
          return textureLoad(temp_tex_5, stroke_uv,0);
        } else if(idx == 6){
          return textureLoad(temp_tex_6, stroke_uv,0);
        } else if(idx == 7){
          return textureLoad(temp_tex_7, stroke_uv,0);
        } else if(idx == 8){
          return textureLoad(temp_tex_8, stroke_uv,0);
        } else if(idx == 9){
          return textureLoad(temp_tex_9, stroke_uv,0);
        } else if(idx == 10){
          return textureLoad(temp_tex_10, stroke_uv,0);
        } else if(idx == 11){
          return textureLoad(temp_tex_11, stroke_uv,0);
        } else if(idx == 12){
          return textureLoad(temp_tex_12, stroke_uv,0);
        } else if(idx == 13){
          return textureLoad(temp_tex_13, stroke_uv,0);
        } else {
          return textureLoad(temp_tex_14, stroke_uv,0);
        }
      }

      @fragment
      fn main(
        @builtin(position) U: v4,
        @location(0) uv: v2,
        ) -> @location(0) v4 {
        var canvasR = v2(u[0][0], u[0][1]);

        var col = textureLoad(canvas_back, iv2(U.xy),0);
        
        var stroke_uv = iv2(vec2f(0., canvasR.y) - vec2f(-U.x,U.y));
        var passes_cnt = int(u[5][0] + 0.5);
        
        col.w = 1.0;

        for(var i = 0; i < min(passes_cnt, 15); i += 1){
          // var stroke = textureLoad(temp_tex, iv2(stroke_uv),0);
          var stroke = load_tex(i, stroke_uv);
          // if(passes_cnt == 2){
            // col.r += 0.001;
            // continue;
          // }
          // if(u[3][3] > 0.){
          if(true){
            if(stroke.w > 0.000001){
              col = blend_brushstroke(
                col,
                stroke,
                1
                // blending_colour_space
              ); 
            }
            col.w = 1.0;
            // col = stroke;
          } else {
            var w = stroke.w;
            stroke = stroke/max(stroke.w,0.001);
            col = mix(col, stroke, w );
            // col += stroke;
            // col.w = 1.0;
            col.w = max(col.w, w);
          }
          col = min(col,vec4f(1));

        }
      
        

        return col;
      }