import { useState, useEffect, useCallback } from 'react';
import apiClient from '../../services/apiClient';
import { getUploadUrl, getDownloadUrl } from '../../utils/storage';
import { DEFAULT_COLORS } from '../../utils/colorUtils';
import { embedYoutube, esUrlYoutube } from '../../utils/youtube';
import Modal from '../../components/common/Modal';
import toast from 'react-hot-toast';
import {
  HiPlus, HiPencil, HiTrash, HiDownload, HiEye, HiSearch,
  HiDocumentText, HiPhotograph, HiTable, HiFolder, HiUpload,
  HiVideoCamera, HiExternalLink, HiLink
} from 'react-icons/hi';

const TIPOS_ARCHIVO = {
  pdf: { label: 'PDF', color: 'text-red-500', bg: 'bg-red-50' },
  doc: { label: 'Word', color: 'text-primary-600', bg: 'bg-primary-50' },
  docx: { label: 'Word', color: 'text-primary-600', bg: 'bg-primary-50' },
  xls: { label: 'Excel', color: 'text-green-600', bg: 'bg-green-50' },
  xlsx: { label: 'Excel', color: 'text-green-600', bg: 'bg-green-50' },
  ppt: { label: 'PowerPoint', color: 'text-orange-500', bg: 'bg-orange-50' },
  pptx: { label: 'PowerPoint', color: 'text-orange-500', bg: 'bg-orange-50' },
  jpg: { label: 'Imagen', color: 'text-purple-500', bg: 'bg-purple-50' },
  jpeg: { label: 'Imagen', color: 'text-purple-500', bg: 'bg-purple-50' },
  png: { label: 'Imagen', color: 'text-purple-500', bg: 'bg-purple-50' },
  webp: { label: 'Imagen', color: 'text-purple-500', bg: 'bg-purple-50' },
  txt: { label: 'Texto', color: 'text-gray-500', bg: 'bg-gray-50' },
  csv: { label: 'CSV', color: 'text-green-500', bg: 'bg-green-50' },
  enlace: { label: 'Video', color: 'text-pink-500', bg: 'bg-pink-50' },
};

const esEnlace = (m) => m?.extension?.toLowerCase() === 'enlace';

const getIconoArchivo = (extension) => {
  const ext = extension?.toLowerCase();
  if (ext === 'enlace') return HiVideoCamera;
  if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext)) return HiPhotograph;
  if (['xls', 'xlsx', 'csv'].includes(ext)) return HiTable;
  return HiDocumentText;
};

const getTipoInfo = (extension) => {
  return TIPOS_ARCHIVO[extension?.toLowerCase()] || { label: extension?.toUpperCase() || 'Archivo', color: 'text-slate-500', bg: 'bg-slate-50' };
};

const formatSize = (bytes) => {
  const num = Number(bytes);
  if (num < 1024) return `${num} B`;
  if (num < 1024 * 1024) return `${(num / 1024).toFixed(1)} KB`;
  if (num < 1024 * 1024 * 1024) return `${(num / (1024 * 1024)).toFixed(1)} MB`;
  return `${(num / (1024 * 1024 * 1024)).toFixed(2)} GB`;
};

const esPrevisualizableEnLinea = (m) => {
  if (esEnlace(m)) return true;
  const ext = m?.extension?.toLowerCase();
  return ext === 'pdf' || ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext);
};

const ACCEPT_ARCHIVOS = '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.webp,.gif,.txt,.csv';

