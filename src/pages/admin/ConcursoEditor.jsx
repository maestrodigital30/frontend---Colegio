import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  HiArrowLeft, HiSave, HiUpload, HiTrash, HiPlus, HiPlay, HiX,
  HiCheckCircle, HiPencil, HiPuzzle, HiPhotograph, HiLockOpen, HiLockClosed,
} from 'react-icons/hi';
import toast from 'react-hot-toast';
import {
  obtenerConcurso, actualizarConcurso, cambiarPublicacion,
  listarPreguntas, crearPregunta, actualizarPregunta, eliminarPregunta,
  subirMultimedia, eliminarMultimedia,
} from '../../services/concursoService';
import apiClient from '../../services/apiClient';
import { getUploadUrl } from '../../utils/storage';
import { CONCURSOS } from '../../utils/constants';
import Boton from '../../components/common/Boton';
import Modal from '../../components/common/Modal';
import { obtenerTemaVisual } from '../../features/concursos/temaVisualUtils';

const TEMAS = CONCURSOS.TEMAS_VISUALES;

export default function ConcursoEditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [concurso, setConcurso] = useState(null);
  const [preguntas, setPreguntas] = useState([]);
  const [cursos, setCursos] = useState([]);
  const [guardando, setGuardando] = useState(false);
  const [editPregunta, setEditPregunta] = useState(null);
  const [modalAbierto, setModalAbierto] = useState(false);

  const cargar = async () => {
    const [c, p] = await Promise.all([obtenerConcurso(id), listarPreguntas(id)]);
    setConcurso(c);
    setPreguntas(p);
  };

  useEffect(() => {
    apiClient.get('/cursos').then(({ data }) => setCursos(data)).catch(() => {});
    cargar().catch((err) => toast.error(err.response?.data?.error || 'Error al cargar concurso'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (!concurso) return <div className="py-20 text-center text-slate-400">Cargando...</div>;

  const cambiar = (campo, valor) => setConcurso((c) => ({ ...c, [campo]: valor }));

  const guardarConcurso = async () => {
    setGuardando(true);
    try {
      const payload = { ...concurso };
      delete payload.tbl_cursos;
      delete payload.tbl_concurso_preguntas;
      await actualizarConcurso(id, payload);
      toast.success('Concurso guardado');
      cargar();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al guardar');
    } finally {
      setGuardando(false);
    }
  };

  const handlePublicar = async () => {
    try {
      const nuevo = await cambiarPublicacion(id, !concurso.publicado);
      setConcurso((c) => ({ ...c, publicado: nuevo.publicado }));
      toast.success(nuevo.publicado ? 'Concurso publicado' : 'Concurso despublicado');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al cambiar publicacion');
    }
  };

  const subirCover = async (file) => {
    if (!file) return;
    try {
      const r = await subirMultimedia(file);
      if (concurso.multimedia_url) await eliminarMultimedia(concurso.multimedia_url).catch(() => {});
      setConcurso((c) => ({ ...c, multimedia_url: r.url, multimedia_tipo: r.tipo }));
      toast.success('Multimedia subida');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al subir multimedia');
    }
  };

  const quitarCover = async () => {
    if (concurso.multimedia_url) await eliminarMultimedia(concurso.multimedia_url).catch(() => {});
    setConcurso((c) => ({ ...c, multimedia_url: null, multimedia_tipo: null }));
  };

  const abrirNueva = () => {
    setEditPregunta({
      id: null,
      texto: '',
      puntos: '',
      tiempo_limite_segundos: '',
      permite_multiple: false,
      multimedia_url: null,
      multimedia_tipo: null,
      opciones: [
        { texto: '', es_correcta: true, multimedia_url: null, multimedia_tipo: null },
        { texto: '', es_correcta: false, multimedia_url: null, multimedia_tipo: null },
      ],
    });
    setModalAbierto(true);
  };

  const abrirEditar = (p) => {
    setEditPregunta({
      id: p.id,
      texto: p.texto,
      puntos: p.puntos ?? '',
      tiempo_limite_segundos: p.tiempo_limite_segundos ?? '',
      permite_multiple: p.permite_multiple,
      multimedia_url: p.multimedia_url,
      multimedia_tipo: p.multimedia_tipo,
      opciones: p.tbl_concurso_opciones.map((o) => ({
        id: o.id, texto: o.texto || '', es_correcta: o.es_correcta,
        multimedia_url: o.multimedia_url, multimedia_tipo: o.multimedia_tipo,
      })),
    });
    setModalAbierto(true);
  };

  const guardarPregunta = async (payload) => {
    try {
      const datos = { ...payload, id_concurso: parseInt(id) };
      if (payload.id) {
        await actualizarPregunta(payload.id, datos);
        toast.success('Pregunta actualizada');
      } else {
        await crearPregunta(datos);
        toast.success('Pregunta creada');
      }
      setModalAbierto(false);
      cargar();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al guardar pregunta');
    }
  };

  const handleEliminarPregunta = async (p) => {
    if (!confirm(`¿Eliminar la pregunta "${p.texto.slice(0, 40)}..."?`)) return;
    try {
      await eliminarPregunta(p.id);
      toast.success('Pregunta eliminada');
      cargar();
    } catch (err) { toast.error(err.response?.data?.error || 'Error'); }
  };

  return (
    <div className="space-y-5 pb-10">
      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap">
        <button onClick={() => navigate('/admin/concursos')} className="p-2 rounded-lg text-slate-600 hover:bg-slate-100"><HiArrowLeft /></button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl sm:text-2xl font-display font-bold text-slate-800 truncate">{concurso.titulo}</h1>
          <p className="text-xs text-slate-500">
            {concurso.publicado ? <span className="text-emerald-600 font-bold">Publicado</span> : <span>Borrador</span>}
            {' · '}{preguntas.length} pregunta(s)
          </p>
        </div>
        <Boton tipo="outline" onClick={() => navigate(`/admin/concursos/${id}/jugar?preview=1`)}>
          <HiPlay className="inline w-4 h-4 mr-1" /> Previsualizar
        </Boton>
        <Boton tipo={concurso.publicado ? 'danger' : 'secondary'} onClick={handlePublicar}>
          {concurso.publicado ? <><HiLockClosed className="inline w-4 h-4 mr-1" /> Despublicar</> : <><HiLockOpen className="inline w-4 h-4 mr-1" /> Publicar</>}
        </Boton>
        <Boton onClick={guardarConcurso} disabled={guardando}>
          <HiSave className="inline w-4 h-4 mr-1" /> {guardando ? 'Guardando...' : 'Guardar'}
        </Boton>
      </div>

      {/* Configuracion */}
      <SeccionConfig concurso={concurso} cursos={cursos} cambiar={cambiar} subirCover={subirCover} quitarCover={quitarCover} />

      {/* Preguntas */}
      <SeccionPreguntas
        preguntas={preguntas}
        onNueva={abrirNueva}
        onEditar={abrirEditar}
        onEliminar={handleEliminarPregunta}
      />

      <Modal abierto={modalAbierto} cerrar={() => setModalAbierto(false)} titulo={editPregunta?.id ? 'Editar pregunta' : 'Nueva pregunta'} ancho="max-w-3xl">
        {editPregunta && (
          <FormularioPregunta
            inicial={editPregunta}
            onGuardar={guardarPregunta}
            onCancelar={() => setModalAbierto(false)}
          />
        )}
      </Modal>
    </div>
  );
}

function SeccionConfig({ concurso, cursos, cambiar, subirCover, quitarCover }) {
  const fileRef = useRef(null);
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Datos */}
      <div className="lg:col-span-2 glass-card-static p-5 space-y-4">
        <h2 className="font-display font-bold text-slate-700">Datos</h2>
        <CampoTexto label="Titulo *" valor={concurso.titulo} onChange={(v) => cambiar('titulo', v)} />
        <CampoTextarea label="Descripcion" valor={concurso.descripcion || ''} onChange={(v) => cambiar('descripcion', v)} />
        <div className="grid grid-cols-2 gap-3">
          <CampoSelect label="Curso" valor={concurso.id_curso ?? ''} onChange={(v) => cambiar('id_curso', v === '' ? null : parseInt(v))}>
            <option value="">Global (todos los alumnos)</option>
            {cursos.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </CampoSelect>
          <CampoTexto label="Area" valor={concurso.area || ''} onChange={(v) => cambiar('area', v)} placeholder="Ej. Ciencias" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <CampoTexto label="Nivel" valor={concurso.nivel || ''} onChange={(v) => cambiar('nivel', v)} placeholder="Ej. Primaria 3°" />
          <CampoSelect label="Tema visual" valor={concurso.tema_visual} onChange={(v) => cambiar('tema_visual', v)}>
            {TEMAS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </CampoSelect>
        </div>
      </div>

      {/* Cover multimedia */}
      <div className="glass-card-static p-5 space-y-3">
        <h2 className="font-display font-bold text-slate-700">Portada</h2>
        <div className="aspect-video rounded-xl overflow-hidden flex items-center justify-center border border-slate-200"
             style={{ background: `linear-gradient(135deg, ${obtenerTemaVisual(concurso.tema_visual).primario}, ${obtenerTemaVisual(concurso.tema_visual).secundario})` }}>
          {concurso.multimedia_url
            ? (concurso.multimedia_tipo === 'video'
                ? <video src={getUploadUrl(concurso.multimedia_url)} controls className="w-full h-full" />
                : <img src={getUploadUrl(concurso.multimedia_url)} alt="" className="w-full h-full object-cover" />)
            : <HiPhotograph className="w-10 h-10 text-white/50" />}
        </div>
        <div className="flex gap-2">
          <input ref={fileRef} type="file" accept="image/*,video/*" hidden onChange={(e) => subirCover(e.target.files?.[0])} />
          <Boton tipo="outline" onClick={() => fileRef.current?.click()}><HiUpload className="inline w-4 h-4 mr-1" /> Subir</Boton>
          {concurso.multimedia_url && <Boton tipo="danger" onClick={quitarCover}><HiTrash className="inline w-4 h-4" /></Boton>}
        </div>
      </div>

      {/* Configuracion de juego */}
      <div className="lg:col-span-3 glass-card-static p-5 space-y-4">
        <h2 className="font-display font-bold text-slate-700">Configuracion de juego</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <CampoNumero label="Tiempo por pregunta (s)" valor={concurso.tiempo_por_pregunta} onChange={(v) => cambiar('tiempo_por_pregunta', v)} min={3} />
          <CampoNumero label="Puntos base" valor={concurso.puntos_base} onChange={(v) => cambiar('puntos_base', v)} />
          <CampoNumero label="Penalizacion por error" valor={concurso.penalizacion_incorrecta} onChange={(v) => cambiar('penalizacion_incorrecta', v)} />
          <CampoNumero label="Max intentos por usuario (0 = ilimitado)" valor={concurso.max_intentos_por_usuario} onChange={(v) => cambiar('max_intentos_por_usuario', v)} />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <CampoSelect label="Orden preguntas" valor={concurso.orden_preguntas} onChange={(v) => cambiar('orden_preguntas', v)}>
            <option value="fijo">Fijo</option>
            <option value="aleatorio">Aleatorio</option>
          </CampoSelect>
          <CampoSelect label="Orden opciones" valor={concurso.orden_opciones} onChange={(v) => cambiar('orden_opciones', v)}>
            <option value="fijo">Fijo</option>
            <option value="aleatorio">Aleatorio</option>
          </CampoSelect>
          <CampoToggle label="Permite reintentos" valor={concurso.permite_reintentos} onChange={(v) => cambiar('permite_reintentos', v)} />
        </div>
      </div>

      {/* Comodines */}
      <div className="lg:col-span-2 glass-card-static p-5 space-y-3">
        <h2 className="font-display font-bold text-slate-700">Comodines</h2>
        <div className="space-y-2">
          <CampoToggle label="Comodin 50:50" valor={concurso.comodin_50_50_habilitado} onChange={(v) => cambiar('comodin_50_50_habilitado', v)} />
          <CampoToggle label="Comodin tiempo extra" valor={concurso.comodin_tiempo_extra_habilitado} onChange={(v) => cambiar('comodin_tiempo_extra_habilitado', v)} />
          {concurso.comodin_tiempo_extra_habilitado && (
            <CampoNumero label="Segundos extra" valor={concurso.comodin_tiempo_extra_segundos} onChange={(v) => cambiar('comodin_tiempo_extra_segundos', v)} min={1} />
          )}
          <CampoToggle label="Comodin puntuacion x2" valor={concurso.comodin_doble_puntaje_habilitado} onChange={(v) => cambiar('comodin_doble_puntaje_habilitado', v)} />
        </div>
      </div>

      {/* Bonus */}
      <div className="glass-card-static p-5 space-y-3">
        <h2 className="font-display font-bold text-slate-700">Ronda bonus</h2>
        <CampoToggle label="Habilitar ronda bonus" valor={concurso.bonus_habilitado} onChange={(v) => cambiar('bonus_habilitado', v)} />
        {concurso.bonus_habilitado && (
          <>
            <CampoNumero label="Cantidad de tarjetas" valor={concurso.bonus_cantidad_tarjetas} onChange={(v) => cambiar('bonus_cantidad_tarjetas', v)} min={2} max={10} />
            <CampoNumero label="Premio minimo" valor={concurso.bonus_premio_minimo} onChange={(v) => cambiar('bonus_premio_minimo', v)} />
            <CampoNumero label="Premio maximo" valor={concurso.bonus_premio_maximo} onChange={(v) => cambiar('bonus_premio_maximo', v)} />
          </>
        )}
      </div>
    </div>
  );
}

function SeccionPreguntas({ preguntas, onNueva, onEditar, onEliminar }) {
  return (
    <div className="glass-card-static p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-display font-bold text-slate-700"><HiPuzzle className="inline w-5 h-5 mr-1" /> Preguntas</h2>
        <Boton onClick={onNueva}><HiPlus className="inline w-4 h-4 mr-1" /> Nueva pregunta</Boton>
      </div>
      {preguntas.length === 0 ? (
        <p className="text-center text-slate-400 py-10">Aun no hay preguntas. Agrega la primera.</p>
      ) : (
        <ol className="space-y-2">
          {preguntas.map((p, idx) => (
            <li key={p.id} className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50">
              <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-100 text-primary-700 font-bold flex items-center justify-center">{idx + 1}</span>
              {p.multimedia_url && (
                <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                  {p.multimedia_tipo === 'video'
                    ? <video src={getUploadUrl(p.multimedia_url)} muted className="w-full h-full object-cover" />
                    : <img src={getUploadUrl(p.multimedia_url)} alt="" className="w-full h-full object-cover" />}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-700 truncate">{p.texto}</p>
                <p className="text-xs text-slate-500">
                  {p.tbl_concurso_opciones.length} opciones
                  {' · '}{p.tbl_concurso_opciones.filter((o) => o.es_correcta).length} correcta(s)
                  {p.permite_multiple && ' · multi-respuesta'}
                </p>
              </div>
              <button onClick={() => onEditar(p)} className="p-2 rounded-lg text-slate-500 hover:text-primary-600 hover:bg-primary-50"><HiPencil className="w-4 h-4" /></button>
              <button onClick={() => onEliminar(p)} className="p-2 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50"><HiTrash className="w-4 h-4" /></button>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

function FormularioPregunta({ inicial, onGuardar, onCancelar }) {
  const [form, setForm] = useState(inicial);
  const fileRefPreg = useRef(null);

  const setCampo = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const setOpcion = (idx, k, v) => setForm((f) => {
    const opciones = [...f.opciones];
    if (k === 'es_correcta' && v && !f.permite_multiple) {
      opciones.forEach((o, i) => { o.es_correcta = i === idx; });
    } else {
      opciones[idx] = { ...opciones[idx], [k]: v };
    }
    return { ...f, opciones };
  });

  const agregarOpcion = () => {
    if (form.opciones.length >= CONCURSOS.MAX_OPCIONES) return;
    setForm((f) => ({ ...f, opciones: [...f.opciones, { texto: '', es_correcta: false, multimedia_url: null, multimedia_tipo: null }] }));
  };
  const quitarOpcion = (idx) => {
    if (form.opciones.length <= CONCURSOS.MIN_OPCIONES) return;
    setForm((f) => ({ ...f, opciones: f.opciones.filter((_, i) => i !== idx) }));
  };

  const subirMediaPregunta = async (file) => {
    if (!file) return;
    try {
      const r = await subirMultimedia(file);
      if (form.multimedia_url) await eliminarMultimedia(form.multimedia_url).catch(() => {});
      setForm((f) => ({ ...f, multimedia_url: r.url, multimedia_tipo: r.tipo }));
    } catch (err) { toast.error(err.response?.data?.error || 'Error al subir'); }
  };

  const subirMediaOpcion = async (idx, file) => {
    if (!file) return;
    try {
      const r = await subirMultimedia(file);
      const op = form.opciones[idx];
      if (op.multimedia_url) await eliminarMultimedia(op.multimedia_url).catch(() => {});
      setOpcion(idx, 'multimedia_url', r.url);
      setOpcion(idx, 'multimedia_tipo', r.tipo);
    } catch (err) { toast.error(err.response?.data?.error || 'Error al subir'); }
  };

  const submit = (e) => {
    e.preventDefault();
    if (!form.texto.trim()) { toast.error('Escribe la pregunta'); return; }
    if (form.opciones.length < CONCURSOS.MIN_OPCIONES) { toast.error('Minimo 2 opciones'); return; }
    if (!form.opciones.some((o) => o.es_correcta)) { toast.error('Al menos una opcion debe ser correcta'); return; }
    onGuardar({
      ...form,
      puntos: form.puntos === '' ? null : parseInt(form.puntos),
      tiempo_limite_segundos: form.tiempo_limite_segundos === '' ? null : parseInt(form.tiempo_limite_segundos),
    });
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <CampoTextarea label="Texto de la pregunta *" valor={form.texto} onChange={(v) => setCampo('texto', v)} />

      <div className="grid grid-cols-2 gap-3">
        <CampoNumero label="Puntos (vacio = usa puntos base del concurso)" valor={form.puntos} onChange={(v) => setCampo('puntos', v)} />
        <CampoNumero label="Tiempo limite (vacio = usa tiempo del concurso)" valor={form.tiempo_limite_segundos} onChange={(v) => setCampo('tiempo_limite_segundos', v)} />
      </div>

      <CampoToggle label="Permite varias respuestas correctas (multi-respuesta)" valor={form.permite_multiple} onChange={(v) => setCampo('permite_multiple', v)} />

      {/* Multimedia pregunta */}
      <div>
        <p className="text-xs font-display font-medium text-slate-500 uppercase mb-1">Multimedia de la pregunta</p>
        <div className="flex items-center gap-3">
          {form.multimedia_url && (
            <div className="w-20 h-20 rounded-lg overflow-hidden bg-slate-100">
              {form.multimedia_tipo === 'video'
                ? <video src={getUploadUrl(form.multimedia_url)} muted className="w-full h-full object-cover" />
                : <img src={getUploadUrl(form.multimedia_url)} alt="" className="w-full h-full object-cover" />}
            </div>
          )}
          <input ref={fileRefPreg} type="file" accept="image/*,video/*" hidden onChange={(e) => subirMediaPregunta(e.target.files?.[0])} />
          <button type="button" onClick={() => fileRefPreg.current?.click()} className="px-3 py-2 rounded-lg border border-slate-200 text-sm hover:bg-slate-50 inline-flex items-center gap-1">
            <HiUpload className="w-4 h-4" /> {form.multimedia_url ? 'Reemplazar' : 'Subir'}
          </button>
          {form.multimedia_url && (
            <button type="button" onClick={async () => {
              await eliminarMultimedia(form.multimedia_url).catch(() => {});
              setForm((f) => ({ ...f, multimedia_url: null, multimedia_tipo: null }));
            }} className="px-3 py-2 rounded-lg text-rose-600 hover:bg-rose-50 text-sm">
              <HiTrash className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Opciones */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-display font-medium text-slate-500 uppercase">Opciones ({form.opciones.length}/{CONCURSOS.MAX_OPCIONES})</p>
          {form.opciones.length < CONCURSOS.MAX_OPCIONES && (
            <button type="button" onClick={agregarOpcion} className="text-xs text-primary-600 hover:underline">+ Agregar opcion</button>
          )}
        </div>
        <div className="space-y-2">
          {form.opciones.map((op, idx) => (
            <FilaOpcion
              key={idx}
              indice={idx}
              opcion={op}
              permiteMultiple={form.permite_multiple}
              onTexto={(v) => setOpcion(idx, 'texto', v)}
              onCorrecta={(v) => setOpcion(idx, 'es_correcta', v)}
              onSubirMedia={(file) => subirMediaOpcion(idx, file)}
              onQuitarMedia={async () => {
                if (op.multimedia_url) await eliminarMultimedia(op.multimedia_url).catch(() => {});
                setOpcion(idx, 'multimedia_url', null);
                setOpcion(idx, 'multimedia_tipo', null);
              }}
              onQuitar={form.opciones.length > CONCURSOS.MIN_OPCIONES ? () => quitarOpcion(idx) : null}
            />
          ))}
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
        <Boton tipo="outline" onClick={onCancelar}>Cancelar</Boton>
        <Boton type="submit">Guardar pregunta</Boton>
      </div>
    </form>
  );
}

function FilaOpcion({ indice, opcion, permiteMultiple, onTexto, onCorrecta, onSubirMedia, onQuitarMedia, onQuitar }) {
  const fileRef = useRef(null);
  return (
    <div className="p-3 rounded-xl border border-slate-200 bg-white">
      <div className="flex items-start gap-3">
        <span className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 font-bold flex items-center justify-center flex-shrink-0">
          {String.fromCharCode(65 + indice)}
        </span>
        <div className="flex-1 min-w-0 space-y-2">
          <input
            value={opcion.texto || ''}
            onChange={(e) => onTexto(e.target.value)}
            placeholder="Texto de la opcion (o solo multimedia)"
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30"
          />
          {opcion.multimedia_url && (
            <div className="w-32 rounded-lg overflow-hidden bg-slate-100">
              {opcion.multimedia_tipo === 'video'
                ? <video src={getUploadUrl(opcion.multimedia_url)} muted className="w-full h-20 object-cover" />
                : <img src={getUploadUrl(opcion.multimedia_url)} alt="" className="w-full h-20 object-cover" />}
            </div>
          )}
          <div className="flex items-center gap-2 flex-wrap">
            <label className="inline-flex items-center gap-1 text-xs text-slate-600 cursor-pointer">
              <input
                type={permiteMultiple ? 'checkbox' : 'radio'}
                checked={!!opcion.es_correcta}
                onChange={(e) => onCorrecta(e.target.checked)}
                className="accent-emerald-500"
              />
              {opcion.es_correcta ? <HiCheckCircle className="w-4 h-4 text-emerald-500" /> : null}
              Correcta
            </label>
            <input ref={fileRef} type="file" accept="image/*,video/*" hidden onChange={(e) => onSubirMedia(e.target.files?.[0])} />
            <button type="button" onClick={() => fileRef.current?.click()} className="text-xs text-primary-600 hover:underline inline-flex items-center gap-1">
              <HiUpload className="w-3 h-3" /> {opcion.multimedia_url ? 'Reemplazar' : 'Multimedia'}
            </button>
            {opcion.multimedia_url && (
              <button type="button" onClick={onQuitarMedia} className="text-xs text-rose-600 hover:underline">Quitar media</button>
            )}
            {onQuitar && (
              <button type="button" onClick={onQuitar} className="text-xs text-rose-600 hover:underline inline-flex items-center gap-1 ml-auto">
                <HiX className="w-3 h-3" /> Eliminar opcion
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ===== Campos =====
function Campo({ label, children }) {
  return (
    <div>
      {label && <label className="block text-xs font-display font-medium text-slate-500 mb-1 uppercase">{label}</label>}
      {children}
    </div>
  );
}
function CampoTexto({ label, valor, onChange, placeholder }) {
  return <Campo label={label}>
    <input value={valor || ''} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400" />
  </Campo>;
}
function CampoTextarea({ label, valor, onChange, placeholder }) {
  return <Campo label={label}>
    <textarea value={valor || ''} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={3} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400" />
  </Campo>;
}
function CampoNumero({ label, valor, onChange, min, max }) {
  return <Campo label={label}>
    <input
      type="number"
      value={valor ?? ''}
      onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))}
      min={min}
      max={max}
      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400"
    />
  </Campo>;
}
function CampoSelect({ label, valor, onChange, children }) {
  return <Campo label={label}>
    <select value={valor ?? ''} onChange={(e) => onChange(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 bg-white">
      {children}
    </select>
  </Campo>;
}
function CampoToggle({ label, valor, onChange }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer select-none">
      <button
        type="button"
        onClick={() => onChange(!valor)}
        className={`relative w-10 h-6 rounded-full transition-colors ${valor ? 'bg-emerald-500' : 'bg-slate-300'}`}
      >
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transform transition-transform ${valor ? 'translate-x-4' : ''}`} />
      </button>
      <span className="text-sm text-slate-700">{label}</span>
    </label>
  );
}
