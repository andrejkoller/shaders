import type { ShaderId } from "./types";

export const VERTEX_SHADER = `
attribute vec2 a_position;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

/**
 * Shared helpers available to every fragment shader:
 * - containUV(): maps gl_FragCoord to a centered 0..1 square (like CSS object-fit: contain)
 * - sampleMask(uv): alpha of the uploaded icon at uv (0 outside the icon bounds)
 * - maskNormal(uv, texel): fake surface normal derived from the alpha gradient
 * - hash21/hash22/noise21: small pseudo-random / noise utilities
 */
const COMMON_GLSL = `
precision highp float;

uniform sampler2D u_tex;
uniform vec2 u_resolution;
uniform float u_time;
uniform vec2 u_mouse;

vec2 containUV() {
  float scale = min(u_resolution.x, u_resolution.y);
  vec2 centered = (gl_FragCoord.xy - 0.5 * u_resolution) / scale;
  return centered + 0.5;
}

float sampleMask(vec2 uv) {
  if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) return 0.0;
  return texture2D(u_tex, uv).a;
}

vec2 maskNormal(vec2 uv, float texel) {
  float l = sampleMask(uv - vec2(texel, 0.0));
  float r = sampleMask(uv + vec2(texel, 0.0));
  float d = sampleMask(uv - vec2(0.0, texel));
  float u = sampleMask(uv + vec2(0.0, texel));
  return vec2(r - l, u - d);
}

float hash21(vec2 p) {
  p = fract(p * vec2(234.34, 435.345));
  p += dot(p, p + 34.23);
  return fract(p.x * p.y);
}

vec2 hash22(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973));
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.xx + p3.yz) * p3.zy);
}

