import { useState, useEffect, useCallback } from 'react';
import apiClient from '../../services/apiClient';
import { getUploadUrl, getDownloadUrl } from '../../utils/storage';
import { embedYoutube, esUrlYoutube } from '../../utils/youtube';
import Modal from '../../components/common/Modal';
import toast from 'react-hot-toast';
import {
  HiDownload, HiEye, HiSearch, HiDocumentText, HiPhotograph,
  HiTable, HiFolder, HiVideoCamera, HiExternalLink, HiLink
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
  return `${(num / (1024 * 1024)).toFixed(1)} MB`;
};

const esPrevisualizableEnLinea = (m) => {
  if (esEnlace(m)) return true;
  const ext = m?.extension?.toLowerCase();
  return ext === 'pdf' || ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext);
};

export default function BibliotecaAlumno() {
  const [materiales, setMateriales] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [modalPreview, setModalPreview] = useState(false);
  const [materialPreview, setMaterialPreview] = useState(null);

  const cargarCategorias = useCallback(async () => {
    try {
      const { data } = await apiClient.get('/biblioteca/categorias');
      setCategorias(data);
    } catch { /* silencioso */ }
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
    } catch {
      toast.error('Error al cargar materiales');
    } finally {
      setCargando(false);
    }
  }, [filtroCategoria, busqueda]);

  useEffect(() => { cargarCategorias(); }, [cargarCategorias]);
  useEffect(() => { cargarMateriales(); }, [cargarMateriales]);

  const abrirPreview = (m) => { setMaterialPreview(m); setModalPreview(true); };

  return (
    <div className="space-y-6" style={{ fontSize: '115%' }}>
      <div>
        <p className="text-xs font-display font-bold uppercase tracking-widest mb-1" style={{ color: '#0060FF' }}>Recursos</p>
        <h1 className="text-2xl font-display font-bold text-black">Biblioteca Digital</h1>
        <p className="text-sm text-black/60 mt-1 font-medium">Consulta y descarga material educativo</p>
      </div>

      {/* Filtros */}
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
      </div>

      {/* Grid */}
      {cargando ? (
        <div className="text-center py-12 text-slate-400">Cargando materiales...</div>
      ) : materiales.length === 0 ? (
        <div className="text-center py-12">
          <HiFolder className="w-12 h-12 mx-auto mb-3" style={{ color: '#87CEEB' }} />
          <p className="text-black font-bold">No hay materiales disponibles</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {materiales.map((m) => {
            const Icono = getIconoArchivo(m.extension);
            const tipo = getTipoInfo(m.extension);
            const enlace = esEnlace(m);
            return (
              <div key={m.id} className="bg-white rounded-2xl p-4 hover:shadow-md transition-shadow" style={{ border: '2px solid #87CEEB' }}>
                <div className="flex items-start gap-3">
                  <div className={`p-2.5 rounded-xl ${tipo.bg} flex-shrink-0`}>
                    <Icono className={`w-6 h-6 ${tipo.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-black font-bold text-sm truncate">{m.titulo}</h3>
                    {enlace && <p className="text-xs text-slate-500 mt-0.5 truncate flex items-center gap-1"><HiLink className="w-3 h-3" />{m.ruta_archivo}</p>}
                    {m.descripcion && <p className="text-xs text-slate-500 mt-1 line-clamp-2">{m.descripcion}</p>}
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <span className={`inline-flex px-2 py-0.5 text-[10px] font-bold uppercase rounded-md ${tipo.bg} ${tipo.color}`}>{tipo.label}</span>
                      {!enlace && <span className="text-[10px] text-slate-400">{formatSize(m.tamano_bytes)}</span>}
                      {m.tbl_biblioteca_categorias && (
                        <span className="inline-flex px-2 py-0.5 text-[10px] font-medium rounded-md border" style={{ color: m.tbl_biblioteca_categorias.color, borderColor: m.tbl_biblioteca_categorias.color + '40', backgroundColor: m.tbl_biblioteca_categorias.color + '10' }}>
                          {m.tbl_biblioteca_categorias.nombre}
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
                    <a href={m.ruta_archivo} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-primary-600 hover:bg-primary-50 rounded-lg transition-colors">
                      <HiExternalLink className="w-3.5 h-3.5" /> Abrir
                    </a>
                  ) : (
                    <a href={getDownloadUrl(m.ruta_archivo, m.nombre_archivo_original)} download={m.nombre_archivo_original} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-primary-600 hover:bg-primary-50 rounded-lg transition-colors">
                      <HiDownload className="w-3.5 h-3.5" /> Descargar
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

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
                    <a href={materialPreview.ruta_archivo} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors">
                      <HiExternalLink className="w-4 h-4" /> Abrir enlace
                    </a>
                  </div>
                )
              ) : materialPreview.extension?.toLowerCase() === 'pdf' ? (
                <iframe src={getUploadUrl(materialPreview.ruta_archivo)} className="w-full rounded-xl border border-slate-200" style={{ height: '70vh' }} title={materialPreview.titulo} />
              ) : ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(materialPreview.extension?.toLowerCase()) ? (
                <div className="flex justify-center">
                  <img src={getUploadUrl(materialPreview.ruta_archivo)} alt={materialPreview.titulo} className="max-w-full max-h-[70vh] object-contain rounded-xl" />
                </div>
              ) : null}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <div className="text-xs text-slate-500 truncate">
                  {enlace ? materialPreview.ruta_archivo : `${materialPreview.nombre_archivo_original} — ${formatSize(materialPreview.tamano_bytes)}`}
                </div>
                {enlace ? (
                  <a href={materialPreview.ruta_archivo} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors flex-shrink-0">
                    <HiExternalLink className="w-4 h-4" /> Abrir
                  </a>
                ) : (
                  <a href={getDownloadUrl(materialPreview.ruta_archivo, materialPreview.nombre_archivo_original)} download={materialPreview.nombre_archivo_original} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors flex-shrink-0">
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
