import { useEffect, useMemo, useRef, useState } from 'react';
import {
  HiPlay, HiClock, HiLightningBolt, HiSparkles, HiX, HiCheck, HiArrowRight,
  HiVolumeUp, HiVolumeOff, HiExclamation, HiBadgeCheck,
} from 'react-icons/hi';
import {
  iniciarIntento, obtenerIntento, aplicarComodin, responder,
  obtenerBonus, seleccionarBonus, finalizarIntento, obtenerResultado,
} from '../../services/concursoJuegoService';
import { obtenerConcurso } from '../../services/concursoService';
import { getUploadUrl } from '../../utils/storage';
import { CONCURSOS } from '../../utils/constants';
import { estilosFondoTema, colorAcento } from './temaVisualUtils';

// Estados del motor: cargando, intro, jugando, feedback, bonus, resultado, error
export default function MotorConcurso({ idConcurso, onSalir, modoPreview = false }) {
  const [estado, setEstado] = useState('cargando');
  const [error, setError] = useState(null);
  const [concurso, setConcurso] = useState(null);
  const [intento, setIntento] = useState(null);
  const [preguntas, setPreguntas] = useState([]);
  const [indice, setIndice] = useState(0);
  const [feedback, setFeedback] = useState(null); // { esCorrecta, puntos, opcionesCorrectas }
  const [bonusTarjetas, setBonusTarjetas] = useState([]);
  const [bonusResultado, setBonusResultado] = useState(null);
  const [resultado, setResultado] = useState(null);

  // Estado por pregunta
  const [tiempoRestante, setTiempoRestante] = useState(0);
  const [ocultas, setOcultas] = useState([]);
  const [dobleArmado, setDobleArmado] = useState(false);
  const [aplicadosPregunta, setAplicadosPregunta] = useState({ '50_50': false, tiempo_extra: false, doble_puntaje: false });
  const [seleccion, setSeleccion] = useState(null); // id_opcion para single
  const [seleccionMulti, setSeleccionMulti] = useState([]); // ids para multi
  const [enviandoRespuesta, setEnviandoRespuesta] = useState(false);
  const [sonido, setSonido] = useState(true);

  const inicioPreguntaRef = useRef(null);
  const timerRef = useRef(null);

  const preguntaActual = preguntas[indice];

  // ===== Carga inicial =====
  useEffect(() => {
    cargarIntro();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idConcurso]);

  const cargarIntro = async () => {
    try {
      setEstado('cargando');
      const c = await obtenerConcurso(idConcurso);
      setConcurso(c);
      setEstado('intro');
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo cargar el concurso');
      setEstado('error');
    }
  };

  const iniciarJuego = async () => {
    try {
      setEstado('cargando');
      const it = await iniciarIntento(idConcurso);
      const detalle = await obtenerIntento(it.id);
      setIntento(detalle.intento);
      setConcurso(detalle.concurso);
      setPreguntas(detalle.preguntas);
      const primerSinResponder = detalle.preguntas.findIndex((p) => !p.respondida);
      const idx = primerSinResponder === -1 ? 0 : primerSinResponder;
      setIndice(idx);
      prepararPregunta(detalle.preguntas[idx]);
      setEstado('jugando');
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo iniciar el concurso');
      setEstado('error');
    }
  };

  const prepararPregunta = (pregunta) => {
    if (!pregunta) return;
    setSeleccion(null);
    setSeleccionMulti([]);
    setOcultas([]);
    setDobleArmado(false);
    setAplicadosPregunta({ '50_50': false, tiempo_extra: false, doble_puntaje: false });
    setTiempoRestante(pregunta.tiempo_limite_segundos);
    inicioPreguntaRef.current = Date.now();
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTiempoRestante((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          enviarRespuestaPorTiempo();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  };

  const enviarRespuestaPorTiempo = async () => {
    if (!preguntaActual || feedback) return;
    await enviarRespuesta({ porTiempo: true });
  };

  const onSeleccionar = (idOpcion) => {
    if (feedback || ocultas.includes(idOpcion)) return;
    if (preguntaActual?.permite_multiple) {
      setSeleccionMulti((prev) => prev.includes(idOpcion) ? prev.filter((x) => x !== idOpcion) : [...prev, idOpcion]);
    } else {
      setSeleccion(idOpcion);
    }
  };

  const confirmarRespuesta = async () => {
    if (feedback || enviandoRespuesta) return;
    if (!preguntaActual?.permite_multiple && seleccion == null) return;
    if (preguntaActual?.permite_multiple && seleccionMulti.length === 0) return;
    await enviarRespuesta({ porTiempo: false });
  };

  const enviarRespuesta = async ({ porTiempo }) => {
    if (!intento || enviandoRespuesta) return;
    setEnviandoRespuesta(true);
    try {
      if (timerRef.current) clearInterval(timerRef.current);
      const tiempoUsado = Math.max(0, Math.floor((Date.now() - (inicioPreguntaRef.current || Date.now())) / 1000));
      const payload = {
        id_pregunta: preguntaActual.id,
        tiempo_usado_segundos: tiempoUsado,
        comodin_50_50_aplicado: aplicadosPregunta['50_50'],
        comodin_tiempo_extra_aplicado: aplicadosPregunta.tiempo_extra,
        comodin_doble_puntaje_aplicado: dobleArmado,
      };
      if (preguntaActual.permite_multiple) {
        payload.ids_opciones_seleccionadas = porTiempo ? [] : seleccionMulti;
      } else {
        payload.id_opcion_seleccionada = porTiempo ? null : seleccion;
      }

      const r = await responder(intento.id, payload);
      reproducirFeedback(r.es_correcta);
      setFeedback({
        es_correcta: r.es_correcta,
        puntos: r.puntos_obtenidos,
        opciones_correctas: r.opciones_correctas || [],
      });
      // Avanza tras 1.6s
      setTimeout(avanzar, 1600);
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo registrar la respuesta');
    } finally {
      setEnviandoRespuesta(false);
    }
  };

  const avanzar = async () => {
    setFeedback(null);
    if (indice + 1 < preguntas.length) {
      const idx = indice + 1;
      setIndice(idx);
      prepararPregunta(preguntas[idx]);
    } else {
      // Terminar
      if (concurso?.bonus_habilitado) {
        await iniciarBonus();
      } else {
        await terminar();
      }
    }
  };

  const iniciarBonus = async () => {
    try {
      const tarjetas = await obtenerBonus(intento.id);
      setBonusTarjetas(tarjetas);
      setEstado('bonus');
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo iniciar la ronda bonus');
      setEstado('error');
    }
  };

  const escogerTarjeta = async (idTarjeta) => {
    if (bonusResultado) return;
    try {
      const r = await seleccionarBonus(intento.id, idTarjeta);
      reproducirFeedback(true);
      setBonusResultado(r);
      setTimeout(() => terminar(), 2200);
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo seleccionar la tarjeta');
    }
  };

  const terminar = async () => {
    try {
      await finalizarIntento(intento.id);
      const r = await obtenerResultado(intento.id);
      setResultado(r);
      setEstado('resultado');
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo finalizar el intento');
      setEstado('error');
    }
  };

  // ===== Comodines =====
  const handleComodin = async (tipo) => {
    if (!intento) return;
    if (aplicadosPregunta[tipo]) return;
    try {
      const r = await aplicarComodin(intento.id, tipo, preguntaActual.id);
      if (tipo === '50_50') {
        setOcultas(r.ocultar_ids || []);
      } else if (tipo === 'tiempo_extra') {
        setTiempoRestante((t) => t + (r.segundos_extra || 0));
      } else if (tipo === 'doble_puntaje') {
        setDobleArmado(true);
      }
      setAplicadosPregunta((s) => ({ ...s, [tipo]: true }));
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo aplicar el comodin');
      setTimeout(() => setError(null), 2500);
    }
  };

  // ===== Sonido (sintetico, sin assets) =====
  const reproducirFeedback = (acierto) => {
    if (!sonido) return;
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.value = acierto ? 880 : 220;
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.4);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } catch { /* sin audio */ }
  };

  const tema = concurso?.tema_visual || 'clasico';
  const acento = colorAcento(tema);
  const fondoTema = useMemo(() => estilosFondoTema(tema), [tema]);

  if (estado === 'cargando') {
    return <Pantalla titulo="Cargando concurso..." fondo={fondoTema}><PulsoCarga acento={acento} /></Pantalla>;
  }

  if (estado === 'error') {
    return (
      <Pantalla titulo="Ups" fondo={fondoTema}>
        <div className="text-center text-white">
          <HiExclamation className="w-12 h-12 mx-auto mb-3 text-amber-300" />
          <p className="text-lg mb-4">{error || 'Error desconocido'}</p>
          <button onClick={onSalir} className="px-5 py-2 rounded-xl bg-white/20 text-white border border-white/30 hover:bg-white/30">Volver</button>
        </div>
      </Pantalla>
    );
  }

  if (estado === 'intro') {
    return (
      <Pantalla fondo={fondoTema}>
        <PantallaIntro
          concurso={concurso}
          acento={acento}
          onIniciar={iniciarJuego}
          onSalir={onSalir}
          modoPreview={modoPreview}
          sonido={sonido}
          setSonido={setSonido}
        />
      </Pantalla>
    );
  }

  if (estado === 'jugando') {
    return (
      <Pantalla fondo={fondoTema}>
        <PantallaJuego
          concurso={concurso}
          intento={intento}
          pregunta={preguntaActual}
          totalPreguntas={preguntas.length}
          indice={indice}
          tiempoRestante={tiempoRestante}
          seleccion={seleccion}
          seleccionMulti={seleccionMulti}
          feedback={feedback}
          ocultas={ocultas}
          dobleArmado={dobleArmado}
          aplicadosPregunta={aplicadosPregunta}
          enviando={enviandoRespuesta}
          onSeleccionar={onSeleccionar}
          onConfirmar={confirmarRespuesta}
          onComodin={handleComodin}
          acento={acento}
          onSalir={onSalir}
          sonido={sonido}
          setSonido={setSonido}
        />
      </Pantalla>
    );
  }

  if (estado === 'bonus') {
    return (
      <Pantalla fondo={fondoTema}>
        <PantallaBonus
          tarjetas={bonusTarjetas}
          resultado={bonusResultado}
          puntajeBonus={resultado?.puntaje_bonus || (bonusResultado ? bonusResultado.seleccionada.puntos : 0)}
          onEscoger={escogerTarjeta}
          acento={acento}
        />
      </Pantalla>
    );
  }

  if (estado === 'resultado') {
    return (
      <Pantalla fondo={fondoTema}>
        <PantallaResultado
          resultado={resultado}
          acento={acento}
          onSalir={onSalir}
          onReintentar={async () => { setEstado('intro'); }}
          puedeReintentar={resultado?.tbl_concursos?.permite_reintentos}
        />
      </Pantalla>
    );
  }

  return null;
}

