import { useState, useEffect } from 'react';
import { HiBookOpen, HiAcademicCap } from 'react-icons/hi';
import apiClient from '../../services/apiClient';
import { getUploadUrl } from '../../utils/storage';

export default function CursosAlumnoPage() {
  const [cursos, setCursos] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    apiClient.get('/alumno-portal/mis-cursos')
      .then(res => setCursos(res.data))
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

  return (
    <div style={{ fontSize: '115%' }}>
      <div className="mb-8 animate-fade-up">
        <p className="text-xs font-display font-bold uppercase tracking-widest mb-1" style={{ color: '#0060FF' }}>Academico</p>
        <h1 className="text-3xl font-display font-bold text-black">Mis Cursos</h1>
        <p className="text-sm text-black/60 font-medium mt-1">Cursos en los que estas inscrito</p>
      </div>

      {cursos.length === 0 ? (
        <div className="rounded-2xl bg-white p-12 text-center animate-fade-up" style={{ border: '2px solid #87CEEB' }}>
          <HiBookOpen className="w-16 h-16 mx-auto mb-4" style={{ color: '#87CEEB' }} />
          <p className="text-black font-bold">No tienes cursos asignados aun</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
          {cursos.map((curso, i) => (
            <div key={curso.id} className="rounded-2xl bg-white p-6 hover:scale-[1.02] transition-all duration-300 animate-fade-up" style={{ border: '2px solid #87CEEB', animationDelay: `${i * 0.08}s` }}>
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-sky-200" style={{ color: '#0060FF' }}>
                  <HiBookOpen className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-display text-black font-bold truncate">{curso.nombre}</h3>
                  {(curso.grado || curso.seccion) && (
                    <p className="text-xs text-slate-500 mt-1">
                      {[curso.grado, curso.seccion].filter(Boolean).join(' - ')}
                    </p>
                  )}
                  {curso.descripcion && (
                    <p className="text-xs text-slate-400 mt-2 line-clamp-2">{curso.descripcion}</p>
                  )}
                </div>
              </div>

              {curso.tbl_perfiles_docente && (
                <div className="mt-4 pt-4 border-t border-sky-200 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-secondary-100 flex items-center justify-center">
                    {curso.tbl_perfiles_docente.foto_url ? (
                      <img src={getUploadUrl(curso.tbl_perfiles_docente.foto_url)} alt="" className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                      <HiAcademicCap className="w-4 h-4 text-secondary-600" />
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-700">
                      {curso.tbl_perfiles_docente.nombres} {curso.tbl_perfiles_docente.apellidos}
                    </p>
                    {curso.tbl_perfiles_docente.especialidad && (
                      <p className="text-[10px] text-slate-400">{curso.tbl_perfiles_docente.especialidad}</p>
                    )}
                  </div>
                </div>
              )}

              {curso.tbl_periodos_escolares && (
                <div className="mt-3">
                  <span className="inline-block px-2 py-0.5 text-[10px] font-display font-semibold uppercase tracking-wider rounded-md bg-accent-50 text-accent-600 border border-accent-200">
                    {curso.tbl_periodos_escolares.nombre} {curso.tbl_periodos_escolares.anio || ''}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
