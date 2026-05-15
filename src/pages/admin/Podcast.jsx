import { useState, useEffect } from 'react';
import apiClient from '../../services/apiClient';
import { getUploadUrl } from '../../utils/storage';
import { extraerYoutubeId, miniaturYoutube, esUrlYoutube } from '../../utils/youtube';
import Boton from '../../components/common/Boton';
import InputCampo from '../../components/common/InputCampo';
import Modal from '../../components/common/Modal';
import { HiPencil, HiTrash, HiMicrophone, HiPlay, HiLink, HiFolder, HiCalendar, HiPhotograph, HiUpload, HiX, HiPlus, HiSearch, HiFilter } from 'react-icons/hi';
import toast from 'react-hot-toast';
import { fechaHoy } from '../../utils/formatters';

export default function PodcastAdminPage() {
  const [tab, setTab] = useState('entradas');
  const [logoUrl, setLogoUrl] = useState(null);
  const [subiendoLogo, setSubiendoLogo] = useState(false);

  // Entradas
  const [entradas, setEntradas] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [modalEntrada, setModalEntrada] = useState(false);
  const [editandoEntrada, setEditandoEntrada] = useState(null);
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [formEntrada, setFormEntrada] = useState({
    titulo: '', descripcion: '', url: '', tipo: 'youtube', id_categoria: '', fecha_publicacion: '',
  });

  // Categorias
  const [modalCategoria, setModalCategoria] = useState(false);
  const [editandoCategoria, setEditandoCategoria] = useState(null);
  const [formCategoria, setFormCategoria] = useState({ nombre: '' });

  // ─── Cargar datos ───
  const cargarConfig = async () => {
    try {
      const { data } = await apiClient.get('/podcasts/config');
      setLogoUrl(data.logo_url);
    } catch { /* sin config aun */ }
  };

  const cargarCategorias = async () => {
    try {
      const { data } = await apiClient.get('/podcasts/categorias');
      setCategorias(data);
    } catch { setCategorias([]); }
  };

  const cargarEntradas = async () => {
    setCargando(true);
    try {
      const params = new URLSearchParams();
      if (filtroCategoria) params.set('id_categoria', filtroCategoria);
      if (busqueda) params.set('busqueda', busqueda);
      const { data } = await apiClient.get(`/podcasts?${params}`);
      setEntradas(data);
    } catch { setEntradas([]); }
    setCargando(false);
  };

  useEffect(() => { cargarConfig(); cargarCategorias(); }, []);
  useEffect(() => { cargarEntradas(); }, [filtroCategoria, busqueda]);

  // ─── Logo ───
  const handleSubirLogo = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return toast.error('Máximo 5MB');

    setSubiendoLogo(true);
    try {
      const fd = new FormData();
      fd.append('logo', file);
      const { data } = await apiClient.post('/podcasts/config/logo', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setLogoUrl(data.logo_url);
      toast.success('Logo actualizado');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al subir logo');
    }
    setSubiendoLogo(false);
    e.target.value = '';
  };

  const handleQuitarLogo = async () => {
    try {
      await apiClient.delete('/podcasts/config/logo');
      setLogoUrl(null);
      toast.success('Logo eliminado');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error');
    }
  };

  // ─── Entradas CRUD ───
  const abrirCrearEntrada = () => {
    setEditandoEntrada(null);
    setFormEntrada({ titulo: '', descripcion: '', url: '', tipo: 'youtube', id_categoria: '', fecha_publicacion: fechaHoy() });
    setModalEntrada(true);
  };

  const abrirEditarEntrada = (e) => {
    setEditandoEntrada(e);
    setFormEntrada({
      titulo: e.titulo, descripcion: e.descripcion || '', url: e.url,
      tipo: e.tipo, id_categoria: e.id_categoria || '',
      fecha_publicacion: e.fecha_publicacion ? e.fecha_publicacion.split('T')[0] : '',
    });
    setModalEntrada(true);
  };

  const guardarEntrada = async () => {
    if (!formEntrada.titulo.trim()) return toast.error('El título es obligatorio');
    if (!formEntrada.url.trim()) return toast.error('La URL es obligatoria');

    try {
      if (editandoEntrada) {
        await apiClient.put(`/podcasts/${editandoEntrada.id}`, formEntrada);
        toast.success('Entrada actualizada');
      } else {
        await apiClient.post('/podcasts', formEntrada);
        toast.success('Entrada creada');
      }
      setModalEntrada(false);
      cargarEntradas();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error');
    }
  };

  const eliminarEntrada = async (id) => {
    if (!confirm('¿Eliminar esta entrada?')) return;
    try {
      await apiClient.delete(`/podcasts/${id}`);
      toast.success('Entrada eliminada');
      cargarEntradas();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error');
    }
  };

  // ─── Categorias CRUD ───
  const abrirCrearCategoria = () => {
    setEditandoCategoria(null);
    setFormCategoria({ nombre: '' });
    setModalCategoria(true);
  };

  const abrirEditarCategoria = (c) => {
    setEditandoCategoria(c);
    setFormCategoria({ nombre: c.nombre });
    setModalCategoria(true);
  };

  const guardarCategoria = async () => {
    if (!formCategoria.nombre.trim()) return toast.error('El nombre es obligatorio');
    try {
      if (editandoCategoria) {
        await apiClient.put(`/podcasts/categorias/${editandoCategoria.id}`, formCategoria);
        toast.success('Categoría actualizada');
      } else {
        await apiClient.post('/podcasts/categorias', formCategoria);
        toast.success('Categoría creada');
      }
      setModalCategoria(false);
      cargarCategorias();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error');
    }
  };

  const eliminarCategoria = async (id) => {
    if (!confirm('¿Eliminar esta categoría?')) return;
    try {
      await apiClient.delete(`/podcasts/categorias/${id}`);
      toast.success('Categoría eliminada');
      cargarCategorias();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error');
    }
  };

  // ─── Auto-detectar tipo por URL ───
  const handleUrlChange = (e) => {
    const url = e.target.value;
    setFormEntrada(prev => ({
      ...prev,
      url,
      tipo: esUrlYoutube(url) ? 'youtube' : 'link',
    }));
  };

  return (
    <div className="animate-fade-up" style={{ fontSize: '115%' }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-xs font-display font-medium text-primary-600 uppercase tracking-widest mb-1">Multimedia</p>
          <h1 className="text-3xl font-display font-bold text-slate-800">Podcast</h1>
        </div>
      </div>

      {/* Header con logo */}
      <div className="glass-card-static p-5 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center overflow-hidden shrink-0 shadow-lg">
            {logoUrl ? (
              <img src={getUploadUrl(logoUrl)} alt="Logo Podcast" className="w-full h-full object-cover" />
            ) : (
              <HiMicrophone className="w-8 h-8 text-white" />
            )}
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-display font-bold text-slate-800">Logo del Podcast</h2>
            <p className="text-sm text-slate-500">Este logo aparece en el sidebar y en la cabecera del módulo para los docentes</p>
          </div>
          <div className="flex gap-2">
            <label className="cursor-pointer">
              <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors">
                <HiUpload className="w-4 h-4" />
                {subiendoLogo ? 'Subiendo...' : logoUrl ? 'Reemplazar' : 'Subir Logo'}
              </span>
              <input type="file" accept="image/jpeg,image/jpg,image/png,image/webp" onChange={handleSubirLogo} className="hidden" disabled={subiendoLogo} />
            </label>
            {logoUrl && (
              <button onClick={handleQuitarLogo} className="inline-flex items-center gap-1.5 px-3 py-2 bg-rose-100 text-rose-600 text-sm font-semibold rounded-lg hover:bg-rose-200 transition-colors">
                <HiX className="w-4 h-4" />Quitar
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 mb-6">
        <button onClick={() => setTab('entradas')} className={`inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-bold transition-colors ${tab === 'entradas' ? 'text-blue-700 border-b-2 border-blue-600' : 'text-slate-400 hover:text-slate-600'}`}>
          <HiPlay className="w-4 h-4" />Entradas
        </button>
        <button onClick={() => setTab('categorias')} className={`inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-bold transition-colors ${tab === 'categorias' ? 'text-blue-700 border-b-2 border-blue-600' : 'text-slate-400 hover:text-slate-600'}`}>
          <HiFolder className="w-4 h-4" />Categorías
        </button>
      </div>

      {/* Tab: Entradas */}
      {tab === 'entradas' && (
        <div className="glass-card-static">
          <div className="flex items-center gap-3 p-4 border-b border-slate-100">
            <Boton onClick={abrirCrearEntrada}><HiPlus className="w-4 h-4 mr-1 inline-block" />Nueva Entrada</Boton>
            <div className="relative">
              <HiFilter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <select value={filtroCategoria} onChange={(e) => setFiltroCategoria(e.target.value)} className="pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500">
                <option value="">Todas las categorías</option>
                {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
            </div>
            <div className="relative flex-1">
              <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="text" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar por título..." className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="px-5 py-3.5 text-left text-xs font-display font-bold uppercase tracking-wider bg-slate-100 text-slate-600">#</th>
                  <th className="px-5 py-3.5 text-left text-xs font-display font-bold uppercase tracking-wider bg-sky-200 text-sky-800">
                    <span className="inline-flex items-center gap-1"><HiPhotograph className="w-3.5 h-3.5" />Preview</span>
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-display font-bold uppercase tracking-wider bg-primary-200 text-primary-800">
                    <span className="inline-flex items-center gap-1"><HiMicrophone className="w-3.5 h-3.5" />Título</span>
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-display font-bold uppercase tracking-wider bg-violet-200 text-violet-800">
                    <span className="inline-flex items-center gap-1"><HiLink className="w-3.5 h-3.5" />Tipo</span>
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-display font-bold uppercase tracking-wider bg-teal-200 text-teal-800">
                    <span className="inline-flex items-center gap-1"><HiFolder className="w-3.5 h-3.5" />Categoría</span>
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-display font-bold uppercase tracking-wider bg-indigo-200 text-indigo-800">
                    <span className="inline-flex items-center gap-1"><HiCalendar className="w-3.5 h-3.5" />Fecha</span>
                  </th>
                  <th className="px-5 py-3.5 text-center text-xs font-display font-bold uppercase tracking-wider bg-primary-200 text-primary-800">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {cargando ? (
                  <tr><td colSpan={7} className="px-5 py-8 text-center text-sm text-slate-400">Cargando...</td></tr>
                ) : entradas.length === 0 ? (
                  <tr><td colSpan={7} className="px-5 py-8 text-center text-sm text-slate-400">No hay entradas registradas</td></tr>
                ) : entradas.map((e, idx) => (
                  <tr key={e.id} className="hover:bg-slate-50/80 transition-colors duration-200">
                    <td className="px-5 py-3.5 text-[15px] font-semibold text-slate-500 bg-slate-50/50">{idx + 1}</td>
                    <td className="px-5 py-3.5 bg-sky-100/40">
                      {e.tipo === 'youtube' && miniaturYoutube(e.url) ? (
                        <img src={miniaturYoutube(e.url)} alt="" className="w-20 h-12 object-cover rounded-lg shadow-sm" />
                      ) : (
                        <div className="w-20 h-12 bg-slate-100 rounded-lg flex items-center justify-center">
                          <HiLink className="w-5 h-5 text-slate-400" />
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-[15px] font-bold text-black bg-primary-100/40">{e.titulo}</td>
                    <td className="px-5 py-3.5 bg-violet-100/40">
                      {e.tipo === 'youtube' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-200">
                          <HiPlay className="w-3 h-3" />YouTube
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700 border border-blue-200">
                          <HiLink className="w-3 h-3" />Link
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 bg-teal-100/40">
                      {e.tbl_podcast_categorias ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-teal-100 text-teal-700 border border-teal-200">
                          <HiFolder className="w-3 h-3" />{e.tbl_podcast_categorias.nombre}
                        </span>
                      ) : <span className="text-sm text-slate-400">-</span>}
                    </td>
                    <td className="px-5 py-3.5 text-[15px] font-semibold text-slate-700 bg-indigo-100/40">
                      {e.fecha_publicacion ? e.fecha_publicacion.substring(0, 10).split('-').reverse().join('/') : '-'}
                    </td>
                    <td className="px-5 py-3.5 text-center bg-primary-100/40">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => abrirEditarEntrada(e)} className="p-1.5 text-primary-500 hover:bg-primary-50 rounded-lg transition-colors" title="Editar">
                          <HiPencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => eliminarEntrada(e.id)} className="p-1.5 text-rose-400 hover:bg-rose-50 rounded-lg transition-colors" title="Eliminar">
                          <HiTrash className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Categorias */}
      {tab === 'categorias' && (
        <div className="glass-card-static">
          <div className="flex items-center gap-3 p-4 border-b border-slate-100">
            <Boton onClick={abrirCrearCategoria}><HiPlus className="w-4 h-4 mr-1 inline-block" />Nueva Categoría</Boton>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="px-5 py-3.5 text-left text-xs font-display font-bold uppercase tracking-wider bg-slate-100 text-slate-600">#</th>
                  <th className="px-5 py-3.5 text-left text-xs font-display font-bold uppercase tracking-wider bg-teal-200 text-teal-800">
                    <span className="inline-flex items-center gap-1"><HiFolder className="w-3.5 h-3.5" />Nombre</span>
                  </th>
                  <th className="px-5 py-3.5 text-center text-xs font-display font-bold uppercase tracking-wider bg-primary-200 text-primary-800">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {categorias.length === 0 ? (
                  <tr><td colSpan={3} className="px-5 py-8 text-center text-sm text-slate-400">No hay categorías</td></tr>
                ) : categorias.map((c, idx) => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition-colors duration-200">
                    <td className="px-5 py-3.5 text-[15px] font-semibold text-slate-500 bg-slate-50/50">{idx + 1}</td>
                    <td className="px-5 py-3.5 text-[15px] font-bold text-black bg-teal-100/40">{c.nombre}</td>
                    <td className="px-5 py-3.5 text-center bg-primary-100/40">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => abrirEditarCategoria(c)} className="p-1.5 text-primary-500 hover:bg-primary-50 rounded-lg transition-colors" title="Editar">
                          <HiPencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => eliminarCategoria(c.id)} className="p-1.5 text-rose-400 hover:bg-rose-50 rounded-lg transition-colors" title="Eliminar">
                          <HiTrash className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Entrada */}
      <Modal abierto={modalEntrada} cerrar={() => setModalEntrada(false)} titulo={editandoEntrada ? 'Editar Entrada' : 'Nueva Entrada'} ancho="max-w-2xl">
        <div className="space-y-4">
          <InputCampo label="Título" name="titulo" value={formEntrada.titulo} onChange={(e) => setFormEntrada(prev => ({ ...prev, titulo: e.target.value }))} />
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Descripción</label>
            <textarea value={formEntrada.descripcion} onChange={(e) => setFormEntrada(prev => ({ ...prev, descripcion: e.target.value }))} rows={3} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 text-slate-800" placeholder="Descripción del contenido..." />
          </div>
          <div>
            <InputCampo label="URL" name="url" value={formEntrada.url} onChange={handleUrlChange} placeholder="https://www.youtube.com/watch?v=... o cualquier link" />
            {formEntrada.url && formEntrada.tipo === 'youtube' && miniaturYoutube(formEntrada.url) && (
              <div className="mt-2">
                <img src={miniaturYoutube(formEntrada.url)} alt="Preview" className="w-40 h-24 object-cover rounded-lg border border-slate-200" />
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <InputCampo label="Tipo" name="tipo" type="select" value={formEntrada.tipo} onChange={(e) => setFormEntrada(prev => ({ ...prev, tipo: e.target.value }))} options={[
              { value: 'youtube', label: 'YouTube' },
              { value: 'link', label: 'Link externo' },
            ]} />
            <InputCampo label="Categoría" name="categoria" type="select" value={formEntrada.id_categoria} onChange={(e) => setFormEntrada(prev => ({ ...prev, id_categoria: e.target.value }))} options={[
              { value: '', label: 'Sin categoría' },
              ...categorias.map(c => ({ value: c.id, label: c.nombre })),
            ]} />
          </div>
          <InputCampo label="Fecha de publicación" name="fecha" type="date" value={formEntrada.fecha_publicacion} onChange={(e) => setFormEntrada(prev => ({ ...prev, fecha_publicacion: e.target.value }))} />
          <div className="flex justify-end gap-3 pt-2">
            <Boton tipo="outline" onClick={() => setModalEntrada(false)}>Cancelar</Boton>
            <Boton onClick={guardarEntrada}>{editandoEntrada ? 'Guardar Cambios' : 'Crear Entrada'}</Boton>
          </div>
        </div>
      </Modal>

      {/* Modal Categoria */}
      <Modal abierto={modalCategoria} cerrar={() => setModalCategoria(false)} titulo={editandoCategoria ? 'Editar Categoría' : 'Nueva Categoría'}>
        <div className="space-y-4">
          <InputCampo label="Nombre" name="nombre" value={formCategoria.nombre} onChange={(e) => setFormCategoria({ nombre: e.target.value })} />
          <div className="flex justify-end gap-3 pt-2">
            <Boton tipo="outline" onClick={() => setModalCategoria(false)}>Cancelar</Boton>
            <Boton onClick={guardarCategoria}>{editandoCategoria ? 'Guardar' : 'Crear'}</Boton>
          </div>
        </div>
      </Modal>
    </div>
  );
}
