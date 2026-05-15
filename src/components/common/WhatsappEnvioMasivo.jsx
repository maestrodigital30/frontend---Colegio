import { useState, useEffect, useMemo } from 'react';
import apiClient from '../../services/apiClient';
import Boton from './Boton';
import InputCampo from './InputCampo';
import Modal from './Modal';
import { HiPaperAirplane, HiUserGroup, HiChat, HiExternalLink, HiCheckCircle, HiExclamationCircle, HiViewGrid, HiLightningBolt } from 'react-icons/hi';
import toast from 'react-hot-toast';

const ESTADO_LOCAL = {
  PENDIENTE: 'pendiente',
  ABIERTO: 'abierto',
  ENVIADO: 'enviado',
  OMITIDO: 'omitido',
  SIN_TELEFONO: 'sin_telefono',
};

const ETIQUETAS_ESTADO = {
  [ESTADO_LOCAL.PENDIENTE]: 'Pendiente',
  [ESTADO_LOCAL.ABIERTO]: 'Abierto',
  [ESTADO_LOCAL.ENVIADO]: 'Enviado',
  [ESTADO_LOCAL.OMITIDO]: 'Omitido',
  [ESTADO_LOCAL.SIN_TELEFONO]: 'Sin teléfono',
};

const CLASES_ESTADO = {
  [ESTADO_LOCAL.PENDIENTE]: 'bg-slate-100 text-slate-600',
  [ESTADO_LOCAL.ABIERTO]: 'bg-amber-100 text-amber-700',
  [ESTADO_LOCAL.ENVIADO]: 'bg-green-100 text-green-700',
  [ESTADO_LOCAL.OMITIDO]: 'bg-orange-100 text-orange-700',
  [ESTADO_LOCAL.SIN_TELEFONO]: 'bg-rose-100 text-rose-600',
};

