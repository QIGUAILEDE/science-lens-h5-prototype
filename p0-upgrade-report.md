# P0 Upgrade Report

## Current Audit

- Stack: static H5 on GitHub Pages.
- Existing rendering: Canvas 2D only, previously concentrated in `app.js`.
- Existing templates: `science-templates.json` contains 30 filter/card/journal presets.
- Existing export: preview canvas exported to PNG.
- Main bottleneck: UI state, template dispatch, pixel processing, overlays, and export were coupled in one large file.

## New Directory Structure

```text
src/
  imaging/
    renderer/
      science-renderer.js
    passes/
      color-pass.js
      structure-pass.js
      optics-pass.js
      noise-pass.js
    export/
      exporter.js
    noise/
      stable-noise.js
    utils/
      canvas.js
      math.js
  styles/
    science-cameras.js
  templates/
    journal/
      journal-frame-schema.js
    research-figure/
      figure-templates.js
  services/
    preset/
      preset-store.js
  main.js
```

The old `app.js` is now a thin ES module entrypoint.

## Rendering Pipeline

```text
source image
-> draw cover with non-destructive transform
-> tone and channel pass
-> structure pass
-> sensor noise pass
-> optical pass
-> scientific metadata / journal / figure overlay
-> preview or export
```

The editor now records parameters instead of destructively changing the uploaded image.

## Shader Pass Plan

The current implementation is Canvas 2D fallback. These files are the future shader pass boundaries:

- `color-pass.js`: exposure, contrast, gamma, saturation, black level, channel mapping.
- `structure-pass.js`: current edge/gradient fallback; future Sobel, DoG, Laplacian, relief, SEM texture pass.
- `optics-pass.js`: microscope mask, bloom, vignette, scanlines, dust; future PSF, refraction, field blur.
- `noise-pass.js`: seeded read noise, shot noise, fixed pattern noise, hot pixels.

## First Four Science Cameras

### PH-Live

Phase contrast look. Uses low saturation, gray-blue tone mapping, edge halo fallback, microscope circle, dust, vignette, and read/shot noise.

### FL-Duo

Dual-channel fluorescence look. Uses black level suppression and maps coarse structure to green while mapping high-frequency detail to violet. Adds bloom and seeded sensor noise.

### SEM-Carbon

Cold gray electron microscopy look. Uses grayscale tone, high contrast, gradient texture enhancement, scanline optics, vignette, and SEM metadata bar.

### Diffusion-Stain

Soft stain look. Preserves image brightness structure while adding primary/secondary stain color drift, mild structure, bloom, dust, and low noise.

## Style JSON / JS Fields

Science camera style fields:

- `id`
- `index`
- `name`
- `category`
- `type`
- `family`
- `summary`
- `recommended`
- `tone`
- `channels`
- `structure`
- `optics`
- `sensor`
- `frame`
- `defaults`

The eventual JSON version should mirror `src/styles/science-cameras.js`.

## Journal-Frame Schema

Defined in `src/templates/journal/journal-frame-schema.js`.

It separates:

- `canvas`
- `imageSlots`
- `textSlots`
- `decorations`
- `export`

This keeps journal cover cards separate from paper figures.

## Research-Figure Schema

Defined in `src/templates/research-figure/figure-templates.js`.

It supports:

- single figure
- two-panel layout
- four-panel layout
- main image plus zoom panels

Multi-image import is not implemented yet; current panels are structural placeholders.

## New Parameters

- `workspace`: cameras / cards / figures
- `quality`: smooth / standard / high
- `seed`: stable noise seed
- `imageId`: stable noise input key
- `intensity`: global effect strength
- `cardScale`
- `cardRotate`
- `reflection`
- non-destructive image transform: zoom, offset, rotation

## Performance Notes

- Preview and export now use quality presets.
- Seeded noise prevents random flicker between redraws.
- Rendering is still Canvas 2D and still redraws the full frame on slider input.
- WebGL shader passes should replace expensive pixel loops in the next step.

## Compatibility Notes

- Uses browser ES modules, supported by modern mobile browsers and GitHub Pages.
- WeChat Mini Program migration should translate modules into TypeScript files under `miniprogram/`.
- WebGL unsupported devices can continue using this Canvas 2D fallback.

## Known Issues

- EXIF orientation correction is not implemented yet.
- Real multi-image Research-Figure import is not implemented yet.
- True high-resolution re-render is scaffolded by quality presets but still uses one canvas path.
- WebGL shader pass is now implemented for the first four science cameras, with Canvas 2D fallback.
- Transparent PNG export for standalone frames is schema-ready but not exposed in UI.

## WebGL Shader Upgrade

Added `src/imaging/shaders/webgl-science-pass.js`.

The shader computes analysis signals directly from the source texture:

- luminance map
- low-frequency smooth map
- Difference-of-Gaussians-style detail signal
- edge / gradient map
- highlight mask
- dark mask

Per camera behavior:

- PH-Live: uses DoG positive and negative halos aligned to real image edges.
- FL-Duo: maps smooth subject structure to green and high-frequency detail/edge signal to magenta.
- SEM-Carbon: computes a surface-normal-like gradient and directional light for SEM relief.
- Diffusion-Stain: uses smooth structure, local detail, and two stain colors for structure-aware diffusion.

The shader output is followed by Canvas overlay rendering for metadata, microscope mask, cards, and text. If WebGL is unavailable, the renderer automatically falls back to the Canvas 2D passes.

## Non-Uniform Region-Aware Upgrade

Added:

- `src/imaging/analysis/color-space/conversions.js`
- `src/imaging/analysis/region-analyzer.js`
- `src/imaging/parameter-maps/parameter-map-schema.js`

The analyzer runs before science-camera rendering and produces:

- RGB to HSV / Lab features
- luminance map
- edge map
- detail / local contrast map
- texture map
- saliency approximation
- grid-superpixel region features
- Lab-feature k-means clusters
- RGBA parameter map

Parameter map channels:

- R: `stainStrengthMap`
- G: `channelAMap`
- B: `channelBMap`
- A: `materialLikeMap + foregroundWeight`

The WebGL shader now samples the parameter map:

- PH-Live: local halo width and stain tone vary by material/stain maps.
- FL-Duo: channel A/B/C strengths vary by foreground, edge/detail, and material/highlight maps.
- SEM-Carbon: material response and local micro contrast vary by region.
- Diffusion-Stain: stain penetration and color mixing vary by cluster/texture/foreground maps.

## Debug Map Viewer

The editor now exposes a debug view selector:

- final
- parameter
- luminance
- edge
- texture
- saliency
- channelA
- channelB
- stain
- material

This makes it possible to verify whether the filter is driven by real image structure rather than a uniform overlay.

## Current Limitation

The current `RegionAnalyzer` uses a grid-superpixel approximation instead of full SLIC. It still extracts region features and clusters them in Lab-like feature space, but boundaries are not yet as natural as true SLIC. The next step should replace the grid cells with iterative SLIC centers while preserving the same `RegionFeature` and `ParameterMap` interfaces.

## Acceptance Checklist

- Science camera workspace exists.
- Scientific card workspace still exposes existing templates.
- Research Figure workspace exists with initial layout templates.
- Four flagship science cameras render through the new pipeline.
- Recipe save/load stores parameters only, not the image.
- Original comparison remains available.
- GitHub Pages can serve ES module files.
