import apiClient from './apiClient';

export const listarMusica = (estilo) => {
  const params = estilo ? { estilo } : {};
  return apiClient.get('/musica', { params }).then(r => r.data);
};

export const crearMusica = ({ nombre, estilo, archivo }) => {
  const fd = new FormData();
  fd.append('nombre', nombre);
  fd.append('estilo', estilo);
  fd.append('archivo', archivo);
  return apiClient.post('/musica', fd, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data);
};

export const actualizarMusica = (id, { nombre, estilo, archivo, esta_activo }) => {
  const fd = new FormData();
  if (nombre) fd.append('nombre', nombre);
  if (estilo) fd.append('estilo', estilo);
  if (archivo) fd.append('archivo', archivo);
  if (typeof esta_activo === 'boolean') fd.append('esta_activo', String(esta_activo));
  return apiClient.put(`/musica/${id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data);
};

export const eliminarMusica = (id) => apiClient.delete(`/musica/${id}`).then(r => r.data);
