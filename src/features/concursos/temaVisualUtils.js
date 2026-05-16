import { CONCURSOS } from '../../utils/constants';

export function obtenerTemaVisual(clave) {
  return CONCURSOS.TEMAS_VISUALES.find((t) => t.value === clave) || CONCURSOS.TEMAS_VISUALES[0];
}

export function estilosFondoTema(tema) {
  const t = obtenerTemaVisual(tema);
  if (t.value === 'neon') {
    return {
      background: `radial-gradient(ellipse at top, ${t.secundario}33 0%, ${t.primario} 60%, #000 100%)`,
    };
  }
  if (t.value === 'kids') {
    return {
      background: `linear-gradient(135deg, ${t.primario} 0%, ${t.secundario} 60%, ${t.acento} 100%)`,
    };
  }
  if (t.value === 'retro') {
    return {
      background: `linear-gradient(135deg, ${t.primario} 0%, ${t.secundario} 100%)`,
    };
  }
  return {
    background: `radial-gradient(ellipse at center, ${t.secundario}88 0%, ${t.primario} 75%)`,
  };
}

export function colorAcento(tema) {
  return obtenerTemaVisual(tema).acento;
}
