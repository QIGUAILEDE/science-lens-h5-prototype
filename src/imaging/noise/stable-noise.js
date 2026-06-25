export function seedFromString(value) {
  return String(value).split("").reduce((sum, char) => (sum * 31 + char.charCodeAt(0)) >>> 0, 2166136261);
}

export function stableUnit(seed, index = 0) {
  const x = Math.sin((seed + index * 1013) * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

export function stableSigned(seed, index = 0) {
  return stableUnit(seed, index) * 2 - 1;
}

export function stablePoint(seed, index) {
  return {
    x: stableUnit(seed, index * 3),
    y: stableUnit(seed, index * 3 + 1),
    z: stableUnit(seed, index * 3 + 2)
  };
}

