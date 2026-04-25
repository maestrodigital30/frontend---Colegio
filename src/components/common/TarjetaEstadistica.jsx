const cardVariants = [
  {
    card: 'from-primary-50 to-primary-100 border-primary-200 hover:border-primary-300 hover:shadow-glow-primary',
    glow: 'bg-primary-500',
    icon: 'bg-primary-600',
    text: 'text-primary-700',
  },
  {
    card: 'from-secondary-50 to-secondary-100 border-secondary-200 hover:border-secondary-300 hover:shadow-glow-secondary',
    glow: 'bg-secondary-500',
    icon: 'bg-secondary-600',
    text: 'text-secondary-700',
  },
  {
    card: 'from-accent-50 to-accent-100 border-accent-200 hover:border-accent-300 hover:shadow-glow-accent',
    glow: 'bg-accent-500',
    icon: 'bg-accent-600',
    text: 'text-accent-700',
  },
  {
    card: 'from-primary-100 to-secondary-50 border-primary-300 hover:border-secondary-300 hover:shadow-glow-secondary',
    glow: 'bg-accent-400',
    icon: 'bg-accent-500',
    text: 'text-accent-700',
  },
];

export default function TarjetaEstadistica({ titulo, valor, icono: Icono, indice = 0 }) {
  const v = cardVariants[indice % cardVariants.length];

  return (
    <div
      className={`relative overflow-hidden rounded-2xl p-6 border bg-gradient-to-br ${v.card} transition-all duration-300 group hover:scale-[1.02] animate-fade-up cursor-default`}
      style={{ animationDelay: `${indice * 0.08}s`, minHeight: '140px' }}
    >
      <div className={`absolute -top-10 -right-10 w-28 h-28 rounded-full blur-2xl opacity-40 group-hover:opacity-60 transition-all duration-500 ${v.glow}`} />

      <div className="flex items-center justify-between relative z-10">
        <div>
          <p className={`text-xs font-display font-bold uppercase tracking-wider mb-2 ${v.text}`}>
            {titulo}
          </p>
          <p className={`text-4xl font-display font-bold ${v.text}`}>
            {valor}
          </p>
        </div>
        {Icono && (
          <div className={`p-4 rounded-xl shadow-lg transition-all duration-300 group-hover:scale-110 ${v.icon} text-white`}>
            <Icono className="w-7 h-7" />
          </div>
        )}
      </div>
    </div>
  );
}
