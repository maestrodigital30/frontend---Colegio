import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { listarTemas, actualizarTema } from '../../services/temaVisualService';

export default function TemasVisuales() {
  const [temas, setTemas] = useState([]);
  const [borradores, setBorradores] = useState({});
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(null);

  const cargar = async () => {
    try {
      const data = await listarTemas();
      const lista = Array.isArray(data) ? data : [];
      setTemas(lista);
      const draft = {};
      for (const t of lista) {
        draft[t.id] = {
          nombre: t.nombre || '',
          descripcion: t.descripcion || '',
          orden: t.orden ?? 0,
          esta_activo: !!t.esta_activo,
          config_json_text: JSON.stringify(t.config_json ?? {}, null, 2),
        };
      }
      setBorradores(draft);
    } catch {
      toast.error('Error al cargar temas');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  const updateDraft = (id, patch) => {
    setBorradores(prev => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  };

  const handleGuardar = async (tema) => {
    const draft = borradores[tema.id];
    if (!draft) return;
    let config_json;
    try {
      config_json = JSON.parse(draft.config_json_text);
    } catch {
      toast.error('config_json no es JSON válido');
      return;
    }
    if (!draft.nombre.trim()) return toast.error('Nombre obligatorio');
    setGuardando(tema.id);
    try {
      await actualizarTema(tema.id, {
        nombre: draft.nombre.trim(),
        descripcion: draft.descripcion,
        orden: Number(draft.orden) || 0,
        esta_activo: !!draft.esta_activo,
        config_json,
      });
      toast.success(`Tema "${draft.nombre}" guardado`);
      await cargar();
    } catch (e) {
      toast.error(e.response?.data?.error || 'Error al guardar tema');
    } finally {
      setGuardando(null);
    }
  };

  const handleFormatear = (id) => {
    const draft = borradores[id];
    if (!draft) return;
    try {
      const obj = JSON.parse(draft.config_json_text);
      updateDraft(id, { config_json_text: JSON.stringify(obj, null, 2) });
      toast.success('JSON formateado');
    } catch {
      toast.error('JSON inválido, no se puede formatear');
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
        <h1 className="text-4xl font-display font-bold text-slate-800">Temas Visuales</h1>
        <p className="text-sm text-slate-500 mt-2">Edita los temas disponibles. El JSON define colores y tokens de identidad.</p>
      </div>

      <div className="space-y-6">
        {temas.map((tema, i) => {
          const draft = borradores[tema.id] || {};
          return (
            <div
              key={tema.id}
              className="glass-card-static p-6 animate-fade-up"
              style={{ animationDelay: `${0.05 * (i + 1)}s` }}
            >
              <div className="flex items-center justify-between mb-5 gap-4 flex-wrap">
                <div className="min-w-0">
                  <h2 className="text-xl font-display font-bold text-slate-800">{tema.nombre}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-mono uppercase tracking-wider text-slate-400 bg-slate-100 px-2 py-1 rounded-md">
                      {tema.codigo}
                    </span>
                    {tema.esta_activo ? (
                      <span className="text-xs font-display font-semibold text-emerald-600">Activo</span>
                    ) : (
                      <span className="text-xs font-display font-semibold text-slate-400">Inactivo</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Campos meta */}
                <div className="space-y-4 lg:col-span-1">
                  <div>
                    <label className="block text-xs font-display font-semibold text-slate-500 uppercase tracking-wider mb-2">Nombre</label>
                    <input
                      type="text"
                      value={draft.nombre}
                      onChange={e => updateDraft(tema.id, { nombre: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-base font-medium text-slate-700 focus:outline-none focus:border-primary-500/50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-display font-semibold text-slate-500 uppercase tracking-wider mb-2">Descripción</label>
                    <textarea
                      rows={3}
                      value={draft.descripcion}
                      onChange={e => updateDraft(tema.id, { descripcion: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:border-primary-500/50 resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-display font-semibold text-slate-500 uppercase tracking-wider mb-2">Orden</label>
                    <input
                      type="number"
                      value={draft.orden}
                      onChange={e => updateDraft(tema.id, { orden: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-base font-medium text-slate-700 focus:outline-none focus:border-primary-500/50"
                    />
                  </div>
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!draft.esta_activo}
                      onChange={e => updateDraft(tema.id, { esta_activo: e.target.checked })}
                      className="w-4 h-4 accent-primary-500"
                    />
                    <span className="text-sm font-display font-semibold text-slate-700">Activo</span>
                  </label>
                </div>

                {/* Editor JSON */}
                <div className="lg:col-span-2">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-display font-semibold text-slate-500 uppercase tracking-wider">config_json</label>
                    <button
                      type="button"
                      onClick={() => handleFormatear(tema.id)}
                      className="text-xs font-display font-semibold text-primary-600 hover:text-primary-700 transition-colors"
                    >
                      Formatear JSON
                    </button>
                  </div>
                  <textarea
                    rows={14}
                    value={draft.config_json_text}
                    onChange={e => updateDraft(tema.id, { config_json_text: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-900 text-emerald-200 border border-slate-700 rounded-xl text-xs font-mono leading-relaxed focus:outline-none focus:border-primary-500/50 resize-y"
                    spellCheck={false}
                  />
                </div>
              </div>

              <div className="mt-5 flex justify-end">
                <button
                  type="button"
                  onClick={() => handleGuardar(tema)}
                  disabled={guardando === tema.id}
                  className="px-5 py-3 rounded-xl bg-primary-500 text-white font-display font-semibold hover:bg-primary-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {guardando === tema.id ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
