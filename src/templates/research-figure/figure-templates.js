export const RESEARCH_FIGURES = [
  {
    id: "FIGURE_SINGLE_01",
    index: "FIG-1",
    name: "单图 Figure",
    type: "research-figure",
    summary: "单张科学图片，含面板编号、标题和图注位置。",
    canvas: { aspectRatio: "4:3", background: "#FFFFFF" },
    panels: [{ id: "A", label: "A", x: 0.06, y: 0.08, width: 0.88, height: 0.78 }],
    annotations: [],
    legend: { enabled: true, text: "" }
  },
  {
    id: "FIGURE_2_PANEL_01",
    index: "FIG-2",
    name: "双图横排",
    type: "research-figure",
    summary: "实验组 / 对照组双面板布局。",
    canvas: { aspectRatio: "4:3", background: "#FFFFFF" },
    panels: [
      { id: "A", label: "A", x: 0.05, y: 0.11, width: 0.42, height: 0.68 },
      { id: "B", label: "B", x: 0.53, y: 0.11, width: 0.42, height: 0.68 }
    ],
    annotations: [],
    legend: { enabled: true, text: "" }
  },
  {
    id: "FIGURE_4_PANEL_01",
    index: "FIG-4",
    name: "四面板科学图版",
    type: "research-figure",
    summary: "A/B/C/D 四宫格科学图版，适合多通道或对照排版。",
    canvas: { aspectRatio: "4:3", background: "#FFFFFF" },
    panels: [
      { id: "A", label: "A", x: 0.04, y: 0.06, width: 0.44, height: 0.4 },
      { id: "B", label: "B", x: 0.52, y: 0.06, width: 0.44, height: 0.4 },
      { id: "C", label: "C", x: 0.04, y: 0.52, width: 0.44, height: 0.4 },
      { id: "D", label: "D", x: 0.52, y: 0.52, width: 0.44, height: 0.4 }
    ],
    annotations: [],
    legend: { enabled: false, text: "" }
  },
  {
    id: "FIGURE_ZOOM_01",
    index: "FIG-Z",
    name: "主图 + 局部放大",
    type: "research-figure",
    summary: "主图配两个局部放大面板，后续接入多图导入。",
    canvas: { aspectRatio: "4:3", background: "#FFFFFF" },
    panels: [
      { id: "A", label: "A", x: 0.05, y: 0.08, width: 0.58, height: 0.74 },
      { id: "B", label: "B", x: 0.68, y: 0.08, width: 0.27, height: 0.34 },
      { id: "C", label: "C", x: 0.68, y: 0.48, width: 0.27, height: 0.34 }
    ],
    annotations: [{ type: "dashed-rect", panel: "A" }],
    legend: { enabled: true, text: "" }
  }
];

