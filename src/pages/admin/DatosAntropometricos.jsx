import { useState, useMemo } from 'react';
import useCrud from '../../hooks/useCrud';
import Tabla from '../../components/common/Tabla';
import Boton from '../../components/common/Boton';
import Modal from '../../components/common/Modal';
import InputCampo from '../../components/common/InputCampo';
import { HiPencil, HiBan, HiCheckCircle } from 'react-icons/hi';
import { TIPOS_VALOR_ANTROPOMETRICO } from '../../utils/constants';
import toast from 'react-hot-toast';

const TIPO_VALOR_OPCIONES = [
  { value: TIPOS_VALOR_ANTROPOMETRICO.NUMERICO, label: 'Numérico (permite decimales)' },
  { value: TIPOS_VALOR_ANTROPOMETRICO.TEXTO, label: 'Texto libre' },
];

const FORM_INICIAL = { nombre: '', tipo_valor: '', unidad: '' };

export default function DatosAntropometricosPage() {
  const { datos, cargando, crear, actualizar, inactivar, activar } = useCrud('/tipos-dato-antropometrico');
  const [modal, setModal] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState(FORM_INICIAL);
  const [errores, setErrores] = useState({});

  const columnas = [
    { key: 'id', label: 'ID' },
    { key: 'nombre', label: 'Nombre' },
    {
      key: 'tipo_valor', label: 'Tipo de valor',
      headerClassName: 'bg-primary-200 text-primary-800', cellClassName: 'bg-primary-100 text-primary-800 font-medium',
      render: (f) => TIPO_VALOR_OPCIONES.find(o => o.value === f.tipo_valor)?.label || f.tipo_valor,
    },
    {
      key: 'unidad', label: 'Unidad',
      headerClassName: 'bg-sky-200 text-sky-800', cellClassName: 'bg-sky-100 text-sky-800 font-medium',
      render: (f) => f.unidad || '-',
    },
    {
      key: 'estado', label: 'Estado',
      headerClassName: 'bg-amber-200 text-amber-800', cellClassName: 'bg-amber-100',
      render: (f) => f.estado === 1
        ? <span className="text-emerald-700 font-semibold">Activo</span>
        : <span className="text-rose-600 font-semibold">Inactivo</span>,
    },
  ];

  const filtros = useMemo(() => [
    {
      key: 'tipo_valor', label: 'Todos los tipos',
      opciones: TIPO_VALOR_OPCIONES,
      filterFn: (f, v) => f.tipo_valor === v,
    },
    {
      key: 'estado', label: 'Todos los estados',
      opciones: [
        { value: '1', label: 'Activo' },
        { value: '0', label: 'Inactivo' },
      ],
      filterFn: (f, v) => f.estado === parseInt(v),
    },
  ], []);

  const abrirCrear = () => {
    setEditando(null);
    setForm(FORM_INICIAL);
    setErrores({});
    setModal(true);
  };

  const abrirEditar = (t) => {
    setEditando(t);
    setForm({
      nombre: t.nombre || '',
      tipo_valor: t.tipo_valor || '',
      unidad: t.unidad || '',
    });
    setErrores({});
    setModal(true);
  };

  const validar = () => {
    const errs = {};
    if (!form.nombre.trim()) errs.nombre = 'El nombre es obligatorio';
    if (!form.tipo_valor) errs.tipo_valor = 'Seleccione un tipo de valor';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validar();
    if (Object.keys(errs).length > 0) {
      setErrores(errs);
      return;
    }
    try {
      const body = {
        nombre: form.nombre.trim(),
        tipo_valor: form.tipo_valor,
        unidad: form.tipo_valor === TIPOS_VALOR_ANTROPOMETRICO.NUMERICO ? (form.unidad.trim() || null) : null,
      };
      if (editando) await actualizar(editando.id, body);
      else await crear(body);
      setModal(false);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al guardar');
    }
  };

  const handleToggleEstado = async (t) => {
    if (t.estado === 1) {
      if (!confirm('¿Desactivar este tipo de dato? Los datos ya registrados de los alumnos no se eliminarán.')) return;
      try { await inactivar(t.id); } catch { toast.error('Error al desactivar'); }
    } else {
      if (!confirm('¿Activar este tipo de dato?')) return;
      try { await activar(t.id); } catch { toast.error('Error al activar'); }
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => {
      const next = { ...prev, [name]: value };
      if (name === 'tipo_valor' && value !== TIPOS_VALOR_ANTROPOMETRICO.NUMERICO) {
        next.unidad = '';
      }
      return next;
    });
    if (errores[name]) setErrores(prev => ({ ...prev, [name]: undefined }));
  };

  if (cargando) return <div className="text-center py-8 text-slate-400">Cargando...</div>;

  const esNumerico = form.tipo_valor === TIPOS_VALOR_ANTROPOMETRICO.NUMERICO;

  return (
    <div className="animate-fade-up" style={{ fontSize: '115%' }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-xs font-display font-medium text-primary-600 uppercase tracking-widest mb-1">Configuración</p>
          <h1 className="text-3xl font-display font-bold text-slate-800">Datos Antropométricos</h1>
          <p className="text-sm text-slate-500 mt-1">Configura los tipos de dato antropométrico que se podrán registrar en cada alumno.</p>
        </div>
        <Boton onClick={abrirCrear}>Nuevo Tipo</Boton>
      </div>

      <Tabla
        columnas={columnas}
        datos={datos}
        filtros={filtros}
        accionesClassName="bg-primary-200 text-primary-800"
        acciones={(fila) => (
          <>
            <button onClick={() => abrirEditar(fila)} className="p-1 text-primary-400 hover:bg-slate-50 rounded" title="Editar"><HiPencil className="w-4 h-4" /></button>
            {fila.estado === 1 ? (
              <button onClick={() => handleToggleEstado(fila)} className="p-1 text-rose-400 hover:bg-slate-50 rounded" title="Desactivar"><HiBan className="w-4 h-4" /></button>
            ) : (
              <button onClick={() => handleToggleEstado(fila)} className="p-1 text-secondary-500 hover:bg-slate-50 rounded" title="Activar"><HiCheckCircle className="w-4 h-4" /></button>
            )}
          </>
        )}
      />

      <Modal abierto={modal} cerrar={() => setModal(false)} titulo={editando ? 'Editar Tipo de Dato' : 'Nuevo Tipo de Dato'}>
        <form onSubmit={handleSubmit} className="space-y-3">
          <InputCampo
            label="Nombre del dato"
            name="nombre"
            value={form.nombre}
            onChange={handleChange}
            placeholder="Ej: Peso, Talla, Pie plano, Enfermedad que padece"
            required
            error={errores.nombre}
          />
          <InputCampo
            label="Tipo de valor"
            name="tipo_valor"
            type="select"
            value={form.tipo_valor}
            onChange={handleChange}
            required
            placeholder="Seleccione..."
            options={TIPO_VALOR_OPCIONES}
            error={errores.tipo_valor}
          />
          {esNumerico && (
            <InputCampo
              label="Unidad de medida (opcional)"
              name="unidad"
              value={form.unidad}
              onChange={handleChange}
              placeholder="Ej: kg, cm, mm"
            />
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
