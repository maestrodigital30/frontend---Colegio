import { useEffect, useMemo, useState } from 'react';
import { HiClock, HiSearch, HiEye } from 'react-icons/hi';
import toast from 'react-hot-toast';
import Tabla from '../../components/common/Tabla';
import Modal from '../../components/common/Modal';
import Boton from '../../components/common/Boton';
import { obtenerHistorialAdmin, listarConcursos, obtenerDetalleIntentoAdmin } from '../../services/concursoService';
import apiClient from '../../services/apiClient';

export default function ConcursosHistorialPage() {
  const [datos, setDatos] = useState([]);
  const [concursos, setConcursos] = useState([]);
  const [cursos, setCursos] = useState([]);
  const [filtro, setFiltro] = useState({ id_concurso: '', id_curso: '', desde: '', hasta: '', puntaje_min: '' });
  const [detalle, setDetalle] = useState(null);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [cargando, setCargando] = useState(true);

  const cargar = async () => {
    setCargando(true);
    try {
      const params = {};
      if (filtro.id_concurso) params.id_concurso = parseInt(filtro.id_concurso);
      if (filtro.id_curso) params.id_curso = parseInt(filtro.id_curso);
      if (filtro.desde) params.desde = filtro.desde;
      if (filtro.hasta) params.hasta = filtro.hasta;
      if (filtro.puntaje_min !== '') params.puntaje_min = parseInt(filtro.puntaje_min);
      const data = await obtenerHistorialAdmin(params);
      setDatos(data);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al cargar historial');
    } finally { setCargando(false); }
  };

  useEffect(() => {
    listarConcursos().then((d) => setConcursos(d)).catch(() => {});
    apiClient.get('/cursos').then(({ data }) => setCursos(data)).catch(() => {});
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const abrirDetalle = async (id) => {
    try {
      const d = await obtenerDetalleIntentoAdmin(id);
      setDetalle(d);
      setModalAbierto(true);
    } catch (err) { toast.error('Error al cargar detalle'); }
  };

  const columnas = useMemo(() => [
    { key: 'titulo_concurso', label: 'Concurso', render: (r) => <span className="font-semibold text-slate-700">{r.titulo_concurso}</span> },
    { key: 'usuario', label: 'Usuario', render: (r) => r.nombre_alumno || r.usuario || '-' },
    {
      key: 'puntaje_total', label: 'Puntaje',
      render: (r) => <span className="font-bold text-primary-600">{r.puntaje_total}</span>,
    },
    {
      key: 'correctas', label: 'Aciertos',
      render: (r) => `${r.respuestas_correctas}/${r.preguntas_totales}`,
    },
    {
      key: 'tiempo', label: 'Tiempo',
      render: (r) => `${Math.floor((r.tiempo_total_segundos || 0) / 60)}m ${(r.tiempo_total_segundos || 0) % 60}s`,
    },
    {
      key: 'estado_intento', label: 'Estado',
      render: (r) => {
        const map = { en_progreso: ['En progreso', 'bg-amber-100 text-amber-700'], finalizado: ['Finalizado', 'bg-emerald-100 text-emerald-700'], abandonado: ['Abandonado', 'bg-slate-100 text-slate-600'] };
        const [t, cls] = map[r.estado_intento] || ['-', 'bg-slate-100'];
        return <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold uppercase ${cls}`}>{t}</span>;
      },
    },
    {
      key: 'fecha', label: 'Fecha',
      render: (r) => r.fecha_hora_inicio ? new Date(r.fecha_hora_inicio).toLocaleString('es-PE') : '-',
    },
  ], []);

  const acciones = (r) => (
    <button title="Ver detalle" onClick={() => abrirDetalle(r.id)} className="p-1.5 rounded-lg text-slate-500 hover:text-primary-600 hover:bg-primary-50">
      <HiEye className="w-4 h-4" />
    </button>
  );

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-display font-bold text-slate-800">Historial de Concursos</h1>
        <p className="text-sm text-slate-500">Listado completo de intentos de todos los participantes.</p>
      </div>

      <div className="glass-card-static p-4 grid grid-cols-2 md:grid-cols-5 gap-3">
        <select value={filtro.id_concurso} onChange={(e) => setFiltro((f) => ({ ...f, id_concurso: e.target.value }))} className="px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white">
          <option value="">Todos los concursos</option>
          {concursos.map((c) => <option key={c.id} value={c.id}>{c.titulo}</option>)}
        </select>
        <select value={filtro.id_curso} onChange={(e) => setFiltro((f) => ({ ...f, id_curso: e.target.value }))} className="px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white">
          <option value="">Todos los cursos</option>
          {cursos.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
        </select>
        <input type="date" value={filtro.desde} onChange={(e) => setFiltro((f) => ({ ...f, desde: e.target.value }))} className="px-3 py-2 rounded-lg border border-slate-200 text-sm" />
        <input type="date" value={filtro.hasta} onChange={(e) => setFiltro((f) => ({ ...f, hasta: e.target.value }))} className="px-3 py-2 rounded-lg border border-slate-200 text-sm" />
        <div className="flex gap-2">
          <input type="number" placeholder="Pts min" value={filtro.puntaje_min} onChange={(e) => setFiltro((f) => ({ ...f, puntaje_min: e.target.value }))} className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-sm" />
          <Boton onClick={cargar}><HiSearch className="inline w-4 h-4" /></Boton>
        </div>
      </div>

      {cargando ? <div className="py-20 text-center text-slate-400">Cargando...</div>
        : <Tabla columnas={columnas} datos={datos} acciones={acciones} vacio="No hay intentos registrados." />}

      <Modal abierto={modalAbierto} cerrar={() => setModalAbierto(false)} titulo="Detalle de intento" ancho="max-w-3xl">
        {detalle && <DetalleIntento intento={detalle} />}
      </Modal>
    </div>
  );
}

function DetalleIntento({ intento }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Puntaje total" valor={intento.puntaje_total} />
        <Stat label="Aciertos" valor={`${intento.respuestas_correctas}/${intento.preguntas_totales}`} />
        <Stat label="Bonus" valor={intento.puntaje_bonus || 0} />
        <Stat label="Tiempo" valor={`${Math.floor((intento.tiempo_total_segundos || 0) / 60)}m ${(intento.tiempo_total_segundos || 0) % 60}s`} />
      </div>
      <div className="border-t border-slate-100 pt-3">
        <p className="text-xs uppercase tracking-widest text-slate-500 mb-2">Respuestas</p>
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {intento.tbl_concurso_respuestas.map((r, idx) => (
            <div key={r.id} className={`p-3 rounded-xl border ${r.es_correcta ? 'border-emerald-200 bg-emerald-50' : 'border-rose-200 bg-rose-50'}`}>
              <p className="text-sm font-semibold text-slate-700">{idx + 1}. {r.tbl_concurso_preguntas?.texto}</p>
              <p className="text-xs text-slate-600 mt-1">
                Respuesta: <span className="font-bold">{r.tbl_concurso_opciones?.texto || r.ids_opciones_seleccionadas || 'Sin respuesta'}</span>
                {' · '} Puntos: <span className="font-bold">{r.puntos_obtenidos}</span>
                {' · '} <HiClock className="inline w-3 h-3" /> {r.tiempo_usado_segundos}s
                {r.comodin_50_50_aplicado && ' · 50:50'}
                {r.comodin_doble_puntaje_aplicado && ' · x2'}
                {r.comodin_tiempo_extra_aplicado && ' · +tiempo'}
              </p>
            </div>
          ))}
        </div>
      </div>
      {intento.tbl_concurso_bonus_tarjetas?.length > 0 && (
        <div className="border-t border-slate-100 pt-3">
          <p className="text-xs uppercase tracking-widest text-slate-500 mb-2">Ronda bonus</p>
          <div className="flex flex-wrap gap-2">
            {intento.tbl_concurso_bonus_tarjetas.map((t) => (
              <div key={t.id} className={`px-3 py-1 rounded-lg text-sm ${t.seleccionada ? 'bg-amber-100 text-amber-700 font-bold' : 'bg-slate-100 text-slate-500'}`}>
                #{t.orden} {t.seleccionada ? `+${t.puntos}` : '???'}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, valor }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <p className="text-xs uppercase tracking-widest text-slate-500">{label}</p>
      <p className="text-2xl font-display font-extrabold text-slate-800">{valor}</p>
    </div>
  );
}
