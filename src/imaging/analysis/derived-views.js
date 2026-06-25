import { clamp01, luminance } from "../utils/math.js";
import { drawImageInRect } from "../utils/canvas.js";
import { analyzeImage } from "./image-analysis.js";

export function createSourceCanvas(source, size = 480) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  drawImageInRect(ctx, source, 0, 0, size, size, { fit: "cover" });
  return canvas;
}

export function createDerivedView(sourceCanvas, mode, options = {}) {
  const size = options.size || sourceCanvas.width;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(sourceCanvas, 0, 0, size, size);

  if (mode === "original") return canvas;
  if (mode === "sample-grid") return drawSampleGrid(canvas, options.grid || 4);
  if (mode === "pixel-grid") return drawAnalysisColorGrid(sourceCanvas, size, options);
  if (mode === "luminance-grid") return drawAnalysisGrid(sourceCanvas, size, "luminanceGrid", "LOCAL LUMINANCE MAP");
  if (mode === "saturation-grid") return drawAnalysisGrid(sourceCanvas, size, "saturationGrid", "LOCAL SATURATION MAP");
  if (mode === "warmth-grid") return drawAnalysisGrid(sourceCanvas, size, "warmthGrid", "WARMTH INDEX MAP");
  if (mode === "texture-grid") return drawAnalysisGrid(sourceCanvas, size, "textureGrid", "STRUCTURE / TEXTURE MAP");
  if (mode === "rgb-histogram") return drawRgbHistogram(sourceCanvas, size);
  if (mode === "hue-histogram") return drawHueHistogram(sourceCanvas, size);
  if (mode === "dominant-colors") return drawDominantColors(sourceCanvas, size);
  if (mode === "vertical-profile") return drawVerticalProfile(sourceCanvas, size);
  if (mode === "lab-scatter") return drawScatter(sourceCanvas, size, "lab");
  if (mode === "sat-lum-scatter") return drawScatter(sourceCanvas, size, "sat-lum");
  if (mode === "summary") return drawAnalysisSummary(sourceCanvas, size);
  if (mode === "heatmap") return drawHeatmap(canvas);
  if (mode === "edge") return drawEdgeMap(canvas);
  if (mode === "contour") return drawContour(canvas);
  if (mode === "superpixel") return drawBlockSegmentation(canvas, 18);
  if (mode === "quantized") return drawBlockSegmentation(canvas, 28);
  if (mode === "statistics") return drawStatistics(sourceCanvas, size);
  if (mode === "model") return drawModelDiagram(sourceCanvas, size);
  if (mode === "channel-green") return drawSingleChannel(canvas, "green");
  if (mode === "channel-magenta") return drawSingleChannel(canvas, "magenta");
  if (mode === "channel-blue") return drawSingleChannel(canvas, "blue");
  return canvas;
}

function drawSampleGrid(canvas, grid) {
  const ctx = canvas.getContext("2d");
  const size = canvas.width;
  ctx.save();
  ctx.strokeStyle = "rgba(255,255,255,0.58)";
  ctx.lineWidth = Math.max(1, size * 0.003);
  for (let i = 1; i < grid; i += 1) {
    const p = (i / grid) * size;
    ctx.beginPath();
    ctx.moveTo(p, 0);
    ctx.lineTo(p, size);
    ctx.moveTo(0, p);
    ctx.lineTo(size, p);
    ctx.stroke();
  }
  ctx.restore();
  drawMapLabel(ctx, `ORIGINAL + ${grid}x${grid} GRID`);
  return canvas;
}

function drawAnalysisColorGrid(sourceCanvas, size, options) {
  const analysis = analyzeImage(sourceCanvas, { grid: options.gridSize || { columns: 24, rows: 18 } });
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  const { colorGrid, columns, rows } = analysis.grids;
  const cellW = size / columns;
  const cellH = size / rows;
  colorGrid.forEach((row, y) => row.forEach((rgb, x) => {
    ctx.fillStyle = `rgb(${rgb[0]},${rgb[1]},${rgb[2]})`;
    ctx.fillRect(x * cellW, y * cellH, cellW + 1, cellH + 1);
  }));
  drawMapLabel(ctx, `${columns}x${rows} MEAN COLOR GRID`);
  return canvas;
}

