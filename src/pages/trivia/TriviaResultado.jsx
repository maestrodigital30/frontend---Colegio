import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { obtenerResultadoTrivia, obtenerRankingTrivia } from '../../services/triviaPublicaService';
import audioService from '../../services/audioService';
import useAudioCleanup from '../../hooks/useAudioCleanup';
import AvatarAlumno from '../../components/alumnos/AvatarAlumno';
import toast from 'react-hot-toast';

function identidadDeRankingEntry(e) {
  if (e?.identidad_visual) {
    return {
      avatar: e.identidad_visual.avatar || null,
      personaje: e.identidad_visual.personaje || null,
      marco: e.identidad_visual.marco || null,
      color_personal: e.identidad_visual.color_personal || null,
    };
  }
  if (e?.identidad_publica) {
    return {
      avatar: e.identidad_publica.avatar_publico || null,
      personaje: e.identidad_publica.personaje_publico || null,
      marco: e.identidad_publica.marco_publico || null,
      color_publico: e.identidad_publica.color_publico || null,
    };
  }
  return null;
}

export default function TriviaResultado() {
  const [resultado, setResultado] = useState(null);
  const [ranking, setRanking] = useState(null);
  const [cargando, setCargando] = useState(true);
  const navigate = useNavigate();

  useAudioCleanup();

  useEffect(() => {
    const token = sessionStorage.getItem('trivia_token');
    if (!token) { navigate('/trivia'); return; }

    // Detener música al montar
    audioService.stopMusic();

    const cargar = async () => {
      try {
        const res = await obtenerResultadoTrivia();
        setResultado(res);
        // Sonido de victoria si hay puntaje > 0 o flag ganador
        const puntaje = res?.puntaje_final ?? 0;
        if (res?.es_ganador || puntaje > 0) {
          audioService.playSfx('victoria');
        }
        if (res.config_visualizacion.mostrar_ranking) {
          try { setRanking(await obtenerRankingTrivia()); } catch { /* not available */ }
        }
      } catch {
        toast.error('Error al cargar resultados');
        navigate('/trivia');
      } finally {
        setCargando(false);
      }
    };
    cargar();
  }, [navigate]);

  const salir = () => {
    sessionStorage.removeItem('trivia_token');
    sessionStorage.removeItem('trivia_data');
    navigate('/trivia');
  };

  if (cargando) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900">
        <div className="w-12 h-12 border-4 border-purple-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!resultado) return null;
  const { config_visualizacion: config } = resultado;
  const identidad = (resultado.avatar_publico || resultado.personaje_publico || resultado.marco_publico || resultado.color_publico)
    ? {
        avatar: resultado.avatar_publico,
        personaje: resultado.personaje_publico,
        marco: resultado.marco_publico,
        color_publico: resultado.color_publico,
      }
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900 p-4">
      <div className="max-w-2xl mx-auto pt-8">
        {/* Header */}
        <div className="text-center mb-8 animate-fade-up">
          {identidad ? (
            <div className="flex justify-center mb-4">
              <AvatarAlumno identidad={identidad} size="lg" />
            </div>
          ) : (
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center">
              <span className="text-4xl">{config.mostrar_puntaje && resultado.puntaje_final > 0 ? '🎉' : '📋'}</span>
            </div>
          )}
          <h1 className="text-3xl font-display font-bold text-white">Trivia Completada</h1>
          <p className="text-white/60 mt-1">{resultado.nombre_alumno}</p>
        </div>

        {/* Fallback when no checkboxes enabled */}
        {resultado.mensaje_sin_datos && (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-4 border border-white/10 text-center animate-fade-up">
            <p className="text-white/70">{resultado.mensaje_sin_datos}</p>
          </div>
        )}

        {/* Puntaje */}
        {config.mostrar_puntaje && (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-4 border border-white/10 text-center animate-fade-up" style={{ animationDelay: '0.1s' }}>
            <p className="text-white/50 text-sm uppercase tracking-wider mb-1">Puntaje Final</p>
            <p className="text-5xl font-bold text-white">{resultado.puntaje_final?.toFixed(1)}</p>
            <p className="text-white/40 text-xs mt-2">Intento {resultado.intentos_usados} de {resultado.max_intentos}</p>
          </div>
        )}

        {/* Resumen */}
        {config.mostrar_resumen && resultado.resumen && (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-4 border border-white/10 animate-fade-up" style={{ animationDelay: '0.2s' }}>
            <h2 className="text-lg font-bold text-white mb-4">Resumen de Respuestas</h2>
            <div className="space-y-3">
              {resultado.resumen.map((r, i) => (
                <div key={i} className={`p-3 rounded-xl ${r.es_correcta ? 'bg-secondary-500/20 border border-secondary-500/30' : 'bg-red-500/20 border border-red-500/30'}`}>
                  <p className="text-white text-sm font-medium mb-1">{i + 1}. {r.texto_pregunta}</p>
                  <div className="flex flex-col gap-1 text-xs">
                    <span className={r.es_correcta ? 'text-secondary-300' : 'text-red-300'}>Tu respuesta: {r.respuesta_alumno}</span>
                    {!r.es_correcta && <span className="text-secondary-300">Correcta: {r.respuesta_correcta}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Ranking */}
        {config.mostrar_ranking && ranking && (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-4 border border-white/10 animate-fade-up" style={{ animationDelay: '0.3s' }}>
            <h2 className="text-lg font-bold text-white mb-4">Ranking</h2>
            <div className="space-y-2">
              {ranking.map((r) => {
                const identidadRow = identidadDeRankingEntry(r);
                return (
                  <div key={r.posicion} className={`flex items-center justify-between p-3 rounded-xl ${r.es_actual ? 'bg-purple-500/30 border border-purple-400/50' : 'bg-white/5'}`}>
                    <div className="flex items-center gap-3">
                      <span className="text-lg w-8 text-center">{r.posicion === 1 ? '🥇' : r.posicion === 2 ? '🥈' : r.posicion === 3 ? '🥉' : r.posicion}</span>
                      {identidadRow && <AvatarAlumno identidad={identidadRow} size="sm" />}
                      <span className={`text-sm font-medium ${r.es_actual ? 'text-purple-200' : 'text-white/70'}`}>{r.nombre} {r.es_actual && '(Tu)'}</span>
                    </div>
                    <span className="text-white font-bold">{r.puntaje.toFixed(1)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 justify-center mt-8 animate-fade-up" style={{ animationDelay: '0.4s' }}>
          {resultado.puede_reintentar && (
            <button onClick={salir} className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-bold text-sm hover:from-purple-400 hover:to-indigo-500 transition-all">
              Intentar de nuevo
            </button>
          )}
          <button onClick={salir} className="px-6 py-3 rounded-xl bg-white/10 text-white/70 font-medium text-sm hover:bg-white/20 transition-all border border-white/10">
            Volver al inicio
          </button>
        </div>
      </div>
    </div>
  );
}