export default function BibliotecaAdmin() {
  const [tab, setTab] = useState('materiales');
  const [materiales, setMateriales] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [cargando, setCargando] = useState(true);

  // Filtros
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [busqueda, setBusqueda] = useState('');

  // Modal material
  const [modalMaterial, setModalMaterial] = useState(false);
  const [editandoMaterial, setEditandoMaterial] = useState(null);
  const [formMaterial, setFormMaterial] = useState({ titulo: '', descripcion: '', id_categoria: '' });
  const [tipoSubida, setTipoSubida] = useState('archivo'); // 'archivo' | 'enlace'
  const [archivoSeleccionado, setArchivoSeleccionado] = useState(null);
  const [urlEnlace, setUrlEnlace] = useState('');
  const [subiendo, setSubiendo] = useState(false);

  // Modal categoria
  const [modalCategoria, setModalCategoria] = useState(false);
  const [editandoCategoria, setEditandoCategoria] = useState(null);
  const [formCategoria, setFormCategoria] = useState({ nombre: '', descripcion: '', color: DEFAULT_COLORS.primary, orden: 0 });

  // Modal preview
  const [modalPreview, setModalPreview] = useState(false);
  const [materialPreview, setMaterialPreview] = useState(null);

  const cargarCategorias = useCallback(async () => {
    try {
      const { data } = await apiClient.get('/biblioteca/categorias');
      setCategorias(data);
    } catch (err) {
      toast.error('Error al cargar categorias');
    }
  }, []);

  const cargarMateriales = useCallback(async () => {
    setCargando(true);
    try {
      const params = new URLSearchParams();
      if (filtroCategoria) params.set('id_categoria', filtroCategoria);
      if (busqueda) params.set('busqueda', busqueda);
      const query = params.toString() ? `?${params}` : '';
      const { data } = await apiClient.get(`/biblioteca${query}`);
      setMateriales(data);
    } catch (err) {
      toast.error('Error al cargar materiales');
    } finally {
      setCargando(false);
    }
  }, [filtroCategoria, busqueda]);

  useEffect(() => { cargarCategorias(); }, [cargarCategorias]);
  useEffect(() => { cargarMateriales(); }, [cargarMateriales]);

  // --- Handlers Material ---
  const abrirCrearMaterial = () => {
    setEditandoMaterial(null);
    setFormMaterial({ titulo: '', descripcion: '', id_categoria: '' });
    setTipoSubida('archivo');
    setArchivoSeleccionado(null);
    setUrlEnlace('');
    setModalMaterial(true);
  };

  const abrirEditarMaterial = (m) => {
    setEditandoMaterial(m);
    setFormMaterial({ titulo: m.titulo, descripcion: m.descripcion || '', id_categoria: m.id_categoria || '' });
    setTipoSubida(esEnlace(m) ? 'enlace' : 'archivo');
    setArchivoSeleccionado(null);
    setUrlEnlace('');
    setModalMaterial(true);
  };

  const guardarMaterial = async () => {
    if (!formMaterial.titulo.trim()) return toast.error('El titulo es obligatorio');
    if (!editandoMaterial) {
      if (tipoSubida === 'archivo' && !archivoSeleccionado) return toast.error('Selecciona un archivo');
      if (tipoSubida === 'enlace' && !urlEnlace.trim()) return toast.error('Ingresa una URL valida');
    }

    setSubiendo(true);
    try {
      if (editandoMaterial) {
        await apiClient.put(`/biblioteca/${editandoMaterial.id}`, formMaterial);
        toast.success('Material actualizado');
      } else if (tipoSubida === 'enlace') {
        await apiClient.post('/biblioteca', {
          titulo: formMaterial.titulo.trim(),
          descripcion: formMaterial.descripcion,
          id_categoria: formMaterial.id_categoria || null,
          url: urlEnlace.trim(),
        });
        toast.success('Enlace agregado correctamente');
      } else {
        const fd = new FormData();
        fd.append('archivo', archivoSeleccionado);
        fd.append('titulo', formMaterial.titulo.trim());
        fd.append('descripcion', formMaterial.descripcion);
        fd.append('id_categoria', formMaterial.id_categoria);
        await apiClient.post('/biblioteca', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Material subido correctamente');
      }
      setModalMaterial(false);
      cargarMateriales();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al guardar');
    } finally {
      setSubiendo(false);
    }
  };

  const eliminarMaterial = async (id) => {
    if (!confirm('¿Eliminar este material?')) return;
    try {
      await apiClient.delete(`/biblioteca/${id}`);
      toast.success('Material eliminado');
      cargarMateriales();
    } catch (err) {
      toast.error('Error al eliminar');
    }
  };

  const abrirPreview = (m) => { setMaterialPreview(m); setModalPreview(true); };

  // --- Handlers Categoria ---
  const abrirCrearCategoria = () => {
    setEditandoCategoria(null);
    setFormCategoria({ nombre: '', descripcion: '', color: DEFAULT_COLORS.primary, orden: 0 });
    setModalCategoria(true);
  };

  const abrirEditarCategoria = (c) => {
    setEditandoCategoria(c);
    setFormCategoria({ nombre: c.nombre, descripcion: c.descripcion || '', color: c.color || DEFAULT_COLORS.primary, orden: c.orden || 0 });
    setModalCategoria(true);
  };

  const guardarCategoria = async () => {
    if (!formCategoria.nombre.trim()) return toast.error('El nombre es obligatorio');
    try {
      if (editandoCategoria) {
        await apiClient.put(`/biblioteca/categorias/${editandoCategoria.id}`, formCategoria);
        toast.success('Categoria actualizada');
      } else {
        await apiClient.post('/biblioteca/categorias', formCategoria);
        toast.success('Categoria creada');
      }
      setModalCategoria(false);
      cargarCategorias();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al guardar');
    }
  };

  const eliminarCategoria = async (id) => {
    if (!confirm('¿Inactivar esta categoria?')) return;
    try {
      await apiClient.delete(`/biblioteca/categorias/${id}`);
      toast.success('Categoria inactivada');
      cargarCategorias();
    } catch (err) {
      toast.error('Error al inactivar');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-800">Biblioteca Digital</h1>
          <p className="text-sm text-slate-500 mt-1">Gestiona el material educativo disponible para docentes y alumnos</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200">
        <button
          onClick={() => setTab('materiales')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === 'materiales' ? 'border-primary-500 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          Materiales ({materiales.length})
        </button>
        <button
          onClick={() => setTab('categorias')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === 'categorias' ? 'border-primary-500 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          Categorias ({categorias.length})
        </button>
      </div>

      {/* Tab Materiales */}
      {tab === 'materiales' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar materiales..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400"
              />
            </div>
            <select
              value={filtroCategoria}
              onChange={(e) => setFiltroCategoria(e.target.value)}
              className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400"
            >
              <option value="">Todas las categorias</option>
              {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
            <button
              onClick={abrirCrearMaterial}
              className="flex items-center gap-2 px-4 py-2.5 bg-primary-500 text-white rounded-xl text-sm font-medium hover:bg-primary-600 transition-colors shadow-sm"
            >
              <HiUpload className="w-4 h-4" /> Subir Material
            </button>
          </div>

          {cargando ? (
            <div className="text-center py-12 text-slate-400">Cargando materiales...</div>
          ) : materiales.length === 0 ? (
            <div className="text-center py-12">
              <HiFolder className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">No hay materiales disponibles</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {materiales.map((m) => {
                const Icono = getIconoArchivo(m.extension);
                const tipo = getTipoInfo(m.extension);
                const enlace = esEnlace(m);
                return (
                  <div key={m.id} className="bg-white border border-slate-200 rounded-2xl p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start gap-3">
                      <div className={`p-2.5 rounded-xl ${tipo.bg} flex-shrink-0`}>
                        <Icono className={`w-6 h-6 ${tipo.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-slate-800 text-sm truncate">{m.titulo}</h3>
                        <p className="text-xs text-slate-400 mt-0.5 truncate">
                          {enlace ? <span className="inline-flex items-center gap-1"><HiLink className="w-3 h-3" />{m.ruta_archivo}</span> : m.nombre_archivo_original}
                        </p>
                        {m.descripcion && <p className="text-xs text-slate-500 mt-1 line-clamp-2">{m.descripcion}</p>}
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <span className={`inline-flex px-2 py-0.5 text-[10px] font-bold uppercase rounded-md ${tipo.bg} ${tipo.color}`}>
                            {tipo.label}
                          </span>
                          {!enlace && <span className="text-[10px] text-slate-400">{formatSize(m.tamano_bytes)}</span>}
                          {m.tbl_biblioteca_categorias && (
                            <span
                              className="inline-flex px-2 py-0.5 text-[10px] font-medium rounded-md border"
                              style={{ color: m.tbl_biblioteca_categorias.color, borderColor: m.tbl_biblioteca_categorias.color + '40', backgroundColor: m.tbl_biblioteca_categorias.color + '10' }}
                            >
                              {m.tbl_biblioteca_categorias.nombre}
                            </span>
                          )}
                          {m.total_descargas > 0 && (
                            <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
                              <HiDownload className="w-3 h-3" /> {m.total_descargas}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1.5 mt-3 pt-3 border-t border-slate-100">
                      {esPrevisualizableEnLinea(m) && (
                        <button onClick={() => abrirPreview(m)} className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                          <HiEye className="w-3.5 h-3.5" /> Ver
                        </button>
                      )}
                      {enlace ? (
                        <a
                          href={m.ruta_archivo}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                        >
                          <HiExternalLink className="w-3.5 h-3.5" /> Abrir
                        </a>
                      ) : (
                        <a
                          href={getDownloadUrl(m.ruta_archivo, m.nombre_archivo_original)}
                          download={m.nombre_archivo_original}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                        >
                          <HiDownload className="w-3.5 h-3.5" /> Descargar
                        </a>
                      )}
                      <button onClick={() => abrirEditarMaterial(m)} className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-amber-600 hover:bg-amber-50 rounded-lg transition-colors">
                        <HiPencil className="w-3.5 h-3.5" /> Editar
                      </button>
                      <button onClick={() => eliminarMaterial(m.id)} className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                        <HiTrash className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab Categorias */}
      {tab === 'categorias' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={abrirCrearCategoria} className="flex items-center gap-2 px-4 py-2.5 bg-primary-500 text-white rounded-xl text-sm font-medium hover:bg-primary-600 transition-colors shadow-sm">
              <HiPlus className="w-4 h-4" /> Nueva Categoria
            </button>
          </div>

          {categorias.length === 0 ? (
            <div className="text-center py-12 text-slate-400">No hay categorias creadas</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {categorias.map((c) => (
                <div key={c.id} className="bg-white border border-slate-200 rounded-2xl p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-primary-50">
                      <HiFolder className="w-5 h-5 text-primary-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-800 text-sm">{c.nombre}</h3>
                      {c.descripcion && <p className="text-xs text-slate-500 truncate">{c.descripcion}</p>}
                    </div>
                  </div>
                  <div className="flex gap-1.5 mt-3 pt-3 border-t border-slate-100 justify-end">
                    <button onClick={() => abrirEditarCategoria(c)} className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors">
                      <HiPencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => eliminarCategoria(c.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                      <HiTrash className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal Crear/Editar Material */}
      <Modal abierto={modalMaterial} cerrar={() => setModalMaterial(false)} titulo={editandoMaterial ? 'Editar Material' : 'Subir Material'} ancho="max-w-lg">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Titulo *</label>
            <input
              type="text"
              value={formMaterial.titulo}
              onChange={(e) => setFormMaterial({ ...formMaterial, titulo: e.target.value })}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400"
              placeholder="Titulo del material"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Descripcion</label>
            <textarea
              value={formMaterial.descripcion}
              onChange={(e) => setFormMaterial({ ...formMaterial, descripcion: e.target.value })}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400"
              rows={3}
              placeholder="Descripcion del material (opcional)"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Categoria</label>
            <select
              value={formMaterial.id_categoria}
              onChange={(e) => setFormMaterial({ ...formMaterial, id_categoria: e.target.value })}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400"
            >
              <option value="">Sin categoria</option>
              {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
          </div>
          {!editandoMaterial && (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Tipo de material</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTipoSubida('archivo')}
                    className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium border transition-colors ${tipoSubida === 'archivo' ? 'bg-primary-50 border-primary-300 text-primary-700' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                  >
                    <HiUpload className="w-4 h-4" /> Archivo
                  </button>
                  <button
                    type="button"
                    onClick={() => setTipoSubida('enlace')}
                    className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium border transition-colors ${tipoSubida === 'enlace' ? 'bg-pink-50 border-pink-300 text-pink-700' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                  >
                    <HiVideoCamera className="w-4 h-4" /> Enlace de video
                  </button>
                </div>
              </div>

              {tipoSubida === 'archivo' ? (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Archivo *</label>
                  <input
                    type="file"
                    accept={ACCEPT_ARCHIVOS}
                    onChange={(e) => setArchivoSeleccionado(e.target.files[0] || null)}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary-50 file:text-primary-600 hover:file:bg-primary-100"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Formatos soportados: PDF, Word, Excel, PowerPoint (PPT/PPTX), imágenes y CSV. Máx. 100 MB.
                  </p>
                  {archivoSeleccionado && (
                    <p className="text-xs text-slate-500 mt-1">
                      {archivoSeleccionado.name} — {formatSize(archivoSeleccionado.size)}
                    </p>
                  )}
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">URL del video *</label>
                  <input
                    type="url"
                    value={urlEnlace}
                    onChange={(e) => setUrlEnlace(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Pega el enlace de YouTube, Vimeo o cualquier URL pública. Los videos de YouTube se reproducirán dentro de la app.
                  </p>
                </div>
              )}
            </>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setModalMaterial(false)} className="px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">Cancelar</button>
            <button onClick={guardarMaterial} disabled={subiendo} className="px-4 py-2.5 text-sm font-medium bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors disabled:opacity-50">
              {subiendo ? 'Subiendo...' : editandoMaterial ? 'Actualizar' : 'Subir'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal Crear/Editar Categoria */}
      <Modal abierto={modalCategoria} cerrar={() => setModalCategoria(false)} titulo={editandoCategoria ? 'Editar Categoria' : 'Nueva Categoria'} ancho="max-w-md">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nombre *</label>
            <input
              type="text"
              value={formCategoria.nombre}
              onChange={(e) => setFormCategoria({ ...formCategoria, nombre: e.target.value })}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400"
              placeholder="Nombre de la categoria"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Descripcion</label>
            <textarea
              value={formCategoria.descripcion}
              onChange={(e) => setFormCategoria({ ...formCategoria, descripcion: e.target.value })}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400"
              rows={2}
              placeholder="Descripcion (opcional)"
            />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-700 mb-1">Color</label>
              <input
                type="color"
                value={formCategoria.color}
                onChange={(e) => setFormCategoria({ ...formCategoria, color: e.target.value })}
                className="w-full h-10 rounded-xl border border-slate-200 cursor-pointer"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-700 mb-1">Orden</label>
              <input
                type="number"
                value={formCategoria.orden}
                onChange={(e) => setFormCategoria({ ...formCategoria, orden: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400"
                min={0}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setModalCategoria(false)} className="px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">Cancelar</button>
            <button onClick={guardarCategoria} className="px-4 py-2.5 text-sm font-medium bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors">
              {editandoCategoria ? 'Actualizar' : 'Crear'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal Preview */}
      <Modal abierto={modalPreview} cerrar={() => setModalPreview(false)} titulo={materialPreview?.titulo || 'Vista previa'} ancho="max-w-4xl">
        {materialPreview && (() => {
          const enlace = esEnlace(materialPreview);
          const ytEmbed = enlace && esUrlYoutube(materialPreview.ruta_archivo) ? embedYoutube(materialPreview.ruta_archivo) : null;
          return (
            <div className="space-y-4">
              {enlace ? (
                ytEmbed ? (
                  <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
                    <iframe
                      src={ytEmbed}
                      className="absolute inset-0 w-full h-full rounded-xl border border-slate-200"
                      title={materialPreview.titulo}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                ) : (
                  <div className="p-6 bg-slate-50 rounded-xl border border-slate-200 text-center space-y-3">
                    <HiVideoCamera className="w-10 h-10 text-pink-500 mx-auto" />
                    <p className="text-sm text-slate-600 break-all">{materialPreview.ruta_archivo}</p>
                    <a
                      href={materialPreview.ruta_archivo}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors"
                    >
                      <HiExternalLink className="w-4 h-4" /> Abrir enlace
                    </a>
                  </div>
                )
              ) : materialPreview.extension?.toLowerCase() === 'pdf' ? (
                <iframe
                  src={getUploadUrl(materialPreview.ruta_archivo)}
                  className="w-full rounded-xl border border-slate-200"
                  style={{ height: '70vh' }}
                  title={materialPreview.titulo}
                />
              ) : ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(materialPreview.extension?.toLowerCase()) ? (
                <div className="flex justify-center">
                  <img
                    src={getUploadUrl(materialPreview.ruta_archivo)}
                    alt={materialPreview.titulo}
                    className="max-w-full max-h-[70vh] object-contain rounded-xl"
                  />
                </div>
              ) : null}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <div className="text-xs text-slate-500 truncate">
                  {enlace ? materialPreview.ruta_archivo : `${materialPreview.nombre_archivo_original} — ${formatSize(materialPreview.tamano_bytes)}`}
                </div>
                {enlace ? (
                  <a
                    href={materialPreview.ruta_archivo}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors flex-shrink-0"
                  >
                    <HiExternalLink className="w-4 h-4" /> Abrir
                  </a>
                ) : (
                  <a
                    href={getDownloadUrl(materialPreview.ruta_archivo, materialPreview.nombre_archivo_original)}
                    download={materialPreview.nombre_archivo_original}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors flex-shrink-0"
                  >
                    <HiDownload className="w-4 h-4" /> Descargar
                  </a>
                )}
              </div>
            </div>
          );
        })()}
      </Modal>
    </div>
  );
}
