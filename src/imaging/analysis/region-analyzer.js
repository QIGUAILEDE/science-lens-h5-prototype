import { luminance, clamp01 } from "../utils/math.js";
import { rgbToHsv, rgbToLab } from "./color-space/conversions.js";

export class RegionAnalyzer {
  constructor(options = {}) {
    this.size = options.size || 160;
    this.grid = options.grid || 16;
    this.clusterCount = options.clusterCount || 6;
    this.cache = new Map();
  }

  analyze(sourceCanvas, style, state) {
    const key = `${state.imageId || "demo"}:${style.id}:${sourceCanvas.width}:${sourceCanvas.height}:${state.zoom}:${state.offsetX}:${state.offsetY}:${state.rotation}`;
    if (this.cache.has(key)) return this.cache.get(key);
    const sample = document.createElement("canvas");
    sample.width = this.size;
    sample.height = this.size;
    const ctx = sample.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(sourceCanvas, 0, 0, this.size, this.size);
    const imageData = ctx.getImageData(0, 0, this.size, this.size);
    const pixels = extractPixelFeatures(imageData);
    const regions = buildGridRegions(pixels, this.size, this.grid);
    assignClusters(regions, this.clusterCount);
    const parameterMap = buildParameterMap(pixels, regions, this.size, this.grid, style);
    const debugCanvases = buildDebugCanvases(parameterMap, pixels, this.size);
    const result = {
      width: this.size,
      height: this.size,
      regions,
      parameterMap,
      debugCanvases,
      summary: summarizeRegions(regions)
    };
    this.cache.set(key, result);
    if (this.cache.size > 8) this.cache.delete(this.cache.keys().next().value);
    return result;
  }

  clear() {
    this.cache.clear();
  }
}

function extractPixelFeatures(imageData) {
  const { width, height, data } = imageData;
  const pixels = new Array(width * height);
  const lum = new Float32Array(width * height);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = y * width + x;
      const i = index * 4;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const l = luminance(r, g, b) / 255;
      lum[index] = l;
      const hsv = rgbToHsv(r, g, b);
      const lab = rgbToLab(r, g, b);
      pixels[index] = { x, y, r, g, b, lum: l, hsv, lab, edge: 0, detail: 0, texture: 0, saliency: 0 };
    }
  }
  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const index = y * width + x;
      const gx = lum[index + 1] - lum[index - 1];
      const gy = lum[index + width] - lum[index - width];
      const avg = (
        lum[index - 1] +
        lum[index + 1] +
        lum[index - width] +
        lum[index + width] +
        lum[index - width - 1] +
        lum[index - width + 1] +
        lum[index + width - 1] +
        lum[index + width + 1]
      ) / 8;
      const edge = Math.hypot(gx, gy);
      const detail = Math.abs(lum[index] - avg);
      const dx = (x / width - 0.5) / 0.5;
      const dy = (y / height - 0.5) / 0.5;
      const center = clamp01(1 - Math.hypot(dx, dy));
      pixels[index].edge = clamp01(edge * 4);
      pixels[index].detail = clamp01(detail * 5);
      pixels[index].texture = clamp01(edge * 2.2 + detail * 2);
      pixels[index].saliency = clamp01(center * 0.35 + pixels[index].hsv.s * 0.28 + edge * 1.6 + detail * 1.2);
    }
  }
  return pixels;
}

function buildGridRegions(pixels, size, grid) {
  const regions = [];
  const cell = size / grid;
  for (let gy = 0; gy < grid; gy += 1) {
    for (let gx = 0; gx < grid; gx += 1) {
      const region = {
        id: gy * grid + gx,
        centerX: (gx + 0.5) / grid,
        centerY: (gy + 0.5) / grid,
        pixelCount: 0,
        meanL: 0,
        meanA: 0,
        meanB: 0,
        meanHue: 0,
        meanSaturation: 0,
        meanLuminance: 0,
        textureStrength: 0,
        edgeDensity: 0,
        localContrast: 0,
        saliencyWeight: 0,
        foregroundWeight: 0,
        backgroundWeight: 0,
        clusterId: 0
      };
      const x0 = Math.floor(gx * cell);
      const x1 = Math.floor((gx + 1) * cell);
      const y0 = Math.floor(gy * cell);
      const y1 = Math.floor((gy + 1) * cell);
      for (let y = y0; y < y1; y += 1) {
        for (let x = x0; x < x1; x += 1) {
          const p = pixels[y * size + x];
          region.pixelCount += 1;
          region.meanL += p.lab.l;
          region.meanA += p.lab.a;
          region.meanB += p.lab.b;
          region.meanHue += p.hsv.h;
          region.meanSaturation += p.hsv.s;
          region.meanLuminance += p.lum;
          region.textureStrength += p.texture;
          region.edgeDensity += p.edge;
          region.localContrast += p.detail;
          region.saliencyWeight += p.saliency;
        }
      }
      normalizeRegion(region);
      regions.push(region);
    }
  }
  return regions;
}

function normalizeRegion(region) {
  const inv = 1 / Math.max(1, region.pixelCount);
  region.meanL *= inv;
  region.meanA *= inv;
  region.meanB *= inv;
  region.meanHue *= inv;
  region.meanSaturation *= inv;
  region.meanLuminance *= inv;
  region.textureStrength *= inv;
  region.edgeDensity *= inv;
  region.localContrast *= inv;
  region.saliencyWeight *= inv;
  region.foregroundWeight = clamp01(region.saliencyWeight * 0.8 + region.meanSaturation * 0.2);
  region.backgroundWeight = clamp01(1 - region.foregroundWeight);
}

