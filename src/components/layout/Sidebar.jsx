import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../features/auth/AuthContext';
import { ROLES } from '../../utils/constants';
import { getUploadUrl } from '../../utils/storage';
import {
  HiHome, HiUsers, HiAcademicCap, HiCalendar, HiBookOpen, HiUserGroup,
  HiClipboardCheck, HiCog, HiDocumentText, HiChat, HiPuzzle, HiChartBar,
  HiCreditCard, HiQrcode, HiClock, HiStar, HiMicrophone, HiUser, HiCollection,
  HiClipboardList, HiSparkles, HiBadgeCheck, HiLightningBolt,
  HiVolumeUp, HiMusicNote, HiUserCircle, HiColorSwatch
} from 'react-icons/hi';

const menuAdmin = [
  { to: '/admin/dashboard', label: 'Dashboard', icono: HiHome },
  { to: '/admin/usuarios', label: 'Usuarios', icono: HiUsers },
  { to: '/admin/configuracion', label: 'Configuracion', icono: HiCog },
  { to: '/admin/profesores', label: 'Profesores', icono: HiAcademicCap },
  { to: '/admin/periodos', label: 'Periodos', icono: HiCalendar },
  { to: '/admin/cursos', label: 'Cursos', icono: HiBookOpen },
  { to: '/admin/alumnos', label: 'Alumnos', icono: HiUserGroup },
  { to: '/admin/datos-antropometricos', label: 'Datos Antropometricos', icono: HiClipboardList },
  { to: '/admin/padres', label: 'Padres', icono: HiUsers },
  { to: '/admin/carnets', label: 'Carnets QR', icono: HiQrcode },
  { to: '/admin/asistencia', label: 'Asistencia', icono: HiClipboardCheck },
  { to: '/admin/config-academica', label: 'Config. Academica', icono: HiDocumentText },
  { to: '/admin/notas', label: 'Notas', icono: HiCreditCard },
  { to: '/admin/whatsapp', label: 'WhatsApp', icono: HiChat },
  { to: '/admin/trivia', label: 'Trivia', icono: HiPuzzle },
  { to: '/admin/historial-trivia', label: 'Historial Trivia', icono: HiClock },
  { to: '/admin/ranking', label: 'Ranking', icono: HiStar },
  { to: '/admin/sistema-sonidos', label: 'Sonidos del Sistema', icono: HiVolumeUp },
  { to: '/admin/musica', label: 'Música de Trivia', icono: HiMusicNote },
  { to: '/admin/avatares', label: 'Avatares y Marcos', icono: HiUserCircle },
  { to: '/admin/temas-visuales', label: 'Temas Visuales', icono: HiColorSwatch },
  { to: '/admin/podcast', label: 'Podcast', icono: HiMicrophone },
  { to: '/admin/biblioteca', label: 'Biblioteca', icono: HiCollection },
  { to: '/admin/concursos', label: 'Concursos', icono: HiSparkles },
  { to: '/admin/concursos-historial', label: 'Historial Concursos', icono: HiLightningBolt },
  { to: '/admin/concursos-ranking', label: 'Ranking Concursos', icono: HiBadgeCheck },
];

const menuDocente = [
  { to: '/docente/dashboard', label: 'Dashboard', icono: HiHome },
  { to: '/docente/periodos', label: 'Periodos', icono: HiCalendar },
  { to: '/docente/cursos', label: 'Mis Cursos', icono: HiBookOpen },
  { to: '/docente/alumnos', label: 'Mis Alumnos', icono: HiUserGroup },
  { to: '/docente/padres', label: 'Padres', icono: HiUsers },
  { to: '/docente/carnets', label: 'Carnets QR', icono: HiQrcode },
  { to: '/docente/asistencia', label: 'Asistencia', icono: HiClipboardCheck },
  { to: '/docente/config-academica', label: 'Config. Academica', icono: HiDocumentText },
  { to: '/docente/notas', label: 'Notas', icono: HiCreditCard },
  { to: '/docente/whatsapp', label: 'WhatsApp', icono: HiChat },
  { to: '/docente/trivia-config', label: 'Config. Trivia', icono: HiPuzzle },
  { to: '/docente/trivia-jugar', label: 'Jugar Trivia', icono: HiChartBar },
  { to: '/docente/historial-trivia', label: 'Historial', icono: HiClock },
  { to: '/docente/ranking', label: 'Ranking', icono: HiStar },
  { to: '/docente/podcast', label: 'Podcast', icono: HiMicrophone },
  { to: '/docente/biblioteca', label: 'Biblioteca', icono: HiCollection },
  { to: '/docente/concursos', label: 'Concursos', icono: HiSparkles },
];

