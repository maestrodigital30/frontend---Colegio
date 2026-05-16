import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../features/auth/AuthContext';
import { ROLES } from '../../utils/constants';
import MotorConcurso from '../../features/concursos/MotorConcurso';

export default function JugarConcursoPage() {
  const { idConcurso } = useParams();
  const navigate = useNavigate();
  const [search] = useSearchParams();
  const { usuario } = useAuth();
  const modoPreview = search.get('preview') === '1' && usuario?.rol !== ROLES.ALUMNO;

  const onSalir = () => {
    if (usuario?.rol === ROLES.ALUMNO) navigate('/alumno/concursos');
    else if (usuario?.rol === ROLES.SUPER_ADMIN) navigate('/admin/concursos');
    else if (usuario?.rol === ROLES.DOCENTE) navigate('/docente/concursos');
    else navigate('/');
  };

  return <MotorConcurso idConcurso={parseInt(idConcurso)} onSalir={onSalir} modoPreview={modoPreview} />;
}
