import { useState, useMemo, useRef } from 'react';
import useCrud from '../../hooks/useCrud';
import apiClient from '../../services/apiClient';
import { getUploadUrl } from '../../utils/storage';
import Tabla from '../../components/common/Tabla';
import Boton from '../../components/common/Boton';
import Modal from '../../components/common/Modal';
import InputCampo from '../../components/common/InputCampo';
import { HiPencil, HiBan, HiCheckCircle, HiUser, HiEye, HiDownload, HiTrash } from 'react-icons/hi';
import toast from 'react-hot-toast';

export default function ProfesoresPage() {
  const { datos, cargando, crear, actualizar, inactivar, activar, cargar } = useCrud('/docentes');
  const [modal, setModal] = useState(false);
  const [modalPerfil, setModalPerfil] = useState(false);
  const [editando, setEditando] = useState(null);
  const [perfilDocente, setPerfilDocente] = useState(null);
  const [form, setForm] = useState({ nombres: '', apellidos: '', correo: '', contrasena: '', especialidad: '', telefono: '' });
  const [archivoFoto, setArchivoFoto] = useState(null);
  const [fotoPreview, setFotoPreview] = useState(null);
  const inputFotoRef = useRef(null);

  const columnas = [
    { key: 'id', label: 'ID' },
    {
      key: 'foto', label: 'Foto',
      render: (f) => (
        <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-100 flex items-center justify-center border border-slate-200">
          {f.foto_url
            ? <img src={getUploadUrl(f.foto_url)} alt="" className="w-full h-full object-cover" />
            : <HiUser className="w-5 h-5 text-slate-400" />}
        </div>
      ),
    },
    { key: 'nombres', label: 'Nombres', render: (f) => f.tbl_usuarios?.nombres || f.nombres },
    { key: 'apellidos', label: 'Apellidos', render: (f) => f.tbl_usuarios?.apellidos || f.apellidos },
    { key: 'correo', label: 'Correo', headerClassName: 'bg-sky-200 text-sky-800', cellClassName: 'bg-sky-100 text-sky-800 font-medium', render: (f) => f.tbl_usuarios?.correo || '' },
    { key: 'especialidad', label: 'Especialidad', headerClassName: 'bg-primary-200 text-primary-800', cellClassName: 'bg-primary-100 text-primary-800 font-medium' },
    { key: 'telefono', label: 'Telefono', headerClassName: 'bg-teal-200 text-teal-800', cellClassName: 'bg-teal-100 text-teal-800 font-medium' },
    { key: 'estado', label: 'Estado', headerClassName: 'bg-amber-200 text-amber-800', cellClassName: 'bg-amber-100', render: (f) => f.estado === 1 ? <span className="text-emerald-700 font-semibold">Activo</span> : <span className="text-rose-600 font-semibold">Inactivo</span> },
  ];

  const especialidades = useMemo(() => {
    const unicas = [...new Set(datos.map(d => d.especialidad).filter(Boolean))];
    return unicas.sort().map(e => ({ value: e, label: e }));
  }, [datos]);

  const filtros = useMemo(() => [
    ...(especialidades.length > 0 ? [{
      key: 'especialidad', label: 'Todas las especialidades', opciones: especialidades,
      filterFn: (f, v) => f.especialidad === v,
    }] : []),
    { key: 'estado', label: 'Todos los estados', opciones: [
      { value: '1', label: 'Activo' },
      { value: '0', label: 'Inactivo' },
    ], filterFn: (f, v) => f.estado === parseInt(v) },
  ], [especialidades]);

  const abrirCrear = () => {
    setEditando(null);
    setForm({ nombres: '', apellidos: '', correo: '', contrasena: '', especialidad: '', telefono: '' });
    setFotoPreview(null);
    setArchivoFoto(null);
    setModal(true);
  };

  const abrirEditar = (d) => {
    setEditando(d);
    setForm({
      nombres: d.tbl_usuarios?.nombres || '',
      apellidos: d.tbl_usuarios?.apellidos || '',
      correo: d.tbl_usuarios?.correo || '',
      contrasena: '',
      especialidad: d.especialidad || '',
      telefono: d.telefono || '',
    });
    setFotoPreview(d.foto_url ? getUploadUrl(d.foto_url) : null);
    setArchivoFoto(null);
    setModal(true);
  };

  const abrirPerfil = (d) => {
    setPerfilDocente(d);
    setModalPerfil(true);
  };

  const handleFotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('La imagen no debe superar 5 MB'); return; }
    setArchivoFoto(file);
    setFotoPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let id;
      const body = { ...form };
      if (!body.contrasena && editando) delete body.contrasena;
      if (editando) {
        await actualizar(editando.id, body);
        id = editando.id;
      } else {
        const resultado = await crear(body);
        id = resultado.perfil?.id || resultado.id;
      }
      if (archivoFoto && id) {
        const fd = new FormData();
        fd.append('foto', archivoFoto);
        await apiClient.post(`/docentes/${id}/foto`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        cargar();
      }
      setModal(false);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error');
    }
  };

  const handleEliminarFoto = async (docente) => {
    if (!confirm('¿Eliminar la foto de este docente?')) return;
    try {
      await apiClient.delete(`/docentes/${docente.id}/foto`);
      toast.success('Foto eliminada');
      cargar();
      if (perfilDocente?.id === docente.id) {
        setPerfilDocente({ ...docente, foto_url: null });
      }
    } catch {
      toast.error('Error al eliminar foto');
    }
  };

  const handleDescargarFoto = async (docente) => {
    const url = getUploadUrl(docente.foto_url);
    if (!url) return;
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const ext = docente.foto_url.split('.').pop();
      const nombre = `${docente.nombres}_${docente.apellidos}`.replace(/\s+/g, '_');
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `${nombre}.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(a.href);
    } catch {
      toast.error('Error al descargar foto');
    }
  };

  const handleToggleEstado = async (d) => {
    if (d.estado === 1) {
      if (!confirm('¿Desactivar este docente?')) return;
      try { await inactivar(d.id); } catch { toast.error('Error al desactivar'); }
    } else {
      if (!confirm('¿Activar este docente?')) return;
      try { await activar(d.id); } catch { toast.error('Error al activar'); }
    }
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  if (cargando) return <div className="text-center py-8 text-slate-400">Cargando...</div>;

  return (
    <div className="animate-fade-up" style={{ fontSize: '115%' }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-xs font-display font-medium text-primary-600 uppercase tracking-widest mb-1">Gestion</p>
          <h1 className="text-3xl font-display font-bold text-slate-800">Profesores</h1>
        </div>
        <Boton onClick={abrirCrear}>Nuevo Profesor</Boton>
      </div>

      <Tabla columnas={columnas} datos={datos} filtros={filtros} accionesClassName="bg-primary-200 text-primary-800" acciones={(fila) => (
        <>
          <button onClick={() => abrirPerfil(fila)} className="p-1.5 text-slate-500 hover:text-primary-600 hover:bg-primary-100 rounded-lg transition-colors" title="Ver perfil"><HiEye className="w-5 h-5" /></button>
          <button onClick={() => abrirEditar(fila)} className="p-1.5 text-primary-500 hover:text-primary-700 hover:bg-primary-100 rounded-lg transition-colors" title="Editar"><HiPencil className="w-5 h-5" /></button>
          {fila.estado === 1 ? (
            <button onClick={() => handleToggleEstado(fila)} className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors" title="Desactivar"><HiBan className="w-5 h-5" /></button>
          ) : (
            <button onClick={() => handleToggleEstado(fila)} className="p-1.5 text-secondary-500 hover:text-secondary-700 hover:bg-secondary-50 rounded-lg transition-colors" title="Activar"><HiCheckCircle className="w-5 h-5" /></button>
          )}
        </>
      )} />

      {/* Modal crear / editar */}
      <Modal abierto={modal} cerrar={() => setModal(false)} titulo={editando ? 'Editar Profesor' : 'Nuevo Profesor'}>
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Foto */}
          <div className="mb-4">
            <label className="block text-xs font-display font-medium text-slate-500 mb-1.5 tracking-wide uppercase">
              Foto del Profesor
            </label>
            <div className="flex items-center gap-4">
              <div
                className="w-20 h-24 rounded-xl border-2 border-dashed border-slate-200 hover:border-primary-400 cursor-pointer overflow-hidden flex items-center justify-center bg-slate-50 transition-colors"
                onClick={() => inputFotoRef.current?.click()}
              >
                {fotoPreview ? (
                  <img src={fotoPreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <HiUser className="w-8 h-8 text-slate-300" />
                )}
              </div>
              <input
                ref={inputFotoRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleFotoChange}
              />
              <div className="text-xs text-slate-400">
                <p className="font-medium text-slate-500">Click para seleccionar</p>
                <p>JPG, PNG o WebP. Max 5 MB</p>
              </div>
            </div>
          </div>

          <InputCampo label="Nombres" name="nombres" value={form.nombres} onChange={handleChange} required />
          <InputCampo label="Apellidos" name="apellidos" value={form.apellidos} onChange={handleChange} required />
          <InputCampo label="Correo" name="correo" type="email" value={form.correo} onChange={handleChange} required />
          <InputCampo label="Contrasena" name="contrasena" type="password" value={form.contrasena} onChange={handleChange} required={!editando} placeholder={editando ? 'Dejar vacio para no cambiar' : ''} />
          <InputCampo label="Especialidad" name="especialidad" value={form.especialidad} onChange={handleChange} />
          <InputCampo label="Telefono" name="telefono" value={form.telefono} onChange={handleChange} />
          <div className="flex justify-end gap-2 pt-3">
            <Boton tipo="outline" onClick={() => setModal(false)}>Cancelar</Boton>
            <Boton type="submit">{editando ? 'Actualizar' : 'Crear'}</Boton>
          </div>
        </form>
      </Modal>

      {/* Modal perfil expandido */}
      <Modal abierto={modalPerfil} cerrar={() => setModalPerfil(false)} titulo="Perfil del Profesor" ancho="max-w-2xl">
        {perfilDocente && (
          <div className="flex flex-col sm:flex-row gap-6">
            {/* Foto grande */}
            <div className="flex flex-col items-center gap-3 shrink-0">
              <div className="w-40 h-48 rounded-2xl overflow-hidden bg-slate-100 flex items-center justify-center border border-slate-200">
                {perfilDocente.foto_url ? (
                  <img src={getUploadUrl(perfilDocente.foto_url)} alt="Foto" className="w-full h-full object-cover" />
                ) : (
                  <HiUser className="w-16 h-16 text-slate-300" />
                )}
              </div>
              {perfilDocente.foto_url && (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleDescargarFoto(perfilDocente)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary-700 bg-primary-100 hover:bg-primary-100 rounded-lg transition-colors"
                  >
                    <HiDownload className="w-3.5 h-3.5" />
                    Descargar
                  </button>
                  <button
                    onClick={() => handleEliminarFoto(perfilDocente)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors"
                  >
                    <HiTrash className="w-3.5 h-3.5" />
                    Eliminar
                  </button>
                </div>
              )}
            </div>

            {/* Datos */}
            <div className="flex-1 space-y-3">
              <div>
                <h4 className="text-2xl font-display font-bold text-slate-800">
                  {perfilDocente.tbl_usuarios?.nombres || perfilDocente.nombres} {perfilDocente.tbl_usuarios?.apellidos || perfilDocente.apellidos}
                </h4>
                <span className={`inline-block mt-1 px-2.5 py-0.5 text-xs font-medium rounded-full ${
                  perfilDocente.estado === 1 ? 'bg-secondary-50 text-secondary-600' : 'bg-rose-50 text-rose-500'
                }`}>
                  {perfilDocente.estado === 1 ? 'Activo' : 'Inactivo'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl">
                  <p className="text-xs font-display font-medium text-slate-400 uppercase tracking-wide mb-0.5">Correo</p>
                  <p className="text-sm text-slate-700">{perfilDocente.tbl_usuarios?.correo || '-'}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <p className="text-xs font-display font-medium text-slate-400 uppercase tracking-wide mb-0.5">Especialidad</p>
                  <p className="text-sm text-slate-700">{perfilDocente.especialidad || '-'}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <p className="text-xs font-display font-medium text-slate-400 uppercase tracking-wide mb-0.5">Telefono</p>
                  <p className="text-sm text-slate-700">{perfilDocente.telefono || perfilDocente.tbl_usuarios?.celular || '-'}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <p className="text-xs font-display font-medium text-slate-400 uppercase tracking-wide mb-0.5">ID</p>
                  <p className="text-sm text-slate-700">{perfilDocente.id}</p>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Boton tipo="outline" onClick={() => { setModalPerfil(false); abrirEditar(perfilDocente); }}>
                  Editar
                </Boton>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
