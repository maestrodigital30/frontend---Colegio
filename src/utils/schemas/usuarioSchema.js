export const camposUsuario = [
  { name: 'nombres', label: 'Nombres', type: 'text', required: true },
  { name: 'apellidos', label: 'Apellidos', type: 'text', required: true },
  { name: 'correo', label: 'Correo', type: 'email', required: true },
  { name: 'contrasena', label: 'Contraseña', type: 'password', required: false },
  { name: 'rol', label: 'Rol', type: 'select', required: true },
];

export const camposAlumno = [
  { name: 'nombres', label: 'Nombres', type: 'text', required: true },
  { name: 'apellidos', label: 'Apellidos', type: 'text', required: true },
  { name: 'dni', label: 'DNI', type: 'text', required: false },
  { name: 'fecha_nacimiento', label: 'Fecha Nacimiento', type: 'date', required: false },
  { name: 'genero', label: 'Género', type: 'select', required: false },
  { name: 'direccion', label: 'Dirección', type: 'text', required: false },
];

export const camposPadre = [
  { name: 'nombres', label: 'Nombres', type: 'text', required: true },
  { name: 'apellidos', label: 'Apellidos', type: 'text', required: true },
  { name: 'telefono', label: 'Teléfono', type: 'text', required: true },
  { name: 'correo', label: 'Correo', type: 'email', required: true },
];

export const camposCurso = [
  { name: 'nombre', label: 'Nombre', type: 'text', required: true },
  { name: 'descripcion', label: 'Descripción', type: 'text', required: false },
  { name: 'grado', label: 'Grado', type: 'text', required: false },
  { name: 'seccion', label: 'Sección', type: 'text', required: false },
];

export const camposPeriodo = [
  { name: 'nombre', label: 'Nombre', type: 'text', required: true },
  { name: 'anio', label: 'Año', type: 'number', required: false },
  { name: 'fecha_inicio', label: 'Fecha Inicio', type: 'date', required: true },
  { name: 'fecha_fin', label: 'Fecha Fin', type: 'date', required: true },
];
