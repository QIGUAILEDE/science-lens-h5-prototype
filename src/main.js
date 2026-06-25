import { ScienceRenderer } from "./imaging/renderer/science-renderer.js";
import { QUALITY_PRESETS, downloadCanvas } from "./imaging/export/exporter.js";
import { SCIENCE_CAMERAS } from "./styles/science-cameras.js";
import { RESEARCH_FIGURES } from "./templates/research-figure/figure-templates.js";
import { saveRecipe, getLatestRecipe } from "./services/preset/preset-store.js";

const canvas = document.querySelector("#previewCanvas");
const fileInput = document.querySelector("#fileInput");
const workspaceTabs = document.querySelector("#workspaceTabs");
const categoryTabs = document.querySelector("#categoryTabs");
const lensList = document.querySelector("#lensList");
const templateInfo = document.querySelector("#templateInfo");
const templateCount = document.querySelector("#templateCount");
const emptyState = document.querySelector("#emptyState");
const compareButton = document.querySelector("#compareButton");
const resetButton = document.querySelector("#resetButton");
const downloadButton = document.querySelector("#downloadButton");
const saveRecipeButton = document.querySelector("#saveRecipeButton");
const loadRecipeButton = document.querySelector("#loadRecipeButton");
const qualitySelect = document.querySelector("#qualitySelect");
const debugViewSelect = document.querySelector("#debugViewSelect");
const titleInput = document.querySelector("#titleInput");
const subtitleInput = document.querySelector("#subtitleInput");
const metaInput = document.querySelector("#metaInput");
const journalLogoModeSelect = document.querySelector("#journalLogoModeSelect");

const controls = {
  zoom: document.querySelector("#zoomRange"),
  offsetX: document.querySelector("#offsetXRange"),
  offsetY: document.querySelector("#offsetYRange"),
  rotation: document.querySelector("#rotationRange"),
  intensity: document.querySelector("#intensityRange"),
  spatialVariation: document.querySelector("#spatialVariationRange"),
  cardScale: document.querySelector("#cardScaleRange"),
  cardRotate: document.querySelector("#cardRotateRange"),
  reflection: document.querySelector("#reflectionRange")
};

const renderer = new ScienceRenderer(canvas, { size: 1200 });
const demoImage = createDemoImage();

const state = {
  image: null,
  images: [],
  imageId: "demo",
  workspace: "cameras",
  compareOriginal: false,
  activeId: "PH_LIVE_01",
  cards: [],
  zoom: 1,
  offsetX: 0,
  offsetY: 0,
  rotation: 0,
  intensity: 1,
  spatialVariation: 0.55,
  cardScale: 1,
  cardRotate: 0,
  reflection: 0.5,
  previewSize: 1200,
  quality: "standard",
  seed: 1,
  debugView: "final",
  journalLogoMode: "safe",
  text: { title: "", subtitle: "", meta: "" },
  pointer: null
};

export async function startApp() {
  const response = await fetch("./science-templates.json");
  const data = await response.json();
  state.cards = data.templates;
  hydrateText(getActiveItem());
  bindEvents();
  renderWorkspaceTabs();
  renderCategoryTabs();
  renderItemList();
  renderInfo();
  draw();
}

function bindEvents() {
  fileInput.addEventListener("change", handleFile);
  compareButton.addEventListener("click", () => {
    state.compareOriginal = !state.compareOriginal;
    compareButton.setAttribute("aria-pressed", String(state.compareOriginal));
    draw();
  });
  resetButton.addEventListener("click", resetTransform);
  downloadButton.addEventListener("click", () => {
    const item = getActiveItem();
    renderer.render({
      source: state.image || demoImage,
      sources: state.images.length ? state.images : [state.image || demoImage],
      item,
      state: exportState(),
      text: state.text
    });
    downloadCanvas(canvas, `${item.id}.png`);
    state.previewSize = QUALITY_PRESETS[state.quality].previewSize;
    draw();
  });
  saveRecipeButton.addEventListener("click", () => {
    const item = getActiveItem();
    saveRecipe({
      baseItemId: item.id,
      workspace: state.workspace,
      params: snapshotParams(),
      text: state.text,
      quality: state.quality,
      journalLogoMode: state.journalLogoMode,
      seed: state.seed
    });
    saveRecipeButton.textContent = "已保存";
    setTimeout(() => (saveRecipeButton.textContent = "保存配方"), 1000);
  });
  loadRecipeButton.addEventListener("click", () => {
    const recipe = getLatestRecipe();
    if (!recipe) return;
    state.workspace = recipe.workspace || "cameras";
    state.activeId = recipe.baseItemId;
    Object.assign(state, recipe.params || {});
    state.text = recipe.text || state.text;
    state.quality = recipe.quality || "standard";
    state.journalLogoMode = recipe.journalLogoMode || "safe";
    syncDomFromState();
    renderWorkspaceTabs();
    renderCategoryTabs();
    renderItemList();
    renderInfo();
    draw();
  });
  qualitySelect.addEventListener("change", () => {
    state.quality = qualitySelect.value;
    state.previewSize = QUALITY_PRESETS[state.quality].previewSize;
    draw();
  });
  debugViewSelect.addEventListener("change", () => {
    state.debugView = debugViewSelect.value;
    draw();
  });
  journalLogoModeSelect.addEventListener("change", () => {
    state.journalLogoMode = journalLogoModeSelect.value;
    hydrateText(getActiveItem());
    draw();
  });
  Object.values(controls).forEach((input) => input.addEventListener("input", syncStateFromDom));
  [titleInput, subtitleInput, metaInput].forEach((input) => input.addEventListener("input", syncTextFromDom));
  canvas.addEventListener("pointerdown", startDrag);
  canvas.addEventListener("pointermove", moveDrag);
  canvas.addEventListener("pointerup", endDrag);
  canvas.addEventListener("pointercancel", endDrag);
}

