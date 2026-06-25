# Phase 2 Implementation Report

## Audit Summary

- Current stack: static H5 prototype with ES modules, Canvas 2D, WebGL shader pass, JSON template data, and GitHub Pages deployment.
- Existing science-camera rendering: `ScienceRenderer` draws source image, then runs either `WebGLSciencePass` or Canvas fallback passes.
- Existing shader support before this pass: PH-Live, FL-Duo, SEM-Carbon, Diffusion-Stain via `phase`, `fluorescence`, `electron`, and `stain` families.
- Existing region analysis: `RegionAnalyzer` extracts luminance, edge, texture, saliency, Lab/HSV region features, cluster IDs, and an RGBA parameter map.
- Existing card system: `science-templates.json` stores legacy overlays and journal cards; rendering happened in `drawJournalFrame`.
- Existing figure system: `RESEARCH_FIGURES` existed, but `renderResearchFigure` only drew gray panel placeholders and labels.

## Figure Image Bug

Root cause:

- Image loading worked.
- Figure template data existed.
- The renderer did not draw the uploaded image into panel slots.
- `renderResearchFigure` cleared the canvas, filled panel rectangles, and rendered labels only.

Fix:

- Added `drawImageInRect` for panel-local cover/contain drawing.
- Passed uploaded image sources into `renderResearchFigure`.
- Added multi-image upload support; panels auto-fill from selected images.
- Added analysis-derived panel rendering for heatmap, edge, contour, superpixel, quantized, statistics, channel, and model diagram views.

## Restored Science Cameras

The science camera list now contains 21 usable entries. Former `planned-camera` entries were converted into renderable `science-camera` entries.

Covered categories:

- Optical microscopy: Brightfield 40x, PH-Live, DIC-Relief, Darkfield, H&E-like tissue stain.
- Fluorescence: FL-Duo, Confocal RGB, GFP, RFP, DAPI-like.
- Electron microscopy: SEM-Carbon, TEM Slice, Cryo Particle.
- Archive / instrument: CCD-98, Instrument Screen, Archive Scan.
- Abstract / data: Pixel-Sample, Visual Heatmap, Model Diagram, Polarized Crystal, Diffusion-Stain.

## Journal Card Upgrade

Changes:

- Journal text defaults now use journal-name logic instead of `xxx VIEW`.
- Added stronger masthead / issue / image-window / footer structure.
- Removed the visual direction that looked like hidden black body text behind the image.
- Added publication-style templates:
  - Contemporary Science
  - Journal of Biomedical Imaging
  - Microscopy Letters
  - Advanced Matter
  - Natural Science transparent card
  - Cellular Reports transparent card
  - Research Article Page

## Figure Templates

Figure templates now include:

- Single Panel
- Two Panel Horizontal
- Two Panel Vertical
- Three Panel
- Four Panels
- Main + Inset
- Multichannel Imaging Figure
- Analysis Figure A
- Computational Vision Figure
- Conceptual Model Figure
- Pixel Abstraction Figure

## New Analysis / Data Views

Added `src/imaging/analysis/derived-views.js`:

- visual heatmap
- edge density map
- pseudo contour
- block segmentation / superpixel look
- color quantization
- pixel statistics chart
- conceptual model diagram
- green / magenta / blue pseudo channels

All derived analysis views are labeled as visual or pseudo analysis, not calibrated scientific measurement.

## Files Added

- `src/imaging/analysis/derived-views.js`
- `phase-2-implementation-report.md`

## Files Modified

- `index.html`
- `science-templates.json`
- `src/imaging/renderer/science-renderer.js`
- `src/imaging/utils/canvas.js`
- `src/main.js`
- `src/styles/science-cameras.js`
- `src/templates/research-figure/figure-templates.js`

## Validation

- JSON parse check passed.
- ES module syntax checks passed.
- Module import checks passed for camera and figure registries.
- Local HTTP server could be started, but this execution environment did not allow the separate `curl` process to connect to the spawned server session. No server was left running.

## Known Limitations

- Figure panel dragging is still global image drag rather than per-panel drag.
- Multi-image Figure uses upload order for panels; no per-panel image picker yet.
- Journal transparent PNG export still exports the full canvas composition; true transparent-only card export needs a separate export mode.
- Some newly restored cameras reuse the current four shader families with different style parameters; deeper per-family shader branches should be added next.
- Region analysis still uses grid-superpixel approximation rather than true SLIC.

## Recommended Next Step

- Add per-panel Figure editing state.
- Add true transparent-card export mode.
- Add specific shader branches for DIC, polarized, pixel quantization, archive, and heatmap families.
- Replace grid-superpixel approximation with iterative SLIC while preserving the current parameter-map API.

## Transparent Journal Card Correction

Updated after review:

- Journal cards are now rendered as transparent acrylic viewing cards, not white magazine pages.
- `drawJournalFrame` no longer draws a white center panel, inner image box, or dense divider lines.
- The photo remains the base layer; the card only renders outer border, masthead/logo text, sparse metadata, optional footer text, acrylic edge highlight, and weak reflection.
- J01-J06 now use `layout: "transparent-card"` and explicit `cardCenterBackground: "none"` / `contentAreaFill: 0` configuration.
- J02 is now a Nature-style blue/yellow campus viewing card: yellow outer border, blue masthead, left/top issue text, minimal footer, and a fully transparent center.

Logo modes:

- `safe`: original substitute mastheads for release, such as `Natural Science Reports`, `Science Reports`, `Cellular Reports`, and `Neural Reports`.
- `creative`: direct creative masthead names for concept/user mode: `Nature`, `Science`, `Cell`, and `Neuron`.

The UI exposes this as `刊名字标模式`, and recipe saving stores the selected mode.

## Image to Figure Expansion

Added an independent `Image → Figure` workspace.

New analysis module:

- `src/imaging/analysis/image-analysis.js`

It computes deterministic image-derived data:

- RGB histograms
- luminance histogram
- saturation histogram
- hue histogram with `S > 0.18`
- mean luminance
- mean saturation
- dynamic range
- highlight/shadow clipping ratios
- edge density
- sharpness score
- Lab-like dominant color clustering
- local luminance/saturation/warmth/texture grids
- vertical luminance/saturation/warmth profiles

New first-batch presets:

- `Color · Luminance · Structure Atlas`
- `Color Profile`
- `Structure & Texture Atlas`
- `Pixel Abstraction Atlas`
- `Visual Data Card`

Important correction:

- The conceptual model view is now derived from sampled image pixels, dominant colors, luminance, and saturation rather than fixed decorative points.
- RGB, hue, dominant color, profile, scatter, and summary panels all use the same cached image analysis result.

README was rewritten as a Chinese/English bilingual document to match the current product state.
