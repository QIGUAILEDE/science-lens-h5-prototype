export function createWorkingCanvas(size) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  return {
    canvas,
    ctx: canvas.getContext("2d", { willReadFrequently: true })
  };
}

export function drawCover(ctx, source, size, transform) {
  const imageWidth = source.naturalWidth || source.width;
  const imageHeight = source.naturalHeight || source.height;
  const baseScale = Math.max(size / imageWidth, size / imageHeight) * transform.zoom;
  const drawWidth = imageWidth * baseScale;
  const drawHeight = imageHeight * baseScale;

  ctx.save();
  ctx.translate(size / 2 + transform.offsetX, size / 2 + transform.offsetY);
  ctx.rotate((transform.rotation * Math.PI) / 180);
  ctx.drawImage(source, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
  ctx.restore();
}

export function roundedRect(ctx, x, y, width, height, radius) {
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

