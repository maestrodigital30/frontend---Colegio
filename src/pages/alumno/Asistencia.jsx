import { useState, useEffect, useMemo } from 'react';
import { HiClipboardCheck, HiCalendar, HiViewList, HiChevronLeft, HiChevronRight } from 'react-icons/hi';
import apiClient from '../../services/apiClient';
import { ESTADOS_ASISTENCIA } from '../../utils/constants';

const ESTILOS_ESTADO = {
  [ESTADOS_ASISTENCIA.PRESENTE]: 'bg-emerald-200 text-emerald-800 border-emerald-300 font-bold',
  [ESTADOS_ASISTENCIA.TARDANZA]: 'bg-amber-200 text-amber-800 border-amber-300 font-bold',
  [ESTADOS_ASISTENCIA.AUSENTE]: 'bg-rose-200 text-rose-800 border-rose-300 font-bold',
};

const COLORES_CALENDARIO = {
  [ESTADOS_ASISTENCIA.PRESENTE]: { bg: 'bg-emerald-600', dot: 'bg-emerald-500', light: 'bg-emerald-200 border-emerald-300', text: 'text-emerald-800 font-bold' },
  [ESTADOS_ASISTENCIA.TARDANZA]: { bg: 'bg-amber-600', dot: 'bg-amber-500', light: 'bg-amber-200 border-amber-300', text: 'text-amber-800 font-bold' },
  [ESTADOS_ASISTENCIA.AUSENTE]: { bg: 'bg-rose-600', dot: 'bg-rose-500', light: 'bg-rose-200 border-rose-300', text: 'text-rose-800 font-bold' },
};

const DIAS_SEMANA = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

