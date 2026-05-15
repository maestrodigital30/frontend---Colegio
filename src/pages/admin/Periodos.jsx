import { useState, useMemo } from 'react';
import useCrud from '../../hooks/useCrud';
import Tabla from '../../components/common/Tabla';
import Boton from '../../components/common/Boton';
import Modal from '../../components/common/Modal';
import InputCampo from '../../components/common/InputCampo';
import { HiPencil, HiBan, HiCheckCircle } from 'react-icons/hi';
import { formatearFecha, anioActual } from '../../utils/formatters';
import toast from 'react-hot-toast';

export default function PeriodosPage() {
  const { datos, cargando, crear, actualizar, inactivar, activar } = useCrud('/periodos');
  const [modal, setModal] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState({ nombre: '', anio: anioActual(), fecha_inicio: '', fecha_fin: '' });

  const columnas = [
    { key: 'id', label: 'ID' },
    {
      key: 'nombre',
      label: 'Periodo',
      headerClassName: 'bg-primary-200 text-primary-800',
      cellClassName: 'bg-primary-100 text-primary-800 font-medium',
    },
    { key: 'anio', label: 'Año', headerClassName: 'bg-indigo-200 text-indigo-800', cellClassName: 'bg-indigo-100 text-indigo-800 font-medium' },
    { key: 'fecha_inicio', label: 'Inicio', headerClassName: 'bg-sky-200 text-sky-800', cellClassName: 'bg-sky-100 text-sky-800 font-medium', render: (f) => formatearFecha(f.fecha_inicio) },
    { key: 'fecha_fin', label: 'Fin', render: (f) => formatearFecha(f.fecha_fin) },
    {
      key: 'estado',
      label: 'Estado',
      headerClassName: 'bg-amber-200 text-amber-800',
      cellClassName: 'bg-amber-100',
      render: (f) => f.estado === 1
        ? <span className="text-emerald-700 font-semibold">Activo</span>
        : <span className="text-rose-600 font-semibold">Inactivo</span>,
    },
  ];

  const anios = useMemo(() => {
    const unicos = [...new Set(datos.map(d => d.anio).filter(Boolean))];
    return unicos.sort((a, b) => b - a).map(a => ({ value: a.toString(), label: a.toString() }));
  }, [datos]);

  const filtros = useMemo(() => [
    ...(anios.length > 0 ? [{
      key: 'anio', label: 'Todos los años', opciones: anios,
      filterFn: (f, v) => f.anio === parseInt(v),
    }] : []),
    { key: 'estado', label: 'Todos los estados', opciones: [
      { value: '1', label: 'Activo' },
      { value: '0', label: 'Inactivo' },
    ], filterFn: (f, v) => f.estado === parseInt(v) },
  ], [anios]);

  const abrirCrear = () => {
    setEditando(null);
    setForm({ nombre: '', anio: anioActual(), fecha_inicio: '', fecha_fin: '' });
    setModal(true);
  };

  const abrirEditar = (p) => {
    setEditando(p);
    setForm({
      nombre: p.nombre,
      anio: p.anio,
      fecha_inicio: p.fecha_inicio?.split('T')[0] || '',
      fecha_fin: p.fecha_fin?.split('T')[0] || '',
    });
    setModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const body = { ...form, anio: parseInt(form.anio) };
      if (editando) await actualizar(editando.id, body);
      else await crear(body);
      setModal(false);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error');
    }
  };

  const handleToggleEstado = async (p) => {
    if (p.estado === 1) {
      if (!confirm('¿Desactivar este periodo?')) return;
      try { await inactivar(p.id); } catch { toast.error('Error al desactivar'); }
    } else {
      if (!confirm('¿Activar este periodo?')) return;
      try { await activar(p.id); } catch { toast.error('Error al activar'); }
    }
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  if (cargando) return <div className="text-center py-8 text-slate-400">Cargando...</div>;

  return (
    <div className="animate-fade-up" style={{ fontSize: '115%' }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-xs font-display font-medium text-primary-600 uppercase tracking-widest mb-1">Gestión</p>
          <h1 className="text-3xl font-display font-bold text-slate-800">Periodos Escolares</h1>
        </div>
        <Boton onClick={abrirCrear}>Nuevo Periodo</Boton>
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

      <Modal abierto={modal} cerrar={() => setModal(false)} titulo={editando ? 'Editar Periodo' : 'Nuevo Periodo'}>
        <form onSubmit={handleSubmit} className="space-y-3">
          <InputCampo label="Nombre" name="nombre" value={form.nombre} onChange={handleChange} required placeholder="Ej: 2025-I" />
          <InputCampo label="Año" name="anio" type="number" value={form.anio} onChange={handleChange} required />
          <InputCampo label="Fecha Inicio" name="fecha_inicio" type="date" value={form.fecha_inicio} onChange={handleChange} required />
          <InputCampo label="Fecha Fin" name="fecha_fin" type="date" value={form.fecha_fin} onChange={handleChange} required />
          <div className="flex justify-end gap-2 pt-3">
            <Boton tipo="outline" onClick={() => setModal(false)}>Cancelar</Boton>
            <Boton type="submit">{editando ? 'Actualizar' : 'Crear'}</Boton>
          </div>
        </form>
      </Modal>
    </div>
  );
}
