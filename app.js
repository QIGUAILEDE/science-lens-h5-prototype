const canvas = document.querySelector("#previewCanvas");
const ctx = canvas.getContext("2d", { willReadFrequently: true });
const fileInput = document.querySelector("#fileInput");
const lensList = document.querySelector("#lensList");
const categoryTabs = document.querySelector("#categoryTabs");
const templateInfo = document.querySelector("#templateInfo");
const templateCount = document.querySelector("#templateCount");
const emptyState = document.querySelector("#emptyState");
const zoomRange = document.querySelector("#zoomRange");
const offsetXRange = document.querySelector("#offsetXRange");
const offsetYRange = document.querySelector("#offsetYRange");
const rotationRange = document.querySelector("#rotationRange");
const intensityRange = document.querySelector("#intensityRange");
const cardScaleRange = document.querySelector("#cardScaleRange");
const cardRotateRange = document.querySelector("#cardRotateRange");
const reflectionRange = document.querySelector("#reflectionRange");
const titleInput = document.querySelector("#titleInput");
const subtitleInput = document.querySelector("#subtitleInput");
const metaInput = document.querySelector("#metaInput");
const resetButton = document.querySelector("#resetButton");
const downloadButton = document.querySelector("#downloadButton");
const compareButton = document.querySelector("#compareButton");

const SIZE = 1200;

const state = {
  image: null,
  categories: [],
  templates: [],
  activeCategory: "microscope",
  activeTemplateId: "m01_black_circle_brightfield",
  compareOriginal: false,
  zoom: 1,
  offsetX: 0,
  offsetY: 0,
  rotation: 0,
  intensity: 1,
  cardScale: 1,
  cardRotate: 0,
  reflection: 0.5,
  text: {
    title: "",
    subtitle: "",
    meta: ""
  },
  pointer: null
};

const demoImage = createDemoImage();

async function init() {
  const response = await fetch("./science-templates.json");
  const data = await response.json();
  state.categories = data.categories;
  state.templates = data.templates;
  hydrateText(getActiveTemplate());
  renderCategoryTabs();
  renderTemplateList();
  renderTemplateInfo();
  bindEvents();
  draw();
}

function bindEvents() {
  fileInput.addEventListener("change", handleFile);
  resetButton.addEventListener("click", resetTransform);
  downloadButton.addEventListener("click", downloadPreview);
  compareButton.addEventListener("click", () => {
    state.compareOriginal = !state.compareOriginal;
    compareButton.setAttribute("aria-pressed", String(state.compareOriginal));
    draw();
  });

  [
    zoomRange,
    offsetXRange,
    offsetYRange,
    rotationRange,
    intensityRange,
    cardScaleRange,
    cardRotateRange,
    reflectionRange
  ].forEach((input) => {
    input.addEventListener("input", syncControlsFromDom);
  });

  [titleInput, subtitleInput, metaInput].forEach((input) => {
    input.addEventListener("input", () => {
      state.text.title = titleInput.value;
      state.text.subtitle = subtitleInput.value;
      state.text.meta = metaInput.value;
      draw();
    });
  });

  canvas.addEventListener("pointerdown", (event) => {
    canvas.setPointerCapture(event.pointerId);
    state.pointer = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      offsetX: state.offsetX,
      offsetY: state.offsetY
    };
  });

  canvas.addEventListener("pointermove", (event) => {
    if (!state.pointer || state.pointer.id !== event.pointerId) return;
    const rect = canvas.getBoundingClientRect();
    const scale = SIZE / rect.width;
    state.offsetX = state.pointer.offsetX + (event.clientX - state.pointer.x) * scale;
    state.offsetY = state.pointer.offsetY + (event.clientY - state.pointer.y) * scale;
    offsetXRange.value = String(Math.round(state.offsetX));
    offsetYRange.value = String(Math.round(state.offsetY));
    draw();
  });

  canvas.addEventListener("pointerup", () => {
    state.pointer = null;
  });

  canvas.addEventListener("pointercancel", () => {
    state.pointer = null;
  });
}

function handleFile(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  const image = new Image();
  image.onload = () => {
    state.image = image;
    resetTransform();
    URL.revokeObjectURL(image.src);
  };
  image.src = URL.createObjectURL(file);
}

function syncControlsFromDom() {
  state.zoom = Number(zoomRange.value);
  state.offsetX = Number(offsetXRange.value);
  state.offsetY = Number(offsetYRange.value);
  state.rotation = Number(rotationRange.value);
  state.intensity = Number(intensityRange.value);
  state.cardScale = Number(cardScaleRange.value);
  state.cardRotate = Number(cardRotateRange.value);
  state.reflection = Number(reflectionRange.value);
  draw();
}