function CalendarioAsistencia({ registros, mesActual, setMesActual }) {
  const anio = mesActual.getFullYear();
  const mes = mesActual.getMonth();

  const registrosPorFecha = useMemo(() => {
    const mapa = {};
    registros.forEach(r => {
      const fecha = r.tbl_sesiones_asistencia?.fecha_asistencia;
      if (!fecha) return;
      const key = new Date(fecha).toISOString().slice(0, 10);
      if (!mapa[key]) mapa[key] = [];
      mapa[key].push(r);
    });
    return mapa;
  }, [registros]);

  const primerDia = new Date(anio, mes, 1);
  let diaInicio = primerDia.getDay() - 1;
  if (diaInicio < 0) diaInicio = 6;
  const diasEnMes = new Date(anio, mes + 1, 0).getDate();

  const celdas = [];
  for (let i = 0; i < diaInicio; i++) celdas.push(null);
  for (let d = 1; d <= diasEnMes; d++) celdas.push(d);

  const hoy = new Date();
  const esHoy = (d) => d && hoy.getFullYear() === anio && hoy.getMonth() === mes && hoy.getDate() === d;

  const obtenerEstadoDia = (d) => {
    if (!d) return null;
    const key = `${anio}-${String(mes + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    return registrosPorFecha[key] || null;
  };

  const [diaSeleccionado, setDiaSeleccionado] = useState(null);

  const mesAnterior = () => setMesActual(new Date(anio, mes - 1, 1));
  const mesSiguiente = () => setMesActual(new Date(anio, mes + 1, 1));

  const detalleDia = diaSeleccionado ? obtenerEstadoDia(diaSeleccionado) : null;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-white overflow-hidden animate-fade-up" style={{ border: '2px solid #87CEEB', animationDelay: '0.2s' }}>
        {/* Header del calendario */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <button onClick={mesAnterior} className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
            <HiChevronLeft className="w-5 h-5 text-slate-600" />
          </button>
          <h3 className="text-lg font-display font-bold text-slate-800">
            {MESES[mes]} {anio}
          </h3>
          <button onClick={mesSiguiente} className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
            <HiChevronRight className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        {/* Días de la semana */}
        <div className="grid grid-cols-7 border-b border-slate-100">
          {DIAS_SEMANA.map(d => (
            <div key={d} className="py-2.5 text-center text-xs font-display font-semibold text-slate-400 uppercase tracking-wider">
              {d}
            </div>
          ))}
        </div>

        {/* Celdas del calendario */}
        <div className="grid grid-cols-7">
          {celdas.map((dia, i) => {
            const regs = obtenerEstadoDia(dia);
            const esDiaHoy = esHoy(dia);
            const seleccionado = dia === diaSeleccionado;

            return (
              <div
                key={i}
                onClick={() => dia && setDiaSeleccionado(dia === diaSeleccionado ? null : dia)}
                className={`
                  relative min-h-[72px] p-1.5 border-b border-r border-slate-50 transition-all
                  ${dia ? 'cursor-pointer hover:bg-slate-50/80' : ''}
                  ${seleccionado ? 'bg-primary-50/50 ring-1 ring-inset ring-primary-200' : ''}
                `}
              >
                {dia && (
                  <>
                    <span className={`
                      inline-flex items-center justify-center w-7 h-7 text-sm font-medium rounded-full
                      ${esDiaHoy ? 'bg-primary-500 text-white font-bold' : 'text-slate-600'}
                    `}>
                      {dia}
                    </span>
                    {regs && (
                      <div className="flex flex-wrap gap-0.5 mt-1 px-0.5">
                        {regs.map((r, idx) => {
                          const color = COLORES_CALENDARIO[r.estado_asistencia];
                          return (
                            <span
                              key={idx}
                              className={`w-2 h-2 rounded-full ${color?.dot || 'bg-slate-300'}`}
                              title={`${r.tbl_sesiones_asistencia?.tbl_cursos?.nombre || ''} - ${r.estado_asistencia}`}
                            />
                          );
                        })}
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>

        {/* Leyenda */}
        <div className="flex items-center justify-center gap-5 px-5 py-3 border-t border-slate-100 bg-slate-50/50">
          {[
            { label: 'Presente', color: 'bg-emerald-500' },
            { label: 'Tardanza', color: 'bg-amber-500' },
            { label: 'Ausente', color: 'bg-rose-500' },
          ].map(item => (
            <div key={item.label} className="flex items-center gap-1.5">
              <span className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
              <span className="text-xs text-slate-500">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Detalle del día seleccionado */}
      {diaSeleccionado && (
        <div className="rounded-2xl bg-white p-4 animate-fade-up" style={{ border: '2px solid #87CEEB' }}>
          <h4 className="text-sm font-display font-bold text-slate-700 mb-3">
            {diaSeleccionado} de {MESES[mes]} {anio}
          </h4>
          {detalleDia && detalleDia.length > 0 ? (
            <div className="space-y-2">
              {detalleDia.map((r, idx) => {
                const color = COLORES_CALENDARIO[r.estado_asistencia];
                return (
                  <div key={idx} className={`flex items-center justify-between p-3 rounded-xl border ${color?.light || 'bg-slate-50 border-slate-200'}`}>
                    <span className="text-sm font-medium text-slate-700">
                      {r.tbl_sesiones_asistencia?.tbl_cursos?.nombre || 'Curso'}
                    </span>
                    <span className={`text-xs font-display font-semibold capitalize ${color?.text || 'text-slate-500'}`}>
                      {r.estado_asistencia}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-slate-400">Sin registros este día</p>
          )}
        </div>
      )}
    </div>
  );
}

export default function AsistenciaAlumnoPage() {
  const [registros, setRegistros] = useState([]);
  const [cursos, setCursos] = useState([]);
  const [filtroCurso, setFiltroCurso] = useState('');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [cargando, setCargando] = useState(true);
  const [vista, setVista] = useState('calendario');
  const [mesActual, setMesActual] = useState(new Date());

  useEffect(() => {
    apiClient.get('/alumno-portal/mis-cursos')
      .then(res => setCursos(res.data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    setCargando(true);
    const params = new URLSearchParams();
    if (filtroCurso) params.set('id_curso', filtroCurso);
    if (vista === 'lista') {
      if (fechaDesde) params.set('fecha_desde', fechaDesde);
      if (fechaHasta) params.set('fecha_hasta', fechaHasta);
    }
    const qs = params.toString();

    apiClient.get(`/alumno-portal/mi-asistencia${qs ? `?${qs}` : ''}`)
      .then(res => setRegistros(res.data))
      .catch(() => {})
      .finally(() => setCargando(false));
  }, [filtroCurso, fechaDesde, fechaHasta, vista]);

  const resumen = registros.reduce((acc, r) => {
    acc[r.estado_asistencia] = (acc[r.estado_asistencia] || 0) + 1;
    return acc;
  }, {});

  return (
    <div style={{ fontSize: '115%' }}>
      <div className="mb-8 animate-fade-up">
        <p className="text-xs font-display font-bold uppercase tracking-widest mb-1" style={{ color: '#0060FF' }}>Control</p>
        <h1 className="text-3xl font-display font-bold text-black">Mi Asistencia</h1>
        <p className="text-sm text-black/60 mt-1 font-medium">Registro de tu asistencia por curso</p>
      </div>

      {/* Filtros + Toggle */}
      <div className="flex flex-wrap items-center gap-3 mb-6 animate-fade-up" style={{ animationDelay: '0.1s' }}>
        <select
          value={filtroCurso}
          onChange={e => setFiltroCurso(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white/80 backdrop-blur text-sm focus:ring-2 focus:ring-primary-300 focus:border-primary-300 outline-none"
        >
          <option value="">Todos los cursos</option>
          {cursos.map(c => (
            <option key={c.id} value={c.id}>{c.nombre}</option>
          ))}
        </select>

        {vista === 'lista' && (
          <>
            <input
              type="date"
              value={fechaDesde}
              onChange={e => setFechaDesde(e.target.value)}
              className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white/80 backdrop-blur text-sm focus:ring-2 focus:ring-primary-300 focus:border-primary-300 outline-none"
            />
            <input
              type="date"
              value={fechaHasta}
              onChange={e => setFechaHasta(e.target.value)}
              className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white/80 backdrop-blur text-sm focus:ring-2 focus:ring-primary-300 focus:border-primary-300 outline-none"
            />
          </>
        )}

        <div className="ml-auto flex rounded-xl border border-slate-200 bg-white/80 backdrop-blur overflow-hidden">
          <button
            onClick={() => setVista('calendario')}
            className={`flex items-center gap-1.5 px-3.5 py-2.5 text-sm font-medium transition-colors ${vista === 'calendario' ? 'bg-primary-500 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <HiCalendar className="w-4 h-4" />
            <span className="hidden sm:inline">Calendario</span>
          </button>
          <button
            onClick={() => setVista('lista')}
            className={`flex items-center gap-1.5 px-3.5 py-2.5 text-sm font-medium transition-colors ${vista === 'lista' ? 'bg-primary-500 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <HiViewList className="w-4 h-4" />
            <span className="hidden sm:inline">Lista</span>
          </button>
        </div>
      </div>

      {/* Resumen */}
      {registros.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-6 animate-fade-up" style={{ animationDelay: '0.15s' }}>
          {[
            { label: 'Presente', key: ESTADOS_ASISTENCIA.PRESENTE, color: 'text-emerald-800 bg-emerald-200 border-emerald-300 font-bold' },
            { label: 'Tardanza', key: ESTADOS_ASISTENCIA.TARDANZA, color: 'text-amber-800 bg-amber-200 border-amber-300 font-bold' },
            { label: 'Ausente', key: ESTADOS_ASISTENCIA.AUSENTE, color: 'text-rose-800 bg-rose-200 border-rose-300 font-bold' },
          ].map(item => (
            <div key={item.key} className={`p-4 rounded-xl border text-center ${item.color}`}>
              <p className="text-2xl font-display font-bold">{resumen[item.key] || 0}</p>
              <p className="text-xs font-medium mt-1">{item.label}</p>
            </div>
          ))}
        </div>
      )}

      {cargando ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        </div>
      ) : registros.length === 0 ? (
        <div className="rounded-2xl bg-white p-12 text-center animate-fade-up" style={{ border: '2px solid #87CEEB' }}>
          <HiClipboardCheck className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 font-medium">No hay registros de asistencia</p>
        </div>
      ) : vista === 'calendario' ? (
        <CalendarioAsistencia registros={registros} mesActual={mesActual} setMesActual={setMesActual} />
      ) : (
        <div className="rounded-2xl bg-white overflow-hidden animate-fade-up" style={{ border: '2px solid #87CEEB', animationDelay: '0.2s' }}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="px-6 py-3 text-left text-xs font-display font-bold uppercase tracking-wider bg-sky-200 text-sky-800">Fecha</th>
                  <th className="px-6 py-3 text-left text-xs font-display font-bold uppercase tracking-wider bg-indigo-200 text-indigo-800">Curso</th>
                  <th className="px-6 py-3 text-center text-xs font-display font-bold uppercase tracking-wider bg-amber-200 text-amber-800">Estado</th>
                  <th className="px-6 py-3 text-center text-xs font-display font-bold uppercase tracking-wider bg-primary-200 text-primary-800">Modo</th>
                </tr>
              </thead>
              <tbody>
                {registros.map(r => (
                  <tr key={r.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-3 text-sm font-bold text-black">
                      {r.tbl_sesiones_asistencia?.fecha_asistencia
                        ? new Date(r.tbl_sesiones_asistencia.fecha_asistencia).toLocaleDateString('es-PE')
                        : '-'}
                    </td>
                    <td className="px-6 py-3 text-sm font-bold text-black">
                      {r.tbl_sesiones_asistencia?.tbl_cursos?.nombre || '-'}
                    </td>
                    <td className={`px-6 py-3 text-center ${r.estado_asistencia === 'presente' ? 'bg-emerald-100' : r.estado_asistencia === 'ausente' ? 'bg-rose-100' : r.estado_asistencia === 'tardanza' ? 'bg-amber-100' : ''}`}>
                      <span className={`inline-block px-2.5 py-1 text-xs font-display font-bold rounded-lg border ${ESTILOS_ESTADO[r.estado_asistencia] || 'bg-slate-100 text-slate-500'}`}>
                        {r.estado_asistencia}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-center text-xs text-slate-500 capitalize">{r.modo_registro}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
