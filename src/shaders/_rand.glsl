
uint seed = 11425u;

uint hash_u(uint _a) {
   uint a = _a;
   a ^= a >> 16;
   a *= 0x7feb352du;
   a ^= a >> 15;
   a *= 0x846ca68bu;
   a ^= a >> 16;
   return a; 
 }
float hash_f(){ uint s = hash_u(seed); seed = s;return ( float( s ) / float( 0xffffffffu ) ); }
vec2 hash_v2(){ return vec2(hash_f(), hash_f()); }
vec3 hash_v3(){ return vec3(hash_f(), hash_f(), hash_f()); }
vec4 hash_v4(){ return vec4(hash_f(), hash_f(), hash_f(), hash_f()); }

float hash_f_s(uint s){ s = hash_u(s); return ( float( s ) / float( 0xffffffffu ) ); }
// vec2 hash_22_s(uvec2 s){ uint _s = hash_u(s.x) + hash_u(s.y); return vec2(hash_f_s(_s.x), hash_f_s(_s.y)); }
float hash_21_s(ivec2 _s_){ 
  uvec2 s = uvec2(_s_);
  uint _s = hash_u(s.x + hash_u(s.y)) + hash_u(s.y + hash_u(s.x)); 
  return hash_f_s(_s); 
}
// vec3 hash_23_s(){ return vec3(hash_f_s(), hash_f_s(), hash_f_s()); }
// vec4 hash_24_s(){ return vec4(hash_f_s(), hash_f_s(), hash_f_s(), hash_f_s()); }


float valueNoise( in vec2 p ){
    ivec2 i = ivec2(floor( p ));
    vec2 f = fract( p );

    // cubic interpolant
    vec2 u = f*f*(3.0-2.0*f);

    return mix( mix( hash_21_s( i + ivec2(0,0) ), 
                     hash_21_s( i + ivec2(1,0) ), u.x),
                mix( hash_21_s( i + ivec2(0,1) ), 
                     hash_21_s( i + ivec2(1,1) ), u.x), u.y);
}
