import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import apiClient from '../../services/apiClient';
import InputCampo from '../../components/common/InputCampo';
import AvatarAlumno from '../../components/alumnos/AvatarAlumno';
import { formatearFechaHora } from '../../utils/formatters';
import { HiX, HiChevronRight } from 'react-icons/hi';

function identidadDeRanking(entry) {
  const iv = entry?.tbl_alumno_identidad_visual;
  if (!iv) return null;
  return {
    avatar: iv.avatar || null,
    personaje: iv.personaje || null,
    marco: iv.marco || null,
    color_personal: iv.color_personal || null,
  };
}

export default function RankingPage() {
  const [cursos, setCursos] = useState([]);
  const [cursoSel, setCursoSel] = useState('');
  const [ranking, setRanking] = useState([]);
  const [modalAlumno, setModalAlumno] = useState(null);
  const [historial, setHistorial] = useState([]);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    apiClient.get('/cursos').then(({ data }) => setCursos(data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!cursoSel) return;
    apiClient.get(`/trivia/ranking/${cursoSel}`).then(({ data }) => setRanking(data)).catch(() => setRanking([]));
  }, [cursoSel]);

  const verHistorial = async (alumno) => {
    setModalAlumno(alumno);
    setCargando(true);
    try {
      const { data } = await apiClient.get(`/trivia/ranking/${cursoSel}/alumno/${alumno.id_alumno}`);
      setHistorial(data);
    } catch {
      setHistorial([]);
    } finally {
      setCargando(false);
    }
  };

  const modalidadLabel = (m) => m === 'individual' ? 'Individual' : m === 'parejas' ? 'Parejas' : 'Grupal';

  return (
    <div className="animate-fade-up">
      <div className="mb-6">
        <p className="text-xs font-display font-medium text-primary-600 uppercase tracking-widest mb-1">Trivia</p>
        <h1 className="text-3xl font-display font-bold text-slate-800">Ranking Trivia</h1>
      </div>

      <div className="w-72 mb-6">
        <InputCampo label="Curso" name="curso" type="select" value={cursoSel} onChange={(e) => setCursoSel(e.target.value)} options={cursos.filter(c => c.estado === 1).map(c => ({ value: c.id.toString(), label: `${c.nombre} - ${c.grado || ''} ${c.seccion || ''}` }))} />
      </div>

      {cursoSel && (
        <div className="glass-card-static">
          {ranking.length === 0 ? (
            <p className="text-slate-400 text-center py-8">No hay datos de ranking</p>
          ) : (
            <div className="divide-y divide-slate-200">
              {ranking.map((r, idx) => (
                <button
                  key={r.id_alumno || idx}
                  onClick={() => verHistorial(r)}
                  className="w-full flex items-center gap-4 px-4 py-3 hover:bg-slate-50 transition-colors text-left"
                >
                  <span className={`text-2xl font-bold w-10 text-center ${idx === 0 ? 'text-yellow-500' : idx === 1 ? 'text-slate-400' : idx === 2 ? 'text-primary-700' : 'text-slate-400'}`}>
                    {idx < 3 ? ['\u{1F947}', '\u{1F948}', '\u{1F949}'][idx] : `#${idx + 1}`}
                  </span>
                  <AvatarAlumno identidad={identidadDeRanking(r)} size="sm" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-800">{r.apellidos}, {r.nombres}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-primary">{(r.puntaje_acumulado || 0).toFixed(1)}</p>
                    <p className="text-xs text-slate-400">puntos</p>
                  </div>
                  <HiChevronRight className="w-4 h-4 text-slate-400" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal historial del alumno - renderizado via portal en body */}
      {modalAlumno && createPortal(
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[9999] flex items-center justify-center p-4" onClick={() => setModalAlumno(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-[95vw] max-w-6xl h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <AvatarAlumno identidad={identidadDeRanking(modalAlumno)} size="md" />
                <div>
                  <h3 className="text-lg font-display font-bold text-slate-800">{modalAlumno.apellidos}, {modalAlumno.nombres}</h3>
                  <p className="text-sm text-slate-500">Total: <span className="font-semibold text-primary">{(modalAlumno.puntaje_acumulado || 0).toFixed(1)} pts</span></p>
                </div>
              </div>
              <button onClick={() => setModalAlumno(null)} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
                <HiX className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 px-6 py-3">
              {cargando ? (
                <div className="flex items-center justify-center py-8 gap-3">
                  <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm text-slate-500">Cargando...</span>
                </div>
              ) : historial.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-8">Sin historial</p>
              ) : (
                <div className="space-y-2">
                  {historial.map((h) => (
                    <div key={h.id_partida} className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 bg-slate-50">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-700 truncate">{h.nombre_tema}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${h.modalidad === 'individual' ? 'bg-secondary-50 text-secondary-600' : 'bg-accent-50 text-accent-600'}`}>
                            {modalidadLabel(h.modalidad)}
                          </span>
                          <span className="text-xs text-slate-400">{formatearFechaHora(h.fecha)}</span>
                        </div>
                      </div>
                      <span className={`text-sm font-bold ${h.puntaje >= 0 ? 'text-secondary-600' : 'text-rose-600'}`}>
                        {h.puntaje >= 0 ? '+' : ''}{h.puntaje.toFixed(1)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
