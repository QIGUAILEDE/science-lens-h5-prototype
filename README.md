# Science Lens H5 Prototype

科研镜头 H5 原型，用于测试科学仪器滤镜、科学透明透卡和期刊透明取景卡。

## Features

- Upload a local image
- Switch 30 science templates across 5 categories
- Adjust zoom, position, and rotation
- Edit title, subtitle, and metadata text
- Adjust effect intensity, transparent card scale, card rotation, and glass reflection
- Compare original image with generated result
- Render overlays such as microscope masks, scale bars, channel labels, scanlines, specimen cards, acrylic highlights, and journal-style transparent frames
- Download the generated preview image

## Files

- `index.html`: app shell
- `styles.css`: mobile-first UI styles
- `app.js`: ES module entrypoint
- `src/`: modular imaging engine, science cameras, templates, and preset services
- `science-templates.json`: advanced template presets for filters, overlays, hybrid effects, and journal transparent cards
- `science-lenses.json`: data-driven science lens presets
- `science-lenses.config.ts`: typed preset reference for future app development
- `p0-upgrade-report.md`: current P0 architecture and acceptance notes

## Notes

This is a visual simulation prototype, not a scientific measurement tool.

## Advanced Prototype Scope

Implemented template groups:

- Microscope field templates
- Fluorescence and electron imaging templates
- Staining and transparent light templates
- Scientific information card templates
- Journal transparent viewfinder cards

The current rendering engine is Canvas 2D first. Some complex effects, such as liquify distortion, color diffusion, confocal layer separation, and refraction, are implemented as lightweight visual approximations. They are intentionally marked in `science-templates.json` as `canvas2d-now-webgl-later` when they should eventually move to WebGL shaders.

The first WebGL shader pass is now available for the four flagship science cameras: PH-Live, FL-Duo, SEM-Carbon, and Diffusion-Stain. Other cards and legacy templates continue to use the Canvas 2D fallback path.

The flagship science cameras now also use a non-uniform parameter map generated from image luminance, edge, texture, saliency, and Lab/HSV region features. Use the Debug View selector to inspect intermediate maps such as luminance, edge, texture, saliency, channel A/B, stain, and material.

Phase 2 restores the broader feature set: 21 usable science-camera styles, 15 journal/card templates, 11 research figure templates, multi-image Figure import, panel image rendering, and derived analysis views such as visual heatmap, edge map, pseudo contour, superpixel map, pixel statistics, and conceptual model diagrams. See `phase-2-implementation-report.md` for the audit and implementation notes.

## Git Sync Policy

For this project, major updates should be committed and pushed to GitHub by default.

Major updates include:

- New user-facing pages or workflows
- New core rendering features
- Large science lens preset changes
- Deployment or GitHub Pages configuration changes
- Broad UI or interaction changes

Small visual tuning can be batched into the next major update unless an immediate sync is requested.
