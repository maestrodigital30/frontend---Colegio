import { useState, useEffect } from 'react';
import { HiUser, HiLockClosed, HiCheckCircle } from 'react-icons/hi';
import apiClient from '../../services/apiClient';
import { getUploadUrl } from '../../utils/storage';
import toast from 'react-hot-toast';

export default function PerfilAlumnoPage() {
  const [perfil, setPerfil] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [mostrarCambio, setMostrarCambio] = useState(false);
  const [formPass, setFormPass] = useState({ contrasena_actual: '', contrasena_nueva: '', confirmar: '' });
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    apiClient.get('/alumno-portal/mi-perfil')
      .then(res => setPerfil(res.data))
      .catch(() => {})
      .finally(() => setCargando(false));
  }, []);

  const cambiarContrasena = async (e) => {
    e.preventDefault();
    if (formPass.contrasena_nueva !== formPass.confirmar) {
      toast.error('Las contrasenas no coinciden');
      return;
    }
    if (formPass.contrasena_nueva.length < 6) {
      toast.error('La contrasena debe tener al menos 6 caracteres');
      return;
    }

    setGuardando(true);
    try {
      await apiClient.put('/alumno-portal/cambiar-contrasena', {
        contrasena_actual: formPass.contrasena_actual,
        contrasena_nueva: formPass.contrasena_nueva,
      });
      toast.success('Contrasena actualizada correctamente');
      setFormPass({ contrasena_actual: '', contrasena_nueva: '', confirmar: '' });
      setMostrarCambio(false);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al cambiar contrasena');
    } finally {
      setGuardando(false);
    }
  };

  if (cargando) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (!perfil) {
    return (
      <div className="rounded-2xl bg-white p-12 text-center" style={{ border: '2px solid #87CEEB' }}>
        <HiUser className="w-16 h-16 mx-auto mb-4" style={{ color: '#87CEEB' }} />
        <p className="text-black font-bold">No se encontro tu perfil</p>
      </div>
    );
  }

  return (
    <div style={{ fontSize: '115%' }}>
      <div className="mb-8 animate-fade-up">
        <p className="text-xs font-display font-bold uppercase tracking-widest mb-1" style={{ color: '#0060FF' }}>Cuenta</p>
        <h1 className="text-3xl font-display font-bold text-black">Mi Perfil</h1>
        <p className="text-sm text-black/60 font-medium mt-1">Tu informacion personal</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Datos personales */}
        <div className="lg:col-span-2 rounded-2xl bg-white p-6 animate-fade-up" style={{ border: '2px solid #87CEEB' }}>
          <div className="flex items-center gap-5 mb-6">
            {perfil.foto_url ? (
              <img src={getUploadUrl(perfil.foto_url)} alt="" className="w-20 h-20 rounded-2xl object-cover border-2 border-primary-200" />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-primary-100 flex items-center justify-center border-2 border-primary-200">
                <HiUser className="w-10 h-10 text-primary-400" />
              </div>
            )}
            <div>
              <h2 className="font-display font-bold text-black text-xl">{perfil.nombres} {perfil.apellidos}</h2>
              <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-display font-semibold uppercase tracking-wider rounded-md bg-primary-50 text-primary-600 border border-primary-200">
                Alumno
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { label: 'DNI', valor: perfil.dni || 'No registrado' },
              { label: 'Genero', valor: perfil.genero === 'M' ? 'Masculino' : perfil.genero === 'F' ? 'Femenino' : perfil.genero || '-' },
              { label: 'Fecha de Nacimiento', valor: perfil.fecha_nacimiento ? new Date(perfil.fecha_nacimiento).toLocaleDateString('es-PE') : '-' },
              { label: 'Direccion', valor: perfil.direccion || '-' },
            ].map(campo => (
              <div key={campo.label} className="p-3 rounded-xl bg-sky-50" style={{ border: '1.5px solid #87CEEB' }}>
                <p className="text-[10px] text-slate-400 font-display font-semibold uppercase tracking-wider mb-1">{campo.label}</p>
                <p className="text-sm font-bold text-black">{campo.valor}</p>
              </div>
            ))}
          </div>

          {/* Cursos */}
          {perfil.tbl_alumnos_cursos?.length > 0 && (
            <div className="mt-6">
              <h3 className="font-display font-semibold text-slate-700 text-sm mb-3">Cursos Inscritos</h3>
              <div className="flex flex-wrap gap-2">
                {perfil.tbl_alumnos_cursos.map(ac => (
                  <span key={ac.tbl_cursos?.id} className="px-3 py-1.5 text-xs font-bold rounded-lg bg-sky-200 border" style={{ color: '#0060FF', borderColor: '#87CEEB' }}>
                    {ac.tbl_cursos?.nombre} {ac.tbl_cursos?.grado ? `(${ac.tbl_cursos.grado})` : ''}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Padres/Apoderados */}
          {perfil.tbl_padres_alumnos?.length > 0 && (
            <div className="mt-6">
              <h3 className="font-display font-semibold text-slate-700 text-sm mb-3">Apoderados</h3>
              <div className="space-y-2">
                {perfil.tbl_padres_alumnos.map(pa => (
                  <div key={pa.tbl_padres?.id} className="p-3 rounded-xl bg-sky-50 flex items-center justify-between" style={{ border: '1.5px solid #87CEEB' }}>
                    <div>
                      <p className="text-sm font-bold text-black">{pa.tbl_padres?.nombres} {pa.tbl_padres?.apellidos}</p>
                      {pa.parentesco && <p className="text-xs text-slate-400">{pa.parentesco}</p>}
                    </div>
                    {pa.tbl_padres?.telefono && (
                      <span className="text-xs text-slate-500">{pa.tbl_padres.telefono}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Cambiar contrasena */}
        <div className="rounded-2xl bg-white p-6 animate-fade-up" style={{ border: '2px solid #87CEEB', animationDelay: '0.1s' }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-xl bg-sky-200">
              <HiLockClosed className="w-5 h-5" style={{ color: '#0060FF' }} />
            </div>
            <h3 className="font-display font-bold text-black">Seguridad</h3>
          </div>

          {!mostrarCambio ? (
            <button
              onClick={() => setMostrarCambio(true)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Cambiar contrasena
            </button>
          ) : (
            <form onSubmit={cambiarContrasena} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Contrasena actual</label>
                <input
                  type="password"
                  value={formPass.contrasena_actual}
                  onChange={e => setFormPass(p => ({ ...p, contrasena_actual: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-primary-300 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Nueva contrasena</label>
                <input
                  type="password"
                  value={formPass.contrasena_nueva}
                  onChange={e => setFormPass(p => ({ ...p, contrasena_nueva: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-primary-300 outline-none"
                  required
                  minLength={6}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Confirmar contrasena</label>
                <input
                  type="password"
                  value={formPass.confirmar}
                  onChange={e => setFormPass(p => ({ ...p, confirmar: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-primary-300 outline-none"
                  required
                  minLength={6}
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={guardando}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                >
                  {guardando ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  ) : (
                    <>
                      <HiCheckCircle className="w-4 h-4" />
                      Guardar
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => { setMostrarCambio(false); setFormPass({ contrasena_actual: '', contrasena_nueva: '', confirmar: '' }); }}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
