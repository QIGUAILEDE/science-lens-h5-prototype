const canvas = document.querySelector("#previewCanvas");
const ctx = canvas.getContext("2d", { willReadFrequently: true });
const fileInput = document.querySelector("#fileInput");
const lensList = document.querySelector("#lensList");
const emptyState = document.querySelector("#emptyState");
const zoomRange = document.querySelector("#zoomRange");
const offsetXRange = document.querySelector("#offsetXRange");
const offsetYRange = document.querySelector("#offsetYRange");
const rotationRange = document.querySelector("#rotationRange");
const resetButton = document.querySelector("#resetButton");
const downloadButton = document.querySelector("#downloadButton");

const state = {
  image: null,
  lenses: [],
  activeLensId: "sem_3000x",
  zoom: 1,
  offsetX: 0,
  offsetY: 0,
  rotation: 0
};

const demoGradient = (() => {
  const offscreen = document.createElement("canvas");
  offscreen.width = 1200;
  offscreen.height = 1200;
  const gtx = offscreen.getContext("2d");
  const gradient = gtx.createLinearGradient(0, 0, 1200, 1200);
  gradient.addColorStop(0, "#d9f2e5");
  gradient.addColorStop(0.45, "#6f8f83");
  gradient.addColorStop(1, "#201f1d");
  gtx.fillStyle = gradient;
  gtx.fillRect(0, 0, 1200, 1200);
  for (let i = 0; i < 90; i += 1) {
    const x = Math.random() * 1200;
    const y = Math.random() * 1200;
    const r = 18 + Math.random() * 80;
    gtx.beginPath();
    gtx.fillStyle = `rgba(${120 + Math.random() * 80}, ${160 + Math.random() * 80}, ${130 + Math.random() * 80}, 0.22)`;
    gtx.ellipse(x, y, r, r * (0.4 + Math.random() * 0.8), Math.random() * Math.PI, 0, Math.PI * 2);
    gtx.fill();
  }
  return offscreen;
})();

async function init() {
  const response = await fetch("./science-lenses.json");
  const data = await response.json();
  state.lenses = data.lenses.filter((lens) =>
    ["brightfield_40x", "fluorescence_gfp", "fluorescence_rfp", "sem_3000x", "geldoc_365nm"].includes(lens.id)
  );
  renderLensList();
  draw();
}

function renderLensList() {
  lensList.innerHTML = "";
  state.lenses.forEach((lens) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "lens-card";
    button.setAttribute("aria-pressed", String(lens.id === state.activeLensId));
    button.innerHTML = `<strong>${lens.name}</strong><span>${lens.description || lens.category}</span>`;
    button.addEventListener("click", () => {
      state.activeLensId = lens.id;
      renderLensList();
      draw();
    });
    lensList.appendChild(button);
  });
}

function getActiveLens() {
  return state.lenses.find((lens) => lens.id === state.activeLensId) || state.lenses[0];
}

function resetTransform() {
  state.zoom = 1;
  state.offsetX = 0;
  state.offsetY = 0;
  state.rotation = 0;
  zoomRange.value = "1";
  offsetXRange.value = "0";
  offsetYRange.value = "0";
  rotationRange.value = "0";
  draw();
}

function draw() {
  const lens = getActiveLens();
  const source = state.image || demoGradient;
  const size = 1200;
  canvas.width = size;
  canvas.height = size;

  ctx.save();
  ctx.fillStyle = lens?.color?.background || "#050607";
  ctx.fillRect(0, 0, size, size);

  if (lens?.view?.mask === "circle") {
    const radius = (size * lens.view.coverage) / 2;
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, radius, 0, Math.PI * 2);
    ctx.clip();
  }

  drawImageCover(source, lens);
  ctx.restore();

  applyPixelFilters(lens);
  drawSyntheticEffects(lens);
  drawOverlays(lens);

  emptyState.style.display = state.image ? "none" : "grid";
}