function drawAnalysisGrid(sourceCanvas, size, key, label) {
  const analysis = analyzeImage(sourceCanvas);
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  const grid = analysis.grids[key];
  const rows = grid.length;
  const columns = grid[0].length;
  const cellW = size / columns;
  const cellH = size / rows;
  grid.forEach((row, y) => row.forEach((value, x) => {
    const rgb = heatColor(value);
    ctx.fillStyle = `rgb(${rgb[0]},${rgb[1]},${rgb[2]})`;
    ctx.fillRect(x * cellW, y * cellH, cellW + 1, cellH + 1);
  }));
  drawColorBar(ctx, size);
  drawMapLabel(ctx, label);
  return canvas;
}

function drawRgbHistogram(sourceCanvas, size) {
  const analysis = analyzeImage(sourceCanvas);
  const canvas = chartCanvas(size, "RGB PIXEL INTENSITY");
  const ctx = canvas.getContext("2d");
  drawLineHistogram(ctx, analysis.histograms.red, "#ef4444", size);
  drawLineHistogram(ctx, analysis.histograms.green, "#22c55e", size);
  drawLineHistogram(ctx, analysis.histograms.blue, "#3b82f6", size);
  drawAxes(ctx, size, "0", "1");
  return canvas;
}

function drawHueHistogram(sourceCanvas, size) {
  const analysis = analyzeImage(sourceCanvas);
  const canvas = chartCanvas(size, "HUE DISTRIBUTION / S > 0.18");
  const ctx = canvas.getContext("2d");
  const hist = analysis.histograms.hue;
  const barW = (size * 0.78) / hist.length;
  hist.forEach((value, index) => {
    ctx.fillStyle = `hsl(${index * 10}, 78%, 54%)`;
    ctx.fillRect(size * 0.1 + index * barW, size * 0.82 - value * size * 0.58, barW * 0.86, value * size * 0.58);
  });
  drawAxes(ctx, size, "0deg", "360deg");
  return canvas;
}

function drawDominantColors(sourceCanvas, size) {
  const analysis = analyzeImage(sourceCanvas, { k: 8 });
  const canvas = chartCanvas(size, "DOMINANT COLORS / K=8");
  const ctx = canvas.getContext("2d");
  analysis.dominantColors.slice(0, 8).forEach((color, index) => {
    const y = size * (0.18 + index * 0.078);
    ctx.fillStyle = color.hex;
    ctx.fillRect(size * 0.09, y, size * 0.16, size * 0.045);
    ctx.fillStyle = "#111827";
    ctx.font = `${size * 0.024}px Menlo, monospace`;
    ctx.fillText(`${color.hex.toUpperCase()}  ${(color.ratio * 100).toFixed(1)}%`, size * 0.29, y + size * 0.011);
    ctx.fillStyle = "rgba(17,24,39,0.12)";
    ctx.fillRect(size * 0.29, y + size * 0.028, size * 0.52, size * 0.012);
    ctx.fillStyle = "#111827";
    ctx.fillRect(size * 0.29, y + size * 0.028, size * 0.52 * color.ratio, size * 0.012);
  });
  return canvas;
}

function drawVerticalProfile(sourceCanvas, size) {
  const analysis = analyzeImage(sourceCanvas);
  const canvas = chartCanvas(size, "VERTICAL COLOR / LUMINANCE PROFILE");
  const ctx = canvas.getContext("2d");
  drawProfile(ctx, analysis.profiles.verticalLuminance, "#111827", size, 0.2);
  drawProfile(ctx, analysis.profiles.verticalSaturation, "#8b5cf6", size, 0.5);
  drawProfile(ctx, analysis.profiles.verticalWarmth, "#ef4444", size, 0.8);
  ctx.fillStyle = "#111827";
  ctx.font = `${size * 0.021}px Menlo, monospace`;
  ctx.fillText("Luminance", size * 0.12, size * 0.9);
  ctx.fillStyle = "#8b5cf6";
  ctx.fillText("Saturation", size * 0.39, size * 0.9);
  ctx.fillStyle = "#ef4444";
  ctx.fillText("Warmth", size * 0.68, size * 0.9);
  return canvas;
}

