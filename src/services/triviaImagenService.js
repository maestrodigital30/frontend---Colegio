import apiClient from './apiClient';

export const listarImagenes = (idPartida) => apiClient.get(`/trivia/imagenes/partida/${idPartida}`).then(r => r.data);

export const subirImagen = (idPartida, archivo, orden = 0) => {
  const fd = new FormData();
  fd.append('archivo', archivo);
  fd.append('orden', String(orden));
  return apiClient.post(`/trivia/imagenes/partida/${idPartida}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data);
};

export const eliminarImagen = (id) => apiClient.delete(`/trivia/imagenes/${id}`).then(r => r.data);
