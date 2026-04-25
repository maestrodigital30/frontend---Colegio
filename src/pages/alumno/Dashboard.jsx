import { useState, useEffect } from 'react';
import { HiBookOpen, HiCreditCard, HiClipboardCheck, HiPuzzle } from 'react-icons/hi';
import TarjetaEstadistica from '../../components/common/TarjetaEstadistica';
import apiClient from '../../services/apiClient';
import { useAuth } from '../../features/auth/AuthContext';
import { ESTADOS_ASISTENCIA } from '../../utils/constants';

export default function DashboardAlumno() {
  const { usuario } = useAuth();
  const [data, setData] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    apiClient.get('/alumno-portal/dashboard')
      .then(res => setData(res.data))
      .catch(() => {})
      .finally(() => setCargando(false));
  }, []);

  if (cargando) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  const totalAsistencias = data?.asistencia
    ? Object.values(data.asistencia).reduce((a, b) => a + b, 0)
    : 0;

  return (
    <div style={{ fontSize: '115%' }}>
      <div className="mb-8 animate-fade-up rounded-2xl p-6 bg-white">
        <p className="text-xs font-display font-bold uppercase tracking-widest mb-1 text-primary-600">Mi Portal</p>
        <h1 className="text-3xl font-display font-bold text-slate-800">
          Hola, <span className="text-primary-600">{usuario?.nombres || 'Alumno'}</span>
        </h1>
        <p className="text-sm text-slate-400 mt-1">Resumen de tu actividad escolar</p>
      </div>

      <div className="grid grid-cols-4 gap-5 mb-8 stagger-children">
        <TarjetaEstadistica titulo="Mis Cursos" valor={data?.totalCursos || 0} icono={HiBookOpen} indice={0} />
        <TarjetaEstadistica titulo="Notas Registradas" valor={data?.notasRecientes?.length || 0} icono={HiCreditCard} indice={1} />
        <TarjetaEstadistica titulo="Trivias Jugadas" valor={data?.triviasRecientes?.length || 0} icono={HiPuzzle} indice={2} />
        <TarjetaEstadistica titulo="Asistencias" valor={totalAsistencias} icono={HiClipboardCheck} indice={3} />
      </div>

      {/* Resumen de asistencia */}
      {totalAsistencias > 0 && (
        <div className="rounded-2xl p-6 mb-6 animate-fade-up bg-white" style={{ animationDelay: '0.3s' }}>
          <h2 className="font-display font-bold text-slate-800 mb-4 text-lg">Resumen de Asistencia</h2>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Presente', valor: data?.asistencia?.[ESTADOS_ASISTENCIA.PRESENTE] || 0, color: 'text-emerald-600 bg-emerald-50' },
              { label: 'Tardanza', valor: data?.asistencia?.[ESTADOS_ASISTENCIA.TARDANZA] || 0, color: 'text-amber-600 bg-amber-50' },
              { label: 'Ausente', valor: data?.asistencia?.[ESTADOS_ASISTENCIA.AUSENTE] || 0, color: 'text-red-600 bg-red-50' },
            ].map((item) => (
              <div key={item.label} className={`p-4 rounded-xl ${item.color} text-center`}>
                <p className="text-2xl font-display font-bold">{item.valor}</p>
                <p className="text-xs font-medium mt-1">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notas recientes */}
      {data?.notasRecientes?.length > 0 && (
        <div className="rounded-2xl p-6 animate-fade-up bg-white" style={{ animationDelay: '0.4s' }}>
          <h2 className="font-display font-bold text-slate-800 mb-4 text-lg">Ultimas Notas</h2>
          <div className="space-y-3">
            {data.notasRecientes.map((nota) => (
              <div key={nota.id} className="flex items-center justify-between p-4 rounded-xl border bg-primary-50 border-primary-200">
                <div>
                  <p className="font-bold text-sm text-primary-700">{nota.tbl_cursos?.nombre}</p>
                  <p className="text-xs text-primary-600">{nota.tbl_periodos_calificacion?.nombre}</p>
                </div>
                <span className="font-display font-bold text-lg text-primary-700">
                  {nota.nota_final_numerica != null ? Number(nota.nota_final_numerica).toFixed(1) : nota.nota_final_letra || '-'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