function drawScatter(sourceCanvas, size, mode) {
  const analysis = analyzeImage(sourceCanvas);
  const canvas = chartCanvas(size, mode === "lab" ? "LAB a*/b* COLOR SCATTER" : "SATURATION / BRIGHTNESS SCATTER");
  const ctx = canvas.getContext("2d");
  analysis.pixels.slice(0, 2400).forEach((pixel) => {
    const x = mode === "lab" ? size * (0.16 + pixel.lab.a * 0.68) : size * (0.16 + pixel.l * 0.68);
    const y = mode === "lab" ? size * (0.82 - pixel.lab.b * 0.62) : size * (0.82 - pixel.hsv.s * 0.62);
    ctx.fillStyle = `rgba(${pixel.r},${pixel.g},${pixel.b},0.38)`;
    ctx.fillRect(x, y, size * 0.006, size * 0.006);
  });
  drawAxes(ctx, size, mode === "lab" ? "green-red" : "brightness", mode === "lab" ? "blue-yellow" : "saturation");
  return canvas;
}

function drawAnalysisSummary(sourceCanvas, size) {
  const analysis = analyzeImage(sourceCanvas);
  const canvas = chartCanvas(size, "IMAGE-DERIVED SUMMARY");
  const ctx = canvas.getContext("2d");
  const rows = [
    ["Image", `${analysis.image.width} x ${analysis.image.height}px`],
    ["Mean luminance", analysis.globalStats.meanLuminance.toFixed(3)],
    ["Mean saturation", analysis.globalStats.meanSaturation.toFixed(3)],
    ["Dynamic range", analysis.globalStats.dynamicRange.toFixed(3)],
    ["Sharpness score", analysis.globalStats.sharpnessScore.toFixed(3)],
    ["Edge density", analysis.globalStats.edgeDensity.toFixed(3)],
    ["Dominant colors", String(analysis.dominantColors.length)]
  ];
  ctx.font = `${size * 0.028}px Menlo, monospace`;
  rows.forEach((row, index) => {
    const y = size * (0.2 + index * 0.075);
    ctx.fillStyle = "#64748b";
    ctx.fillText(row[0], size * 0.09, y);
    ctx.fillStyle = "#111827";
    ctx.fillText(row[1], size * 0.54, y);
  });
  return canvas;
}

function drawHeatmap(canvas) {
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const { data } = imageData;
  for (let i = 0; i < data.length; i += 4) {
    const l = luminance(data[i], data[i + 1], data[i + 2]) / 255;
    const edgeHint = Math.abs(data[i] - data[i + 1]) / 255;
    const value = clamp01(l * 0.7 + edgeHint * 0.3);
    const rgb = heatColor(value);
    data[i] = rgb[0];
    data[i + 1] = rgb[1];
    data[i + 2] = rgb[2];
  }
  ctx.putImageData(imageData, 0, 0);
  drawMapLabel(ctx, "VISUAL HEATMAP");
  return canvas;
}

function drawEdgeMap(canvas) {
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const src = new Uint8ClampedArray(imageData.data);
  const { data, width, height } = imageData;
  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const i = (y * width + x) * 4;
      const l = (xx, yy) => {
        const p = (yy * width + xx) * 4;
        return luminance(src[p], src[p + 1], src[p + 2]);
      };
      const gx = l(x + 1, y) - l(x - 1, y);
      const gy = l(x, y + 1) - l(x, y - 1);
      const edge = Math.min(255, Math.hypot(gx, gy) * 2.6);
      data[i] = edge * 0.75;
      data[i + 1] = edge * 0.95;
      data[i + 2] = edge;
    }
  }
  ctx.putImageData(imageData, 0, 0);
  ctx.globalCompositeOperation = "source-over";
  drawMapLabel(ctx, "EDGE DENSITY");
  return canvas;
}

function drawContour(canvas) {
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const { data } = imageData;
  for (let i = 0; i < data.length; i += 4) {
    const l = luminance(data[i], data[i + 1], data[i + 2]) / 255;
    const band = Math.abs((l * 12) % 1 - 0.5);
    const line = band < 0.055 ? 255 : 20 + l * 110;
    data[i] = line * 0.82;
    data[i + 1] = line * 0.88;
    data[i + 2] = line;
  }
  ctx.putImageData(imageData, 0, 0);
  drawMapLabel(ctx, "PSEUDO CONTOUR");
  return canvas;
}