function renderCategoryTabs() {
  categoryTabs.innerHTML = "";
  state.categories.forEach((category) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "category-tab";
    button.textContent = category.name;
    button.setAttribute("aria-pressed", String(category.id === state.activeCategory));
    button.addEventListener("click", () => {
      state.activeCategory = category.id;
      const firstTemplate = state.templates.find((template) => template.category === category.id);
      if (firstTemplate) setActiveTemplate(firstTemplate.id);
      renderCategoryTabs();
      renderTemplateList();
    });
    categoryTabs.appendChild(button);
  });
}

function renderTemplateList() {
  const filtered = getVisibleTemplates();
  templateCount.textContent = `${filtered.length} 款 / 共 ${state.templates.length} 款`;
  lensList.innerHTML = "";
  filtered.forEach((template) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "lens-card";
    button.setAttribute("aria-pressed", String(template.id === state.activeTemplateId));
    button.innerHTML = `
      <span class="index">${template.index}</span>
      <strong>${template.name}</strong>
      <span>${template.summary}</span>
    `;
    button.addEventListener("click", () => setActiveTemplate(template.id));
    lensList.appendChild(button);
  });
}

function renderTemplateInfo() {
  const template = getActiveTemplate();
  if (!template) return;
  templateInfo.innerHTML = `
    <h3>${template.index}｜${template.name}</h3>
    <p>${template.summary}</p>
    <div class="meta-row">
      <span class="pill">${template.type}</span>
      <span class="pill">${template.engine}</span>
      ${(template.controls || []).slice(0, 4).map((item) => `<span class="pill">${item}</span>`).join("")}
    </div>
  `;
}

function getVisibleTemplates() {
  return state.templates.filter((template) => template.category === state.activeCategory);
}

function getActiveTemplate() {
  return state.templates.find((template) => template.id === state.activeTemplateId) || state.templates[0];
}

function setActiveTemplate(id) {
  state.activeTemplateId = id;
  hydrateText(getActiveTemplate());
  renderTemplateList();
  renderTemplateInfo();
  draw();
}

function hydrateText(template) {
  state.text = {
    title: template?.text?.title || "",
    subtitle: template?.text?.subtitle || "",
    meta: template?.text?.meta || ""
  };
  titleInput.value = state.text.title;
  subtitleInput.value = state.text.subtitle;
  metaInput.value = state.text.meta;
}

function resetTransform() {
  state.zoom = 1;
  state.offsetX = 0;
  state.offsetY = 0;
  state.rotation = 0;
  state.intensity = 1;
  state.cardScale = 1;
  state.cardRotate = 0;
  state.reflection = 0.5;
  zoomRange.value = "1";
  offsetXRange.value = "0";
  offsetYRange.value = "0";
  rotationRange.value = "0";
  intensityRange.value = "1";
  cardScaleRange.value = "1";
  cardRotateRange.value = "0";
  reflectionRange.value = "0.5";
  draw();
}

function draw() {
  const template = getActiveTemplate();
  const source = state.image || demoImage;
  canvas.width = SIZE;
  canvas.height = SIZE;
  ctx.clearRect(0, 0, SIZE, SIZE);

  if (state.compareOriginal) {
    drawSourceImage(source);
    drawCompareBadge();
    emptyState.style.display = state.image ? "none" : "grid";
    return;
  }

  drawTemplateBackground(template);
  drawSourceImage(source, template);
  applyPixelPipeline(template);
  drawSyntheticLayers(template);
  drawTemplateOverlay(template);

  emptyState.style.display = state.image ? "none" : "grid";
}

function drawTemplateBackground(template) {
  const p = template.params || {};
  const bg = template.category === "journal" ? "#f8f7f2" : p.blackPoint ? "#020304" : "#f4f1e8";
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, SIZE, SIZE);
}

