import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { obtenerResultadoTrivia, obtenerRankingTrivia } from '../../services/triviaPublicaService';
import toast from 'react-hot-toast';

export default function TriviaResultado() {
  const [resultado, setResultado] = useState(null);
  const [ranking, setRanking] = useState(null);
  const [cargando, setCargando] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = sessionStorage.getItem('trivia_token');
    if (!token) { navigate('/trivia'); return; }

    const cargar = async () => {
      try {
        const res = await obtenerResultadoTrivia();
        setResultado(res);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900 p-4">
      <div className="max-w-2xl mx-auto pt-8">
        {/* Header */}
        <div className="text-center mb-8 animate-fade-up">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center">
            <span className="text-4xl">{config.mostrar_puntaje && resultado.puntaje_final > 0 ? '🎉' : '📋'}</span>
          </div>
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
              {ranking.map((r) => (
                <div key={r.posicion} className={`flex items-center justify-between p-3 rounded-xl ${r.es_actual ? 'bg-purple-500/30 border border-purple-400/50' : 'bg-white/5'}`}>
                  <div className="flex items-center gap-3">
                    <span className="text-lg w-8 text-center">{r.posicion === 1 ? '🥇' : r.posicion === 2 ? '🥈' : r.posicion === 3 ? '🥉' : r.posicion}</span>
                    <span className={`text-sm font-medium ${r.es_actual ? 'text-purple-200' : 'text-white/70'}`}>{r.nombre} {r.es_actual && '(Tu)'}</span>
                  </div>
                  <span className="text-white font-bold">{r.puntaje.toFixed(1)}</span>
                </div>
              ))}
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
