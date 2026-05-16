import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { listarSonidos, subirSonido, eliminarSonido } from '../../services/sistemaSonidoService';
import { getUploadUrl } from '../../utils/storage';

const EVENTOS = [
  { codigo: 'correcto', etiqueta: 'Respuesta correcta' },
  { codigo: 'incorrecto', etiqueta: 'Respuesta incorrecta' },
  { codigo: 'cuenta_regresiva', etiqueta: 'Cuenta regresiva' },
  { codigo: 'victoria', etiqueta: 'Victoria' },
  { codigo: 'racha', etiqueta: 'Racha' },
];

export default function SistemaSonidos() {
  const [sonidos, setSonidos] = useState([]);
  const [subiendo, setSubiendo] = useState(null);
  const [cargando, setCargando] = useState(true);

  const cargar = async () => {
    try {
      const data = await listarSonidos();
      setSonidos(Array.isArray(data) ? data : []);
    } catch {
      toast.error('Error al cargar sonidos');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  const onUpload = async (tipoEvento, file) => {
    if (!file) return;
    setSubiendo(tipoEvento);
    try {
      await subirSonido(tipoEvento, file);
      toast.success('Sonido actualizado');
      await cargar();
    } catch (e) {
      toast.error(e.response?.data?.error || 'Error al subir');
    } finally {
      setSubiendo(null);
    }
  };

  const onDelete = async (id) => {
    if (!confirm('¿Eliminar este sonido?')) return;
    try {
      await eliminarSonido(id);
      toast.success('Sonido eliminado');
      await cargar();
    } catch {
      toast.error('Error al eliminar');
    }
  };

  if (cargando) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-10 animate-fade-up">
        <p className="text-sm font-display font-semibold text-primary-600 uppercase tracking-widest mb-2">Administracion</p>
        <h1 className="text-4xl font-display font-bold text-slate-800">Sonidos del Sistema</h1>
        <p className="text-sm text-slate-500 mt-2">Un archivo por evento. Se aplica a todas las trivias.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {EVENTOS.map((ev, i) => {
          const actual = sonidos.find(s => s.tipo_evento === ev.codigo);
          return (
            <div
              key={ev.codigo}
              className="glass-card-static p-6 animate-fade-up space-y-4"
              style={{ animationDelay: `${0.05 * (i + 1)}s` }}
            >
              <div className="flex items-center justify-between">
                <h3 className="font-display font-bold text-lg text-slate-800">{ev.etiqueta}</h3>
                <span className="text-xs font-mono uppercase tracking-wider text-slate-400 bg-slate-100 px-2 py-1 rounded-md">
                  {ev.codigo}
                </span>
              </div>

              {actual ? (
                <div className="space-y-3">
                  <audio src={getUploadUrl(actual.ruta_archivo)} controls className="w-full" />
                  <button
                    onClick={() => onDelete(actual.id)}
                    className="text-rose-600 text-sm font-display font-semibold hover:text-rose-700 transition-colors"
                  >
                    Eliminar sonido
                  </button>
                </div>
              ) : (
                <div className="text-sm text-slate-400 italic py-2">Sin sonido cargado</div>
              )}

              <label className="block">
                <span className="block text-xs font-display font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  {actual ? 'Reemplazar archivo' : 'Subir archivo'}
                </span>
                <input
                  type="file"
                  accept="audio/*"
                  disabled={subiendo === ev.codigo}
                  onChange={e => onUpload(ev.codigo, e.target.files?.[0])}
                  className="block w-full text-sm text-slate-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-xl file:border file:border-slate-200
                    file:text-sm file:font-display file:font-semibold
                    file:bg-slate-50 file:text-primary-600
                    hover:file:bg-slate-100 file:transition-all file:duration-200
                    file:cursor-pointer disabled:opacity-50"
                />
                {subiendo === ev.codigo && (
                  <span className="block mt-2 text-xs text-primary-600 font-display font-semibold">Subiendo...</span>
                )}
              </label>
            </div>
          );
        })}
      </div>
    </div>
  );
}