function drawSourceImage(source, template = null) {
  const imageWidth = source.naturalWidth || source.width;
  const imageHeight = source.naturalHeight || source.height;
  const baseScale = Math.max(SIZE / imageWidth, SIZE / imageHeight) * state.zoom;
  const drawWidth = imageWidth * baseScale;
  const drawHeight = imageHeight * baseScale;

  ctx.save();
  if (template?.id === "m01_black_circle_brightfield" || template?.id === "m09_captioned_black_circle" || template?.id === "j05_microscopy_journal") {
    clipCircle(template.params.mask || 0.78);
  }
  ctx.translate(SIZE / 2 + state.offsetX, SIZE / 2 + state.offsetY);
  ctx.rotate((state.rotation * Math.PI) / 180);
  ctx.filter = buildBaseFilter(template);
  ctx.drawImage(source, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
  ctx.filter = "none";
  ctx.restore();
}

function buildBaseFilter(template) {
  const p = template?.params || {};
  const brightness = 1 + (p.exposure || 0) * state.intensity;
  const contrast = 1 + ((p.contrast || 1) - 1) * state.intensity;
  const saturation = Math.max(0, 1 + ((p.saturation ?? 1) - 1) * state.intensity);
  const blur = (p.soft || 0) * 8 * state.intensity;
  return `brightness(${brightness}) contrast(${contrast}) saturate(${p.grayscale ? 0 : saturation}) blur(${blur}px)`;
}

function applyPixelPipeline(template) {
  const p = template?.params || {};
  if (template?.id === "m22_pixel_cell_blocks") {
    applyPixelBlocks(p);
    return;
  }

  const imageData = ctx.getImageData(0, 0, SIZE, SIZE);
  const data = imageData.data;
  const tint = p.tint ? hexToRgb(p.tint) : null;
  const duoA = p.duotone ? hexToRgb(p.duotone[0]) : null;
  const duoB = p.duotone ? hexToRgb(p.duotone[1]) : null;
  const frameColor = p.frameColor ? hexToRgb(p.frameColor) : null;

  for (let i = 0; i < data.length; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;

    if (p.grayscale) {
      r = lum;
      g = lum;
      b = lum;
    }

    if (p.invertMix) {
      const mix = p.invertMix * state.intensity;
      r = lerp(r, 255 - r, mix);
      g = lerp(g, 255 - g, mix);
      b = lerp(b, 255 - b, mix);
    }

    if (tint) {
      const mix = (p.tintMix || 0.2) * state.intensity;
      r = lerp(r, tint.r, mix);
      g = lerp(g, tint.g, mix);
      b = lerp(b, tint.b, mix);
    }

    if (duoA && duoB) {
      const signal = clamp01((lum - (p.blackPoint ? p.blackPoint * 255 : 30)) / 225);
      const color = signal > 0.54 ? duoB : duoA;
      const mix = clamp01(0.35 + signal * 0.65) * state.intensity;
      r = lerp(0, color.r, mix);
      g = lerp(0, color.g, mix);
      b = lerp(0, color.b, mix);
    }

    if (p.blackPoint) {
      const threshold = p.blackPoint * 255;
      const signal = clamp01((lum - threshold) / (255 - threshold));
      r *= signal;
      g *= signal;
      b *= signal;
    }

    if (p.fluid || p.dream) {
      const warmth = Math.sin((i / 4) * 0.018) * 18 * state.intensity;
      r += warmth + (p.dream ? 18 : 0);
      g += Math.cos((i / 4) * 0.013) * 12 * state.intensity;
      b += Math.sin((i / 4) * 0.011 + 2) * 22 * state.intensity + (p.dream ? 28 : 0);
    }

    if (frameColor && template.category === "journal") {
      const mix = 0.015 * state.intensity;
      r = lerp(r, frameColor.r, mix);
      g = lerp(g, frameColor.g, mix);
      b = lerp(b, frameColor.b, mix);
    }

    const grain = ((p.grain || p.colorNoise || 0) * 255 + (p.texture || 0) * 70) * state.intensity;
    if (grain) {
      const n = seededNoise(i + template.id.length * 97) * grain;
      r += n;
      g += p.colorNoise ? seededNoise(i + 44) * grain : n;
      b += p.colorNoise ? seededNoise(i + 88) * grain : n;
    }

    data[i] = clamp(r);
    data[i + 1] = clamp(g);
    data[i + 2] = clamp(b);
  }

  ctx.putImageData(imageData, 0, 0);
}

function applyPixelBlocks(p) {
  const block = Math.max(8, Math.round((p.pixel || 16) * (1.6 - Math.min(state.intensity, 1.2) * 0.35)));
  const imageData = ctx.getImageData(0, 0, SIZE, SIZE);
  const data = imageData.data;
  for (let y = 0; y < SIZE; y += block) {
    for (let x = 0; x < SIZE; x += block) {
      let r = 0;
      let g = 0;
      let b = 0;
      let count = 0;
      for (let yy = y; yy < Math.min(SIZE, y + block); yy += 3) {
        for (let xx = x; xx < Math.min(SIZE, x + block); xx += 3) {
          const index = (yy * SIZE + xx) * 4;
          r += data[index];
          g += data[index + 1];
          b += data[index + 2];
          count += 1;
        }
      }
      r = quantize(r / count, p.palette || 8);
      g = quantize(g / count, p.palette || 8);
      b = quantize(b / count, p.palette || 8);
      for (let yy = y; yy < Math.min(SIZE, y + block); yy += 1) {
        for (let xx = x; xx < Math.min(SIZE, x + block); xx += 1) {
          const index = (yy * SIZE + xx) * 4;
          data[index] = r;
          data[index + 1] = g;
          data[index + 2] = b;
        }
      }
    }
  }
  ctx.putImageData(imageData, 0, 0);
  ctx.save();
  ctx.globalAlpha = 0.2;
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 1;
  for (let x = 0; x < SIZE; x += block) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, SIZE);
    ctx.stroke();
  }
  for (let y = 0; y < SIZE; y += block) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(SIZE, y);
    ctx.stroke();
  }
  ctx.restore();
}