function assignClusters(regions, count) {
  const centers = regions.slice(0, count).map((region, index) => featureVector(regions[Math.floor((index / count) * regions.length)]));
  for (let iter = 0; iter < 6; iter += 1) {
    const sums = centers.map(() => ({ values: [0, 0, 0, 0, 0, 0], count: 0 }));
    regions.forEach((region) => {
      const fv = featureVector(region);
      let best = 0;
      let bestDistance = Infinity;
      centers.forEach((center, index) => {
        const d = distance(fv, center);
        if (d < bestDistance) {
          best = index;
          bestDistance = d;
        }
      });
      region.clusterId = best;
      sums[best].count += 1;
      fv.forEach((value, i) => {
        sums[best].values[i] += value;
      });
    });
    sums.forEach((sum, index) => {
      if (!sum.count) return;
      centers[index] = sum.values.map((value) => value / sum.count);
    });
  }
}

function featureVector(region) {
  return [region.meanL, region.meanA, region.meanB, region.centerX * 0.35, region.centerY * 0.35, region.textureStrength];
}

function distance(a, b) {
  return a.reduce((sum, value, index) => sum + (value - b[index]) ** 2, 0);
}

function buildParameterMap(pixels, regions, size, grid, style) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  const imageData = ctx.createImageData(size, size);
  const data = imageData.data;
  const cell = size / grid;
  pixels.forEach((p, index) => {
    const gx = Math.min(grid - 1, Math.floor(p.x / cell));
    const gy = Math.min(grid - 1, Math.floor(p.y / cell));
    const region = regions[gy * grid + gx];
    const clusterBias = ((region.clusterId % 6) + 1) / 6;
    const foreground = clamp01(p.saliency * 0.55 + region.foregroundWeight * 0.45);
    const background = 1 - foreground;
    const stainStrength = clamp01(
      p.lum * 0.22 +
        p.hsv.s * 0.24 +
        p.texture * 0.22 +
        foreground * 0.22 +
        clusterBias * 0.1
    );
    const channelA = clamp01((1 - p.edge) * 0.35 + p.lum * 0.28 + foreground * 0.37);
    const channelB = clamp01(p.edge * 0.45 + p.detail * 0.36 + p.texture * 0.19);
    const material = clamp01(region.textureStrength * 0.34 + region.edgeDensity * 0.28 + region.meanSaturation * 0.18 + clusterBias * 0.2);
    const i = index * 4;
    data[i] = Math.round(stainStrength * 255);
    data[i + 1] = Math.round(channelA * 255);
    data[i + 2] = Math.round(channelB * 255);
    data[i + 3] = Math.round(clamp01(material * 0.7 + foreground * 0.3 - background * 0.08) * 255);
  });
  ctx.putImageData(imageData, 0, 0);
  return {
    id: `${style.id}-parameter-map`,
    width: size,
    height: size,
    format: "rgba8",
    minValue: 0,
    maxValue: 1,
    source: "combined",
    canvas
  };
}

function buildDebugCanvases(parameterMap, pixels, size) {
  return {
    parameter: parameterMap.canvas,
    luminance: scalarCanvas(size, (index) => pixels[index].lum),
    edge: scalarCanvas(size, (index) => pixels[index].edge),
    texture: scalarCanvas(size, (index) => pixels[index].texture),
    saliency: scalarCanvas(size, (index) => pixels[index].saliency),
    channelA: channelCanvas(parameterMap.canvas, 1),
    channelB: channelCanvas(parameterMap.canvas, 2),
    stain: channelCanvas(parameterMap.canvas, 0),
    material: channelCanvas(parameterMap.canvas, 3)
  };
}

function scalarCanvas(size, getValue) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  const imageData = ctx.createImageData(size, size);
  const data = imageData.data;
  for (let index = 0; index < size * size; index += 1) {
    const v = Math.round(clamp01(getValue(index)) * 255);
    const i = index * 4;
    data[i] = v;
    data[i + 1] = v;
    data[i + 2] = v;
    data[i + 3] = 255;
  }
  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

function channelCanvas(source, channel) {
  const size = source.width;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  const src = source.getContext("2d", { willReadFrequently: true }).getImageData(0, 0, size, size).data;
  const imageData = ctx.createImageData(size, size);
  const data = imageData.data;
  for (let index = 0; index < size * size; index += 1) {
    const value = src[index * 4 + channel];
    const i = index * 4;
    data[i] = channel === 0 ? value : 0;
    data[i + 1] = channel === 1 ? value : 0;
    data[i + 2] = channel === 2 ? value : channel === 3 ? value : 0;
    data[i + 3] = 255;
  }
  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

function summarizeRegions(regions) {
  return {
    count: regions.length,
    meanTexture: average(regions, "textureStrength"),
    meanSaliency: average(regions, "saliencyWeight"),
    meanEdge: average(regions, "edgeDensity")
  };
}

function average(regions, key) {
  return regions.reduce((sum, region) => sum + region[key], 0) / Math.max(1, regions.length);
}

