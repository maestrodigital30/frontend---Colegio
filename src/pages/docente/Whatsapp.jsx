import { useState, useEffect } from 'react';
import apiClient from '../../services/apiClient';
import Boton from '../../components/common/Boton';
import InputCampo from '../../components/common/InputCampo';
import WhatsappEnvioMasivo from '../../components/common/WhatsappEnvioMasivo';
import { formatearFechaHora, fechaHoy } from '../../utils/formatters';
import { TIPOS_REPORTE_WHATSAPP } from '../../utils/constants';
import { HiPaperAirplane, HiClock, HiUsers } from 'react-icons/hi';
import toast from 'react-hot-toast';

const OPCIONES_REPORTE = [
  { value: TIPOS_REPORTE_WHATSAPP.ASISTENCIA_DIA, label: 'Asistencia del día', descripcion: 'Envía el estado de asistencia de una fecha específica' },
  { value: TIPOS_REPORTE_WHATSAPP.REPORTE_GENERAL, label: 'Reporte general', descripcion: 'Envía notas y resumen de asistencia acumulada' },
];

const LABELS_TIPO_ENVIO = {
  [TIPOS_REPORTE_WHATSAPP.ASISTENCIA_DIA]: 'Asistencia del día',
  [TIPOS_REPORTE_WHATSAPP.REPORTE_GENERAL]: 'Reporte general',
};

const formatearTipoEnvio = (tipoEnvio) => {
  if (!tipoEnvio) return '-';
  return tipoEnvio.split(',').map(t => LABELS_TIPO_ENVIO[t] || t).join(', ');
};

