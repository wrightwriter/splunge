      @group(0) @binding(0)
      var<uniform> u: array<v4, 36>;


      struct VSOut {
        @builtin(position) Position: v4,
        @location(0) uv: v2,
      }

      @vertex
      fn main(
        @builtin(vertex_index) VertexIndex: u32,
      ) -> VSOut {
        var O: VSOut;
        var verts = array<vec2f,6>(
          v2(-1,-1),
          v2(1,-1),
          v2(-1,1),

          v2(1,-1),
          v2(-1,1),
          v2(1,1),
        );
        var inPos = verts[VertexIndex];

        var canvasR = v2(u[0][0], u[0][1]);
        var R = v2(u[0][2], u[0][3]);

        var pos = inPos.xy;

        pos *= vec2f(0.1);

        var aspect_correction: vec2f;
        if (canvasR.x > canvasR.y) {
          aspect_correction.x = canvasR.y / canvasR.x;
          aspect_correction.y = 1.;
        } else {
          aspect_correction.x = 1.;
          aspect_correction.y = canvasR.x / canvasR.y;
        }
        pos *= aspect_correction;
        
        pos = css_contain(pos,canvasR,R);

        var uv = inPos.xy*0.5 + 0.5;

        O.Position = v4(pos, 0.5, 1.);
        O.uv = uv;

        return O;
      }