import { useState, useEffect } from 'react';
import apiClient from '../../services/apiClient';
import { getUploadUrl } from '../../utils/storage';
import { miniaturYoutube, embedYoutube } from '../../utils/youtube';
import Modal from '../../components/common/Modal';

export default function PodcastDocentePage() {
  const [logoUrl, setLogoUrl] = useState(null);
  const [entradas, setEntradas] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [videoModal, setVideoModal] = useState(null);

  const cargarConfig = async () => {
    try {
      const { data } = await apiClient.get('/podcasts/config');
      setLogoUrl(data.logo_url);
    } catch { /* sin config */ }
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

  const handleClickEntrada = (entrada) => {
    if (entrada.tipo === 'youtube' && embedYoutube(entrada.url)) {
      setVideoModal(entrada);
    } else {
      window.open(entrada.url, '_blank', 'noopener');
    }
  };

  return (
    <div className="animate-fade-up">
      {/* Header con logo */}
      <div className="flex items-center gap-4 mb-6 p-5 bg-gradient-to-r from-accent-50 to-purple-50 border border-accent-100 rounded-2xl">
        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-accent-500 to-purple-600 flex items-center justify-center overflow-hidden shrink-0 shadow-lg shadow-accent-200">
          {logoUrl ? (
            <img src={getUploadUrl(logoUrl)} alt="Podcast" className="w-full h-full object-cover" />
          ) : (
            <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
          )}
        </div>
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-800">Podcast</h1>
          <p className="text-sm text-slate-500">Recursos multimedia para docentes</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <button onClick={() => setFiltroCategoria('')} className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${!filtroCategoria ? 'bg-accent-600 text-white' : 'bg-slate-100 text-slate-500 border border-slate-200 hover:border-slate-300'}`}>
          Todos
        </button>
        {categorias.map(c => (
          <button key={c.id} onClick={() => setFiltroCategoria(String(c.id))} className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${filtroCategoria === String(c.id) ? 'bg-accent-600 text-white' : 'bg-slate-100 text-slate-500 border border-slate-200 hover:border-slate-300'}`}>
            {c.nombre}
          </button>
        ))}
        <div className="ml-auto">
          <input type="text" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar..." className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm bg-slate-50 text-slate-700 w-52" />
        </div>
      </div>

      {/* Grid de tarjetas */}
      {cargando ? (
        <p className="text-center text-slate-400 py-12">Cargando...</p>
      ) : entradas.length === 0 ? (
        <p className="text-center text-slate-400 py-12">No hay contenido disponible</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {entradas.map(e => (
            <div key={e.id} onClick={() => handleClickEntrada(e)} className="group border border-slate-200 rounded-xl overflow-hidden bg-white hover:shadow-lg hover:border-accent-200 transition-all cursor-pointer">
              {/* Thumbnail */}
              <div className="relative w-full h-40 bg-slate-100">
                {e.tipo === 'youtube' && miniaturYoutube(e.url) ? (
                  <>
                    <img src={miniaturYoutube(e.url)} alt="" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-12 h-9 bg-red-600 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
                    <svg className="w-10 h-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.172 13.828a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.102 1.101" /></svg>
                    <span className="text-xs text-slate-400 mt-1">Link externo</span>
                  </div>
                )}
              </div>

              {/* Body */}
              <div className="p-4">
                <h3 className="text-sm font-semibold text-slate-800 line-clamp-2 mb-1">{e.titulo}</h3>
                {e.descripcion && (
                  <p className="text-xs text-slate-500 line-clamp-2 mb-3">{e.descripcion}</p>
                )}
                <div className="flex items-center justify-between">
                  {e.tbl_podcast_categorias ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-accent-50 text-accent-700 border border-accent-200">{e.tbl_podcast_categorias.nombre}</span>
                  ) : <span />}
                  <span className="text-[10px] text-slate-400">{e.fecha_publicacion ? e.fecha_publicacion.substring(0, 10).split('-').reverse().join('/') : ''}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal video YouTube */}
      <Modal abierto={!!videoModal} cerrar={() => setVideoModal(null)} titulo={videoModal?.titulo || ''} ancho="max-w-4xl">
        {videoModal && embedYoutube(videoModal.url) && (
          <div className="aspect-video w-full">
            <iframe src={embedYoutube(videoModal.url)} className="w-full h-full rounded-lg" allowFullScreen allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" />
          </div>
        )}
      </Modal>
    </div>
  );
}
