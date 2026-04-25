export const formatearFecha = (fecha) => {
  if (!fecha) return '-';
  return new Date(fecha).toLocaleDateString('es-PE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: 'America/Lima',
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
    timeZone: 'America/Lima',
  });
};

export const fechaHoy = () => {
  const ahora = new Date();
  const offset = ahora.getTimezoneOffset();
  const local = new Date(ahora.getTime() - offset * 60000);
  return local.toISOString().split('T')[0];
};

export const nombreCompleto = (alumno) => {
  if (!alumno) return '-';
  return `${alumno.apellidos}, ${alumno.nombres}`;
};
