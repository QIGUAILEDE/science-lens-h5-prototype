import { clamp, luminance } from "../utils/math.js";
import { seedFromString, stableSigned, stableUnit } from "../noise/stable-noise.js";

export function applySensorNoise(imageData, style, state) {
  const sensor = style.sensor || {};
  const seed = seedFromString(`${state.imageId || "demo"}:${style.id}:${state.seed || 1}`);
  const data = imageData.data;
  const read = sensor.readNoise ?? 0;
  const shot = sensor.shotNoise ?? 0;
  const hotPixels = sensor.hotPixels ?? 0;
  const fixedPattern = sensor.fixedPatternNoise ?? 0;

  for (let i = 0; i < data.length; i += 4) {
    const px = i / 4;
    const lum = luminance(data[i], data[i + 1], data[i + 2]) / 255;
    const readNoise = stableSigned(seed, px) * read * 255;
    const shotNoise = stableSigned(seed + 77, px) * Math.sqrt(Math.max(0, lum)) * shot * 255;
    const stripe = stableSigned(seed + 991, Math.floor(px / imageData.width)) * fixedPattern * 255;
    const hot = stableUnit(seed + 123, px) < hotPixels ? 180 : 0;
    const n = readNoise + shotNoise + stripe + hot;
    data[i] = clamp(data[i] + n);
    data[i + 1] = clamp(data[i + 1] + n);
    data[i + 2] = clamp(data[i + 2] + n);
  }

  return imageData;
}