// ===== UI subcomponents =====
function Pantalla({ children, fondo }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto" style={fondo}>
      <div className="w-full max-w-5xl mx-auto p-4 sm:p-6 lg:p-8">{children}</div>
    </div>
  );
}

function PulsoCarga({ acento }) {
  return (
    <div className="flex items-center justify-center min-h-[40vh]">
      <div className="w-16 h-16 rounded-full border-4 border-white/30 border-t-white animate-spin" style={{ borderTopColor: acento }} />
    </div>
  );
}

function PantallaIntro({ concurso, acento, onIniciar, onSalir, modoPreview, sonido, setSonido }) {
  return (
    <div className="text-white text-center space-y-6 sm:space-y-8">
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 backdrop-blur text-xs uppercase tracking-widest">
        Concurso de preguntas
      </div>
      <h1 className="text-4xl sm:text-6xl font-display font-extrabold drop-shadow-lg" style={{ color: acento }}>
        {concurso.titulo}
      </h1>
      {concurso.multimedia_url && (
        <div className="max-w-md mx-auto rounded-3xl overflow-hidden shadow-2xl border-4" style={{ borderColor: acento }}>
          {concurso.multimedia_tipo === 'video'
            ? <video src={getUploadUrl(concurso.multimedia_url)} controls className="w-full aspect-video bg-black" />
            : <img src={getUploadUrl(concurso.multimedia_url)} alt={concurso.titulo} className="w-full aspect-video object-cover" />}
        </div>
      )}
      {concurso.descripcion && (
        <p className="text-base sm:text-lg max-w-2xl mx-auto text-white/90">{concurso.descripcion}</p>
      )}
      <ChipsConfig concurso={concurso} acento={acento} />
      <div className="flex flex-col items-center gap-3 pt-2">
        <button
          onClick={onIniciar}
          className="px-10 py-4 rounded-2xl font-display font-bold text-xl tracking-wide shadow-2xl transition-transform hover:scale-105 active:scale-95"
          style={{ background: acento, color: '#0f172a' }}
        >
          <HiPlay className="inline w-6 h-6 mr-2" /> INICIAR
        </button>
        <div className="flex items-center gap-2">
          <button onClick={onSalir} className="text-sm text-white/70 hover:text-white underline">Volver</button>
          <span className="text-white/40">|</span>
          <button onClick={() => setSonido(!sonido)} className="text-sm text-white/70 hover:text-white inline-flex items-center gap-1">
            {sonido ? <HiVolumeUp /> : <HiVolumeOff />} {sonido ? 'Sonido on' : 'Sonido off'}
          </button>
        </div>
        {modoPreview && (
          <span className="text-xs px-2 py-1 rounded-full bg-amber-300/20 text-amber-200 border border-amber-300/40">Modo preview</span>
        )}
      </div>
    </div>
  );
}

