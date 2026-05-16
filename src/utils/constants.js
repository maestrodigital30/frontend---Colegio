export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  DOCENTE: 'DOCENTE',
  ALUMNO: 'ALUMNO',
};

export const ESTADOS_ASISTENCIA = {
  PRESENTE: 'presente',
  AUSENTE: 'ausente',
  TARDANZA: 'tardanza',
};

export const TIPOS_CALIFICACION = {
  NUMERICO: 'numerico',
  LETRAS: 'letras',
};

export const MODALIDADES_TRIVIA = {
  INDIVIDUAL: 'individual',
  PAREJAS: 'parejas',
  GRUPOS: 'grupos',
};

export const ESTADOS_PARTIDA = {
  PREPARADA: 'preparada',
  EN_PROGRESO: 'en_progreso',
  FINALIZADA: 'finalizada',
  CANCELADA: 'cancelada',
};

export const PUNTAJES_TRIVIA = {
  CORRECTO: 1.2,
  INCORRECTO: -0.4,
};

export const MODALIDADES_ACCESO_TRIVIA = {
  EN_VIVO: 'en_vivo',
  CON_CODIGO: 'con_codigo',
};

export const ESTADOS_SESION_TRIVIA = {
  EN_PROGRESO: 'en_progreso',
  FINALIZADA: 'finalizada',
  ABANDONADA: 'abandonada',
};

export const MODOS_REGISTRO_ASISTENCIA = {
  MANUAL: 'manual',
  QR: 'qr',
};

export const TIPOS_REPORTE_WHATSAPP = {
  ASISTENCIA_DIA: 'asistencia_dia',
  REPORTE_GENERAL: 'reporte_general',
};

export const MODOS_NOTA_FINAL = {
  CALCULADO: 'calculado',
  MANUAL: 'manual',
};

export const TIPOS_VALOR_ANTROPOMETRICO = {
  NUMERICO: 'numerico',
  TEXTO: 'texto',
};

export const CONCURSOS = {
  MIN_OPCIONES: 2,
  MAX_OPCIONES: 6,
  ORDEN_FIJO: 'fijo',
  ORDEN_ALEATORIO: 'aleatorio',
  TEMAS_VISUALES: [
    { value: 'clasico', label: 'Clasico', acento: '#facc15', primario: '#0f172a', secundario: '#7e22ce' },
    { value: 'neon',    label: 'Neon',    acento: '#22d3ee', primario: '#0a0a0f', secundario: '#ec4899' },
    { value: 'kids',    label: 'Kids',    acento: '#f97316', primario: '#0ea5e9', secundario: '#10b981' },
    { value: 'retro',   label: 'Retro',   acento: '#fbbf24', primario: '#7c2d12', secundario: '#ea580c' },
  ],
  ESTADOS_INTENTO: {
    EN_PROGRESO: 'en_progreso',
    FINALIZADO: 'finalizado',
    ABANDONADO: 'abandonado',
  },
  MULTIMEDIA_TIPOS: ['imagen', 'video'],
  MULTIMEDIA_MAX_BYTES: 50 * 1024 * 1024,
  MULTIMEDIA_EXT_IMAGEN: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
  MULTIMEDIA_EXT_VIDEO: ['.mp4', '.webm', '.ogg', '.mov'],
  COMODINES: {
    CINCUENTA: '50_50',
    TIEMPO_EXTRA: 'tiempo_extra',
    DOBLE_PUNTAJE: 'doble_puntaje',
  },
};

export const ES_DESARROLLO = import.meta.env.DEV;

export const API_URL = import.meta.env.VITE_API_URL;
export const API_BASE_URL = API_URL?.replace('/api', '') || '';
