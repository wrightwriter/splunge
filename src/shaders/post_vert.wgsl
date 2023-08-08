

      @group(0) @binding(0)
      var<uniform> u: array<v4, 36>;

      @group(0) @binding(1)
      var samp: sampler;

      @group(1) @binding(0)
      var tex: texture_2d<f32>;

struct VSOut {
  @builtin(position) Position: v4,
  @location(0) uv: v2,
  @location(1)  @interpolate(flat) instance_id: u32,
}

      @vertex
      fn main(
        @builtin(vertex_index) VertexIndex: u32,
        @builtin(instance_index) InstanceIndex: u32,
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
        var zoom = u[1][1];
        var panning = v2(u[1][2], u[1][3]);

        var pos = inPos.xy;

        var uv = inPos.xy*0.5 + 0.5;

  // gl_Position = vec4(positions[gl_VertexID],0,1);
        pos += panning/css_contain(vec2f(1), canvasR, R);
        pos = css_contain(pos, canvasR, R);
        pos *= zoom;

        O.Position = v4(pos, 0.5, 1.);
        O.uv = uv;
        O.instance_id = InstanceIndex;

        return O;
      }