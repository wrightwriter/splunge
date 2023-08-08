

      @group(0) @binding(0)
      var<uniform> u: array<v4, 36>;


struct VSOut {
  @builtin(position) Position: v4,
  @location(0) uv: v2,
}

      @vertex
      fn main(
        // @location(0) inPos: v2,
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

        // gl_Position = vec4(positions[gl_VertexID],0,1);
        // uv = gl_Position.xy;

        // var canvasR = v2(u[0][0], u[0][1]);
        var R = v2(u[0][2], u[0][3]);
        var zoom = u[1][1];
        // var brush_sz = v2(u[3][2], u[3][3]);
        var picker_pos = v2(u[3][0], u[3][1]);

        var pos = inPos.xy;

        pos *= ndc_aspect_correct(vec2f(0.1), R);
        pos += picker_pos;
        pos += ndc_aspect_correct(vec2f(0, 0.25), R);

        var uv = inPos.xy*0.5 + 0.5;


        O.Position = v4(pos, 0.5, 1.);
        O.uv = uv;

        return O;
      }