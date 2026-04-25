export default function Boton({ children, onClick, tipo = 'primary', type = 'button', disabled = false, className = '' }) {
  const estilos = {
    primary: 'bg-gradient-to-r from-primary-500 to-primary-600 text-white hover:from-primary-400 hover:to-primary-500 shadow-glow-primary font-semibold',
    secondary: 'bg-gradient-to-r from-secondary-500 to-secondary-600 text-white hover:from-secondary-400 hover:to-secondary-500 shadow-glow-secondary font-semibold',
    accent: 'bg-gradient-to-r from-accent-500 to-accent-600 text-white hover:from-accent-400 hover:to-accent-500 shadow-glow-accent font-semibold',
    danger: 'bg-gradient-to-r from-rose-500 to-rose-600 text-white hover:from-rose-400 hover:to-rose-500 shadow-[0_2px_12px_rgba(244,63,94,0.15)] font-semibold',
    outline: 'border border-slate-300 text-slate-600 hover:bg-slate-50 hover:text-slate-800 hover:border-slate-400',
    ghost: 'text-slate-500 hover:text-slate-800 hover:bg-slate-100',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        px-5 py-2.5 rounded-xl font-display text-sm tracking-wide
        transition-all duration-300 ease-out
        disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none
        active:scale-[0.97]
        ${estilos[tipo] || estilos.primary}
        ${className}
      `}
    >
      {children}
    </button>
  );
}
