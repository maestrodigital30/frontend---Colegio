import { useState, useEffect } from 'react';
import apiClient from '../../services/apiClient';
import { TIPOS_CALIFICACION } from '../../utils/constants';
import Boton from '../../components/common/Boton';
import InputCampo from '../../components/common/InputCampo';
import { exportarNotasExcel, exportarNotasPDF } from '../../utils/exportNotas';
import { FiDownload, FiFileText, FiLock } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useAuth } from '../../features/auth/AuthContext';

export default function NotasPage() {
  const { usuario } = useAuth();
  const [cursos, setCursos] = useState([]);
  const [cursoSel, setCursoSel] = useState('');
  const [esquema, setEsquema] = useState(null);
  const [periodoSel, setPeriodoSel] = useState('');
  const [alumnos, setAlumnos] = useState([]);
  const [alumnoSel, setAlumnoSel] = useState('');
  const [notas, setNotas] = useState([]);
  const [formNotas, setFormNotas] = useState({});
  const [formNotaFinal, setFormNotaFinal] = useState({});
  const [guardandoTodo, setGuardandoTodo] = useState(false);

  useEffect(() => {
    apiClient.get('/cursos').then(({ data }) => setCursos(data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!cursoSel) return;
    apiClient.get(`/config-academica/curso/${cursoSel}`).then(({ data }) => {
      setEsquema(data);
      setPeriodoSel('');
    }).catch(() => setEsquema(null));

    apiClient.get('/alumnos').then(({ data }) => {
      const alumnosCurso = data.filter(a => a.estado === 1 && a.tbl_alumnos_cursos?.some(ac => ac.id_curso === parseInt(cursoSel) && ac.estado === 1));
      setAlumnos(alumnosCurso);
    }).catch(() => setAlumnos([]));
  }, [cursoSel]);

  useEffect(() => {
    if (!cursoSel || !periodoSel || !esquema) return;
    const tipoLetras = esquema.tipo_calificacion === TIPOS_CALIFICACION.LETRAS;
    apiClient.get(`/notas?id_curso=${cursoSel}&id_periodo_calificacion=${periodoSel}`).then(({ data }) => {
      setNotas(data);
      const form = {};
      const finals = {};
      data.forEach(n => {
        form[n.id_alumno] = {};
        n.tbl_notas_detalle?.forEach(d => {
          const v = tipoLetras ? d.valor_letra : d.valor_numerico;
          form[n.id_alumno][d.id_componente_nota] = v === null || v === undefined ? '' : v.toString();
        });
        const vFinal = tipoLetras ? n.nota_final_letra : n.nota_final_numerica;
        finals[n.id_alumno] = vFinal === null || vFinal === undefined ? '' : vFinal.toString();
      });
      setFormNotas(form);
      setFormNotaFinal(finals);
    }).catch(() => setNotas([]));
  }, [cursoSel, periodoSel, esquema]);

  const cambiarCurso = (nuevoId) => {
    setCursoSel(nuevoId);
    setAlumnoSel('');
  };

  const cambiarNota = (idAlumno, idComponente, valor) => {
    setFormNotas(prev => ({
      ...prev,
      [idAlumno]: { ...(prev[idAlumno] || {}), [idComponente]: valor },
    }));
  };

  const escalaOpciones = esquema?.escala_letras ? esquema.escala_letras.split(',').map(s => s.trim()).filter(Boolean) : [];
  const esLetras = esquema?.tipo_calificacion === TIPOS_CALIFICACION.LETRAS;

  const buildPayload = (idAlumno) => {
    const comps = esquema.tbl_componentes_nota || [];
    const detalles = comps.map(c => ({
      id_componente_nota: c.id,
      valor_numerico: !esLetras ? parseFloat(formNotas[idAlumno]?.[c.id]) || 0 : null,
      valor_letra: esLetras ? formNotas[idAlumno]?.[c.id] || '' : null,
    }));
    const payload = {
      id_alumno: idAlumno, id_curso: parseInt(cursoSel),
      id_periodo_calificacion: parseInt(periodoSel), id_esquema: esquema.id, detalles,
    };
    if (esLetras) {
      payload.nota_final_letra = formNotaFinal[idAlumno] || null;
      payload.nota_final_manual = true;
    } else {
      const valFinal = parseFloat(formNotaFinal[idAlumno]);
      payload.nota_final_numerica = !isNaN(valFinal) ? valFinal : null;
      payload.nota_final_manual = true;
    }
    return payload;
  };

  const recargarNotas = async () => {
    const { data } = await apiClient.get(`/notas?id_curso=${cursoSel}&id_periodo_calificacion=${periodoSel}`);
    setNotas(data);
  };

  const puedeEditar = () => {
    const curso = cursos.find((c) => c.id === parseInt(cursoSel));
    return !!curso && usuario?.id_perfil_docente === curso.id_docente;
  };

  const guardarNotas = async (idAlumno) => {
    if (!esquema) return;
    if (!puedeEditar()) return toast.error('No tiene permisos para modificar las notas de este curso');
    try {
      await apiClient.post('/notas', buildPayload(idAlumno));
      toast.success('Notas guardadas');
      await recargarNotas();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al guardar');
    }
  };

  const guardarTodas = async () => {
    if (!esquema || alumnos.length === 0) return;
    if (!puedeEditar()) return toast.error('No tiene permisos para modificar las notas de este curso');
    setGuardandoTodo(true);
    let errores = 0;
    for (const a of alumnos) {
      try {
        await apiClient.post('/notas', buildPayload(a.id));
      } catch { errores++; }
    }
    await recargarNotas();
    setGuardandoTodo(false);
    if (errores === 0) toast.success(`Notas de ${alumnos.length} alumnos guardadas`);
    else toast.error(`${errores} de ${alumnos.length} alumnos con error al guardar`);
  };

  const componentes = esquema?.tbl_componentes_nota || [];
  const periodos = esquema?.tbl_periodos_calificacion || [];

  const cursoActual = cursos.find((c) => c.id === parseInt(cursoSel));
  const periodoActual = periodos.find((p) => p.id === parseInt(periodoSel));
  const alumnoActual = alumnos.find((a) => a.id === parseInt(alumnoSel));
  const nombreCursoCompleto = cursoActual
    ? `${cursoActual.nombre}${cursoActual.grado ? ` - ${cursoActual.grado}` : ''}${cursoActual.seccion ? ` ${cursoActual.seccion}` : ''}`
    : '';
  const nombreAlumnoCompleto = alumnoActual ? `${alumnoActual.apellidos}, ${alumnoActual.nombres}` : '';

  const alumnosVisibles = alumnoSel ? alumnos.filter((a) => a.id === parseInt(alumnoSel)) : alumnos;

  const esLectura = !!cursoActual && usuario?.id_perfil_docente !== cursoActual.id_docente;
  const nombreDocenteCurso = cursoActual?.tbl_perfiles_docente
    ? `${cursoActual.tbl_perfiles_docente.nombres} ${cursoActual.tbl_perfiles_docente.apellidos}`
    : '';

  const manejarExportar = (formato) => {
    if (!esquema || !periodoActual || alumnosVisibles.length === 0) {
      return toast.error('No hay datos para exportar');
    }
    const meta = {
      cursoNombre: nombreCursoCompleto,
      periodoNombre: periodoActual.nombre,
      alumnoNombre: nombreAlumnoCompleto || null,
    };
    try {
      const args = { alumnos: alumnosVisibles, componentes, notas, esquema, meta };
      if (formato === 'excel') exportarNotasExcel(args);
      else exportarNotasPDF(args);
    } catch (e) {
      console.error(e);
      toast.error('Error al exportar');
    }
  };

  // Paleta de colores rotativa para columnas de competencias
  const COLORES_COLUMNAS = [
    { header: 'bg-sky-200 text-sky-800', cell: 'bg-sky-100' },
    { header: 'bg-violet-200 text-violet-800', cell: 'bg-violet-100' },
    { header: 'bg-teal-200 text-teal-800', cell: 'bg-teal-100' },
    { header: 'bg-indigo-200 text-indigo-800', cell: 'bg-indigo-100' },
    { header: 'bg-purple-200 text-purple-800', cell: 'bg-purple-100' },
    { header: 'bg-cyan-200 text-cyan-800', cell: 'bg-cyan-100' },
    { header: 'bg-emerald-200 text-emerald-800', cell: 'bg-emerald-100' },
    { header: 'bg-rose-200 text-rose-800', cell: 'bg-rose-100' },
  ];

  return (
    <div className="animate-fade-up" style={{ fontSize: '115%' }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-xs font-display font-medium text-primary-600 uppercase tracking-widest mb-1">Académico</p>
          <h1 className="text-3xl font-display font-bold text-slate-800">Registro de Notas</h1>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 mb-6">
        <div className="w-72">
          <InputCampo label="Curso" name="curso" type="select" value={cursoSel} onChange={(e) => cambiarCurso(e.target.value)} options={cursos.filter(c => c.estado === 1).map(c => ({ value: c.id.toString(), label: `${c.nombre} - ${c.grado || ''} ${c.seccion || ''}` }))} />
        </div>
        {periodos.length > 0 && (
          <div className="w-56">
            <InputCampo label="Periodo" name="periodo" type="select" value={periodoSel} onChange={(e) => setPeriodoSel(e.target.value)} options={periodos.map(p => ({ value: p.id.toString(), label: p.nombre }))} />
          </div>
        )}
        {alumnos.length > 0 && (
          <div className="w-72">
            <InputCampo
              label="Alumno"
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
        )}
      </div>

      {!esquema && cursoSel && (
        <div className="bg-primary-50 border border-primary-200 rounded-xl p-4 text-sm text-primary-600">
          Este curso no tiene esquema de calificación configurado. Vaya a "Config. Académica" primero.
        </div>
      )}

      {esLectura && esquema && periodoSel && (
        <div className="mb-4 flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700">
          <FiLock className="w-5 h-5 shrink-0" />
          <span>
            <strong>Modo lectura.</strong> Este curso pertenece a <strong>{nombreDocenteCurso || 'otro docente'}</strong>. Puede ver y exportar las notas, pero no modificarlas.
          </span>
        </div>
      )}

      {esquema && periodoSel && (
        <div className="glass-card-static overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="px-5 py-3.5 text-left text-xs font-display font-bold uppercase tracking-wider bg-primary-200 text-primary-800">Alumno</th>
                {componentes.map((c, idx) => {
                  const color = COLORES_COLUMNAS[idx % COLORES_COLUMNAS.length];
                  return (
                    <th key={c.id} className={`px-5 py-3.5 text-center text-xs font-display font-bold uppercase tracking-wider ${color.header}`}>
                      {c.nombre_componente}{!esLetras && ` (${c.peso_porcentaje}%)`}
                    </th>
                  );
                })}
                <th className="px-5 py-3.5 text-center text-xs font-display font-bold uppercase tracking-wider bg-amber-200 text-amber-800">Final</th>
                {!esLectura && (
                  <th className="px-5 py-3.5 text-center text-xs font-display font-bold uppercase tracking-wider bg-primary-200 text-primary-800">Acciones</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {alumnosVisibles.map(a => (
                <tr key={a.id} className="hover:bg-slate-50/80 transition-colors duration-200">
                  <td className="px-5 py-3.5 text-[15px] font-bold text-black whitespace-nowrap bg-primary-100">{a.apellidos}, {a.nombres}</td>
                  {componentes.map((c, idx) => {
                    const color = COLORES_COLUMNAS[idx % COLORES_COLUMNAS.length];
                    return (
                      <td key={c.id} className={`px-4 py-2.5 text-center ${color.cell}`}>
                        {esLectura ? (
                          <span className="text-sm font-bold text-black">
                            {formNotas[a.id]?.[c.id] !== undefined && formNotas[a.id]?.[c.id] !== ''
                              ? formNotas[a.id][c.id]
                              : (esLetras ? '-' : '0')}
                          </span>
                        ) : !esLetras ? (
                          <input type="number" min="0" max="20" step="0.1" value={formNotas[a.id]?.[c.id] || ''} onChange={(e) => cambiarNota(a.id, c.id, e.target.value)} className="w-16 px-2 py-1.5 border border-slate-300 rounded-lg text-sm text-center bg-white text-black font-bold focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500" />
                        ) : (
                          <select value={formNotas[a.id]?.[c.id] || ''} onChange={(e) => cambiarNota(a.id, c.id, e.target.value)} className="w-20 px-2 py-1.5 border border-slate-300 rounded-lg text-sm bg-white text-black font-bold focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500">
                            <option value="">-</option>
                            {escalaOpciones.map(op => <option key={op} value={op}>{op}</option>)}
                          </select>
                        )}
                      </td>
                    );
                  })}
                  <td className="px-4 py-2.5 text-center bg-amber-100">
                    {esLectura ? (
                      <span className="text-sm font-bold text-black">
                        {formNotaFinal[a.id] !== undefined && formNotaFinal[a.id] !== ''
                          ? formNotaFinal[a.id]
                          : (esLetras ? '-' : '0')}
                      </span>
                    ) : esLetras ? (
                      <select value={formNotaFinal[a.id] || ''} onChange={(e) => setFormNotaFinal(prev => ({ ...prev, [a.id]: e.target.value }))} className="w-20 px-2 py-1.5 border border-amber-400 rounded-lg text-sm bg-white text-black font-bold focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500">
                        <option value="">-</option>
                        {escalaOpciones.map(op => <option key={op} value={op}>{op}</option>)}
                      </select>
                    ) : (
                      <input type="number" min="0" max="20" step="0.1" value={formNotaFinal[a.id] || ''} onChange={(e) => setFormNotaFinal(prev => ({ ...prev, [a.id]: e.target.value }))} className="w-16 px-2 py-1.5 border border-amber-400 rounded-lg text-sm text-center bg-white text-black font-bold focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500" />
                    )}
                  </td>
                  {!esLectura && (
                    <td className="px-5 py-3.5 text-center bg-primary-100">
                      <Boton tipo="secondary" onClick={() => guardarNotas(a.id)} className="text-xs px-2 py-1">Guardar</Boton>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex flex-wrap justify-end items-center gap-2 mt-4 px-5 pb-4">
            <button
              type="button"
              onClick={() => manejarExportar('excel')}
              disabled={alumnosVisibles.length === 0}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-sm font-semibold hover:from-emerald-400 hover:to-emerald-500 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <FiDownload className="w-4 h-4" /> Excel
            </button>
            <button
              type="button"
              onClick={() => manejarExportar('pdf')}
              disabled={alumnosVisibles.length === 0}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 text-white text-sm font-semibold hover:from-rose-400 hover:to-rose-500 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <FiFileText className="w-4 h-4" /> PDF
            </button>
            {!esLectura && (
              <Boton tipo="primary" onClick={guardarTodas} disabled={guardandoTodo} className="px-6 py-2">
                {guardandoTodo ? 'Guardando...' : 'Guardar Todo'}
              </Boton>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
