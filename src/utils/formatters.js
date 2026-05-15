// Toda la app opera en la zona America/Lima (UTC-5, sin DST).
// Las fechas se muestran/derivan SIEMPRE en esta zona, sin importar
// la TZ del navegador del usuario.
export const TIMEZONE = 'America/Lima';

export const formatearFecha = (fecha) => {
  if (!fecha) return '-';
  return new Date(fecha).toLocaleDateString('es-PE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: TIMEZONE,
  });
};

export const formatearFechaHora = (fecha) => {
  if (!fecha) return '-';
  return new Date(fecha).toLocaleString('es-PE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: TIMEZONE,
  });
};

export const formatearFechaHoraSegundos = (fecha) => {
  if (!fecha) return '-';
  return new Date(fecha).toLocaleString('es-PE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: TIMEZONE,
  });
};

// Devuelve la fecha actual en la zona America/Lima como "YYYY-MM-DD".
// Independiente de la TZ del navegador del usuario.
export const fechaHoy = (date = new Date()) => {
  const partes = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const obj = Object.fromEntries(partes.map((p) => [p.type, p.value]));
  return `${obj.year}-${obj.month}-${obj.day}`;
};

// Hora actual en zona Lima como "HH:mm".
export const horaActual = (date = new Date()) => {
  return new Intl.DateTimeFormat('es-PE', {
    timeZone: TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
};

// Año actual en zona Lima (para componentes que muestran el año escolar).
export const anioActual = (date = new Date()) => {
  return Number(new Intl.DateTimeFormat('en-CA', {
    timeZone: TIMEZONE,
    year: 'numeric',
  }).format(date));
};

export const nombreCompleto = (alumno) => {
  if (!alumno) return '-';
  return `${alumno.apellidos}, ${alumno.nombres}`;
};
