import apiClient from './apiClient';

export const login = async (correo, contrasena) => {
  const { data } = await apiClient.post('/auth/login', { correo, contrasena });
  return data;
};

export const obtenerConfiguracionPublica = async () => {
  const { data } = await apiClient.get('/auth/configuracion-publica');
  return data;
};
