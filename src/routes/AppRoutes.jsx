import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthContext';
import RutaProtegida from '../features/auth/RutaProtegida';
import { ROLES } from '../utils/constants';
import LayoutPrincipal from '../components/layout/LayoutPrincipal';
import Login from '../pages/Login';

// Trivia Publica
import TriviaAcceso from '../pages/trivia/TriviaAcceso';
import TriviaJugarPublico from '../pages/trivia/TriviaJugarPublico';
import TriviaResultado from '../pages/trivia/TriviaResultado';

// Admin
import DashboardAdmin from '../pages/admin/Dashboard';
import UsuariosPage from '../pages/admin/Usuarios';
import ConfiguracionPage from '../pages/admin/Configuracion';
import ProfesoresPage from '../pages/admin/Profesores';
import PeriodosAdminPage from '../pages/admin/Periodos';
import CursosAdminPage from '../pages/admin/Cursos';
import AlumnosAdminPage from '../pages/admin/Alumnos';
import DatosAntropometricosAdminPage from '../pages/admin/DatosAntropometricos';
import PadresAdminPage from '../pages/admin/Padres';
import AsistenciaAdminPage from '../pages/admin/Asistencia';
import ConfigAcademicaAdminPage from '../pages/admin/ConfigAcademica';
import NotasAdminPage from '../pages/admin/Notas';
import WhatsappAdminPage from '../pages/admin/Whatsapp';
import TriviaAdminPage from '../pages/admin/Trivia';
import HistorialTriviaAdminPage from '../pages/admin/HistorialTrivia';
import RankingAdminPage from '../pages/admin/Ranking';
import PodcastAdminPage from '../pages/admin/Podcast';
import BibliotecaAdminPage from '../pages/admin/Biblioteca';

// Docente
import DashboardDocente from '../pages/docente/Dashboard';
import PeriodosDocentePage from '../pages/docente/Periodos';
import CursosDocentePage from '../pages/docente/Cursos';
import AlumnosDocentePage from '../pages/docente/Alumnos';
import PadresDocentePage from '../pages/docente/Padres';
import CarnetsPage from '../pages/docente/Carnets';
import AsistenciaDocentePage from '../pages/docente/Asistencia';
import ConfigAcademicaDocentePage from '../pages/docente/ConfigAcademica';
import NotasDocentePage from '../pages/docente/Notas';
import WhatsappDocentePage from '../pages/docente/Whatsapp';
import TriviaConfigPage from '../pages/docente/TriviaConfig';
import TriviaJugarPage from '../pages/docente/TriviaJugar';
import HistorialTriviaDocentePage from '../pages/docente/HistorialTrivia';
import RankingDocentePage from '../pages/docente/Ranking';
import PodcastDocentePage from '../pages/docente/Podcast';
import BibliotecaDocentePage from '../pages/docente/Biblioteca';

// Alumno
import DashboardAlumno from '../pages/alumno/Dashboard';
import CursosAlumnoPage from '../pages/alumno/Cursos';
import NotasAlumnoPage from '../pages/alumno/Notas';
import TriviasAlumnoPage from '../pages/alumno/Trivias';
import AsistenciaAlumnoPage from '../pages/alumno/Asistencia';
import CarnetAlumnoPage from '../pages/alumno/Carnet';
import PerfilAlumnoPage from '../pages/alumno/Perfil';
import BibliotecaAlumnoPage from '../pages/alumno/Biblioteca';

