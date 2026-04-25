import { useState, useEffect } from 'react';
import apiClient from '../../services/apiClient';
import { getUploadUrl } from '../../utils/storage';
import { useAuth } from '../../features/auth/AuthContext';
import { applyThemeColors, DEFAULT_COLORS } from '../../utils/colorUtils';
import Boton from '../../components/common/Boton';
import InputCampo from '../../components/common/InputCampo';
import toast from 'react-hot-toast';

export default function ConfiguracionPage() {
  const { setConfigSistema } = useAuth();
  const [config, setConfig] = useState({
    nombre_sistema: '',
    color_primario: DEFAULT_COLORS.primary,
    color_secundario: DEFAULT_COLORS.secondary,
    color_acento: DEFAULT_COLORS.accent,
  });
  const [logoPreview, setLogoPreview] = useState(null);
  const [archivoLogo, setArchivoLogo] = useState(null);
  const [fondoPreview, setFondoPreview] = useState(null);
  const [archivoFondo, setArchivoFondo] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    apiClient.get('/configuracion').then(({ data }) => {
      if (data) {
        const cfg = data.configuracion || data;
        setConfig({
          nombre_sistema: cfg.nombre_sistema || '',
          color_primario: cfg.color_primario || DEFAULT_COLORS.primary,
          color_secundario: cfg.color_secundario || DEFAULT_COLORS.secondary,
          color_acento: cfg.color_acento || DEFAULT_COLORS.accent,
        });
        const logoPath = data.logo || data.logo_url;
        if (logoPath) {
          setLogoPreview(getUploadUrl(logoPath));
        }
        if (data.fondo_login) {
          setFondoPreview(getUploadUrl(data.fondo_login));
        }
      }
      setCargando(false);
    }).catch(() => setCargando(false));
  }, []);

  const handleChange = (e) => setConfig({ ...config, [e.target.name]: e.target.value });

  const guardarConfig = async (e) => {
    e.preventDefault();
    try {
      await apiClient.put('/configuracion', config);
      applyThemeColors(config.color_primario, config.color_secundario, config.color_acento);
      setConfigSistema(prev => ({ ...prev, nombre: config.nombre_sistema }));
      toast.success('Configuracion actualizada');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al guardar');
    }
  };

  const subirLogo = async () => {
    if (!archivoLogo) return;
    const formData = new FormData();
    formData.append('logo', archivoLogo);
    try {
      const { data } = await apiClient.post('/configuracion/logo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setLogoPreview(getUploadUrl(data.url));
      setConfigSistema(prev => ({ ...prev, logo: data.url }));
      toast.success('Logo actualizado');
    } catch (err) {
      toast.error('Error al subir logo');
    }
  };

  const subirFondo = async () => {
    if (!archivoFondo) return;
    const formData = new FormData();
    formData.append('fondo', archivoFondo);
    try {
      const { data } = await apiClient.post('/configuracion/fondo-login', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setFondoPreview(getUploadUrl(data.url));
      setArchivoFondo(null);
      toast.success('Fondo de login actualizado');
    } catch (err) {
      toast.error('Error al subir fondo');
    }
  };

  const eliminarFondo = async () => {
    try {
      await apiClient.delete('/configuracion/fondo-login');
      setFondoPreview(null);
      setArchivoFondo(null);
      toast.success('Fondo de login eliminado');
    } catch (err) {
      toast.error('Error al eliminar fondo');
    }
  };

  if (cargando) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-2 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
    </div>
  );

  return (
    <div>
      <div className="mb-10 animate-fade-up">
        <p className="text-sm font-display font-semibold text-primary-600 uppercase tracking-widest mb-2">Administracion</p>
        <h1 className="text-4xl font-display font-bold text-slate-800">Configuracion del Sistema</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* General Config */}
        <div className="glass-card-static p-8 animate-fade-up" style={{ animationDelay: '0.1s' }}>
          <h2 className="text-2xl font-display font-bold text-slate-800 mb-6">General</h2>
          <form onSubmit={guardarConfig} className="space-y-6">
            <InputCampo label="Nombre del Sistema" name="nombre_sistema" value={config.nombre_sistema} onChange={handleChange} />

            {/* Color pickers */}
            {[
              { name: 'color_primario', label: 'Color Primario' },
              { name: 'color_secundario', label: 'Color Secundario' },
              { name: 'color_acento', label: 'Color Acento' },
            ].map(({ name, label }) => (
              <div key={name}>
                <label className="block text-sm font-display font-semibold text-slate-500 mb-2 uppercase tracking-wider">{label}</label>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <input
                      type="color"
                      name={name}
                      value={config[name]}
                      onChange={handleChange}
                      className="w-14 h-14 rounded-xl cursor-pointer border-2 border-slate-200 bg-transparent"
                    />
                  </div>
                  <input
                    type="text"
                    value={config[name]}
                    onChange={(e) => setConfig({ ...config, [name]: e.target.value })}
                    className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-base font-medium text-slate-700 w-40 focus:outline-none focus:border-primary-500/50"
                  />
                </div>
              </div>
            ))}

            {/* Preview */}
            <div>
              <label className="block text-sm font-display font-semibold text-slate-500 mb-3 uppercase tracking-wider">Vista previa</label>
              <div className="flex gap-4 mt-2">
                {[
                  { color: config.color_primario, label: 'Primario' },
                  { color: config.color_secundario, label: 'Secundario' },
                  { color: config.color_acento, label: 'Acento' },
                ].map((item, i) => (
                  <div key={i} className="flex flex-col items-center gap-2">
                    <div className="w-20 h-20 rounded-2xl shadow-md border border-slate-200 transition-all duration-300 hover:scale-110" style={{ backgroundColor: item.color }} />
                    <span className="text-xs font-display font-medium text-slate-400">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <Boton type="submit">Guardar Configuracion</Boton>
              <button
                type="button"
                onClick={() => {
                  setConfig(prev => ({
                    ...prev,
                    color_primario: DEFAULT_COLORS.primary,
                    color_secundario: DEFAULT_COLORS.secondary,
                    color_acento: DEFAULT_COLORS.accent,
                  }));
                  toast.success('Colores restaurados a valores base');
                }}
                className="px-5 py-3 rounded-xl border-2 border-slate-200 text-sm font-display font-semibold text-slate-500 hover:border-primary-300 hover:text-primary-600 hover:bg-primary-50 transition-all duration-200"
              >
                Restaurar colores base
              </button>
            </div>
          </form>
        </div>

        {/* Logo */}
        <div className="glass-card-static p-8 animate-fade-up" style={{ animationDelay: '0.2s' }}>
          <h2 className="text-2xl font-display font-bold text-slate-800 mb-6">Logo</h2>
          {logoPreview && (
            <div className="mb-6 p-6 bg-slate-50 rounded-2xl border border-slate-200 inline-block">
              <img src={logoPreview} alt="Logo actual" className="w-32 h-32 object-contain" />
            </div>
          )}
          <div className="space-y-5">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                setArchivoLogo(e.target.files[0]);
                if (e.target.files[0]) {
                  setLogoPreview(URL.createObjectURL(e.target.files[0]));
                }
              }}
              className="block w-full text-base text-slate-500
                file:mr-4 file:py-3 file:px-5
                file:rounded-xl file:border file:border-slate-200
                file:text-base file:font-display file:font-semibold
                file:bg-slate-50 file:text-primary-600
                hover:file:bg-slate-100 file:transition-all file:duration-200
                file:cursor-pointer"
            />
            <Boton onClick={subirLogo} disabled={!archivoLogo} tipo="secondary">Subir Logo</Boton>
          </div>
        </div>

        {/* Fondo de Login */}
        <div className="glass-card-static p-8 animate-fade-up lg:col-span-2" style={{ animationDelay: '0.3s' }}>
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-2xl font-display font-bold text-slate-800">Fondo del Login</h2>
              <p className="text-sm text-slate-400 mt-1">Imagen que se mostrará detrás del formulario de inicio de sesión.</p>
            </div>
            {fondoPreview && (
              <button
                type="button"
                onClick={eliminarFondo}
                className="px-4 py-2 rounded-xl border-2 border-red-200 text-sm font-display font-semibold text-red-500 hover:bg-red-50 transition-all duration-200"
              >
                Quitar fondo
              </button>
            )}
          </div>

          {fondoPreview && (
            <div className="mb-6 rounded-2xl border border-slate-200 overflow-hidden bg-slate-50">
              <img src={fondoPreview} alt="Fondo actual" className="w-full max-h-64 object-cover" />
            </div>
          )}

          <div className="space-y-5">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                setArchivoFondo(e.target.files[0]);
                if (e.target.files[0]) {
                  setFondoPreview(URL.createObjectURL(e.target.files[0]));
                }
              }}
              className="block w-full text-base text-slate-500
                file:mr-4 file:py-3 file:px-5
                file:rounded-xl file:border file:border-slate-200
                file:text-base file:font-display file:font-semibold
                file:bg-slate-50 file:text-primary-600
                hover:file:bg-slate-100 file:transition-all file:duration-200
                file:cursor-pointer"
            />
            <Boton onClick={subirFondo} disabled={!archivoFondo} tipo="secondary">Subir Fondo</Boton>
          </div>
        </div>
      </div>
    </div>
  );
}
