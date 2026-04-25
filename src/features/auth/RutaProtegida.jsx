import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { ROLES } from '../../utils/constants';

export default function RutaProtegida({ children, rolesPermitidos }) {
  const { usuario, cargando } = useAuth();

  if (cargando) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!usuario) return <Navigate to="/login" replace />;

  if (rolesPermitidos && !rolesPermitidos.includes(usuario.rol)) {
    const rutasPorRol = {
      [ROLES.SUPER_ADMIN]: '/admin/dashboard',
      [ROLES.DOCENTE]: '/docente/dashboard',
      [ROLES.ALUMNO]: '/alumno/dashboard',
    };
    return <Navigate to={rutasPorRol[usuario.rol] || '/login'} replace />;
  }

  return children;
}
