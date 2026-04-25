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

export const ES_DESARROLLO = import.meta.env.DEV;

export const API_URL = import.meta.env.VITE_API_URL;
export const API_BASE_URL = API_URL?.replace('/api', '') || '';