function drawSyntheticLayers(template) {
  const p = template.params || {};
  if (p.glow) drawGlow(p.glow);
  if (p.scanline) drawScanlines(p.scanline);
  if (p.vignette) drawVignette(p.vignette);
  if (p.crystal) drawCrystalTexture(p.crystal);
  if (p.sparkles) drawSparkles(p.sparkles, template.id);
  if (p.speckles) drawSpeckles(p.speckles, template.id);
  if (p.droplets) drawDroplets(p.droplets, template.id);
  if (p.collage) drawCollageGrid(p.collage);
  if (p.channels) drawMicrofluidicChannels(p.channels);
  if (p.nodes) drawNodeNetwork(p.nodes, template.category === "journal");
  if (template.id === "m15_cell_star_map") drawNodeNetwork(p.nodes || 24, false);
  if (template.id === "m18_specimen_archive") drawArchiveCard(template);
  if (template.id === "m13_pathology_slide") drawPathologySlide(template);
}

function drawTemplateOverlay(template) {
  if (template.category === "journal") {
    drawJournalCard(template);
    return;
  }

  if (template.id === "m01_black_circle_brightfield" || template.id === "m09_captioned_black_circle") {
    drawBlackCircleOverlay(template);
  }

  if (template.id === "m16_silver_sem") {
    drawSemStatus(template);
  }

  if (template.id === "m22_pixel_cell_blocks") {
    drawPaletteLegend();
  }

  drawSubtleMetadata(template);
}

function drawJournalCard(template) {
  const p = template.params || {};
  const border = SIZE * (p.border || 0.035) * state.cardScale;
  const header = SIZE * (p.header || 0.12);
  const footer = SIZE * (p.footer || 0.08);
  const margin = 70 * state.cardScale;
  const x = margin;
  const y = margin;
  const w = SIZE - margin * 2;
  const h = SIZE - margin * 2;
  const radius = (p.corner || 14) * 2;

  ctx.save();
  ctx.translate(SIZE / 2, SIZE / 2);
  ctx.rotate((state.cardRotate * Math.PI) / 180);
  ctx.translate(-SIZE / 2, -SIZE / 2);

  ctx.shadowColor = `rgba(0,0,0,${p.shadow || 0.14})`;
  ctx.shadowBlur = 24;
  ctx.shadowOffsetY = 14;
  roundedRect(x, y, w, h, radius);
  ctx.fillStyle = `rgba(255,255,255,${p.glass || 0.1})`;
  ctx.fill();
  ctx.shadowColor = "transparent";

  const frame = p.frameColor || "#d12027";
  const accent = p.accentColor || frame;
  ctx.lineWidth = border;
  ctx.strokeStyle = frame;
  roundedRect(x, y, w, h, radius);
  ctx.stroke();

  if (p.innerColor) {
    ctx.lineWidth = Math.max(4, border * 0.35);
    ctx.strokeStyle = p.innerColor;
    roundedRect(x + border * 0.8, y + border * 0.8, w - border * 1.6, h - border * 1.6, radius * 0.7);
    ctx.stroke();
  }

  ctx.fillStyle = accent;
  if (template.id === "j02_nature_campus") {
    ctx.fillRect(x + border, y + border, w - border * 2, header);
    ctx.fillStyle = p.frameColor;
  }

  ctx.textBaseline = "top";
  ctx.fillStyle = template.id === "j02_nature_campus" ? "#f0c94b" : accent;
  ctx.font = `${template.id === "j03_cell_minimal" ? 54 : 68}px Georgia, 'Times New Roman', serif`;
  ctx.fillText(state.text.title, x + border * 1.6, y + border * 1.35);

  ctx.font = "24px -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.fillStyle = textColorForFrame(template);
  ctx.globalAlpha = 0.86;
  ctx.fillText(state.text.subtitle, x + border * 1.7, y + header + border * 0.6);
  ctx.fillText(state.text.meta, x + border * 1.7, y + h - footer + 22);
  ctx.globalAlpha = 1;

  if (template.id === "j04_neural_network") drawNodeNetwork(p.nodes || 14, true);
  if (template.id === "j05_microscopy_journal") {
    drawCircleRim(p.mask || 0.72, p.frameColor || "#0b2533");
  }

  drawAcrylicHighlights(x, y, w, h, p);
  ctx.restore();
}