function drawBlockSegmentation(canvas, cells) {
  const source = canvas;
  const out = document.createElement("canvas");
  out.width = canvas.width;
  out.height = canvas.height;
  const ctx = out.getContext("2d");
  const sample = document.createElement("canvas");
  sample.width = cells;
  sample.height = cells;
  const sampleCtx = sample.getContext("2d", { willReadFrequently: true });
  sampleCtx.drawImage(source, 0, 0, cells, cells);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(sample, 0, 0, out.width, out.height);
  ctx.imageSmoothingEnabled = true;
  ctx.strokeStyle = "rgba(255,255,255,0.18)";
  ctx.lineWidth = 1;
  const step = out.width / cells;
  for (let i = 0; i <= cells; i += 1) {
    ctx.beginPath();
    ctx.moveTo(i * step, 0);
    ctx.lineTo(i * step, out.height);
    ctx.moveTo(0, i * step);
    ctx.lineTo(out.width, i * step);
    ctx.stroke();
  }
  drawMapLabel(ctx, cells < 22 ? "SUPERPIXEL MAP" : "COLOR QUANTIZATION");
  return out;
}

function drawStatistics(sourceCanvas, size) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.fillStyle = "#f8f8f4";
  ctx.fillRect(0, 0, size, size);
  const sample = document.createElement("canvas");
  sample.width = 96;
  sample.height = 96;
  const sctx = sample.getContext("2d", { willReadFrequently: true });
  sctx.drawImage(sourceCanvas, 0, 0, 96, 96);
  const data = sctx.getImageData(0, 0, 96, 96).data;
  const bins = new Array(12).fill(0);
  const rgb = [0, 0, 0];
  for (let i = 0; i < data.length; i += 4) {
    const l = luminance(data[i], data[i + 1], data[i + 2]) / 255;
    bins[Math.min(11, Math.floor(l * 12))] += 1;
    rgb[0] += data[i];
    rgb[1] += data[i + 1];
    rgb[2] += data[i + 2];
  }
  const max = Math.max(...bins);
  ctx.fillStyle = "#111827";
  ctx.font = `${size * 0.052}px Georgia, serif`;
  ctx.fillText("Pixel Statistics", size * 0.08, size * 0.12);
  ctx.font = `${size * 0.025}px Menlo, monospace`;
  ctx.fillText("derived visual metrics / not measurement data", size * 0.08, size * 0.18);
  bins.forEach((value, index) => {
    const x = size * 0.08 + index * size * 0.068;
    const h = (value / max) * size * 0.42;
    ctx.fillStyle = `hsl(${210 - index * 11}, 65%, ${34 + index * 3}%)`;
    ctx.fillRect(x, size * 0.7 - h, size * 0.043, h);
  });
  const total = data.length / 4;
  ["#ef4444", "#22c55e", "#3b82f6"].forEach((color, index) => {
    ctx.fillStyle = color;
    ctx.fillRect(size * 0.08, size * (0.78 + index * 0.055), (rgb[index] / total / 255) * size * 0.58, size * 0.028);
  });
  return canvas;
}

