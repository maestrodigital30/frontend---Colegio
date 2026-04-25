import { useState, useEffect } from 'react';
import { HiCreditCard } from 'react-icons/hi';
import apiClient from '../../services/apiClient';

export default function NotasAlumnoPage() {
  const [notas, setNotas] = useState([]);
  const [cursos, setCursos] = useState([]);
  const [filtroCurso, setFiltroCurso] = useState('');
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    apiClient.get('/alumno-portal/mis-cursos')
      .then(res => setCursos(res.data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    setCargando(true);
    const params = filtroCurso ? `?id_curso=${filtroCurso}` : '';
    apiClient.get(`/alumno-portal/mis-notas${params}`)
      .then(res => setNotas(res.data))
      .catch(() => {})
      .finally(() => setCargando(false));
  }, [filtroCurso]);

  // Agrupar notas por curso
  const notasPorCurso = notas.reduce((acc, nota) => {
    const cursoNombre = nota.tbl_cursos?.nombre || 'Sin curso';
    if (!acc[cursoNombre]) acc[cursoNombre] = [];
    acc[cursoNombre].push(nota);
    return acc;
  }, {});

  const COLORES_COLUMNAS = [
    { header: 'bg-sky-200 text-sky-800', cell: 'bg-sky-100' },
    { header: 'bg-violet-200 text-violet-800', cell: 'bg-violet-100' },
    { header: 'bg-teal-200 text-teal-800', cell: 'bg-teal-100' },
    { header: 'bg-indigo-200 text-indigo-800', cell: 'bg-indigo-100' },
    { header: 'bg-purple-200 text-purple-800', cell: 'bg-purple-100' },
    { header: 'bg-cyan-200 text-cyan-800', cell: 'bg-cyan-100' },
    { header: 'bg-emerald-200 text-emerald-800', cell: 'bg-emerald-100' },
    { header: 'bg-rose-200 text-rose-800', cell: 'bg-rose-100' },
  ];

  return (
    <div style={{ fontSize: '115%' }}>
      <div className="mb-8 animate-fade-up">
        <p className="text-xs font-display font-bold uppercase tracking-widest mb-1" style={{ color: '#0060FF' }}>Academico</p>
        <h1 className="text-3xl font-display font-bold text-black">Mis Notas</h1>
        <p className="text-sm text-black/60 font-medium mt-1">Revisa tus calificaciones por curso y periodo</p>
      </div>

      {/* Filtro por curso */}
      <div className="mb-6 animate-fade-up" style={{ animationDelay: '0.1s' }}>
        <select
          value={filtroCurso}
          onChange={e => setFiltroCurso(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white/80 backdrop-blur text-sm focus:ring-2 focus:ring-primary-300 focus:border-primary-300 outline-none"
        >
          <option value="">Todos los cursos</option>
          {cursos.map(c => (
            <option key={c.id} value={c.id}>{c.nombre}</option>
          ))}
        </select>
      </div>

      {cargando ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        </div>
      ) : notas.length === 0 ? (
        <div className="rounded-2xl bg-white p-12 text-center animate-fade-up" style={{ border: '2px solid #87CEEB' }}>
          <HiCreditCard className="w-16 h-16 mx-auto mb-4" style={{ color: '#87CEEB' }} />
          <p className="text-black font-bold">No tienes notas registradas aun</p>
        </div>
      ) : (
        <div className="space-y-6 stagger-children">
          {Object.entries(notasPorCurso).map(([cursoNombre, notasCurso], idx) => (
            <div key={cursoNombre} className="rounded-2xl bg-white overflow-hidden animate-fade-up" style={{ border: '2px solid #87CEEB', animationDelay: `${idx * 0.1}s` }}>
              <div className="px-6 py-4 border-b border-slate-100" style={{ background: 'linear-gradient(135deg, #0060FF 0%, #87CEEB 100%)' }}>
                <h3 className="font-display text-white font-bold">{cursoNombre}</h3>
                <p className="text-xs text-white/70">
                  {notasCurso[0]?.tbl_esquemas_calificacion?.tipo_calificacion === 'numerico' ? 'Calificacion Numerica' : 'Calificacion por Letras'}
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="px-6 py-3 text-left text-xs font-display font-bold bg-primary-200 text-primary-800 uppercase tracking-wider">Periodo</th>
                      {notasCurso[0]?.tbl_notas_detalle
                        ?.slice()
                        .sort((a, b) => (a.tbl_componentes_nota?.orden || 0) - (b.tbl_componentes_nota?.orden || 0))
                        .map((d, idx) => {
                          const color = COLORES_COLUMNAS[idx % COLORES_COLUMNAS.length];
                          return (
                            <th key={d.tbl_componentes_nota?.id} className={`px-4 py-3 text-center text-xs font-display font-bold uppercase tracking-wider ${color.header}`}>
                              {d.tbl_componentes_nota?.nombre_componente}
                              {d.tbl_componentes_nota?.peso_porcentaje && (
                                <span className="block text-[10px] font-normal opacity-70">({Number(d.tbl_componentes_nota.peso_porcentaje)}%)</span>
                              )}
                            </th>
                          );
                        })}
                      <th className="px-6 py-3 text-center text-xs font-display font-bold bg-amber-200 text-amber-800 uppercase tracking-wider">Nota Final</th>
                    </tr>
                  </thead>
                  <tbody>
                    {notasCurso
                      .sort((a, b) => (a.tbl_periodos_calificacion?.orden || 0) - (b.tbl_periodos_calificacion?.orden || 0))
                      .map(nota => (
                        <tr key={nota.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-3 text-sm text-black font-bold bg-primary-100">{nota.tbl_periodos_calificacion?.nombre}</td>
                          {nota.tbl_notas_detalle
                            ?.slice()
                            .sort((a, b) => (a.tbl_componentes_nota?.orden || 0) - (b.tbl_componentes_nota?.orden || 0))
                            .map((d, idx) => {
                              const color = COLORES_COLUMNAS[idx % COLORES_COLUMNAS.length];
                              return (
                                <td key={d.id} className={`px-4 py-3 text-center text-sm text-black font-medium ${color.cell}`}>
                                  {d.valor_numerico != null ? Number(d.valor_numerico).toFixed(1) : d.valor_letra || '-'}
                                </td>
                              );
                            })}
                          <td className="px-6 py-3 text-center bg-amber-100">
                            <span className="font-display font-extrabold text-lg" style={{ color: '#0060FF' }}>
                              {nota.nota_final_numerica != null ? Number(nota.nota_final_numerica).toFixed(1) : nota.nota_final_letra || '-'}
                            </span>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
