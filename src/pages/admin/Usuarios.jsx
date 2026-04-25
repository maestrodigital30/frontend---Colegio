import { useState, useMemo } from 'react';
import useCrud from '../../hooks/useCrud';
import Tabla from '../../components/common/Tabla';
import Boton from '../../components/common/Boton';
import Modal from '../../components/common/Modal';
import InputCampo from '../../components/common/InputCampo';
import { ROLES } from '../../utils/constants';
import { HiPencil, HiBan, HiCheckCircle } from 'react-icons/hi';
import toast from 'react-hot-toast';

export default function UsuariosPage() {
  const { datos, cargando, crear, actualizar, inactivar, activar } = useCrud('/usuarios');
  const [modal, setModal] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState({ nombres: '', apellidos: '', correo: '', contrasena: '', rol: '', especialidad: '', telefono: '' });

  const rolesUnicos = useMemo(() => {
    const mapa = new Map();
    datos.forEach(u => {
      if (u.id_rol && u.tbl_roles?.nombre) {
        mapa.set(u.id_rol, u.tbl_roles.nombre);
      }
    });
    return Array.from(mapa.entries()).map(([id, nombre]) => ({ id, nombre }));
  }, [datos]);

  const esRolDocente = useMemo(() => {
    if (!form.rol) return false;
    const rol = rolesUnicos.find(r => r.id === parseInt(form.rol));
    return rol?.nombre === ROLES.DOCENTE;
  }, [form.rol, rolesUnicos]);

  const columnas = [
    { key: 'id', label: 'ID' },
    { key: 'nombres', label: 'Nombres' },
    { key: 'apellidos', label: 'Apellidos', headerClassName: 'bg-indigo-200 text-indigo-800', cellClassName: 'bg-indigo-100 text-indigo-800 font-medium' },
    { key: 'correo', label: 'Correo', headerClassName: 'bg-sky-200 text-sky-800', cellClassName: 'bg-sky-100 text-sky-800 font-medium' },
    { key: 'rol', label: 'Rol', render: (f) => f.tbl_roles?.nombre || f.rol, headerClassName: 'bg-primary-200 text-primary-800', cellClassName: 'bg-primary-100 text-primary-800 font-medium' },
    { key: 'estado', label: 'Estado', render: (f) => f.estado === 1 ? <span className="text-emerald-700 font-semibold">Activo</span> : <span className="text-rose-600 font-semibold">Inactivo</span>, headerClassName: 'bg-amber-200 text-amber-800', cellClassName: 'bg-amber-100' },
  ];

  const filtros = useMemo(() => [
    ...(rolesUnicos.length > 0 ? [{
      key: 'rol', label: 'Todos los roles', opciones: rolesUnicos.map(r => ({
        value: r.nombre, label: r.nombre,
      })), filterFn: (f, v) => (f.tbl_roles?.nombre || f.rol) === v,
    }] : []),
    { key: 'estado', label: 'Todos los estados', opciones: [
      { value: '1', label: 'Activo' },
      { value: '0', label: 'Inactivo' },
    ], filterFn: (f, v) => f.estado === parseInt(v) },
  ], [rolesUnicos]);

  const abrirCrear = () => {
    setEditando(null);
    setForm({ nombres: '', apellidos: '', correo: '', contrasena: '', rol: '', especialidad: '', telefono: '' });
    setModal(true);
  };

  const abrirEditar = (u) => {
    setEditando(u);
    setForm({
      nombres: u.nombres,
      apellidos: u.apellidos,
      correo: u.correo,
      contrasena: '',
      rol: u.id_rol?.toString() || '',
      especialidad: u.tbl_perfil_docente?.especialidad || '',
      telefono: u.tbl_perfil_docente?.telefono || '',
    });
    setModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const body = { ...form, id_rol: parseInt(form.rol) };
      if (!body.contrasena && editando) delete body.contrasena;
      if (editando) {
        await actualizar(editando.id, body);
      } else {
        await crear(body);
      }
      setModal(false);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error');
    }
  };

  const handleToggleEstado = async (u) => {
    if (u.estado === 1) {
      if (!confirm('¿Desactivar este usuario? No podrá iniciar sesión.')) return;
      try { await inactivar(u.id); } catch { toast.error('Error al desactivar'); }
    } else {
      if (!confirm('¿Activar este usuario? Podrá iniciar sesión nuevamente.')) return;
      try { await activar(u.id); } catch { toast.error('Error al activar'); }
    }
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  if (cargando) return <div className="text-center py-8 text-slate-400">Cargando...</div>;

  return (
    <div className="animate-fade-up" style={{ fontSize: '115%' }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-xs font-display font-medium text-primary-600 uppercase tracking-widest mb-1">Administración</p>
          <h1 className="text-3xl font-display font-bold text-slate-800">Usuarios</h1>
        </div>
        <Boton onClick={abrirCrear}>Nuevo Usuario</Boton>
      </div>

      <Tabla columnas={columnas} datos={datos} filtros={filtros} accionesClassName="bg-primary-200 text-primary-800" acciones={(fila) => (
        <>
          <button onClick={() => abrirEditar(fila)} className="p-1 text-primary-400 hover:bg-slate-50 rounded" title="Editar"><HiPencil className="w-4 h-4" /></button>
          {fila.estado === 1 ? (
            <button onClick={() => handleToggleEstado(fila)} className="p-1 text-rose-400 hover:bg-slate-50 rounded" title="Desactivar"><HiBan className="w-4 h-4" /></button>
          ) : (
            <button onClick={() => handleToggleEstado(fila)} className="p-1 text-secondary-500 hover:bg-slate-50 rounded" title="Activar"><HiCheckCircle className="w-4 h-4" /></button>
          )}
        </>
      )} />

      <Modal abierto={modal} cerrar={() => setModal(false)} titulo={editando ? 'Editar Usuario' : 'Nuevo Usuario'}>
        <form onSubmit={handleSubmit} className="space-y-3">
          <InputCampo label="Nombres" name="nombres" value={form.nombres} onChange={handleChange} required />
          <InputCampo label="Apellidos" name="apellidos" value={form.apellidos} onChange={handleChange} required />
          <InputCampo label="Correo" name="correo" type="email" value={form.correo} onChange={handleChange} required />
          <InputCampo label="Contraseña" name="contrasena" type="password" value={form.contrasena} onChange={handleChange} required={!editando} placeholder={editando ? 'Dejar vacío para no cambiar' : ''} />
          <InputCampo label="Rol" name="rol" type="select" value={form.rol} onChange={handleChange} required options={rolesUnicos.map(r => ({
            value: r.id.toString(), label: r.nombre,
          }))} />
          {esRolDocente && (
            <>
              <InputCampo label="Especialidad" name="especialidad" value={form.especialidad} onChange={handleChange} placeholder="Ej: Matemáticas, Lenguaje..." />
              <InputCampo label="Teléfono" name="telefono" value={form.telefono} onChange={handleChange} />
            </>
          )}
          <div className="flex justify-end gap-2 pt-3">
            <Boton tipo="outline" onClick={() => setModal(false)}>Cancelar</Boton>
            <Boton type="submit">{editando ? 'Actualizar' : 'Crear'}</Boton>
          </div>
        </form>
      </Modal>
    </div>
  );
}
