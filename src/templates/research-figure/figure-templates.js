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
    id: "FIGURE_2_VERTICAL_01",
    index: "FIG-2V",
    name: "双图竖排",
    type: "research-figure",
    summary: "上下对照布局，适合 before / after 或 control / treated。",
    canvas: { aspectRatio: "4:3", background: "#FFFFFF" },
    panels: [
      { id: "A", label: "A", caption: "Control", x: 0.08, y: 0.07, width: 0.84, height: 0.37 },
      { id: "B", label: "B", caption: "Treated", x: 0.08, y: 0.51, width: 0.84, height: 0.37 }
    ],
    annotations: [{ type: "scale-bar", x: 0.74, y: 0.82, label: "VISUAL SCALE" }],
    legend: { enabled: true, text: "Two-panel comparison figure" }
  },
  {
    id: "FIGURE_3_PANEL_01",
    index: "FIG-3",
    name: "三图布局",
    type: "research-figure",
    summary: "一个大图加两个侧图，适合主图 + 对照/细节。",
    canvas: { aspectRatio: "4:3", background: "#FFFFFF" },
    panels: [
      { id: "A", label: "A", caption: "Main", x: 0.05, y: 0.08, width: 0.58, height: 0.74 },
      { id: "B", label: "B", caption: "Detail 1", x: 0.68, y: 0.08, width: 0.27, height: 0.34 },
      { id: "C", label: "C", caption: "Detail 2", x: 0.68, y: 0.48, width: 0.27, height: 0.34 }
    ],
    annotations: [{ type: "arrow" }, { type: "scale-bar", x: 0.44, y: 0.75, label: "VISUAL SCALE" }],
    legend: { enabled: true, text: "Main panel with supporting views" }
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
  },
  {
    id: "FIGURE_MULTICHANNEL_01",
    index: "FIG-CH",
    name: "多通道荧光图版",
    type: "research-figure",
    summary: "Merge / CH1 / CH2 / CH3 四面板，自动生成通道伪彩。",
    canvas: { aspectRatio: "4:3", background: "#050506" },
    panels: [
      { id: "A", label: "Merge", caption: "Merged", x: 0.04, y: 0.08, width: 0.44, height: 0.4, analysisMode: "original" },
      { id: "B", label: "CH1", caption: "Green", x: 0.52, y: 0.08, width: 0.44, height: 0.4, analysisMode: "channel-green" },
      { id: "C", label: "CH2", caption: "Magenta", x: 0.04, y: 0.54, width: 0.44, height: 0.34, analysisMode: "channel-magenta" },
      { id: "D", label: "CH3", caption: "Blue", x: 0.52, y: 0.54, width: 0.44, height: 0.34, analysisMode: "channel-blue" }
    ],
    annotations: [{ type: "scale-bar", x: 0.72, y: 0.82, label: "VISUAL SCALE", color: "#ffffff" }],
    legend: { enabled: true, text: "Visual pseudo-channel split" }
  },
  {
    id: "FIGURE_ANALYSIS_A_01",
    index: "AN-A",
    name: "Analysis Figure A",
    type: "research-figure",
    summary: "A 原图、B 热力图、C 区域图、D 说明区，适合社交传播的分析图版。",
    canvas: { aspectRatio: "4:3", background: "#FFFFFF" },
    panels: [
      { id: "A", label: "A", caption: "Original", x: 0.04, y: 0.07, width: 0.46, height: 0.48, analysisMode: "original" },
      { id: "B", label: "B", caption: "Pseudo heatmap", x: 0.54, y: 0.07, width: 0.42, height: 0.24, analysisMode: "heatmap" },
      { id: "C", label: "C", caption: "Superpixel regions", x: 0.54, y: 0.35, width: 0.42, height: 0.2, analysisMode: "superpixel" },
      { id: "D", label: "D", caption: "Pixel statistics", x: 0.04, y: 0.62, width: 0.92, height: 0.24, analysisMode: "statistics" }
    ],
    annotations: [],
    legend: { enabled: true, text: "Derived analysis views are visual, not calibrated measurements." }
  },
  {
    id: "FIGURE_COMPUTATIONAL_01",
    index: "AN-CV",
    name: "Computational Vision Figure",
    type: "research-figure",
    summary: "原图、边缘图、超像素图、强度等高线图，像图像分析论文。",
    canvas: { aspectRatio: "4:3", background: "#FFFFFF" },
    panels: [
      { id: "A", label: "A", caption: "Original", x: 0.04, y: 0.07, width: 0.44, height: 0.36, analysisMode: "original" },
      { id: "B", label: "B", caption: "Edge map", x: 0.52, y: 0.07, width: 0.44, height: 0.36, analysisMode: "edge" },
      { id: "C", label: "C", caption: "Superpixel map", x: 0.04, y: 0.5, width: 0.44, height: 0.36, analysisMode: "superpixel" },
      { id: "D", label: "D", caption: "Contour intensity", x: 0.52, y: 0.5, width: 0.44, height: 0.36, analysisMode: "contour" }
    ],
    annotations: [],
    legend: { enabled: true, text: "Computational visual analysis figure" }
  },
  {
    id: "FIGURE_MODEL_01",
    index: "AN-M",
    name: "Conceptual Model Figure",
    type: "research-figure",
    summary: "左侧原图，右侧派生模型图 / 节点结构图。",
    canvas: { aspectRatio: "4:3", background: "#FFFFFF" },
    panels: [
      { id: "A", label: "A", caption: "Input", x: 0.05, y: 0.1, width: 0.42, height: 0.66, analysisMode: "original" },
      { id: "B", label: "B", caption: "Concept model", x: 0.53, y: 0.1, width: 0.42, height: 0.66, analysisMode: "model" }
    ],
    annotations: [{ type: "arrow", x1: 0.44, y1: 0.43, x2: 0.52, y2: 0.43 }],
    legend: { enabled: true, text: "Image-derived conceptual diagram" }
  },
  {
    id: "FIGURE_PIXEL_ABSTRACT_01",
    index: "AN-PX",
    name: "Pixel Abstraction Figure",
    type: "research-figure",
    summary: "原图、色块量化、超像素、统计图的抽象拼版。",
    canvas: { aspectRatio: "4:3", background: "#FFFFFF" },
    panels: [
      { id: "A", label: "A", caption: "Original", x: 0.04, y: 0.07, width: 0.44, height: 0.36, analysisMode: "original" },
      { id: "B", label: "B", caption: "Quantized blocks", x: 0.52, y: 0.07, width: 0.44, height: 0.36, analysisMode: "quantized" },
      { id: "C", label: "C", caption: "Superpixel", x: 0.04, y: 0.5, width: 0.44, height: 0.36, analysisMode: "superpixel" },
      { id: "D", label: "D", caption: "Statistics", x: 0.52, y: 0.5, width: 0.44, height: 0.36, analysisMode: "statistics" }
    ],
    annotations: [],
    legend: { enabled: true, text: "Pixel abstraction and derived data plate" }
  }
];
