import { useState, useEffect, useRef } from 'react';
import { BrowserQRCodeReader } from '@zxing/browser';
import apiClient from '../../services/apiClient';
import { useAuth } from '../../features/auth/AuthContext';
import { ESTADOS_ASISTENCIA } from '../../utils/constants';
import Boton from '../../components/common/Boton';
import InputCampo from '../../components/common/InputCampo';
import { fechaHoy, formatearFecha } from '../../utils/formatters';
import toast from 'react-hot-toast';
import { FiCamera, FiCameraOff, FiChevronDown, FiChevronRight } from 'react-icons/fi';

export default function AsistenciaDocentePage() {
  const { usuario } = useAuth();
  const [cursos, setCursos] = useState([]);
  const [cursoSel, setCursoSel] = useState('');
  const [fecha, setFecha] = useState(fechaHoy());
  const [alumnos, setAlumnos] = useState([]);
  const [registros, setRegistros] = useState({});
  const [historial, setHistorial] = useState([]);
  const [vista, setVista] = useState('registro');
  const [modoQr, setModoQr] = useState(true);
  const [ultimoEscaneado, setUltimoEscaneado] = useState(null);
  const [escaneandoCamara, setEscaneandoCamara] = useState(false);
  const [sesionesExpandidas, setSesionesExpandidas] = useState(new Set());
  const qrInputRef = useRef(null);
  const videoRef = useRef(null);
  const controlsRef = useRef(null);
  const ultimoQrProcesado = useRef({ valor: '', timestamp: 0 });
  const escanearQrRef = useRef(null);

  useEffect(() => {
    apiClient.get('/cursos').then(({ data }) => setCursos(data)).catch(() => {});
  }, []);

  const cargarSesion = async () => {
    if (!cursoSel || !fecha) return;
    try {
      const { data } = await apiClient.get(`/asistencia/sesion?id_curso=${cursoSel}&fecha=${fecha}`);
      const registrosMap = {};
      if (data?.tbl_registros_asistencia) {
        data.tbl_registros_asistencia.forEach(r => { registrosMap[r.id_alumno] = r.estado_asistencia; });
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

  useEffect(() => { if (cursoSel && fecha) cargarSesion(); }, [cursoSel, fecha]);

  useEffect(() => {
    if (cursoSel && vista === 'historial') {
      apiClient.get(`/asistencia/historial/${cursoSel}`).then(({ data }) => setHistorial(data)).catch(() => setHistorial([]));
    }
  }, [cursoSel, vista]);

  const cambiarEstado = (idAlumno, estado) => {
    setRegistros(prev => ({ ...prev, [idAlumno]: estado }));
  };

  const guardarAsistencia = async () => {
    if (!cursoSel) return toast.error('Seleccione un curso');
    const curso = cursos.find(c => c.id === parseInt(cursoSel));
    const regs = alumnos.map(a => ({
      id_alumno: a.id,
      estado_asistencia: registros[a.id] || ESTADOS_ASISTENCIA.AUSENTE,
    }));
    try {
      await apiClient.post('/asistencia/manual', {
        id_curso: parseInt(cursoSel),
        id_docente: usuario.id_perfil_docente,
        id_periodo_escolar: curso?.id_periodo_escolar,
        fecha,
        registros: regs,
      });
      toast.success('Asistencia guardada');
      cargarSesion();
    } catch (err) { toast.error(err.response?.data?.error || 'Error'); }
  };

  const escanearQr = async (valorQr) => {
    if (!cursoSel || !fecha) return toast.error('Seleccione curso y fecha');
    const curso = cursos.find(c => c.id === parseInt(cursoSel));
    const nombreCurso = curso ? `${curso.nombre} - ${curso.grado || ''} ${curso.seccion || ''}`.trim() : '';
    try {
      const { data } = await apiClient.post('/asistencia/qr', {
        id_curso: parseInt(cursoSel),
        id_periodo_escolar: curso?.id_periodo_escolar,
        fecha,
        valor_qr: valorQr,
      });
      const horaRegistro = new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
      setUltimoEscaneado({ exito: true, alumno: data.alumno, curso: nombreCurso, hora: horaRegistro, fecha });
      toast.success(
        (t) => (
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 bg-secondary-100 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-secondary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            </div>
            <div>
              <p className="font-semibold text-slate-800">Asistencia Registrada</p>
              <p className="text-sm font-bold text-black">{data.alumno.nombres} {data.alumno.apellidos}</p>
              <p className="text-xs text-slate-400 mt-0.5">{nombreCurso} &bull; {horaRegistro}</p>
            </div>
          </div>
        ),
        { duration: 4000, style: { maxWidth: '400px' } }
      );
      cargarSesion();
    } catch (err) {
      if (err.response?.status === 409) {
        setUltimoEscaneado({ exito: false, mensaje: 'Ya registrado', alumno: err.response.data.alumno });
        toast.error('Ya registrado');
      } else {
        setUltimoEscaneado({ exito: false, mensaje: err.response?.data?.error || 'Error' });
        toast.error(err.response?.data?.error || 'QR no válido');
      }
    }
  };

  const handleQrKeyDown = (e) => {
    if (e.key === 'Enter') {
      const valor = e.target.value.trim();
      if (valor) {
        escanearQr(valor);
        e.target.value = '';
      }
    }
  };

  // Mantener ref actualizada para evitar closures obsoletos en el callback de la cámara
  escanearQrRef.current = escanearQr;

  const detenerCamara = () => {
    if (controlsRef.current) {
      controlsRef.current.stop();
      controlsRef.current = null;
    }
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setEscaneandoCamara(false);
  };

  const iniciarCamara = async () => {
    if (!cursoSel || !fecha) {
      toast.error('Seleccione curso y fecha primero');
      return;
    }
    try {
      const codeReader = new BrowserQRCodeReader();
      setEscaneandoCamara(true);
      // Esperar a que el elemento video se renderice
      await new Promise(resolve => setTimeout(resolve, 150));

      const controls = await codeReader.decodeFromVideoDevice(
        undefined,
        videoRef.current,
        (result) => {
          if (result) {
            const valor = result.getText();
            const ahora = Date.now();
            // Cooldown: no procesar el mismo QR dentro de 3 segundos
            if (
              valor !== ultimoQrProcesado.current.valor ||
              ahora - ultimoQrProcesado.current.timestamp > 3000
            ) {
              ultimoQrProcesado.current = { valor, timestamp: ahora };
              escanearQrRef.current(valor);
            }
          }
        }
      );
      controlsRef.current = controls;
    } catch (err) {
      console.error('Error al acceder a la cámara:', err);
      toast.error('No se pudo acceder a la cámara. Verifique los permisos.');
      setEscaneandoCamara(false);
    }
  };

  // Limpiar cámara al cambiar de modo o desmontar componente
  useEffect(() => {
    if (!modoQr) detenerCamara();
    return () => detenerCamara();
  }, [modoQr]);

  const coloresEstado = {
    presente: 'bg-emerald-200 text-emerald-800 border border-emerald-300 font-bold',
    ausente: 'bg-rose-200 text-rose-800 border border-rose-300 font-bold',
    tardanza: 'bg-amber-200 text-amber-800 border border-amber-300 font-bold',
  };

  return (
    <div className="animate-fade-up" style={{ fontSize: '115%' }}>
      <div className="mb-6">
        <p className="text-xs font-display font-bold uppercase tracking-widest mb-1" style={{ color: '#0060FF' }}>Control</p>
        <h1 className="text-3xl font-display font-bold text-black">Asistencia</h1>
      </div>

      <div className="flex flex-wrap gap-4 mb-6">
        <div className="w-64">
          <InputCampo label="Curso" name="curso" type="select" value={cursoSel} onChange={(e) => setCursoSel(e.target.value)} options={cursos.filter(c => c.estado === 1).map(c => ({ value: c.id.toString(), label: `${c.nombre} - ${c.grado || ''} ${c.seccion || ''}` }))} />
        </div>
        <div className="w-48">
          <InputCampo label="Fecha" name="fecha" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
        </div>
        <div className="flex items-end gap-2">
          <Boton tipo={modoQr ? 'primary' : 'outline'} onClick={() => { setVista('registro'); setModoQr(true); setTimeout(() => qrInputRef.current?.focus(), 100); }}>QR</Boton>
          <Boton tipo={vista === 'registro' && !modoQr ? 'primary' : 'outline'} onClick={() => { setVista('registro'); setModoQr(false); }}>Manual</Boton>
          <Boton tipo={vista === 'historial' ? 'primary' : 'outline'} onClick={() => setVista('historial')}>Historial</Boton>
        </div>
      </div>

      {vista === 'registro' && modoQr && (
        <div className="glass-card-static p-6 mb-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-display font-semibold text-slate-800">Modo Escáner QR</h3>
              <p className="text-sm text-slate-500">Escanee el carnet del alumno con la cámara o ingrese el código manualmente</p>
            </div>
            <Boton
              tipo={escaneandoCamara ? 'danger' : 'secondary'}
              onClick={escaneandoCamara ? detenerCamara : iniciarCamara}
              className="flex items-center gap-2 whitespace-nowrap"
            >
              {escaneandoCamara ? (
                <><FiCameraOff className="w-4 h-4" /> Detener Cámara</>
              ) : (
                <><FiCamera className="w-4 h-4" /> Escanear Carnet</>
              )}
            </Boton>
          </div>

          {escaneandoCamara && (
            <div className="mb-4 flex justify-center">
              <div className="relative w-full max-w-md rounded-xl overflow-hidden border-2 border-secondary-400 shadow-lg">
                <video ref={videoRef} className="w-full" muted playsInline />
                <div className="absolute inset-0 border-4 border-secondary-400/30 rounded-xl pointer-events-none" />
                <div className="absolute top-2 left-2 bg-secondary-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1 animate-pulse">
                  <span className="w-2 h-2 bg-white rounded-full inline-block" />
                  Escaneando...
                </div>
              </div>
            </div>
          )}

          <input
            ref={qrInputRef}
            type="text"
            placeholder="O ingrese el código QR manualmente y presione Enter..."
            onKeyDown={handleQrKeyDown}
            className="w-full px-4 py-3 border-2 border-primary/50 rounded-lg text-lg focus:outline-none focus:border-primary bg-slate-50 text-slate-700"
            autoFocus={!escaneandoCamara}
          />

          {ultimoEscaneado && (
            <div className={`mt-3 p-4 rounded-lg transition-all ${ultimoEscaneado.exito ? 'bg-secondary-50 border border-secondary-200' : 'bg-rose-50 border border-rose-200'}`}>
              {ultimoEscaneado.exito ? (
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-10 h-10 bg-secondary-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-secondary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-secondary-700">Asistencia registrada correctamente</p>
                    <p className="text-sm text-secondary-600">{ultimoEscaneado.alumno.nombres} {ultimoEscaneado.alumno.apellidos}</p>
                    <p className="text-xs text-secondary-500 mt-0.5">{ultimoEscaneado.curso} &bull; {ultimoEscaneado.hora}</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-10 h-10 bg-rose-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-rose-700">{ultimoEscaneado.mensaje}</p>
                    {ultimoEscaneado.alumno && <p className="text-sm text-rose-500">{ultimoEscaneado.alumno.nombres} {ultimoEscaneado.alumno.apellidos}</p>}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {vista === 'registro' && !modoQr && (
        <div className="rounded-2xl bg-white overflow-hidden" style={{ border: '2px solid #87CEEB' }}>
          {alumnos.length === 0 ? (
            <p className="text-black text-center py-8 font-bold">Seleccione un curso</p>
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
          {historial.length === 0 ? (
            <p className="text-slate-500 text-center py-8">No hay registros</p>
          ) : (
            historial.map(s => {
              const regs = s.tbl_registros_asistencia || [];
              const p = regs.filter(r => r.estado_asistencia === ESTADOS_ASISTENCIA.PRESENTE).length;
              const au = regs.filter(r => r.estado_asistencia === ESTADOS_ASISTENCIA.AUSENTE).length;
              const t = regs.filter(r => r.estado_asistencia === ESTADOS_ASISTENCIA.TARDANZA).length;
              const expandida = sesionesExpandidas.has(s.id);
              const toggleExpandir = () => {
                setSesionesExpandidas(prev => {
                  const nuevo = new Set(prev);
                  if (nuevo.has(s.id)) nuevo.delete(s.id);
                  else nuevo.add(s.id);
                  return nuevo;
                });
              };

              return (
                <div key={s.id} className="glass-card-static overflow-hidden">
                  <button onClick={toggleExpandir} className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors text-left">
                    <div className="flex items-center gap-3">
                      {expandida ? <FiChevronDown className="w-5 h-5 text-slate-400" /> : <FiChevronRight className="w-5 h-5 text-slate-400" />}
                      <span className="font-display font-bold text-black">{formatearFecha(s.fecha_asistencia)}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-200 text-emerald-800 border border-emerald-300 font-bold">{p} Presentes</span>
                      <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-rose-200 text-rose-800 border border-rose-300 font-bold">{au} Ausentes</span>
                      <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-amber-200 text-amber-800 border border-amber-300 font-bold">{t} Tardanzas</span>
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
                                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${coloresEstado[r.estado_asistencia]}`}>
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
