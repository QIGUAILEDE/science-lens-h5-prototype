import { drawCover, roundedRect } from "../utils/canvas.js";
import { applyToneAndChannels } from "../passes/color-pass.js";
import { applyStructurePass } from "../passes/structure-pass.js";
import { applySensorNoise } from "../passes/noise-pass.js";
import { applyOptics, drawMicroscopeMask } from "../passes/optics-pass.js";
import { WebGLSciencePass } from "../shaders/webgl-science-pass.js";
import { RegionAnalyzer } from "../analysis/region-analyzer.js";

export class ScienceRenderer {
  constructor(canvas, options = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d", { willReadFrequently: true });
    this.size = options.size || 1200;
    try {
      this.webglPass = new WebGLSciencePass();
    } catch (error) {
      console.warn("WebGL science pass unavailable, using Canvas fallback.", error);
      this.webglPass = null;
    }
    this.analyzer = new RegionAnalyzer();
  }

  resize(size) {
    this.size = size;
    this.canvas.width = size;
    this.canvas.height = size;
  }

  render({ source, item, state, text, compareOriginal = false }) {
    this.resize(state.previewSize || 1200);
    const ctx = this.ctx;
    const size = this.size;
    ctx.clearRect(0, 0, size, size);
    ctx.fillStyle = item?.family === "fluorescence" || item?.family === "electron" ? "#030404" : "#f4f1e8";
    ctx.fillRect(0, 0, size, size);

    drawCover(ctx, source, size, {
      zoom: state.zoom,
      offsetX: state.offsetX,
      offsetY: state.offsetY,
      rotation: state.rotation
    });

    if (compareOriginal) {
      this.drawBadge("原图对比");
      return;
    }

    if (item?.type === "science-camera" || item?.type === "planned-camera") {
      this.renderScienceCamera(item, state, text);
    } else if (item?.type === "research-figure") {
      this.renderResearchFigure(item, state, text);
    } else {
      this.renderLegacyTemplate(item, state, text);
    }
  }

  renderScienceCamera(style, state, text) {
    const analysis = this.analyzer.analyze(this.canvas, style, state);
    if (state.debugView && state.debugView !== "final" && analysis.debugCanvases[state.debugView]) {
      this.ctx.imageSmoothingEnabled = false;
      this.ctx.clearRect(0, 0, this.size, this.size);
      this.ctx.drawImage(analysis.debugCanvases[state.debugView], 0, 0, this.size, this.size);
      this.ctx.imageSmoothingEnabled = true;
      this.drawDebugMetadata(state.debugView, analysis);
      return;
    }

    const webglResult = this.webglPass?.render(this.canvas, style, state, analysis);
    if (webglResult) {
      this.ctx.clearRect(0, 0, this.size, this.size);
      this.ctx.drawImage(webglResult, 0, 0, this.size, this.size);
      applyOptics(this.ctx, { ...style, optics: { ...(style.optics || {}), bloom: 0, vignette: 0, scanline: 0 } }, state, this.size);
      this.drawScienceMetadata(style, text);
      return;
    }

    const imageData = this.ctx.getImageData(0, 0, this.size, this.size);
    applyToneAndChannels(imageData, style, state);
    applyStructurePass(imageData, style, state);
    applySensorNoise(imageData, style, state);
    this.ctx.putImageData(imageData, 0, 0);
    applyOptics(this.ctx, style, state, this.size);
    this.drawScienceMetadata(style, text);
  }

  renderLegacyTemplate(template, state, text) {
    const style = convertLegacyTemplate(template);
    this.renderScienceCamera(style, state, text);
    if (template?.category === "journal" || template?.type === "journal" || template?.type === "journal-hybrid") {
      this.drawJournalFrame(template, state, text);
    }
  }

  renderResearchFigure(figure, state, text) {
    const ctx = this.ctx;
    const size = this.size;
    ctx.save();
    ctx.fillStyle = figure.canvas?.background || "#ffffff";
    ctx.fillRect(0, 0, size, size);
    const panels = figure.panels || [];
    panels.forEach((panel) => {
      const x = panel.x * size;
      const y = panel.y * size;
      const w = panel.width * size;
      const h = panel.height * size;
      ctx.save();
      ctx.strokeStyle = "#222";
      ctx.lineWidth = 2;
      ctx.fillStyle = "#f7f7f7";
      ctx.fillRect(x, y, w, h);
      ctx.strokeRect(x, y, w, h);
      ctx.fillStyle = "#111";
      ctx.font = `${Math.max(24, size * 0.035)}px Arial, sans-serif`;
      ctx.fillText(panel.label, x + 12, y + 14);
      ctx.restore();
    });
    ctx.fillStyle = "#111";
    ctx.font = `${Math.max(22, size * 0.024)}px Arial, sans-serif`;
    ctx.fillText(text.title || figure.name, size * 0.04, size * 0.955);
    ctx.restore();
  }

  drawScienceMetadata(style, text) {
    const ctx = this.ctx;
    const size = this.size;
    const dark = style.family === "fluorescence" || style.family === "electron";
    ctx.save();
    ctx.fillStyle = dark ? "rgba(240,250,248,0.88)" : "rgba(20,25,25,0.78)";
    ctx.font = `${Math.max(22, size * 0.022)}px 'SFMono-Regular', Menlo, monospace`;
    ctx.fillText(`${style.index || ""} ${text.title || style.name}`, size * 0.03, size * 0.035);
    ctx.globalAlpha = 0.78;
    ctx.fillText(text.subtitle || style.summary || "", size * 0.03, size * 0.067);
    ctx.fillText(style.frame?.metadata || text.meta || "SIMULATED VIEW", size * 0.03, size * 0.1);
    if (style.family === "electron") {
      ctx.globalAlpha = 1;
      ctx.fillStyle = "rgba(0,0,0,0.72)";
      ctx.fillRect(0, size - size * 0.08, size, size * 0.08);
      ctx.fillStyle = "rgba(255,255,255,0.9)";
      ctx.fillText(text.subtitle || style.frame?.metadata || "SEM-C SIMULATED", size * 0.035, size - size * 0.055);
    }
    ctx.restore();
  }

