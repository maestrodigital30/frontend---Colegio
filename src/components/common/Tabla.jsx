import { useState, useMemo } from 'react';
import { HiSearch, HiChevronLeft, HiChevronRight, HiChevronUp, HiChevronDown } from 'react-icons/hi';

function getValorTexto(fila, col) {
  if (col.render) {
    const resultado = col.render(fila);
    if (typeof resultado === 'string') return resultado;
    if (typeof resultado === 'number') return resultado.toString();
    if (resultado?.props?.children && typeof resultado.props.children === 'string') return resultado.props.children;
  }
  const val = fila[col.key];
  if (val === null || val === undefined) return '';
  return val.toString();
}

export default function Tabla({ columnas, datos, acciones, accionesClassName, accionesHeaderClassName, vacio = 'No hay registros', filtros = [], itemsPorPagina = 10 }) {
  const [busqueda, setBusqueda] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [paginaActual, setPaginaActual] = useState(1);
  const [filtrosActivos, setFiltrosActivos] = useState({});

  const datosConBusqueda = useMemo(() => {
    let resultado = [...(datos || [])];
    if (busqueda.trim()) {
      const termino = busqueda.toLowerCase();
      resultado = resultado.filter(fila =>
        columnas.some(col => getValorTexto(fila, col).toLowerCase().includes(termino))
      );
    }
    return resultado;
  }, [datos, busqueda, columnas]);

  const opcionesPorFiltro = useMemo(() => {
    const resultado = {};
    filtros.forEach(filtro => {
      let datosFiltrados = datosConBusqueda;
      Object.entries(filtrosActivos).forEach(([key, value]) => {
        if (key !== filtro.key && value !== '' && value !== undefined) {
          const otroDef = filtros.find(f => f.key === key);
          if (otroDef?.filterFn) {
            datosFiltrados = datosFiltrados.filter(fila => otroDef.filterFn(fila, value));
          }
        }
      });
      resultado[filtro.key] = filtro.opciones.filter(op =>
        filtrosActivos[filtro.key] === op.value || datosFiltrados.some(fila => filtro.filterFn(fila, op.value))
      );
    });
    return resultado;
  }, [datosConBusqueda, filtrosActivos, filtros]);

  const datosProcesados = useMemo(() => {
    let resultado = datosConBusqueda;

    Object.entries(filtrosActivos).forEach(([key, value]) => {
      if (value !== '' && value !== undefined) {
        const filtroDef = filtros.find(f => f.key === key);
        if (filtroDef?.filterFn) {
          resultado = resultado.filter(fila => filtroDef.filterFn(fila, value));
        }
      }
    });

    if (sortConfig.key) {
      resultado = [...resultado].sort((a, b) => {
        const col = columnas.find(c => c.key === sortConfig.key);
        const aVal = col ? getValorTexto(a, col) : (a[sortConfig.key]?.toString() || '');
        const bVal = col ? getValorTexto(b, col) : (b[sortConfig.key]?.toString() || '');

        const aNum = parseFloat(aVal);
        const bNum = parseFloat(bVal);
        if (!isNaN(aNum) && !isNaN(bNum)) {
          return sortConfig.direction === 'asc' ? aNum - bNum : bNum - aNum;
        }

        return sortConfig.direction === 'asc'
          ? aVal.localeCompare(bVal, 'es', { sensitivity: 'base' })
          : bVal.localeCompare(aVal, 'es', { sensitivity: 'base' });
      });
    }

    return resultado;
  }, [datosConBusqueda, sortConfig, filtrosActivos, columnas, filtros]);

  const totalPaginas = Math.max(1, Math.ceil(datosProcesados.length / itemsPorPagina));
  const paginaEfectiva = Math.min(paginaActual, totalPaginas);
  const datosPaginados = datosProcesados.slice(
    (paginaEfectiva - 1) * itemsPorPagina,
    paginaEfectiva * itemsPorPagina
  );

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const handleBusqueda = (val) => {
    setBusqueda(val);
    setPaginaActual(1);
  };

  const handleFiltro = (key, val) => {
    setFiltrosActivos(prev => ({ ...prev, [key]: val }));
    setPaginaActual(1);
  };

  if (!datos || datos.length === 0) {
    return (
      <div className="glass-card-static p-12 text-center">
        <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-slate-100 flex items-center justify-center">
          <span className="text-slate-400 text-xl">0</span>
        </div>
        <p className="text-slate-400 text-sm">{vacio}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Barra de filtros */}
      <div className="glass-card-static p-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => handleBusqueda(e.target.value)}
              placeholder="Buscar..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 bg-white text-slate-700 placeholder-slate-400"
            />
          </div>
          {filtros.map(f => {
            const opciones = opcionesPorFiltro[f.key] || f.opciones;
            return (
              <select
                key={f.key}
                value={filtrosActivos[f.key] || ''}
                onChange={(e) => handleFiltro(f.key, e.target.value)}
                className="text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 bg-white text-slate-600"
              >
                <option value="">{f.label}</option>
                {opciones.map(op => (
                  <option key={op.value} value={op.value}>{op.label}</option>
                ))}
              </select>
            );
          })}
        </div>
      </div>

      {/* Tabla */}
      <div className="glass-card-static overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-gradient-to-r from-primary-50/60 to-slate-50/80">
                {columnas.map((col) => (
                  <th
                    key={col.key}
                    onClick={() => handleSort(col.key)}
                    className={`px-5 py-3.5 text-left text-xs font-display font-bold text-primary-700 uppercase tracking-wider cursor-pointer hover:text-primary-900 select-none transition-colors group/th ${col.headerClassName || ''}`}
                  >
                    <span className="inline-flex items-center gap-1">
                      {col.label}
                      {sortConfig.key === col.key ? (
                        sortConfig.direction === 'asc'
                          ? <HiChevronUp className="w-3.5 h-3.5 text-primary-600" />
                          : <HiChevronDown className="w-3.5 h-3.5 text-primary-600" />
                      ) : (
                        <span className="text-slate-300 group-hover/th:text-slate-400 transition-colors text-[10px]">&#8597;</span>
                      )}
                    </span>
                  </th>
                ))}
                {acciones && (
                  <th className={`px-5 py-3.5 text-center text-xs font-display font-bold text-primary-700 uppercase tracking-wider ${accionesHeaderClassName || accionesClassName || ''}`}>
                    Acciones
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {datosPaginados.length === 0 ? (
                <tr>
                  <td colSpan={columnas.length + (acciones ? 1 : 0)} className="px-5 py-8 text-center text-sm text-slate-400">
                    No se encontraron resultados
                  </td>
                </tr>
              ) : (
                datosPaginados.map((fila, idx) => (
                  <tr
                    key={fila.id || idx}
                    className="hover:bg-slate-50/80 transition-colors duration-200 group"
                  >
                    {columnas.map((col) => (
                      <td key={col.key} className={`px-5 py-3.5 text-[15px] font-semibold text-slate-700 whitespace-nowrap group-hover:text-slate-900 transition-colors ${col.cellClassName || ''}`}>
                        {col.render ? col.render(fila) : fila[col.key]}
                      </td>
                    ))}
                    {acciones && (
                      <td className={`px-5 py-3.5 text-center ${accionesClassName || ''}`}>
                        <div className="flex items-center justify-center gap-2">
                          {acciones(fila)}
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginacion */}
        {datosProcesados.length > itemsPorPagina && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 bg-slate-50/50">
            <span className="text-xs text-slate-400">
              {((paginaEfectiva - 1) * itemsPorPagina) + 1}–{Math.min(paginaEfectiva * itemsPorPagina, datosProcesados.length)} de {datosProcesados.length}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPaginaActual(p => Math.max(1, p - 1))}
                disabled={paginaEfectiva <= 1}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <HiChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: totalPaginas }, (_, i) => i + 1)
                .filter(p => p === 1 || p === totalPaginas || Math.abs(p - paginaEfectiva) <= 1)
                .reduce((acc, p, i, arr) => {
                  if (i > 0 && p - arr[i - 1] > 1) acc.push('dots-' + i);
                  acc.push(p);
                  return acc;
                }, [])
                .map((p) =>
                  typeof p === 'string' ? (
                    <span key={p} className="px-1 text-slate-300 text-xs">...</span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => setPaginaActual(p)}
                      className={`min-w-[28px] h-7 rounded-lg text-xs font-medium transition-colors ${
                        paginaEfectiva === p
                          ? 'bg-primary-600 text-white shadow-sm'
                          : 'text-slate-500 hover:bg-white hover:text-slate-700'
                      }`}
                    >
                      {p}
                    </button>
                  )
                )}
              <button
                onClick={() => setPaginaActual(p => Math.min(totalPaginas, p + 1))}
                disabled={paginaEfectiva >= totalPaginas}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <HiChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
