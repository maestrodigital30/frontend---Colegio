/**
 * Extrae el VIDEO_ID de una URL de YouTube.
 * Soporta: youtube.com/watch?v=XX, youtu.be/XX, youtube.com/embed/XX
 */
export function extraerYoutubeId(url) {
  if (!url) return null;
  const regex = /(?:youtube\.com\/watch\?v=|youtube\.com\/embed\/|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
}

/**
 * Genera la URL de la miniatura de un video de YouTube.
 */
export function miniaturYoutube(url) {
  const id = extraerYoutubeId(url);
  if (!id) return null;
  return `https://img.youtube.com/vi/${id}/mqdefault.jpg`;
}

/**
 * Genera la URL de embed para un iframe de YouTube.
 */
export function embedYoutube(url) {
  const id = extraerYoutubeId(url);
  if (!id) return null;
  return `https://www.youtube.com/embed/${id}`;
}

/**
 * Detecta si una URL es de YouTube.
 */
export function esUrlYoutube(url) {
  return extraerYoutubeId(url) !== null;
}