function drawImageCover(source, lens) {
  const size = 1200;
  const imageWidth = source.naturalWidth || source.width;
  const imageHeight = source.naturalHeight || source.height;
  const baseScale = Math.max(size / imageWidth, size / imageHeight) * state.zoom;
  const drawWidth = imageWidth * baseScale;
  const drawHeight = imageHeight * baseScale;

  ctx.save();
  ctx.translate(size / 2 + state.offsetX, size / 2 + state.offsetY);
  ctx.rotate((state.rotation * Math.PI) / 180);
  ctx.filter = buildCanvasFilter(lens);
  ctx.drawImage(source, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
  ctx.filter = "none";
  ctx.restore();
}

function buildCanvasFilter(lens) {
  const filters = lens?.filters || {};
  const brightness = filters.brightness ?? 1;
  const contrast = filters.contrast ?? 1;
  const saturation = filters.grayscale ? 0 : filters.saturation ?? 1;
  const blur = Math.max(filters.blur || filters.softBlur || 0, 0) * 2.8;
  return `brightness(${brightness}) contrast(${contrast}) saturate(${saturation}) blur(${blur}px)`;
}

function applyPixelFilters(lens) {
  const filters = lens?.filters || {};
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  const main = hexToRgb(lens?.color?.mainColor || "#ffffff");
  const bg = hexToRgb(lens?.color?.background || "#000000");

  for (let i = 0; i < data.length; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];
    const luminance = 0.299 * r + 0.587 * g + 0.114 * b;

    if (filters.grayscale) {
      r = luminance;
      g = luminance;
      b = luminance;
    }

    if (lens.id.startsWith("fluorescence")) {
      const signal = Math.max(0, (luminance - 42) / 213);
      r = bg.r * (1 - signal) + main.r * signal;
      g = bg.g * (1 - signal) + main.g * signal;
      b = bg.b * (1 - signal) + main.b * signal;
    }

    if (lens.id === "geldoc_365nm") {
      const signal = Math.pow(Math.max(0, (luminance - 55) / 200), 1.8);
      r = 8 + 232 * signal;
      g = 4 + 242 * signal;
      b = 34 + 255 * signal;
    }

    if (filters.blueTint) {
      b += 55 * filters.blueTint;
      r -= 18 * filters.blueTint;
    }

    if (filters.temperatureKelvin && filters.temperatureKelvin < 5500) {
      r += 8;
      g += 3;
      b -= 6;
    }

    const noise = (filters.noise || filters.grain || 0) * 255;
    if (noise > 0) {
      const n = (Math.random() - 0.5) * noise;
      r += n;
      g += n;
      b += n;
    }

    data[i] = clamp(r);
    data[i + 1] = clamp(g);
    data[i + 2] = clamp(b);
  }

  ctx.putImageData(imageData, 0, 0);
}

