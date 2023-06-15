

vec3 mul3( in mat3 m, in vec3 v ){return vec3(dot(v,m[0]),dot(v,m[1]),dot(v,m[2]));}

vec3 mul3( in vec3 v, in mat3 m ){return mul3(m,v);}

vec3 srgb2oklab(vec3 c) {
    
    mat3 m1 = mat3(
        0.4122214708,0.5363325363,0.0514459929,
        0.2119034982,0.6806995451,0.1073969566,
        0.0883024619,0.2817188376,0.6299787005
    );
    
    vec3 lms = mul3(m1,c);
    
    lms = pow(lms,vec3(1./3.));

    mat3 m2 = mat3(
        +0.2104542553,+0.7936177850,-0.0040720468,
        +1.9779984951,-2.4285922050,+0.4505937099,
        +0.0259040371,+0.7827717662,-0.8086757660
    );
    
    return mul3(m2,lms);
}

vec3 oklab2srgb(vec3 c)
{
    mat3 m1 = mat3(
        1.0000000000,+0.3963377774,+0.2158037573,
        1.0000000000,-0.1055613458,-0.0638541728,
        1.0000000000,-0.0894841775,-1.2914855480
    );

    vec3 lms = mul3(m1,c);
    
    lms = lms * lms * lms;
  
    mat3 m2 = mat3(
        +4.0767416621,-3.3077115913,+0.2309699292,
        -1.2684380046,+2.6097574011,-0.3413193965,
        -0.0041960863,-0.7034186147,+1.7076147010
    );
    return mul3(m2,lms);
}

vec3 lab2lch( in vec3 c ){return vec3(c.x,sqrt((c.y*c.y) + (c.z * c.z)),atan(c.z,c.y));}

vec3 lch2lab( in vec3 c ){return vec3(c.x,c.y*cos(c.z),c.y*sin(c.z));}

vec3 srgb_to_oklch( in vec3 c ) { return lab2lch(srgb2oklab(c)); }
vec3 oklch_to_srgb( in vec3 c ) { return oklab2srgb(lch2lab(c)); }







float luma(vec3 color) { return dot(color, vec3(0.299, 0.587, 0.114)); }

float luma(vec4 color) { return dot(color.rgb, vec3(0.299, 0.587, 0.114)); }

vec4 rgb2cmyki(in vec3 c) { float k = max(max(c.r, c.g), c.b); return min(vec4(c.rgb / k, k), 1.0); }

vec3 cmyki2rgb(in vec4 c) { return c.rgb * c.a; }

vec3 lerpHSV(in vec3 hsv1, in vec3 hsv2, in float rate)
{
    float hue = (mod(mod((hsv2.x-hsv1.x), 1.) + 1.5, 1.)-0.5)*rate + hsv1.x;
    return vec3(hue, mix(hsv1.yz, hsv2.yz, rate));
}

vec3 hsv2rgb(vec3 c)
{
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

vec3 rgb2hsv(vec3 c)
{
    vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
    vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
    vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));

    float d = q.x - min(q.w, q.y);
    float e = 1.0e-10;
    return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
}

vec3 hsv2rgbSmooth( in vec3 hsv )
{
    vec3 rgb = clamp( abs(mod(hsv.x*6.0+vec3(0.0,4.0,2.0),6.0)-3.0)-1.0, 0.0, 1.0 );

    rgb = rgb*rgb*(3.0-2.0*rgb); // cubic smoothing

    return hsv.z * mix( vec3(1.0), rgb, hsv.y);
}

vec3 hueShift(vec3 col, vec3 hsv){
    vec3 h = rgb2hsv(col);
    h.x += hsv.x;

    h.y *= hsv.y;
    h.z *= hsv.z;

    return hsv2rgbSmooth(h);
}