export default function AppRoutes() {
  const { usuario } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      {/* Trivia Publica — standalone, sin layout */}
      <Route path="/trivia" element={<TriviaAcceso />} />
      <Route path="/trivia/jugar" element={<TriviaJugarPublico />} />
      <Route path="/trivia/resultado" element={<TriviaResultado />} />

      {/* Admin */}
      <Route path="/admin" element={
        <RutaProtegida rolesPermitidos={[ROLES.SUPER_ADMIN]}>
          <LayoutPrincipal />
        </RutaProtegida>
      }>
        <Route path="dashboard" element={<DashboardAdmin />} />
        <Route path="usuarios" element={<UsuariosPage />} />
        <Route path="configuracion" element={<ConfiguracionPage />} />
        <Route path="profesores" element={<ProfesoresPage />} />
        <Route path="periodos" element={<PeriodosAdminPage />} />
        <Route path="cursos" element={<CursosAdminPage />} />
        <Route path="alumnos" element={<AlumnosAdminPage />} />
        <Route path="datos-antropometricos" element={<DatosAntropometricosAdminPage />} />
        <Route path="padres" element={<PadresAdminPage />} />
        <Route path="carnets" element={<CarnetsPage />} />
        <Route path="asistencia" element={<AsistenciaAdminPage />} />
        <Route path="config-academica" element={<ConfigAcademicaAdminPage />} />
        <Route path="notas" element={<NotasAdminPage />} />
        <Route path="whatsapp" element={<WhatsappAdminPage />} />
        <Route path="trivia" element={<TriviaAdminPage />} />
        <Route path="historial-trivia" element={<HistorialTriviaAdminPage />} />
        <Route path="ranking" element={<RankingAdminPage />} />
        <Route path="podcast" element={<PodcastAdminPage />} />
        <Route path="biblioteca" element={<BibliotecaAdminPage />} />
      </Route>

      {/* Docente */}
      <Route path="/docente" element={
        <RutaProtegida rolesPermitidos={[ROLES.DOCENTE]}>
          <LayoutPrincipal />
        </RutaProtegida>
      }>
        <Route path="dashboard" element={<DashboardDocente />} />
        <Route path="periodos" element={<PeriodosDocentePage />} />
        <Route path="cursos" element={<CursosDocentePage />} />
        <Route path="alumnos" element={<AlumnosDocentePage />} />
        <Route path="padres" element={<PadresDocentePage />} />
        <Route path="carnets" element={<CarnetsPage />} />
        <Route path="asistencia" element={<AsistenciaDocentePage />} />
        <Route path="config-academica" element={<ConfigAcademicaDocentePage />} />
        <Route path="notas" element={<NotasDocentePage />} />
        <Route path="whatsapp" element={<WhatsappDocentePage />} />
        <Route path="trivia-config" element={<TriviaConfigPage />} />
        <Route path="trivia-jugar" element={<TriviaJugarPage />} />
        <Route path="historial-trivia" element={<HistorialTriviaDocentePage />} />
        <Route path="ranking" element={<RankingDocentePage />} />
        <Route path="podcast" element={<PodcastDocentePage />} />
        <Route path="biblioteca" element={<BibliotecaDocentePage />} />
      </Route>

      {/* Alumno */}
      <Route path="/alumno" element={
        <RutaProtegida rolesPermitidos={[ROLES.ALUMNO]}>
          <LayoutPrincipal />
        </RutaProtegida>
      }>
        <Route path="dashboard" element={<DashboardAlumno />} />
        <Route path="cursos" element={<CursosAlumnoPage />} />
        <Route path="notas" element={<NotasAlumnoPage />} />
        <Route path="trivias" element={<TriviasAlumnoPage />} />
        <Route path="asistencia" element={<AsistenciaAlumnoPage />} />
        <Route path="carnet" element={<CarnetAlumnoPage />} />
        <Route path="perfil" element={<PerfilAlumnoPage />} />
        <Route path="biblioteca" element={<BibliotecaAlumnoPage />} />
      </Route>

      {/* Redirect root */}
      <Route path="/" element={
        usuario
          ? <Navigate to={
              usuario.rol === ROLES.SUPER_ADMIN ? '/admin/dashboard'
              : usuario.rol === ROLES.ALUMNO ? '/alumno/dashboard'
              : '/docente/dashboard'
            } replace />
          : <Navigate to="/login" replace />
      } />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