export default function WhatsappDocentePage() {
  const [cursos, setCursos] = useState([]);
  const [periodos, setPeriodos] = useState([]);
  const [cursoSel, setCursoSel] = useState('');
  const [periodoSel, setPeriodoSel] = useState('');
  const [tiposReporte, setTiposReporte] = useState([]);
  const [fecha, setFecha] = useState(fechaHoy());
  const [enlaces, setEnlaces] = useState([]);
  const [historial, setHistorial] = useState([]);
  const [enviando, setEnviando] = useState(false);
  const [vista, setVista] = useState('enviar');
  const [expandidos, setExpandidos] = useState({});

  useEffect(() => {
    apiClient.get('/cursos').then(({ data }) => setCursos(data)).catch(() => {});
    apiClient.get('/periodos').then(({ data }) => setPeriodos(data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (cursoSel && vista === 'historial') {
      apiClient.get(`/whatsapp/historial/${cursoSel}`).then(({ data }) => setHistorial(data)).catch(() => setHistorial([]));
    }
  }, [cursoSel, vista]);

  const toggleTipoReporte = (tipo) => {
    setTiposReporte(prev =>
      prev.includes(tipo) ? prev.filter(t => t !== tipo) : [...prev, tipo]
    );
  };

  const requiereFecha = tiposReporte.includes(TIPOS_REPORTE_WHATSAPP.ASISTENCIA_DIA);

  const enviarReportes = async () => {
    if (!cursoSel || !periodoSel) return toast.error('Seleccione curso y periodo');
    if (tiposReporte.length === 0) return toast.error('Seleccione al menos un tipo de reporte');
    if (requiereFecha && !fecha) return toast.error('Seleccione la fecha de asistencia');
    setEnviando(true);
    try {
      const payload = {
        id_curso: parseInt(cursoSel),
        id_periodo_escolar: parseInt(periodoSel),
        tipos_reporte: tiposReporte,
      };
      if (requiereFecha) payload.fecha = fecha;
      const { data } = await apiClient.post('/whatsapp/enviar', payload);
      setEnlaces(data.enlaces || []);
      toast.success(`Reportes generados: ${data.enlaces?.length || 0}`);
    } catch (err) { toast.error(err.response?.data?.error || 'Error'); }
    finally { setEnviando(false); }
  };

  return (
    <div className="animate-fade-up">
      <div className="mb-6">
        <p className="text-xs font-display font-medium text-secondary-600 uppercase tracking-widest mb-1">Comunicación</p>
        <h1 className="text-3xl font-display font-bold text-slate-800">WhatsApp - Reportes</h1>
      </div>
      <div className="flex gap-2 mb-6 flex-wrap">
        <Boton tipo={vista === 'enviar' ? 'secondary' : 'outline'} onClick={() => setVista('enviar')}>
          <HiPaperAirplane className="w-4 h-4 mr-1.5 inline-block" />Enviar por curso
        </Boton>
        <Boton tipo={vista === 'masivo' ? 'secondary' : 'outline'} onClick={() => setVista('masivo')}>
          <HiUsers className="w-4 h-4 mr-1.5 inline-block" />Envío masivo por grado
        </Boton>
        <Boton tipo={vista === 'historial' ? 'secondary' : 'outline'} onClick={() => setVista('historial')}>
          <HiClock className="w-4 h-4 mr-1.5 inline-block" />Historial
        </Boton>
      </div>

      {(vista === 'enviar' || vista === 'historial') && (
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="w-72">
            <InputCampo label="Curso" name="curso" type="select" value={cursoSel} onChange={(e) => setCursoSel(e.target.value)} options={cursos.filter(c => c.estado === 1).map(c => ({ value: c.id.toString(), label: `${c.nombre} - ${c.grado || ''} ${c.seccion || ''}` }))} />
          </div>
          {vista === 'enviar' && (
            <div className="w-56">
              <InputCampo label="Periodo" name="periodo" type="select" value={periodoSel} onChange={(e) => setPeriodoSel(e.target.value)} options={periodos.filter(p => p.estado === 1).map(p => ({ value: p.id.toString(), label: p.nombre }))} />
            </div>
          )}
        </div>
      )}

      {vista === 'masivo' && <WhatsappEnvioMasivo acento="secondary" />}

      {vista === 'enviar' && (
        <div className="glass-card-static p-6">
          <p className="text-sm text-slate-500 mb-4">Seleccione qué información incluir en el reporte para los padres.</p>

          <div className="space-y-3 mb-5">
            {OPCIONES_REPORTE.map(op => (
              <label key={op.value} className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${tiposReporte.includes(op.value) ? 'border-secondary-300 bg-secondary-50' : 'border-slate-200 hover:bg-slate-50'}`}>
                <input
                  type="checkbox"
                  checked={tiposReporte.includes(op.value)}
                  onChange={() => toggleTipoReporte(op.value)}
                  className="mt-0.5 w-4 h-4 text-secondary-600 rounded border-slate-300 focus:ring-secondary-500"
                />
                <div>
                  <span className="text-sm font-medium text-slate-700">{op.label}</span>
                  <p className="text-xs text-slate-400 mt-0.5">{op.descripcion}</p>
                </div>
              </label>
            ))}
          </div>

          {requiereFecha && (
            <div className="w-48 mb-5">
              <InputCampo label="Fecha de asistencia" name="fechaAsistencia" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
            </div>
          )}

          <Boton onClick={enviarReportes} disabled={enviando}>{enviando ? 'Generando...' : 'Generar Reportes'}</Boton>
          {enlaces.length > 0 && (
            <div className="mt-6 space-y-3">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-display font-semibold text-slate-800">Enlaces generados:</h3>
                <button onClick={() => { const allExpanded = enlaces.every((_, i) => expandidos[i]); const next = {}; if (!allExpanded) enlaces.forEach((_, i) => next[i] = true); setExpandidos(next); }} className="text-xs text-secondary-600 hover:text-secondary-700 font-medium">
                  {enlaces.every((_, i) => expandidos[i]) ? 'Contraer todos' : 'Expandir todos'}
                </button>
              </div>
              {enlaces.map((e, i) => (
                <div key={i} className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                  <div className="flex items-center gap-3 p-4 cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => setExpandidos(prev => ({ ...prev, [i]: !prev[i] }))}>
                    <svg className={`w-4 h-4 text-slate-400 transition-transform ${expandidos[i] ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    <span className="text-sm font-medium flex-1 text-slate-700">{e.nombre_alumno || `Alumno ${e.id_alumno}`}</span>
                    {e.error && <span className="text-xs px-2 py-0.5 bg-rose-50 text-rose-500 rounded-full">{e.error}</span>}
                    {e.whatsapp_url && (
                      <a href={e.whatsapp_url} target="_blank" rel="noopener noreferrer" onClick={(ev) => ev.stopPropagation()} className="px-3 py-1.5 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition-colors">
                        Enviar WhatsApp
                      </a>
                    )}
                  </div>
                  {expandidos[i] && (
                    <div className="px-4 pb-4 border-t border-slate-100">
                      <pre className="mt-3 p-3 bg-slate-50 rounded-lg text-xs text-slate-600 whitespace-pre-wrap font-sans leading-relaxed">{e.contenido_mensaje || 'Sin contenido'}</pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {vista === 'historial' && (
        <div className="glass-card-static overflow-x-auto">
          {historial.length === 0 ? (
            <p className="text-slate-500 text-center py-8">No hay envíos</p>
          ) : (
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">Fecha</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">Tipo</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {historial.map(h => (
                  <tr key={h.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-sm text-slate-600">{formatearFechaHora(h.fecha_hora_registro)}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{formatearTipoEnvio(h.tipo_envio)}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{h.tbl_envios_whatsapp_detalle?.length || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
