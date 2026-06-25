import { clamp, luminance } from "../utils/math.js";

export function applyStructurePass(imageData, style, state) {
  const width = imageData.width;
  const height = imageData.height;
  const src = new Uint8ClampedArray(imageData.data);
  const data = imageData.data;
  const amount = (style.structure?.amount ?? 0.2) * (state.intensity ?? 1);

  if (!amount) return imageData;

  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const i = (y * width + x) * 4;
      const left = ((y * width + x - 1) * 4);
      const right = ((y * width + x + 1) * 4);
      const up = (((y - 1) * width + x) * 4);
      const down = (((y + 1) * width + x) * 4);
      const gx = luminance(src[right], src[right + 1], src[right + 2]) - luminance(src[left], src[left + 1], src[left + 2]);
      const gy = luminance(src[down], src[down + 1], src[down + 2]) - luminance(src[up], src[up + 1], src[up + 2]);
      const edge = Math.sqrt(gx * gx + gy * gy);

      if (style.family === "phase") {
        data[i] = clamp(data[i] + gx * amount * 0.7 - edge * amount * 0.08);
        data[i + 1] = clamp(data[i + 1] + gy * amount * 0.5);
        data[i + 2] = clamp(data[i + 2] + edge * amount * 0.18);
      } else if (style.family === "electron") {
        data[i] = clamp(data[i] + edge * amount * 1.15);
        data[i + 1] = clamp(data[i + 1] + edge * amount * 1.15);
        data[i + 2] = clamp(data[i + 2] + edge * amount * 1.25);
      } else {
        data[i] = clamp(data[i] + edge * amount * 0.25);
        data[i + 1] = clamp(data[i + 1] + edge * amount * 0.25);
        data[i + 2] = clamp(data[i + 2] + edge * amount * 0.25);
      }
    }
  }

  return imageData;
}

