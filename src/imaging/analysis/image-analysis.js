import { clamp01, luminance } from "../utils/math.js";
import { rgbToHsv, rgbToLab } from "./color-space/conversions.js";

const analysisCache = new WeakMap();

export function analyzeImage(sourceCanvas, options = {}) {
  const size = options.size || 256;
  const bins = options.bins || 32;
  const cacheKey = `${size}:${bins}:${sourceCanvas.width}:${sourceCanvas.height}`;
  const cached = analysisCache.get(sourceCanvas);
  if (cached?.key === cacheKey) return cached.result;

  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(sourceCanvas, 0, 0, size, size);
  const imageData = ctx.getImageData(0, 0, size, size);
  const { data } = imageData;
  const total = size * size;
  const histograms = {
    red: new Array(bins).fill(0),
    green: new Array(bins).fill(0),
    blue: new Array(bins).fill(0),
    luminance: new Array(bins).fill(0),
    hue: new Array(36).fill(0),
    saturation: new Array(bins).fill(0)
  };
  const pixels = [];
  let lumSum = 0;
  let satSum = 0;
  let edgeSum = 0;
  let highlight = 0;
  let shadow = 0;
  const lumValues = new Float32Array(total);
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const index = y * size + x;
      const i = index * 4;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const l = luminance(r, g, b) / 255;
      const hsv = rgbToHsv(r, g, b);
      const lab = rgbToLab(r, g, b);
      lumValues[index] = l;
      lumSum += l;
      satSum += hsv.s;
      if (l > 0.98) highlight += 1;
      if (l < 0.02) shadow += 1;
      histograms.red[Math.min(bins - 1, Math.floor((r / 256) * bins))] += 1;
      histograms.green[Math.min(bins - 1, Math.floor((g / 256) * bins))] += 1;
      histograms.blue[Math.min(bins - 1, Math.floor((b / 256) * bins))] += 1;
      histograms.luminance[Math.min(bins - 1, Math.floor(l * bins))] += 1;
      histograms.saturation[Math.min(bins - 1, Math.floor(hsv.s * bins))] += 1;
      if (hsv.s > 0.18) histograms.hue[Math.min(35, Math.floor(hsv.h * 36))] += 1;
      if ((x + y * size) % 9 === 0) pixels.push({ r, g, b, l, hsv, lab, x: x / size, y: y / size });
    }
  }
  for (let y = 1; y < size - 1; y += 1) {
    for (let x = 1; x < size - 1; x += 1) {
      const index = y * size + x;
      const gx = lumValues[index + 1] - lumValues[index - 1];
      const gy = lumValues[index + size] - lumValues[index - size];
      edgeSum += Math.hypot(gx, gy);
    }
  }
  normalizeHistograms(histograms, total);
  const sortedLum = Array.from(lumValues).sort((a, b) => a - b);
  const dominantColors = dominantColorClusters(pixels, options.k || 8);
  const profiles = buildProfiles(data, size);
  const grids = buildGrids(data, size, options.grid || { columns: 24, rows: 18 });
  const result = {
    image: { width: sourceCanvas.width, height: sourceCanvas.height, aspectRatio: sourceCanvas.width / sourceCanvas.height },
    globalStats: {
      meanLuminance: lumSum / total,
      meanSaturation: satSum / total,
      dynamicRange: percentile(sortedLum, 0.95) - percentile(sortedLum, 0.05),
      highlightClipRatio: highlight / total,
      shadowClipRatio: shadow / total,
      sharpnessScore: clamp01(edgeSum / total * 18),
      edgeDensity: clamp01(edgeSum / total * 10)
    },
    histograms,
    dominantColors,
    profiles,
    grids,
    pixels
  };
  analysisCache.set(sourceCanvas, { key: cacheKey, result });
  return result;
}

function normalizeHistograms(histograms, total) {
  Object.values(histograms).forEach((histogram) => {
    const max = Math.max(1, ...histogram);
    histogram.forEach((value, index) => {
      histogram[index] = value / max;
    });
  });
  histograms.totalPixels = total;
}

function percentile(sorted, ratio) {
  return sorted[Math.min(sorted.length - 1, Math.max(0, Math.floor(sorted.length * ratio)))] || 0;
}

function buildProfiles(data, size) {
  const verticalLuminance = new Array(48).fill(0);
  const verticalSaturation = new Array(48).fill(0);
  const verticalWarmth = new Array(48).fill(0);
  const counts = new Array(48).fill(0);
  for (let y = 0; y < size; y += 1) {
    const row = Math.min(47, Math.floor((y / size) * 48));
    for (let x = 0; x < size; x += 1) {
      const i = (y * size + x) * 4;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      verticalLuminance[row] += luminance(r, g, b) / 255;
      verticalSaturation[row] += rgbToHsv(r, g, b).s;
      verticalWarmth[row] += clamp01((r - b + 255) / 510);
      counts[row] += 1;
    }
  }
  return {
    verticalLuminance: verticalLuminance.map((v, i) => v / Math.max(1, counts[i])),
    verticalSaturation: verticalSaturation.map((v, i) => v / Math.max(1, counts[i])),
    verticalWarmth: verticalWarmth.map((v, i) => v / Math.max(1, counts[i]))
  };
}

