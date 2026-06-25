import { clamp01, luminance } from "../utils/math.js";
import { drawImageInRect } from "../utils/canvas.js";

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
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#07100e";
  ctx.fillRect(0, 0, size, size);
  ctx.strokeStyle = "rgba(112,225,191,0.22)";
  ctx.lineWidth = 1;
  const points = [];
  for (let i = 0; i < 18; i += 1) {
    const x = size * (0.16 + 0.7 * ((Math.sin(i * 2.17) + 1) / 2));
    const y = size * (0.18 + 0.66 * ((Math.cos(i * 1.73) + 1) / 2));
    points.push([x, y]);
  }
  points.forEach((point, index) => {
    for (let j = index + 1; j < points.length; j += 1) {
      const other = points[j];
      const d = Math.hypot(point[0] - other[0], point[1] - other[1]);
      if (d < size * 0.28) {
        ctx.globalAlpha = 1 - d / (size * 0.3);
        ctx.beginPath();
        ctx.moveTo(point[0], point[1]);
        ctx.lineTo(other[0], other[1]);
        ctx.stroke();
      }
    }
  });
  ctx.globalAlpha = 1;
  points.forEach((point, index) => {
    ctx.fillStyle = index % 3 === 0 ? "#d946ef" : index % 2 === 0 ? "#22d3ee" : "#70e1bf";
    ctx.beginPath();
    ctx.arc(point[0], point[1], size * (0.014 + (index % 4) * 0.003), 0, Math.PI * 2);
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
