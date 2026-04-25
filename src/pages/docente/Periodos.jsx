import { useMemo } from 'react';
import useCrud from '../../hooks/useCrud';
import Tabla from '../../components/common/Tabla';
import { formatearFecha } from '../../utils/formatters';

export default function PeriodosDocentePage() {
  const { datos, cargando } = useCrud('/periodos');

  const columnas = [
    { key: 'id', label: 'ID' },
    { key: 'nombre', label: 'Nombre', headerClassName: 'bg-primary-200 text-primary-800', cellClassName: 'bg-primary-100 text-primary-800 font-medium' },
    { key: 'anio', label: 'Año', headerClassName: 'bg-indigo-200 text-indigo-800', cellClassName: 'bg-indigo-100 text-indigo-800 font-medium' },
    { key: 'fecha_inicio', label: 'Inicio', headerClassName: 'bg-sky-200 text-sky-800', cellClassName: 'bg-sky-100 text-sky-800 font-medium', render: (f) => formatearFecha(f.fecha_inicio) },
    { key: 'fecha_fin', label: 'Fin', render: (f) => formatearFecha(f.fecha_fin) },
    { key: 'estado', label: 'Estado', headerClassName: 'bg-amber-200 text-amber-800', cellClassName: 'bg-amber-100', render: (f) => f.estado === 1 ? <span className="text-emerald-700 font-semibold">Activo</span> : <span className="text-rose-600 font-semibold">Inactivo</span> },
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

  if (cargando) return <div className="text-center py-8 text-slate-500">Cargando...</div>;

  return (
    <div className="animate-fade-up" style={{ fontSize: '115%' }}>
      <div className="mb-6">
        <p className="text-xs font-display font-medium text-secondary-600 uppercase tracking-widest mb-1">Académico</p>
        <h1 className="text-3xl font-display font-bold text-slate-800">Periodos Escolares</h1>
      </div>
      <Tabla columnas={columnas} datos={datos} filtros={filtros} />
    </div>
  );
}
