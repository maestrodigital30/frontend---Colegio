import apiClient from './apiClient';

export const listarDisponibles = async () => {
  const { data } = await apiClient.get('/concursos-juego/disponibles');
  return data;
};

export const iniciarIntento = async (idConcurso) => {
  const { data } = await apiClient.post(`/concursos-juego/${idConcurso}/iniciar`);
  return data;
};

export const obtenerIntento = async (idIntento) => {
  const { data } = await apiClient.get(`/concursos-juego/intentos/${idIntento}`);
  return data;
};

export const aplicarComodin = async (idIntento, tipo, idPregunta) => {
  const { data } = await apiClient.post(`/concursos-juego/intentos/${idIntento}/comodin`, {
    tipo, id_pregunta: idPregunta,
  });
  return data;
};

export const responder = async (idIntento, payload) => {
  const { data } = await apiClient.post(`/concursos-juego/intentos/${idIntento}/responder`, payload);
  return data;
};

export const obtenerBonus = async (idIntento) => {
  const { data } = await apiClient.get(`/concursos-juego/intentos/${idIntento}/bonus`);
  return data;
};

export const seleccionarBonus = async (idIntento, idTarjeta) => {
  const { data } = await apiClient.post(`/concursos-juego/intentos/${idIntento}/bonus/seleccionar`, {
    id_tarjeta: idTarjeta,
  });
  return data;
};

export const finalizarIntento = async (idIntento) => {
  const { data } = await apiClient.post(`/concursos-juego/intentos/${idIntento}/finalizar`);
  return data;
};

export const obtenerResultado = async (idIntento) => {
  const { data } = await apiClient.get(`/concursos-juego/intentos/${idIntento}/resultado`);
  return data;
};

export const obtenerMiHistorial = async (params = {}) => {
  const { data } = await apiClient.get('/concursos-juego/historial', { params });
  return data;
};

export const obtenerRanking = async (idConcurso, params = {}) => {
  const { data } = await apiClient.get(`/concursos-juego/${idConcurso}/ranking`, { params });
  return data;
};
