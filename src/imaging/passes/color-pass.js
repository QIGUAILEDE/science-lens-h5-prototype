import { clamp, hexToRgb, lerp, luminance } from "../utils/math.js";

export function applyToneAndChannels(imageData, style, state) {
  const tone = style.tone || {};
  const channels = style.channels || [];
  const data = imageData.data;
  const exposure = tone.exposure ?? 0;
  const contrast = tone.contrast ?? 1;
  const gamma = tone.gamma ?? 1;
  const saturation = tone.saturation ?? 1;
  const blackLevel = tone.blackLevel ?? 0;
  const intensity = state.intensity ?? 1;
  const channelA = channels[0] ? hexToRgb(channels[0].color) : null;
  const channelB = channels[1] ? hexToRgb(channels[1].color) : null;

  for (let i = 0; i < data.length; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];
    const lum = luminance(r, g, b);

    r = (r - 128) * contrast + 128 + exposure * 255 * intensity;
    g = (g - 128) * contrast + 128 + exposure * 255 * intensity;
    b = (b - 128) * contrast + 128 + exposure * 255 * intensity;

    const gray = luminance(r, g, b);
    r = lerp(gray, r, saturation);
    g = lerp(gray, g, saturation);
    b = lerp(gray, b, saturation);

    if (gamma !== 1) {
      r = 255 * Math.pow(Math.max(0, r) / 255, gamma);
      g = 255 * Math.pow(Math.max(0, g) / 255, gamma);
      b = 255 * Math.pow(Math.max(0, b) / 255, gamma);
    }

    if (style.family === "phase") {
      r = lerp(r, 168, 0.38);
      g = lerp(g, 185, 0.38);
      b = lerp(b, 194, 0.38);
    }

    if (style.family === "fluorescence" && channelA && channelB) {
      const structure = Math.max(0, (lum - 24 - blackLevel * 120) / 231);
      const detail = Math.max(0, Math.abs(lum - 128) / 128);
      const a = Math.pow(structure, 1.2) * (channels[0].intensity ?? 0.8);
      const d = Math.pow(detail, 1.5) * (channels[1].intensity ?? 0.65);
      r = channelA.r * a + channelB.r * d;
      g = channelA.g * a + channelB.g * d;
      b = channelA.b * a + channelB.b * d;
    }

    if (style.family === "electron") {
      const metallic = gray * 1.12;
      r = metallic * 0.92;
      g = metallic * 0.96;
      b = metallic;
    }

    if (style.family === "stain") {
      const warm = hexToRgb(style.stain?.primary || "#d980c5");
      const cool = hexToRgb(style.stain?.secondary || "#6dd6e8");
      const split = Math.sin((i / 4) * 0.015) * 0.5 + 0.5;
      r = lerp(r, lerp(warm.r, cool.r, split), 0.32 * intensity);
      g = lerp(g, lerp(warm.g, cool.g, split), 0.32 * intensity);
      b = lerp(b, lerp(warm.b, cool.b, split), 0.32 * intensity);
    }

    data[i] = clamp(r);
    data[i + 1] = clamp(g);
    data[i + 2] = clamp(b);
  }

  return imageData;
}

