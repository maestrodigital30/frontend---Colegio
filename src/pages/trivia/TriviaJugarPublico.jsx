import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { obtenerPreguntaTrivia, responderPreguntaTrivia, obtenerPartidaTrivia } from '../../services/triviaPublicaService';
import toast from 'react-hot-toast';

export default function TriviaJugarPublico() {
  const [partida, setPartida] = useState(null);
  const [pregunta, setPregunta] = useState(null);
  const [timer, setTimer] = useState(0);
  const [respondiendo, setRespondiendo] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [puntaje, setPuntaje] = useState(0);
  const [cargando, setCargando] = useState(true);
  const timerRef = useRef(null);
  const feedbackTimeoutRef = useRef(null);
  const navigate = useNavigate();

  const limpiarTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }, []);

  const iniciarTimer = useCallback((tiempo) => {
    limpiarTimer();
    setTimer(tiempo);
    timerRef.current = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) { clearInterval(timerRef.current); timerRef.current = null; return 0; }
        return prev - 1;
      });
    }, 1000);
  }, [limpiarTimer]);

  const cargarPregunta = useCallback(async () => {
    try {
      const data = await obtenerPreguntaTrivia();
      setPregunta(data);
      setFeedback(null);
      setRespondiendo(false);
      iniciarTimer(data.tiempo_por_pregunta);
    } catch (error) {
      if (error.response?.status === 400) {
        navigate('/trivia/resultado');
      } else {
        toast.error('Error al cargar pregunta');
      }
    }
  }, [iniciarTimer, navigate]);

  useEffect(() => {
    const token = sessionStorage.getItem('trivia_token');
    if (!token) { navigate('/trivia'); return; }

    const cargarDatos = async () => {
      try {
        const partidaData = await obtenerPartidaTrivia();
        setPartida(partidaData);
        setPuntaje(partidaData.puntaje_acumulado || 0);
        await cargarPregunta();
      } catch {
        toast.error('Error al cargar trivia');
        navigate('/trivia');
      } finally {
        setCargando(false);
      }
    };
    cargarDatos();

    return () => {
      limpiarTimer();
      if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
    };
  }, []);

  // Auto-submit when timer hits 0
  const timerHitZeroRef = useRef(false);
  useEffect(() => {
    if (timer === 0 && pregunta && !respondiendo && !feedback && !timerHitZeroRef.current) {
      timerHitZeroRef.current = true;
      handleResponder(null);
    }
  }, [timer]);

  const handleResponder = async (idOpcion) => {
    if (respondiendo) return;
    setRespondiendo(true);
    limpiarTimer();
    timerHitZeroRef.current = false;

    try {
      const resultado = await responderPreguntaTrivia(idOpcion);
      setFeedback({ es_correcta: resultado.es_correcta, id_opcion: idOpcion });
      setPuntaje(resultado.puntaje_acumulado);

      feedbackTimeoutRef.current = setTimeout(() => {
        if (resultado.es_ultima_pregunta) {
          navigate('/trivia/resultado');
        } else {
          cargarPregunta();
        }
      }, 1500);
    } catch (error) {
      toast.error('Error al enviar respuesta');
      setRespondiendo(false);
    }
  };

  if (cargando) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/70 font-medium">Cargando trivia...</p>
        </div>
      </div>
    );
  }

  if (!pregunta) return null;

  const progreso = (pregunta.pregunta_numero / pregunta.total_preguntas) * 100;
  const timerPorcentaje = (timer / (pregunta.tiempo_por_pregunta || 20)) * 100;
  const coloresOpciones = [
    'from-blue-500 to-blue-600',
    'from-secondary-500 to-secondary-600',
    'from-primary-500 to-primary-600',
    'from-rose-500 to-rose-600',
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900 p-4 flex flex-col">
      {/* Header */}
      <div className="max-w-3xl mx-auto w-full mb-6">
        <div className="flex items-center justify-between text-white/70 text-sm mb-2">
          <span>{partida?.nombre_tema}</span>
          <span className="font-mono font-bold text-white">{puntaje.toFixed(1)} pts</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-white/50 text-xs">{pregunta.pregunta_numero}/{pregunta.total_preguntas}</span>
          <div className="flex-1 bg-white/10 rounded-full h-2">
            <div className="bg-gradient-to-r from-purple-400 to-indigo-400 h-2 rounded-full transition-all duration-500" style={{ width: `${progreso}%` }} />
          </div>
        </div>
      </div>

      {/* Timer */}
      <div className="flex justify-center mb-6">
        <div className="relative w-24 h-24">
          <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="42" stroke="rgba(255,255,255,0.1)" strokeWidth="8" fill="none" />
            <circle cx="50" cy="50" r="42" stroke={timer <= 5 ? '#ef4444' : 'var(--color-primary)'} strokeWidth="8" fill="none" strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 42}`}
              strokeDashoffset={`${2 * Math.PI * 42 * (1 - timerPorcentaje / 100)}`}
              className="transition-all duration-1000" />
          </svg>
          <span className={`absolute inset-0 flex items-center justify-center text-3xl font-bold ${timer <= 5 ? 'text-red-400 animate-pulse' : 'text-white'}`}>
            {timer}
          </span>
        </div>
      </div>

      {/* Question */}
      <div className="max-w-3xl mx-auto w-full flex-1 flex flex-col">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-6 border border-white/10">
          <h2 className="text-xl font-bold text-white text-center">{pregunta.texto_pregunta}</h2>
        </div>

        {/* Options */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {pregunta.opciones.map((o, i) => {
            let extraClasses = '';
            if (feedback) {
              if (feedback.id_opcion === o.id) {
                extraClasses = feedback.es_correcta ? 'ring-4 ring-secondary-400 scale-[1.02]' : 'ring-4 ring-red-400 opacity-70';
              } else {
                extraClasses = 'opacity-40';
              }
            }
            return (
              <button key={o.id} onClick={() => handleResponder(o.id)} disabled={respondiendo || !!feedback}
                className={`p-4 rounded-xl bg-gradient-to-r ${coloresOpciones[i]} text-white font-medium text-sm hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:cursor-not-allowed ${extraClasses}`}>
                <span className="font-bold mr-2">{String.fromCharCode(65 + i)})</span>
                {o.texto_opcion}
              </button>
            );
          })}
        </div>

        {feedback && !feedback.id_opcion && (
          <div className="text-center mt-4">
            <span className="text-primary-400 font-medium text-sm">Tiempo agotado</span>
          </div>
        )}
      </div>
    </div>
  );
}
