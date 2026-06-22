# Science Lens Parameter Pack

This pack turns the four MVP lenses into a stable, parameter-driven schema:

- `brightfield_40x`: circular brightfield microscope view, 1:1 crop, 88% circular coverage, 40× objective / 400× total magnification.
- `fluorescence_gfp`, `fluorescence_rfp`, `fluorescence_dapi`: black-background fluorescence presets with laser/channel metadata and glow controls.
- `sem_3000x`: FEI / Zeiss-inspired SEM status overlay, 4:3 default crop, high clarity, scanline, grain, grayscale.
- `geldoc_365nm`: vertical gel documentation look with UV tint, high contrast, white-blue bands, exposure/filter metadata.

Recommended first-version implementation:

1. Load `science-lenses.json` into the mini program as static data.
2. Use `cropRatio`, `view.mask`, and `view.coverage` before drawing filters.
3. Apply basic Canvas 2D operations first: brightness, contrast, saturation, grayscale, tint, vignette.
4. Add synthetic effects after the base filter: glow, grain/noise, scanline, edge blur.
5. Draw overlays last: scale bar, metadata labels, channel labels, SEM/GelDoc status bars.

For WeChat Canvas 2D, the fastest MVP path is:

- Use an offscreen canvas for image processing.
- Render the final export canvas at 2x or 3x preview resolution.
- Keep all lens data JSON-driven so new lenses do not require editor code changes.

Good default launch set:

- Brightfield / Fluorescence / SEM: `1:1`
- SEM alternative: `4:3`
- GelDoc: `4:5`
- Paper figure export: `16:9`

