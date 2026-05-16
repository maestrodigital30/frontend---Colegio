import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiPlay, HiClock, HiSparkles, HiBadgeCheck, HiLightningBolt, HiSearch } from 'react-icons/hi';
import toast from 'react-hot-toast';
import { listarDisponibles, obtenerMiHistorial } from '../../services/concursoJuegoService';
import { getUploadUrl } from '../../utils/storage';
import { obtenerTemaVisual } from '../../features/concursos/temaVisualUtils';

export default function ListaConcursosPage({ rolBaseRuta = 'alumno', modoPreview = false }) {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [historialMap, setHistorialMap] = useState({});
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [lista, mio] = await Promise.all([
          listarDisponibles(),
          obtenerMiHistorial().catch(() => []),
        ]);
        setItems(lista);
        const map = {};
        for (const h of mio) {
          if (!map[h.id_concurso]) map[h.id_concurso] = { total: 0, mejor: 0 };
          map[h.id_concurso].total += 1;
          if (h.puntaje_total > map[h.id_concurso].mejor) map[h.id_concurso].mejor = h.puntaje_total;
        }
        setHistorialMap(map);
      } catch (err) {
        toast.error(err.response?.data?.error || 'Error al cargar concursos');
      } finally {
        setCargando(false);
      }
    })();
  }, []);

  const filtrados = items.filter((c) => {
    if (!busqueda.trim()) return true;
    const t = busqueda.toLowerCase();
    return (c.titulo || '').toLowerCase().includes(t)
      || (c.descripcion || '').toLowerCase().includes(t)
      || (c.area || '').toLowerCase().includes(t)
      || (c.nivel || '').toLowerCase().includes(t);
  });

  const irAJugar = (c) => {
    const suffix = modoPreview ? '?preview=1' : '';
    navigate(`/${rolBaseRuta}/concursos/${c.id}/jugar${suffix}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-slate-800">Concursos</h1>
          <p className="text-sm text-slate-500">Elige un concurso y pon a prueba tus conocimientos.</p>
        </div>
        <div className="relative">
          <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar concurso..."
            className="pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 bg-white"
          />
        </div>
      </div>

      {cargando ? (
        <div className="py-20 text-center text-slate-400">Cargando...</div>
      ) : filtrados.length === 0 ? (
        <EstadoVacio />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {filtrados.map((c) => (
            <TarjetaConcurso
              key={c.id}
              concurso={c}
              mis={historialMap[c.id]}
              onJugar={() => irAJugar(c)}
              modoPreview={modoPreview}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function TarjetaConcurso({ concurso, mis, onJugar, modoPreview }) {
  const tema = obtenerTemaVisual(concurso.tema_visual);
  return (
    <div className="group relative rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-sm hover:shadow-xl transition-all duration-300">
      <div
        className="relative aspect-[16/9] flex items-center justify-center"
        style={{ background: `linear-gradient(135deg, ${tema.primario}, ${tema.secundario})` }}
      >
        {concurso.multimedia_url ? (
          concurso.multimedia_tipo === 'video'
            ? <video src={getUploadUrl(concurso.multimedia_url)} muted loop className="absolute inset-0 w-full h-full object-cover opacity-80" />
            : <img src={getUploadUrl(concurso.multimedia_url)} alt={concurso.titulo} className="absolute inset-0 w-full h-full object-cover opacity-80" />
        ) : (
          <span className="text-7xl text-white/30 font-display font-extrabold">?</span>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent" />
        <div className="absolute bottom-2 left-3 right-3 flex items-end justify-between gap-2">
          <h3 className="text-white font-display font-bold text-lg drop-shadow line-clamp-2" style={{ color: tema.acento }}>
            {concurso.titulo}
          </h3>
        </div>
      </div>
      <div className="p-4 space-y-3">
        {concurso.descripcion && <p className="text-sm text-slate-600 line-clamp-2">{concurso.descripcion}</p>}
        <div className="flex flex-wrap gap-1 text-[11px]">
          {concurso.tbl_cursos?.nombre && <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">{concurso.tbl_cursos.nombre}</span>}
          {concurso.area && <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">{concurso.area}</span>}
          {concurso.nivel && <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">{concurso.nivel}</span>}
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
          <span className="inline-flex items-center gap-1"><HiClock /> {concurso.tiempo_por_pregunta}s</span>
          <span className="inline-flex items-center gap-1"><HiSparkles /> {concurso.puntos_base} pts base</span>
          {concurso.bonus_habilitado && <span className="inline-flex items-center gap-1"><HiBadgeCheck /> Bonus</span>}
          {concurso.comodin_50_50_habilitado && <span className="inline-flex items-center gap-1"><HiLightningBolt /> 50:50</span>}
        </div>
        {mis && mis.total > 0 && (
          <p className="text-[11px] text-slate-500">
            Tu mejor puntaje: <span className="font-bold text-slate-700">{mis.mejor}</span> en {mis.total} intento(s)
          </p>
        )}
        <button
          onClick={onJugar}
          className="w-full py-2.5 rounded-xl font-display font-bold text-sm tracking-wide text-white shadow-sm transition-all hover:shadow-md active:scale-[0.98]"
          style={{ background: tema.acento, color: '#0f172a' }}
        >
          <HiPlay className="inline w-4 h-4 mr-1" /> {modoPreview ? 'Previsualizar' : 'Jugar'}
        </button>
      </div>
    </div>
  );
}

function EstadoVacio() {
  return (
    <div className="glass-card-static p-12 text-center">
      <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-100 flex items-center justify-center">
        <HiSparkles className="w-8 h-8 text-slate-400" />
      </div>
      <p className="text-slate-500">Aun no hay concursos publicados disponibles para ti.</p>
    </div>
  );
}
