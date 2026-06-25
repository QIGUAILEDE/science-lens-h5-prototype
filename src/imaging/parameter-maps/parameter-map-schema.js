export const PARAMETER_MAP_SCHEMA = {
  id: "string",
  width: "number",
  height: "number",
  format: "r8 | r16f | rgba8 | rgba16f",
  minValue: "number",
  maxValue: "number",
  source: "luminance | color-cluster | texture | edge | saliency | combined",
  textureHandle: "optional"
};

export const PARAMETER_MAP_CHANNELS = {
  r: "stainStrengthMap",
  g: "channelAMap",
  b: "channelBMap",
  a: "materialLikeMap + foregroundWeight"
};

