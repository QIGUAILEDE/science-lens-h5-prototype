export const QUALITY_PRESETS = {
  smooth: { label: "流畅", longEdge: 2048, previewSize: 900 },
  standard: { label: "标准", longEdge: 3072, previewSize: 1200 },
  high: { label: "高清", longEdge: 4096, previewSize: 1400 }
};

export function downloadCanvas(canvas, filename, type = "image/png") {
  const link = document.createElement("a");
  link.download = filename;
  link.href = canvas.toDataURL(type);
  link.click();
}

