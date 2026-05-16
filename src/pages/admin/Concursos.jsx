import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiPencil, HiTrash, HiPlus, HiEye, HiPlay, HiLockClosed, HiLockOpen, HiPuzzle } from 'react-icons/hi';
import toast from 'react-hot-toast';
import Tabla from '../../components/common/Tabla';
import Boton from '../../components/common/Boton';
import { listarConcursos, eliminarConcurso, cambiarPublicacion, crearConcurso } from '../../services/concursoService';
import { obtenerTemaVisual } from '../../features/concursos/temaVisualUtils';
import { getUploadUrl } from '../../utils/storage';

export default function ConcursosAdminPage() {
  const navigate = useNavigate();
  const [datos, setDatos] = useState([]);
  const [cargando, setCargando] = useState(true);

  const cargar = async () => {
    setCargando(true);
    try {
      setDatos(await listarConcursos());
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al cargar concursos');
    } finally { setCargando(false); }
  };

  useEffect(() => { cargar(); }, []);

  const handleNuevo = async () => {
    try {
      const nuevo = await crearConcurso({ titulo: 'Concurso sin titulo', tema_visual: 'clasico' });
      toast.success('Concurso creado, completa la configuracion');
      navigate(`/admin/concursos/${nuevo.id}`);
    } catch (err) { toast.error(err.response?.data?.error || 'Error al crear'); }
  };

  const handleEliminar = async (c) => {
    if (!confirm(`¿Eliminar el concurso "${c.titulo}"?\nSe inactivara y los intentos previos se conservaran para historial/ranking.`)) return;
    try {
      await eliminarConcurso(c.id);
      toast.success('Concurso eliminado');
      cargar();
    } catch (err) { toast.error(err.response?.data?.error || 'Error al eliminar'); }
  };

  const handlePublicar = async (c) => {
    try {
      await cambiarPublicacion(c.id, !c.publicado);
      toast.success(c.publicado ? 'Concurso despublicado' : 'Concurso publicado');
      cargar();
    } catch (err) { toast.error(err.response?.data?.error || 'Error al cambiar estado'); }
  };

  const columnas = [
    {
      key: 'titulo', label: 'Concurso',
      render: (c) => (
        <div className="flex items-center gap-3 min-w-[200px]">
          <div className="w-12 h-12 rounded-xl flex-shrink-0 overflow-hidden flex items-center justify-center"
               style={{ background: `linear-gradient(135deg, ${obtenerTemaVisual(c.tema_visual).primario}, ${obtenerTemaVisual(c.tema_visual).secundario})` }}>
            {c.multimedia_url
              ? (c.multimedia_tipo === 'video'
                  ? <video src={getUploadUrl(c.multimedia_url)} muted className="w-full h-full object-cover" />
                  : <img src={getUploadUrl(c.multimedia_url)} className="w-full h-full object-cover" alt="" />)
              : <HiPuzzle className="w-5 h-5 text-white/80" />}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-slate-800 truncate">{c.titulo}</p>
            {c.descripcion && <p className="text-xs text-slate-500 truncate">{c.descripcion}</p>}
          </div>
        </div>
      ),
    },
    { key: 'curso', label: 'Curso', render: (c) => c.tbl_cursos?.nombre || <span className="text-slate-400 italic">Global</span> },
    { key: 'area', label: 'Area', render: (c) => c.area || '-' },
    { key: 'nivel', label: 'Nivel', render: (c) => c.nivel || '-' },
    { key: 'preguntas', label: 'Preguntas', render: (c) => c._count?.tbl_concurso_preguntas ?? 0 },
    {
      key: 'publicado', label: 'Estado',
      render: (c) => c.publicado
        ? <span className="px-2 py-0.5 rounded-full text-[11px] bg-emerald-100 text-emerald-700 font-bold uppercase">Publicado</span>
        : <span className="px-2 py-0.5 rounded-full text-[11px] bg-slate-100 text-slate-500 font-bold uppercase">Borrador</span>,
    },
  ];

  const acciones = (c) => (
    <>
      <button title="Previsualizar" onClick={() => navigate(`/admin/concursos/${c.id}/jugar?preview=1`)} className="p-1.5 rounded-lg text-slate-500 hover:text-primary-600 hover:bg-primary-50">
        <HiPlay className="w-4 h-4" />
      </button>
      <button title="Editar" onClick={() => navigate(`/admin/concursos/${c.id}`)} className="p-1.5 rounded-lg text-slate-500 hover:text-primary-600 hover:bg-primary-50">
        <HiPencil className="w-4 h-4" />
      </button>
      <button title={c.publicado ? 'Despublicar' : 'Publicar'} onClick={() => handlePublicar(c)} className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50">
        {c.publicado ? <HiLockClosed className="w-4 h-4" /> : <HiLockOpen className="w-4 h-4" />}
      </button>
      <button title="Eliminar" onClick={() => handleEliminar(c)} className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50">
        <HiTrash className="w-4 h-4" />
      </button>
    </>
  );

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-800">Concursos</h1>
          <p className="text-sm text-slate-500">Configura concursos tipo quiz show con multimedia, comodines y ronda bonus.</p>
        </div>
        <Boton onClick={handleNuevo}><HiPlus className="inline w-4 h-4 mr-1" /> Nuevo concurso</Boton>
      </div>

      {cargando
        ? <div className="py-20 text-center text-slate-400">Cargando...</div>
        : <Tabla columnas={columnas} datos={datos} acciones={acciones} vacio="Aun no has creado concursos." />}
    </div>
  );
}
