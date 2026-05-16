import apiClient from './apiClient';

export const obtenerMiIdentidad = () => apiClient.get('/identidad-visual/mi-identidad').then(r => r.data);
export const guardarMiIdentidad = (payload) => apiClient.put('/identidad-visual/mi-identidad', payload).then(r => r.data);
export const obtenerIdentidadAlumno = (idAlumno) => apiClient.get(`/identidad-visual/alumno/${idAlumno}`).then(r => r.data);
