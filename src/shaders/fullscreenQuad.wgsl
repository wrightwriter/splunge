
struct VSOut {
  @builtin(position) Position: v4,
  @location(0) uv: v2,
  @location(1)  @interpolate(flat) instance_id: u32,
}



@vertex
fn main(
  @builtin(instance_index) InstanceIndex: u32,
  @builtin(vertex_index) VertexIndex: u32,
) -> VSOut {
  var verts = array<vec2f,6>(
    v2(-1,-1),
    v2(1,-1),
    v2(-1,1),

    v2(1,-1),
    v2(-1,1),
    v2(1,1),
  );
  var vert = verts[VertexIndex];
  var O: VSOut;

  // O.Position = v4(z + v3(0.,0.,0.), 1.);
  O.Position = v4(vert, 0., 1.) ;

  // O.col = inCol;
  O.uv = vert;
  O.instance_id = InstanceIndex;

  return O;
}