function drawSyntheticEffects(lens) {
  const size = canvas.width;
  const filters = lens?.filters || {};

  if (filters.glow) {
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ctx.filter = `blur(${filters.bloomRadius || 10}px)`;
    ctx.globalAlpha = filters.glow * 0.55;
    ctx.drawImage(canvas, 0, 0);
    ctx.restore();
  }

  if (filters.scanline) {
    ctx.save();
    ctx.globalAlpha = filters.scanline;
    ctx.fillStyle = "#000";
    for (let y = 0; y < size; y += 5) {
      ctx.fillRect(0, y, size, 1);
    }
    ctx.restore();
  }

  const vignette = filters.vignette ?? 0;
  if (vignette > 0) {
    const gradient = ctx.createRadialGradient(size / 2, size / 2, size * 0.22, size / 2, size / 2, size * 0.72);
    gradient.addColorStop(0, "rgba(0,0,0,0)");
    gradient.addColorStop(1, `rgba(0,0,0,${Math.min(0.82, vignette)})`);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
  }

  if (lens?.view?.mask === "circle") {
    const radius = (size * lens.view.coverage) / 2;
    ctx.save();
    ctx.globalCompositeOperation = "destination-over";
    ctx.fillStyle = "#050607";
    ctx.fillRect(0, 0, size, size);
    ctx.restore();
    ctx.save();
    ctx.strokeStyle = "rgba(255,255,255,0.22)";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}

function drawOverlays(lens) {
  const size = canvas.width;
  const overlay = lens?.overlay || {};
  ctx.save();
  ctx.font = "24px 'Roboto Mono', 'SFMono-Regular', Menlo, monospace";
  ctx.textBaseline = "top";
  ctx.fillStyle = lens?.id === "brightfield_40x" ? "rgba(20,25,22,0.75)" : "rgba(240,250,248,0.88)";

  if (lens?.id === "sem_3000x") {
    ctx.fillStyle = "rgba(0,0,0,0.72)";
    ctx.fillRect(0, size - 92, size, 92);
    ctx.fillStyle = "rgba(240,240,240,0.92)";
    ctx.fillText("SEM   Mag 3000×   HV 5.0 kV   WD 8.2 mm   SE", 34, size - 62);
  } else if (lens?.id === "geldoc_365nm") {
    ctx.fillText("GelDoc XR+   365 nm   Exposure 1.2 s   EtBr", 34, size - 62);
    drawLaneMarkers();
  } else {
    const labels = overlay.labels || [];
    labels.slice(0, 3).forEach((label, index) => {
      ctx.fillText(label, 34, 34 + index * 34);
    });
  }

  if (overlay.scaleBar) {
    drawScaleBar(overlay.scaleBar, lens);
  }

  ctx.restore();
}

function drawScaleBar(text, lens) {
  const size = canvas.width;
  const barWidth = lens?.id === "sem_3000x" ? 190 : 230;
  const x = size - barWidth - 70;
  const y = size - 98;
  const light = lens?.id !== "brightfield_40x";
  ctx.strokeStyle = light ? "#f4faf8" : "#1f2522";
  ctx.fillStyle = light ? "#f4faf8" : "#1f2522";
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + barWidth, y);
  ctx.stroke();
  ctx.font = "24px 'Roboto Mono', 'SFMono-Regular', Menlo, monospace";
  ctx.fillText(text, x + 18, y + 16);
}

function drawLaneMarkers() {
  ctx.save();
  ctx.globalAlpha = 0.55;
  ctx.strokeStyle = "rgba(230,240,255,0.45)";
  ctx.lineWidth = 2;
  for (let x = 185; x <= 1000; x += 116) {
    ctx.beginPath();
    ctx.moveTo(x, 160);
    ctx.lineTo(x, 1020);
    ctx.stroke();
  }
  ctx.restore();
}

function hexToRgb(hex) {
  const value = hex.replace("#", "");
  const normalized = value.length === 3 ? value.split("").map((c) => c + c).join("") : value;
  const number = Number.parseInt(normalized, 16);
  return {
    r: (number >> 16) & 255,
    g: (number >> 8) & 255,
    b: number & 255
  };
}

function clamp(value) {
  return Math.max(0, Math.min(255, value));
}

fileInput.addEventListener("change", (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  const image = new Image();
  image.onload = () => {
    state.image = image;
    resetTransform();
    URL.revokeObjectURL(image.src);
  };
  image.src = URL.createObjectURL(file);
});

[zoomRange, offsetXRange, offsetYRange, rotationRange].forEach((input) => {
  input.addEventListener("input", () => {
    state.zoom = Number(zoomRange.value);
    state.offsetX = Number(offsetXRange.value);
    state.offsetY = Number(offsetYRange.value);
    state.rotation = Number(rotationRange.value);
    draw();
  });
});

resetButton.addEventListener("click", resetTransform);

downloadButton.addEventListener("click", () => {
  const link = document.createElement("a");
  link.download = `${state.activeLensId}.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
});

init().catch((error) => {
  console.error(error);
  emptyState.innerHTML = "<strong>配置加载失败</strong><span>请通过本地服务器打开，不要直接用 file:// 打开。</span>";
});