float noise21(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  float a = hash21(i);
  float b = hash21(i + vec2(1.0, 0.0));
  float c = hash21(i + vec2(0.0, 1.0));
  float d = hash21(i + vec2(1.0, 1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}
`;

const FRAGMENT_MAIN: Record<ShaderId, string> = {
  chrome: `
void main() {
  vec2 uv = containUV();
  float mask = sampleMask(uv);
  if (mask < 0.02) { gl_FragColor = vec4(0.0); return; }

  vec2 n = maskNormal(uv, 2.0 / u_resolution.y) * 9.0;
  vec3 normal = normalize(vec3(n, 1.0));

  float fresnel = pow(1.0 - max(normal.z, 0.0), 3.0);
  float sky = normal.y * 0.5 + 0.5;

  vec3 base = mix(vec3(0.02, 0.02, 0.05), vec3(0.12, 0.22, 0.5), sky);
  vec3 warm = mix(vec3(0.35, 0.12, 0.3), vec3(0.9, 0.55, 0.25), smoothstep(-0.4, 0.6, normal.x));
  vec3 color = mix(base, warm, 0.4 + 0.3 * sin(u_time * 0.3 + normal.x * 3.0));

  float highlight = pow(max(dot(normal, normalize(vec3(sin(u_time * 0.5), 0.6, 0.6))), 0.0), 26.0);
  color += vec3(1.0) * highlight * 1.6;
  color += fresnel * vec3(0.55, 0.65, 1.0);

  gl_FragColor = vec4(color, mask);
}
`,
  metal: `
void main() {
  vec2 uv = containUV();
  float mask = sampleMask(uv);
  if (mask < 0.02) { gl_FragColor = vec4(0.0); return; }

  vec2 n = maskNormal(uv, 2.0 / u_resolution.y) * 10.0;
  vec3 normal = normalize(vec3(n, 1.2));

  float grain = noise21(uv * u_resolution * 0.15) * 0.08;
  float brushed = sin((uv.x + uv.y * 0.15) * 400.0) * 0.03;

  float diffuse = max(dot(normal, normalize(vec3(-0.4, 0.6, 0.7))), 0.0);
  float spec = pow(max(dot(normal, normalize(vec3(sin(u_time * 0.4) * 0.6, 0.7, 0.7))), 0.0), 40.0);

  vec3 silver = mix(vec3(0.12), vec3(0.75), diffuse);
  silver += grain + brushed;
  silver += spec * 1.8;

  gl_FragColor = vec4(silver, mask);
}
`,
  glares: `
void main() {
  vec2 uv = containUV();
  float mask = sampleMask(uv);
  if (mask < 0.02) { gl_FragColor = vec4(0.0); return; }

  vec3 base = vec3(0.05, 0.05, 0.07);
  float glare = 0.0;

  for (int i = 0; i < 3; i++) {
    float fi = float(i);
    float speed = 0.25 + fi * 0.13;
    float offset = fract(u_time * speed + fi * 0.37);
    float pos = mix(-0.4, 1.4, offset);
    float d = (uv.x + uv.y * 0.5) - pos * 1.5;
    glare += smoothstep(0.05, 0.0, abs(d)) * (0.6 - fi * 0.15);
  }

  vec3 color = base + glare * vec3(1.0);
  gl_FragColor = vec4(color, mask);
}
`,
  dither: `
float bayer4x4(vec2 p) {
  int x = int(mod(p.x, 4.0));
  int y = int(mod(p.y, 4.0));
  int index = x + y * 4;
  float m0 = 0.0; float m1 = 8.0; float m2 = 2.0; float m3 = 10.0;
  float m4 = 12.0; float m5 = 4.0; float m6 = 14.0; float m7 = 6.0;
  float m8 = 3.0; float m9 = 11.0; float m10 = 1.0; float m11 = 9.0;
  float m12 = 15.0; float m13 = 7.0; float m14 = 13.0; float m15 = 5.0;
  if (index == 0) return m0 / 16.0;
  if (index == 1) return m1 / 16.0;
  if (index == 2) return m2 / 16.0;
  if (index == 3) return m3 / 16.0;
  if (index == 4) return m4 / 16.0;
  if (index == 5) return m5 / 16.0;
  if (index == 6) return m6 / 16.0;
  if (index == 7) return m7 / 16.0;
  if (index == 8) return m8 / 16.0;
  if (index == 9) return m9 / 16.0;
  if (index == 10) return m10 / 16.0;
  if (index == 11) return m11 / 16.0;
  if (index == 12) return m12 / 16.0;
  if (index == 13) return m13 / 16.0;
  if (index == 14) return m14 / 16.0;
  return m15 / 16.0;
}

void main() {
  vec2 uv = containUV();
  float mask = sampleMask(uv);
  if (mask < 0.02) { gl_FragColor = vec4(0.0); return; }

  vec2 n = maskNormal(uv, 2.0 / u_resolution.y) * 8.0;
  vec3 normal = normalize(vec3(n, 1.0));
  float light = max(dot(normal, normalize(vec3(-0.3, 0.5, 0.8))), 0.0);
  light = light * 0.7 + 0.3 + 0.15 * sin(u_time * 0.6);

  float threshold = bayer4x4(gl_FragCoord.xy);
  float levels = 4.0;
  float shade = floor(light * levels + threshold) / levels;

  vec3 dark = vec3(0.02, 0.02, 0.04);
  vec3 lightColor = vec3(0.9, 0.95, 1.0);
  vec3 color = mix(dark, lightColor, clamp(shade, 0.0, 1.0));

  gl_FragColor = vec4(color, mask);
}
`,
  particles: `
void main() {
  vec2 uv = containUV();
  float cell = 50.0;
  vec2 guv = uv * cell;
  vec2 id = floor(guv);
  vec2 f = fract(guv) - 0.5;

  vec2 rnd = hash22(id);
  float phase = u_time * (0.4 + rnd.x * 0.8) + rnd.y * 6.28318;
  vec2 jitter = vec2(sin(phase), cos(phase * 1.3)) * 0.3;
  float d = length(f - jitter);

  float m = sampleMask(uv);
  float dotShape = smoothstep(0.12, 0.0, d) * m;

  vec3 color = vec3(0.45, 0.85, 1.0) * dotShape;
  gl_FragColor = vec4(color, dotShape);
}
`,
  ripples: `
void main() {
  vec2 uv = containUV();
  vec2 center = vec2(0.5);
  float dist = length(uv - center);

  float ripple = sin(dist * 40.0 - u_time * 3.0) * 0.015 * smoothstep(0.6, 0.0, dist);
  vec2 dir = normalize(uv - center + 1e-5);
  vec2 rippleUv = uv + dir * ripple;

  float maskR = sampleMask(rippleUv + dir * 0.003);
  float maskG = sampleMask(rippleUv);
  float maskB = sampleMask(rippleUv - dir * 0.003);

  if (maskG < 0.02 && maskR < 0.02 && maskB < 0.02) { gl_FragColor = vec4(0.0); return; }

  vec3 color = mix(vec3(0.1, 0.5, 0.9), vec3(0.95), maskG);
  color.r *= 0.7 + maskR * 0.3;
  color.b *= 0.7 + maskB * 0.3;
  float glow = smoothstep(0.05, 0.0, abs(ripple)) * 0.3;
  color += glow;

  gl_FragColor = vec4(color, maskG);
}
`,
  ascii: `
void main() {
  vec2 uv = containUV();
  float cell = 26.0;
  vec2 guv = uv * cell;
  vec2 id = floor(guv);
  vec2 cellUv = fract(guv) - 0.5;

  vec2 sampleUv = (id + 0.5) / cell;
  float mask = sampleMask(sampleUv);

  float d = length(cellUv);
  float glyph = 0.0;

  if (mask > 0.85) {
    glyph = 1.0 - smoothstep(0.08, 0.12, abs(abs(cellUv.x) - abs(cellUv.y)));
  } else if (mask > 0.6) {
    glyph = 1.0 - smoothstep(0.08, 0.12, min(abs(cellUv.x), abs(cellUv.y)));
  } else if (mask > 0.35) {
    glyph = 1.0 - smoothstep(0.05, 0.09, abs(cellUv.x + cellUv.y));
  } else if (mask > 0.12) {
    glyph = 1.0 - smoothstep(0.06, 0.1, d);
  }

  vec3 color = vec3(0.3, 1.0, 0.5) * glyph;
  gl_FragColor = vec4(color, glyph);
}
`,
  lines: `
void main() {
  vec2 uv = containUV();
  float mask = sampleMask(uv);
  if (mask < 0.02) { gl_FragColor = vec4(0.0); return; }

  vec2 n = maskNormal(uv, 2.0 / u_resolution.y) * 8.0;
  vec3 normal = normalize(vec3(n, 1.0));
  float light = max(dot(normal, normalize(vec3(-0.3, 0.6, 0.7))), 0.0);

  float freq = mix(50.0, 140.0, light);
  float phase = (uv.x * 0.4 + uv.y) * freq - u_time * 3.0;
  float w = 0.5 + 0.5 * sin(phase);
  float thickness = mix(0.15, 0.55, light);
  float lineMask = smoothstep(1.0 - thickness, 1.0, w);

  vec3 color = vec3(lineMask);
  gl_FragColor = vec4(color, mask);
}
`,
};

export function buildFragmentShader(id: ShaderId): string {
  return COMMON_GLSL + FRAGMENT_MAIN[id];
}
