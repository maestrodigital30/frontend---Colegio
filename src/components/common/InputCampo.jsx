import { useState } from 'react';
import { HiEye, HiEyeOff } from 'react-icons/hi';

export default function InputCampo({ label, name, type = 'text', value, onChange, placeholder, required = false, error, disabled = false, options, className = '' }) {
  const [mostrarContrasena, setMostrarContrasena] = useState(false);
  const esPassword = type === 'password';
  const baseClass = `
    w-full px-4 py-2.5 rounded-xl text-sm font-body
    bg-white border transition-all duration-300
    text-slate-700 placeholder-slate-400
    focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400
    ${error ? 'border-rose-400' : 'border-slate-200'}
    ${disabled ? 'opacity-50 cursor-not-allowed bg-slate-50' : 'hover:border-slate-300'}
    ${className}
  `;

  return (
    <div className="mb-4">
      {label && (
        <label htmlFor={name} className="block text-xs font-display font-medium text-slate-500 mb-1.5 tracking-wide uppercase">
          {label} {required && <span className="text-primary-500">*</span>}
        </label>
      )}
      {type === 'select' ? (
        <select id={name} name={name} value={value} onChange={onChange} disabled={disabled} className={baseClass}>
          <option value="" className="text-slate-400">{placeholder || 'Seleccionar...'}</option>
          {options?.map((opt) => (
            <option key={opt.value} value={opt.value} className="text-slate-700">{opt.label}</option>
          ))}
        </select>
      ) : type === 'textarea' ? (
        <textarea id={name} name={name} value={value} onChange={onChange} placeholder={placeholder} disabled={disabled} rows={3} className={baseClass} />
      ) : esPassword ? (
        <div className="relative">
          <input id={name} name={name} type={mostrarContrasena ? 'text' : 'password'} value={value} onChange={onChange} placeholder={placeholder} required={required} disabled={disabled} className={`${baseClass} pr-10`} />
          <button
            type="button"
            onClick={() => setMostrarContrasena(!mostrarContrasena)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
            tabIndex={-1}
          >
            {mostrarContrasena ? <HiEyeOff className="w-5 h-5" /> : <HiEye className="w-5 h-5" />}
          </button>
        </div>
      ) : (
        <input id={name} name={name} type={type} value={value} onChange={onChange} placeholder={placeholder} required={required} disabled={disabled} className={baseClass} />
      )}
      {error && <p className="mt-1.5 text-xs text-rose-500 font-medium">{error}</p>}
    </div>
  );
}
