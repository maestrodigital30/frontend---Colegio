import { useState, useEffect, useRef, useCallback } from 'react';
import apiClient from '../../services/apiClient';
import Boton from '../../components/common/Boton';
import InputCampo from '../../components/common/InputCampo';
import { MODALIDADES_TRIVIA, PUNTAJES_TRIVIA, ESTADOS_ASISTENCIA, MODALIDADES_ACCESO_TRIVIA } from '../../utils/constants';
import Modal from '../../components/common/Modal';
import toast from 'react-hot-toast';

export default function TriviaJugarPage() {
  // Setup
  const [cursos, setCursos] = useState([]);
  const [temas, setTemas] = useState([]);
  const [cursoSel, setCursoSel] = useState('');
  const [temaSel, setTemaSel] = useState('');
  const [modalidad, setModalidad] = useState(MODALIDADES_TRIVIA.INDIVIDUAL);
  const [cantidadPreguntas, setCantidadPreguntas] = useState(10);
  const [cantidadGrupos, setCantidadGrupos] = useState(2);
  const [alumnos, setAlumnos] = useState([]);
  const [participantesSeleccionados, setParticipantesSeleccionados] = useState([]);
  const [equipos, setEquipos] = useState([]);
  const [faseSetup, setFaseSetup] = useState('config'); // config, equipos

  // Con Codigo config
  const [modalidadAcceso, setModalidadAcceso] = useState(MODALIDADES_ACCESO_TRIVIA.EN_VIVO);
  const [maxIntentos, setMaxIntentos] = useState(1);
  const [mostrarPuntaje, setMostrarPuntaje] = useState(true);
  const [mostrarResumen, setMostrarResumen] = useState(false);
  const [mostrarRanking, setMostrarRanking] = useState(false);
  const [codigoGenerado, setCodigoGenerado] = useState('');
  const [modalCodigo, setModalCodigo] = useState(false);

  // Game
  const [partida, setPartida] = useState(null);
  const [fase, setFase] = useState('setup'); // setup, playing, results
  const [preguntaActual, setPreguntaActual] = useState(0);
  const [timer, setTimer] = useState(20);
  const [respuestas, setRespuestas] = useState({});
  const [participanteActual, setParticipanteActual] = useState(0);
  const [resultados, setResultados] = useState(null);
  const timerRef = useRef(null);

  useEffect(() => {
    apiClient.get('/cursos').then(({ data }) => setCursos(data)).catch(() => {});
    apiClient.get('/trivia/temas').then(({ data }) => setTemas(data)).catch(() => {});
  }, []);

  // D1: Cargar alumnos del curso y pre-seleccionar presentes
  useEffect(() => {
    if (!cursoSel) return;
    const cargarAlumnosYPresentes = async () => {
      try {
        const { data: todosAlumnos } = await apiClient.get('/alumnos');
        const alumnosCurso = todosAlumnos.filter(a => a.estado === 1 && a.tbl_alumnos_cursos?.some(ac => ac.id_curso === parseInt(cursoSel) && ac.estado === 1));
        setAlumnos(alumnosCurso);

        // Intentar cargar presentes del día
        try {
          const hoy = new Date().toISOString().split('T')[0];
          const { data: asistencia } = await apiClient.get(`/asistencia/historial/${cursoSel}`);
          const presentes = asistencia
            .filter(r => r.estado_asistencia === ESTADOS_ASISTENCIA.PRESENTE || r.estado_asistencia === ESTADOS_ASISTENCIA.TARDANZA)
            .map(r => r.id_alumno);
          if (presentes.length > 0) {
            setParticipantesSeleccionados(presentes);
            toast.success(`${presentes.length} alumno(s) presente(s) pre-seleccionado(s)`);
          } else {
            setParticipantesSeleccionados(alumnosCurso.map(a => a.id));
          }
        } catch {
          setParticipantesSeleccionados(alumnosCurso.map(a => a.id));
        }
      } catch {
        setAlumnos([]);
      }
    };
    cargarAlumnosYPresentes();
  }, [cursoSel]);

  const temaActual = temas.find(t => t.id === parseInt(temaSel));
  const maxPreguntas = temaActual?._count?.tbl_trivia_preguntas || 0;

  useEffect(() => {
    if (temaSel && maxPreguntas > 0 && cantidadPreguntas > maxPreguntas) {
      setCantidadPreguntas(maxPreguntas);
    }
  }, [temaSel]);

  const toggleParticipante = (id) => {
    setParticipantesSeleccionados(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const seleccionarTodos = () => {
    setParticipantesSeleccionados(alumnos.map(a => a.id));
  };

  const deseleccionarTodos = () => {
    setParticipantesSeleccionados([]);
  };

  // D2: Formación automática de equipos
  const formarEquipos = () => {
    const seleccionados = alumnos.filter(a => participantesSeleccionados.includes(a.id));
    const mezclados = [...seleccionados].sort(() => Math.random() - 0.5);

    if (modalidad === MODALIDADES_TRIVIA.PAREJAS) {
      const equiposFormados = [];
      for (let i = 0; i < mezclados.length; i += 2) {
        const equipo = [mezclados[i]];
        if (mezclados[i + 1]) equipo.push(mezclados[i + 1]);
        equiposFormados.push(equipo);
      }
      // Si hay impar, agregar el último al último equipo (pareja de 3)
      if (mezclados.length % 2 !== 0 && equiposFormados.length > 1) {
        const ultimo = equiposFormados.pop();
        equiposFormados[equiposFormados.length - 1].push(...ultimo);
      }
      setEquipos(equiposFormados);
    } else if (modalidad === MODALIDADES_TRIVIA.GRUPOS) {
      const numGrupos = Math.min(cantidadGrupos, mezclados.length);
      const equiposFormados = Array.from({ length: numGrupos }, () => []);
      mezclados.forEach((alumno, idx) => {
        equiposFormados[idx % numGrupos].push(alumno);
      });
      setEquipos(equiposFormados);
    }
    setFaseSetup('equipos');
  };

  // D3: Mover alumno entre equipos
  const moverAlumno = (alumnoId, desdeEquipo, haciaEquipo) => {
    setEquipos(prev => {
      const nuevos = prev.map(eq => [...eq]);
      const alumno = nuevos[desdeEquipo].find(a => a.id === alumnoId);
      if (!alumno) return prev;
      nuevos[desdeEquipo] = nuevos[desdeEquipo].filter(a => a.id !== alumnoId);
      nuevos[haciaEquipo].push(alumno);
      return nuevos;
    });
  };

  const crearPartida = async () => {
    if (!cursoSel || !temaSel) return toast.error('Seleccione curso y tema');
    if (participantesSeleccionados.length === 0) return toast.error('Seleccione participantes');

    try {
      const participantesPayload = modalidad === MODALIDADES_TRIVIA.INDIVIDUAL
        ? participantesSeleccionados.map(id => {
            const alumno = alumnos.find(a => a.id === id);
            return { id_alumno: id, tipo: 'alumno', etiqueta: alumno ? `${alumno.apellidos}, ${alumno.nombres}` : `Alumno ${id}` };
          })
        : equipos.flatMap((equipo, eqIdx) =>
            equipo.map(a => ({ id_alumno: a.id, tipo: 'alumno', etiqueta: `${a.apellidos}, ${a.nombres}`, numero_equipo: eqIdx + 1 }))
          );

      const { data } = await apiClient.post('/trivia/partidas', {
        id_curso: parseInt(cursoSel),
        id_tema: parseInt(temaSel),
        modalidad,
        modalidad_acceso: modalidadAcceso,
        max_intentos: modalidadAcceso === MODALIDADES_ACCESO_TRIVIA.CON_CODIGO ? maxIntentos : 1,
        mostrar_puntaje: mostrarPuntaje,
        mostrar_resumen: mostrarResumen,
        mostrar_ranking: mostrarRanking,
        cantidad_preguntas: cantidadPreguntas,
        cantidad_grupos: modalidad === MODALIDADES_TRIVIA.GRUPOS ? cantidadGrupos : null,
        participantes: (modalidadAcceso === MODALIDADES_ACCESO_TRIVIA.EN_VIVO || modalidad !== MODALIDADES_TRIVIA.INDIVIDUAL) ? participantesPayload : undefined,
      });

      // Con Codigo: show code modal and stop
      if (modalidadAcceso === MODALIDADES_ACCESO_TRIVIA.CON_CODIGO) {
        setCodigoGenerado(data.codigo_acceso);
        setModalCodigo(true);
        toast.success('Trivia con codigo creada');
        return;
      }

      setPartida(data);

      await apiClient.post(`/trivia/partidas/${data.id}/iniciar`);
      const { data: partidaCompleta } = await apiClient.get(`/trivia/partidas/${data.id}`);
      setPartida(partidaCompleta);
      setFase('playing');
      setPreguntaActual(0);
      setParticipanteActual(0);
      setTimer(partida?.tiempo_por_pregunta || 20);
      iniciarTimer();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al crear partida');
    }
  };

  const iniciarTimer = useCallback((tiempoOverride) => {
    if (timerRef.current) clearInterval(timerRef.current);
    const tiempo = tiempoOverride || partida?.tiempo_por_pregunta || 20;
    setTimer(tiempo);
    timerRef.current = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [partida]);

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const preguntas = partida?.tbl_trivia_partidas_preguntas || [];
  const preguntaData = preguntas[preguntaActual]?.tbl_trivia_preguntas;
  const opciones = preguntaData?.tbl_trivia_opciones || [];
  const participantes = partida?.tbl_trivia_participantes || [];
  const participante = participantes[participanteActual];

  const responder = async (idOpcion) => {
    if (!partida || !participante || !preguntaData) return;
    if (timerRef.current) clearInterval(timerRef.current);

    const esCorrecta = opciones.find(o => o.id === idOpcion)?.es_correcta || false;

    try {
      await apiClient.post('/trivia/respuestas', {
        id_partida: partida.id,
        id_participante: participante.id,
        id_pregunta: preguntaData.id,
        id_opcion_seleccionada: idOpcion,
        tiempo_respuesta: (partida?.tiempo_por_pregunta || 20) - timer,
      });
    } catch { /* continue */ }

    const key = `${participanteActual}-${preguntaActual}`;
    setRespuestas(prev => ({ ...prev, [key]: { idOpcion, esCorrecta } }));
    avanzar();
  };

  const tiempoAgotado = async () => {
    if (!partida || !participante || !preguntaData) return;
    // Register a null response (timeout) on the backend
    try {
      await apiClient.post('/trivia/respuestas', {
        id_partida: partida.id,
        id_participante: participante.id,
        id_pregunta: preguntaData.id,
        id_opcion_seleccionada: null,
      });
    } catch { /* continue */ }
    const key = `${participanteActual}-${preguntaActual}`;
    setRespuestas(prev => ({ ...prev, [key]: { idOpcion: null, esCorrecta: false, timeout: true } }));
    avanzar();
  };

  useEffect(() => {
    if (fase === 'playing' && timer === 0) {
      tiempoAgotado();
    }
  }, [timer, fase]);

  const avanzar = () => {
    if (modalidad === MODALIDADES_TRIVIA.INDIVIDUAL) {
      if (preguntaActual < preguntas.length - 1) {
        setPreguntaActual(prev => prev + 1);
        setTimer(partida?.tiempo_por_pregunta || 20);
        iniciarTimer();
      } else if (participanteActual < participantes.length - 1) {
        setParticipanteActual(prev => prev + 1);
        setPreguntaActual(0);
        setTimer(partida?.tiempo_por_pregunta || 20);
        iniciarTimer();
      } else {
        finalizarPartida();
      }
    } else {
      if (participanteActual < participantes.length - 1) {
        setParticipanteActual(prev => prev + 1);
        setTimer(partida?.tiempo_por_pregunta || 20);
        iniciarTimer();
      } else if (preguntaActual < preguntas.length - 1) {
        setPreguntaActual(prev => prev + 1);
        setParticipanteActual(0);
        setTimer(partida?.tiempo_por_pregunta || 20);
        iniciarTimer();
      } else {
        finalizarPartida();
      }
    }
  };

  const finalizarPartida = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    try {
      const { data } = await apiClient.post(`/trivia/partidas/${partida.id}/finalizar`);
      setResultados(data);
      setFase('results');
    } catch {
      toast.error('Error al finalizar');
      setFase('results');
    }
  };

  const cancelarPartida = async () => {
    if (!confirm('¿Cancelar la partida?')) return;
    if (timerRef.current) clearInterval(timerRef.current);
    try {
      await apiClient.post(`/trivia/partidas/${partida.id}/cancelar`);
      toast.success('Partida cancelada');
    } catch { /* ignore */ }
    setFase('setup');
    setFaseSetup('config');
    setPartida(null);
  };

  const nuevaPartida = () => {
    setFase('setup');
    setFaseSetup('config');
    setPartida(null);
    setResultados(null);
    setRespuestas({});
    setEquipos([]);
  };

  // D6: Agregar puntajes por equipo cuando aplica
  const calcularPuntajesEquipo = (participantesArr) => {
    if (!participantesArr || modalidad === MODALIDADES_TRIVIA.INDIVIDUAL) return null;
    const equiposMap = {};
    participantesArr.forEach(p => {
      if (!p.numero_equipo) return;
      if (!equiposMap[p.numero_equipo]) equiposMap[p.numero_equipo] = { numero: p.numero_equipo, puntaje: 0, miembros: [] };
      equiposMap[p.numero_equipo].puntaje += parseFloat(p.puntaje_final || 0);
      equiposMap[p.numero_equipo].miembros.push(p);
    });
    return Object.values(equiposMap).sort((a, b) => b.puntaje - a.puntaje);
  };

  // === RENDER: RESULTADOS (D4 visual torneo + D6 puntajes equipo) ===
  if (fase === 'results') {
    const participantesOrdenados = (resultados?.participantes || []).sort((a, b) => (b.puntaje_final || 0) - (a.puntaje_final || 0));
    const equiposRanking = calcularPuntajesEquipo(participantesOrdenados);
    const top3 = participantesOrdenados.slice(0, 3);
    const resto = participantesOrdenados.slice(3);

    return (
      <div className="animate-fade-up">
        <div className="mb-6">
          <p className="text-xs font-display font-medium text-secondary-600 uppercase tracking-widest mb-1">Trivia</p>
          <h1 className="text-3xl font-display font-bold text-slate-800">Resultados de la Trivia</h1>
        </div>

        {/* D4: Podio visual estilo torneo */}
        {participantesOrdenados.length > 0 && (
          <div className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl p-6 mb-6 text-white">
            <h2 className="text-center text-lg font-bold mb-6 opacity-90">Podio</h2>
            <div className="flex items-end justify-center gap-4">
              {/* 2do lugar */}
              {top3[1] && (
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-3xl mb-2">🥈</div>
                  <p className="text-sm font-semibold text-center truncate max-w-[120px]">{top3[1].etiqueta_participante || top3[1].tbl_alumnos?.apellidos}</p>
                  <p className="text-xs opacity-80">{(top3[1].puntaje_final || 0).toFixed(1)} pts</p>
                  <div className="w-24 bg-white/20 rounded-t-lg mt-2 h-20 flex items-center justify-center">
                    <span className="text-2xl font-bold">2</span>
                  </div>
                </div>
              )}
              {/* 1er lugar */}
              {top3[0] && (
                <div className="flex flex-col items-center">
                  <div className="w-20 h-20 bg-yellow-400/30 rounded-full flex items-center justify-center text-4xl mb-2 ring-4 ring-yellow-300/50">🥇</div>
                  <p className="text-sm font-bold text-center truncate max-w-[140px]">{top3[0].etiqueta_participante || top3[0].tbl_alumnos?.apellidos}</p>
                  <p className="text-xs opacity-80">{(top3[0].puntaje_final || 0).toFixed(1)} pts</p>
                  <div className="w-28 bg-yellow-400/30 rounded-t-lg mt-2 h-28 flex items-center justify-center">
                    <span className="text-3xl font-bold">1</span>
                  </div>
                </div>
              )}
              {/* 3er lugar */}
              {top3[2] && (
                <div className="flex flex-col items-center">
                  <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center text-2xl mb-2">🥉</div>
                  <p className="text-sm font-semibold text-center truncate max-w-[110px]">{top3[2].etiqueta_participante || top3[2].tbl_alumnos?.apellidos}</p>
                  <p className="text-xs opacity-80">{(top3[2].puntaje_final || 0).toFixed(1)} pts</p>
                  <div className="w-20 bg-white/20 rounded-t-lg mt-2 h-14 flex items-center justify-center">
                    <span className="text-xl font-bold">3</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* D6: Ranking por equipo (parejas/grupos) */}
        {equiposRanking && (
          <div className="glass-card-static p-6 mb-6">
            <h2 className="font-display font-semibold text-slate-800 mb-4">Ranking por {modalidad === MODALIDADES_TRIVIA.PAREJAS ? 'Pareja' : 'Grupo'}</h2>
            <div className="space-y-3">
              {equiposRanking.map((eq, idx) => (
                <div key={eq.numero} className={`p-4 rounded-lg ${idx === 0 ? 'bg-primary-50 border border-primary-200' : 'bg-slate-50'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-sm text-slate-700">
                      {idx === 0 ? '🏆 ' : ''}{modalidad === MODALIDADES_TRIVIA.PAREJAS ? `Pareja ${eq.numero}` : `Grupo ${eq.numero}`}
                    </span>
                    <span className="text-lg font-bold text-primary">{eq.puntaje.toFixed(1)} pts</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {eq.miembros.map(m => (
                      <span key={m.id} className="text-xs bg-slate-50 px-2 py-1 rounded border border-slate-200 text-slate-600">
                        {m.etiqueta_participante || `${m.tbl_alumnos?.apellidos}, ${m.tbl_alumnos?.nombres}`}
                        <span className="ml-1 text-slate-500">({(m.puntaje_final || 0).toFixed(1)})</span>
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tabla completa de participantes */}
        <div className="glass-card-static p-6">
          <h2 className="font-display font-semibold text-slate-800 mb-4">Detalle por Participante</h2>
          {participantesOrdenados.length > 0 ? (
            <div className="space-y-2">
              {participantesOrdenados.map((p, idx) => (
                <div key={p.id} className={`flex items-center gap-4 p-3 rounded-lg ${p.es_ganador ? 'bg-primary-50 border border-primary-200' : 'bg-slate-50'}`}>
                  <span className="text-lg font-bold w-8 text-center text-slate-500">
                    {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}`}
                  </span>
                  <div className="flex-1">
                    <p className="font-medium text-sm text-slate-700">
                      {p.etiqueta_participante || `${p.tbl_alumnos?.apellidos || ''}, ${p.tbl_alumnos?.nombres || ''}`}
                      {p.es_ganador && <span className="ml-2 text-xs bg-primary-50 text-primary-600 border border-primary-200 px-2 py-0.5 rounded-full">Ganador</span>}
                    </p>
                    <p className="text-xs text-slate-500">
                      Correctas: {p.respuestas_correctas || 0} | Incorrectas: {p.respuestas_incorrectas || 0}
                      {p.numero_equipo && ` | ${modalidad === MODALIDADES_TRIVIA.PAREJAS ? 'Pareja' : 'Grupo'} ${p.numero_equipo}`}
                    </p>
                  </div>
                  <p className="text-lg font-bold text-primary">{(p.puntaje_final || 0).toFixed(1)} pts</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500">Partida finalizada</p>
          )}
          <div className="mt-6">
            <Boton onClick={nuevaPartida}>Nueva Partida</Boton>
          </div>
        </div>
      </div>
    );
  }

  // === RENDER: JUGANDO ===
  if (fase === 'playing' && preguntaData) {
    const progreso = ((preguntaActual + 1) / preguntas.length) * 100;
    const respuestaActual = respuestas[`${participanteActual}-${preguntaActual}`];

    return (
      <div className="animate-fade-up">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-display font-bold text-slate-800">Trivia en Curso</h1>
          <Boton tipo="danger" onClick={cancelarPartida}>Cancelar</Boton>
        </div>

        <div className="w-full bg-slate-50 rounded-full h-2 mb-4">
          <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${progreso}%` }} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-3">
            <div className="glass-card-static p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-slate-500">Pregunta {preguntaActual + 1} / {preguntas.length}</span>
                <span className="text-sm font-medium text-slate-600">
                  Turno: <span className="text-primary">{participante?.etiqueta_participante || `${participante?.tbl_alumnos?.nombres} ${participante?.tbl_alumnos?.apellidos}`}</span>
                </span>
              </div>

              <div className="flex items-center justify-center mb-6">
                <div className={`w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold border-4 ${timer <= 5 ? 'border-rose-500 text-rose-500 animate-pulse' : 'border-primary-400 text-primary-600'}`}>
                  {timer}
                </div>
              </div>

              <h2 className="text-lg font-semibold text-slate-800 text-center mb-6">{preguntaData.texto_pregunta}</h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {opciones.map((o, i) => {
                  const colores = ['bg-primary-500/80 hover:bg-primary-600/80', 'bg-secondary-500/80 hover:bg-secondary-600/80', 'bg-accent-500/80 hover:bg-accent-600/80', 'bg-primary-700/80 hover:bg-primary-800/80'];
                  return (
                    <button
                      key={o.id}
                      onClick={() => responder(o.id)}
                      disabled={!!respuestaActual}
                      className={`p-4 rounded-xl text-white font-medium text-sm transition-all ${colores[i]} disabled:opacity-50`}
                    >
                      <span className="font-bold mr-2">{String.fromCharCode(65 + i)})</span>
                      {o.texto_opcion}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="glass-card-static p-4">
            <h3 className="font-display font-semibold text-slate-800 mb-3 text-sm">Puntajes</h3>
            <div className="space-y-2">
              {participantes.map((p, idx) => {
                let puntos = 0;
                Object.entries(respuestas).forEach(([key, val]) => {
                  if (key.startsWith(`${idx}-`)) {
                    const pCorrect = parseFloat(partida?.puntaje_correcto || PUNTAJES_TRIVIA.CORRECTO);
                    const pIncorrect = parseFloat(partida?.puntaje_incorrecto || PUNTAJES_TRIVIA.INCORRECTO);
                    puntos += val.esCorrecta ? pCorrect : (val.timeout ? 0 : pIncorrect);
                  }
                });
                return (
                  <div key={p.id} className={`flex items-center justify-between p-2 rounded-lg text-xs ${idx === participanteActual ? 'bg-primary/10 text-primary' : 'text-slate-500'}`}>
                    <span className="truncate">{p.etiqueta_participante || p.tbl_alumnos?.apellidos}</span>
                    <span className="font-bold">{puntos.toFixed(1)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // === RENDER: SETUP - AJUSTE MANUAL DE EQUIPOS (D3) ===
  if (fase === 'setup' && faseSetup === 'equipos') {
    return (
      <div className="animate-fade-up">
        <div className="mb-6">
          <p className="text-xs font-display font-medium text-secondary-600 uppercase tracking-widest mb-1">Trivia</p>
          <h1 className="text-3xl font-display font-bold text-slate-800">
            Ajustar {modalidad === MODALIDADES_TRIVIA.PAREJAS ? 'Parejas' : 'Grupos'}
          </h1>
        </div>
        <p className="text-sm text-slate-500 mb-4">
          Puede mover alumnos entre equipos seleccionando el equipo destino.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {equipos.map((equipo, eqIdx) => (
            <div key={eqIdx} className="glass-card-static p-4">
              <h3 className="font-semibold text-primary mb-3 text-sm">
                {modalidad === MODALIDADES_TRIVIA.PAREJAS ? `Pareja ${eqIdx + 1}` : `Grupo ${eqIdx + 1}`}
                <span className="text-slate-500 font-normal ml-2">({equipo.length})</span>
              </h3>
              <div className="space-y-2">
                {equipo.map(alumno => (
                  <div key={alumno.id} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                    <span className="text-xs font-medium truncate text-slate-600">{alumno.apellidos}, {alumno.nombres}</span>
                    <select
                      className="text-xs border border-slate-200 bg-slate-50 text-slate-600 rounded px-1 py-0.5 ml-2"
                      value=""
                      onChange={(e) => {
                        if (e.target.value) moverAlumno(alumno.id, eqIdx, parseInt(e.target.value));
                      }}
                    >
                      <option value="">Mover a...</option>
                      {equipos.map((_, destIdx) =>
                        destIdx !== eqIdx && (
                          <option key={destIdx} value={destIdx}>
                            {modalidad === MODALIDADES_TRIVIA.PAREJAS ? `Pareja ${destIdx + 1}` : `Grupo ${destIdx + 1}`}
                          </option>
                        )
                      )}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <Boton tipo="outline" onClick={() => { setFaseSetup('config'); setEquipos([]); }}>Volver</Boton>
          <Boton onClick={() => formarEquipos()}>Mezclar de nuevo</Boton>
          <Boton onClick={crearPartida}>
            {modalidadAcceso === MODALIDADES_ACCESO_TRIVIA.CON_CODIGO ? 'Crear Trivia con Codigo' : 'Iniciar Partida'}
          </Boton>
        </div>

        {/* Modal codigo generado (con detalle de grupos) */}
        <Modal abierto={modalCodigo} cerrar={() => { setModalCodigo(false); nuevaPartida(); }} titulo="Trivia con Codigo Creada">
          <div className="py-4">
            <p className="text-sm text-slate-500 mb-4 text-center">Comparte este codigo con tus alumnos:</p>
            <div className="bg-slate-50 border-2 border-dashed border-purple-300 rounded-xl p-6 mb-4 text-center">
              <p className="text-4xl font-mono font-bold text-purple-600 tracking-[0.3em]">{codigoGenerado}</p>
            </div>
            <div className="text-center mb-5">
              <button onClick={() => { navigator.clipboard.writeText(codigoGenerado); toast.success('Codigo copiado'); }}
                className="px-4 py-2 bg-purple-500 text-white rounded-lg text-sm font-medium hover:bg-purple-600 transition-colors">
                Copiar Codigo
              </button>
            </div>

            {equipos.length > 0 && (
              <div className="border-t border-slate-200 pt-4">
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 text-center">
                  {modalidad === MODALIDADES_TRIVIA.PAREJAS ? 'Parejas' : 'Grupos'} formados
                </h4>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                  {equipos.map((equipo, eqIdx) => (
                    <div key={eqIdx} className="bg-slate-50 rounded-lg p-2.5 border border-slate-200">
                      <p className="text-xs font-semibold text-primary mb-1">
                        {modalidad === MODALIDADES_TRIVIA.PAREJAS ? `Pareja ${eqIdx + 1}` : `Grupo ${eqIdx + 1}`}
                      </p>
                      {equipo.map(a => (
                        <p key={a.id} className="text-xs text-slate-600 truncate">{a.apellidos}, {a.nombres}</p>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <p className="text-xs text-slate-400 mt-4 text-center">Cualquier integrante del equipo puede ingresar con su DNI</p>
          </div>
        </Modal>
      </div>
    );
  }

  // === RENDER: SETUP - CONFIGURACIÓN ===
  return (
    <div className="animate-fade-up">
      <div className="mb-6">
        <p className="text-xs font-display font-medium text-secondary-600 uppercase tracking-widest mb-1">Trivia</p>
        <h1 className="text-3xl font-display font-bold text-slate-800">Jugar Trivia</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card-static p-6">
          <h2 className="font-display font-semibold text-slate-800 mb-4">Configurar Partida</h2>
          <div className="space-y-4">
            <InputCampo label="Curso" name="curso" type="select" value={cursoSel} onChange={(e) => setCursoSel(e.target.value)} options={cursos.filter(c => c.estado === 1).map(c => ({ value: c.id.toString(), label: `${c.nombre} - ${c.grado || ''} ${c.seccion || ''}` }))} />
            <InputCampo label="Tema" name="tema" type="select" value={temaSel} onChange={(e) => setTemaSel(e.target.value)} options={temas.filter(t => t.estado === 1).map(t => ({ value: t.id.toString(), label: t.nombre }))} />
            <InputCampo label="Modalidad" name="modalidad" type="select" value={modalidad} onChange={(e) => setModalidad(e.target.value)} options={Object.entries(MODALIDADES_TRIVIA).map(([k, v]) => ({ value: v, label: k.charAt(0) + k.slice(1).toLowerCase() }))} />
            {modalidad === MODALIDADES_TRIVIA.GRUPOS && (
              <InputCampo label="Cantidad de Grupos" name="cantGrupos" type="number" value={cantidadGrupos} onChange={(e) => setCantidadGrupos(parseInt(e.target.value) || 2)} />
            )}
            <InputCampo label={`Cantidad de Preguntas${maxPreguntas > 0 ? ` (max: ${maxPreguntas})` : ''}`} name="cant" type="number" value={cantidadPreguntas} onChange={(e) => { const val = parseInt(e.target.value) || 1; setCantidadPreguntas(maxPreguntas > 0 ? Math.min(val, maxPreguntas) : val); }} />

            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">Tipo de Acceso</label>
              <div className="flex gap-2">
                <button type="button" onClick={() => setModalidadAcceso(MODALIDADES_ACCESO_TRIVIA.EN_VIVO)}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all ${modalidadAcceso === MODALIDADES_ACCESO_TRIVIA.EN_VIVO ? 'bg-primary/10 text-primary border border-primary/30' : 'bg-slate-50 text-slate-500 border border-slate-200 hover:bg-slate-100'}`}>
                  En Vivo
                </button>
                <button type="button" onClick={() => setModalidadAcceso(MODALIDADES_ACCESO_TRIVIA.CON_CODIGO)}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all ${modalidadAcceso === MODALIDADES_ACCESO_TRIVIA.CON_CODIGO ? 'bg-purple-500/10 text-purple-600 border border-purple-300' : 'bg-slate-50 text-slate-500 border border-slate-200 hover:bg-slate-100'}`}>
                  Con Codigo
                </button>
              </div>
            </div>

            {modalidadAcceso === MODALIDADES_ACCESO_TRIVIA.CON_CODIGO && (
              <>
                <InputCampo label="Intentos permitidos" name="maxIntentos" type="number" value={maxIntentos} onChange={(e) => setMaxIntentos(Math.max(1, parseInt(e.target.value) || 1))} />
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-2">Al finalizar, el alumno vera:</label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={mostrarPuntaje} onChange={(e) => setMostrarPuntaje(e.target.checked)} className="w-4 h-4 text-primary rounded" />
                      <span className="text-sm text-slate-600">Puntaje final</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={mostrarResumen} onChange={(e) => setMostrarResumen(e.target.checked)} className="w-4 h-4 text-primary rounded" />
                      <span className="text-sm text-slate-600">Resumen de respuestas</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={mostrarRanking} onChange={(e) => setMostrarRanking(e.target.checked)} className="w-4 h-4 text-primary rounded" />
                      <span className="text-sm text-slate-600">Ranking comparativo</span>
                    </label>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {(modalidadAcceso === MODALIDADES_ACCESO_TRIVIA.EN_VIVO || modalidad !== MODALIDADES_TRIVIA.INDIVIDUAL) && (<div className="glass-card-static p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-slate-800">Participantes ({participantesSeleccionados.length})</h2>
            <div className="flex gap-2">
              <button onClick={seleccionarTodos} className="text-xs text-primary hover:underline">Todos</button>
              <button onClick={deseleccionarTodos} className="text-xs text-slate-500 hover:underline">Ninguno</button>
            </div>
          </div>
          <div className="space-y-1 max-h-64 overflow-y-auto">
            {alumnos.map(a => (
              <label key={a.id} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg cursor-pointer">
                <input type="checkbox" checked={participantesSeleccionados.includes(a.id)} onChange={() => toggleParticipante(a.id)} className="w-4 h-4 text-primary rounded" />
                <span className="text-sm text-slate-600">{a.apellidos}, {a.nombres}</span>
              </label>
            ))}
            {cursoSel && alumnos.length === 0 && <p className="text-sm text-slate-500 text-center py-2">No hay alumnos</p>}
          </div>
        </div>)}
      </div>

      <div className="mt-6 flex gap-3">
        {modalidad !== MODALIDADES_TRIVIA.INDIVIDUAL ? (
          <Boton onClick={formarEquipos}>
            Formar {modalidad === MODALIDADES_TRIVIA.PAREJAS ? 'Parejas' : 'Grupos'} y Configurar
          </Boton>
        ) : modalidadAcceso === MODALIDADES_ACCESO_TRIVIA.CON_CODIGO ? (
          <Boton onClick={crearPartida}>Crear Trivia con Codigo</Boton>
        ) : (
          <Boton onClick={crearPartida}>Iniciar Partida</Boton>
        )}
      </div>

      {/* Modal codigo generado */}
      <Modal abierto={modalCodigo} cerrar={() => { setModalCodigo(false); nuevaPartida(); }} titulo="Trivia con Codigo Creada">
        <div className="text-center py-4">
          <p className="text-sm text-slate-500 mb-4">Comparte este codigo con tus alumnos:</p>
          <div className="bg-slate-50 border-2 border-dashed border-purple-300 rounded-xl p-6 mb-4">
            <p className="text-4xl font-mono font-bold text-purple-600 tracking-[0.3em]">{codigoGenerado}</p>
          </div>
          <button onClick={() => { navigator.clipboard.writeText(codigoGenerado); toast.success('Codigo copiado'); }}
            className="px-4 py-2 bg-purple-500 text-white rounded-lg text-sm font-medium hover:bg-purple-600 transition-colors">
            Copiar Codigo
          </button>
          <p className="text-xs text-slate-400 mt-4">Los alumnos ingresaran con este codigo + su DNI en la pantalla de Trivia</p>
        </div>
      </Modal>
    </div>
  );
}
