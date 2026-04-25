/**
 * Construye la URL completa para un archivo almacenado.
 * Los archivos siempre se sirven a través del backend en /uploads/.
 * En modo wasabi, el backend actúa como proxy autenticado hacia S3.
 *
 * @param {string|null} relativePath  Ruta relativa guardada en BD (ej: 'alumnos/foto_1.jpg')
 * @returns {string|null}
 */
import { API_BASE_URL } from './constants';

export const getUploadUrl = (relativePath) => {
  if (!relativePath) return null;
  if (relativePath.startsWith('http')) return relativePath;
  const clean = relativePath.replace(/^\/?uploads\//, '');
  return `${API_BASE_URL}/uploads/${clean}`;
};
