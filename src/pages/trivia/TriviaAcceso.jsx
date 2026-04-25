import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { validarAccesoTrivia } from '../../services/triviaPublicaService';
import { obtenerConfiguracionPublica } from '../../services/authService';
import { getUploadUrl } from '../../utils/storage';
import { applyThemeColors, DEFAULT_COLORS } from '../../utils/colorUtils';
import toast from 'react-hot-toast';

export default function TriviaAcceso() {
  const [codigoTrivia, setCodigoTrivia] = useState('');
  const [dni, setDni] = useState('');
  const [cargando, setCargando] = useState(false);
  const [config, setConfig] = useState(null);
  const [mensajeSesion, setMensajeSesion] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const token = sessionStorage.getItem('trivia_token');
    const data = sessionStorage.getItem('trivia_data');
    if (token && data) {
      try {
        const parsed = JSON.parse(data);
        if (parsed.pregunta_actual < parsed.total_preguntas) {
          navigate('/trivia/jugar');
          return;
        }
      } catch { /* ignore */ }
    }

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
  }, [navigate]);

  const formatearCodigo = (valor) => {
    const limpio = valor.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (limpio.length <= 3 && 'TRV'.startsWith(limpio)) return limpio;
    if (limpio.startsWith('TRV')) return `TRV-${limpio.slice(3, 7)}`;
    return `TRV-${limpio.slice(0, 4)}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    let codigoFinal = codigoTrivia;
    if (!codigoFinal.startsWith('TRV-')) codigoFinal = `TRV-${codigoFinal}`;
    if (codigoFinal.length < 8) return toast.error('Ingrese el codigo completo (ej: TRV-K7M2)');
    if (!dni || dni.length < 7) return toast.error('Ingrese un DNI valido');

    setCargando(true);
    setMensajeSesion('');
    try {
      const data = await validarAccesoTrivia(codigoFinal, dni);
      sessionStorage.setItem('trivia_token', data.token);
      sessionStorage.setItem('trivia_data', JSON.stringify(data));
      toast.success(`Bienvenido/a, ${data.nombre_alumno}`);
      navigate('/trivia/jugar');
    } catch (error) {
      const status = error.response?.status;
      const msg = error.response?.data?.error || 'Error al validar acceso';
      if (status === 409) {
        setMensajeSesion(msg);
      } else {
        toast.error(msg);
      }
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-slate-50 via-purple-50/30 to-indigo-50/20">
      <div className="aurora-bg">
        <div className="aurora-orb aurora-orb-1" />
        <div className="aurora-orb aurora-orb-2" />
        <div className="aurora-orb aurora-orb-3" />
      </div>

      <div className="fixed inset-0 z-[1]" style={{
        backgroundImage: 'linear-gradient(rgba(0,0,0,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.02) 1px, transparent 1px)',
        backgroundSize: '60px 60px',
      }} />

      <div className="relative z-10 w-full max-w-md px-4 animate-fade-up" style={{ animationDelay: '0.1s' }}>
        <div className="bg-white/90 backdrop-blur-2xl border border-slate-200 rounded-3xl shadow-glass-lg p-8 md:p-10">
          <div className="text-center mb-8 animate-fade-up" style={{ animationDelay: '0.2s' }}>
            {config?.logo ? (
              <img
                src={getUploadUrl(config.logo)}
                alt="Logo"
                className="w-16 h-16 mx-auto mb-4 object-contain"
              />
            ) : (
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-purple-400 to-indigo-600 flex items-center justify-center shadow-lg">
                <span className="text-white font-display font-black text-xl">T</span>
              </div>
            )}
            <h1 className="text-2xl font-display font-bold text-slate-800">
              {config?.configuracion?.nombre_sistema || 'Colegio Jose'}
            </h1>
            <p className="text-sm text-slate-400 mt-1.5 font-medium">Acceso a Trivia</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="animate-fade-up" style={{ animationDelay: '0.3s' }}>
              <label className="block text-xs font-display font-medium text-slate-500 mb-1.5 uppercase tracking-wider">Codigo de Trivia</label>
              <input
                type="text"
                value={codigoTrivia}
                onChange={(e) => setCodigoTrivia(formatearCodigo(e.target.value))}
                className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 focus:bg-white transition-all duration-300 uppercase tracking-widest text-center font-mono text-lg"
                placeholder="TRV-XXXX"
                maxLength={8}
              />
            </div>

            <div className="animate-fade-up" style={{ animationDelay: '0.35s' }}>
              <label className="block text-xs font-display font-medium text-slate-500 mb-1.5 uppercase tracking-wider">DNI del Alumno</label>
              <input
                type="text"
                value={dni}
                onChange={(e) => setDni(e.target.value.replace(/\D/g, '').slice(0, 8))}
                className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 focus:bg-white transition-all duration-300 text-center font-mono text-lg tracking-widest"
                placeholder="12345678"
                maxLength={8}
              />
            </div>

            <div className="animate-fade-up" style={{ animationDelay: '0.4s' }}>
              <button
                type="submit"
                disabled={cargando}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-display font-bold text-sm tracking-wide hover:from-purple-400 hover:to-indigo-500 shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 active:scale-[0.98]"
              >
                {cargando ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Validando...
                  </span>
                ) : 'Ingresar a la Trivia'}
              </button>
            </div>
          </form>

          {mensajeSesion && (
            <div className="mt-4 bg-primary-50 border border-primary-200 rounded-xl p-4 animate-fade-up">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-primary-800">{mensajeSesion}</p>
                  <p className="text-xs text-primary-600 mt-1">Solo puede haber una sesion activa a la vez. Si cerraste la otra sesion, espera a que el docente finalice la partida.</p>
                </div>
              </div>
            </div>
          )}

          <div className="mt-6 text-center animate-fade-up" style={{ animationDelay: '0.5s' }}>
            <button
              onClick={() => navigate('/login')}
              className="text-xs text-slate-400 hover:text-slate-600 font-medium transition-colors"
            >
              Volver al inicio de sesion
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
