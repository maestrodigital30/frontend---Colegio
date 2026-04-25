/**
 * Sistema de colores dinamicos.
 * Genera paletas completas (50-950) a partir de un color hex base
 * y las aplica como CSS variables para consumo de Tailwind.
 */

function hexToHsl(hex) {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return [h * 360, s * 100, l * 100];
}

function hslToRgb(h, s, l) {
  h /= 360;
  s /= 100;
  l /= 100;

  if (s === 0) {
    const v = Math.round(l * 255);
    return [v, v, v];
  }

  const hue2rgb = (p, q, t) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;

  return [
    Math.round(hue2rgb(p, q, h + 1 / 3) * 255),
    Math.round(hue2rgb(p, q, h) * 255),
    Math.round(hue2rgb(p, q, h - 1 / 3) * 255),
  ];
}

function hexToRgb(hex) {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
}

const SHADE_CONFIG = {
  50:  { lightness: 97, satFactor: 0.35 },
  100: { lightness: 93, satFactor: 0.45 },
  200: { lightness: 86, satFactor: 0.55 },
  300: { lightness: 76, satFactor: 0.65 },
  400: { lightness: 64, satFactor: 0.85 },
  500: { lightness: null, satFactor: 1.0 },
  600: { lightnessFactor: 0.82, satFactor: 1.0 },
  700: { lightnessFactor: 0.64, satFactor: 0.95 },
  800: { lightnessFactor: 0.50, satFactor: 0.90 },
  900: { lightnessFactor: 0.38, satFactor: 0.85 },
  950: { lightnessFactor: 0.22, satFactor: 0.80 },
};

export function generatePalette(hex) {
  const [h, s, baseL] = hexToHsl(hex);
  const palette = {};

  for (const [shade, cfg] of Object.entries(SHADE_CONFIG)) {
    let targetL, targetS;

    if (cfg.lightness !== undefined && cfg.lightness !== null) {
      targetL = cfg.lightness;
    } else if (cfg.lightnessFactor !== undefined) {
      targetL = baseL * cfg.lightnessFactor;
    } else {
      targetL = baseL;
    }

    targetS = s * cfg.satFactor;
    targetL = Math.min(targetL, 100);
    targetS = Math.min(targetS, 100);

    const [r, g, b] = hslToRgb(h, targetS, targetL);
    palette[shade] = [r, g, b];
  }

  return palette;
}

export function applyThemeColors(primaryHex, secondaryHex, accentHex) {
  const root = document.documentElement;
  const themes = {
    primary: generatePalette(primaryHex),
    secondary: generatePalette(secondaryHex),
    accent: generatePalette(accentHex),
  };

  root.style.setProperty('--color-primary', primaryHex);
  root.style.setProperty('--color-secondary', secondaryHex);
  root.style.setProperty('--color-accent', accentHex);

  for (const [name, palette] of Object.entries(themes)) {
    for (const [shade, [r, g, b]] of Object.entries(palette)) {
      root.style.setProperty(`--color-${name}-${shade}`, `${r} ${g} ${b}`);
    }
  }
}

export const DEFAULT_COLORS = {
  primary: '#1976D2',
  secondary: '#42A5F5',
  accent: '#0D47A1',
};

export function getDefaultPalettes() {
  return {
    primary: generatePalette(DEFAULT_COLORS.primary),
    secondary: generatePalette(DEFAULT_COLORS.secondary),
    accent: generatePalette(DEFAULT_COLORS.accent),
  };
}
