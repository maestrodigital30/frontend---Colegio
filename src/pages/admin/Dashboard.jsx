import { useState, useEffect } from 'react';
import { HiUserGroup, HiAcademicCap, HiBookOpen, HiClipboardCheck } from 'react-icons/hi';
import TarjetaEstadistica from '../../components/common/TarjetaEstadistica';
import apiClient from '../../services/apiClient';
import { useAuth } from '../../features/auth/AuthContext';

export default function DashboardAdmin() {
  const { usuario } = useAuth();
  const [stats, setStats] = useState({ docentes: 0, cursos: 0, alumnos: 0, periodos: 0 });

  useEffect(() => {
    Promise.all([
      apiClient.get('/docentes').catch(() => ({ data: [] })),
      apiClient.get('/cursos').catch(() => ({ data: [] })),
      apiClient.get('/alumnos').catch(() => ({ data: [] })),
      apiClient.get('/periodos').catch(() => ({ data: [] })),
    ]).then(([doc, cur, alu, per]) => {
      setStats({
        docentes: doc.data.length,
        cursos: cur.data.length,
        alumnos: alu.data.length,
        periodos: per.data.length,
      });
    });
  }, []);

  return (
    <div>
      {/* Header */}
      <div className="mb-8 animate-fade-up rounded-2xl p-6 bg-white">
        <p className="text-xs font-display font-bold uppercase tracking-widest mb-1 text-primary-600">Panel de Control</p>
        <h1 className="text-3xl font-display font-bold text-slate-800">
          Bienvenido, <span className="text-primary-600">{usuario?.nombres || 'Administrador'}</span>
        </h1>
        <p className="text-sm text-slate-400 mt-1">Vista general del sistema escolar</p>
      </div>

      {/* Stats Grid - 4 cards en una fila, tamaño 20% mayor */}
      <div className="grid grid-cols-4 gap-5 mb-8 stagger-children">
        <TarjetaEstadistica titulo="Profesores" valor={stats.docentes} icono={HiAcademicCap} indice={0} />
        <TarjetaEstadistica titulo="Cursos" valor={stats.cursos} icono={HiBookOpen} indice={1} />
        <TarjetaEstadistica titulo="Alumnos" valor={stats.alumnos} icono={HiUserGroup} indice={2} />
        <TarjetaEstadistica titulo="Periodos" valor={stats.periodos} icono={HiClipboardCheck} indice={3} />
      </div>

      {/* Activity section */}
      <div className="rounded-2xl p-6 animate-fade-up bg-white" style={{ animationDelay: '0.4s' }}>
        <h2 className="font-display font-bold text-slate-800 mb-4 text-lg">Actividad Reciente</h2>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center gap-3 p-4 rounded-xl border bg-primary-50 border-primary-200">
              <div className="w-2.5 h-2.5 rounded-full bg-primary-500" />
              <p className="text-sm font-medium text-primary-700">Sistema inicializado correctamente</p>
              <span className="ml-auto text-xs font-medium text-primary-600">Reciente</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
