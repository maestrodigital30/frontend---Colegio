import { useState, useEffect, useMemo } from 'react';
import useCrud from '../../hooks/useCrud';
import apiClient from '../../services/apiClient';
import Tabla from '../../components/common/Tabla';
import Boton from '../../components/common/Boton';
import Modal from '../../components/common/Modal';
import InputCampo from '../../components/common/InputCampo';
import { HiPencil, HiBan, HiCheckCircle, HiLink } from 'react-icons/hi';
import toast from 'react-hot-toast';

export default function PadresPage() {
  const { datos, cargando, crear, actualizar, inactivar, activar, cargar } = useCrud('/padres');
  const [alumnos, setAlumnos] = useState([]);
  const [modal, setModal] = useState(false);
  const [modalVinc, setModalVinc] = useState(false);
  const [editando, setEditando] = useState(null);
  const [padreSel, setPadreSel] = useState(null);
  const [alumnoVinc, setAlumnoVinc] = useState('');
  const [parentesco, setParentesco] = useState('padre');
  const [form, setForm] = useState({ nombres: '', apellidos: '', telefono: '', correo: '', es_principal: false });
  const [errores, setErrores] = useState({});
  const [errorGeneral, setErrorGeneral] = useState('');

  const validarFormulario = () => {
    const errs = {};
    if (!form.nombres.trim()) errs.nombres = 'El nombre es obligatorio';
    if (!form.apellidos.trim()) errs.apellidos = 'El apellido es obligatorio';
    if (!form.telefono.trim()) errs.telefono = 'El teléfono es obligatorio';
    else if (!/^\d{7,15}$/.test(form.telefono.replace(/\s/g, '')))
      errs.telefono = 'Solo números, entre 7 y 15 dígitos. Ej: 51999999999';
    if (!form.correo.trim()) errs.correo = 'El correo es obligatorio';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.correo))
      errs.correo = 'Formato inválido. Ejemplo: usuario@correo.com';
    setErrores(errs);
    if (Object.keys(errs).length > 0) {
      const lista = Object.values(errs).join(' | ');
      setErrorGeneral(lista);
      return false;
    }
    return true;
  };

  useEffect(() => {
    apiClient.get('/alumnos').then(({ data }) => setAlumnos(data)).catch(() => {});
  }, []);

  const columnas = [
    { key: 'id', label: 'ID' },
    { key: 'nombres', label: 'Nombres' },
    { key: 'apellidos', label: 'Apellidos' },
    { key: 'telefono', label: 'Teléfono', headerClassName: 'bg-sky-200 text-sky-800', cellClassName: 'bg-sky-100 text-sky-800 font-medium' },
    { key: 'correo', label: 'Correo', headerClassName: 'bg-teal-200 text-teal-800', cellClassName: 'bg-teal-100 text-teal-800 font-medium' },
    { key: 'hijos', label: 'Alumnos vinculados', headerClassName: 'bg-primary-200 text-primary-800', cellClassName: 'bg-primary-100 text-primary-800 font-medium', render: (f) => f.tbl_padres_alumnos?.filter(pa => pa.estado === 1).map(pa => `${pa.tbl_alumnos?.nombres} ${pa.tbl_alumnos?.apellidos}`).join(', ') || '-' },
    { key: 'estado', label: 'Estado', headerClassName: 'bg-amber-200 text-amber-800', cellClassName: 'bg-amber-100', render: (f) => f.estado === 1 ? <span className="text-emerald-700 font-semibold">Activo</span> : <span className="text-rose-600 font-semibold">Inactivo</span> },
  ];

  const filtros = useMemo(() => [
    { key: 'estado', label: 'Todos los estados', opciones: [
      { value: '1', label: 'Activo' },
      { value: '0', label: 'Inactivo' },
    ], filterFn: (f, v) => f.estado === parseInt(v) },
  ], []);

  const abrirCrear = () => {
    setEditando(null);
    setForm({ nombres: '', apellidos: '', telefono: '', correo: '', es_principal: false });
    setErrores({});
    setErrorGeneral('');
    setModal(true);
  };

  const abrirEditar = (p) => {
    setEditando(p);
    setForm({ nombres: p.nombres, apellidos: p.apellidos, telefono: p.telefono || '', correo: p.correo || '', es_principal: p.es_contacto_principal || false });
    setErrores({});
    setErrorGeneral('');
    setModal(true);
  };

  const abrirVincular = (p) => {
    setPadreSel(p);
    setAlumnoVinc('');
    setParentesco('padre');
    setModalVinc(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorGeneral('');
    if (!validarFormulario()) return;
    try {
      if (editando) await actualizar(editando.id, form);
      else await crear(form);
      setModal(false);
    } catch (err) {
      const data = err.response?.data;
      if (data?.campos) setErrores(data.campos);
      const msg = data?.error || 'Error al procesar la solicitud';
      setErrorGeneral(msg);
    }
  };

  const handleVincular = async () => {
    if (!alumnoVinc) return toast.error('Seleccione un alumno');
    try {
      await apiClient.post(`/padres/${padreSel.id}/vincular-alumno`, {
        id_alumno: parseInt(alumnoVinc),
        parentesco,
      });
      toast.success('Alumno vinculado');
      setModalVinc(false);
      cargar();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error');
    }
  };

  const handleToggleEstado = async (p) => {
    if (p.estado === 1) {
      if (!confirm('¿Desactivar este padre/apoderado?')) return;
      try { await inactivar(p.id); } catch { toast.error('Error al desactivar'); }
    } else {
      if (!confirm('¿Activar este padre/apoderado?')) return;
      try { await activar(p.id); } catch { toast.error('Error al activar'); }
    }
  };

  const handleChange = (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm({ ...form, [e.target.name]: val });
    if (errores[e.target.name]) setErrores({ ...errores, [e.target.name]: undefined });
    if (errorGeneral) setErrorGeneral('');
  };

  if (cargando) return <div className="text-center py-8 text-slate-400">Cargando...</div>;

  return (
    <div className="animate-fade-up" style={{ fontSize: '115%' }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-xs font-display font-medium text-primary-600 uppercase tracking-widest mb-1">Gestión</p>
          <h1 className="text-3xl font-display font-bold text-slate-800">Padres / Apoderados</h1>
        </div>
        <Boton onClick={abrirCrear}>Nuevo Padre</Boton>
      </div>

      <Tabla columnas={columnas} datos={datos} filtros={filtros} accionesClassName="bg-primary-200 text-primary-800" acciones={(fila) => (
        <>
          <button onClick={() => abrirEditar(fila)} className="p-1 text-primary-400 hover:bg-slate-50 rounded" title="Editar"><HiPencil className="w-4 h-4" /></button>
          <button onClick={() => abrirVincular(fila)} className="p-1 text-secondary-400 hover:bg-slate-50 rounded" title="Vincular alumno"><HiLink className="w-4 h-4" /></button>
          {fila.estado === 1 ? (
            <button onClick={() => handleToggleEstado(fila)} className="p-1 text-rose-400 hover:bg-slate-50 rounded" title="Desactivar"><HiBan className="w-4 h-4" /></button>
          ) : (
            <button onClick={() => handleToggleEstado(fila)} className="p-1 text-secondary-500 hover:bg-slate-50 rounded" title="Activar"><HiCheckCircle className="w-4 h-4" /></button>
          )}
        </>
      )} />

      <Modal abierto={modal} cerrar={() => setModal(false)} titulo={editando ? 'Editar Padre' : 'Nuevo Padre'}>
        <form onSubmit={handleSubmit} className="space-y-3">
          {errorGeneral && (
            <div className="bg-rose-50 border border-rose-300 text-rose-700 px-4 py-3 rounded-xl text-sm font-medium">
              {errorGeneral}
            </div>
          )}
          <InputCampo label="Nombres" name="nombres" value={form.nombres} onChange={handleChange} required error={errores.nombres} />
          <InputCampo label="Apellidos" name="apellidos" value={form.apellidos} onChange={handleChange} required error={errores.apellidos} />
          <InputCampo label="Teléfono" name="telefono" value={form.telefono} onChange={handleChange} placeholder="Ej: 51999999999" required error={errores.telefono} />
          <InputCampo label="Correo" name="correo" type="email" value={form.correo} onChange={handleChange} required error={errores.correo} />
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" name="es_principal" checked={form.es_principal} onChange={handleChange} className="w-4 h-4 text-primary rounded" />
            Es contacto principal (WhatsApp)
          </label>
          <div className="flex justify-end gap-2 pt-3">
            <Boton tipo="outline" onClick={() => setModal(false)}>Cancelar</Boton>
            <Boton type="submit">{editando ? 'Actualizar' : 'Crear'}</Boton>
          </div>
        </form>
      </Modal>

      <Modal abierto={modalVinc} cerrar={() => setModalVinc(false)} titulo="Vincular Alumno">
        <div className="space-y-3">
          <InputCampo label="Alumno" name="alumno" type="select" value={alumnoVinc} onChange={(e) => setAlumnoVinc(e.target.value)} options={alumnos.filter(a => a.estado === 1).map(a => ({
            value: a.id.toString(),
            label: `${a.apellidos}, ${a.nombres}`,
          }))} />
          <InputCampo label="Parentesco" name="parentesco" type="select" value={parentesco} onChange={(e) => setParentesco(e.target.value)} options={[
            { value: 'padre', label: 'Padre' },
            { value: 'madre', label: 'Madre' },
            { value: 'apoderado', label: 'Apoderado' },
            { value: 'tutor', label: 'Tutor' },
          ]} />
          <div className="flex justify-end gap-2 pt-3">
            <Boton tipo="outline" onClick={() => setModalVinc(false)}>Cancelar</Boton>
            <Boton onClick={handleVincular}>Vincular</Boton>
          </div>
        </div>
      </Modal>
    </div>
  );
}
