import { useState, useEffect, useMemo } from 'react';
import useCrud from '../../hooks/useCrud';
import apiClient from '../../services/apiClient';
import Tabla from '../../components/common/Tabla';
import Boton from '../../components/common/Boton';
import Modal from '../../components/common/Modal';
import InputCampo from '../../components/common/InputCampo';
import { HiPencil, HiBan, HiCheckCircle } from 'react-icons/hi';
import toast from 'react-hot-toast';

const FORM_INICIAL = { nombre: '', descripcion: '', id_periodo_escolar: '', grado: '', seccion: '' };

export default function CursosDocentePage() {
  const { datos, cargando, crear, actualizar, inactivar, activar } = useCrud('/cursos');
  const [periodos, setPeriodos] = useState([]);
  const [modal, setModal] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState(FORM_INICIAL);

  useEffect(() => {
    apiClient.get('/periodos').then(({ data }) => setPeriodos(data)).catch(() => {});
  }, []);

  const columnas = [
    { key: 'id', label: 'ID' },
    { key: 'nombre', label: 'Nombre' },
    { key: 'grado', label: 'Grado', headerClassName: 'bg-primary-200 text-primary-800', cellClassName: 'bg-primary-100 text-primary-800 font-medium' },
    { key: 'seccion', label: 'Sección', headerClassName: 'bg-sky-200 text-sky-800', cellClassName: 'bg-sky-100 text-sky-800 font-medium' },
    { key: 'periodo', label: 'Periodo', headerClassName: 'bg-violet-200 text-violet-800', cellClassName: 'bg-violet-100 text-violet-800 font-medium', render: (f) => f.tbl_periodos_escolares?.nombre || '-' },
    { key: 'alumnos', label: 'Alumnos', headerClassName: 'bg-teal-200 text-teal-800', cellClassName: 'bg-teal-100 text-teal-800 font-medium', render: (f) => f._count?.tbl_alumnos_cursos ?? 0 },
    { key: 'estado', label: 'Estado', headerClassName: 'bg-amber-200 text-amber-800', cellClassName: 'bg-amber-100', render: (f) => f.estado === 1
      ? <span className="text-emerald-700 font-semibold">Activo</span>
      : <span className="text-rose-600 font-semibold">Inactivo</span>
    },
  ];

  const grados = useMemo(() => {
    const unicos = [...new Set(datos.map(d => d.grado).filter(Boolean))];
    return unicos.sort().map(g => ({ value: g, label: g }));
  }, [datos]);

  const secciones = useMemo(() => {
    const unicas = [...new Set(datos.map(d => d.seccion).filter(Boolean))];
    return unicas.sort().map(s => ({ value: s, label: s }));
  }, [datos]);

  const periodosOpciones = useMemo(() => {
    const unicos = [...new Map(
      datos.map(d => [d.tbl_periodos_escolares?.nombre, d.tbl_periodos_escolares]).filter(([k]) => k)
    ).values()];
    return unicos.map(p => ({ value: p.nombre, label: p.nombre }));
  }, [datos]);

  const filtros = useMemo(() => [
    ...(grados.length > 0 ? [{
      key: 'grado', label: 'Todos los grados', opciones: grados,
      filterFn: (f, v) => f.grado === v,
    }] : []),
    ...(secciones.length > 0 ? [{
      key: 'seccion', label: 'Todas las secciones', opciones: secciones,
      filterFn: (f, v) => f.seccion === v,
    }] : []),
    ...(periodosOpciones.length > 0 ? [{
      key: 'periodo', label: 'Todos los periodos', opciones: periodosOpciones,
      filterFn: (f, v) => f.tbl_periodos_escolares?.nombre === v,
    }] : []),
    { key: 'estado', label: 'Todos los estados', opciones: [
      { value: '1', label: 'Activo' },
      { value: '0', label: 'Inactivo' },
    ], filterFn: (f, v) => f.estado === parseInt(v) },
  ], [grados, secciones, periodosOpciones]);

  const abrirCrear = () => {
    setEditando(null);
    setForm(FORM_INICIAL);
    setModal(true);
  };

  const abrirEditar = (c) => {
    setEditando(c);
    setForm({
      nombre: c.nombre || '',
      descripcion: c.descripcion || '',
      id_periodo_escolar: c.id_periodo_escolar?.toString() || '',
      grado: c.grado || '',
      seccion: c.seccion || '',
    });
    setModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const body = {
        ...form,
        id_periodo_escolar: parseInt(form.id_periodo_escolar),
      };
      if (editando) await actualizar(editando.id, body);
      else await crear(body);
      setModal(false);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al guardar curso');
    }
  };

  const handleToggleEstado = async (c) => {
    if (c.estado === 1) {
      if (!confirm('¿Desactivar este curso?')) return;
      try { await inactivar(c.id); } catch { toast.error('Error al desactivar'); }
    } else {
      if (!confirm('¿Activar este curso?')) return;
      try { await activar(c.id); } catch { toast.error('Error al activar'); }
    }
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  if (cargando) return <div className="text-center py-8 text-slate-500">Cargando...</div>;

  return (
    <div className="animate-fade-up" style={{ fontSize: '115%' }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-xs font-display font-medium text-secondary-600 uppercase tracking-widest mb-1">Académico</p>
          <h1 className="text-3xl font-display font-bold text-slate-800">Mis Cursos</h1>
        </div>
        <Boton onClick={abrirCrear}>Nuevo Curso</Boton>
      </div>

      <Tabla columnas={columnas} datos={datos} filtros={filtros} accionesClassName="bg-primary-200 text-primary-800" acciones={(fila) => (
        <>
          <button onClick={() => abrirEditar(fila)} className="p-1 text-primary-400 hover:bg-slate-50 rounded" title="Editar">
            <HiPencil className="w-4 h-4" />
          </button>
          {fila.estado === 1 ? (
            <button onClick={() => handleToggleEstado(fila)} className="p-1 text-rose-400 hover:bg-slate-50 rounded" title="Desactivar">
              <HiBan className="w-4 h-4" />
            </button>
          ) : (
            <button onClick={() => handleToggleEstado(fila)} className="p-1 text-secondary-500 hover:bg-slate-50 rounded" title="Activar">
              <HiCheckCircle className="w-4 h-4" />
            </button>
          )}
        </>
      )} />

      <Modal abierto={modal} cerrar={() => setModal(false)} titulo={editando ? 'Editar Curso' : 'Nuevo Curso'}>
        <form onSubmit={handleSubmit} className="space-y-3">
          <InputCampo label="Nombre" name="nombre" value={form.nombre} onChange={handleChange} required />
          <InputCampo label="Descripción" name="descripcion" type="textarea" value={form.descripcion} onChange={handleChange} />
          <InputCampo label="Grado" name="grado" value={form.grado} onChange={handleChange} placeholder="Ej: 1ro" />
          <InputCampo label="Sección" name="seccion" value={form.seccion} onChange={handleChange} placeholder="Ej: A" />
          <InputCampo label="Periodo" name="id_periodo_escolar" type="select" value={form.id_periodo_escolar} onChange={handleChange} required options={periodos.filter(p => p.estado === 1).map(p => ({
            value: p.id.toString(),
            label: p.nombre,
          }))} />
          <div className="flex justify-end gap-2 pt-3">
            <Boton tipo="outline" onClick={() => setModal(false)}>Cancelar</Boton>
            <Boton type="submit">{editando ? 'Actualizar' : 'Crear'}</Boton>
          </div>
        </form>
      </Modal>
    </div>
  );
}
