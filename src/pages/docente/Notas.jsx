import { useState, useEffect } from 'react';
import apiClient from '../../services/apiClient';
import { TIPOS_CALIFICACION } from '../../utils/constants';
import Boton from '../../components/common/Boton';
import InputCampo from '../../components/common/InputCampo';
import toast from 'react-hot-toast';

export default function NotasDocentePage() {
  const [cursos, setCursos] = useState([]);
  const [cursoSel, setCursoSel] = useState('');
  const [esquema, setEsquema] = useState(null);
  const [periodoSel, setPeriodoSel] = useState('');
  const [alumnos, setAlumnos] = useState([]);
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
      setAlumnos(data.filter(a => a.estado === 1 && a.tbl_alumnos_cursos?.some(ac => ac.id_curso === parseInt(cursoSel) && ac.estado === 1)));
    }).catch(() => setAlumnos([]));
  }, [cursoSel]);

  useEffect(() => {
    if (!cursoSel || !periodoSel) return;
    apiClient.get(`/notas?id_curso=${cursoSel}&id_periodo_calificacion=${periodoSel}`).then(({ data }) => {
      setNotas(data);
      const form = {};
      const finals = {};
      data.forEach(n => {
        form[n.id_alumno] = {};
        n.tbl_notas_detalle?.forEach(d => {
          form[n.id_alumno][d.id_componente_nota] = d.valor_numerico?.toString() || d.valor_letra || '';
        });
        finals[n.id_alumno] = n.nota_final_numerica?.toString() || n.nota_final_letra || '';
      });
      setFormNotas(form);
      setFormNotaFinal(finals);
    }).catch(() => setNotas([]));
  }, [cursoSel, periodoSel]);

  const cambiarNota = (idAlumno, idComp, valor) => {
    setFormNotas(prev => ({ ...prev, [idAlumno]: { ...(prev[idAlumno] || {}), [idComp]: valor } }));
  };

  const escalaOpciones = esquema?.escala_letras ? esquema.escala_letras.split(',').map(s => s.trim()).filter(Boolean) : [];
  const esLetras = esquema?.tipo_calificacion === TIPOS_CALIFICACION.LETRAS;

  const buildPayload = (idAlumno) => {
    const detalles = (esquema.tbl_componentes_nota || []).map(c => ({
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

  const guardarNotas = async (idAlumno) => {
    if (!esquema) return;
    try {
      await apiClient.post('/notas', buildPayload(idAlumno));
      toast.success('Notas guardadas');
      await recargarNotas();
    } catch (err) { toast.error(err.response?.data?.error || 'Error'); }
  };

  const guardarTodas = async () => {
    if (!esquema || alumnos.length === 0) return;
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
    <div className="animate-fade-up">
      <div className="mb-6">
        <p className="text-xs font-display font-medium text-secondary-600 uppercase tracking-widest mb-1">Calificaciones</p>
        <h1 className="text-3xl font-display font-bold text-slate-800">Registro de Notas</h1>
      </div>
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="w-72">
          <InputCampo label="Curso" name="curso" type="select" value={cursoSel} onChange={(e) => setCursoSel(e.target.value)} options={cursos.filter(c => c.estado === 1).map(c => ({ value: c.id.toString(), label: `${c.nombre} - ${c.grado || ''} ${c.seccion || ''}` }))} />
        </div>
        {periodos.length > 0 && (
          <div className="w-56">
            <InputCampo label="Periodo" name="periodo" type="select" value={periodoSel} onChange={(e) => setPeriodoSel(e.target.value)} options={periodos.map(p => ({ value: p.id.toString(), label: p.nombre }))} />
          </div>
        )}
      </div>

      {!esquema && cursoSel && (
        <div className="bg-primary-50 border border-primary-200 rounded-xl p-4 text-sm text-primary-600">
          Configure el esquema de calificación primero en "Config. Académica".
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
                <th className="px-5 py-3.5 text-center text-xs font-display font-bold uppercase tracking-wider bg-primary-200 text-primary-800">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {alumnos.map(a => {
                const notaAlumno = notas.find(n => n.id_alumno === a.id);
                return (
                  <tr key={a.id} className="hover:bg-slate-50/80 transition-colors duration-200">
                    <td className="px-5 py-3.5 text-[15px] font-bold text-black whitespace-nowrap bg-primary-100">{a.apellidos}, {a.nombres}</td>
                    {componentes.map((c, idx) => {
                      const color = COLORES_COLUMNAS[idx % COLORES_COLUMNAS.length];
                      return (
                        <td key={c.id} className={`px-4 py-2.5 text-center ${color.cell}`}>
                          {!esLetras ? (
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
                      {esLetras ? (
                        <select value={formNotaFinal[a.id] || ''} onChange={(e) => setFormNotaFinal(prev => ({ ...prev, [a.id]: e.target.value }))} className="w-20 px-2 py-1.5 border border-amber-400 rounded-lg text-sm bg-white text-black font-bold focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500">
                          <option value="">-</option>
                          {escalaOpciones.map(op => <option key={op} value={op}>{op}</option>)}
                        </select>
                      ) : (
                        <input type="number" min="0" max="20" step="0.1" value={formNotaFinal[a.id] || ''} onChange={(e) => setFormNotaFinal(prev => ({ ...prev, [a.id]: e.target.value }))} className="w-16 px-2 py-1.5 border border-amber-400 rounded-lg text-sm text-center bg-white text-black font-bold focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500" />
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-center bg-primary-100">
                      <Boton tipo="secondary" onClick={() => guardarNotas(a.id)} className="text-xs px-2 py-1">Guardar</Boton>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="flex justify-end mt-4 px-4 pb-4">
            <Boton tipo="primary" onClick={guardarTodas} disabled={guardandoTodo} className="px-6 py-2">
              {guardandoTodo ? 'Guardando...' : 'Guardar Todo'}
            </Boton>
          </div>
        </div>
      )}
    </div>
  );
}