function handleFile(event) {
  const files = [...(event.target.files || [])];
  if (!files.length) return;
  Promise.all(files.map(loadImageFile)).then((images) => {
    state.images = images;
    state.image = images[0];
    state.imageId = files.map((file) => `${file.name}:${file.size}:${file.lastModified}`).join("|");
    resetTransform();
  });
}

function loadImageFile(file) {
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(image.src);
      resolve(image);
    };
    image.src = URL.createObjectURL(file);
  });
}

function renderWorkspaceTabs() {
  workspaceTabs.querySelectorAll("button").forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.workspace === state.workspace));
    button.onclick = () => {
      state.workspace = button.dataset.workspace;
      state.activeId = getItems()[0]?.id || state.activeId;
      hydrateText(getActiveItem());
      renderWorkspaceTabs();
      renderCategoryTabs();
      renderItemList();
      renderInfo();
      draw();
    };
  });
}

function renderCategoryTabs() {
  const categories = [...new Set(getItems().map((item) => item.category || item.type || "默认"))];
  categoryTabs.innerHTML = "";
  categories.forEach((category, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "category-tab";
    button.textContent = category;
    button.setAttribute("aria-pressed", String(index === 0));
    button.addEventListener("click", () => {
      categoryTabs.querySelectorAll("button").forEach((tab) => tab.setAttribute("aria-pressed", "false"));
      button.setAttribute("aria-pressed", "true");
      renderItemList(category);
    });
    categoryTabs.appendChild(button);
  });
}

function renderItemList(category = null) {
  const items = category ? getItems().filter((item) => (item.category || item.type) === category) : getItems();
  templateCount.textContent = `${items.length} 款`;
  lensList.innerHTML = "";
  items.forEach((item) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "lens-card";
    button.setAttribute("aria-pressed", String(item.id === state.activeId));
    button.innerHTML = `<span class="index">${item.index || "T"}</span><strong>${item.name}</strong><span>${item.summary || ""}</span>`;
    button.addEventListener("click", () => {
      state.activeId = item.id;
      hydrateText(item);
      renderItemList(category);
      renderInfo();
      draw();
    });
    lensList.appendChild(button);
  });
}

function renderInfo() {
  const item = getActiveItem();
  templateInfo.innerHTML = `
    <h3>${item.index || ""}｜${item.name}</h3>
    <p>${item.summary || item.recommended || ""}</p>
    <div class="meta-row">
      <span class="pill">${item.type || "template"}</span>
      <span class="pill">${item.engine || item.family || item.category || "canvas2d"}</span>
      <span class="pill">${item.frame?.metadata || "SIMULATED"}</span>
    </div>
  `;
}

function draw() {
  renderer.render({
    source: state.image || demoImage,
    sources: state.images.length ? state.images : [state.image || demoImage],
    item: getActiveItem(),
    state,
    text: state.text,
    compareOriginal: state.compareOriginal
  });
  emptyState.style.display = state.image ? "none" : "grid";
}

function getItems() {
  if (state.workspace === "cameras") return SCIENCE_CAMERAS;
  if (state.workspace === "figures") return RESEARCH_FIGURES;
  return state.cards;
}

function getActiveItem() {
  return getItems().find((item) => item.id === state.activeId) || getItems()[0];
}

function hydrateText(item) {
  const defaults = item.defaults || item.text || {};
  const logoName = resolveDefaultJournalName(item);
  state.text = {
    title: logoName || defaults.title || item.name || "",
    subtitle: defaults.subtitle || item.summary || "",
    meta: defaults.meta || "SCIENTIFIC STYLE"
  };
  titleInput.value = state.text.title;
  subtitleInput.value = state.text.subtitle;
  metaInput.value = state.text.meta;
}

