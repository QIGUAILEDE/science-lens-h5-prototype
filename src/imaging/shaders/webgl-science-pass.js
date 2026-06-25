import { hexToRgb } from "../utils/math.js";

const VERTEX_SHADER = `
attribute vec2 a_position;
attribute vec2 a_uv;
varying vec2 v_uv;

void main() {
  v_uv = a_uv;
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

const FRAGMENT_SHADER = `
precision mediump float;

uniform sampler2D u_image;
uniform sampler2D u_parameterMap;
uniform vec2 u_resolution;
uniform int u_family;
uniform bool u_hasParameterMap;
uniform float u_intensity;
uniform float u_spatialVariation;
uniform float u_exposure;
uniform float u_contrast;
uniform float u_gamma;
uniform float u_saturation;
uniform float u_blackLevel;
uniform float u_structureAmount;
uniform float u_bloom;
uniform float u_vignette;
uniform float u_scanline;
uniform float u_seed;
uniform vec3 u_channelA;
uniform vec3 u_channelB;
uniform vec3 u_stainA;
uniform vec3 u_stainB;

varying vec2 v_uv;

float luma(vec3 color) {
  return dot(color, vec3(0.299, 0.587, 0.114));
}

float hash(vec2 p) {
  return fract(sin(dot(p + u_seed, vec2(127.1, 311.7))) * 43758.5453123);
}

vec3 sampleColor(vec2 uv) {
  return texture2D(u_image, clamp(uv, vec2(0.0), vec2(1.0))).rgb;
}

float sampleLuma(vec2 uv) {
  return luma(sampleColor(uv));
}

float blurLuma(vec2 uv, float radius) {
  vec2 px = radius / u_resolution;
  float sum = 0.0;
  sum += sampleLuma(uv) * 0.24;
  sum += sampleLuma(uv + vec2(px.x, 0.0)) * 0.12;
  sum += sampleLuma(uv - vec2(px.x, 0.0)) * 0.12;
  sum += sampleLuma(uv + vec2(0.0, px.y)) * 0.12;
  sum += sampleLuma(uv - vec2(0.0, px.y)) * 0.12;
  sum += sampleLuma(uv + px) * 0.07;
  sum += sampleLuma(uv - px) * 0.07;
  sum += sampleLuma(uv + vec2(px.x, -px.y)) * 0.07;
  sum += sampleLuma(uv + vec2(-px.x, px.y)) * 0.07;
  return sum;
}

vec3 adjustTone(vec3 color) {
  color += u_exposure;
  color = (color - 0.5) * u_contrast + 0.5;
  float gray = luma(color);
  color = mix(vec3(gray), color, u_saturation);
  color = pow(max(color, vec3(0.0)), vec3(max(0.2, u_gamma)));
  return clamp(color, 0.0, 1.0);
}

vec3 applyVignette(vec3 color, vec2 uv) {
  float d = distance(uv, vec2(0.5));
  float v = smoothstep(0.75, 0.22, d);
  return mix(color * (1.0 - u_vignette), color, v);
}

