export type CropRatio = "1:1" | "3:4" | "4:5" | "9:16" | "16:9";
export type ViewMask = "rect" | "circle";
export type MetadataPosition = "top-left" | "bottom-left" | "bottom" | "top-right" | "bottom-right";

export interface ScienceLensPreset {
  id: string;
  name: string;
  category: string;
  description?: string;
  cropRatio: CropRatio;
  alternateCropRatios?: CropRatio[];
  view: {
    mask: ViewMask;
    coverage: number;
    fieldOfViewUm?: {
      min: number;
      max: number;
    };
  };
  filters: Record<string, number | boolean | string>;
  color?: Record<string, string | number>;
  overlay: {
    scaleBar?: string | null;
    scaleBarOptions?: string[];
    labels?: string[];
    frame?: string;
    [key: string]: unknown;
  };
  ui: {
    panelStyle: string;
    fontFamily: string;
    metadataPosition: MetadataPosition;
  };
}

export const CROP_PRESETS = {
  square: { ratio: "1:1", label: "Square / Microscope" },
  xhsCover: { ratio: "3:4", label: "Xiaohongshu Cover" },
  xhsFeed: { ratio: "4:5", label: "Xiaohongshu Feed" },
  story: { ratio: "9:16", label: "Story" },
  paperFigure: { ratio: "16:9", label: "Paper Figure" }
} as const;

