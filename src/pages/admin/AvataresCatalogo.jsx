import { useEffect, useState, useRef } from 'react';
import toast from 'react-hot-toast';
import {
  listarAvatares,
  crearAvatar,
  actualizarAvatar,
  eliminarAvatar,
} from '../../services/avatarCatalogoService';
import { getUploadUrl } from '../../utils/storage';

const TABS = [
  { codigo: 'avatar', etiqueta: 'Avatares' },
  { codigo: 'personaje', etiqueta: 'Personajes' },
  { codigo: 'marco', etiqueta: 'Marcos' },
];

const EXTENSIONES_VALIDAS = ['jpg', 'jpeg', 'png', 'webp', 'gif'];

function esImagenValida(file) {
  if (!file) return false;
  const ext = file.name.split('.').pop()?.toLowerCase();
  return EXTENSIONES_VALIDAS.includes(ext);
}

export default function AvataresCatalogo() {
  const [tab, setTab] = useState('avatar');
  const [items, setItems] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [subiendo, setSubiendo] = useState(false);

  // Formulario alta
  const [nombre, setNombre] = useState('');
  const [orden, setOrden] = useState(0);
  const [esDefault, setEsDefault] = useState(false);
  const [archivo, setArchivo] = useState(null);
  const fileInputRef = useRef(null);

  const cargar = async () => {
    setCargando(true);
    try {
      const data = await listarAvatares(tab);
      setItems(Array.isArray(data) ? data : []);
    } catch {
      toast.error('Error al cargar elementos');
    } finally {
      setCargando(false);
    }
  };

  // `cargar` se redefine en cada render; depender solo de `tab` es intencional.
  useEffect(() => { cargar(); }, [tab]); // eslint-disable-line react-hooks/exhaustive-deps

  const resetForm = () => {
    setNombre('');
    setOrden(0);
    setEsDefault(false);
    setArchivo(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleCrear = async (e) => {
    e.preventDefault();
    if (!nombre.trim()) return toast.error('Ingresa un nombre');
    if (!archivo) return toast.error('Selecciona una imagen');
    if (!esImagenValida(archivo)) {
      return toast.error('Formato no válido (jpg, png, webp, gif)');
    }
    setSubiendo(true);
    try {
      await crearAvatar({
        tipo: tab,
        nombre: nombre.trim(),
        orden: Number(orden) || 0,
        es_default: esDefault,
        archivo,
      });
      toast.success('Elemento creado');
      resetForm();
      await cargar();
    } catch (e) {
      toast.error(e.response?.data?.error || 'Error al subir');
    } finally {
      setSubiendo(false);
    }
  };

  const handleRenombrar = async (item) => {
    const nuevo = prompt('Nuevo nombre:', item.nombre);
    if (!nuevo || !nuevo.trim() || nuevo === item.nombre) return;
    try {
      await actualizarAvatar(item.id, { nombre: nuevo.trim() });
      toast.success('Nombre actualizado');
      await cargar();
    } catch {
      toast.error('Error al renombrar');
    }
  };

  const handleMarcarDefault = async (item) => {
    try {
      await actualizarAvatar(item.id, { es_default: 'true' });
      toast.success('Marcado como default');
      await cargar();
    } catch {
      toast.error('Error al marcar default');
    }
  };

  const handleEliminar = async (id) => {
    if (!confirm('¿Eliminar este elemento?')) return;
    try {
      await eliminarAvatar(id);
      toast.success('Elemento eliminado');
      await cargar();
    } catch {
      toast.error('Error al eliminar');
    }
  };

  return (
    <div>
      <div className="mb-10 animate-fade-up">
        <p className="text-sm font-display font-semibold text-primary-600 uppercase tracking-widest mb-2">Administracion</p>
        <h1 className="text-4xl font-display font-bold text-slate-800">Avatares, Personajes y Marcos</h1>
        <p className="text-sm text-slate-500 mt-2">Catálogo gráfico para identidad visual de alumnos y partidas.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-slate-200 animate-fade-up" style={{ animationDelay: '0.05s' }}>
        {TABS.map(t => (
          <button
            key={t.codigo}
            type="button"
            onClick={() => setTab(t.codigo)}
            className={`px-5 py-3 font-display font-semibold text-sm border-b-2 transition-colors ${
              tab === t.codigo
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {t.etiqueta}
          </button>
        ))}
      </div>

      {/* Formulario alta */}
      <div className="glass-card-static p-6 mb-8 animate-fade-up" style={{ animationDelay: '0.1s' }}>
        <h2 className="text-xl font-display font-bold text-slate-800 mb-5">
          Nuevo {TABS.find(t => t.codigo === tab)?.etiqueta.slice(0, -1).toLowerCase()}
        </h2>
        <form onSubmit={handleCrear} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
          <div className="md:col-span-2">
            <label className="block text-xs font-display font-semibold text-slate-500 uppercase tracking-wider mb-2">Nombre</label>
            <input
              type="text"
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-base font-medium text-slate-700 focus:outline-none focus:border-primary-500/50"
            />
          </div>
          <div>
            <label className="block text-xs font-display font-semibold text-slate-500 uppercase tracking-wider mb-2">Orden</label>
            <input
              type="number"
              value={orden}
              onChange={e => setOrden(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-base font-medium text-slate-700 focus:outline-none focus:border-primary-500/50"
            />
          </div>
          <div>
            <label className="block text-xs font-display font-semibold text-slate-500 uppercase tracking-wider mb-2">Imagen</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
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
          <div>
            <label className="inline-flex items-center gap-2 cursor-pointer mt-7">
              <input
                type="checkbox"
                checked={esDefault}
                onChange={e => setEsDefault(e.target.checked)}
                className="w-4 h-4 accent-primary-500"
              />
              <span className="text-sm font-display font-semibold text-slate-700">Default</span>
            </label>
          </div>
          <div className="md:col-span-5">
            <button
              type="submit"
              disabled={subiendo}
              className="px-5 py-3 rounded-xl bg-primary-500 text-white font-display font-semibold hover:bg-primary-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {subiendo ? 'Subiendo...' : 'Subir'}
            </button>
          </div>
        </form>
      </div>

      {/* Grid */}
      <div className="glass-card-static p-6 animate-fade-up" style={{ animationDelay: '0.15s' }}>
        {cargando ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <p className="text-sm text-slate-400 italic text-center py-8">Aún no hay elementos en este catálogo</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {items.map(item => (
              <div key={item.id} className="border border-slate-200 rounded-2xl overflow-hidden bg-white/60 flex flex-col">
                <div className="aspect-square bg-slate-50 relative flex items-center justify-center overflow-hidden">
                  <img
                    src={getUploadUrl(item.ruta_archivo)}
                    alt={item.nombre}
                    className="w-full h-full object-contain"
                  />
                  {item.es_default && (
                    <span className="absolute top-2 right-2 px-2 py-0.5 text-[10px] font-display font-bold uppercase tracking-wider rounded-md bg-emerald-500 text-white shadow-sm">
                      Default
                    </span>
                  )}
                </div>
                <div className="p-3 space-y-2">
                  <div className="font-display font-semibold text-slate-800 text-sm truncate">{item.nombre}</div>
                  <div className="text-[10px] uppercase tracking-wider text-slate-400">Orden: {item.orden ?? 0}</div>
                  <div className="flex flex-wrap gap-x-2 gap-y-1 pt-1">
                    <button
                      type="button"
                      onClick={() => handleRenombrar(item)}
                      className="text-[11px] font-display font-semibold text-slate-600 hover:text-primary-600 transition-colors"
                    >
                      Editar nombre
                    </button>
                    {!item.es_default && (
                      <>
                        <span className="text-slate-300 text-[11px]">·</span>
                        <button
                          type="button"
                          onClick={() => handleMarcarDefault(item)}
                          className="text-[11px] font-display font-semibold text-emerald-600 hover:text-emerald-700 transition-colors"
                        >
                          Marcar default
                        </button>
                      </>
                    )}
                    <span className="text-slate-300 text-[11px]">·</span>
                    <button
                      type="button"
                      onClick={() => handleEliminar(item.id)}
                      className="text-[11px] font-display font-semibold text-rose-600 hover:text-rose-700 transition-colors"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