function drawModelDiagram(sourceCanvas, size) {
  const analysis = analyzeImage(sourceCanvas);
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#07100e";
  ctx.fillRect(0, 0, size, size);
  ctx.strokeStyle = "rgba(112,225,191,0.22)";
  ctx.lineWidth = 1;
  const points = analysis.pixels
    .filter((pixel, index) => index % 29 === 0 && (pixel.hsv.s > 0.12 || pixel.l > analysis.globalStats.meanLuminance))
    .slice(0, 22)
    .map((pixel, index) => ({
      x: size * (0.13 + pixel.x * 0.74),
      y: size * (0.18 + pixel.y * 0.62),
      radius: size * (0.009 + pixel.hsv.s * 0.012 + pixel.l * 0.006),
      color: `rgb(${pixel.r},${pixel.g},${pixel.b})`,
      group: index % Math.max(1, analysis.dominantColors.length)
    }));
  points.forEach((point, index) => {
    for (let j = index + 1; j < points.length; j += 1) {
      const other = points[j];
      const d = Math.hypot(point.x - other.x, point.y - other.y);
      if (d < size * 0.24 || point.group === other.group) {
        ctx.globalAlpha = 1 - d / (size * 0.3);
        ctx.beginPath();
        ctx.moveTo(point.x, point.y);
        ctx.lineTo(other.x, other.y);
        ctx.stroke();
      }
    }
  });
  ctx.globalAlpha = 1;
  points.forEach((point) => {
    ctx.fillStyle = point.color;
    ctx.beginPath();
    ctx.arc(point.x, point.y, point.radius, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.font = `${size * 0.042}px Menlo, monospace`;
  ctx.fillText("CONCEPT MODEL", size * 0.07, size * 0.09);
  ctx.font = `${size * 0.022}px Menlo, monospace`;
  ctx.fillText("structure inferred from image style", size * 0.07, size * 0.14);
  return canvas;
}

function drawSingleChannel(canvas, channel) {
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const { data } = imageData;
  const tint = channel === "green" ? [40, 255, 118] : channel === "blue" ? [61, 125, 255] : [204, 75, 255];
  for (let i = 0; i < data.length; i += 4) {
    const l = luminance(data[i], data[i + 1], data[i + 2]) / 255;
    data[i] = tint[0] * l;
    data[i + 1] = tint[1] * l;
    data[i + 2] = tint[2] * l;
  }
  ctx.putImageData(imageData, 0, 0);
  drawMapLabel(ctx, `${channel.toUpperCase()} CHANNEL`);
  return canvas;
}

function heatColor(value) {
  const v = clamp01(value);
  return [
    Math.round(255 * clamp01(v * 2.4 - 0.3)),
    Math.round(255 * clamp01(1.2 - Math.abs(v - 0.55) * 2.2)),
    Math.round(255 * clamp01(1.2 - v * 1.7))
  ];
}

function chartCanvas(size, title) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#fbfaf7";
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = "#111827";
  ctx.font = `${size * 0.042}px Georgia, serif`;
  ctx.fillText(title, size * 0.08, size * 0.09);
  ctx.font = `${size * 0.02}px Menlo, monospace`;
  ctx.fillStyle = "#64748b";
  ctx.fillText("image-derived / normalized 0-1", size * 0.08, size * 0.135);
  return canvas;
}

function drawLineHistogram(ctx, values, color, size) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(2, size * 0.006);
  ctx.beginPath();
  values.forEach((value, index) => {
    const x = size * 0.1 + (index / Math.max(1, values.length - 1)) * size * 0.78;
    const y = size * 0.82 - value * size * 0.58;
    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();
  ctx.restore();
}

function drawProfile(ctx, values, color, size, xOffset) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(2, size * 0.004);
  ctx.beginPath();
  values.forEach((value, index) => {
    const x = size * (xOffset - 0.07 + value * 0.14);
    const y = size * (0.2 + (index / Math.max(1, values.length - 1)) * 0.58);
    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();
  ctx.restore();
}

function drawAxes(ctx, size, xLabel, yLabel) {
  ctx.save();
  ctx.strokeStyle = "rgba(17,24,39,0.42)";
  ctx.lineWidth = Math.max(1, size * 0.002);
  ctx.beginPath();
  ctx.moveTo(size * 0.1, size * 0.82);
  ctx.lineTo(size * 0.9, size * 0.82);
  ctx.moveTo(size * 0.1, size * 0.18);
  ctx.lineTo(size * 0.1, size * 0.82);
  ctx.stroke();
  ctx.fillStyle = "#64748b";
  ctx.font = `${size * 0.019}px Menlo, monospace`;
  ctx.fillText(xLabel, size * 0.1, size * 0.88);
  ctx.fillText(yLabel, size * 0.11, size * 0.17);
  ctx.restore();
}

function drawColorBar(ctx, size) {
  const x = size * 0.78;
  const y = size * 0.2;
  const w = size * 0.035;
  const h = size * 0.56;
  for (let i = 0; i < 80; i += 1) {
    const value = 1 - i / 79;
    const rgb = heatColor(value);
    ctx.fillStyle = `rgb(${rgb[0]},${rgb[1]},${rgb[2]})`;
    ctx.fillRect(x, y + (i / 80) * h, w, h / 80 + 1);
  }
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.font = `${size * 0.018}px Menlo, monospace`;
  ctx.fillText("1", x + w * 1.35, y + size * 0.01);
  ctx.fillText("0", x + w * 1.35, y + h);
}

function drawMapLabel(ctx, text) {
  const size = ctx.canvas.width;
  ctx.save();
  ctx.fillStyle = "rgba(0,0,0,0.62)";
  ctx.fillRect(size * 0.035, size * 0.035, size * 0.43, size * 0.066);
  ctx.fillStyle = "#fff";
  ctx.font = `${size * 0.026}px Menlo, monospace`;
  ctx.fillText(text, size * 0.055, size * 0.058);
  ctx.restore();
}