function syncStateFromDom() {
  state.zoom = Number(controls.zoom.value);
  state.offsetX = Number(controls.offsetX.value);
  state.offsetY = Number(controls.offsetY.value);
  state.rotation = Number(controls.rotation.value);
  state.intensity = Number(controls.intensity.value);
  state.spatialVariation = Number(controls.spatialVariation.value);
  state.cardScale = Number(controls.cardScale.value);
  state.cardRotate = Number(controls.cardRotate.value);
  state.reflection = Number(controls.reflection.value);
  draw();
}

function syncTextFromDom() {
  state.text = {
    title: titleInput.value,
    subtitle: subtitleInput.value,
    meta: metaInput.value
  };
  draw();
}

function syncDomFromState() {
  controls.zoom.value = state.zoom;
  controls.offsetX.value = state.offsetX;
  controls.offsetY.value = state.offsetY;
  controls.rotation.value = state.rotation;
  controls.intensity.value = state.intensity;
  controls.spatialVariation.value = state.spatialVariation;
  controls.cardScale.value = state.cardScale;
  controls.cardRotate.value = state.cardRotate;
  controls.reflection.value = state.reflection;
  titleInput.value = state.text.title;
  subtitleInput.value = state.text.subtitle;
  metaInput.value = state.text.meta;
  qualitySelect.value = state.quality;
  debugViewSelect.value = state.debugView;
  journalLogoModeSelect.value = state.journalLogoMode;
}

function resolveDefaultJournalName(item) {
  const logo = item?.params?.logo;
  if (!logo) return "";
  return state.journalLogoMode === "creative" ? logo.creative : logo.safe;
}

function resetTransform() {
  Object.assign(state, {
    zoom: 1,
    offsetX: 0,
    offsetY: 0,
    rotation: 0,
    intensity: 1,
    spatialVariation: 0.55,
    cardScale: 1,
    cardRotate: 0,
    reflection: 0.5,
    previewSize: QUALITY_PRESETS[state.quality].previewSize
  });
  syncDomFromState();
  draw();
}

function snapshotParams() {
  return {
    zoom: state.zoom,
    offsetX: state.offsetX,
    offsetY: state.offsetY,
    rotation: state.rotation,
    intensity: state.intensity,
    spatialVariation: state.spatialVariation,
    cardScale: state.cardScale,
    cardRotate: state.cardRotate,
    reflection: state.reflection
  };
}

function exportState() {
  return {
    ...state,
    previewSize: QUALITY_PRESETS[state.quality].longEdge
  };
}

function startDrag(event) {
  canvas.setPointerCapture(event.pointerId);
  state.pointer = {
    id: event.pointerId,
    x: event.clientX,
    y: event.clientY,
    offsetX: state.offsetX,
    offsetY: state.offsetY
  };
}

function moveDrag(event) {
  if (!state.pointer || event.pointerId !== state.pointer.id) return;
  const rect = canvas.getBoundingClientRect();
  const scale = canvas.width / rect.width;
  state.offsetX = state.pointer.offsetX + (event.clientX - state.pointer.x) * scale;
  state.offsetY = state.pointer.offsetY + (event.clientY - state.pointer.y) * scale;
  controls.offsetX.value = String(Math.round(state.offsetX));
  controls.offsetY.value = String(Math.round(state.offsetY));
  draw();
}

function endDrag() {
  state.pointer = null;
}

function createDemoImage() {
  const canvas = document.createElement("canvas");
  canvas.width = 1200;
  canvas.height = 1200;
  const ctx = canvas.getContext("2d");
  const gradient = ctx.createLinearGradient(0, 0, 1200, 1200);
  gradient.addColorStop(0, "#e8f3ea");
  gradient.addColorStop(0.36, "#8abdb3");
  gradient.addColorStop(0.66, "#e89dc8");
  gradient.addColorStop(1, "#1d1c22");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 1200, 1200);
  for (let i = 0; i < 120; i += 1) {
    const x = (Math.sin(i * 31.7) * 0.5 + 0.5) * 1200;
    const y = (Math.sin(i * 17.3 + 2) * 0.5 + 0.5) * 1200;
    ctx.fillStyle = `hsla(${(i * 41) % 360}, 68%, 62%, 0.2)`;
    ctx.beginPath();
    ctx.ellipse(x, y, 20 + (i % 8) * 12, 8 + (i % 5) * 17, i, 0, Math.PI * 2);
    ctx.fill();
  }
  return canvas;
}

startApp().catch((error) => {
  console.error(error);
  emptyState.innerHTML = "<strong>初始化失败</strong><span>请检查浏览器是否支持 ES Modules，并通过本地服务器或 GitHub Pages 打开。</span>";
});
