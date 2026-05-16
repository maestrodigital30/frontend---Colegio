import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { obtenerMiIdentidad, guardarMiIdentidad } from '../services/identidadVisualService';
import { listarSonidos } from '../services/sistemaSonidoService';
import { aplicarTemaVisual, aplicarColorPersonal } from '../utils/temaVisual';
import audioService from '../services/audioService';
import { useAuth } from '../features/auth/AuthContext';
import { ROLES } from '../utils/constants';

const Ctx = createContext(null);

export function IdentidadVisualProvider({ children }) {
  const { usuario } = useAuth();
  const [identidad, setIdentidad] = useState(null);
  const [cargando, setCargando] = useState(false);

  const cargar = useCallback(async () => {
    if (!usuario || usuario.rol !== ROLES.ALUMNO) {
      setIdentidad(null);
      return;
    }
    setCargando(true);
    try {
      const data = await obtenerMiIdentidad();
      setIdentidad(data);
      aplicarTemaVisual(data?.tbl_temas_visuales);
      aplicarColorPersonal(data?.color_personal);
      audioService.toggleMusica(data?.musica_habilitada !== false);
      audioService.toggleSfx(data?.sonidos_habilitados !== false);

      const sonidos = await listarSonidos();
      audioService.setSounds(sonidos);
    } catch (e) {
      console.error('Error cargando identidad visual:', e);
    } finally {
      setCargando(false);
    }
  }, [usuario]);

  useEffect(() => { cargar(); }, [cargar]);

  const guardar = useCallback(async (payload) => {
    const data = await guardarMiIdentidad(payload);
    setIdentidad(data);
    aplicarTemaVisual(data?.tbl_temas_visuales);
    aplicarColorPersonal(data?.color_personal);
    audioService.toggleMusica(data?.musica_habilitada !== false);
    audioService.toggleSfx(data?.sonidos_habilitados !== false);
    return data;
  }, []);

  return (
    <Ctx.Provider value={{ identidad, cargando, recargar: cargar, guardar }}>
      {children}
    </Ctx.Provider>
  );
}

export function useIdentidadVisual() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useIdentidadVisual fuera de IdentidadVisualProvider');
  return ctx;
}
