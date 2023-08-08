
// [[location(0)]] var<in> a_pos : vec2<f32>;
// [[location(1)]] var<in> a_uv : vec2<f32>;

// [[location(0)]] var<out> vUV : vec2<f32>;

// [[builtin(position)]] var<out> Position : vec4<f32>;
// [[builtin(vertex_index)]] var<in> VertexIndex : i32;


struct VSOut {
  @builtin(position) Position: v4,
  @location(0) col: v4,
  @location(1)  @interpolate(flat) instance_id: u32,
}

@vertex
fn main(
  @location(1) inCol: v4,
  @builtin(vertex_index) VertexIndex: u32
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

  O.Position = v4(inPos.xyz + v3(0.,0.,0.), 1.);
  // O.Position = vec4<f32>(pos[VertexIndex], 0.0, 1.0);
  // O.Position = cam.proj * O.Position ;
  // O.Position = viewMat * O.Position ;
  O.col = inCol;
  O.instance_id = InstanceIndex;

  return O;
}