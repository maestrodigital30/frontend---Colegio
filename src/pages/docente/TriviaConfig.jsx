import { useState, useEffect } from 'react';
import apiClient from '../../services/apiClient';
import Boton from '../../components/common/Boton';
import Modal from '../../components/common/Modal';
import InputCampo from '../../components/common/InputCampo';
import { HiPencil, HiTrash, HiPlus } from 'react-icons/hi';
import toast from 'react-hot-toast';

export default function TriviaConfigPage() {
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

  const cargarTemas = () => apiClient.get('/trivia/temas').then(({ data }) => setTemas(data)).catch(() => {});
  const cargarPreguntas = (id) => apiClient.get(`/trivia/preguntas/${id}`).then(({ data }) => setPreguntas(data)).catch(() => setPreguntas([]));

  useEffect(() => { cargarTemas(); }, []);
  useEffect(() => { if (temaSel) cargarPreguntas(temaSel.id); }, [temaSel]);

  const abrirCrearTema = () => { setEditando(null); setFormTema({ nombre: '', descripcion: '' }); setModalTema(true); };
  const abrirEditarTema = (t) => { setEditando(t); setFormTema({ nombre: t.nombre, descripcion: t.descripcion || '' }); setModalTema(true); };

  const handleSubmitTema = async (e) => {
    e.preventDefault();
    try {
      if (editando) { await apiClient.put(`/trivia/temas/${editando.id}`, formTema); toast.success('Actualizado'); }
      else { await apiClient.post('/trivia/temas', formTema); toast.success('Creado'); }
      setModalTema(false); cargarTemas();
    } catch (err) { toast.error(err.response?.data?.error || 'Error'); }
  };

  const inactivarTema = async (t) => {
    if (!confirm('¿Inactivar?')) return;
    try { await apiClient.delete(`/trivia/temas/${t.id}`); toast.success('Inactivado'); cargarTemas(); } catch { toast.error('Error'); }
  };

  const abrirCrearPregunta = () => {
    setEditando(null);
    setFormPregunta({ texto_pregunta: '', opciones: [{ texto_opcion: '', es_correcta: true }, { texto_opcion: '', es_correcta: false }, { texto_opcion: '', es_correcta: false }, { texto_opcion: '', es_correcta: false }] });
    setModalPregunta(true);
  };

  const abrirEditarPregunta = (p) => {
    setEditando(p);
    setFormPregunta({ texto_pregunta: p.texto_pregunta, opciones: p.tbl_trivia_opciones?.map(o => ({ texto_opcion: o.texto_opcion, es_correcta: o.es_correcta })) || [] });
    setModalPregunta(true);
  };

  const cambiarOpcion = (idx, campo, valor) => {
    setFormPregunta(prev => {
      const opts = [...prev.opciones];
      if (campo === 'es_correcta') opts.forEach((o, i) => { o.es_correcta = i === idx; });
      else opts[idx] = { ...opts[idx], [campo]: valor };
      return { ...prev, opciones: opts };
    });
  };

  const handleSubmitPregunta = async (e) => {
    e.preventDefault();
    if (formPregunta.opciones.length !== 4) return toast.error('4 opciones requeridas');
    if (!formPregunta.opciones.some(o => o.es_correcta)) return toast.error('Marque la correcta');
    try {
      const body = { ...formPregunta, id_tema: temaSel.id };
      if (editando) { await apiClient.put(`/trivia/preguntas/${editando.id}`, body); toast.success('Actualizada'); }
      else { await apiClient.post('/trivia/preguntas', body); toast.success('Creada'); }
      setModalPregunta(false); cargarPreguntas(temaSel.id);
    } catch (err) { toast.error(err.response?.data?.error || 'Error'); }
  };

  const inactivarPregunta = async (p) => {
    if (!confirm('¿Inactivar?')) return;
    try { await apiClient.delete(`/trivia/preguntas/${p.id}`); toast.success('Inactivada'); cargarPreguntas(temaSel.id); } catch { toast.error('Error'); }
  };

  return (
    <div className="animate-fade-up">
      <div className="mb-6">
        <p className="text-xs font-display font-medium text-secondary-600 uppercase tracking-widest mb-1">Trivia</p>
        <h1 className="text-3xl font-display font-bold text-slate-800">Configuración Trivia</h1>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="glass-card-static p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-slate-800">Temas</h2>
            <button onClick={abrirCrearTema} className="p-1 text-primary hover:bg-primary/10 rounded"><HiPlus className="w-5 h-5" /></button>
          </div>
          <div className="space-y-1">
            {temas.filter(t => t.estado === 1).map(t => (
              <div key={t.id} onClick={() => setTemaSel(t)} className={`flex items-center justify-between p-2 rounded-lg cursor-pointer ${temaSel?.id === t.id ? 'bg-primary-50 text-primary-600 border border-primary-200' : 'hover:bg-slate-50 text-slate-600'}`}>
                <span className="text-sm font-medium">{t.nombre}</span>
                <div className="flex gap-1">
                  <button onClick={(e) => { e.stopPropagation(); abrirEditarTema(t); }} className="p-1 text-primary-400 hover:bg-slate-50 rounded"><HiPencil className="w-3 h-3" /></button>
                  <button onClick={(e) => { e.stopPropagation(); inactivarTema(t); }} className="p-1 text-rose-400 hover:bg-slate-50 rounded"><HiTrash className="w-3 h-3" /></button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 glass-card-static p-4">
          {temaSel ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display font-semibold text-slate-800">Preguntas: {temaSel.nombre}</h2>
                <Boton onClick={abrirCrearPregunta}>+ Pregunta</Boton>
              </div>
              {preguntas.filter(p => p.estado === 1).length === 0 ? (
                <p className="text-slate-500 text-center py-4">No hay preguntas</p>
              ) : (
                <div className="space-y-3">
                  {preguntas.filter(p => p.estado === 1).map((p, idx) => (
                    <div key={p.id} className="border border-slate-200 rounded-lg p-3">
                      <div className="flex items-start justify-between">
                        <p className="text-sm font-medium text-slate-700">{idx + 1}. {p.texto_pregunta}</p>
                        <div className="flex gap-1 ml-2">
                          <button onClick={() => abrirEditarPregunta(p)} className="p-1 text-primary-400 hover:bg-slate-50 rounded"><HiPencil className="w-4 h-4" /></button>
                          <button onClick={() => inactivarPregunta(p)} className="p-1 text-rose-400 hover:bg-slate-50 rounded"><HiTrash className="w-4 h-4" /></button>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-1 mt-2">
                        {p.tbl_trivia_opciones?.map((o, oi) => (
                          <span key={oi} className={`text-xs px-2 py-1 rounded ${o.es_correcta ? 'bg-secondary-50 text-secondary-600 border border-secondary-200' : 'bg-slate-50 text-slate-500'}`}>
                            {String.fromCharCode(65 + oi)}) {o.texto_opcion}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <p className="text-slate-500 text-center py-8">Seleccione un tema</p>
          )}
        </div>
      </div>

      <Modal abierto={modalTema} cerrar={() => setModalTema(false)} titulo={editando ? 'Editar Tema' : 'Nuevo Tema'}>
        <form onSubmit={handleSubmitTema} className="space-y-3">
          <InputCampo label="Nombre" name="nombre" value={formTema.nombre} onChange={(e) => setFormTema({ ...formTema, nombre: e.target.value })} required />
          <InputCampo label="Descripción" name="desc" type="textarea" value={formTema.descripcion} onChange={(e) => setFormTema({ ...formTema, descripcion: e.target.value })} />
          <div className="flex justify-end gap-2 pt-3">
            <Boton tipo="outline" onClick={() => setModalTema(false)}>Cancelar</Boton>
            <Boton type="submit">{editando ? 'Actualizar' : 'Crear'}</Boton>
          </div>
        </form>
      </Modal>

      <Modal abierto={modalPregunta} cerrar={() => setModalPregunta(false)} titulo={editando ? 'Editar Pregunta' : 'Nueva Pregunta'} ancho="max-w-xl">
        <form onSubmit={handleSubmitPregunta} className="space-y-3">
          <InputCampo label="Pregunta" name="pregunta" type="textarea" value={formPregunta.texto_pregunta} onChange={(e) => setFormPregunta({ ...formPregunta, texto_pregunta: e.target.value })} required />
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-2">Opciones</label>
            {formPregunta.opciones.map((o, i) => (
              <div key={i} className="flex items-center gap-2 mb-2">
                <input type="radio" name="correcta" checked={o.es_correcta} onChange={() => cambiarOpcion(i, 'es_correcta', true)} className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium w-6 text-slate-600">{String.fromCharCode(65 + i)})</span>
                <input type="text" value={o.texto_opcion} onChange={(e) => cambiarOpcion(i, 'texto_opcion', e.target.value)} required placeholder={`Opción ${String.fromCharCode(65 + i)}`} className="flex-1 px-3 py-2 border border-slate-200 bg-slate-50 text-slate-700 rounded-lg text-sm" />
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
