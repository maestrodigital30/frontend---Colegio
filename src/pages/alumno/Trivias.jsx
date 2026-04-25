import { useState, useEffect } from 'react';
import { HiPuzzle, HiCheckCircle, HiXCircle, HiChevronDown, HiChevronUp } from 'react-icons/hi';
import apiClient from '../../services/apiClient';

export default function TriviasAlumnoPage() {
  const [trivias, setTrivias] = useState([]);
  const [detalle, setDetalle] = useState(null);
  const [detalleId, setDetalleId] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);

  useEffect(() => {
    apiClient.get('/alumno-portal/mis-trivias')
      .then(res => setTrivias(res.data))
      .catch(() => {})
      .finally(() => setCargando(false));
  }, []);

  const verDetalle = async (idPartida) => {
    if (detalleId === idPartida) {
      setDetalleId(null);
      setDetalle(null);
      return;
    }
    setCargandoDetalle(true);
    try {
      const res = await apiClient.get(`/alumno-portal/mis-trivias/${idPartida}`);
      setDetalle(res.data);
      setDetalleId(idPartida);
    } catch {
      setDetalle(null);
    } finally {
      setCargandoDetalle(false);
    }
  };

  if (cargando) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div style={{ fontSize: '115%' }}>
      <div className="mb-8 animate-fade-up">
        <p className="text-xs font-display font-bold uppercase tracking-widest mb-1" style={{ color: '#0060FF' }}>Gamificacion</p>
        <h1 className="text-3xl font-display font-bold text-black">Mis Trivias</h1>
        <p className="text-sm text-black/60 font-medium mt-1">Historial de tus participaciones en trivias</p>
      </div>

      {trivias.length === 0 ? (
        <div className="rounded-2xl bg-white p-12 text-center animate-fade-up" style={{ border: '2px solid #87CEEB' }}>
          <HiPuzzle className="w-16 h-16 mx-auto mb-4" style={{ color: '#87CEEB' }} />
          <p className="text-black font-bold">No has participado en ninguna trivia aun</p>
        </div>
      ) : (
        <div className="space-y-4 stagger-children">
          {trivias.map((t, i) => {
            const partida = t.tbl_trivia_partidas;
            const abierto = detalleId === partida?.id;

            return (
              <div key={t.id} className="rounded-2xl bg-white overflow-hidden animate-fade-up" style={{ border: '2px solid #87CEEB', animationDelay: `${i * 0.06}s` }}>
                <div
                  className="p-5 flex items-center justify-between cursor-pointer hover:bg-slate-50/50 transition-colors"
                  onClick={() => partida && verDetalle(partida.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl ${t.es_ganador ? 'bg-amber-100 text-amber-600' : 'bg-primary-100 text-primary-600'}`}>
                      <HiPuzzle className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-display font-semibold text-black font-bold text-sm">
                        {partida?.tbl_trivia_temas?.nombre || 'Trivia'}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {partida?.tbl_cursos?.nombre || ''}
                        {partida?.modalidad ? ` - ${partida.modalidad}` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-display font-bold text-lg text-black">
                        {Number(t.puntaje_real ?? t.puntaje_final ?? 0).toFixed(1)}
                      </p>
                      <div className="flex items-center gap-1 justify-end">
                        {t.es_ganador && (
                          <span className="text-[10px] font-display font-semibold text-amber-800 bg-amber-200 font-bold px-1.5 py-0.5 rounded">Ganador</span>
                        )}
                        {t.total_respondidas > 0 && (
                          <span className="text-[10px] font-display font-semibold text-emerald-800 bg-emerald-200 font-bold px-1.5 py-0.5 rounded">
                            {t.respuestas_correctas}/{t.total_respondidas}
                          </span>
                        )}
                        <span className={`text-[10px] font-display font-semibold px-1.5 py-0.5 rounded ${
                          partida?.estado_partida === 'finalizada' ? 'text-emerald-800 bg-emerald-200 font-bold'
                          : t.total_respondidas > 0 ? 'text-amber-800 bg-amber-200 font-bold'
                          : 'text-slate-500 bg-slate-100'
                        }`}>
                          {partida?.estado_partida === 'finalizada' ? 'Finalizada'
                           : t.total_respondidas > 0 ? 'Respondida'
                           : 'Pendiente'}
                        </span>
                      </div>
                    </div>
                    {abierto ? <HiChevronUp className="w-5 h-5 text-slate-400" /> : <HiChevronDown className="w-5 h-5 text-slate-400" />}
                  </div>
                </div>

                {abierto && (
                  <div className="p-5" style={{ borderTop: '2px solid #87CEEB', background: '#F0F9FF' }}>
                    {cargandoDetalle ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                      </div>
                    ) : detalle ? (
                      <div className="space-y-3">
                        <p className="text-xs text-slate-500 font-medium">
                          {detalle.partida?.cantidad_preguntas || 0} preguntas - Puntaje: {Number(
                            detalle.respuestas?.reduce((s, r) => s + Number(r.delta_puntaje || 0), 0) ?? detalle.participante?.puntaje_final ?? 0
                          ).toFixed(1)}
                        </p>
                        {detalle.partida?.tbl_trivia_partidas_preguntas?.map((pp, idx) => {
                          const pregunta = pp.tbl_trivia_preguntas;
                          const respuesta = detalle.respuestas?.find(r => r.id_partida_pregunta === pp.id);
                          return (
                            <div key={pp.id} className="p-4 rounded-xl bg-white" style={{ border: '1.5px solid #87CEEB' }}>
                              <p className="text-sm font-medium text-slate-800 mb-2">
                                <span className="text-primary-500 font-display">{idx + 1}.</span> {pregunta?.texto_pregunta}
                              </p>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {pregunta?.tbl_trivia_opciones?.map(op => {
                                  const esSeleccionada = respuesta?.tbl_trivia_opciones?.id === op.id;
                                  const esCorrecta = op.es_correcta;
                                  let estilo = 'border-slate-100 bg-slate-50/50 text-slate-600';
                                  if (esCorrecta) estilo = 'border-emerald-300 bg-emerald-200 text-emerald-800 font-bold';
                                  if (esSeleccionada && !esCorrecta) estilo = 'border-rose-300 bg-rose-200 text-rose-800 font-bold';
                                  return (
                                    <div key={op.id} className={`p-2.5 rounded-lg border text-xs flex items-center gap-2 ${estilo}`}>
                                      {esCorrecta && <HiCheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />}
                                      {esSeleccionada && !esCorrecta && <HiXCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />}
                                      <span>{op.texto_opcion}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500 text-center py-4">No se pudo cargar el detalle</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
