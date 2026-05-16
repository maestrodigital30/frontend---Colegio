import axios from 'axios';
import { API_URL } from '../utils/constants';

const triviaClient = axios.create({
  baseURL: `${API_URL}/trivia-publica`,
  headers: { 'Content-Type': 'application/json' },
});

triviaClient.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('trivia_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

triviaClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      sessionStorage.removeItem('trivia_token');
      sessionStorage.removeItem('trivia_data');
      window.location.href = '/trivia';
    }
    return Promise.reject(error);
  }
);

export const validarAccesoTrivia = (codigoTrivia, dni, extras = {}) =>
  triviaClient.post('/validar-acceso', { codigo_trivia: codigoTrivia, dni, ...extras }).then((r) => r.data);

export const obtenerPartidaTrivia = () =>
  triviaClient.get('/partida').then((r) => r.data);

export const obtenerPreguntaTrivia = () =>
  triviaClient.get('/pregunta').then((r) => r.data);

export const responderPreguntaTrivia = (idOpcion) =>
  triviaClient.post('/responder', { id_opcion_seleccionada: idOpcion }).then((r) => r.data);

export const obtenerResultadoTrivia = () =>
  triviaClient.get('/resultado').then((r) => r.data);

export const obtenerRankingTrivia = () =>
  triviaClient.get('/ranking').then((r) => r.data);
