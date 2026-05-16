import { useEffect, useState } from 'react';
import { HiBadgeCheck } from 'react-icons/hi';
import toast from 'react-hot-toast';
import Tabla from '../../components/common/Tabla';
import { listarConcursos, obtenerRankingAdmin } from '../../services/concursoService';
import apiClient from '../../services/apiClient';

export default function ConcursosRankingPage() {
  const [concursos, setConcursos] = useState([]);
  const [cursos, setCursos] = useState([]);
  const [idConcurso, setIdConcurso] = useState('');
  const [idCurso, setIdCurso] = useState('');
  const [ranking, setRanking] = useState([]);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    listarConcursos().then((d) => setConcursos(d)).catch(() => {});
    apiClient.get('/cursos').then(({ data }) => setCursos(data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!idConcurso) { setRanking([]); return; }
    (async () => {
      setCargando(true);
      try {
        const params = {};
        if (idCurso) params.id_curso = parseInt(idCurso);
        setRanking(await obtenerRankingAdmin(parseInt(idConcurso), params));
      } catch (err) { toast.error(err.response?.data?.error || 'Error al cargar ranking'); }
      finally { setCargando(false); }
    })();
  }, [idConcurso, idCurso]);

  const columnas = [
    {
      key: 'posicion', label: 'Pos',
      render: (r) => {
        const colores = { 1: 'bg-amber-400', 2: 'bg-slate-300', 3: 'bg-amber-600' };
        const cls = colores[r.posicion] || 'bg-slate-100';
        return <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-display font-bold text-white ${r.posicion <= 3 ? cls : 'text-slate-600 bg-slate-100'}`}>{r.posicion}</span>;
      },
    },
    { key: 'nombre', label: 'Participante', render: (r) => r.nombre_alumno || r.nombre_usuario || '-' },
    {
      key: 'puntaje', label: 'Puntaje',
      render: (r) => <span className="font-bold text-primary-600 text-lg">{r.puntaje_total}</span>,
    },
    { key: 'aciertos', label: 'Aciertos', render: (r) => r.respuestas_correctas },
    { key: 'errores', label: 'Errores', render: (r) => r.respuestas_incorrectas },
    {
      key: 'tiempo', label: 'Tiempo',
      render: (r) => `${Math.floor((r.tiempo_total_segundos || 0) / 60)}m ${(r.tiempo_total_segundos || 0) % 60}s`,
    },
    {
      key: 'fecha', label: 'Fecha',
      render: (r) => r.fecha_hora_fin ? new Date(r.fecha_hora_fin).toLocaleDateString('es-PE') : '-',
    },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-display font-bold text-slate-800"><HiBadgeCheck className="inline w-7 h-7 mr-1 text-amber-500" /> Ranking de Concursos</h1>
        <p className="text-sm text-slate-500">Mejores puntajes por concurso y por curso.</p>
      </div>

      <div className="glass-card-static p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
        <select value={idConcurso} onChange={(e) => setIdConcurso(e.target.value)} className="px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white">
          <option value="">Selecciona un concurso</option>
          {concursos.map((c) => <option key={c.id} value={c.id}>{c.titulo}</option>)}
        </select>
        <select value={idCurso} onChange={(e) => setIdCurso(e.target.value)} className="px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white">
          <option value="">Todos los cursos</option>
          {cursos.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
        </select>
      </div>

      {!idConcurso
        ? <p className="py-20 text-center text-slate-400">Elige un concurso para ver su ranking.</p>
        : cargando
          ? <div className="py-20 text-center text-slate-400">Cargando...</div>
          : <Tabla columnas={columnas} datos={ranking} vacio="No hay intentos finalizados aun." />}
    </div>
  );
}
