import apiClient from './apiClient';

export const listarAvatares = (tipo) => {
  const params = tipo ? { tipo } : {};
  return apiClient.get('/avatares', { params }).then(r => r.data);
};

export const listarAvataresPublicos = () => apiClient.get('/trivia-publica/avatares').then(r => r.data);

export const obtenerDefault = (tipo) => apiClient.get(`/avatares/default/${tipo}`).then(r => r.data);

export const crearAvatar = ({ tipo, nombre, orden, es_default, archivo }) => {
  const fd = new FormData();
  fd.append('tipo', tipo);
  fd.append('nombre', nombre);
  if (orden != null) fd.append('orden', String(orden));
  if (es_default) fd.append('es_default', 'true');
  fd.append('archivo', archivo);
  return apiClient.post('/avatares', fd, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data);
};

export const actualizarAvatar = (id, payload) => {
  const fd = new FormData();
  Object.entries(payload).forEach(([k, v]) => {
    if (v !== undefined && v !== null) fd.append(k, v);
  });
  return apiClient.put(`/avatares/${id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data);
};

export const eliminarAvatar = (id) => apiClient.delete(`/avatares/${id}`).then(r => r.data);
