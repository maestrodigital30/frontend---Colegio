import apiClient from './apiClient';

export const listarTemas = () => apiClient.get('/temas-visuales').then(r => r.data);
export const obtenerTemaPorCodigo = (codigo) => apiClient.get(`/temas-visuales/codigo/${codigo}`).then(r => r.data);
export const actualizarTema = (id, payload) => apiClient.put(`/temas-visuales/${id}`, payload).then(r => r.data);
