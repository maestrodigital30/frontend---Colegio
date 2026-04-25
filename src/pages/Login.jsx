import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthContext';
import { login as loginService, obtenerConfiguracionPublica } from '../services/authService';
import { ROLES } from '../utils/constants';
import { getUploadUrl } from '../utils/storage';
import { applyThemeColors, DEFAULT_COLORS } from '../utils/colorUtils';
import toast from 'react-hot-toast';
import { HiEye, HiEyeOff } from 'react-icons/hi';

export default function Login() {
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [cargando, setCargando] = useState(false);
  const [mostrarContrasena, setMostrarContrasena] = useState(false);
  const [config, setConfig] = useState(null);
  const { iniciarSesion, usuario } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (usuario) {
      const rutasPorRol = {
        [ROLES.SUPER_ADMIN]: '/admin/dashboard',
        [ROLES.DOCENTE]: '/docente/dashboard',
        [ROLES.ALUMNO]: '/alumno/dashboard',
      };
      navigate(rutasPorRol[usuario.rol] || '/login', { replace: true });
    }
  }, [usuario, navigate]);

  useEffect(() => {
    obtenerConfiguracionPublica()
      .then((data) => {
        setConfig(data);
        if (data.configuracion) {
          applyThemeColors(
            data.configuracion.color_primario || DEFAULT_COLORS.primary,
            data.configuracion.color_secundario || DEFAULT_COLORS.secondary,
            data.configuracion.color_acento || DEFAULT_COLORS.accent
          );
        }
      })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!correo || !contrasena) {
      toast.error('Ingrese correo y contrasena');
      return;
    }
    setCargando(true);
    try {
      const data = await loginService(correo, contrasena);
      iniciarSesion(data);
      toast.success('Bienvenido');
      const rutasPorRol = {
        [ROLES.SUPER_ADMIN]: '/admin/dashboard',
        [ROLES.DOCENTE]: '/docente/dashboard',
        [ROLES.ALUMNO]: '/alumno/dashboard',
      };
      navigate(rutasPorRol[data.usuario.rol] || '/login');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al iniciar sesion');
    } finally {
      setCargando(false);
    }
  };

  const fondoUrl = config?.fondo_login ? getUploadUrl(config.fondo_login) : null;
  const rootStyle = fondoUrl
    ? {
        backgroundImage: `url(${fondoUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }
    : { backgroundColor: 'rgb(var(--color-primary-500))' };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden" style={rootStyle}>
      {/* Animated aurora background (sólo cuando no hay imagen personalizada) */}
      {!fondoUrl && (
        <div className="aurora-bg">
          <div className="aurora-orb aurora-orb-1" />
          <div className="aurora-orb aurora-orb-2" />
          <div className="aurora-orb aurora-orb-3" />
        </div>
      )}

      {/* Overlay sobre la imagen para legibilidad */}
      {fondoUrl && <div className="fixed inset-0 z-[1] bg-black/40" />}

      {/* Grid pattern overlay (sólo sin imagen) */}
      {!fondoUrl && (
        <div className="fixed inset-0 z-[1]" style={{
          backgroundImage: `linear-gradient(rgba(0,0,0,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.02) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }} />
      )}

      {/* Login card */}
      <div className="relative z-10 w-full max-w-md px-4 animate-fade-up" style={{ animationDelay: '0.1s' }}>
        <div className="
          bg-white/90 backdrop-blur-2xl
          border border-slate-200
          rounded-3xl shadow-glass-lg
          p-8 md:p-10
        ">
          {/* Logo & Title */}
          <div className="text-center mb-8 animate-fade-up" style={{ animationDelay: '0.2s' }}>
            {config?.logo ? (
              <img
                src={getUploadUrl(config.logo)}
                alt="Logo"
                className="w-16 h-16 mx-auto mb-4 object-contain"
              />
            ) : (
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-glow-primary">
                <span className="text-white font-display font-black text-xl">CJ</span>
              </div>
            )}
            <h1 className="text-2xl font-display font-bold text-slate-800">
              {config?.configuracion?.nombre_sistema || 'Colegio Jose'}
            </h1>
            <p className="text-sm text-slate-400 mt-1.5 font-medium">Iniciar sesion</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="animate-fade-up" style={{ animationDelay: '0.3s' }}>
              <label className="block text-xs font-display font-medium text-slate-500 mb-1.5 uppercase tracking-wider">Correo</label>
              <input
                type="email"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                className="
                  w-full px-4 py-3.5
                  bg-slate-50 border border-slate-200 rounded-xl
                  text-slate-700 text-sm placeholder-slate-400
                  focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 focus:bg-white
                  transition-all duration-300
                "
                placeholder="correo@ejemplo.com"
              />
            </div>

            <div className="animate-fade-up" style={{ animationDelay: '0.35s' }}>
              <label className="block text-xs font-display font-medium text-slate-500 mb-1.5 uppercase tracking-wider">Contrasena</label>
              <div className="relative">
                <input
                  type={mostrarContrasena ? 'text' : 'password'}
                  value={contrasena}
                  onChange={(e) => setContrasena(e.target.value)}
                  className="
                    w-full px-4 py-3.5 pr-12
                    bg-slate-50 border border-slate-200 rounded-xl
                    text-slate-700 text-sm placeholder-slate-400
                    focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 focus:bg-white
                    transition-all duration-300
                  "
                  placeholder="********"
                />
                <button
                  type="button"
                  onClick={() => setMostrarContrasena(!mostrarContrasena)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  tabIndex={-1}
                >
                  {mostrarContrasena ? <HiEyeOff className="w-5 h-5" /> : <HiEye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="animate-fade-up" style={{ animationDelay: '0.4s' }}>
              <button
                type="submit"
                disabled={cargando}
                className="
                  w-full py-3.5 rounded-xl
                  bg-gradient-to-r from-primary-500 to-primary-600
                  text-white font-display font-bold text-sm tracking-wide
                  hover:from-primary-400 hover:to-primary-500
                  shadow-glow-primary hover:shadow-lg
                  transition-all duration-300
                  disabled:opacity-50 disabled:shadow-none
                  active:scale-[0.98]
                "
              >
                {cargando ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Ingresando...
                  </span>
                ) : 'Ingresar'}
              </button>
            </div>
          </form>

          {/* Trivia access */}
          <div className="mt-8 animate-fade-up" style={{ animationDelay: '0.5s' }}>
            <button
              onClick={() => navigate('/trivia')}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-accent-500 to-accent-600 text-white font-display font-bold text-sm tracking-wide hover:from-accent-400 hover:to-accent-500 shadow-glow-accent hover:shadow-lg transition-all duration-300 active:scale-[0.98]"
            >
              Entrar a Trivia
            </button>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-[10px] text-slate-400 mt-6 font-display tracking-wider">
          Sistema de Gestion Escolar v1.0
        </p>
      </div>
    </div>
  );
}
