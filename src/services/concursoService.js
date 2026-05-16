import apiClient from './apiClient';

// ===== CRUD Concursos (admin) =====
export const listarConcursos = async (params = {}) => {
  const { data } = await apiClient.get('/concursos', { params });
  return data;
};

export const obtenerConcurso = async (id) => {
  const { data } = await apiClient.get(`/concursos/${id}`);
  return data;
};

export const crearConcurso = async (payload) => {
  const { data } = await apiClient.post('/concursos', payload);
  return data;
};

export const actualizarConcurso = async (id, payload) => {
  const { data } = await apiClient.put(`/concursos/${id}`, payload);
  return data;
};

export const eliminarConcurso = async (id) => {
  const { data } = await apiClient.delete(`/concursos/${id}`);
  return data;
};

export const cambiarPublicacion = async (id, publicado) => {
  const { data } = await apiClient.patch(`/concursos/${id}/publicar`, { publicado });
  return data;
};

// ===== Preguntas =====
export const listarPreguntas = async (idConcurso) => {
  const { data } = await apiClient.get(`/concursos/${idConcurso}/preguntas`);
  return data;
};

export const crearPregunta = async (payload) => {
  const { data } = await apiClient.post('/concursos/preguntas', payload);
  return data;
};

export const actualizarPregunta = async (id, payload) => {
  const { data } = await apiClient.put(`/concursos/preguntas/${id}`, payload);
  return data;
};

export const eliminarPregunta = async (id) => {
  const { data } = await apiClient.delete(`/concursos/preguntas/${id}`);
  return data;
};

export const reordenarPreguntas = async (idConcurso, orden) => {
  const { data } = await apiClient.patch(`/concursos/${idConcurso}/preguntas/orden`, { orden });
  return data;
};

// ===== Multimedia =====
export const subirMultimedia = async (archivo) => {
  const formData = new FormData();
  formData.append('archivo', archivo);
  const { data } = await apiClient.post('/concursos/multimedia/subir', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data; // { url, tipo }
};

export const eliminarMultimedia = async (url) => {
  const { data } = await apiClient.delete('/concursos/multimedia', { data: { url } });
  return data;
};

// ===== Historial / Ranking (admin) =====
export const obtenerHistorialAdmin = async (params = {}) => {
  const { data } = await apiClient.get('/concursos-admin/historial', { params });
  return data;
};

export const obtenerRankingAdmin = async (idConcurso, params = {}) => {
  const { data } = await apiClient.get(`/concursos-admin/${idConcurso}/ranking`, { params });
  return data;
};

export const obtenerDetalleIntentoAdmin = async (idIntento) => {
  const { data } = await apiClient.get(`/concursos-admin/intentos/${idIntento}/detalle`);
  return data;
};
