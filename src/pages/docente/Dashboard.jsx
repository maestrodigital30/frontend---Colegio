import { useState, useEffect } from 'react';
import { HiBookOpen, HiUserGroup, HiClipboardCheck, HiCalendar } from 'react-icons/hi';
import TarjetaEstadistica from '../../components/common/TarjetaEstadistica';
import apiClient from '../../services/apiClient';
import { useAuth } from '../../features/auth/AuthContext';

export default function DashboardDocente() {
  const { usuario } = useAuth();
  const [stats, setStats] = useState({ cursos: 0, alumnos: 0, periodos: 0, sesiones: 0 });

  useEffect(() => {
    Promise.all([
      apiClient.get('/cursos').catch(() => ({ data: [] })),
      apiClient.get('/alumnos').catch(() => ({ data: [] })),
      apiClient.get('/periodos').catch(() => ({ data: [] })),
    ]).then(([cur, alu, per]) => {
      setStats({
        cursos: cur.data.length,
        alumnos: alu.data.length,
        periodos: per.data.length,
        sesiones: 0,
      });
    });
  }, []);

  return (
    <div>
      {/* Header */}
      <div className="mb-8 animate-fade-up rounded-2xl p-6 bg-white">
        <p className="text-xs font-display font-bold uppercase tracking-widest mb-1 text-primary-600">Mi Espacio</p>
        <h1 className="text-3xl font-display font-bold text-slate-800">
          Hola, <span className="text-primary-600">{usuario?.nombres || 'Docente'}</span>
        </h1>
        <p className="text-sm text-slate-400 mt-1">Resumen de tu actividad escolar</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-5 mb-8 stagger-children">
        <TarjetaEstadistica titulo="Mis Cursos" valor={stats.cursos} icono={HiBookOpen} indice={0} />
        <TarjetaEstadistica titulo="Mis Alumnos" valor={stats.alumnos} icono={HiUserGroup} indice={1} />
        <TarjetaEstadistica titulo="Periodos" valor={stats.periodos} icono={HiCalendar} indice={2} />
        <TarjetaEstadistica titulo="Sesiones" valor={stats.sesiones} icono={HiClipboardCheck} indice={3} />
      </div>

      {/* Quick actions */}
      <div className="rounded-2xl p-6 animate-fade-up bg-white" style={{ animationDelay: '0.4s' }}>
        <h2 className="font-display font-bold text-slate-800 mb-4 text-lg">Acciones Rapidas</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { label: 'Tomar Asistencia', desc: 'Registra la asistencia del dia', card: 'bg-primary-50 border-primary-200', text: 'text-primary-700', sub: 'text-primary-500' },
            { label: 'Registrar Notas', desc: 'Ingresa calificaciones', card: 'bg-secondary-50 border-secondary-200', text: 'text-secondary-700', sub: 'text-secondary-500' },
            { label: 'Jugar Trivia', desc: 'Inicia una partida interactiva', card: 'bg-accent-50 border-accent-200', text: 'text-accent-700', sub: 'text-accent-500' },
          ].map((action, i) => (
            <div key={i} className={`p-4 rounded-xl border hover:scale-[1.02] transition-all duration-300 cursor-pointer ${action.card}`}>
              <p className={`font-display font-bold text-sm ${action.text}`}>{action.label}</p>
              <p className={`text-xs mt-1 ${action.sub}`}>{action.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