function ChipsConfig({ concurso, acento }) {
  const items = [];
  items.push({ icon: HiClock, txt: `${concurso.tiempo_por_pregunta}s por pregunta` });
  items.push({ icon: HiSparkles, txt: `${concurso.puntos_base} pts base` });
  if (concurso.comodin_50_50_habilitado) items.push({ icon: HiLightningBolt, txt: 'Comodin 50:50' });
  if (concurso.comodin_tiempo_extra_habilitado) items.push({ icon: HiLightningBolt, txt: `+${concurso.comodin_tiempo_extra_segundos}s extra` });
  if (concurso.comodin_doble_puntaje_habilitado) items.push({ icon: HiLightningBolt, txt: 'Puntuacion x2' });
  if (concurso.bonus_habilitado) items.push({ icon: HiBadgeCheck, txt: 'Ronda bonus' });
  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      {items.map((it, i) => (
        <span key={i} className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-white/10 border border-white/20" style={{ color: acento }}>
          <it.icon className="w-4 h-4" /> {it.txt}
        </span>
      ))}
    </div>
  );
}

function PantallaJuego({
  concurso, intento, pregunta, totalPreguntas, indice, tiempoRestante,
  seleccion, seleccionMulti, feedback, ocultas, dobleArmado, aplicadosPregunta, enviando,
  onSeleccionar, onConfirmar, onComodin, acento, onSalir, sonido, setSonido,
}) {
  if (!pregunta) return null;
  const progreso = ((indice + 1) / totalPreguntas) * 100;
  const tiempoMax = pregunta.tiempo_limite_segundos;
  const porcentajeTiempo = (tiempoRestante / tiempoMax) * 100;
  const claseTimer = porcentajeTiempo < 20 ? 'text-rose-300' : porcentajeTiempo < 50 ? 'text-amber-300' : 'text-white';
  const idsCorrectas = feedback?.opciones_correctas || [];

  const estiloOpcion = (op) => {
    let base = 'group relative w-full p-4 sm:p-5 rounded-2xl border-2 text-left transition-all duration-200 active:scale-[0.98]';
    if (ocultas.includes(op.id)) return `${base} opacity-20 pointer-events-none border-white/10 bg-white/5`;
    if (feedback) {
      if (idsCorrectas.includes(op.id)) return `${base} border-emerald-300 bg-emerald-400/30 text-white ring-4 ring-emerald-300/40`;
      const elegida = pregunta.permite_multiple ? seleccionMulti.includes(op.id) : op.id === seleccion;
      if (elegida) return `${base} border-rose-300 bg-rose-500/30 text-white ring-4 ring-rose-300/40`;
      return `${base} border-white/10 bg-white/5 text-white/70`;
    }
    const elegida = pregunta.permite_multiple ? seleccionMulti.includes(op.id) : op.id === seleccion;
    if (elegida) return `${base} border-white bg-white/25 text-white shadow-2xl`;
    return `${base} border-white/30 bg-white/10 text-white hover:bg-white/20 hover:border-white/60`;
  };

  return (
    <div className="text-white space-y-5">
      {/* Header progreso/timer */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <button onClick={() => { if (confirm('Salir del concurso? Tu progreso quedara guardado')) onSalir(); }} className="p-2 rounded-lg bg-white/10 hover:bg-white/20"><HiX /></button>
        <div className="flex-1 min-w-[140px]">
          <div className="h-2 rounded-full bg-white/20 overflow-hidden">
            <div className="h-full transition-all duration-500" style={{ width: `${progreso}%`, background: acento }} />
          </div>
        </div>
        <div className={`flex items-center gap-2 font-display font-bold text-lg sm:text-2xl ${claseTimer}`}>
          <HiClock className="w-5 h-5 sm:w-6 sm:h-6" />
          <span>{String(Math.floor(tiempoRestante / 60)).padStart(2, '0')}:{String(tiempoRestante % 60).padStart(2, '0')}</span>
        </div>
        <button onClick={() => setSonido(!sonido)} className="p-2 rounded-lg bg-white/10 hover:bg-white/20">
          {sonido ? <HiVolumeUp /> : <HiVolumeOff />}
        </button>
      </div>

      {/* Puntaje y posicion */}
      <div className="flex items-center justify-between text-sm sm:text-base">
        <span className="px-3 py-1 rounded-full bg-black/30">{indice + 1} / {totalPreguntas}</span>
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-black/30">
          <HiCheck className="w-4 h-4" /> {intento.puntaje_total + (feedback?.puntos || 0)} pts
        </span>
      </div>

      {/* Multimedia opcional */}
      {pregunta.multimedia_url && (
        <div className="max-w-2xl mx-auto rounded-2xl overflow-hidden border-2 border-white/20">
          {pregunta.multimedia_tipo === 'video'
            ? <video src={getUploadUrl(pregunta.multimedia_url)} controls className="w-full bg-black" />
            : <img src={getUploadUrl(pregunta.multimedia_url)} alt="" className="w-full object-cover max-h-[40vh]" />}
        </div>
      )}

      {/* Texto pregunta */}
      <div className="text-center font-display font-bold text-xl sm:text-3xl leading-tight drop-shadow">
        {pregunta.texto}
        {pregunta.permite_multiple && (
          <span className="block mt-1 text-xs font-normal text-white/70">Puedes seleccionar varias opciones</span>
        )}
      </div>

      {/* Opciones */}
      <div className={`grid gap-3 ${pregunta.opciones.length <= 2 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'}`}>
        {pregunta.opciones.map((op, idx) => (
          <button key={op.id} onClick={() => onSeleccionar(op.id)} className={estiloOpcion(op)}>
            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-display font-bold" style={{ background: acento, color: '#0f172a' }}>
                {String.fromCharCode(65 + idx)}
              </span>
              <div className="flex-1 min-w-0 space-y-2">
                {op.multimedia_url && (
                  <div className="rounded-xl overflow-hidden bg-black/30">
                    {op.multimedia_tipo === 'video'
                      ? <video src={getUploadUrl(op.multimedia_url)} className="w-full max-h-32" muted loop />
                      : <img src={getUploadUrl(op.multimedia_url)} alt="" className="w-full max-h-32 object-contain" />}
                  </div>
                )}
                {op.texto && <p className="font-semibold break-words">{op.texto}</p>}
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Confirmar */}
      {!feedback && (
        <div className="flex justify-center">
          <button
            onClick={onConfirmar}
            disabled={enviando || (!pregunta.permite_multiple && seleccion == null) || (pregunta.permite_multiple && seleccionMulti.length === 0)}
            className="px-8 py-3 rounded-2xl font-display font-bold text-lg shadow-2xl disabled:opacity-40 disabled:cursor-not-allowed transition-transform hover:scale-105 active:scale-95"
            style={{ background: acento, color: '#0f172a' }}
          >
            {enviando ? 'Enviando...' : 'Responder'} <HiArrowRight className="inline ml-1" />
          </button>
        </div>
      )}

      {/* Comodines */}
      <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
        {concurso.comodin_doble_puntaje_habilitado && (
          <ComodinBtn
            label="Puntuacion x2"
            usado={intento.comodin_doble_puntaje_usado || aplicadosPregunta.doble_puntaje}
            armado={dobleArmado}
            disabled={!!feedback}
            onClick={() => onComodin('doble_puntaje')}
            color="#a855f7"
          />
        )}
        {concurso.comodin_50_50_habilitado && (
          <ComodinBtn
            label="50:50"
            usado={intento.comodin_50_50_usado || aplicadosPregunta['50_50']}
            disabled={!!feedback || pregunta.permite_multiple}
            onClick={() => onComodin('50_50')}
            color="#22d3ee"
          />
        )}
        {concurso.comodin_tiempo_extra_habilitado && (
          <ComodinBtn
            label={`+${concurso.comodin_tiempo_extra_segundos}s extra`}
            usado={intento.comodin_tiempo_extra_usado || aplicadosPregunta.tiempo_extra}
            disabled={!!feedback}
            onClick={() => onComodin('tiempo_extra')}
            color="#f97316"
          />
        )}
      </div>

      {/* Feedback */}
      {feedback && (
        <div className="text-center">
          <span className={`inline-block px-5 py-2 rounded-full font-display font-bold text-lg shadow-2xl ${feedback.es_correcta ? 'bg-emerald-500' : 'bg-rose-500'} text-white`}>
            {feedback.es_correcta ? `+${feedback.puntos} pts` : feedback.puntos < 0 ? `${feedback.puntos} pts` : 'Incorrecto'}
          </span>
        </div>
      )}
    </div>
  );
}

function ComodinBtn({ label, usado, armado, disabled, onClick, color }) {
  return (
    <button
      onClick={onClick}
      disabled={usado || disabled}
      className={`px-4 py-2 rounded-full text-sm font-display font-bold border-2 transition-all
        ${usado ? 'opacity-30 line-through' : 'hover:scale-105 active:scale-95'}
        ${armado ? 'ring-4 ring-white/40' : ''}`}
      style={{ borderColor: color, color: 'white', background: armado ? color : 'rgba(255,255,255,0.05)' }}
    >
      <HiLightningBolt className="inline w-4 h-4 mr-1" /> {label}
    </button>
  );
}

function PantallaBonus({ tarjetas, resultado, onEscoger, acento }) {
  return (
    <div className="text-white text-center space-y-6">
      <h2 className="text-4xl sm:text-6xl font-display font-extrabold drop-shadow-lg" style={{ color: acento }}>
        RONDA BONUS
      </h2>
      <p className="text-white/80">Elige una tarjeta. Cada una oculta un premio en puntos.</p>
      <div className="flex flex-wrap gap-3 sm:gap-5 justify-center max-w-3xl mx-auto">
        {tarjetas.map((t) => {
          const esSeleccionada = resultado?.seleccionada?.id === t.id;
          const yaSeleccionada = resultado?.todas?.find((x) => x.id === t.id)?.seleccionada;
          const revelada = !!resultado;
          return (
            <button
              key={t.id}
              onClick={() => onEscoger(t.id)}
              disabled={!!resultado}
              className={`relative aspect-[3/4] w-24 sm:w-32 lg:w-36 rounded-2xl border-4 shadow-2xl transition-all duration-500
                ${esSeleccionada ? 'scale-110 rotate-0' : 'hover:scale-105'}
                ${revelada && !esSeleccionada ? 'opacity-60' : ''}`}
              style={{
                borderColor: acento,
                background: revelada && yaSeleccionada
                  ? `linear-gradient(135deg, ${acento}, #ffffff)`
                  : 'linear-gradient(135deg, #1e293b, #334155)',
              }}
            >
              {!revelada && <span className="text-4xl sm:text-5xl font-display font-extrabold text-white/40">?</span>}
              {revelada && yaSeleccionada && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-900">
                  <span className="text-3xl sm:text-4xl font-display font-extrabold">+{t.puntos}</span>
                  <span className="text-xs font-bold uppercase">puntos</span>
                </div>
              )}
              {revelada && !yaSeleccionada && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-3xl text-white/30">?</span>
                </div>
              )}
            </button>
          );
        })}
      </div>
      {resultado && (
        <div className="pt-4">
          <p className="text-lg">Ganaste <span className="font-bold text-2xl" style={{ color: acento }}>+{resultado.seleccionada.puntos}</span> puntos extra</p>
        </div>
      )}
    </div>
  );
}

function PantallaResultado({ resultado, acento, onSalir, onReintentar, puedeReintentar }) {
  const total = resultado?.puntaje_total ?? 0;
  const bonus = resultado?.puntaje_bonus ?? 0;
  const correctas = resultado?.respuestas_correctas ?? 0;
  const incorrectas = resultado?.respuestas_incorrectas ?? 0;
  const totalPreg = resultado?.preguntas_totales ?? 0;
  return (
    <div className="text-white text-center space-y-6 max-w-2xl mx-auto">
      <HiBadgeCheck className="w-16 h-16 mx-auto" style={{ color: acento }} />
      <h2 className="text-4xl sm:text-5xl font-display font-extrabold drop-shadow-lg" style={{ color: acento }}>
        FINAL
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <StatBox label="Puntaje" valor={total} acento={acento} grande />
        <StatBox label="Correctas" valor={`${correctas}/${totalPreg}`} acento="#34d399" />
        <StatBox label="Incorrectas" valor={incorrectas} acento="#fb7185" />
        <StatBox label="Bonus" valor={bonus > 0 ? `+${bonus}` : 0} acento="#fbbf24" />
      </div>
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-center pt-3">
        {puedeReintentar && (
          <button onClick={onReintentar} className="px-6 py-3 rounded-xl font-display font-bold bg-white/15 border border-white/30 hover:bg-white/25">
            Volver a intentar
          </button>
        )}
        <button onClick={onSalir} className="px-6 py-3 rounded-xl font-display font-bold shadow-xl" style={{ background: acento, color: '#0f172a' }}>
          Salir
        </button>
      </div>
    </div>
  );
}

function StatBox({ label, valor, acento, grande }) {
  return (
    <div className="rounded-2xl bg-white/10 border border-white/20 p-3 sm:p-4 backdrop-blur">
      <p className="text-xs uppercase tracking-widest text-white/70">{label}</p>
      <p className={`font-display font-extrabold ${grande ? 'text-4xl sm:text-5xl' : 'text-2xl sm:text-3xl'}`} style={{ color: acento }}>{valor}</p>
    </div>
  );
}