const menuAlumno = [
  { to: '/alumno/dashboard', label: 'Mi Dashboard', icono: HiHome },
  { to: '/alumno/cursos', label: 'Mis Cursos', icono: HiBookOpen },
  { to: '/alumno/notas', label: 'Mis Notas', icono: HiCreditCard },
  { to: '/alumno/trivias', label: 'Mis Trivias', icono: HiPuzzle },
  { to: '/alumno/asistencia', label: 'Mi Asistencia', icono: HiClipboardCheck },
  { to: '/alumno/carnet', label: 'Mi Carnet', icono: HiQrcode },
  { to: '/alumno/perfil', label: 'Mi Perfil', icono: HiUser },
  { to: '/alumno/identidad', label: 'Identidad Visual', icono: HiUserCircle },
  { to: '/alumno/biblioteca', label: 'Biblioteca', icono: HiCollection },
  { to: '/alumno/concursos', label: 'Concursos', icono: HiSparkles },
];

const getMenuByRol = (rol) => {
  switch (rol) {
    case ROLES.SUPER_ADMIN: return menuAdmin;
    case ROLES.DOCENTE: return menuDocente;
    case ROLES.ALUMNO: return menuAlumno;
    default: return [];
  }
};

const STORAGE_KEY_LOGOS_FALLIDOS = 'logos_fallidos';

const leerLogosFallidos = () => {
  try { return new Set(JSON.parse(sessionStorage.getItem(STORAGE_KEY_LOGOS_FALLIDOS) || '[]')); }
  catch { return new Set(); }
};

const marcarLogoFallido = (url) => {
  const s = leerLogosFallidos();
  s.add(url);
  try { sessionStorage.setItem(STORAGE_KEY_LOGOS_FALLIDOS, JSON.stringify([...s])); } catch { /* ignore */ }
};

export default function Sidebar({ abierto, cerrar }) {
  const { usuario, configSistema } = useAuth();
  const menu = getMenuByRol(usuario?.rol);
  const logoUrl = configSistema?.logo || null;
  const [logoFallido, setLogoFallido] = useState(() => !!logoUrl && leerLogosFallidos().has(logoUrl));
  const mostrarLogo = !!logoUrl && !logoFallido;

  return (
    <>
      {/* Overlay mobile */}
      {abierto && (
        <div
          className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 lg:hidden animate-fade-in"
          onClick={cerrar}
        />
      )}

      <aside className={`
        fixed top-0 left-0 z-50 h-full w-72
        backdrop-blur-2xl
        border-r border-white/20
        shadow-glass-lg
        transform transition-transform duration-300 ease-out
        lg:translate-x-0
        ${abierto ? 'translate-x-0' : '-translate-x-full'}
      `}
      style={{ backgroundColor: 'rgb(var(--color-primary-500))' }}>
        {/* Brand header */}
        <div className="px-6 py-5 border-b border-white/20">
          <div className="flex items-center gap-3">
            {mostrarLogo ? (
              <img
                src={getUploadUrl(logoUrl)}
                alt="Logo"
                className="w-10 h-10 rounded-xl object-contain"
                onError={() => { marcarLogoFallido(logoUrl); setLogoFallido(true); }}
              />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <span className="text-white font-display font-bold text-sm">CJ</span>
              </div>
            )}
            <div>
              <h2 className="font-display font-bold text-white text-sm tracking-wide">{configSistema?.nombre || 'Colegio Jose'}</h2>
              <p className="text-[10px] text-white/70 font-bold uppercase tracking-widest">Sistema Escolar</p>
            </div>
          </div>
        </div>

        {/* User info */}
        <div className="px-6 py-3 border-b border-white/20">
          <p className="text-xs text-white truncate font-bold">{usuario?.nombre_completo || usuario?.nombres}</p>
          <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-display font-bold uppercase tracking-wider rounded-md bg-white/20 text-white border border-white/30">
            {usuario?.rol}
          </span>
        </div>

        {/* Navigation */}
        <nav className="py-3 overflow-y-auto h-[calc(100vh-150px)] px-3">
          <div className="space-y-0.5">
            {menu.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={cerrar}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 group ${
                    isActive
                      ? 'bg-white/25 text-white border border-white/30 shadow-sm'
                      : 'text-white/80 hover:text-white hover:bg-white/15 border border-transparent'
                  }`
                }
              >
                <item.icono className="w-[18px] h-[18px] flex-shrink-0 transition-transform duration-200 group-hover:scale-110" />
                <span className="font-medium truncate">{item.label}</span>
              </NavLink>
            ))}
          </div>
        </nav>
      </aside>
    </>
  );
}
