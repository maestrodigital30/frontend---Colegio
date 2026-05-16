import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { listarMusica } from '../../services/musicaCatalogoService';
import { listarImagenes, subirImagen, eliminarImagen } from '../../services/triviaImagenService';
import { getUploadUrl } from '../../utils/storage';

export default function EditorMultimediaTrivia({ idPartida, idMusicaSeleccionada, onCambiarMusica }) {
  const [musicas, setMusicas] = useState([]);
  const [imagenes, setImagenes] = useState([]);
  const [subiendo, setSubiendo] = useState(false);

  useEffect(() => { listarMusica().then(setMusicas); }, []);
  useEffect(() => {
    if (idPartida) listarImagenes(idPartida).then(setImagenes);
    else setImagenes([]);
  }, [idPartida]);

  const onSubirImagen = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!idPartida) { toast.error('Guarda primero la trivia antes de subir imágenes'); return; }
    setSubiendo(true);
    try {
      for (const f of files) {
        await subirImagen(idPartida, f, imagenes.length);
      }
      setImagenes(await listarImagenes(idPartida));
      toast.success('Imágenes subidas');
    } catch (e) { toast.error(e.response?.data?.error || 'Error al subir'); }
    finally { setSubiendo(false); e.target.value = ''; }
  };

  const onEliminarImagen = async (id) => {
    if (!confirm('¿Eliminar esta imagen?')) return;
    try {
      await eliminarImagen(id);
      setImagenes(await listarImagenes(idPartida));
    } catch { toast.error('Error al eliminar'); }
  };

  const agrupadas = musicas.reduce((acc, m) => {
    (acc[m.estilo] = acc[m.estilo] || []).push(m);
    return acc;
  }, {});

  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 p-4">
      <div className="font-semibold">Multimedia</div>
      <div>
        <label className="block text-sm font-medium mb-1">Música de fondo</label>
        <select
          value={idMusicaSeleccionada || ''}
          onChange={e => onCambiarMusica(e.target.value ? parseInt(e.target.value) : null)}
          className="w-full rounded-xl border border-slate-200 px-3 py-2"
        >
          <option value="">Sin música</option>
          {Object.entries(agrupadas).map(([estilo, lista]) => (
            <optgroup key={estilo} label={estilo}>
              {lista.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
            </optgroup>
          ))}
        </select>
        {idMusicaSeleccionada && (() => {
          const m = musicas.find(x => x.id === idMusicaSeleccionada);
          return m ? <audio key={m.id} src={getUploadUrl(m.ruta_archivo)} controls className="mt-2 w-full" /> : null;
        })()}
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Imágenes de la trivia</label>
        <input type="file" accept="image/*" multiple onChange={onSubirImagen} disabled={!idPartida || subiendo} />
        {!idPartida && <p className="text-xs text-slate-400 mt-1">Guarda la trivia primero para subir imágenes.</p>}
        {subiendo && (
          <div className="text-sm text-slate-400 flex items-center gap-2 mt-2">
            <span className="animate-pulse">⏳</span> Subiendo imágenes...
          </div>
        )}
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mt-3">
          {imagenes.map(img => (
            <div key={img.id} className="relative group">
              <img
                src={getUploadUrl(img.ruta_archivo)}
                className="w-full h-24 object-cover rounded-xl"
                alt=""
                onError={(e) => { e.currentTarget.style.display = 'none'; if (e.currentTarget.nextSibling) e.currentTarget.nextSibling.style.display = 'flex'; }}
              />
              <div className="hidden w-full h-24 rounded-xl bg-slate-200 items-center justify-center text-xs text-slate-500">Error de carga</div>
              <button onClick={() => onEliminarImagen(img.id)} className="absolute top-1 right-1 bg-rose-600/90 text-white text-xs px-1.5 py-0.5 rounded">×</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