export default function WhatsappEnvioMasivo({ acento = 'primary' }) {
  const claseBoton = acento === 'secondary' ? 'secondary' : 'primary';
  const claseBorde = acento === 'secondary' ? 'border-secondary-300 bg-secondary-50' : 'border-primary-300 bg-primary-50';
  const textoAcento = acento === 'secondary' ? 'text-secondary-600 hover:text-secondary-700' : 'text-primary-600 hover:text-primary-700';

  const [periodos, setPeriodos] = useState([]);
  const [periodoSel, setPeriodoSel] = useState('');
  const [grados, setGrados] = useState([]);
  const [gradoSel, setGradoSel] = useState('');
  const [seccionesSel, setSeccionesSel] = useState([]);
  const [enlaces, setEnlaces] = useState([]);
  const [cargandoGrados, setCargandoGrados] = useState(false);
  const [generando, setGenerando] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const [estadosEnvio, setEstadosEnvio] = useState({});
  const [modalWizard, setModalWizard] = useState(false);
  const [indiceWizard, setIndiceWizard] = useState(0);

  useEffect(() => {
    apiClient.get('/periodos').then(({ data }) => setPeriodos(data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!periodoSel) {
      setGrados([]);
      setGradoSel('');
      setSeccionesSel([]);
      return;
    }
    setCargandoGrados(true);
    apiClient.get('/whatsapp/grados-disponibles', { params: { id_periodo_escolar: periodoSel } })
      .then(({ data }) => setGrados(data || []))
      .catch(() => setGrados([]))
      .finally(() => setCargandoGrados(false));
    setGradoSel('');
    setSeccionesSel([]);
    setEnlaces([]);
    setEstadosEnvio({});
  }, [periodoSel]);

  useEffect(() => {
    setSeccionesSel([]);
    setEnlaces([]);
    setEstadosEnvio({});
  }, [gradoSel]);

  const gradoActual = useMemo(
    () => grados.find(g => g.grado === gradoSel),
    [grados, gradoSel]
  );

  const seccionesDisponibles = gradoActual?.secciones || [];

  const toggleSeccion = (seccion) => {
    setSeccionesSel(prev =>
      prev.includes(seccion) ? prev.filter(s => s !== seccion) : [...prev, seccion]
    );
  };

  const seleccionarTodasSecciones = () => {
    if (seccionesSel.length === seccionesDisponibles.length) {
      setSeccionesSel([]);
    } else {
      setSeccionesSel(seccionesDisponibles.map(s => s.seccion));
    }
  };

  const prepararEnvio = async () => {
    if (!periodoSel) return toast.error('Seleccione un periodo');
    if (!gradoSel) return toast.error('Seleccione un grado');
    if (seccionesSel.length === 0) return toast.error('Seleccione al menos una sección');

    setGenerando(true);
    try {
      const { data } = await apiClient.post('/whatsapp/preparar-envio-masivo', {
        grado: gradoSel,
        secciones: seccionesSel,
        id_periodo_escolar: parseInt(periodoSel),
      });
      setEnlaces(data.enlaces || []);
      const estadosIniciales = {};
      (data.enlaces || []).forEach((e, i) => {
        estadosIniciales[i] = e.whatsapp_url ? ESTADO_LOCAL.PENDIENTE : ESTADO_LOCAL.SIN_TELEFONO;
      });
      setEstadosEnvio(estadosIniciales);
      toast.success(`${data.total_alumnos} alumnos listos para enviar`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al preparar envío masivo');
    } finally {
      setGenerando(false);
    }
  };

  const persistirLote = async (estadosFinales) => {
    if (!enlaces.length) return;
    const alumnosConfirmados = enlaces
      .map((e, i) => ({ enlace: e, estado: estadosFinales[i] }))
      .filter(x => x.estado === ESTADO_LOCAL.ENVIADO);

    if (alumnosConfirmados.length === 0) {
      toast('No se registró ningún envío.');
      return;
    }

    setConfirmando(true);
    try {
      await apiClient.post('/whatsapp/confirmar-envio-masivo', {
        grado: gradoSel,
        secciones: seccionesSel,
        id_periodo_escolar: parseInt(periodoSel),
        alumnos: alumnosConfirmados.map(x => ({
          id_alumno: x.enlace.id_alumno,
          id_padre: x.enlace.id_padre,
          telefono: x.enlace.telefono,
          id_curso_referencia: x.enlace.id_curso_referencia,
          contenido_mensaje: x.enlace.contenido_mensaje,
        })),
      });
      toast.success(`${alumnosConfirmados.length} envíos registrados en historial`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al registrar lote');
    } finally {
      setConfirmando(false);
    }
  };

  const abrirRafaga = () => {
    if (!enlaces.length) return;
    const conTelefono = enlaces.filter(e => e.whatsapp_url);
    if (conTelefono.length === 0) {
      toast.error('Ningún alumno tiene teléfono configurado');
      return;
    }
    if (!window.confirm(`Se abrirán ${conTelefono.length} pestañas de WhatsApp. ¿Continuar?`)) return;

    const nuevosEstados = { ...estadosEnvio };
    conTelefono.forEach((e, idx) => {
      setTimeout(() => {
        const ventana = window.open(e.whatsapp_url, '_blank', 'noopener');
        if (!ventana) {
          toast.error('El navegador bloqueó las pestañas. Permita popups del sitio.');
        }
      }, idx * 250);
      const indice = enlaces.findIndex(x => x.id_alumno === e.id_alumno);
      if (indice >= 0) nuevosEstados[indice] = ESTADO_LOCAL.ENVIADO;
    });
    setEstadosEnvio(nuevosEstados);

    setTimeout(() => persistirLote(nuevosEstados), conTelefono.length * 250 + 500);
  };

  const iniciarWizard = () => {
    if (!enlaces.length) return;
    const primerPendiente = enlaces.findIndex(e => e.whatsapp_url);
    if (primerPendiente < 0) {
      toast.error('Ningún alumno tiene teléfono configurado');
      return;
    }
    setIndiceWizard(primerPendiente);
    setModalWizard(true);
  };

  const marcarYAvanzar = (estado) => {
    const nuevosEstados = { ...estadosEnvio, [indiceWizard]: estado };
    setEstadosEnvio(nuevosEstados);

    const siguiente = enlaces.findIndex((e, i) => i > indiceWizard && e.whatsapp_url && nuevosEstados[i] === ESTADO_LOCAL.PENDIENTE);
    if (siguiente >= 0) {
      setIndiceWizard(siguiente);
    } else {
      setModalWizard(false);
      persistirLote(nuevosEstados);
    }
  };

  const abrirChatActual = () => {
    const enlace = enlaces[indiceWizard];
    if (!enlace?.whatsapp_url) return;
    window.open(enlace.whatsapp_url, '_blank', 'noopener');
    setEstadosEnvio(prev => ({ ...prev, [indiceWizard]: ESTADO_LOCAL.ABIERTO }));
  };

  const cancelarWizard = () => {
    if (Object.values(estadosEnvio).some(e => e === ESTADO_LOCAL.ENVIADO)) {
      persistirLote(estadosEnvio);
    }
    setModalWizard(false);
  };

  const resumen = useMemo(() => {
    const r = { total: enlaces.length, enviados: 0, omitidos: 0, pendientes: 0, sinTelefono: 0 };
    enlaces.forEach((_, i) => {
      const estado = estadosEnvio[i];
      if (estado === ESTADO_LOCAL.ENVIADO) r.enviados++;
      else if (estado === ESTADO_LOCAL.OMITIDO) r.omitidos++;
      else if (estado === ESTADO_LOCAL.SIN_TELEFONO) r.sinTelefono++;
      else r.pendientes++;
    });
    return r;
  }, [enlaces, estadosEnvio]);

  const enlaceActualWizard = enlaces[indiceWizard];

  return (
    <div className="space-y-6">
      <div className="glass-card-static p-6">
        <p className="text-sm text-slate-500 mb-4">
          Envío masivo del reporte general (notas + asistencia consolidada) a los padres de un grado completo.
          Sólo se incluyen las materias a las que el usuario tiene acceso.
        </p>

        <div className="flex flex-wrap gap-4 mb-5">
          <div className="w-56">
            <InputCampo
              label="Periodo escolar"
              name="periodoMasivo"
              type="select"
              value={periodoSel}
              onChange={(e) => setPeriodoSel(e.target.value)}
              options={periodos.filter(p => p.estado === 1).map(p => ({ value: p.id.toString(), label: p.nombre }))}
            />
          </div>
          <div className="w-56">
            <InputCampo
              label="Grado"
              name="gradoMasivo"
              type="select"
              value={gradoSel}
              onChange={(e) => setGradoSel(e.target.value)}
              options={grados.map(g => ({ value: g.grado, label: g.grado }))}
              disabled={!periodoSel || cargandoGrados}
            />
          </div>
        </div>

        {gradoSel && seccionesDisponibles.length > 0 && (
          <div className="mb-5">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-slate-700">Secciones</label>
              <button
                type="button"
                onClick={seleccionarTodasSecciones}
                className={`text-xs font-medium ${textoAcento}`}
              >
                {seccionesSel.length === seccionesDisponibles.length ? 'Quitar todas' : 'Seleccionar todas'}
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {seccionesDisponibles.map(s => {
                const seleccionada = seccionesSel.includes(s.seccion);
                return (
                  <button
                    key={s.seccion}
                    type="button"
                    onClick={() => toggleSeccion(s.seccion)}
                    className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors ${seleccionada ? claseBorde : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                  >
                    {s.seccion}
                    <span className="ml-2 text-xs text-slate-400">{s.cursos.length} curso{s.cursos.length === 1 ? '' : 's'}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <Boton tipo={claseBoton} onClick={prepararEnvio} disabled={generando || confirmando || !periodoSel || !gradoSel || seccionesSel.length === 0}>
          <HiPaperAirplane className="w-4 h-4 mr-1.5 inline-block" />
          {generando ? 'Preparando...' : 'Preparar envío'}
        </Boton>
      </div>

      {enlaces.length > 0 && (
        <div className="glass-card-static p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="font-display font-semibold text-slate-800 text-lg">
                {enlaces.length} alumno{enlaces.length === 1 ? '' : 's'} listo{enlaces.length === 1 ? '' : 's'} para enviar
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Enviados: {resumen.enviados} · Pendientes: {resumen.pendientes} · Sin teléfono: {resumen.sinTelefono}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Boton tipo={claseBoton} onClick={iniciarWizard} disabled={confirmando || resumen.pendientes === 0}>
                <HiViewGrid className="w-4 h-4 mr-1.5 inline-block" />
                Wizard secuencial
              </Boton>
              <Boton tipo="outline" onClick={abrirRafaga} disabled={confirmando || resumen.pendientes === 0}>
                <HiLightningBolt className="w-4 h-4 mr-1.5 inline-block" />
                Abrir todas en ráfaga
              </Boton>
            </div>
          </div>

          <div className="space-y-2 max-h-[480px] overflow-y-auto pr-2">
            {enlaces.map((e, i) => {
              const estado = estadosEnvio[i] || ESTADO_LOCAL.PENDIENTE;
              return (
                <div key={`${e.id_alumno}-${i}`} className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl">
                  <HiUserGroup className="w-4 h-4 text-slate-400" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-700 truncate">{e.nombre_alumno}</p>
                    <p className="text-xs text-slate-400 truncate">
                      {e.cursos_incluidos?.map(c => `${c.nombre}${c.seccion ? ' (' + c.seccion + ')' : ''}`).join(' · ') || 'Sin cursos'}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CLASES_ESTADO[estado]}`}>
                    {ETIQUETAS_ESTADO[estado]}
                  </span>
                  {e.whatsapp_url ? (
                    <a
                      href={e.whatsapp_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setEstadosEnvio(prev => ({ ...prev, [i]: ESTADO_LOCAL.ENVIADO }))}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-500 text-white rounded-lg text-xs font-medium hover:bg-green-600"
                    >
                      <HiExternalLink className="w-3 h-3" />
                      Abrir
                    </a>
                  ) : (
                    <span className="text-xs text-rose-500">Sin teléfono</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <Modal abierto={modalWizard} cerrar={cancelarWizard} titulo="Envío masivo guiado" ancho="max-w-2xl">
        {enlaceActualWizard && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-widest font-medium">Alumno {indiceWizard + 1} de {enlaces.length}</p>
                <h4 className="text-xl font-display font-bold text-slate-800">{enlaceActualWizard.nombre_alumno}</h4>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-400">Enviados: {resumen.enviados} / {enlaces.filter(e => e.whatsapp_url).length}</p>
              </div>
            </div>

            <div className="flex items-start gap-2 p-3 bg-slate-50 rounded-lg">
              <HiChat className="w-4 h-4 text-slate-400 mt-1 shrink-0" />
              <pre className="text-xs text-slate-600 whitespace-pre-wrap font-sans leading-relaxed flex-1 max-h-60 overflow-y-auto">
                {enlaceActualWizard.contenido_mensaje}
              </pre>
            </div>

            <div className="flex flex-wrap gap-2 justify-end">
              <Boton tipo="ghost" onClick={() => marcarYAvanzar(ESTADO_LOCAL.OMITIDO)}>
                Omitir
              </Boton>
              <Boton tipo="outline" onClick={abrirChatActual}>
                <HiExternalLink className="w-4 h-4 mr-1.5 inline-block" />
                Abrir WhatsApp
              </Boton>
              <Boton tipo={claseBoton} onClick={() => marcarYAvanzar(ESTADO_LOCAL.ENVIADO)}>
                <HiCheckCircle className="w-4 h-4 mr-1.5 inline-block" />
                Marcar enviado y siguiente
              </Boton>
            </div>

            <p className="text-xs text-slate-400 text-center">
              <HiExclamationCircle className="inline w-3 h-3 mr-1" />
              Recuerda presionar Enter o el botón verde en WhatsApp para enviar realmente el mensaje.
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
}