function drawBlackCircleOverlay(template) {
  const p = template.params || {};
  const mask = p.mask || 0.8;
  const radius = (SIZE * mask) / 2;
  ctx.save();
  ctx.fillStyle = "#050506";
  ctx.beginPath();
  ctx.rect(0, 0, SIZE, SIZE);
  ctx.arc(SIZE / 2, SIZE / 2, radius, 0, Math.PI * 2, true);
  ctx.fill("evenodd");
  ctx.restore();
  drawCircleRim(mask, "#f8f8f2");
  ctx.save();
  ctx.fillStyle = "rgba(255,255,255,0.92)";
  ctx.textAlign = "center";
  ctx.font = "38px 'Songti SC', Georgia, serif";
  ctx.fillText(state.text.title, SIZE / 2, SIZE / 2 + radius - 70);
  if (template.id === "m09_captioned_black_circle") {
    ctx.font = "24px 'Roboto Mono', monospace";
    ctx.fillText(state.text.subtitle, SIZE / 2, SIZE / 2 + radius - 32);
  }
  ctx.restore();
}

function drawCircleRim(mask, color) {
  const radius = (SIZE * mask) / 2;
  ctx.save();
  const gradient = ctx.createRadialGradient(SIZE / 2, SIZE / 2, radius * 0.9, SIZE / 2, SIZE / 2, radius * 1.18);
  gradient.addColorStop(0, "rgba(0,0,0,0)");
  gradient.addColorStop(0.56, "rgba(0,0,0,0.24)");
  gradient.addColorStop(1, "rgba(0,0,0,0.95)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, SIZE, SIZE);
  ctx.strokeStyle = color;
  ctx.globalAlpha = 0.35;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(SIZE / 2, SIZE / 2, radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawSubtleMetadata(template) {
  if (template.category === "journal" || template.id === "m01_black_circle_brightfield" || template.id === "m09_captioned_black_circle") return;
  ctx.save();
  ctx.fillStyle = "rgba(245,250,248,0.78)";
  ctx.font = "23px 'Roboto Mono', 'SFMono-Regular', Menlo, monospace";
  ctx.fillText(`${template.index}  ${state.text.title}`, 34, 34);
  ctx.globalAlpha = 0.72;
  ctx.fillText(state.text.subtitle, 34, 66);
  ctx.restore();
}

function drawSemStatus(template) {
  ctx.save();
  ctx.fillStyle = "rgba(0,0,0,0.72)";
  ctx.fillRect(0, SIZE - 96, SIZE, 96);
  ctx.fillStyle = "rgba(240,240,240,0.92)";
  ctx.font = "25px 'Roboto Mono', monospace";
  ctx.fillText(state.text.subtitle, 34, SIZE - 64);
  drawScaleBar("10 μm", true);
  ctx.restore();
}

function drawArchiveCard(template) {
  ctx.save();
  ctx.fillStyle = "rgba(255,255,255,0.72)";
  ctx.strokeStyle = "rgba(20,30,35,0.22)";
  ctx.lineWidth = 2;
  roundedRect(76, 100, SIZE - 152, SIZE - 200, 20);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "rgba(255,255,255,0.82)";
  ctx.fillRect(SIZE - 320, 120, 220, SIZE - 240);
  ctx.fillStyle = "#1f2b2d";
  ctx.font = "28px Georgia, serif";
  ctx.fillText(state.text.title, SIZE - 292, 170);
  ctx.font = "20px 'Roboto Mono', monospace";
  wrapText(state.text.subtitle, SIZE - 292, 220, 170, 26);
  wrapText(state.text.meta, SIZE - 292, 335, 170, 26);
  drawScaleBar("100 μm", false, SIZE - 292, SIZE - 215, 130);
  ctx.restore();
}

function drawPathologySlide(template) {
  ctx.save();
  ctx.fillStyle = "rgba(255,255,255,0.58)";
  ctx.strokeStyle = "rgba(30,35,40,0.24)";
  ctx.lineWidth = 3;
  roundedRect(90, 150, SIZE - 180, SIZE - 300, 18);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "rgba(245,245,240,0.86)";
  ctx.fillRect(112, 170, 185, SIZE - 340);
  ctx.fillStyle = "#344";
  ctx.font = "24px 'Roboto Mono', monospace";
  wrapText(state.text.title, 136, 205, 132, 30);
  drawMatrixCode(138, 360, 82);
  ctx.fillText(state.text.meta, 136, 475);
  ctx.restore();
}

function drawAcrylicHighlights(x, y, w, h, p) {
  const alpha = (p.reflection || 0.1) * state.reflection;
  ctx.save();
  ctx.globalAlpha = alpha;
  const diagonal = ctx.createLinearGradient(x, y, x + w, y + h);
  diagonal.addColorStop(0, "rgba(255,255,255,0)");
  diagonal.addColorStop(0.48, "rgba(255,255,255,0.9)");
  diagonal.addColorStop(0.58, "rgba(255,255,255,0)");
  ctx.fillStyle = diagonal;
  roundedRect(x, y, w, h, p.corner || 16);
  ctx.fill();

  ctx.globalAlpha = alpha * 0.75;
  ctx.fillStyle = "rgba(255,255,255,0.95)";
  ctx.fillRect(x + 18, y + 16, w - 36, 3);
  ctx.strokeStyle = "rgba(255,255,255,0.55)";
  ctx.lineWidth = 2;
  roundedRect(x + 6, y + 6, w - 12, h - 12, (p.corner || 16) * 0.9);
  ctx.stroke();
  ctx.restore();
}

function drawGlow(amount) {
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.globalAlpha = Math.min(0.6, amount * state.intensity);
  ctx.filter = "blur(14px)";
  ctx.drawImage(canvas, 0, 0);
  ctx.restore();
}

function drawScanlines(amount) {
  ctx.save();
  ctx.globalAlpha = amount * state.intensity;
  ctx.fillStyle = "#000";
  for (let y = 0; y < SIZE; y += 5) ctx.fillRect(0, y, SIZE, 1);
  ctx.restore();
}

function drawVignette(amount) {
  const gradient = ctx.createRadialGradient(SIZE / 2, SIZE / 2, SIZE * 0.24, SIZE / 2, SIZE / 2, SIZE * 0.72);
  gradient.addColorStop(0, "rgba(0,0,0,0)");
  gradient.addColorStop(1, `rgba(0,0,0,${Math.min(0.85, amount * state.intensity)})`);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, SIZE, SIZE);
}

function drawCrystalTexture(amount) {
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.globalAlpha = amount * state.intensity;
  for (let i = 0; i < 24; i += 1) {
    const x = seededUnit(i * 17) * SIZE;
    const y = seededUnit(i * 31) * SIZE;
    const r = 80 + seededUnit(i * 47) * 220;
    const hue = Math.round(seededUnit(i * 59) * 360);
    ctx.strokeStyle = `hsla(${hue}, 92%, 66%, 0.55)`;
    ctx.lineWidth = 2 + seededUnit(i * 13) * 5;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(i) * r, y + Math.sin(i * 1.7) * r);
    ctx.stroke();
  }
  ctx.restore();
}

function drawSparkles(count, seed) {
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  for (let i = 0; i < count; i += 1) {
    const n = hashSeed(seed, i);
    const x = n.x * SIZE;
    const y = n.y * SIZE;
    const r = 4 + n.z * 18;
    ctx.globalAlpha = 0.35 + n.z * 0.45;
    ctx.strokeStyle = "#e8f2ff";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - r, y);
    ctx.lineTo(x + r, y);
    ctx.moveTo(x, y - r);
    ctx.lineTo(x, y + r);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x, y, r * 0.3, 0, Math.PI * 2);
    ctx.fillStyle = "#b7c8ff";
    ctx.fill();
  }
  ctx.restore();
}

