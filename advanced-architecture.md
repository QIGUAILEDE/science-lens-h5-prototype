# Advanced Science Lens Architecture

## Recommended Mini Program Stack

- WeChat Mini Program native framework
- Canvas 2D for MVP rendering
- Optional WebGL shader layer for advanced effects
- Static JSON template configs
- Local image processing first, no backend required for MVP

## Directory Structure

```text
miniprogram/
  app.json
  pages/
    editor/
      editor.wxml
      editor.wxss
      editor.ts
    result/
  engine/
    render-pipeline.ts
    pixel-filters.ts
    overlays.ts
    journal-cards.ts
    webgl-effects.ts
  presets/
    science-templates.json
    science-lenses.json
  assets/
    textures/
    frames/
    icons/
```

This H5 prototype keeps the same conceptual split:

- `index.html`: editor shell
- `styles.css`: responsive UI
- `app.js`: Canvas 2D render engine
- `science-templates.json`: advanced template configuration

## Render Engine Design

Render order:

1. Background fill
2. Uploaded image draw with crop, zoom, position, and rotation
3. Base Canvas filter
4. Pixel pipeline
5. Synthetic scientific layers
6. Transparent card or microscope overlay
7. Editable text
8. Export

Template dispatch:

- `filter`: color and pixel processing
- `overlay`: masks, labels, cards, droplets, glass layers
- `hybrid`: filter plus overlay
- `journal`: acrylic transparent viewfinder card
- `journal-hybrid`: journal frame plus science mask

## Template Config System

Each preset is data driven:

- `id`
- `index`
- `name`
- `category`
- `type`
- `engine`
- `summary`
- `params`
- `text`
- `controls`

Complex effects that should move to shader code are marked as `canvas2d-now-webgl-later`.

## MVP Schedule

1. Static H5 and template config
2. Upload, crop, move, rotate, export
3. Canvas 2D filter pipeline
4. Scientific overlays and editable text
5. Journal transparent cards
6. WeChat Mini Program migration
7. WebGL shader upgrade for distortion, diffusion, refraction, and edge effects

## First 10 Template Difficulty

- 01 Black circle brightfield: low
- 04 Electron funhouse: high, WebGL later
- 05 Polarized crystal: medium
- 10 Green-magenta fluorescence: medium
- 16 Silver SEM: medium
- 21 Polar fluid bloom: high, WebGL later
- 22 Pixel cell blocks: medium
- J01 Red science view card: low
- J02 Nature campus card: low
- J07 Graduation issue card: low

## Canvas 2D First

- Brightness, contrast, saturation
- Grayscale, tint, invert mix
- Circle masks and black field
- Noise, scanlines, vignette
- Pixel blocks
- Scale bars and metadata
- Journal frames
- Acrylic highlights
- Simple node networks and microfluidic lines

## WebGL Shader Later

- Liquify distortion
- Edge-aware fluorescence
- True color diffusion
- Refraction and acrylic edge displacement
- Confocal layer offsets
- High-pass SEM clarity
- Hex / cellular segmentation

## Performance Plan

- Preview at 1080-1200 px
- Export at higher resolution later
- Debounce expensive sliders
- Cache uploaded image as an offscreen canvas
- Use Canvas 2D for all lightweight templates
- Move only expensive effects to WebGL
- Avoid server calls for basic rendering