function buildGrids(data, size, grid) {
  const columns = grid.columns || 24;
  const rows = grid.rows || 18;
  const makeGrid = () => Array.from({ length: rows }, () => new Array(columns).fill(0));
  const luminanceGrid = makeGrid();
  const saturationGrid = makeGrid();
  const warmthGrid = makeGrid();
  const textureGrid = makeGrid();
  const rgbGrid = Array.from({ length: rows }, () => Array.from({ length: columns }, () => [0, 0, 0, 0]));
  for (let y = 1; y < size - 1; y += 1) {
    for (let x = 1; x < size - 1; x += 1) {
      const col = Math.min(columns - 1, Math.floor((x / size) * columns));
      const row = Math.min(rows - 1, Math.floor((y / size) * rows));
      const i = (y * size + x) * 4;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const l = luminance(r, g, b) / 255;
      const hsv = rgbToHsv(r, g, b);
      const gx = luminance(data[i + 4], data[i + 5], data[i + 6]) - luminance(data[i - 4], data[i - 3], data[i - 2]);
      const gy = luminance(data[i + size * 4], data[i + size * 4 + 1], data[i + size * 4 + 2]) - luminance(data[i - size * 4], data[i - size * 4 + 1], data[i - size * 4 + 2]);
      luminanceGrid[row][col] += l;
      saturationGrid[row][col] += hsv.s;
      warmthGrid[row][col] += clamp01((r - b + 255) / 510);
      textureGrid[row][col] += clamp01(Math.hypot(gx, gy) / 255);
      rgbGrid[row][col][0] += r;
      rgbGrid[row][col][1] += g;
      rgbGrid[row][col][2] += b;
      rgbGrid[row][col][3] += 1;
    }
  }
  [luminanceGrid, saturationGrid, warmthGrid, textureGrid].forEach((map) => normalizeGrid(map, rgbGrid));
  const colorGrid = rgbGrid.map((row) => row.map((cell) => {
    const count = Math.max(1, cell[3]);
    return [cell[0] / count, cell[1] / count, cell[2] / count];
  }));
  return { columns, rows, luminanceGrid, saturationGrid, warmthGrid, textureGrid, colorGrid };
}

function normalizeGrid(map, rgbGrid) {
  map.forEach((row, y) => row.forEach((value, x) => {
    map[y][x] = value / Math.max(1, rgbGrid[y][x][3]);
  }));
}

function dominantColorClusters(pixels, k) {
  const centers = pixels.slice(0, k).map((pixel, index) => pixels[Math.floor((index / k) * pixels.length)] || pixel);
  for (let iter = 0; iter < 7; iter += 1) {
    const groups = centers.map(() => ({ r: 0, g: 0, b: 0, count: 0 }));
    pixels.forEach((pixel) => {
      let best = 0;
      let bestDistance = Infinity;
      centers.forEach((center, index) => {
        const d = (pixel.lab.l - center.lab.l) ** 2 + (pixel.lab.a - center.lab.a) ** 2 + (pixel.lab.b - center.lab.b) ** 2;
        if (d < bestDistance) {
          best = index;
          bestDistance = d;
        }
      });
      groups[best].r += pixel.r;
      groups[best].g += pixel.g;
      groups[best].b += pixel.b;
      groups[best].count += 1;
    });
    groups.forEach((group, index) => {
      if (!group.count) return;
      const r = group.r / group.count;
      const g = group.g / group.count;
      const b = group.b / group.count;
      centers[index] = { r, g, b, lab: rgbToLab(r, g, b) };
    });
  }
  return centers.map((center) => {
    const count = pixels.reduce((sum, pixel) => {
      let best = 0;
      let bestDistance = Infinity;
      centers.forEach((candidate, index) => {
        const d = (pixel.lab.l - candidate.lab.l) ** 2 + (pixel.lab.a - candidate.lab.a) ** 2 + (pixel.lab.b - candidate.lab.b) ** 2;
        if (d < bestDistance) {
          best = index;
          bestDistance = d;
        }
      });
      return sum + (centers[best] === center ? 1 : 0);
    }, 0);
    const rgb = [Math.round(center.r), Math.round(center.g), Math.round(center.b)];
    return { rgb, lab: Object.values(rgbToLab(...rgb)), hex: rgbToHex(rgb), ratio: count / pixels.length };
  }).sort((a, b) => b.ratio - a.ratio);
}

function rgbToHex(rgb) {
  return `#${rgb.map((value) => Math.max(0, Math.min(255, value)).toString(16).padStart(2, "0")).join("")}`;
}
