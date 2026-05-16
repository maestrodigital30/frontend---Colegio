import { applyThemeColors } from './colorUtils';

const CLASE_BASE = 'tema-visual';

function setBodyTheme(codigo) {
  const body = document.body;
  body.classList.forEach(c => { if (c.startsWith(`${CLASE_BASE}-`)) body.classList.remove(c); });
  if (codigo) body.classList.add(`${CLASE_BASE}-${codigo}`);
}

function setDecorationFlags(decorations = {}) {
  const flags = ['glassmorphism', 'neonGlow', 'scanlines', 'particles'];
  flags.forEach(f => {
    const cls = `decoration-${f.toLowerCase()}`;
    if (decorations[f]) document.body.classList.add(cls);
    else document.body.classList.remove(cls);
  });
}

export function aplicarTemaVisual(tema) {
  if (!tema || !tema.config_json) {
    setBodyTheme(null);
    setDecorationFlags({});
    return;
  }
  const { colors = {}, decorations = {}, effects = {} } = tema.config_json;
  if (colors.primary && colors.secondary && colors.accent) {
    applyThemeColors(colors.primary, colors.secondary, colors.accent);
  }
  setBodyTheme(tema.codigo);
  setDecorationFlags(decorations);
  document.body.dataset.animationIntensity = effects.animationIntensity || 'medium';
}

export function aplicarColorPersonal(hex) {
  if (!hex || !/^#[0-9A-Fa-f]{6}$/.test(hex)) {
    document.documentElement.style.removeProperty('--color-personal');
    return;
  }
  document.documentElement.style.setProperty('--color-personal', hex);
}
