import { createContext, useContext, useState, useEffect } from 'react';
import apiClient from '../../services/apiClient';
import { ROLES } from '../../utils/constants';
import { applyThemeColors, DEFAULT_COLORS } from '../../utils/colorUtils';

const AuthContext = createContext(null);

const cargarConfigSistema = async (setConfigSistema) => {
  try {
    const { data } = await apiClient.get('/auth/configuracion-publica');
    const cfg = data?.configuracion || data;
    if (cfg) {
      applyThemeColors(
        cfg.color_primario || DEFAULT_COLORS.primary,
        cfg.color_secundario || DEFAULT_COLORS.secondary,
        cfg.color_acento || DEFAULT_COLORS.accent
      );
    }
    setConfigSistema({ nombre: cfg?.nombre_sistema || '', logo: data?.logo || null });
  } catch { /* ignore - use defaults */ }
};

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [token, setToken] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [configSistema, setConfigSistema] = useState({ nombre: '', logo: null });

  useEffect(() => {
    const tokenGuardado = localStorage.getItem('token');
    const usuarioGuardado = localStorage.getItem('usuario');
    if (tokenGuardado && usuarioGuardado) {
      setToken(tokenGuardado);
      setUsuario(JSON.parse(usuarioGuardado));
      cargarConfigSistema(setConfigSistema);
    }
    setCargando(false);
  }, []);

  const iniciarSesion = (datosLogin) => {
    localStorage.setItem('token', datosLogin.token);
    localStorage.setItem('usuario', JSON.stringify(datosLogin.usuario));
    setToken(datosLogin.token);
    setUsuario(datosLogin.usuario);
    cargarConfigSistema(setConfigSistema);
  };

  const cerrarSesion = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    setToken(null);
    setUsuario(null);
  };

  const esAdmin = () => usuario?.rol === ROLES.SUPER_ADMIN;
  const esDocente = () => usuario?.rol === ROLES.DOCENTE;
  const esAlumno = () => usuario?.rol === ROLES.ALUMNO;

  const tienePermiso = (codigo) => {
    if (!usuario?.permisos) return false;
    if (esAdmin()) return true;
    return usuario.permisos.some(p => p.codigo === codigo);
  };

  return (
    <AuthContext.Provider value={{ usuario, token, cargando, configSistema, setConfigSistema, iniciarSesion, cerrarSesion, esAdmin, esDocente, esAlumno, tienePermiso }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return context;
}
