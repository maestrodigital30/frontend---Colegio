import { useState, useEffect } from 'react';
import apiClient from '../../services/apiClient';
import Tabla from '../../components/common/Tabla';
import Boton from '../../components/common/Boton';
import Modal from '../../components/common/Modal';
import InputCampo from '../../components/common/InputCampo';
import { HiPencil, HiTrash, HiPlus, HiPuzzle, HiQuestionMarkCircle, HiCheckCircle, HiXCircle } from 'react-icons/hi';
import toast from 'react-hot-toast';

export default function TriviaPage() {
  const [temas, setTemas] = useState([]);
  const [preguntas, setPreguntas] = useState([]);
  const [temaSel, setTemaSel] = useState(null);
  const [modalTema, setModalTema] = useState(false);
  const [modalPregunta, setModalPregunta] = useState(false);
  const [editando, setEditando] = useState(null);
  const [formTema, setFormTema] = useState({ nombre: '', descripcion: '' });
  const [formPregunta, setFormPregunta] = useState({
    texto_pregunta: '',
    opciones: [
      { texto_opcion: '', es_correcta: true },
      { texto_opcion: '', es_correcta: false },
      { texto_opcion: '', es_correcta: false },
      { texto_opcion: '', es_correcta: false },
    ],
  });

  const cargarTemas = () => {
    apiClient.get('/trivia/temas').then(({ data }) => setTemas(data)).catch(() => {});
  };

  const cargarPreguntas = (idTema) => {
    apiClient.get(`/trivia/preguntas/${idTema}`).then(({ data }) => setPreguntas(data)).catch(() => setPreguntas([]));
  };

  useEffect(() => { cargarTemas(); }, []);
  useEffect(() => { if (temaSel) cargarPreguntas(temaSel.id); }, [temaSel]);

  // === TEMAS ===
  const abrirCrearTema = () => {
    setEditando(null);
    setFormTema({ nombre: '', descripcion: '' });
    setModalTema(true);
  };

  const abrirEditarTema = (t) => {
    setEditando(t);
    setFormTema({ nombre: t.nombre, descripcion: t.descripcion || '' });
    setModalTema(true);
  };

  const handleSubmitTema = async (e) => {
    e.preventDefault();
    try {
      if (editando) {
        await apiClient.put(`/trivia/temas/${editando.id}`, formTema);
        toast.success('Tema actualizado');
      } else {
        await apiClient.post('/trivia/temas', formTema);
        toast.success('Tema creado');
      }
      setModalTema(false);
      cargarTemas();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error');
    }
  };

  const inactivarTema = async (t) => {
    if (!confirm('¿Inactivar este tema?')) return;
    try {
      await apiClient.delete(`/trivia/temas/${t.id}`);
      toast.success('Tema inactivado');
      cargarTemas();
    } catch { toast.error('Error'); }
  };

  // === PREGUNTAS ===
  const abrirCrearPregunta = () => {
    setEditando(null);
    setFormPregunta({
      texto_pregunta: '',
      opciones: [
        { texto_opcion: '', es_correcta: true },
        { texto_opcion: '', es_correcta: false },
        { texto_opcion: '', es_correcta: false },
        { texto_opcion: '', es_correcta: false },
      ],
    });
    setModalPregunta(true);
  };

  const abrirEditarPregunta = (p) => {
    setEditando(p);
    setFormPregunta({
      texto_pregunta: p.texto_pregunta,
      opciones: p.tbl_trivia_opciones?.map(o => ({ texto_opcion: o.texto_opcion, es_correcta: o.es_correcta })) || [],
    });
    setModalPregunta(true);
  };

  const cambiarOpcion = (idx, campo, valor) => {
    setFormPregunta(prev => {
      const opts = [...prev.opciones];
      if (campo === 'es_correcta') {
        opts.forEach((o, i) => { o.es_correcta = i === idx; });
      } else {
        opts[idx] = { ...opts[idx], [campo]: valor };
      }
      return { ...prev, opciones: opts };
    });
  };

  const handleSubmitPregunta = async (e) => {
    e.preventDefault();
    if (formPregunta.opciones.length !== 4) return toast.error('Debe tener 4 opciones');
    if (!formPregunta.opciones.some(o => o.es_correcta)) return toast.error('Debe haber una opción correcta');

    try {
      const body = { ...formPregunta, id_tema: temaSel.id };
      if (editando) {
        await apiClient.put(`/trivia/preguntas/${editando.id}`, body);
        toast.success('Pregunta actualizada');
      } else {
        await apiClient.post('/trivia/preguntas', body);
        toast.success('Pregunta creada');
      }
      setModalPregunta(false);
      cargarPreguntas(temaSel.id);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error');
    }
  };

  const inactivarPregunta = async (p) => {
    if (!confirm('¿Inactivar esta pregunta?')) return;
    try {
      await apiClient.delete(`/trivia/preguntas/${p.id}`);
      toast.success('Pregunta inactivada');
      cargarPreguntas(temaSel.id);
    } catch { toast.error('Error'); }
  };

  return (
    <div className="animate-fade-up" style={{ fontSize: '115%' }}>
      <div className="mb-6">
        <p className="text-xs font-display font-bold uppercase tracking-widest mb-1" style={{ color: '#0060FF' }}>Gestión</p>
        <h1 className="text-3xl font-display font-bold text-black">Gestión de Trivia</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Panel de Temas */}
        <div className="rounded-2xl bg-white overflow-hidden" style={{ border: '2px solid #87CEEB' }}>
          {/* Header del panel */}
          <div className="px-4 py-3 flex items-center justify-between" style={{ background: 'linear-gradient(135deg, #0060FF 0%, #87CEEB 100%)' }}>
            <div className="flex items-center gap-2">
              <HiPuzzle className="w-6 h-6 text-white" />
              <h2 className="font-display font-bold text-white text-base">Temas</h2>
            </div>
            <button onClick={abrirCrearTema} className="p-1.5 bg-white/20 hover:bg-white/30 rounded-lg transition-colors" title="Nuevo tema">
              <HiPlus className="w-5 h-5 text-white" />
            </button>
          </div>
          <div className="p-3 space-y-1.5">
            {temas.filter(t => t.estado === 1).map(t => (
              <div
                key={t.id}
                onClick={() => setTemaSel(t)}
                className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${
                  temaSel?.id === t.id
                    ? 'text-white shadow-md'
                    : 'bg-sky-50 hover:bg-sky-100 border border-sky-200'
                }`}
                style={temaSel?.id === t.id ? { background: 'linear-gradient(135deg, #0060FF, #87CEEB)', border: '1px solid #0060FF' } : undefined}
              >
                <div className="flex items-center gap-2">
                  <HiPuzzle className={`w-5 h-5 flex-shrink-0 ${temaSel?.id === t.id ? 'text-white' : 'text-sky-500'}`} />
                  <span className="text-sm font-bold">{t.nombre}</span>
                </div>
                <div className="flex gap-1">
                  <button onClick={(e) => { e.stopPropagation(); abrirEditarTema(t); }} className={`p-1.5 rounded-lg transition-colors ${temaSel?.id === t.id ? 'hover:bg-white/20 text-white' : 'text-sky-600 hover:bg-sky-200'}`}>
                    <HiPencil className="w-4 h-4" />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); inactivarTema(t); }} className={`p-1.5 rounded-lg transition-colors ${temaSel?.id === t.id ? 'hover:bg-white/20 text-white' : 'text-rose-500 hover:bg-rose-100'}`}>
                    <HiTrash className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
            {temas.filter(t => t.estado === 1).length === 0 && (
              <p className="text-black/50 text-center py-6 font-medium">No hay temas creados</p>
            )}
          </div>
        </div>

        {/* Panel de Preguntas */}
        <div className="lg:col-span-2 rounded-2xl bg-white overflow-hidden" style={{ border: '2px solid #87CEEB' }}>
          {temaSel ? (
            <>
              {/* Header del panel */}
              <div className="px-4 py-3 flex items-center justify-between" style={{ background: 'linear-gradient(135deg, #87CEEB 0%, #0060FF 100%)' }}>
                <div className="flex items-center gap-2">
                  <HiQuestionMarkCircle className="w-6 h-6 text-white" />
                  <h2 className="font-display font-bold text-white text-base">Preguntas: {temaSel.nombre}</h2>
                </div>
                <Boton onClick={abrirCrearPregunta}>
                  <span className="flex items-center gap-1"><HiPlus className="w-4 h-4" /> Pregunta</span>
                </Boton>
              </div>
              <div className="p-4">
                {preguntas.filter(p => p.estado === 1).length === 0 ? (
                  <p className="text-black/50 text-center py-8 font-medium">No hay preguntas en este tema</p>
                ) : (
                  <div className="space-y-4">
                    {preguntas.filter(p => p.estado === 1).map((p, idx) => (
                      <div key={p.id} className="rounded-xl p-4" style={{ border: '1.5px solid #87CEEB', background: '#F0F9FF' }}>
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-start gap-2">
                            <span className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold" style={{ background: '#0060FF' }}>
                              {idx + 1}
                            </span>
                            <p className="text-sm font-bold text-black pt-0.5">{p.texto_pregunta}</p>
                          </div>
                          <div className="flex gap-1 ml-3 flex-shrink-0">
                            <button onClick={() => abrirEditarPregunta(p)} className="p-1.5 rounded-lg transition-colors hover:bg-sky-200" style={{ color: '#0060FF' }}>
                              <HiPencil className="w-5 h-5" />
                            </button>
                            <button onClick={() => inactivarPregunta(p)} className="p-1.5 text-rose-500 hover:bg-rose-100 rounded-lg transition-colors">
                              <HiTrash className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {p.tbl_trivia_opciones?.map((o, oi) => (
                            <div key={oi} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border ${
                              o.es_correcta
                                ? 'bg-emerald-200 text-emerald-800 border-emerald-300'
                                : 'bg-white text-black border-slate-200'
                            }`}>
                              {o.es_correcta
                                ? <HiCheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                                : <HiXCircle className="w-4 h-4 text-slate-300 flex-shrink-0" />
                              }
                              <span className="font-bold text-xs mr-1">{String.fromCharCode(65 + oi)})</span>
                              {o.texto_opcion}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-16">
              <HiPuzzle className="w-16 h-16 mb-4" style={{ color: '#87CEEB' }} />
              <p className="text-black font-bold text-lg">Seleccione un tema</p>
              <p className="text-black/50 text-sm mt-1">para ver y gestionar las preguntas</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal Tema */}
      <Modal abierto={modalTema} cerrar={() => setModalTema(false)} titulo={editando ? 'Editar Tema' : 'Nuevo Tema'}>
        <form onSubmit={handleSubmitTema} className="space-y-3">
          <InputCampo label="Nombre" name="nombre" value={formTema.nombre} onChange={(e) => setFormTema({ ...formTema, nombre: e.target.value })} required />
          <InputCampo label="Descripción" name="descripcion" type="textarea" value={formTema.descripcion} onChange={(e) => setFormTema({ ...formTema, descripcion: e.target.value })} />
          <div className="flex justify-end gap-2 pt-3">
            <Boton tipo="outline" onClick={() => setModalTema(false)}>Cancelar</Boton>
            <Boton type="submit">{editando ? 'Actualizar' : 'Crear'}</Boton>
          </div>
        </form>
      </Modal>

      {/* Modal Pregunta */}
      <Modal abierto={modalPregunta} cerrar={() => setModalPregunta(false)} titulo={editando ? 'Editar Pregunta' : 'Nueva Pregunta'} ancho="max-w-xl">
        <form onSubmit={handleSubmitPregunta} className="space-y-3">
          <InputCampo label="Pregunta" name="texto_pregunta" type="textarea" value={formPregunta.texto_pregunta} onChange={(e) => setFormPregunta({ ...formPregunta, texto_pregunta: e.target.value })} required />
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-2">Opciones (marque la correcta)</label>
            {formPregunta.opciones.map((o, i) => (
              <div key={i} className="flex items-center gap-2 mb-2">
                <input type="radio" name="correcta" checked={o.es_correcta} onChange={() => cambiarOpcion(i, 'es_correcta', true)} className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-slate-600 w-6">{String.fromCharCode(65 + i)})</span>
                <input type="text" value={o.texto_opcion} onChange={(e) => cambiarOpcion(i, 'texto_opcion', e.target.value)} required placeholder={`Opción ${String.fromCharCode(65 + i)}`} className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 text-slate-800 placeholder-slate-500" />
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-2 pt-3">
            <Boton tipo="outline" onClick={() => setModalPregunta(false)}>Cancelar</Boton>
            <Boton type="submit">{editando ? 'Actualizar' : 'Crear'}</Boton>
          </div>
        </form>
      </Modal>
    </div>
  );
}
