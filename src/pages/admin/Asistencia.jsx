import { useState, useEffect, useMemo } from 'react';
import apiClient from '../../services/apiClient';
import Boton from '../../components/common/Boton';
import InputCampo from '../../components/common/InputCampo';
import RangoFechasPicker from '../../components/common/RangoFechasPicker';
import { ESTADOS_ASISTENCIA } from '../../utils/constants';
import { fechaHoy, formatearFecha } from '../../utils/formatters';
import { exportarExcel, exportarPDF } from '../../utils/exportAsistencia';
import toast from 'react-hot-toast';
import { FiChevronDown, FiChevronRight, FiFileText, FiDownload } from 'react-icons/fi';

export default function AsistenciaPage() {
  const [cursos, setCursos] = useState([]);
  const [sesionesExpandidas, setSesionesExpandidas] = useState(new Set());
  const [cursoSel, setCursoSel] = useState('');
  const [fecha, setFecha] = useState(fechaHoy());
  const [alumnos, setAlumnos] = useState([]);
  const [registros, setRegistros] = useState({});
  const [historial, setHistorial] = useState([]);
  const [vista, setVista] = useState('registro');
  const [rango, setRango] = useState(undefined);
  const [alumnoSel, setAlumnoSel] = useState('');

  useEffect(() => {
    apiClient.get('/cursos').then(({ data }) => setCursos(data)).catch(() => {});
  }, []);

  const cargarSesion = async () => {
    if (!cursoSel || !fecha) return;
    try {
      const { data } = await apiClient.get(`/asistencia/sesion?id_curso=${cursoSel}&fecha=${fecha}`);
      const registrosMap = {};
      if (data?.tbl_registros_asistencia) {
        data.tbl_registros_asistencia.forEach(r => {
          registrosMap[r.id_alumno] = r.estado_asistencia;
        });
      }
      setRegistros(registrosMap);
    } catch {
      setRegistros({});
    }

    try {
      const { data } = await apiClient.get('/alumnos');
      const alumnosCurso = data.filter(a => a.estado === 1 && a.tbl_alumnos_cursos?.some(ac => ac.id_curso === parseInt(cursoSel) && ac.estado === 1));
      setAlumnos(alumnosCurso);
    } catch { setAlumnos([]); }
  };

  const cargarHistorial = async () => {
    if (!cursoSel) return;
    try {
      const { data } = await apiClient.get(`/asistencia/historial/${cursoSel}`);
      setHistorial(data);
    } catch { setHistorial([]); }
  };

  const fechaLocalAISO = (d) => {
    const x = new Date(d);
    return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
  };

  const historialFiltrado = useMemo(() => {
    let base = historial;
    if (rango?.from && rango?.to) {
      const desde = fechaLocalAISO(rango.from);
      const hasta = fechaLocalAISO(rango.to);
      base = base.filter((s) => {
        const f = (s.fecha_asistencia || '').slice(0, 10);
        return f >= desde && f <= hasta;
      });
    }
    if (alumnoSel) {
      const idAlumno = parseInt(alumnoSel);
      base = base
        .map((s) => {
          const regs = (s.tbl_registros_asistencia || []).filter((r) => r.id_alumno === idAlumno);
          return regs.length > 0 ? { ...s, tbl_registros_asistencia: regs } : null;
        })
        .filter(Boolean);
    }
    return base;
  }, [historial, rango, alumnoSel]);

  const cursoActual = cursos.find((c) => c.id === parseInt(cursoSel));
  const nombreCursoCompleto = cursoActual
    ? `${cursoActual.nombre}${cursoActual.grado ? ` - ${cursoActual.grado}` : ''}${cursoActual.seccion ? ` ${cursoActual.seccion}` : ''}`
    : '';
  const alumnoActual = alumnos.find((a) => a.id === parseInt(alumnoSel));
  const nombreAlumnoCompleto = alumnoActual ? `${alumnoActual.apellidos}, ${alumnoActual.nombres}` : '';

  const manejarExportar = (formato) => {
    if (!cursoActual) return toast.error('Seleccione un curso');
    if (historialFiltrado.length === 0) return toast.error('No hay datos para exportar');
    const meta = {
      cursoNombre: nombreCursoCompleto,
      rango,
      alumnoNombre: nombreAlumnoCompleto || null,
    };
    try {
      if (formato === 'excel') exportarExcel(historialFiltrado, meta);
      else exportarPDF(historialFiltrado, meta);
    } catch (e) {
      console.error(e);
      toast.error('Error al exportar');
    }
  };

  useEffect(() => {
    if (cursoSel && fecha) cargarSesion();
  }, [cursoSel, fecha]);

  useEffect(() => {
    if (cursoSel && vista === 'historial') cargarHistorial();
  }, [cursoSel, vista]);

  const cambiarCurso = (nuevoId) => {
    setCursoSel(nuevoId);
    setAlumnoSel('');
    setRango(undefined);
  };

  const cambiarEstado = (idAlumno, estado) => {
    setRegistros(prev => ({ ...prev, [idAlumno]: estado }));
  };

  const guardarAsistencia = async () => {
    if (!cursoSel) return toast.error('Seleccione un curso');
    const regs = alumnos.map(a => ({
      id_alumno: a.id,
      estado_asistencia: registros[a.id] || ESTADOS_ASISTENCIA.AUSENTE,
    }));

    try {
      await apiClient.post('/asistencia/manual', {
        id_curso: parseInt(cursoSel),
        id_docente: cursoActual?.id_docente,
        id_periodo_escolar: cursoActual?.id_periodo_escolar,
        fecha,
        registros: regs,
      });
      toast.success('Asistencia guardada');
      cargarSesion();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al guardar');
    }
  };

  return (
    <div className="animate-fade-up" style={{ fontSize: '115%' }}>
      <div className="mb-6">
        <p className="text-xs font-display font-bold uppercase tracking-widest mb-1" style={{ color: '#0060FF' }}>Control</p>
        <h1 className="text-3xl font-display font-bold text-black">Asistencia</h1>
      </div>

      <div className="flex flex-wrap gap-4 mb-6">
        <div className="w-64">
          <InputCampo label="Curso" name="curso" type="select" value={cursoSel} onChange={(e) => cambiarCurso(e.target.value)} options={cursos.filter(c => c.estado === 1).map(c => ({ value: c.id.toString(), label: `${c.nombre} - ${c.grado || ''} ${c.seccion || ''}` }))} />
        </div>
        <div className="w-48">
          <InputCampo label="Fecha" name="fecha" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
        </div>
        <div className="flex items-end gap-2">
          <Boton tipo={vista === 'registro' ? 'primary' : 'outline'} onClick={() => setVista('registro')}>Registro</Boton>
          <Boton tipo={vista === 'historial' ? 'primary' : 'outline'} onClick={() => setVista('historial')}>Historial</Boton>
        </div>
      </div>

      {vista === 'registro' && (
        <div className="rounded-2xl bg-white overflow-hidden" style={{ border: '2px solid #87CEEB' }}>
          {alumnos.length === 0 ? (
            <p className="text-black text-center py-8 font-bold">Seleccione un curso para ver los alumnos</p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="px-5 py-3.5 text-left text-xs font-display font-bold text-primary-800 uppercase tracking-wider bg-primary-200">Alumno</th>
                      <th className="px-5 py-3.5 text-center text-xs font-display font-bold text-emerald-800 uppercase tracking-wider bg-emerald-200">Presente</th>
                      <th className="px-5 py-3.5 text-center text-xs font-display font-bold text-amber-800 uppercase tracking-wider bg-amber-200">Tardanza</th>
                      <th className="px-5 py-3.5 text-center text-xs font-display font-bold text-rose-800 uppercase tracking-wider bg-rose-200">Ausente</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {alumnos.map(a => (
                      <tr key={a.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-5 py-3.5 text-[15px] font-bold text-black whitespace-nowrap">{a.apellidos}, {a.nombres}</td>
                        <td className="px-5 py-3.5 text-center bg-emerald-100">
                          <button onClick={() => cambiarEstado(a.id, ESTADOS_ASISTENCIA.PRESENTE)}
                            className={`px-4 py-1.5 rounded-lg text-xs font-bold border transition-all ${registros[a.id] === ESTADOS_ASISTENCIA.PRESENTE ? 'bg-emerald-400 text-white border-emerald-500 shadow-sm' : 'bg-white text-emerald-700 border-emerald-300 hover:bg-emerald-200'}`}>
                            Presente
                          </button>
                        </td>
                        <td className="px-5 py-3.5 text-center bg-amber-100">
                          <button onClick={() => cambiarEstado(a.id, ESTADOS_ASISTENCIA.TARDANZA)}
                            className={`px-4 py-1.5 rounded-lg text-xs font-bold border transition-all ${registros[a.id] === ESTADOS_ASISTENCIA.TARDANZA ? 'bg-amber-400 text-white border-amber-500 shadow-sm' : 'bg-white text-amber-700 border-amber-300 hover:bg-amber-200'}`}>
                            Tardanza
                          </button>
                        </td>
                        <td className="px-5 py-3.5 text-center bg-rose-100">
                          <button onClick={() => cambiarEstado(a.id, ESTADOS_ASISTENCIA.AUSENTE)}
                            className={`px-4 py-1.5 rounded-lg text-xs font-bold border transition-all ${registros[a.id] === ESTADOS_ASISTENCIA.AUSENTE ? 'bg-rose-400 text-white border-rose-500 shadow-sm' : 'bg-white text-rose-700 border-rose-300 hover:bg-rose-200'}`}>
                            Ausente
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="p-4 flex justify-end border-t border-slate-100">
                <Boton onClick={guardarAsistencia}>Guardar Asistencia</Boton>
              </div>
            </>
          )}
        </div>
      )}

      {vista === 'historial' && (
        <div className="space-y-3">
          {cursoSel && historial.length > 0 && (
            <div className="flex flex-wrap items-center gap-3 p-4 rounded-2xl bg-white border border-slate-200">
              <RangoFechasPicker rango={rango} onChange={setRango} placeholder="Filtrar por rango de fechas" />
              <div className="w-64 -mb-4">
                <InputCampo
                  name="alumnoFiltro"
                  type="select"
                  value={alumnoSel}
                  onChange={(e) => setAlumnoSel(e.target.value)}
                  placeholder="Todos los alumnos"
                  options={[...alumnos]
                    .sort((a, b) => (a.apellidos || '').localeCompare(b.apellidos || '', 'es'))
                    .map((a) => ({ value: a.id.toString(), label: `${a.apellidos}, ${a.nombres}` }))}
                />
              </div>
              <div className="ml-auto flex gap-2">
                <button
                  type="button"
                  onClick={() => manejarExportar('excel')}
                  disabled={historialFiltrado.length === 0}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-sm font-semibold hover:from-emerald-400 hover:to-emerald-500 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <FiDownload className="w-4 h-4" /> Excel
                </button>
                <button
                  type="button"
                  onClick={() => manejarExportar('pdf')}
                  disabled={historialFiltrado.length === 0}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 text-white text-sm font-semibold hover:from-rose-400 hover:to-rose-500 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <FiFileText className="w-4 h-4" /> PDF
                </button>
              </div>
            </div>
          )}

          {historial.length === 0 ? (
            <p className="text-slate-400 text-center py-8">No hay registros de asistencia</p>
          ) : historialFiltrado.length === 0 ? (
            <p className="text-slate-400 text-center py-8">No hay sesiones en el rango seleccionado</p>
          ) : (
            historialFiltrado.map(s => {
              const regs = s.tbl_registros_asistencia || [];
              const presentes = regs.filter(r => r.estado_asistencia === ESTADOS_ASISTENCIA.PRESENTE).length;
              const ausentes = regs.filter(r => r.estado_asistencia === ESTADOS_ASISTENCIA.AUSENTE).length;
              const tardanzas = regs.filter(r => r.estado_asistencia === ESTADOS_ASISTENCIA.TARDANZA).length;
              const estadoAlumno = alumnoSel ? regs[0]?.estado_asistencia : null;
              const expandida = sesionesExpandidas.has(s.id);
              const toggleExpandir = () => {
                setSesionesExpandidas(prev => {
                  const nuevo = new Set(prev);
                  if (nuevo.has(s.id)) nuevo.delete(s.id);
                  else nuevo.add(s.id);
                  return nuevo;
                });
              };

              const coloresEstadoHist = {
                presente: 'bg-emerald-200 text-emerald-800 border border-emerald-300 font-bold',
                ausente: 'bg-rose-200 text-rose-800 border border-rose-300 font-bold',
                tardanza: 'bg-amber-200 text-amber-800 border border-amber-300 font-bold',
              };

              return (
                <div key={s.id} className="glass-card-static overflow-hidden">
                  <button onClick={toggleExpandir} className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors text-left">
                    <div className="flex items-center gap-3">
                      {expandida ? <FiChevronDown className="w-5 h-5 text-slate-400" /> : <FiChevronRight className="w-5 h-5 text-slate-400" />}
                      <span className="font-display font-bold text-black">{formatearFecha(s.fecha_asistencia)}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      {alumnoSel ? (
                        estadoAlumno && (
                          <span className={`text-xs font-medium px-2.5 py-1 rounded-full font-bold ${coloresEstadoHist[estadoAlumno]}`}>
                            {estadoAlumno.charAt(0).toUpperCase() + estadoAlumno.slice(1)}
                          </span>
                        )
                      ) : (
                        <>
                          <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-200 text-emerald-800 border border-emerald-300 font-bold">{presentes} Presentes</span>
                          <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-rose-200 text-rose-800 border border-rose-300 font-bold">{ausentes} Ausentes</span>
                          <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-amber-200 text-amber-800 border border-amber-300 font-bold">{tardanzas} Tardanzas</span>
                        </>
                      )}
                    </div>
                  </button>

                  {expandida && (
                    <div className="border-t border-slate-200">
                      {regs.length === 0 ? (
                        <p className="text-slate-400 text-sm text-center py-4">Sin registros</p>
                      ) : (
                        <table className="min-w-full">
                          <thead>
                            <tr className="border-b border-slate-200">
                              <th className="px-5 py-2.5 text-left text-xs font-display font-bold text-primary-800 uppercase tracking-wider bg-primary-200">Alumno</th>
                              <th className="px-5 py-2.5 text-center text-xs font-display font-bold uppercase tracking-wider bg-emerald-200 text-emerald-800">Estado</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                            {regs
                              .sort((a, b) => (a.tbl_alumnos?.apellidos || '').localeCompare(b.tbl_alumnos?.apellidos || ''))
                              .map(r => {
                                const cellBg = r.estado_asistencia === 'presente' ? 'bg-emerald-100' : r.estado_asistencia === 'ausente' ? 'bg-rose-100' : 'bg-amber-100';
                                return (
                                  <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                                    <td className="px-5 py-2.5 text-sm font-bold text-black">{r.tbl_alumnos?.apellidos}, {r.tbl_alumnos?.nombres}</td>
                                    <td className={`px-5 py-2.5 text-center ${cellBg}`}>
                                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${coloresEstadoHist[r.estado_asistencia]}`}>
                                        {r.estado_asistencia.charAt(0).toUpperCase() + r.estado_asistencia.slice(1)}
                                      </span>
                                    </td>
                                  </tr>
                                );
                              })}
                          </tbody>
                        </table>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
