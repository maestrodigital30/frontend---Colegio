import { useState, useEffect, useMemo } from 'react';
import apiClient from '../../services/apiClient';
import { TIPOS_CALIFICACION } from '../../utils/constants';
import Tabla from '../../components/common/Tabla';
import Boton from '../../components/common/Boton';
import InputCampo from '../../components/common/InputCampo';
import toast from 'react-hot-toast';

export default function ConfigAcademicaDocentePage() {
  const [cursos, setCursos] = useState([]);
  const [cursoSel, setCursoSel] = useState(null);
  const [esquema, setEsquema] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [formEsquema, setFormEsquema] = useState({
    tipo_calificacion: TIPOS_CALIFICACION.NUMERICO, formula: 'promedio', cantidad_periodos: 4, periodos: [], componentes: [], escala_letras: '',
  });

  const ESCALAS_PRESET = [
    { label: 'AD, A, B, C', value: 'AD,A,B,C' },
    { label: 'A, B, C, D', value: 'A,B,C,D' },
    { label: 'A+, A, A-, B+, B, B-, C+, C, C-', value: 'A+,A,A-,B+,B,B-,C+,C,C-' },
  ];
  const esLetras = formEsquema.tipo_calificacion === TIPOS_CALIFICACION.LETRAS;

  useEffect(() => {
    apiClient.get('/cursos').then(({ data }) => setCursos(data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!cursoSel) return;
    setCargando(true);
    apiClient.get(`/config-academica/curso/${cursoSel.id}`).then(({ data }) => {
      setEsquema(data);
      if (data) {
        setFormEsquema({
          tipo_calificacion: data.tipo_calificacion || TIPOS_CALIFICACION.NUMERICO,
          formula: data.formula || 'promedio',
          cantidad_periodos: data.tbl_periodos_calificacion?.length || 4,
          periodos: data.tbl_periodos_calificacion || [],
          componentes: data.tbl_componentes_nota || [],
          escala_letras: data.escala_letras || '',
        });
      } else {
        setFormEsquema({ tipo_calificacion: TIPOS_CALIFICACION.NUMERICO, formula: 'promedio', cantidad_periodos: 4, periodos: [], componentes: [], escala_letras: '' });
      }
    }).catch(() => setEsquema(null)).finally(() => setCargando(false));
  }, [cursoSel]);

  const generarPeriodos = () => {
    const nombres = ['Bimestre I', 'Bimestre II', 'Bimestre III', 'Bimestre IV'];
    const periodos = [];
    for (let i = 0; i < formEsquema.cantidad_periodos; i++) {
      periodos.push({ nombre: nombres[i] || `Periodo ${i + 1}`, orden: i + 1 });
    }
    setFormEsquema(prev => ({ ...prev, periodos }));
  };

  const agregarComponente = () => {
    setFormEsquema(prev => ({ ...prev, componentes: [...prev.componentes, { nombre_componente: '', peso_porcentaje: 0 }] }));
  };

  const actualizarComponente = (idx, campo, valor) => {
    setFormEsquema(prev => {
      const comps = [...prev.componentes];
      comps[idx] = { ...comps[idx], [campo]: campo === 'peso_porcentaje' ? parseFloat(valor) || 0 : valor };
      return { ...prev, componentes: comps };
    });
  };

  const eliminarComponente = (idx) => {
    setFormEsquema(prev => ({ ...prev, componentes: prev.componentes.filter((_, i) => i !== idx) }));
  };

  const crearEsquema = async () => {
    if (!cursoSel) return toast.error('Seleccione un curso');
    if (formEsquema.periodos.length === 0) return toast.error('Genere los periodos');

    if (!esLetras) {
      const sumaPesos = formEsquema.componentes.reduce((sum, c) => sum + (parseFloat(c.peso_porcentaje) || 0), 0);
      if (sumaPesos !== 100) return toast.error(`La suma de los porcentajes es ${sumaPesos}%. Debe ser exactamente 100%`);
    }
    if (esLetras && !formEsquema.escala_letras.trim()) return toast.error('Configure la escala de letras');

    try {
      await apiClient.post('/config-academica', {
        id_curso: cursoSel.id,
        tipo_calificacion: formEsquema.tipo_calificacion,
        formula: esLetras ? null : formEsquema.formula,
        escala_letras: esLetras ? formEsquema.escala_letras.trim() : null,
        periodos: formEsquema.periodos,
        componentes: formEsquema.componentes,
      });
      toast.success(modoEdicion ? 'Esquema actualizado' : 'Esquema creado');
      setModoEdicion(false);
      const { data } = await apiClient.get(`/config-academica/curso/${cursoSel.id}`);
      setEsquema(data);
      if (data) {
        setFormEsquema({
          tipo_calificacion: data.tipo_calificacion || TIPOS_CALIFICACION.NUMERICO,
          formula: data.formula || 'promedio',
          cantidad_periodos: data.tbl_periodos_calificacion?.length || 4,
          periodos: data.tbl_periodos_calificacion || [],
          componentes: data.tbl_componentes_nota || [],
          escala_letras: data.escala_letras || '',
        });
      }
    } catch (err) { toast.error(err.response?.data?.error || 'Error'); }
  };

  const actualizarFormula = async () => {
    if (!esquema) return;
    try {
      await apiClient.put(`/config-academica/${esquema.id}/formula`, { formula: formEsquema.formula });
      toast.success('Fórmula actualizada');
    } catch (err) { toast.error(err.response?.data?.error || 'Error'); }
  };

  const iniciarEdicion = () => {
    setFormEsquema({
      tipo_calificacion: esquema.tipo_calificacion || TIPOS_CALIFICACION.NUMERICO,
      formula: esquema.formula || 'promedio',
      cantidad_periodos: esquema.tbl_periodos_calificacion?.length || 4,
      periodos: esquema.tbl_periodos_calificacion?.map((p, i) => ({ nombre: p.nombre, orden: i + 1 })) || [],
      componentes: esquema.tbl_componentes_nota?.map(c => ({ nombre_componente: c.nombre_componente, peso_porcentaje: c.peso_porcentaje })) || [],
      escala_letras: esquema.escala_letras || '',
    });
    setModoEdicion(true);
  };

  const cancelarEdicion = () => {
    setModoEdicion(false);
    setFormEsquema({
      tipo_calificacion: esquema.tipo_calificacion || TIPOS_CALIFICACION.NUMERICO,
      formula: esquema.formula || 'promedio',
      cantidad_periodos: esquema.tbl_periodos_calificacion?.length || 4,
      periodos: esquema.tbl_periodos_calificacion || [],
      componentes: esquema.tbl_componentes_nota || [],
    });
  };

  const volver = () => {
    setCursoSel(null);
    setEsquema(null);
    setModoEdicion(false);
  };

  const cursosActivos = useMemo(() => cursos.filter(c => c.estado === 1), [cursos]);

  const columnas = [
    { key: 'id', label: 'ID' },
    { key: 'nombre', label: 'Curso', headerClassName: 'bg-primary-200 text-primary-800', cellClassName: 'bg-primary-100 text-primary-800 font-medium' },
    { key: 'grado_seccion', label: 'Grado / Sección', headerClassName: 'bg-sky-200 text-sky-800', cellClassName: 'bg-sky-100 text-sky-800 font-medium',
      render: (f) => `${f.grado || '-'} ${f.seccion || ''}`.trim(),
    },
    { key: 'docente', label: 'Docente', headerClassName: 'bg-violet-200 text-violet-800', cellClassName: 'bg-violet-100 text-violet-800 font-medium',
      render: (f) => {
        const d = f.tbl_perfiles_docente;
        return d ? `${d.nombres || ''} ${d.apellidos || ''}`.trim() : '-';
      },
    },
    { key: 'alumnos', label: 'Alumnos', headerClassName: 'bg-indigo-200 text-indigo-800', cellClassName: 'bg-indigo-100 text-indigo-800 font-medium',
      render: (f) => f._count?.tbl_alumnos_cursos ?? 0,
    },
    { key: 'periodo', label: 'Periodo', headerClassName: 'bg-teal-200 text-teal-800', cellClassName: 'bg-teal-100 text-teal-800 font-medium',
      render: (f) => f.tbl_periodos_escolares?.nombre || '-',
    },
  ];

  const grados = useMemo(() => {
    const unicos = [...new Set(cursosActivos.map(d => d.grado).filter(Boolean))];
    return unicos.sort().map(g => ({ value: g, label: g }));
  }, [cursosActivos]);

  const secciones = useMemo(() => {
    const unicas = [...new Set(cursosActivos.map(d => d.seccion).filter(Boolean))];
    return unicas.sort().map(s => ({ value: s, label: s }));
  }, [cursosActivos]);

  const periodosOpciones = useMemo(() => {
    const unicos = [...new Map(
      cursosActivos.map(d => [d.tbl_periodos_escolares?.nombre, d.tbl_periodos_escolares]).filter(([k]) => k)
    ).values()];
    return unicos.map(p => ({ value: p.nombre, label: p.nombre }));
  }, [cursosActivos]);

  const filtros = useMemo(() => [
    ...(grados.length > 0 ? [{
      key: 'grado', label: 'Todos los grados', opciones: grados,
      filterFn: (f, v) => f.grado === v,
    }] : []),
    ...(secciones.length > 0 ? [{
      key: 'seccion', label: 'Todas las secciones', opciones: secciones,
      filterFn: (f, v) => f.seccion === v,
    }] : []),
    ...(periodosOpciones.length > 0 ? [{
      key: 'periodo', label: 'Todos los periodos', opciones: periodosOpciones,
      filterFn: (f, v) => f.tbl_periodos_escolares?.nombre === v,
    }] : []),
  ], [grados, secciones, periodosOpciones]);

  // --- Vista detalle de un curso ---
  if (cursoSel) {
    return (
      <div className="animate-fade-up">
        <div className="mb-6">
          <p className="text-xs font-display font-medium text-secondary-600 uppercase tracking-widest mb-1">Configuración</p>
          <h1 className="text-3xl font-display font-bold text-slate-800">Configuración Académica</h1>
        </div>

        <button onClick={volver} className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 mb-4 transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Volver a la lista de cursos
        </button>

        <div className="flex items-center gap-3 mb-6 p-4 bg-slate-50 border border-slate-200 rounded-xl">
          <div className="w-10 h-10 rounded-lg bg-secondary-100 flex items-center justify-center">
            <svg className="w-5 h-5 text-secondary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
          </div>
          <div>
            <p className="font-display font-semibold text-slate-800">{cursoSel.nombre}</p>
            <p className="text-sm text-slate-500">{cursoSel.grado || ''} {cursoSel.seccion || ''}</p>
          </div>
        </div>

        {cargando && <p className="text-slate-500">Cargando...</p>}

        {!cargando && (
          <div className="glass-card-static p-6">
            {esquema && !modoEdicion ? (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-display font-semibold text-slate-800">Esquema Existente</h2>
                  {!esquema.tiene_notas && (
                    <Boton tipo="secondary" onClick={iniciarEdicion}>Editar</Boton>
                  )}
                </div>

                {esquema.tiene_notas && (
                  <div className="flex items-start gap-3 p-4 mb-4 bg-primary-50 border border-primary-200 rounded-xl">
                    <svg className="w-5 h-5 text-primary-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20 10 10 0 000-20z" /></svg>
                    <div>
                      <p className="text-sm font-semibold text-primary-700">Configuración bloqueada</p>
                      <p className="text-sm text-primary-600">Esta configuración académica ya tiene notas registradas y no puede ser modificada.</p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div><span className="text-sm text-slate-500">Tipo:</span> <span className="font-medium text-slate-700">{esquema.tipo_calificacion === 'letras' ? 'Letras' : 'Numérico'}</span></div>
                  {esquema.tipo_calificacion === 'letras' ? (
                    <div><span className="text-sm text-slate-500">Escala:</span> <span className="font-medium text-slate-700">{esquema.escala_letras || '-'}</span></div>
                  ) : (
                    <div><span className="text-sm text-slate-500">Fórmula:</span> <span className="font-medium text-slate-700">{esquema.formula}</span></div>
                  )}
                </div>
                <h3 className="font-display font-semibold text-slate-800 mb-2">Periodos</h3>
                <div className="flex flex-wrap gap-2 mb-4">
                  {esquema.tbl_periodos_calificacion?.map(p => (
                    <span key={p.id} className="px-3 py-1 bg-secondary-50 text-secondary-600 border border-secondary-200 rounded-lg text-sm">{p.nombre}</span>
                  ))}
                </div>
                <h3 className="font-display font-semibold text-slate-800 mb-2">Componentes</h3>
                <div className="space-y-2">
                  {esquema.tbl_componentes_nota?.map(c => (
                    <div key={c.id} className="flex items-center gap-4 p-2 bg-slate-50 rounded-lg">
                      <span className="text-sm flex-1 text-slate-600">{c.nombre_componente}</span>
                      {esquema.tipo_calificacion !== 'letras' && (
                        <span className="text-sm font-medium text-slate-700">{c.peso_porcentaje}%</span>
                      )}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <>
                <h2 className="text-lg font-display font-semibold text-slate-800 mb-4">{modoEdicion ? 'Editar Esquema' : 'Crear Esquema'}</h2>
                <div className="space-y-4">
                  <InputCampo label="Tipo" name="tipo" type="select" value={formEsquema.tipo_calificacion} onChange={(e) => setFormEsquema(prev => ({ ...prev, tipo_calificacion: e.target.value }))} options={[
                    { value: TIPOS_CALIFICACION.NUMERICO, label: 'Numérico' }, { value: TIPOS_CALIFICACION.LETRAS, label: 'Letras' },
                  ]} />
                  {esLetras ? (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Escala de letras</label>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {ESCALAS_PRESET.map(p => (
                          <button key={p.value} type="button" onClick={() => setFormEsquema(prev => ({ ...prev, escala_letras: p.value }))}
                            className={`px-3 py-1 rounded-lg text-xs border transition-colors ${formEsquema.escala_letras === p.value ? 'bg-secondary-50 border-secondary-300 text-secondary-700' : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'}`}>
                            {p.label}
                          </button>
                        ))}
                      </div>
                      <input type="text" value={formEsquema.escala_letras} onChange={(e) => setFormEsquema(prev => ({ ...prev, escala_letras: e.target.value }))} placeholder="Ej: AD,A,B,C o A+,A,A-,B+,B" className="w-full px-3 py-2 border border-slate-200 bg-slate-50 text-slate-700 rounded-lg text-sm" />
                      <p className="text-xs text-slate-400 mt-1">Separe las letras con comas. La nota final se ingresa manualmente.</p>
                    </div>
                  ) : (
                    <InputCampo label="Fórmula" name="formula" value={formEsquema.formula} onChange={(e) => setFormEsquema(prev => ({ ...prev, formula: e.target.value }))} />
                  )}
                  <div className="flex items-end gap-3">
                    <InputCampo label="Periodos" name="cant" type="number" value={formEsquema.cantidad_periodos} onChange={(e) => setFormEsquema(prev => ({ ...prev, cantidad_periodos: parseInt(e.target.value) || 4 }))} />
                    <Boton tipo="outline" onClick={generarPeriodos}>Generar</Boton>
                  </div>
                  {formEsquema.periodos.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formEsquema.periodos.map((p, i) => <span key={i} className="px-3 py-1 bg-secondary-50 text-secondary-600 border border-secondary-200 rounded-lg text-sm">{p.nombre}</span>)}
                    </div>
                  )}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-display font-semibold text-slate-800">Componentes</h3>
                      <Boton tipo="outline" onClick={agregarComponente}>+ Componente</Boton>
                    </div>
                    {formEsquema.componentes.map((c, i) => (
                      <div key={i} className="flex items-center gap-2 mb-2">
                        <input type="text" value={c.nombre_componente} onChange={(e) => actualizarComponente(i, 'nombre_componente', e.target.value)} placeholder="Nombre" className="flex-1 px-3 py-2 border border-slate-200 bg-slate-50 text-slate-700 rounded-lg text-sm" />
                        {!esLetras && (
                          <>
                            <input type="number" value={c.peso_porcentaje} onChange={(e) => actualizarComponente(i, 'peso_porcentaje', e.target.value)} className="w-20 px-3 py-2 border border-slate-200 bg-slate-50 text-slate-700 rounded-lg text-sm" />
                            <span className="text-sm text-slate-500">%</span>
                          </>
                        )}
                        <button onClick={() => eliminarComponente(i)} className="p-1 text-rose-400 hover:bg-rose-50 rounded">X</button>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-3">
                    <Boton onClick={crearEsquema}>{modoEdicion ? 'Guardar Cambios' : 'Crear Esquema'}</Boton>
                    {modoEdicion && <Boton tipo="outline" onClick={cancelarEdicion}>Cancelar</Boton>}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    );
  }

  // --- Vista tabla de cursos ---
  return (
    <div className="animate-fade-up" style={{ fontSize: '115%' }}>
      <div className="mb-6">
        <p className="text-xs font-display font-medium text-secondary-600 uppercase tracking-widest mb-1">Configuración</p>
        <h1 className="text-3xl font-display font-bold text-slate-800">Configuración Académica</h1>
      </div>

      <Tabla
        columnas={columnas}
        datos={cursosActivos}
        filtros={filtros}
        accionesClassName="bg-primary-200 text-primary-800"
        acciones={(fila) => (
          <button
            onClick={() => setCursoSel(fila)}
            className="px-3 py-1 text-sm font-medium text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
            title="Configurar"
          >
            Configurar
          </button>
        )}
      />
    </div>
  );
}
