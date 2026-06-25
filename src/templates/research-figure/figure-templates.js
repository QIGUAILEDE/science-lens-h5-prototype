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
  },
  {
    id: "IMGFIG_COLOR_LUMINANCE_STRUCTURE_01",
    index: "IF-ATLAS",
    name: "Color · Luminance · Structure Atlas",
    category: "Image → Figure",
    type: "research-figure",
    summary: "3x3 色彩、亮度、结构综合图谱，所有图表来自原图像素。",
    canvas: { aspectRatio: "1:1", background: "#FFFFFF" },
    panels: [
      { id: "A", label: "A", caption: "Original + 4x4 sampling grid", x: 0.035, y: 0.055, width: 0.29, height: 0.25, analysisMode: "sample-grid" },
      { id: "B", label: "B", caption: "24x18 mean color grid", x: 0.355, y: 0.055, width: 0.29, height: 0.25, analysisMode: "pixel-grid" },
      { id: "C", label: "C", caption: "Local luminance map", x: 0.675, y: 0.055, width: 0.29, height: 0.25, analysisMode: "luminance-grid" },
      { id: "D", label: "D", caption: "Local saturation map", x: 0.035, y: 0.355, width: 0.29, height: 0.25, analysisMode: "saturation-grid" },
      { id: "E", label: "E", caption: "Structure / texture strength", x: 0.355, y: 0.355, width: 0.29, height: 0.25, analysisMode: "texture-grid" },
      { id: "F", label: "F", caption: "RGB intensity distribution", x: 0.675, y: 0.355, width: 0.29, height: 0.25, analysisMode: "rgb-histogram" },
      { id: "G", label: "G", caption: "Hue distribution, S > 0.18", x: 0.035, y: 0.655, width: 0.29, height: 0.25, analysisMode: "hue-histogram" },
      { id: "H", label: "H", caption: "Dominant colors, K = 8", x: 0.355, y: 0.655, width: 0.29, height: 0.25, analysisMode: "dominant-colors" },
      { id: "I", label: "I", caption: "Vertical color/luminance profile", x: 0.675, y: 0.655, width: 0.29, height: 0.25, analysisMode: "vertical-profile" }
    ],
    annotations: [],
    legend: { enabled: true, text: "Image-Derived Analysis / normalized visual metrics" },
    defaults: { title: "Color · Luminance · Structure Atlas", subtitle: "Image-derived analysis atlas", meta: "Not calibrated scientific measurement" }
  },
  {
    id: "IMGFIG_COLOR_PROFILE_01",
    index: "IF-COLOR",
    name: "Color Profile 图像色彩画像",
    category: "Image → Figure",
    type: "research-figure",
    summary: "RGB、Hue、Lab 散点、主色聚类和饱和度亮度散点。",
    canvas: { aspectRatio: "4:3", background: "#FFFFFF" },
    panels: [
      { id: "A", label: "A", caption: "Original", x: 0.04, y: 0.08, width: 0.28, height: 0.34, analysisMode: "original" },
      { id: "B", label: "B", caption: "RGB histogram", x: 0.36, y: 0.08, width: 0.28, height: 0.34, analysisMode: "rgb-histogram" },
      { id: "C", label: "C", caption: "Hue histogram", x: 0.68, y: 0.08, width: 0.28, height: 0.34, analysisMode: "hue-histogram" },
      { id: "D", label: "D", caption: "Lab a*/b* scatter", x: 0.04, y: 0.5, width: 0.28, height: 0.34, analysisMode: "lab-scatter" },
      { id: "E", label: "E", caption: "Dominant colors", x: 0.36, y: 0.5, width: 0.28, height: 0.34, analysisMode: "dominant-colors" },
      { id: "F", label: "F", caption: "Saturation / brightness", x: 0.68, y: 0.5, width: 0.28, height: 0.34, analysisMode: "sat-lum-scatter" }
    ],
    annotations: [],
    legend: { enabled: true, text: "Derived Color Distribution" }
  },
  {
    id: "IMGFIG_STRUCTURE_TEXTURE_01",
    index: "IF-STRUCT",
    name: "Structure & Texture Atlas",
    category: "Image → Figure",
    type: "research-figure",
    summary: "结构、纹理、边缘和局部强度图谱。",
    canvas: { aspectRatio: "1:1", background: "#FFFFFF" },
    panels: [
      { id: "A", label: "A", caption: "Original", x: 0.035, y: 0.055, width: 0.29, height: 0.25, analysisMode: "original" },
      { id: "B", label: "B", caption: "Edge map", x: 0.355, y: 0.055, width: 0.29, height: 0.25, analysisMode: "edge" },
      { id: "C", label: "C", caption: "Gradient heatmap", x: 0.675, y: 0.055, width: 0.29, height: 0.25, analysisMode: "texture-grid" },
      { id: "D", label: "D", caption: "Contour", x: 0.035, y: 0.355, width: 0.29, height: 0.25, analysisMode: "contour" },
      { id: "E", label: "E", caption: "Superpixel", x: 0.355, y: 0.355, width: 0.29, height: 0.25, analysisMode: "superpixel" },
      { id: "F", label: "F", caption: "Sharpness summary", x: 0.675, y: 0.355, width: 0.29, height: 0.25, analysisMode: "summary" },
      { id: "G", label: "G", caption: "Local luminance", x: 0.035, y: 0.655, width: 0.29, height: 0.25, analysisMode: "luminance-grid" },
      { id: "H", label: "H", caption: "Vertical profile", x: 0.355, y: 0.655, width: 0.29, height: 0.25, analysisMode: "vertical-profile" },
      { id: "I", label: "I", caption: "Model graph", x: 0.675, y: 0.655, width: 0.29, height: 0.25, analysisMode: "model" }
    ],
    annotations: [],
    legend: { enabled: true, text: "Structure and texture are derived from image gradients." }
  },
  {
    id: "IMGFIG_PIXEL_ABSTRACTION_ATLAS_01",
    index: "IF-PIXEL",
    name: "Pixel Abstraction Atlas",
    category: "Image → Figure",
    type: "research-figure",
    summary: "多尺度像素抽象、量化、超像素和主色比例。",
    canvas: { aspectRatio: "1:1", background: "#FFFFFF" },
    panels: [
      { id: "A", label: "A", caption: "Original", x: 0.035, y: 0.055, width: 0.29, height: 0.25, analysisMode: "original" },
      { id: "B", label: "B", caption: "Mean color grid", x: 0.355, y: 0.055, width: 0.29, height: 0.25, analysisMode: "pixel-grid" },
      { id: "C", label: "C", caption: "12x9 abstraction", x: 0.675, y: 0.055, width: 0.29, height: 0.25, analysisMode: "quantized" },
      { id: "D", label: "D", caption: "Superpixel", x: 0.035, y: 0.355, width: 0.29, height: 0.25, analysisMode: "superpixel" },
      { id: "E", label: "E", caption: "Dominant colors", x: 0.355, y: 0.355, width: 0.29, height: 0.25, analysisMode: "dominant-colors" },
      { id: "F", label: "F", caption: "Contour", x: 0.675, y: 0.355, width: 0.29, height: 0.25, analysisMode: "contour" },
      { id: "G", label: "G", caption: "Hue distribution", x: 0.035, y: 0.655, width: 0.29, height: 0.25, analysisMode: "hue-histogram" },
      { id: "H", label: "H", caption: "RGB distribution", x: 0.355, y: 0.655, width: 0.29, height: 0.25, analysisMode: "rgb-histogram" },
      { id: "I", label: "I", caption: "Summary", x: 0.675, y: 0.655, width: 0.29, height: 0.25, analysisMode: "summary" }
    ],
    annotations: [],
    legend: { enabled: true, text: "Pixel abstraction views are computed from the uploaded image." }
  },
  {
    id: "IMGFIG_VISUAL_DATA_CARD_01",
    index: "IF-CARD",
    name: "Visual Data Card 视觉数据卡",
    category: "Image → Figure",
    type: "research-figure",
    summary: "适合手机分享的 2x2 轻量分析卡。",
    canvas: { aspectRatio: "4:5", background: "#FFFFFF" },
    panels: [
      { id: "A", label: "A", caption: "Original", x: 0.06, y: 0.08, width: 0.4, height: 0.35, analysisMode: "original" },
      { id: "B", label: "B", caption: "Dominant colors", x: 0.54, y: 0.08, width: 0.4, height: 0.35, analysisMode: "dominant-colors" },
      { id: "C", label: "C", caption: "Luminance map", x: 0.06, y: 0.51, width: 0.4, height: 0.35, analysisMode: "luminance-grid" },
      { id: "D", label: "D", caption: "RGB distribution", x: 0.54, y: 0.51, width: 0.4, height: 0.35, analysisMode: "rgb-histogram" }
    ],
    annotations: [],
    legend: { enabled: true, text: "Image-Derived Visual Data Card" }
  }
];
