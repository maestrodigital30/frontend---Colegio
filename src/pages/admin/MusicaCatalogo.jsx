import { useEffect, useState, useRef } from 'react';
import toast from 'react-hot-toast';
import {
  listarMusica,
  crearMusica,
  actualizarMusica,
  eliminarMusica,
} from '../../services/musicaCatalogoService';
import { getUploadUrl } from '../../utils/storage';

const ESTILOS = [
  { codigo: 'relajada', etiqueta: 'Relajada' },
  { codigo: 'intensa', etiqueta: 'Intensa' },
  { codigo: 'epica', etiqueta: 'Épica' },
];

export default function MusicaCatalogo() {
  const [pistas, setPistas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [subiendo, setSubiendo] = useState(false);

  // Formulario alta
  const [nombre, setNombre] = useState('');
  const [estilo, setEstilo] = useState('relajada');
  const [archivo, setArchivo] = useState(null);
  const fileInputRef = useRef(null);

  // Reemplazo
  const replaceInputsRef = useRef({});
  const [reemplazando, setReemplazando] = useState(null);

  const cargar = async () => {
    try {
      const data = await listarMusica();
      setPistas(Array.isArray(data) ? data : []);
    } catch {
      toast.error('Error al cargar música');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  const handleCrear = async (e) => {
    e.preventDefault();
    if (!nombre.trim()) return toast.error('Ingresa un nombre');
    if (!archivo) return toast.error('Selecciona un archivo de audio');
    setSubiendo(true);
    try {
      await crearMusica({ nombre: nombre.trim(), estilo, archivo });
      toast.success('Pista creada');
      setNombre('');
      setEstilo('relajada');
      setArchivo(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      await cargar();
    } catch (e) {
      toast.error(e.response?.data?.error || 'Error al subir pista');
    } finally {
      setSubiendo(false);
    }
  };

  const handleReemplazar = async (id, file) => {
    if (!file) return;
    setReemplazando(id);
    try {
      await actualizarMusica(id, { archivo: file });
      toast.success('Archivo reemplazado');
      await cargar();
    } catch (e) {
      toast.error(e.response?.data?.error || 'Error al reemplazar');
    } finally {
      setReemplazando(null);
    }
  };

  const handleToggleActivo = async (pista) => {
    try {
      await actualizarMusica(pista.id, { esta_activo: !pista.esta_activo });
      toast.success(!pista.esta_activo ? 'Pista activada' : 'Pista desactivada');
      await cargar();
    } catch {
      toast.error('Error al actualizar');
    }
  };

  const handleEliminar = async (id) => {
    if (!confirm('¿Eliminar esta pista?')) return;
    try {
      await eliminarMusica(id);
      toast.success('Pista eliminada');
      await cargar();
    } catch {
      toast.error('Error al eliminar');
    }
  };

  const handleRenombrar = async (pista) => {
    const nuevo = prompt('Nuevo nombre:', pista.nombre);
    if (!nuevo || !nuevo.trim() || nuevo === pista.nombre) return;
    try {
      await actualizarMusica(pista.id, { nombre: nuevo.trim() });
      toast.success('Nombre actualizado');
      await cargar();
    } catch {
      toast.error('Error al renombrar');
    }
  };

  const pistasPorEstilo = (codigo) => pistas.filter(p => p.estilo === codigo);

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
        <h1 className="text-4xl font-display font-bold text-slate-800">Catálogo de Música</h1>
        <p className="text-sm text-slate-500 mt-2">Música de fondo para las trivias, agrupada por estilo.</p>
      </div>

      {/* Form alta */}
      <div className="glass-card-static p-6 mb-8 animate-fade-up" style={{ animationDelay: '0.05s' }}>
        <h2 className="text-xl font-display font-bold text-slate-800 mb-5">Nueva pista</h2>
        <form onSubmit={handleCrear} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-xs font-display font-semibold text-slate-500 uppercase tracking-wider mb-2">Nombre</label>
            <input
              type="text"
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-base font-medium text-slate-700 focus:outline-none focus:border-primary-500/50"
              placeholder="Ej: Pista relajada 1"
            />
          </div>
          <div>
            <label className="block text-xs font-display font-semibold text-slate-500 uppercase tracking-wider mb-2">Estilo</label>
            <select
              value={estilo}
              onChange={e => setEstilo(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-base font-medium text-slate-700 focus:outline-none focus:border-primary-500/50"
            >
              {ESTILOS.map(s => (
                <option key={s.codigo} value={s.codigo}>{s.etiqueta}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-display font-semibold text-slate-500 uppercase tracking-wider mb-2">Archivo</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*"
              onChange={e => setArchivo(e.target.files?.[0] || null)}
              className="block w-full text-sm text-slate-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-xl file:border file:border-slate-200
                file:text-sm file:font-display file:font-semibold
                file:bg-slate-50 file:text-primary-600
                hover:file:bg-slate-100 file:transition-all file:duration-200
                file:cursor-pointer"
            />
          </div>
          <button
            type="submit"
            disabled={subiendo}
            className="px-5 py-3 rounded-xl bg-primary-500 text-white font-display font-semibold hover:bg-primary-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {subiendo ? 'Subiendo...' : 'Subir pista'}
          </button>
        </form>
      </div>

      {/* Listado por estilo */}
      <div className="space-y-8">
        {ESTILOS.map((s, idx) => {
          const items = pistasPorEstilo(s.codigo);
          return (
            <div
              key={s.codigo}
              className="glass-card-static p-6 animate-fade-up"
              style={{ animationDelay: `${0.1 + 0.05 * idx}s` }}
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl font-display font-bold text-slate-800">{s.etiqueta}</h2>
                <span className="text-xs font-mono uppercase tracking-wider text-slate-400 bg-slate-100 px-2 py-1 rounded-md">
                  {items.length} {items.length === 1 ? 'pista' : 'pistas'}
                </span>
              </div>

              {items.length === 0 ? (
                <p className="text-sm text-slate-400 italic">Sin pistas en este estilo</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {items.map(pista => (
                    <div key={pista.id} className="border border-slate-200 rounded-2xl p-4 space-y-3 bg-white/50">
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <div className="font-display font-semibold text-slate-800 truncate">{pista.nombre}</div>
                          <div className="text-xs text-slate-400 mt-0.5">
                            {pista.esta_activo ? (
                              <span className="text-emerald-600">Activa</span>
                            ) : (
                              <span className="text-slate-400">Inactiva</span>
                            )}
                          </div>
                        </div>
                        <label className="inline-flex items-center cursor-pointer flex-shrink-0">
                          <input
                            type="checkbox"
                            checked={!!pista.esta_activo}
                            onChange={() => handleToggleActivo(pista)}
                            className="sr-only peer"
                          />
                          <div className="w-10 h-5 bg-slate-200 rounded-full peer peer-checked:bg-primary-500 transition-colors relative after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:w-4 after:h-4 after:transition-transform peer-checked:after:translate-x-5" />
                        </label>
                      </div>

                      <audio src={getUploadUrl(pista.ruta_archivo)} controls className="w-full" />

                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => handleRenombrar(pista)}
                          className="text-xs font-display font-semibold text-slate-600 hover:text-primary-600 transition-colors"
                        >
                          Renombrar
                        </button>
                        <span className="text-slate-300">·</span>
                        <button
                          type="button"
                          onClick={() => replaceInputsRef.current[pista.id]?.click()}
                          disabled={reemplazando === pista.id}
                          className="text-xs font-display font-semibold text-slate-600 hover:text-primary-600 transition-colors disabled:opacity-60"
                        >
                          {reemplazando === pista.id ? 'Reemplazando...' : 'Reemplazar'}
                        </button>
                        <input
                          ref={el => { replaceInputsRef.current[pista.id] = el; }}
                          type="file"
                          accept="audio/*"
                          className="hidden"
                          onChange={e => {
                            const f = e.target.files?.[0];
                            if (f) handleReemplazar(pista.id, f);
                            e.target.value = '';
                          }}
                        />
                        <span className="text-slate-300">·</span>
                        <button
                          type="button"
                          onClick={() => handleEliminar(pista.id)}
                          className="text-xs font-display font-semibold text-rose-600 hover:text-rose-700 transition-colors"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