export const SCIENCE_LENSES: ScienceLensPreset[] = [
  {
    id: "brightfield_40x",
    name: "Brightfield 40×",
    category: "microscopy",
    description: "Bright background, natural specimen color, moderate contrast, slight edge defocus, circular field of view.",
    cropRatio: "1:1",
    view: {
      mask: "circle",
      coverage: 0.88,
      fieldOfViewUm: { min: 450, max: 560 }
    },
    filters: {
      brightness: 1.08,
      contrast: 1.15,
      saturation: 0.85,
      temperatureKelvin: 5200,
      sharpness: 0.25,
      edgeBlur: 0.18,
      noise: 0.02,
      vignette: 0.15,
      chromaticAberration: 0.02
    },
    color: {
      background: "#f8f5e8",
      tint: "#fff4d6",
      tintOpacity: 0.08
    },
    overlay: {
      objective: "40×",
      eyepiece: "10×",
      totalMag: "400×",
      scaleBar: "100 μm",
      scaleBarOptions: ["50 μm", "100 μm", "200 μm"],
      labels: ["BF", "40×", "Scale 100 μm"],
      frame: "microscope-circle",
      reticle: false
    },
    ui: {
      panelStyle: "light-microscope",
      fontFamily: "system-ui",
      metadataPosition: "bottom-left"
    }
  },
  {
    id: "fluorescence_gfp",
    name: "Fluorescence GFP",
    category: "microscopy",
    description: "Black background, green emission channel, high contrast, glowing edges.",
    cropRatio: "1:1",
    view: { mask: "rect", coverage: 1 },
    filters: {
      brightness: 0.95,
      contrast: 2.2,
      saturation: 1.8,
      glow: 0.45,
      bloomRadius: 12,
      blur: 0.1,
      noise: 0.03,
      vignette: 0.2,
      blackPoint: 0.18
    },
    color: {
      background: "#000000",
      mainColor: "#00FF66",
      secondaryColor: "#B8FFD1"
    },
    overlay: {
      channel: "GFP",
      laser: "488 nm",
      objective: "40×",
      na: "1.30",
      scaleBar: "50 μm",
      scaleBarOptions: ["20 μm", "50 μm", "100 μm"],
      labels: ["GFP", "Ex 488 nm", "Em 509 nm"],
      frame: "fluorescence-dark"
    },
    ui: {
      panelStyle: "dark-instrument",
      fontFamily: "Roboto Mono, JetBrains Mono, monospace",
      metadataPosition: "top-left"
    }
  },
  {
    id: "fluorescence_rfp",
    name: "Fluorescence RFP",
    category: "microscopy",
    description: "Black background, red emission channel, high contrast, glowing sample boundaries.",
    cropRatio: "1:1",
    view: { mask: "rect", coverage: 1 },
    filters: {
      brightness: 0.95,
      contrast: 2.2,
      saturation: 1.8,
      glow: 0.45,
      bloomRadius: 12,
      blur: 0.1,
      noise: 0.03,
      vignette: 0.2,
      blackPoint: 0.18
    },
    color: {
      background: "#000000",
      mainColor: "#FF3B30",
      secondaryColor: "#FFD1CC"
    },
    overlay: {
      channel: "RFP",
      laser: "561 nm",
      objective: "40×",
      na: "1.30",
      scaleBar: "50 μm",
      scaleBarOptions: ["20 μm", "50 μm", "100 μm"],
      labels: ["RFP", "Ex 561 nm", "Em 610 nm"],
      frame: "fluorescence-dark"
    },
    ui: {
      panelStyle: "dark-instrument",
      fontFamily: "Roboto Mono, JetBrains Mono, monospace",
      metadataPosition: "top-left"
    }
  },
  {
    id: "fluorescence_dapi",
    name: "Fluorescence DAPI",
    category: "microscopy",
    description: "Black background, blue nuclear stain look, high contrast and moderate bloom.",
    cropRatio: "1:1",
    view: { mask: "rect", coverage: 1 },
    filters: {
      brightness: 0.95,
      contrast: 2.2,
      saturation: 1.8,
      glow: 0.45,
      bloomRadius: 10,
      blur: 0.1,
      noise: 0.03,
      vignette: 0.2,
      blackPoint: 0.18
    },
    color: {
      background: "#000000",
      mainColor: "#3D7DFF",
      secondaryColor: "#C6D8FF"
    },
    overlay: {
      channel: "DAPI",
      laser: "405 nm",
      objective: "40×",
      na: "1.30",
      scaleBar: "50 μm",
      scaleBarOptions: ["20 μm", "50 μm", "100 μm"],
      labels: ["DAPI", "Ex 405 nm", "Em 461 nm"],
      frame: "fluorescence-dark"
    },
    ui: {
      panelStyle: "dark-instrument",
      fontFamily: "Roboto Mono, JetBrains Mono, monospace",
      metadataPosition: "top-left"
    }
  },
  {
    id: "sem_3000x",
    name: "SEM 3000×",
    category: "electron-microscopy",
    description: "Monochrome, very sharp local contrast, metallic texture, microparticles, subtle scanlines.",
    cropRatio: "4:3",
    alternateCropRatios: ["1:1"],
    view: { mask: "rect", coverage: 1 },
    filters: {
      grayscale: true,
      brightness: 0.95,
      contrast: 2.4,
      saturation: 0,
      sharpness: 0.85,
      clarity: 0.9,
      microContrast: 0.75,
      noise: 0.15,
      grain: 0.22,
      scanline: 0.08,
      vignette: 0
    },
    color: {
      background: "#111111",
      mainColor: "#d8d8d8",
      shadowColor: "#050505"
    },
    overlay: {
      instrument: "SEM",
      magnification: "3000×",
      hv: "5.0 kV",
      wd: "8.2 mm",
      detector: "SE",
      date: "Auto",
      scaleBar: "10 μm",
      scaleBarOptions: ["5 μm", "10 μm", "20 μm"],
      labels: ["SEM", "Mag 3000×", "HV 5.0 kV", "WD 8.2 mm", "SE"],
      frame: "sem-status-bar"
    },
    ui: {
      panelStyle: "fei-zeiss-inspired",
      fontFamily: "DIN, Roboto Mono, JetBrains Mono, monospace",
      metadataPosition: "bottom"
    }
  },
  {
    id: "geldoc_365nm",
    name: "GelDoc 365 nm",
    category: "gel-imaging",
    description: "Dark ultraviolet gel documentation look with bright white-blue bands and high contrast.",
    cropRatio: "4:5",
    view: { mask: "rect", coverage: 1 },
    filters: {
      brightness: 0.8,
      contrast: 2.8,
      saturation: 0.2,
      blueTint: 0.4,
      glow: 0.38,
      blur: 0.12,
      noise: 0.05,
      vignette: 0.35,
      blackPoint: 0.22
    },
    color: {
      background: "#09001A",
      mainColor: "#E8F2FF",
      secondaryColor: "#8AA6FF",
      uvTint: "#3C1A80"
    },
    overlay: {
      instrument: "GelDoc XR+",
      excitation: "365 nm",
      exposure: "1.2 s",
      filter: "EtBr",
      scaleBar: null,
      labels: ["GelDoc XR+", "365 nm", "Exposure 1.2 s", "EtBr"],
      frame: "geldoc-capture",
      laneMarkers: true
    },
    ui: {
      panelStyle: "dark-geldoc",
      fontFamily: "Roboto Mono, JetBrains Mono, monospace",
      metadataPosition: "bottom-left"
    }
  }
];

export const DEFAULT_LENS_ID = "sem_3000x";

