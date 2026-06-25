# Science Lens H5 Prototype / 科研镜头 H5 原型

## Overview / 项目概览

**EN:** Science Lens is a mobile-first H5 prototype for turning ordinary photos into science-inspired images, transparent journal viewfinder cards, and research-style figures. It is a visual simulation and creative tool, not a calibrated scientific measurement product.

**中文：** 科研镜头是一个移动端优先的 H5 原型，用于把普通照片转换成科学成像风格图片、透明期刊取景透卡和论文 Figure / 图像分析图版。它是视觉模拟和创作工具，不是经过校准的科学测量工具。

Live demo / 在线预览：

[https://qiguailede.github.io/science-lens-h5-prototype/](https://qiguailede.github.io/science-lens-h5-prototype/)

## Current Feature Set / 当前功能

**EN:**

- Upload one or multiple local images.
- Switch between Science Cameras, Science Cards, Research Figure, and Image → Figure.
- Adjust image zoom, position, rotation, effect intensity, spatial variation, card scale, card rotation, and acrylic reflection.
- Compare original image with generated result.
- Save and load parameter recipes locally.
- Export PNG previews at Smooth, Standard, or High quality.

**中文：**

- 支持上传一张或多张本地图片。
- 支持切换「科学镜头」「科学透卡」「论文 Figure」「Image → Figure 图像分析图版」四个入口。
- 支持调节图片缩放、位置、旋转、效果强度、非均匀程度、透卡缩放、透卡旋转和亚克力反光。
- 支持原图对比。
- 支持本地保存和应用配方。
- 支持按流畅、标准、高清档位导出 PNG 预览图。

## Science Cameras / 科学镜头

**EN:** The prototype currently includes 21 usable science-camera styles across optical microscopy, fluorescence, electron microscopy, archive/instrument looks, and abstract/data visualization styles.

**中文：** 当前包含 21 个可用科学镜头，覆盖光学显微、荧光、电镜、科学档案/仪器屏幕和抽象数据化风格。

Main examples / 主要示例：

- PH-Live 活细胞相差镜
- FL-Duo 绿紫双通道荧光镜
- SEM-Carbon 扫描电子显微镜
- Diffusion-Stain 晕染染色
- Brightfield 40x 明场显微镜
- DIC-Relief 微分浮雕镜
- Darkfield 暗场显微镜
- Confocal RGB 共聚焦层扫
- GFP / RFP / DAPI 单通道荧光
- TEM Slice / Cryo Particle
- CCD-98 / Instrument Screen / Archive Scan
- Visual Heatmap / Model Diagram / Pixel-Sample

## Transparent Journal Cards / 透明期刊透卡

**EN:** Journal cards have been corrected into real transparent acrylic viewfinder cards. The uploaded photo remains the base scene; the card only renders a border, masthead/logo text, sparse metadata, optional footer text, acrylic edge highlights, and weak reflection. The center is no longer filled by a white page or inner image box.

**中文：** 期刊透卡已经修正为真正的透明亚克力取景卡。上传照片作为底图场景，透卡只叠加外边框、顶部期刊字标、少量卷期信息、可选底部说明、边缘厚度和弱反光。中间区域不再绘制白底页面或内部图片框。

Logo modes / 字标模式：

- **Safe / 原创替代：** Science Reports, Natural Science Reports, Cellular Reports, Neural Reports.
- **Creative / 创意展示：** Science, Nature, Cell, Neuron.

Updated presets / 已修正预设：

- J01 Science 风格红框透卡
- J02 Nature 风格蓝黄校园透明透卡
- J03 Cell 风格极简透卡
- J04 Neuron 风格神经网络透卡
- J05 显微镜期刊复合透卡
- J06 预印本透明卡

## Research Figure / 论文 Figure

**EN:** Research Figure supports multi-image upload and panel-based composition. Uploaded images are now rendered inside panels instead of placeholder boxes.

**中文：** 论文 Figure 支持多图上传和面板式排版。上传图片现在会真正绘制到面板中，不再只是灰色占位框。

Available templates / 可用模板：

- Single Panel
- Two Panel Horizontal / Vertical
- Three Panel
- Four Panels
- Main + Inset
- Multichannel Imaging Figure
- Analysis Figure A
- Computational Vision Figure
- Conceptual Model Figure
- Pixel Abstraction Figure

## Image → Figure / 图像分析图版

**EN:** Image → Figure is an independent entry for automatically turning one uploaded image into data-driven visual analysis figures. The charts are derived from real pixel data, not random decoration.

**中文：** Image → Figure 是独立入口，用于把一张上传图片自动生成数据化图像分析图版。图表来自真实像素分析，不使用随机装饰数据。

Implemented analysis / 已实现分析：

- RGB pixel intensity histograms / RGB 像素强度分布
- Hue distribution with saturation threshold / 饱和度阈值后的色相分布
- Local luminance, saturation, warmth, and texture maps / 局部亮度、饱和度、暖色指数和纹理图
- Dominant color clustering in Lab-like space / 类 Lab 空间主色聚类
- Pixel grid abstraction / 低像素色块抽象
- Lab a*/b* color scatter / Lab 色彩散点图
- Saturation vs brightness scatter / 饱和度-亮度散点图
- Vertical luminance/saturation/warmth profile / 垂直空间剖面
- Image-derived region/model diagram / 图像派生区域模型图
- Summary metrics / 图像分析摘要

First preset batch / 第一批预设：

- Color · Luminance · Structure Atlas 色彩—亮度—结构综合九宫格
- Color Profile 图像色彩画像
- Structure & Texture Atlas 结构与纹理图谱
- Pixel Abstraction Atlas 像素抽象图谱
- Visual Data Card 视觉数据卡

## Rendering Architecture / 渲染架构

**EN:**

- Canvas 2D handles layout, overlays, text, transparent cards, figures, and export composition.
- WebGL shader pass handles flagship science-camera effects for phase, fluorescence, electron, and stain families.
- RegionAnalyzer builds non-uniform parameter maps from luminance, edge, texture, saliency, and Lab/HSV features.
- ImageAnalysis builds real image-derived statistics for Image → Figure.

**中文：**

- Canvas 2D 负责排版、叠层、文字、透明透卡、Figure 和导出合成。
- WebGL Shader Pass 负责旗舰科学镜头效果，包括相差、荧光、电镜和染色类。
- RegionAnalyzer 基于亮度、边缘、纹理、显著性和 Lab/HSV 特征生成非均匀参数图。
- ImageAnalysis 为 Image → Figure 生成真实像素统计和分析图表。

## Project Files / 文件说明

- `index.html`: app shell / 应用页面结构
- `styles.css`: mobile-first UI styles / 移动端优先样式
- `app.js`: ES module entrypoint / ES 模块入口
- `src/main.js`: UI state and interaction / UI 状态和交互
- `src/imaging/renderer/science-renderer.js`: main renderer / 主渲染器
- `src/imaging/shaders/webgl-science-pass.js`: WebGL science shader / 科学镜头 WebGL shader
- `src/imaging/analysis/region-analyzer.js`: non-uniform parameter maps / 非均匀参数图分析
- `src/imaging/analysis/image-analysis.js`: Image → Figure statistics / 图像分析统计
- `src/imaging/analysis/derived-views.js`: derived heatmaps/charts/views / 衍生热图、图表和分析视图
- `src/styles/science-cameras.js`: science-camera presets / 科学镜头配置
- `src/templates/research-figure/figure-templates.js`: Figure and Image → Figure templates / Figure 与图像分析图版模板
- `science-templates.json`: cards, overlays, legacy templates, and journal cards / 透卡、叠层、旧模板和期刊透卡
- `phase-2-implementation-report.md`: latest implementation notes / 最新实现说明
- `p0-upgrade-report.md`: P0 architecture notes / P0 架构说明

## Local Run / 本地运行

**EN:**

Run from this directory:

```bash
python3 -m http.server 8793
```

Then open:

```text
http://127.0.0.1:8793/
```

**中文：**

在当前目录执行：

```bash
python3 -m http.server 8793
```

然后打开：

```text
http://127.0.0.1:8793/
```

## Important Notes / 重要说明

**EN:**

- All scale bars and scientific metadata are visual simulations unless explicitly calibrated.
- Heatmaps and analysis charts are image-derived visual metrics, not temperature, concentration, protein expression, or biological activity measurements.
- Creative logo mode is for personal concept display and user-customized creation; safe logo mode should be used for public/commercial release.

**中文：**

- 未经校准的比例尺和科学参数都是视觉模拟。
- 热力图和分析图表是图像派生视觉指标，不代表温度、浓度、蛋白表达或生物活性测量。
- 创意字标模式适合个人概念展示和用户自定义创作；正式上线或商用应使用原创替代字标模式。

## Known Limitations / 已知限制

**EN:**

- Per-panel drag/editing for Figure is not fully implemented yet.
- Transparent-card-only PNG export still needs a dedicated export mode.
- Some restored science-camera styles still reuse existing shader families and need deeper specialized shader branches.
- Region analysis uses a grid-superpixel approximation rather than full SLIC.
- Image → Figure analysis is optimized for preview-scale computation; future export should recompute charts at final resolution.

**中文：**

- Figure 的单面板拖拽和精细编辑尚未完全实现。
- 仅导出透明透卡层的 PNG 还需要独立导出模式。
- 部分恢复的科学镜头仍复用现有 shader family，后续需要更细的专属 shader 分支。
- 区域分析目前使用 grid-superpixel 近似方案，还不是真正完整 SLIC。
- Image → Figure 当前以预览级分析为主，未来高清导出应在最终分辨率重新绘制图表。

## Git Sync Policy / Git 同步规则

**EN:** Major user-facing updates should be committed and pushed to GitHub Pages by default.

**中文：** 重要的用户可见更新默认提交并推送到 GitHub Pages。
