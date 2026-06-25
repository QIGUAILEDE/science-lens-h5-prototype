import { drawCover, drawImageInRect, roundedRect } from "../utils/canvas.js";
import { applyToneAndChannels } from "../passes/color-pass.js";
import { applyStructurePass } from "../passes/structure-pass.js";
import { applySensorNoise } from "../passes/noise-pass.js";
import { applyOptics, drawMicroscopeMask } from "../passes/optics-pass.js";
import { WebGLSciencePass } from "../shaders/webgl-science-pass.js";
import { RegionAnalyzer } from "../analysis/region-analyzer.js";
import { createDerivedView, createSourceCanvas } from "../analysis/derived-views.js";

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

  render({ source, sources = null, item, state, text, compareOriginal = false }) {
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
      this.renderResearchFigure(item, state, text, sources?.length ? sources : [source]);
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

  renderResearchFigure(figure, state, text, sources) {
    const ctx = this.ctx;
    const size = this.size;
    const sourceCanvases = sources.map((source) => createSourceCanvas(source, Math.min(720, size)));
    const sourceCanvas = sourceCanvases[0];
    ctx.save();
    ctx.fillStyle = figure.canvas?.background || "#ffffff";
    ctx.fillRect(0, 0, size, size);
    if (figure.canvas?.background === "transparent") ctx.clearRect(0, 0, size, size);

    ctx.strokeStyle = figure.canvas?.background === "#050506" ? "rgba(255,255,255,0.16)" : "rgba(0,0,0,0.12)";
    ctx.lineWidth = Math.max(1, size * 0.0015);
    ctx.strokeRect(size * 0.025, size * 0.025, size * 0.95, size * 0.91);

    const panels = figure.panels || [];
    panels.forEach((panel, index) => {
      const x = panel.x * size;
      const y = panel.y * size;
      const w = panel.width * size;
      const h = panel.height * size;
      const mode = panel.analysisMode || (figure.analysisModes || [])[index] || "original";
      const baseSource = sourceCanvases[index % sourceCanvases.length] || sourceCanvas;
      const panelSource = mode === "original" ? baseSource : createDerivedView(baseSource, mode, { size: 480 });
      this.drawFigurePanel(panelSource, panel, x, y, w, h, figure);
    });
    this.drawFigureAnnotations(figure, size);
    ctx.fillStyle = "#111";
    if (figure.canvas?.background === "#050506") ctx.fillStyle = "#f5f7fb";
    ctx.font = `${Math.max(22, size * 0.024)}px Arial, sans-serif`;
    ctx.fillText(text.title || figure.name, size * 0.04, size * 0.952);
    ctx.font = `${Math.max(16, size * 0.016)}px Arial, sans-serif`;
    ctx.globalAlpha = 0.72;
    ctx.fillText(text.subtitle || figure.legend?.text || "derived visual figure / pseudo analysis", size * 0.04, size * 0.978);
    ctx.restore();
  }

  drawFigurePanel(source, panel, x, y, w, h, figure) {
    const ctx = this.ctx;
    const dark = figure.canvas?.background === "#050506";
    ctx.save();
    ctx.fillStyle = dark ? "#050607" : "#f7f7f7";
    ctx.fillRect(x, y, w, h);
    drawImageInRect(ctx, source, x, y, w, h, { fit: panel.fit || "cover", radius: 0 });
    ctx.strokeStyle = dark ? "rgba(255,255,255,0.65)" : "rgba(0,0,0,0.72)";
    ctx.lineWidth = Math.max(1.2, this.size * 0.0018);
    ctx.strokeRect(x, y, w, h);
    ctx.fillStyle = dark ? "#fff" : "#111";
    ctx.font = `700 ${Math.max(26, this.size * 0.034)}px Arial, sans-serif`;
    ctx.fillText(panel.label, x + this.size * 0.012, y + this.size * 0.035);
    if (panel.caption) {
      ctx.font = `${Math.max(13, this.size * 0.014)}px Arial, sans-serif`;
      ctx.globalAlpha = 0.78;
      ctx.fillText(panel.caption, x + this.size * 0.012, y + h - this.size * 0.018);
    }
    ctx.restore();
  }

  drawFigureAnnotations(figure, size) {
    const ctx = this.ctx;
    (figure.annotations || []).forEach((annotation) => {
      ctx.save();
      ctx.strokeStyle = annotation.color || "#f43f5e";
      ctx.fillStyle = annotation.color || "#f43f5e";
      ctx.lineWidth = Math.max(2, size * 0.003);
      if (annotation.type === "dashed-rect") {
        ctx.setLineDash([size * 0.014, size * 0.01]);
        ctx.strokeRect(size * 0.18, size * 0.24, size * 0.18, size * 0.16);
      } else if (annotation.type === "arrow") {
        const x1 = size * (annotation.x1 ?? 0.36);
        const y1 = size * (annotation.y1 ?? 0.32);
        const x2 = size * (annotation.x2 ?? 0.52);
        const y2 = size * (annotation.y2 ?? 0.24);
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(x2, y2, size * 0.008, 0, Math.PI * 2);
        ctx.fill();
      } else if (annotation.type === "scale-bar") {
        const x = size * (annotation.x ?? 0.72);
        const y = size * (annotation.y ?? 0.78);
        ctx.strokeStyle = annotation.color || "#fff";
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + size * 0.12, y);
        ctx.stroke();
        ctx.font = `${Math.max(12, size * 0.014)}px Menlo, monospace`;
        ctx.fillText(annotation.label || "VISUAL SCALE", x, y - size * 0.012);
      }
      ctx.restore();
    });
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
    const margin = size * (p.margin ?? 0.055) * (state.cardScale || 1);
    const x = margin;
    const y = margin;
    const w = size - margin * 2;
    const h = size - margin * 2;
    const border = size * (p.border || 0.035);
    const corner = (p.corner || 14) * (size / 600);
    const logo = resolveJournalLogo(template, state, text);
    const coverTitle = text.subtitle || template.text?.subtitle || "Visual science issue";
    const issue = text.meta || template.text?.meta || "Vol. 01 / 2026";
    ctx.save();
    ctx.translate(size / 2, size / 2);
    ctx.rotate(((state.cardRotate || 0) * Math.PI) / 180);
    ctx.translate(-size / 2, -size / 2);

    ctx.shadowColor = `rgba(0,0,0,${p.shadowOpacity ?? 0.18})`;
    ctx.shadowBlur = size * (p.shadowBlur ?? 0.018);
    ctx.shadowOffsetY = size * 0.012;
    ctx.lineWidth = border;
    ctx.strokeStyle = p.frameColor || p.outerColor || "#d12027";
    roundedRect(ctx, x, y, w, h, corner);
    ctx.stroke();
    ctx.shadowColor = "transparent";

    this.drawAcrylicEdge(x, y, w, h, corner, p);
    if (p.nodes) this.drawSparseNetwork(x, y, w, h, p);
    if (p.mask) this.drawMicroscopeWindow(x, y, w, h, p);

    const titleX = x + w * (p.titleLeft ?? 0.07);
    const titleY = y + h * (p.titleTop ?? 0.055);
    this.drawJournalLogo(logo, p, titleX, titleY, w, h);

    ctx.globalAlpha = p.metaOpacity ?? 0.82;
    ctx.fillStyle = p.metaColor || p.accentColor || p.frameColor || "#102a5c";
    ctx.font = `${size * 0.018}px 'SFMono-Regular', Menlo, monospace`;
    const metaX = x + w * (p.metaLeft ?? 0.07);
    const metaY = y + h * (p.metaTop ?? 0.155);
    ctx.fillText(issue.toUpperCase(), metaX, metaY);

    if (p.footer !== false) {
      const footerY = y + h * (p.footerTop ?? 0.875);
      ctx.globalAlpha = p.footerOpacity ?? 0.74;
      ctx.fillStyle = p.footerColor || p.accentColor || p.frameColor || "#102a5c";
      ctx.font = `${size * (p.footerSize ?? 0.018)}px Arial, sans-serif`;
      ctx.fillText(coverTitle, x + w * (p.footerLeft ?? 0.07), footerY);
      const note = template.text?.footerNote;
      if (note && p.footerNote !== false) {
        ctx.globalAlpha *= 0.78;
        ctx.font = `${size * 0.014}px Arial, sans-serif`;
        ctx.fillText(note, x + w * (p.footerLeft ?? 0.07), footerY + h * 0.035);
      }
    }

    this.drawAcrylicHighlight(x, y, w, h, state.reflection ?? 0.5);
    ctx.restore();
  }

  drawJournalLogo(logo, p, x, y, w, h) {
    const ctx = this.ctx;
    const style = p.logoStyle || "journal";
    const size = this.size;
    ctx.save();
    ctx.globalAlpha = p.logoOpacity ?? 0.94;
    ctx.fillStyle = p.logoColor || p.accentColor || p.frameColor || "#102a5c";
    ctx.textBaseline = "top";
    if (style === "science") {
      ctx.font = `700 ${size * (p.mastheadSize || 0.078)}px Georgia, 'Times New Roman', serif`;
      ctx.fillStyle = p.logoColor || "#d12027";
      ctx.fillText(logo, x, y);
    } else if (style === "nature") {
      ctx.font = `700 ${size * (p.mastheadSize || 0.078)}px Georgia, 'Times New Roman', serif`;
      ctx.fillText(logo, x, y);
    } else if (style === "cell") {
      ctx.font = `700 ${size * (p.mastheadSize || 0.06)}px Helvetica, Arial, sans-serif`;
      ctx.letterSpacing = "0";
      ctx.fillText(logo, x, y);
      ctx.globalAlpha *= 0.72;
      ctx.fillRect(x, y + size * 0.062, Math.min(w * 0.24, size * 0.18), Math.max(2, size * 0.004));
    } else if (style === "neuron") {
      ctx.font = `600 ${size * (p.mastheadSize || 0.062)}px 'SF Pro Display', Helvetica, Arial, sans-serif`;
      ctx.fillText(logo, x, y);
    } else {
      ctx.font = `700 ${size * (p.mastheadSize || 0.058)}px Georgia, 'Times New Roman', serif`;
      ctx.fillText(logo, x, y);
    }
    ctx.restore();
  }

  drawAcrylicEdge(x, y, w, h, corner, p) {
    const ctx = this.ctx;
    ctx.save();
    ctx.globalAlpha = p.thickness ?? 0.32;
    ctx.lineWidth = Math.max(1, this.size * 0.003);
    ctx.strokeStyle = p.edgeHighlight || "rgba(255,255,255,0.62)";
    roundedRect(ctx, x + ctx.lineWidth * 1.2, y + ctx.lineWidth * 1.2, w - ctx.lineWidth * 2.4, h - ctx.lineWidth * 2.4, corner * 0.88);
    ctx.stroke();
    ctx.globalAlpha = (p.thickness ?? 0.32) * 0.55;
    ctx.strokeStyle = p.edgeShadow || "rgba(0,0,0,0.18)";
    roundedRect(ctx, x + this.size * 0.007, y + this.size * 0.007, w, h, corner);
    ctx.stroke();
    ctx.restore();
  }

  drawSparseNetwork(x, y, w, h, p) {
    const ctx = this.ctx;
    ctx.save();
    ctx.globalAlpha = 0.25;
    ctx.strokeStyle = p.accentColor || "#8c6cff";
    ctx.fillStyle = p.accentColor || "#8c6cff";
    ctx.lineWidth = Math.max(1, this.size * 0.0012);
    const count = Math.min(10, p.nodes || 8);
    const points = Array.from({ length: count }, (_, index) => [
      x + w * (0.08 + ((Math.sin(index * 2.1) + 1) / 2) * 0.18),
      y + h * (0.22 + (index / count) * 0.56)
    ]);
    points.forEach((point, index) => {
      if (index > 0) {
        ctx.beginPath();
        ctx.moveTo(points[index - 1][0], points[index - 1][1]);
        ctx.lineTo(point[0], point[1]);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.arc(point[0], point[1], this.size * 0.004, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
  }

  drawMicroscopeWindow(x, y, w, h, p) {
    const ctx = this.ctx;
    const radius = Math.min(w, h) * (p.mask || 0.36) * 0.5;
    const cx = x + w * 0.5;
    const cy = y + h * 0.53;
    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.strokeStyle = p.accentColor || p.frameColor || "#54b7ac";
    ctx.lineWidth = Math.max(2, this.size * 0.006);
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 0.18;
    ctx.lineWidth = Math.max(1, this.size * 0.018);
    ctx.stroke();
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

function resolveJournalLogo(template, state, text) {
  const logo = template?.params?.logo || {};
  const safe = logo.safe || template?.text?.title || template?.name || "Scientific Journal";
  const creative = logo.creative || safe;
  const defaultName = state?.journalLogoMode === "creative" ? creative : safe;
  const typed = text?.title || "";
  if (!typed || typed === template?.text?.title || typed === logo.safe || typed === logo.creative) return defaultName;
  return typed;
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
