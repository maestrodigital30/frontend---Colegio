import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { listarAvatares } from '../../services/avatarCatalogoService';
import { listarTemas } from '../../services/temaVisualService';
import { useIdentidadVisual } from '../../contexts/IdentidadVisualContext';
import { getUploadUrl } from '../../utils/storage';

function Bloque({ titulo, items, campo, idActual: id, onSeleccionar }) {
  return (
    <section className="space-y-2">
      <h2 className="text-lg font-display">{titulo}</h2>
      <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-7 gap-3">
        {items.map(it => (
          <button key={it.id} onClick={() => onSeleccionar(campo, it.id)}
            className={`relative rounded-2xl p-2 border-2 transition ${id === it.id ? 'border-primary-500 ring-2 ring-primary-300' : 'border-transparent hover:border-slate-300'}`}>
            <img src={getUploadUrl(it.ruta_archivo)} alt={it.nombre} className="w-full h-20 object-contain" />
            <div className="text-xs text-center mt-1 truncate">{it.nombre}</div>
          </button>
        ))}
      </div>
    </section>
  );
}

export default function IdentidadVisual() {
  const { identidad, guardar } = useIdentidadVisual();
  const [avatares, setAvatares] = useState([]);
  const [personajes, setPersonajes] = useState([]);
  const [marcos, setMarcos] = useState([]);
  const [temas, setTemas] = useState([]);

  useEffect(() => {
    listarAvatares('avatar').then(setAvatares);
    listarAvatares('personaje').then(setPersonajes);
    listarAvatares('marco').then(setMarcos);
    listarTemas().then(setTemas);
  }, []);

  if (!identidad) return <div className="p-6">Cargando...</div>;

  const sel = (campo, valor) => guardar({ [campo]: valor }).then(() => toast.success('Guardado')).catch(() => toast.error('Error al guardar'));

  const idActual = (rel) => identidad?.[rel]?.id ?? null;
  const idTemaActual = identidad?.tbl_temas_visuales?.id ?? null;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-display">Mi identidad visual</h1>
      <Bloque titulo="Avatar" items={avatares} campo="id_avatar" idActual={idActual('avatar')} onSeleccionar={sel} />
      <Bloque titulo="Personaje" items={personajes} campo="id_personaje" idActual={idActual('personaje')} onSeleccionar={sel} />
      <Bloque titulo="Marco" items={marcos} campo="id_marco" idActual={idActual('marco')} onSeleccionar={sel} />

      <section className="space-y-2">
        <h2 className="text-lg font-display">Color personal</h2>
        <input
          type="color"
          value={identidad.color_personal || '#1976D2'}
          onChange={e => sel('color_personal', e.target.value)}
        />
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-display">Tema visual</h2>
        <div className="flex flex-wrap gap-2">
          {temas.map(t => (
            <button key={t.id} onClick={() => sel('id_tema_visual', t.id)}
              className={`px-4 py-2 rounded-xl border-2 ${idTemaActual === t.id ? 'border-primary-500' : 'border-slate-200'}`}>
              {t.nombre}
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-display">Audio</h2>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={identidad.musica_habilitada !== false} onChange={e => sel('musica_habilitada', e.target.checked)} />
          Música de fondo activa
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={identidad.sonidos_habilitados !== false} onChange={e => sel('sonidos_habilitados', e.target.checked)} />
          Efectos de sonido activos
        </label>
      </section>
    </div>
  );
}
