import apiClient from './apiClient';

export const listarSonidos = () => apiClient.get('/sistema/sonidos').then(r => r.data);

export const subirSonido = (tipoEvento, archivo) => {
  const fd = new FormData();
  fd.append('tipo_evento', tipoEvento);
  fd.append('archivo', archivo);
  return apiClient.post('/sistema/sonidos', fd, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data);
};

export const eliminarSonido = (id) => apiClient.delete(`/sistema/sonidos/${id}`).then(r => r.data);
