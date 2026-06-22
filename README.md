# Science Lens H5 Prototype

科研镜头 H5 原型，用于测试 Brightfield、Fluorescence、SEM、GelDoc 等科研视觉滤镜。

## Features

- Upload a local image
- Switch science lens presets
- Adjust zoom, position, and rotation
- Render overlays such as scale bars, channel labels, scanlines, and instrument metadata
- Download the generated preview image

## Files

- `index.html`: app shell
- `styles.css`: mobile-first UI styles
- `app.js`: Canvas rendering and interactions
- `science-lenses.json`: data-driven science lens presets
- `science-lenses.config.ts`: typed preset reference for future app development

## Notes

This is a visual simulation prototype, not a scientific measurement tool.

## Git Sync Policy

For this project, major updates should be committed and pushed to GitHub by default.

Major updates include:

- New user-facing pages or workflows
- New core rendering features
- Large science lens preset changes
- Deployment or GitHub Pages configuration changes
- Broad UI or interaction changes

Small visual tuning can be batched into the next major update unless an immediate sync is requested.