  drawJournalFrame(template, state, text) {
    const ctx = this.ctx;
    const size = this.size;
    const p = template.params || {};
    const margin = size * 0.06 * (state.cardScale || 1);
    const x = margin;
    const y = margin;
    const w = size - margin * 2;
    const h = size - margin * 2;
    const border = size * (p.border || 0.035);
    const corner = (p.corner || 14) * (size / 600);
    ctx.save();
    ctx.translate(size / 2, size / 2);
    ctx.rotate(((state.cardRotate || 0) * Math.PI) / 180);
    ctx.translate(-size / 2, -size / 2);
    ctx.shadowColor = "rgba(0,0,0,0.18)";
    ctx.shadowBlur = size * 0.022;
    ctx.shadowOffsetY = size * 0.012;
    roundedRect(ctx, x, y, w, h, corner);
    ctx.fillStyle = "rgba(255,255,255,0.08)";
    ctx.fill();
    ctx.shadowColor = "transparent";
    ctx.lineWidth = border;
    ctx.strokeStyle = p.frameColor || "#d12027";
    roundedRect(ctx, x, y, w, h, corner);
    ctx.stroke();
    ctx.fillStyle = p.accentColor || p.frameColor || "#d12027";
    ctx.font = `${size * 0.055}px Georgia, 'Times New Roman', serif`;
    ctx.fillText(text.title || template.name, x + border * 1.6, y + border * 1.35);
    ctx.font = `${size * 0.022}px Arial, sans-serif`;
    ctx.globalAlpha = 0.86;
    ctx.fillText(text.subtitle || "Transparent journal frame", x + border * 1.7, y + size * 0.17);
    ctx.fillText(text.meta || "Vol. 01 / 2026", x + border * 1.7, y + h - size * 0.07);
    this.drawAcrylicHighlight(x, y, w, h, state.reflection ?? 0.5);
    ctx.restore();
  }

  drawAcrylicHighlight(x, y, w, h, amount) {
    const ctx = this.ctx;
    ctx.save();
    ctx.globalAlpha = 0.14 * amount;
    const gradient = ctx.createLinearGradient(x, y, x + w, y + h);
    gradient.addColorStop(0.15, "rgba(255,255,255,0)");
    gradient.addColorStop(0.48, "rgba(255,255,255,0.95)");
    gradient.addColorStop(0.58, "rgba(255,255,255,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(x, y, w, h);
    ctx.restore();
  }

  drawBadge(label) {
    const ctx = this.ctx;
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.62)";
    ctx.fillRect(28, 28, 140, 46);
    ctx.fillStyle = "#fff";
    ctx.font = "22px Arial, sans-serif";
    ctx.fillText(label, 48, 41);
    ctx.restore();
  }

  drawDebugMetadata(view, analysis) {
    const ctx = this.ctx;
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.66)";
    ctx.fillRect(24, 24, this.size * 0.42, 104);
    ctx.fillStyle = "#fff";
    ctx.font = `${Math.max(20, this.size * 0.02)}px 'SFMono-Regular', Menlo, monospace`;
    ctx.fillText(`Debug: ${view}`, 44, 42);
    ctx.globalAlpha = 0.82;
    ctx.fillText(`regions ${analysis.summary.count}`, 44, 74);
    ctx.fillText(`texture ${analysis.summary.meanTexture.toFixed(2)} edge ${analysis.summary.meanEdge.toFixed(2)}`, 44, 106);
    ctx.restore();
  }

  dispose() {
    this.webglPass?.dispose();
    this.analyzer?.clear();
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }
}

function convertLegacyTemplate(template = {}) {
  const p = template.params || {};
  return {
    id: template.id || "legacy",
    index: template.index || "",
    name: template.name || "Legacy Template",
    type: "science-camera",
    family: p.duotone ? "fluorescence" : p.grayscale ? "electron" : p.tint ? "stain" : "phase",
    tone: {
      exposure: p.exposure || 0,
      contrast: p.contrast || 1,
      gamma: 1,
      saturation: p.saturation ?? 1,
      blackLevel: p.blackPoint || 0
    },
    channels: p.duotone
      ? [
          { id: "A", color: p.duotone[0], intensity: 0.8 },
          { id: "B", color: p.duotone[1], intensity: 0.65 }
        ]
      : [],
    stain: { primary: p.tint || "#d980c5", secondary: "#6dd6e8" },
    structure: { amount: p.texture || p.edge || p.glow || 0.18 },
    optics: {
      field: p.mask ? "microscope-circle" : null,
      coverage: p.mask || 0.82,
      bloom: p.glow || 0,
      vignette: p.vignette || 0,
      scanline: p.scanline || 0,
      dust: p.grain || 0
    },
    sensor: {
      readNoise: p.grain || p.colorNoise || 0.006,
      shotNoise: p.noise || 0.01,
      fixedPatternNoise: p.scanline || 0,
      hotPixels: 0
    },
    frame: { metadata: "SCIENTIFIC STYLE / SIMULATED" }
  };
}
