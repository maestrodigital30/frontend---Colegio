import { useState, useEffect, useCallback } from 'react';
import apiClient from '../services/apiClient';
import toast from 'react-hot-toast';

export default function useCrud(endpoint, opciones = {}) {
  const [datos, setDatos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const cargar = useCallback(async (params = '') => {
    setCargando(true);
    try {
      const { data } = await apiClient.get(`${endpoint}${params}`);
      setDatos(data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al cargar datos');
    } finally {
      setCargando(false);
    }
  }, [endpoint]);

  useEffect(() => {
    if (opciones.cargarAuto !== false) {
      cargar(opciones.params || '');
    }
  }, [cargar, opciones.cargarAuto, opciones.params]);

  const crear = async (body) => {
    const { data } = await apiClient.post(endpoint, body);
    toast.success('Registro creado');
    await cargar(opciones.params || '');
    return data;
  };

  const actualizar = async (id, body) => {
    const { data } = await apiClient.put(`${endpoint}/${id}`, body);
    toast.success('Registro actualizado');
    await cargar(opciones.params || '');
    return data;
  };

  const inactivar = async (id) => {
    await apiClient.delete(`${endpoint}/${id}`);
    toast.success('Registro inactivado');
    await cargar(opciones.params || '');
  };

  const activar = async (id) => {
    await apiClient.patch(`${endpoint}/${id}/activar`);
    toast.success('Registro activado');
    await cargar(opciones.params || '');
  };

  return { datos, cargando, error, cargar, crear, actualizar, inactivar, activar };
}
