import { useState, useEffect } from 'react';
import apiClient from '../../services/apiClient';
import InputCampo from '../../components/common/InputCampo';
import AvatarAlumno from '../../components/alumnos/AvatarAlumno';
import { formatearFechaHora } from '../../utils/formatters';
import { MODALIDADES_TRIVIA } from '../../utils/constants';
import { HiChevronDown, HiChevronUp, HiStar, HiX, HiCheckCircle, HiXCircle, HiClock, HiUserGroup, HiPuzzle } from 'react-icons/hi';

function identidadDeParticipante(p) {
  if (p?.tbl_alumnos?.tbl_alumno_identidad_visual) {
    const id = p.tbl_alumnos.tbl_alumno_identidad_visual;
    return { avatar: id.avatar, personaje: id.personaje, marco: id.marco, color_personal: id.color_personal };
  }
  return {
    avatar: p?.avatar_publico || null,
    personaje: p?.personaje_publico || null,
    marco: p?.marco_publico || null,
    color_publico: p?.color_publico || null,
  };
}

export default function HistorialTriviaPage() {
  const [cursos, setCursos] = useState([]);
  const [cursoSel, setCursoSel] = useState('');
  const [historial, setHistorial] = useState([]);
  const [expandido, setExpandido] = useState(null);
  const [modalDetalle, setModalDetalle] = useState(null);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);

  useEffect(() => {
    apiClient.get('/cursos').then(({ data }) => setCursos(data)).catch(() => {});
  }, []);

  useEffect(() => {
    const params = cursoSel ? `?id_curso=${cursoSel}` : '';
    apiClient.get(`/trivia/historial${params}`).then(({ data }) => setHistorial(data)).catch(() => setHistorial([]));
  }, [cursoSel]);

  const toggleExpandir = (id) => {
    setExpandido(prev => prev === id ? null : id);
  };

  const estadoColor = {
    finalizada: 'bg-emerald-200 text-emerald-800 border border-emerald-300 font-bold',
    en_progreso: 'bg-amber-200 text-amber-800 border border-amber-300 font-bold',
    cancelada: 'bg-rose-200 text-rose-800 border border-rose-300 font-bold',
    preparada: 'bg-sky-200 text-sky-800 border border-sky-300 font-bold',
  };

  const obtenerGanadores = (participantes) => {
    if (!participantes) return [];
    return participantes.filter(p => p.es_ganador);
  };

  const participantesOrdenados = (participantes) => {
    if (!participantes) return [];
    return [...participantes].sort((a, b) => parseFloat(b.puntaje_final || 0) - parseFloat(a.puntaje_final || 0));
  };

  const verDetalleParticipante = async (idPartida, participante) => {
    setCargandoDetalle(true);
    try {
      const { data } = await apiClient.get(`/trivia/partidas/${idPartida}/participante/${participante.id}/respuestas`);
      setModalDetalle({ ...data, idPartida });
    } catch {
      setModalDetalle(null);
    } finally {
      setCargandoDetalle(false);
    }
  };

  return (
    <div className="animate-fade-up" style={{ fontSize: '115%' }}>
      <div className="mb-6">
        <p className="text-xs font-display font-bold uppercase tracking-widest mb-1" style={{ color: '#0060FF' }}>Trivia</p>
        <h1 className="text-3xl font-display font-bold text-black">Historial de Trivia</h1>
      </div>

      <div className="w-72 mb-6">
        <InputCampo label="Filtrar por Curso" name="curso" type="select" value={cursoSel} onChange={(e) => setCursoSel(e.target.value)} options={[{ value: '', label: 'Todos' }, ...cursos.filter(c => c.estado === 1).map(c => ({ value: c.id.toString(), label: `${c.nombre} - ${c.grado || ''} ${c.seccion || ''}` }))]} />
      </div>

      {historial.length === 0 ? (
        <div className="rounded-2xl bg-white p-12 text-center" style={{ border: '2px solid #87CEEB' }}>
          <HiClock className="w-16 h-16 mx-auto mb-4" style={{ color: '#87CEEB' }} />
          <p className="text-black font-bold text-lg">No hay partidas registradas</p>
        </div>
      ) : (
        <div className="space-y-3">
          {historial.map(p => {
            const ganadores = obtenerGanadores(p.tbl_trivia_participantes);
            const isExpanded = expandido === p.id;

            return (
              <div key={p.id} className="rounded-2xl bg-white overflow-hidden" style={{ border: '2px solid #87CEEB' }}>
                <button
                  onClick={() => toggleExpandir(p.id)}
                  className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors text-left"
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <span className="text-xs font-bold w-8" style={{ color: '#0060FF' }}>#{p.id}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-base text-black truncate">
                        {p.tbl_trivia_temas?.nombre || 'Sin tema'}
                        <span className="ml-2 text-black/50 font-bold capitalize">({p.modalidad})</span>
                      </p>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        <span className={`px-2 py-0.5 rounded-lg text-xs font-medium ${estadoColor[p.estado_partida] || estadoColor[p.estado] || 'bg-slate-50'}`}>
                          {p.estado_partida || p.estado}
                        </span>
                        {p.codigo_acceso && (
                          <span className="px-2 py-0.5 rounded-lg text-xs font-semibold bg-accent-50 text-accent-600 border border-accent-200 font-mono tracking-wider">
                            {p.codigo_acceso}
                          </span>
                        )}
                        <span className="text-xs font-bold text-black/60">{p.tbl_trivia_participantes?.length || 0} participantes</span>
                        <span className="text-xs font-bold text-black/60">{formatearFechaHora(p.fecha_hora_registro)}</span>
                      </div>
                    </div>
                    {ganadores.length > 0 && (
                      <div className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-white px-3 py-1.5 rounded-lg" style={{ background: '#0060FF' }}>
                        <HiStar className="w-4 h-4" />
                        <span className="truncate max-w-[150px]">
                          {ganadores.map(g => g.etiqueta_participante || `${g.tbl_alumnos?.apellidos}`).join(', ')}
                        </span>
                      </div>
                    )}
                  </div>
                  {isExpanded ? <HiChevronUp className="w-5 h-5 text-slate-400" /> : <HiChevronDown className="w-5 h-5 text-slate-400" />}
                </button>

                {isExpanded && (
                  <div className="border-t px-5 py-4" style={{ borderColor: '#87CEEB', background: '#F0F9FF' }}>
                    <h4 className="text-xs font-display font-bold text-black uppercase tracking-wider mb-3">Ranking de Participantes</h4>
                    {p.tbl_trivia_participantes && p.tbl_trivia_participantes.length > 0 ? (
                      <div className="space-y-2">
                        {participantesOrdenados(p.tbl_trivia_participantes).map((part, idx) => (
                          <button
                            key={part.id}
                            onClick={() => verDetalleParticipante(p.id, part)}
                            className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors cursor-pointer text-left ${part.es_ganador ? 'bg-sky-100 border-2 border-sky-300 hover:bg-sky-200' : 'bg-white border border-slate-200 hover:bg-slate-50'}`}
                          >
                            <span className="text-sm font-bold w-7 text-center text-slate-400">
                              {idx === 0 ? '\u{1F947}' : idx === 1 ? '\u{1F948}' : idx === 2 ? '\u{1F949}' : `${idx + 1}`}
                            </span>
                            <AvatarAlumno identidad={identidadDeParticipante(part)} size="sm" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-black truncate">
                                {part.etiqueta_participante || `${part.tbl_alumnos?.apellidos || ''}, ${part.tbl_alumnos?.nombres || ''}`}
                                {part.es_ganador && <span className="ml-2 text-xs text-white px-2 py-0.5 rounded-full font-bold" style={{ background: '#0060FF' }}>Ganador</span>}
                              </p>
                              {part.numero_equipo && (
                                <span className="text-xs text-slate-400">{p.modalidad === MODALIDADES_TRIVIA.PAREJAS ? 'Pareja' : 'Grupo'} {part.numero_equipo}</span>
                              )}
                            </div>
                            <span className="text-sm font-extrabold" style={{ color: '#0060FF' }}>{parseFloat(part.puntaje_final || 0).toFixed(1)} pts</span>
                            <HiChevronDown className="w-4 h-4 text-slate-400" />
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-400">Sin participantes registrados</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal detalle de respuestas */}
      {modalDetalle && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setModalDetalle(null)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4" style={{ background: 'linear-gradient(135deg, #0060FF 0%, #87CEEB 100%)', borderBottom: '2px solid #87CEEB' }}>
              <div className="flex items-center gap-3">
                {modalDetalle.participante && (
                  <AvatarAlumno identidad={identidadDeParticipante(modalDetalle.participante)} size="md" />
                )}
                <div>
                  <h3 className="text-lg font-display font-bold text-white">
                    {modalDetalle.participante?.etiqueta_participante || `${modalDetalle.participante?.tbl_alumnos?.apellidos || ''}, ${modalDetalle.participante?.tbl_alumnos?.nombres || ''}`}
                  </h3>
                  <p className="text-sm text-white/80">
                    Puntaje: <span className="font-bold text-white">{parseFloat(modalDetalle.participante?.puntaje_final || 0).toFixed(1)} pts</span>
                  </p>
                </div>
              </div>
              <button onClick={() => setModalDetalle(null)} className="p-1.5 rounded-lg hover:bg-white/20 transition-colors">
                <HiX className="w-5 h-5 text-white" />
              </button>
            </div>
            {/* Body */}
            <div className="overflow-y-auto flex-1 px-6 py-3 space-y-2">
              {modalDetalle.preguntas?.map((pp, idx) => {
                const pregunta = pp.tbl_trivia_preguntas;
                const respuesta = pp.tbl_trivia_respuestas?.[0];
                const opciones = pregunta?.tbl_trivia_opciones || [];

                return (
                  <div key={pp.id} className={`rounded-lg p-3 border ${respuesta?.es_correcta ? 'bg-emerald-100 border-emerald-300' : 'bg-rose-100 border-rose-300'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      {respuesta?.es_correcta ? (
                        <HiCheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      ) : (
                        <HiXCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                      )}
                      <span className="text-xs font-bold text-black">{idx + 1}.</span>
                      <p className="text-xs font-bold text-black line-clamp-1">{pregunta?.texto_pregunta}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5 ml-6">
                      {opciones.map(op => {
                        const fueSeleccionada = respuesta?.id_opcion_seleccionada === op.id;
                        const esCorrecta = op.es_correcta;
                        let estiloOpcion = 'bg-white/60 border-slate-200 text-slate-500';
                        if (esCorrecta) estiloOpcion = 'bg-emerald-200 border-emerald-300 text-emerald-800 font-bold';
                        if (fueSeleccionada && !esCorrecta) estiloOpcion = 'bg-rose-200 border-rose-300 text-rose-800 font-bold';

                        return (
                          <div key={op.id} className={`flex items-center gap-1.5 px-2 py-1 rounded border text-xs ${estiloOpcion}`}>
                            {esCorrecta && <HiCheckCircle className="w-3 h-3 text-emerald-600 flex-shrink-0" />}
                            {fueSeleccionada && !esCorrecta && <HiXCircle className="w-3 h-3 text-rose-600 flex-shrink-0" />}
                            <span className="truncate">{op.texto_opcion}</span>
                          </div>
                        );
                      })}
                    </div>
                    {!respuesta && <p className="text-xs text-slate-400 italic ml-6">Sin respuesta</p>}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {cargandoDetalle && (
        <div className="fixed inset-0 bg-black/20 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl px-6 py-4 shadow-lg flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-slate-600">Cargando respuestas...</span>
          </div>
        </div>
      )}
    </div>
  );
}
