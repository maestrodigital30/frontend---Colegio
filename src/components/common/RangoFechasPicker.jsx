import { useState, useRef, useEffect } from 'react';
import { DayPicker } from 'react-day-picker';
import { es } from 'date-fns/locale';
import { FiCalendar, FiX } from 'react-icons/fi';
import 'react-day-picker/style.css';

const formatearCorto = (fecha) =>
  fecha
    ? fecha.toLocaleDateString('es-PE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        timeZone: 'America/Lima',
      })
    : '';

export default function RangoFechasPicker({ rango, onChange, placeholder = 'Rango de fechas' }) {
  const [abierto, setAbierto] = useState(false);
  const contenedorRef = useRef(null);

  useEffect(() => {
    const manejarClickFuera = (e) => {
      if (contenedorRef.current && !contenedorRef.current.contains(e.target)) {
        setAbierto(false);
      }
    };
    if (abierto) document.addEventListener('mousedown', manejarClickFuera);
    return () => document.removeEventListener('mousedown', manejarClickFuera);
  }, [abierto]);

  const hayRango = rango?.from && rango?.to;
  const etiqueta = hayRango
    ? `${formatearCorto(rango.from)} — ${formatearCorto(rango.to)}`
    : placeholder;

  const manejarSeleccion = (nuevo) => {
    onChange(nuevo);
    if (nuevo?.from && nuevo?.to && nuevo.from.getTime() !== nuevo.to.getTime()) {
      setAbierto(false);
    }
  };

  const limpiar = (e) => {
    e.stopPropagation();
    onChange(undefined);
  };

  return (
    <div ref={contenedorRef} className="relative inline-block">
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-400 transition-all"
      >
        <FiCalendar className="w-4 h-4 text-primary-600" />
        <span className={hayRango ? 'text-black' : 'text-slate-500'}>{etiqueta}</span>
        {hayRango && (
          <span
            role="button"
            tabIndex={0}
            onClick={limpiar}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') limpiar(e);
            }}
            className="ml-1 text-slate-400 hover:text-rose-500 cursor-pointer"
            aria-label="Limpiar rango"
          >
            <FiX className="w-4 h-4" />
          </span>
        )}
      </button>

      {abierto && (
        <div className="absolute z-50 mt-2 left-0 bg-white rounded-2xl shadow-2xl border border-slate-200 p-3">
          <DayPicker
            mode="range"
            locale={es}
            numberOfMonths={1}
            selected={rango}
            onSelect={manejarSeleccion}
            showOutsideDays
            weekStartsOn={1}
          />
        </div>
      )}
    </div>
  );
}
