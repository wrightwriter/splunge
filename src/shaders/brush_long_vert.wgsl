
      struct VSOut {
        @builtin(position) Position: v4,
        @location(0) uv: v2,
        @location(1) col: v4,
        @location(2) @interpolate(flat) instance_idx: u32,
      }
      @group(0) @binding(0)
      var<uniform> u: array<v4, 10>;


      @group(0) @binding(2)
      var<storage, read> stroke_verts: array<v4>;
      @group(0) @binding(3)
      var<storage, read> stroke_cols: array<v4>;

      @vertex
      fn main(
        // @location(0) inPos: v2,
        @builtin(vertex_index) VertexIndex: u32,
        @builtin(instance_index) InstanceIndex: u32,
      ) -> VSOut {
        var O: VSOut;
        // var t = uint( (u[0].x * 2.0) % 150.0 );
        var vert = stroke_verts[VertexIndex];
        var stroke_pos = vert.xy;

        var stroke_col = stroke_cols[VertexIndex];

        var uv = vert.zw;
        // O.Position = v4(inPos.xy, 0., 1.);
        O.Position = v4(stroke_pos, 0.5, 1.);
        // O.Position.y = 1.-O.Position.y;
        O.col = stroke_col;
        // O.col.w = 1.0;
        O.instance_idx = InstanceIndex;
        // O.Position.x += sin(u[0].x)*0.1;

        // O.uv = inPos.xy;
        O.uv = uv;
        return O;
      } 