import { clamp01 } from "../../utils/math.js";

export function rgbToHsv(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  let h = 0;
  if (delta !== 0) {
    if (max === r) h = ((g - b) / delta) % 6;
    else if (max === g) h = (b - r) / delta + 2;
    else h = (r - g) / delta + 4;
    h /= 6;
    if (h < 0) h += 1;
  }
  return {
    h,
    s: max === 0 ? 0 : delta / max,
    v: max
  };
}

export function rgbToLab(r, g, b) {
  let x;
  let y;
  let z;
  r = pivotRgb(r / 255);
  g = pivotRgb(g / 255);
  b = pivotRgb(b / 255);
  x = (r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047;
  y = (r * 0.2126 + g * 0.7152 + b * 0.0722) / 1;
  z = (r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883;
  x = pivotXyz(x);
  y = pivotXyz(y);
  z = pivotXyz(z);
  return {
    l: clamp01((116 * y - 16) / 100),
    a: clamp01((500 * (x - y) + 128) / 255),
    b: clamp01((200 * (y - z) + 128) / 255)
  };
}

function pivotRgb(value) {
  return value > 0.04045 ? Math.pow((value + 0.055) / 1.055, 2.4) : value / 12.92;
}

function pivotXyz(value) {
  return value > 0.008856 ? Math.cbrt(value) : 7.787 * value + 16 / 116;
}

