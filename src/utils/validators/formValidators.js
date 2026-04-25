export const validarEmail = (correo) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(correo);
};

export const validarCamposRequeridos = (campos, form) => {
  const errores = {};
  campos.forEach(campo => {
    if (campo.required && !form[campo.name] && form[campo.name] !== 0) {
      errores[campo.name] = `${campo.label} es obligatorio`;
    }
  });
  return errores;
};

export const validarTelefono = (telefono) => {
  if (!telefono) return true;
  return /^\d{9,15}$/.test(telefono.replace(/\s/g, ''));
};
