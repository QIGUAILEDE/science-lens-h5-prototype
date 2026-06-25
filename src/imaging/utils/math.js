export function clamp(value, min = 0, max = 255) {
  return Math.max(min, Math.min(max, value));
}

export function clamp01(value) {
  return clamp(value, 0, 1);
}

export function lerp(a, b, t) {
  return a + (b - a) * clamp01(t);
}

export function hexToRgb(hex) {
  const value = String(hex || "#ffffff").replace("#", "");
  const normalized = value.length === 3 ? value.split("").map((char) => char + char).join("") : value;
  const number = Number.parseInt(normalized, 16);
  return {
    r: (number >> 16) & 255,
    g: (number >> 8) & 255,
    b: number & 255
  };
}

export function luminance(r, g, b) {
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

export function quantize(value, steps) {
  const step = 255 / Math.max(2, steps);
  return Math.round(value / step) * step;
}

