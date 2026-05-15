import { useState, useEffect, useMemo, useRef } from 'react';
import useCrud from '../../hooks/useCrud';
import apiClient from '../../services/apiClient';
import { getUploadUrl } from '../../utils/storage';
import Tabla from '../../components/common/Tabla';
import Boton from '../../components/common/Boton';
import Modal from '../../components/common/Modal';
import InputCampo from '../../components/common/InputCampo';
import ModalDatosAntropometricos from '../../components/alumnos/ModalDatosAntropometricos';
import { HiPencil, HiBan, HiCheckCircle, HiRefresh, HiUser, HiQrcode, HiClipboardList } from 'react-icons/hi';
import { formatearFecha, fechaHoy } from '../../utils/formatters';
import toast from 'react-hot-toast';

export default function AlumnosPage() {
  const { datos, cargando, crear, actualizar, inactivar, activar, cargar } = useCrud('/alumnos');
  const [cursos, setCursos] = useState([]);
  const [docentes, setDocentes] = useState([]);
  const [modal, setModal] = useState(false);
  const [modalCursos, setModalCursos] = useState(false);
  const [modalCredenciales, setModalCredenciales] = useState(false);
  const [modalAntropometricos, setModalAntropometricos] = useState(false);
  const [credencialesInfo, setCredencialesInfo] = useState(null);
  const [editando, setEditando] = useState(null);
  const [alumnoSel, setAlumnoSel] = useState(null);
  const [cursosSeleccionados, setCursosSeleccionados] = useState([]);
  const [form, setForm] = useState({ id_docente: '', nombres: '', apellidos: '', dni: '', fecha_nacimiento: '', genero: '', direccion: '', correo_acceso: '', contrasena_acceso: '' });
  const [archivoFoto, setArchivoFoto] = useState(null);
  const [fotoPreview, setFotoPreview] = useState(null);
  const [errores, setErrores] = useState({});
  const inputFotoRef = useRef(null);

  useEffect(() => {
    apiClient.get('/cursos').then(({ data }) => setCursos(data)).catch(() => {});
    apiClient.get('/docentes').then(({ data }) => setDocentes(data)).catch(() => {});
  }, []);

  const columnas = [
    { key: 'id', label: 'ID' },
    {
      key: 'foto', label: 'Foto',
      render: (f) => (
        <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-100 flex items-center justify-center">
          {f.foto_url
            ? <img src={getUploadUrl(f.foto_url)} alt="" className="w-full h-full object-cover" />
            : <HiUser className="w-4 h-4 text-slate-300" />}
        </div>
      ),
    },
    { key: 'nombres', label: 'Nombres' },
    { key: 'apellidos', label: 'Apellidos' },
    { key: 'dni', label: 'DNI', headerClassName: 'bg-indigo-200 text-indigo-800', cellClassName: 'bg-indigo-100 text-indigo-800 font-medium' },
    { key: 'fecha_nacimiento', label: 'Nac.', headerClassName: 'bg-sky-200 text-sky-800', cellClassName: 'bg-sky-100 text-sky-800 font-medium', render: (f) => formatearFecha(f.fecha_nacimiento) },
    { key: 'genero', label: 'Género', headerClassName: 'bg-purple-200 text-purple-800', cellClassName: 'bg-purple-100 text-purple-800 font-medium' },
    { key: 'carnet', label: 'Carnet', headerClassName: 'bg-emerald-200 text-emerald-800', cellClassName: 'bg-emerald-100 text-emerald-800 font-medium',
      render: (f) => <span className="inline-flex items-center gap-1"><HiQrcode className="w-4 h-4" /> QR</span>,
    },
    { key: 'estado', label: 'Estado', headerClassName: 'bg-amber-200 text-amber-800', cellClassName: 'bg-amber-100',
      render: (f) => f.estado === 1 ? <span className="text-emerald-700 font-semibold">Activo</span> : <span className="text-rose-600 font-semibold">Inactivo</span>,
    },
  ];

  const filtros = useMemo(() => [
    { key: 'genero', label: 'Todos los géneros', opciones: [
      { value: 'M', label: 'Masculino' },
      { value: 'F', label: 'Femenino' },
    ], filterFn: (f, v) => f.genero === v },
    { key: 'estado', label: 'Todos los estados', opciones: [
      { value: '1', label: 'Activo' },
      { value: '0', label: 'Inactivo' },
    ], filterFn: (f, v) => f.estado === parseInt(v) },
  ], []);

  const validarFormulario = () => {
    const nuevosErrores = {};
    if (!form.nombres.trim()) {
      nuevosErrores.nombres = 'El nombre es obligatorio';
    } else if (form.nombres.trim().length < 2) {
      nuevosErrores.nombres = 'El nombre debe tener al menos 2 caracteres';
    }
    if (!form.apellidos.trim()) {
      nuevosErrores.apellidos = 'El apellido es obligatorio';
    } else if (form.apellidos.trim().length < 2) {
      nuevosErrores.apellidos = 'El apellido debe tener al menos 2 caracteres';
    }
    if (!form.dni.trim()) {
      nuevosErrores.dni = 'El DNI es obligatorio';
    } else if (!/^\d{8}$/.test(form.dni.trim())) {
      nuevosErrores.dni = 'El DNI debe tener exactamente 8 dígitos';
    }
    if (!form.fecha_nacimiento) {
      nuevosErrores.fecha_nacimiento = 'La fecha de nacimiento es obligatoria';
    } else if (!/^\d{4}-\d{2}-\d{2}$/.test(form.fecha_nacimiento) || form.fecha_nacimiento >= fechaHoy()) {
      nuevosErrores.fecha_nacimiento = 'La fecha de nacimiento debe ser anterior a hoy';
    }
    if (!form.genero) {
      nuevosErrores.genero = 'El género es obligatorio';
    }
    if (!form.direccion.trim()) {
      nuevosErrores.direccion = 'La dirección es obligatoria';
    }
    if (!editando) {
      if (!form.correo_acceso.trim()) {
        nuevosErrores.correo_acceso = 'El correo de acceso es obligatorio';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.correo_acceso.trim())) {
        nuevosErrores.correo_acceso = 'Ingrese un correo valido';
      }
      if (!form.contrasena_acceso.trim()) {
        nuevosErrores.contrasena_acceso = 'La contrasena es obligatoria';
      } else if (form.contrasena_acceso.trim().length < 6) {
        nuevosErrores.contrasena_acceso = 'La contrasena debe tener al menos 6 caracteres';
      }
    }
    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const abrirCrear = () => {
    setEditando(null);
    setForm({ id_docente: '', nombres: '', apellidos: '', dni: '', fecha_nacimiento: '', genero: '', direccion: '', correo_acceso: '', contrasena_acceso: '' });
    setFotoPreview(null);
    setArchivoFoto(null);
    setErrores({});
    setModal(true);
  };

  const abrirEditar = (a) => {
    setEditando(a);
    setForm({
      nombres: a.nombres || '',
      apellidos: a.apellidos || '',
      dni: a.dni || '',
      fecha_nacimiento: a.fecha_nacimiento?.split('T')[0] || '',
      genero: a.genero || '',
      direccion: a.direccion || '',
      correo_acceso: a.tbl_usuarios?.correo || '',
      contrasena_acceso: '',
    });
    setFotoPreview(a.foto_url ? getUploadUrl(a.foto_url) : null);
    setArchivoFoto(null);
    setErrores({});
    setModal(true);
  };

  const abrirAsignarCursos = (a) => {
    setAlumnoSel(a);
    const cursosActuales = a.tbl_alumnos_cursos?.filter(ac => ac.estado === 1).map(ac => ac.id_curso.toString()) || [];
    setCursosSeleccionados(cursosActuales);
    setModalCursos(true);
  };

  const abrirAntropometricos = (a) => {
    setAlumnoSel(a);
    setModalAntropometricos(true);
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
    if (!validarFormulario()) {
      toast.error('Por favor, corrige los campos marcados en rojo');
      return;
    }
    try {
      let id;
      let credenciales = null;
      if (editando) {
        await actualizar(editando.id, form);
        id = editando.id;
      } else {
        const datosEnvio = { ...form, id_docente: form.id_docente ? parseInt(form.id_docente) : null };
        const nuevoAlumno = await crear(datosEnvio);
        id = nuevoAlumno.id;
        if (nuevoAlumno.correo_generado) {
          credenciales = { correo: nuevoAlumno.correo_generado, contrasena: form.contrasena_acceso, nombre: `${form.nombres} ${form.apellidos}` };
        }
      }
      if (archivoFoto && id) {
        const fd = new FormData();
        fd.append('foto', archivoFoto);
        await apiClient.post(`/alumnos/${id}/foto`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        cargar();
      }
      setModal(false);
      if (credenciales) {
        setCredencialesInfo(credenciales);
        setModalCredenciales(true);
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error');
    }
  };

  const handleAsignarCursos = async () => {
    try {
      await apiClient.post(`/alumnos/${alumnoSel.id}/cursos`, { cursos: cursosSeleccionados.map(Number) });
      toast.success('Cursos asignados');
      setModalCursos(false);
      cargar();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error');
    }
  };

  const handleRegenerarCarnet = async (a) => {
    if (!confirm('¿Regenerar carnet y QR?')) return;
    try {
      await apiClient.post(`/alumnos/${a.id}/regenerar-carnet`);
      toast.success('Carnet regenerado');
      cargar();
    } catch (err) {
      toast.error('Error al regenerar');
    }
  };

  const handleToggleEstado = async (a) => {
    if (a.estado === 1) {
      if (!confirm('¿Desactivar este alumno?')) return;
      try { await inactivar(a.id); } catch { toast.error('Error al desactivar'); }
    } else {
      if (!confirm('¿Activar este alumno?')) return;
      try { await activar(a.id); } catch { toast.error('Error al activar'); }
    }
  };

  const toggleCurso = (idCurso) => {
    const id = idCurso.toString();
    setCursosSeleccionados(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    if (errores[name]) setErrores({ ...errores, [name]: undefined });
  };

  if (cargando) return <div className="text-center py-8 text-slate-400">Cargando...</div>;

  return (
    <div className="animate-fade-up" style={{ fontSize: '115%' }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-xs font-display font-medium text-primary-600 uppercase tracking-widest mb-1">Gestión</p>
          <h1 className="text-3xl font-display font-bold text-slate-800">Alumnos</h1>
        </div>
        <Boton onClick={abrirCrear}>Nuevo Alumno</Boton>
      </div>

      <Tabla columnas={columnas} datos={datos} filtros={filtros} accionesClassName="bg-primary-200 text-primary-800" acciones={(fila) => (
        <>
          <button onClick={() => abrirEditar(fila)} className="p-1 text-primary-400 hover:bg-slate-50 rounded" title="Editar"><HiPencil className="w-4 h-4" /></button>
          <button onClick={() => abrirAsignarCursos(fila)} className="p-1 text-secondary-400 hover:bg-slate-50 rounded" title="Asignar Cursos">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
          </button>
          <button onClick={() => handleRegenerarCarnet(fila)} className="p-1 text-primary-600 hover:bg-slate-50 rounded" title="Regenerar Carnet"><HiRefresh className="w-4 h-4" /></button>
          <button onClick={() => abrirAntropometricos(fila)} className="p-1 text-accent-500 hover:bg-slate-50 rounded" title="Datos Antropométricos"><HiClipboardList className="w-4 h-4" /></button>
          {fila.estado === 1 ? (
            <button onClick={() => handleToggleEstado(fila)} className="p-1 text-rose-400 hover:bg-slate-50 rounded" title="Desactivar"><HiBan className="w-4 h-4" /></button>
          ) : (
            <button onClick={() => handleToggleEstado(fila)} className="p-1 text-secondary-500 hover:bg-slate-50 rounded" title="Activar"><HiCheckCircle className="w-4 h-4" /></button>
          )}
        </>
      )} />

      {/* Modal crear / editar */}
      <Modal abierto={modal} cerrar={() => setModal(false)} titulo={editando ? 'Editar Alumno' : 'Nuevo Alumno'}>
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Foto */}
          <div className="mb-4">
            <label className="block text-xs font-display font-medium text-slate-500 mb-1.5 tracking-wide uppercase">
              Foto del Alumno
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

          {!editando && (
            <InputCampo label="Docente (opcional)" name="id_docente" type="select" value={form.id_docente} onChange={handleChange} placeholder="Sin docente asignado" options={
              docentes.filter(d => d.estado === 1).map(d => ({ value: d.id.toString(), label: `${d.apellidos}, ${d.nombres}` }))
            } />
          )}
          <InputCampo label="Nombres" name="nombres" value={form.nombres} onChange={handleChange} required error={errores.nombres} />
          <InputCampo label="Apellidos" name="apellidos" value={form.apellidos} onChange={handleChange} required error={errores.apellidos} />
          <InputCampo label="DNI" name="dni" value={form.dni} onChange={handleChange} required error={errores.dni} />
          <InputCampo label="Fecha Nacimiento" name="fecha_nacimiento" type="date" value={form.fecha_nacimiento} onChange={handleChange} required error={errores.fecha_nacimiento} />
          <InputCampo label="Género" name="genero" type="select" value={form.genero} onChange={handleChange} required error={errores.genero} options={[
            { value: 'M', label: 'Masculino' },
            { value: 'F', label: 'Femenino' },
          ]} />
          <InputCampo label="Dirección" name="direccion" value={form.direccion} onChange={handleChange} required error={errores.direccion} />

          {/* Credenciales de acceso */}
          <div className="pt-3 mt-3 border-t border-slate-100">
            <p className="text-xs font-display font-semibold text-secondary-600 uppercase tracking-wider mb-3">Credenciales de Acceso</p>
            <div className="space-y-3">
              <InputCampo
                label="Correo de acceso"
                name="correo_acceso"
                type="email"
                value={form.correo_acceso}
                onChange={handleChange}
                required={!editando}
                error={errores.correo_acceso}
                placeholder="alumno@colegio.edu"
                disabled={!!editando && !!editando.tbl_usuarios?.correo}
              />
              <InputCampo
                label={editando ? 'Nueva contrasena (dejar vacio para no cambiar)' : 'Contrasena'}
                name="contrasena_acceso"
                type="password"
                value={form.contrasena_acceso}
                onChange={handleChange}
                required={!editando}
                error={errores.contrasena_acceso}
                placeholder={editando ? '••••••••' : 'Minimo 6 caracteres'}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-3">
            <Boton tipo="outline" onClick={() => setModal(false)}>Cancelar</Boton>
            <Boton type="submit">{editando ? 'Actualizar' : 'Crear'}</Boton>
          </div>
        </form>
      </Modal>

      {/* Modal asignar cursos */}
      <Modal abierto={modalCursos} cerrar={() => setModalCursos(false)} titulo={`Asignar Cursos - ${alumnoSel?.nombres} ${alumnoSel?.apellidos}`}>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {cursos.filter(c => c.estado === 1).map(c => (
            <label key={c.id} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg cursor-pointer">
              <input
                type="checkbox"
                checked={cursosSeleccionados.includes(c.id.toString())}
                onChange={() => toggleCurso(c.id)}
                className="w-4 h-4 text-primary rounded"
              />
              <span className="text-sm text-slate-600">{c.nombre} - {c.grado} {c.seccion}</span>
            </label>
          ))}
        </div>
        <div className="flex justify-end gap-2 pt-4">
          <Boton tipo="outline" onClick={() => setModalCursos(false)}>Cancelar</Boton>
          <Boton onClick={handleAsignarCursos}>Guardar</Boton>
        </div>
      </Modal>

      <ModalDatosAntropometricos
        abierto={modalAntropometricos}
        cerrar={() => setModalAntropometricos(false)}
        alumno={alumnoSel}
      />

      {/* Modal credenciales generadas */}
      <Modal abierto={modalCredenciales} cerrar={() => { setModalCredenciales(false); setCredencialesInfo(null); }} titulo="Credenciales del Alumno">
        {credencialesInfo && (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Se ha creado la cuenta de acceso para <strong>{credencialesInfo.nombre}</strong>.
              Comparte estas credenciales con el alumno:
            </p>
            <div className="p-4 rounded-xl bg-secondary-50 border border-secondary-200 space-y-3">
              <div>
                <p className="text-[10px] text-secondary-500 font-display font-semibold uppercase tracking-wider">Correo de acceso</p>
                <p className="text-sm font-mono font-bold text-secondary-800 select-all">{credencialesInfo.correo}</p>
              </div>
              <div>
                <p className="text-[10px] text-secondary-500 font-display font-semibold uppercase tracking-wider">Contrasena temporal</p>
                <p className="text-sm font-mono font-bold text-secondary-800 select-all">{credencialesInfo.contrasena}</p>
              </div>
            </div>
            <p className="text-xs text-amber-600 bg-amber-100 p-3 rounded-lg border border-amber-200">
              El alumno puede cambiar su contrasena desde su perfil una vez que inicie sesion.
            </p>
            <div className="flex justify-end pt-2">
              <Boton onClick={() => { setModalCredenciales(false); setCredencialesInfo(null); }}>Entendido</Boton>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
