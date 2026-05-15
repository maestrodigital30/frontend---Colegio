/**
 * Helpers para construir URLs de archivos almacenados.
 * Los archivos siempre se sirven a través del backend en /uploads/.
 * En modo wasabi, el backend actúa como proxy autenticado hacia S3.
 */
import { API_BASE_URL } from './constants';

/**
 * URL para mostrar/embebir un archivo (img, iframe, video, audio).
 * @param {string|null} relativePath  Ruta relativa guardada en BD (ej: 'alumnos/foto_1.jpg')
 * @returns {string|null}
 */
export const getUploadUrl = (relativePath) => {
  if (!relativePath) return null;
  if (relativePath.startsWith('http')) return relativePath;
  const clean = relativePath.replace(/^\/?uploads\//, '');
  return `${API_BASE_URL}/uploads/${clean}`;
};

/**
 * URL que fuerza la descarga del archivo con un nombre dado.
 * Necesario cuando el frontend y el backend están en orígenes distintos
 * (en ese caso el atributo `download` del <a> es ignorado por el navegador
 * y necesitamos que el servidor envíe Content-Disposition: attachment).
 *
 * @param {string|null} relativePath
 * @param {string} [filename]  Nombre con que se guardará el archivo
 * @returns {string|null}
 */
export const getDownloadUrl = (relativePath, filename) => {
  if (!relativePath) return null;
  if (relativePath.startsWith('http')) return relativePath;
  const clean = relativePath.replace(/^\/?uploads\//, '');
  const name = filename ? encodeURIComponent(filename) : '1';
  return `${API_BASE_URL}/uploads/${clean}?download=${name}`;
};
