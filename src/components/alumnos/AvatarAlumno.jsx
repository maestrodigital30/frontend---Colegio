import { getUploadUrl } from '../../utils/storage';

const SIZES = { sm: 36, md: 56, lg: 96 };

export default function AvatarAlumno({ identidad, size = 'md', fallbackUrl = null }) {
  const dim = SIZES[size] || SIZES.md;
  const avatarUrl = identidad?.avatar ? getUploadUrl(identidad.avatar.ruta_archivo) : fallbackUrl;
  const marcoUrl = identidad?.marco ? getUploadUrl(identidad.marco.ruta_archivo) : null;
  const personajeUrl = identidad?.personaje ? getUploadUrl(identidad.personaje.ruta_archivo) : null;
  const color = identidad?.color_personal || identidad?.color_publico;

  return (
    <div className="relative inline-block" style={{ width: dim, height: dim }}>
      {color && <div className="absolute inset-0 rounded-full" style={{ boxShadow: `0 0 12px 2px ${color}` }} />}
      {avatarUrl ? (
        <img src={avatarUrl} alt="" className="absolute inset-1 rounded-full object-cover" style={{ width: dim - 8, height: dim - 8 }} />
      ) : (
        <div className="absolute inset-1 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 text-xs" style={{ width: dim - 8, height: dim - 8 }}>👤</div>
      )}
      {marcoUrl && <img src={marcoUrl} alt="" className="absolute inset-0 pointer-events-none" style={{ width: dim, height: dim }} />}
      {personajeUrl && <img src={personajeUrl} alt="" className="absolute -bottom-2 -right-2" style={{ width: dim * 0.55, height: dim * 0.55 }} />}
    </div>
  );
}