void main() {
  vec2 uv = v_uv;
  vec2 px = 1.0 / u_resolution;
  vec3 src = adjustTone(sampleColor(uv));
  vec4 region = u_hasParameterMap ? texture2D(u_parameterMap, uv) : vec4(0.5, 0.5, 0.5, 0.5);
  float stainMap = region.r;
  float channelAMap = region.g;
  float channelBMap = region.b;
  float materialMap = region.a;
  float variation = u_spatialVariation;
  float y = luma(src);
  float smooth1 = blurLuma(uv, 2.0);
  float smooth2 = blurLuma(uv, 7.0);
  float dog = smooth1 - smooth2;

  float gx = sampleLuma(uv + vec2(px.x, 0.0)) - sampleLuma(uv - vec2(px.x, 0.0));
  float gy = sampleLuma(uv + vec2(0.0, px.y)) - sampleLuma(uv - vec2(0.0, px.y));
  float edge = length(vec2(gx, gy));
  float detail = abs(y - smooth2);
  float highlight = smoothstep(0.66, 1.0, smooth1);
  float darkMask = smoothstep(u_blackLevel + 0.08, u_blackLevel + 0.42, y);
  vec3 result = src;

  if (u_family == 1) {
    float base = mix(y, smooth2, 0.55);
    float localHaloScale = mix(1.0, 0.65 + materialMap * 0.9, variation);
    float positiveHalo = smoothstep(0.008, 0.08, dog * localHaloScale) * (0.22 + stainMap * 0.22);
    float negativeHalo = smoothstep(0.006, 0.075, -dog * localHaloScale) * (0.16 + channelBMap * 0.18);
    float phase = base + positiveHalo - negativeHalo + edge * (0.1 + channelBMap * 0.18) * u_structureAmount;
    vec3 localTint = mix(vec3(0.66, 0.68, 0.64), vec3(0.56, 0.68, 0.78), stainMap);
    result = mix(vec3(phase), localTint * phase + 0.08, 0.26 + variation * 0.18);
  } else if (u_family == 2) {
    float subjectMask = smoothstep(u_blackLevel + 0.1, u_blackLevel + 0.58, smooth2);
    float signalA = pow(max(smooth2 - u_blackLevel, 0.0), 1.18) * subjectMask * mix(1.0, channelAMap * 1.45, variation);
    float signalB = pow(clamp(detail * 5.2 + edge * 2.4, 0.0, 1.0), 1.35) * smoothstep(0.04, 0.38, y) * mix(1.0, channelBMap * 1.6, variation);
    float signalC = highlight * smoothstep(0.45, 0.95, materialMap) * 0.28 * variation;
    vec3 green = u_channelA * signalA;
    vec3 magenta = u_channelB * signalB;
    vec3 cyanWhite = vec3(0.65, 0.9, 1.0) * signalC;
    vec3 bloom = (green + magenta + cyanWhite) * highlight * u_bloom * (0.8 + materialMap * 1.8);
    result = green + magenta + cyanWhite + bloom;
    result *= mix(darkMask, smoothstep(0.03, 0.45, channelAMap + channelBMap), variation);
  } else if (u_family == 3) {
    vec3 normalLike = normalize(vec3(gx * 8.0, gy * 8.0, 0.85));
    vec3 lightDir = normalize(vec3(-0.45, -0.35, 0.85));
    float directional = dot(normalLike, lightDir) * 0.5 + 0.5;
    float micro = clamp(detail * (4.0 + materialMap * 6.0) + edge * (2.0 + channelBMap * 3.4), 0.0, 1.0);
    float materialGray = mix(y, y * (0.72 + materialMap * 0.72) + stainMap * 0.12, variation);
    float surface = materialGray * 0.68 + directional * (0.22 + materialMap * 0.22) + micro * u_structureAmount;
    result = vec3(surface * 0.88, surface * 0.91, surface * 0.96);
    result *= smoothstep(0.03, 0.18, y);
    result += highlight * vec3(0.08, 0.08, 0.1);
  } else if (u_family == 4) {
    float clusterA = smoothstep(0.08, 0.76, smooth2 + dog * 1.4);
    float clusterB = smoothstep(0.18, 0.82, 1.0 - smooth2 + detail * 2.0);
    float textureGate = smoothstep(0.015, 0.18, detail + edge);
    vec3 stain = mix(u_stainA, u_stainB, mix(clusterA, stainMap, variation));
    vec3 diffused = mix(stain, stain * (0.72 + clusterB * 0.36 + materialMap * 0.28), mix(textureGate, channelBMap, variation));
    float penetration = mix(0.42, stainMap * (0.28 + channelAMap * 0.52), variation);
    result = mix(vec3(y), diffused, penetration * u_intensity);
    result = mix(result, src, 0.35);
  }

  float readNoise = (hash(uv * u_resolution + 17.0) - 0.5) * 0.018;
  float shotNoise = (hash(uv * u_resolution + 71.0) - 0.5) * sqrt(max(luma(result), 0.0)) * 0.035;
  result += readNoise + shotNoise;

  if (u_scanline > 0.0) {
    float line = sin(uv.y * u_resolution.y * 3.14159);
    result *= 1.0 - u_scanline * (0.35 + 0.35 * line);
  }

  result = applyVignette(result, uv);
  gl_FragColor = vec4(clamp(result, 0.0, 1.0), 1.0);
}
`;

export class WebGLSciencePass {
  constructor() {
    this.canvas = document.createElement("canvas");
    this.gl = this.canvas.getContext("webgl", {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      preserveDrawingBuffer: true
    });
    this.available = Boolean(this.gl);
    if (!this.available) return;
    this.program = createProgram(this.gl, VERTEX_SHADER, FRAGMENT_SHADER);
    this.locations = getLocations(this.gl, this.program);
    this.texture = this.gl.createTexture();
    this.parameterTexture = this.gl.createTexture();
    this.buffer = this.gl.createBuffer();
    this.setupGeometry();
  }

  setupGeometry() {
    const gl = this.gl;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
        -1, -1, 0, 1,
        1, -1, 1, 1,
        -1, 1, 0, 0,
        -1, 1, 0, 0,
        1, -1, 1, 1,
        1, 1, 1, 0
      ]),
      gl.STATIC_DRAW
    );
  }

  canRender(style) {
    return this.available && ["phase", "fluorescence", "electron", "stain"].includes(style?.family);
  }

  render(sourceCanvas, style, state, analysis = null) {
    if (!this.canRender(style)) return null;
    const gl = this.gl;
    const width = sourceCanvas.width;
    const height = sourceCanvas.height;
    this.canvas.width = width;
    this.canvas.height = height;
    gl.viewport(0, 0, width, height);
    gl.useProgram(this.program);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    gl.enableVertexAttribArray(this.locations.a_position);
    gl.enableVertexAttribArray(this.locations.a_uv);
    gl.vertexAttribPointer(this.locations.a_position, 2, gl.FLOAT, false, 16, 0);
    gl.vertexAttribPointer(this.locations.a_uv, 2, gl.FLOAT, false, 16, 8);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, sourceCanvas);

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.parameterTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    if (analysis?.parameterMap?.canvas) {
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, analysis.parameterMap.canvas);
    } else {
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([128, 128, 128, 128]));
    }

    setUniforms(gl, this.locations, style, state, width, height, Boolean(analysis?.parameterMap?.canvas));
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    gl.flush();
    return this.canvas;
  }

  dispose() {
    if (!this.available) return;
    const gl = this.gl;
    gl.deleteTexture(this.texture);
    gl.deleteTexture(this.parameterTexture);
    gl.deleteBuffer(this.buffer);
    gl.deleteProgram(this.program);
  }
}

function setUniforms(gl, locations, style, state, width, height, hasParameterMap) {
  const tone = style.tone || {};
  const structure = style.structure || {};
  const optics = style.optics || {};
  const channels = style.channels || [];
  const stain = style.stain || {};
  const channelA = rgbUniform(channels[0]?.color || "#42FF78");
  const channelB = rgbUniform(channels[1]?.color || "#C44BFF");
  const stainA = rgbUniform(stain.primary || "#d980c5");
  const stainB = rgbUniform(stain.secondary || "#6dd6e8");

  gl.uniform1i(locations.u_image, 0);
  gl.uniform1i(locations.u_parameterMap, 1);
  gl.uniform2f(locations.u_resolution, width, height);
  gl.uniform1i(locations.u_family, familyId(style.family));
  gl.uniform1i(locations.u_hasParameterMap, hasParameterMap ? 1 : 0);
  gl.uniform1f(locations.u_intensity, state.intensity ?? 1);
  gl.uniform1f(locations.u_spatialVariation, state.spatialVariation ?? 0.55);
  gl.uniform1f(locations.u_exposure, tone.exposure ?? 0);
  gl.uniform1f(locations.u_contrast, tone.contrast ?? 1);
  gl.uniform1f(locations.u_gamma, tone.gamma ?? 1);
  gl.uniform1f(locations.u_saturation, tone.saturation ?? 1);
  gl.uniform1f(locations.u_blackLevel, tone.blackLevel ?? 0);
  gl.uniform1f(locations.u_structureAmount, structure.amount ?? 0.2);
  gl.uniform1f(locations.u_bloom, optics.bloom ?? 0);
  gl.uniform1f(locations.u_vignette, optics.vignette ?? 0);
  gl.uniform1f(locations.u_scanline, optics.scanline ?? 0);
  gl.uniform1f(locations.u_seed, Number(state.seed || 1));
  gl.uniform3f(locations.u_channelA, channelA.r, channelA.g, channelA.b);
  gl.uniform3f(locations.u_channelB, channelB.r, channelB.g, channelB.b);
  gl.uniform3f(locations.u_stainA, stainA.r, stainA.g, stainA.b);
  gl.uniform3f(locations.u_stainB, stainB.r, stainB.g, stainB.b);
}

function rgbUniform(hex) {
  const rgb = hexToRgb(hex);
  return {
    r: rgb.r / 255,
    g: rgb.g / 255,
    b: rgb.b / 255
  };
}

function familyId(family) {
  if (family === "phase") return 1;
  if (family === "fluorescence") return 2;
  if (family === "electron") return 3;
  if (family === "stain") return 4;
  return 0;
}

function getLocations(gl, program) {
  const names = [
    "u_image",
    "u_parameterMap",
    "u_resolution",
    "u_family",
    "u_hasParameterMap",
    "u_intensity",
    "u_spatialVariation",
    "u_exposure",
    "u_contrast",
    "u_gamma",
    "u_saturation",
    "u_blackLevel",
    "u_structureAmount",
    "u_bloom",
    "u_vignette",
    "u_scanline",
    "u_seed",
    "u_channelA",
    "u_channelB",
    "u_stainA",
    "u_stainB"
  ];
  const locations = {
    a_position: gl.getAttribLocation(program, "a_position"),
    a_uv: gl.getAttribLocation(program, "a_uv")
  };
  names.forEach((name) => {
    locations[name] = gl.getUniformLocation(program, name);
  });
  return locations;
}

function createProgram(gl, vertexSource, fragmentSource) {
  const vertex = compileShader(gl, gl.VERTEX_SHADER, vertexSource);
  const fragment = compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
  const program = gl.createProgram();
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error(gl.getProgramInfoLog(program) || "Failed to link WebGL program");
  }
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  return program;
}

function compileShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    throw new Error(gl.getShaderInfoLog(shader) || "Failed to compile WebGL shader");
  }
  return shader;
}