function drawSpeckles(count, seed) {
  ctx.save();
  ctx.globalAlpha = 0.35;
  ctx.fillStyle = "#c45ad7";
  for (let i = 0; i < count; i += 1) {
    const n = hashSeed(seed, i);
    ctx.beginPath();
    ctx.ellipse(n.x * SIZE, n.y * SIZE, 8 + n.z * 18, 3 + n.z * 8, n.z * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawDroplets(count, seed) {
  ctx.save();
  for (let i = 0; i < count; i += 1) {
    const n = hashSeed(seed, i);
    const r = 38 + n.z * 88;
    const x = 90 + n.x * (SIZE - 180);
    const y = 90 + n.y * (SIZE - 180);
    const gradient = ctx.createRadialGradient(x - r * 0.3, y - r * 0.4, r * 0.1, x, y, r);
    gradient.addColorStop(0, "rgba(255,255,255,0.55)");
    gradient.addColorStop(0.65, "rgba(200,240,255,0.12)");
    gradient.addColorStop(1, "rgba(255,255,255,0.45)");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.5)";
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  ctx.restore();
}

function drawCollageGrid(count) {
  const cols = 3;
  const rows = Math.ceil(count / cols);
  ctx.save();
  ctx.globalAlpha = 0.72;
  ctx.strokeStyle = "rgba(255,255,255,0.85)";
  ctx.lineWidth = 8;
  for (let c = 1; c < cols; c += 1) {
    ctx.beginPath();
    ctx.moveTo((SIZE / cols) * c, 0);
    ctx.lineTo((SIZE / cols) * c, SIZE);
    ctx.stroke();
  }
  for (let r = 1; r < rows; r += 1) {
    ctx.beginPath();
    ctx.moveTo(0, (SIZE / rows) * r);
    ctx.lineTo(SIZE, (SIZE / rows) * r);
    ctx.stroke();
  }
  ctx.restore();
}

function drawMicrofluidicChannels(count) {
  ctx.save();
  ctx.globalAlpha = 0.5;
  ctx.strokeStyle = "#62e3f0";
  ctx.fillStyle = "rgba(98,227,240,0.22)";
  ctx.lineWidth = 18;
  ctx.lineCap = "round";
  for (let i = 0; i < count; i += 1) {
    const y = 120 + i * 62;
    ctx.beginPath();
    ctx.moveTo(80, y);
    ctx.bezierCurveTo(300, y - 50, 420, y + 80, 610, y);
    ctx.bezierCurveTo(780, y - 70, 880, y + 60, 1120, y - 20);
    ctx.stroke();
    if (i % 3 === 0) {
      ctx.beginPath();
      ctx.arc(300 + i * 30, y, 34, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

function drawNodeNetwork(count, edgeOnly) {
  const nodes = [];
  for (let i = 0; i < count; i += 1) {
    const n = hashSeed("nodes", i);
    const edgeBias = edgeOnly ? (n.x < 0.5 ? 0.08 + n.x * 0.2 : 0.72 + n.x * 0.2) : n.x;
    nodes.push({ x: edgeBias * SIZE, y: (0.08 + n.y * 0.84) * SIZE, r: 6 + n.z * 18 });
  }
  ctx.save();
  ctx.globalAlpha = edgeOnly ? 0.42 : 0.5;
  ctx.strokeStyle = edgeOnly ? "#9b86ff" : "#b58bdc";
  ctx.fillStyle = edgeOnly ? "#b9fff2" : "#b164c8";
  ctx.lineWidth = 2;
  nodes.forEach((a, i) => {
    nodes.slice(i + 1).forEach((b) => {
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      if (d < SIZE * 0.18) {
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    });
  });
  nodes.forEach((node, i) => {
    ctx.beginPath();
    ctx.arc(node.x, node.y, node.r, 0, Math.PI * 2);
    ctx.fill();
    if (!edgeOnly && i < 8) {
      ctx.fillStyle = "rgba(40,40,50,0.75)";
      ctx.font = "16px 'Roboto Mono', monospace";
      ctx.fillText(`D-${String(i + 1).padStart(2, "0")}`, node.x + 12, node.y - 6);
      ctx.fillStyle = "#b164c8";
    }
  });
  ctx.restore();
}

function drawPaletteLegend() {
  ctx.save();
  ctx.fillStyle = "rgba(255,255,255,0.78)";
  ctx.fillRect(SIZE - 210, 92, 150, 282);
  ctx.fillStyle = "#20252a";
  ctx.font = "18px 'Roboto Mono', monospace";
  ctx.fillText("Palette", SIZE - 188, 116);
  const colors = ["#354f52", "#52796f", "#84a98c", "#cad2c5", "#b56576", "#6d597a"];
  colors.forEach((color, index) => {
    ctx.fillStyle = color;
    ctx.fillRect(SIZE - 188, 152 + index * 34, 24, 24);
    ctx.fillStyle = "#20252a";
    ctx.fillText(`Color ${String(index + 1).padStart(2, "0")}`, SIZE - 154, 153 + index * 34);
  });
  ctx.restore();
}

function drawScaleBar(text, light, x = SIZE - 260, y = SIZE - 82, width = 170) {
  ctx.save();
  ctx.strokeStyle = light ? "#fff" : "#1f2522";
  ctx.fillStyle = light ? "#fff" : "#1f2522";
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + width, y);
  ctx.stroke();
  ctx.font = "22px 'Roboto Mono', monospace";
  ctx.fillText(text, x + 18, y + 16);
  ctx.restore();
}

function drawMatrixCode(x, y, size) {
  ctx.save();
  ctx.fillStyle = "#28313a";
  const cell = size / 7;
  for (let row = 0; row < 7; row += 1) {
    for (let col = 0; col < 7; col += 1) {
      if ((row * 5 + col * 3) % 4 !== 0) ctx.fillRect(x + col * cell, y + row * cell, cell * 0.72, cell * 0.72);
    }
  }
  ctx.restore();
}

function drawCompareBadge() {
  ctx.save();
  ctx.fillStyle = "rgba(0,0,0,0.62)";
  ctx.fillRect(28, 28, 132, 46);
  ctx.fillStyle = "#fff";
  ctx.font = "22px -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.fillText("原图对比", 48, 41);
  ctx.restore();
}

function createDemoImage() {
  const offscreen = document.createElement("canvas");
  offscreen.width = SIZE;
  offscreen.height = SIZE;
  const gtx = offscreen.getContext("2d");
  const gradient = gtx.createLinearGradient(0, 0, SIZE, SIZE);
  gradient.addColorStop(0, "#e8f3ea");
  gradient.addColorStop(0.35, "#8abdb3");
  gradient.addColorStop(0.66, "#e89dc8");
  gradient.addColorStop(1, "#1d1c22");
  gtx.fillStyle = gradient;
  gtx.fillRect(0, 0, SIZE, SIZE);
  for (let i = 0; i < 130; i += 1) {
    const n = hashSeed("demo", i);
    gtx.beginPath();
    gtx.fillStyle = `hsla(${Math.round(n.x * 320)}, 70%, ${45 + n.z * 35}%, 0.22)`;
    gtx.ellipse(n.x * SIZE, n.y * SIZE, 16 + n.z * 80, 8 + n.x * 58, n.z * Math.PI, 0, Math.PI * 2);
    gtx.fill();
  }
  return offscreen;
}

function downloadPreview() {
  const link = document.createElement("a");
  link.download = `${state.activeTemplateId}.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
}

function clipCircle(mask) {
  const radius = (SIZE * mask) / 2;
  ctx.beginPath();
  ctx.arc(SIZE / 2, SIZE / 2, radius, 0, Math.PI * 2);
  ctx.clip();
}

function roundedRect(x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function wrapText(text, x, y, maxWidth, lineHeight) {
  const chars = String(text).split("");
  let line = "";
  chars.forEach((char) => {
    const test = line + char;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, y);
      line = char;
      y += lineHeight;
    } else {
      line = test;
    }
  });
  if (line) ctx.fillText(line, x, y);
}

function textColorForFrame(template) {
  if (template.id === "j02_nature_campus") return "#102a5c";
  if (template.id === "j06_preprint_card") return "#222";
  return template.params?.accentColor || "#fff";
}

function hexToRgb(hex) {
  const value = hex.replace("#", "");
  const normalized = value.length === 3 ? value.split("").map((char) => char + char).join("") : value;
  const number = Number.parseInt(normalized, 16);
  return {
    r: (number >> 16) & 255,
    g: (number >> 8) & 255,
    b: number & 255
  };
}

function hashSeed(seed, index) {
  const base = String(seed).split("").reduce((sum, char) => sum + char.charCodeAt(0), 0) + index * 997;
  return {
    x: seededUnit(base),
    y: seededUnit(base + 101),
    z: seededUnit(base + 211)
  };
}

function seededUnit(value) {
  return fract(Math.sin(value * 12.9898) * 43758.5453);
}

function seededNoise(value) {
  return (seededUnit(value) - 0.5) * 2;
}

function fract(value) {
  return value - Math.floor(value);
}

function lerp(a, b, t) {
  return a + (b - a) * clamp01(t);
}

function quantize(value, steps) {
  const step = 255 / steps;
  return Math.round(value / step) * step;
}

function clamp(value) {
  return Math.max(0, Math.min(255, value));
}

function clamp01(value) {
  return Math.max(0, Math.min(1, value));
}

init().catch((error) => {
  console.error(error);
  emptyState.innerHTML = "<strong>配置加载失败</strong><span>请通过本地服务器打开，不要直接用 file:// 打开。</span>";
});
