      @group(1) @binding(0)
      var tex: texture_2d<f32>;

      @group(0) @binding(1)
      var samp: sampler;

      // @group(0) @binding(6)
      // var brush_tex: texture_2d<f32>;
      @group(0) @binding(5)
      var noise_tex: texture_2d<f32>;

      @group(0) @binding(6)
      var brush_texture_0: texture_2d<f32>;
      @group(0) @binding(7)
      var brush_texture_1: texture_2d<f32>;
      @group(0) @binding(8)
      var brush_texture_2: texture_2d<f32>;
      @group(0) @binding(9)
      var brush_texture_3: texture_2d<f32>;
      @group(0) @binding(10)
      var brush_texture_4: texture_2d<f32>;
      @group(0) @binding(11)
      var brush_texture_5: texture_2d<f32>;
      @group(0) @binding(12)
      var brush_texture_6: texture_2d<f32>;
      
      // struct StrokeParams{
      //   array
      //   a: v4,
      //   b: v4,
      //   c: v4,
      //   d: v4,
      // }
      
      fn sdBox(_p: vec2f, sz: vec2f) -> float{
          var p = abs(_p) - sz;
          return max(p.x,p.y);
      }


      @group(0) @binding(4)
      var<storage, read> stroke_params: array<mat4x4f>;

      struct Out{
        @location(0) col: v4, 
      }
            
      fn sample_brush_tex(idx: int, uv: vec2f, _grit: float) -> vec4f{
        var grit = _grit;
        grit = -grit * 9. - 1.0;
        if(idx == 0){
          return textureSampleBias(brush_texture_0, samp, uv, grit);
        }
        if(idx == 1){
          return textureSampleBias(brush_texture_1, samp, uv, grit);
        }
        if(idx == 2){
          return textureSampleBias(brush_texture_2, samp, uv, grit);
        }
        if(idx == 3){
          return textureSampleBias(brush_texture_3, samp, uv, grit);
        }
        if(idx == 4){
          return textureSampleBias(brush_texture_4, samp, uv, grit);
        }
        if(idx == 5){
          return textureSampleBias(brush_texture_5, samp, uv, grit);
        }
        if(idx == 6){
          return textureSampleBias(brush_texture_6, samp, uv, grit);
        } 
        return vec4f(1,0,0,1);
        // if(idx == 7){
        //   return texture(brush_texture[7],uv);
        // }
        // if(idx == 8){
        //   return texture(brush_texture_8,uv);
        // }
        // if(idx == 9){
        //   return texture(brush_texture_9,uv);
        // }
        // if(idx == 10){
        //   return texture(brush_texture_10,uv);
        // }
        // if(idx == 11){
        //   return texture(brush_texture_11,uv);
        // }
        // if(idx == 12){
        //   return texture(brush_texture_12,uv);
        // }
      }

      fn render(pos: vec2f)->float {
        return (1.-step(0.,sdBox(pos,vec2f(0.49))));
      }


      @fragment
      fn main(
        @builtin(position) U: v4,
        @location(0) inUv: v2,
        @location(1) vCol: v4,
        @location(2) @interpolate(flat) instance_idx: u32,
        ) -> Out  {
        var col = vCol;
        var pi = 3.14159265359;
        var tau = 2.*pi;

        var idx = instance_idx;
        
        var brush_texture_idx = int(stroke_params[idx][0][0]+0.5);
        var tex_hsv_dynamics = v3(stroke_params[idx][0][1], stroke_params[idx][0][2], stroke_params[idx][0][3]);
        // vec2 noise_stretch = vec2(stroke_params[idx][1][0], stroke_params[idx][1][1]);
        var tex_stretch = v2(stroke_params[idx][1][2], stroke_params[idx][1][3]);
        var tex_distort = v2(stroke_params[idx][2][0], stroke_params[idx][2][1]);
        var tex_distort_amt = stroke_params[idx][2][2];
        var tex_grit = stroke_params[idx][2][3];
        
        var uv = inUv;
        
        var u = uv - 0.5;


          // return textureSampleBias(brush_texture_0, samp, uv, grit);
        var noise_tex_sample = (
          textureSampleBias(
            noise_tex,
            samp,
            fract(
              (u - 0.5)*1.*tex_distort
            ),
            -tex_grit * 9.
          ) - 0.5
        );
        

        // col = vCol;
        // {
        var col3 = srgb_to_oklch(col.xyz);

          var n = noise_tex_sample;

          col3.z += 5.5* n.x * tex_hsv_dynamics.z;
          col3.x += n.y * tex_hsv_dynamics.x;
          col3.y += n.z * tex_hsv_dynamics.y;

          col3.x = clamp(col3.x, 0., 1.);
          col3.y = clamp(col3.y, 0., 1.);
          col3.z = fmod(col3.z + tau + tau, tau);
          col3 = oklch_to_srgb(col3);
          col3 = max(col3,vec3f(0));
          // col3 = min(col3,vec3f(1));
        col = v4(col3,col.w);
        
        var dx: vec2f = dpdx(uv.xy);
        var dy: vec2f = dpdy(uv.xy);
        
        
        var boxSz = vec2f(0.49);
        var sd = sdBox(u,boxSz);
        // sd = sdBox(u,boxSz - fwidth(sd)); // ?

        var fw = fwidth(sd);
        
        // #define render(pos)  (1.-step(0.,sdBox(pos,boxSz))
 

        var out: Out;
        var brush_alpha: float = sample_brush_tex(
          brush_texture_idx, 
          clamp(
            ( (uv - 0.5) * tex_stretch 
              + tex_distort_amt * 10.0 * noise_tex_sample.xy
            ) + 0.5, vec2f(0.), vec2f(1.)
          ),
          tex_grit
          // fract(uv*1.)
        ).w;
        
        if(brush_alpha > 0.001){
          if(fw < 0.004){
            col.w *= smoothstep(1.,0.,(sd)/fw);
          } else {
            var w = 0.;
            var _Bias = 1.;
            var uvOffsets = vec2f(0.125, 0.375);
            var offsetUV = vec2f(0.0, 0.0);

            offsetUV = u.xy + uvOffsets.x * dx + uvOffsets.y * dy;
            w += render(offsetUV.xy);
            offsetUV = u.xy - uvOffsets.x * dx - uvOffsets.y * dy;
            w += render(offsetUV.xy);
            offsetUV = u.xy + uvOffsets.y * dx - uvOffsets.x * dy;
            w += render(offsetUV.xy);
            offsetUV = u.xy - uvOffsets.y * dx + uvOffsets.x * dy;
            w += render(offsetUV.xy);
            w *= 1./4.;
            col.w *= w;
            
          }

          col.w *= brush_alpha;
        } else {
          col = vec4f(0);
        }

        out.col = v4(col);
        out.col.w *= vCol.w;
        // out.col = v4(sin(float(idx)));
        // out.col.w = 1.0;
        // out.col = v4(inUv.xyx, 1.0);
        return out;
      }