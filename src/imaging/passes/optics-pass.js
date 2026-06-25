import { stablePoint } from "../noise/stable-noise.js";
import { seedFromString } from "../noise/stable-noise.js";

export function applyOptics(ctx, style, state, size) {
  const optics = style.optics || {};
  if (optics.bloom) {
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ctx.globalAlpha = optics.bloom * (state.intensity ?? 1);
    ctx.filter = `blur(${Math.max(6, optics.bloom * 80)}px)`;
    ctx.drawImage(ctx.canvas, 0, 0);
    ctx.restore();
  }

  if (optics.vignette) {
    const gradient = ctx.createRadialGradient(size / 2, size / 2, size * 0.24, size / 2, size / 2, size * 0.72);
    gradient.addColorStop(0, "rgba(0,0,0,0)");
    gradient.addColorStop(1, `rgba(0,0,0,${Math.min(0.85, optics.vignette)})`);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
  }

  if (optics.field === "microscope-circle") {
    drawMicroscopeMask(ctx, size, optics.coverage || 0.82);
  }

  if (optics.dust) {
    drawDust(ctx, size, `${style.id}:${state.seed || 1}`, optics.dust);
  }

  if (optics.scanline) {
    ctx.save();
    ctx.globalAlpha = optics.scanline;
    ctx.fillStyle = "#000";
    for (let y = 0; y < size; y += 5) ctx.fillRect(0, y, size, 1);
    ctx.restore();
  }
}

export function drawMicroscopeMask(ctx, size, coverage) {
  const radius = (size * coverage) / 2;
  ctx.save();
  ctx.fillStyle = "#040404";
  ctx.beginPath();
  ctx.rect(0, 0, size, size);
  ctx.arc(size / 2, size / 2, radius, 0, Math.PI * 2, true);
  ctx.fill("evenodd");
  const gradient = ctx.createRadialGradient(size / 2, size / 2, radius * 0.88, size / 2, size / 2, radius * 1.08);
  gradient.addColorStop(0, "rgba(0,0,0,0)");
  gradient.addColorStop(1, "rgba(0,0,0,0.8)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  ctx.strokeStyle = "rgba(255,255,255,0.32)";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawDust(ctx, size, seedText, amount) {
  const seed = seedFromString(seedText);
  ctx.save();
  ctx.globalAlpha = amount;
  ctx.fillStyle = "rgba(255,255,255,0.38)";
  for (let i = 0; i < 70; i += 1) {
    const p = stablePoint(seed, i);
    ctx.beginPath();
    ctx.arc(p.x * size, p.y * size, 0.8 + p.z * 2.2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

