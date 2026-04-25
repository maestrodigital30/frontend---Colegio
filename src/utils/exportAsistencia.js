import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ESTADOS_ASISTENCIA } from './constants';
import { formatearFecha } from './formatters';

const CODIGO_ESTADO = {
  [ESTADOS_ASISTENCIA.PRESENTE]: 'P',
  [ESTADOS_ASISTENCIA.AUSENTE]: 'A',
  [ESTADOS_ASISTENCIA.TARDANZA]: 'T',
};

const formatearFechaCorta = (fecha) =>
  new Date(fecha).toLocaleDateString('es-PE', {
    day: '2-digit',
    month: '2-digit',
    timeZone: 'America/Lima',
  });

const slug = (texto = '') =>
  texto
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toLowerCase();

const construirMatriz = (historial) => {
  const sesionesOrdenadas = [...historial].sort(
    (a, b) => new Date(a.fecha_asistencia) - new Date(b.fecha_asistencia)
  );

  const fechas = sesionesOrdenadas.map((s) => s.fecha_asistencia);

  const alumnosMap = new Map();
  sesionesOrdenadas.forEach((s) => {
    (s.tbl_registros_asistencia || []).forEach((r) => {
      if (!r.tbl_alumnos) return;
      if (!alumnosMap.has(r.id_alumno)) {
        alumnosMap.set(r.id_alumno, {
          apellidos: r.tbl_alumnos.apellidos || '',
          nombres: r.tbl_alumnos.nombres || '',
          registros: {},
        });
      }
      alumnosMap.get(r.id_alumno).registros[s.fecha_asistencia] = r.estado_asistencia;
    });
  });

  const alumnos = [...alumnosMap.values()].sort((a, b) => {
    const ap = a.apellidos.localeCompare(b.apellidos, 'es');
    return ap !== 0 ? ap : a.nombres.localeCompare(b.nombres, 'es');
  });

  const filas = alumnos.map((a) => {
    let presentes = 0;
    let ausentes = 0;
    let tardanzas = 0;
    const celdas = fechas.map((f) => {
      const estado = a.registros[f];
      if (estado === ESTADOS_ASISTENCIA.PRESENTE) presentes++;
      else if (estado === ESTADOS_ASISTENCIA.AUSENTE) ausentes++;
      else if (estado === ESTADOS_ASISTENCIA.TARDANZA) tardanzas++;
      return CODIGO_ESTADO[estado] || '';
    });
    return {
      alumno: `${a.apellidos}, ${a.nombres}`,
      celdas,
      presentes,
      ausentes,
      tardanzas,
    };
  });

  return { fechas, filas };
};

const construirNombreArchivo = (meta, extension) => {
  const partes = [
    'asistencia',
    slug(meta.cursoNombre),
    meta.alumnoNombre ? slug(meta.alumnoNombre) : null,
    meta.rango?.from ? meta.rango.from.toISOString().split('T')[0] : 'todo',
    meta.rango?.to ? meta.rango.to.toISOString().split('T')[0] : '',
  ].filter(Boolean);
  return `${partes.join('_')}.${extension}`;
};

const etiquetaRango = (rango) => {
  if (!rango?.from || !rango?.to) return 'Completo';
  return `del ${formatearFecha(rango.from)} al ${formatearFecha(rango.to)}`;
};

export const exportarExcel = (historial, meta) => {
  const { fechas, filas } = construirMatriz(historial);

  const encabezadoInfo = [
    ['Reporte de Asistencia'],
    [`Curso: ${meta.cursoNombre}`],
    ...(meta.alumnoNombre ? [[`Alumno: ${meta.alumnoNombre}`]] : []),
    [`Rango: ${etiquetaRango(meta.rango)}`],
    [`Emitido: ${formatearFecha(new Date())}`],
    [],
  ];

  const encabezadoTabla = [
    'Alumno',
    ...fechas.map((f) => formatearFechaCorta(f)),
    'Presentes',
    'Ausentes',
    'Tardanzas',
  ];

  const filasTabla = filas.map((f) => [
    f.alumno,
    ...f.celdas,
    f.presentes,
    f.ausentes,
    f.tardanzas,
  ]);

  const aoa = [...encabezadoInfo, encabezadoTabla, ...filasTabla];
  const hoja = XLSX.utils.aoa_to_sheet(aoa);

  const anchoAlumno = Math.max(20, ...filas.map((f) => f.alumno.length + 2));
  hoja['!cols'] = [
    { wch: anchoAlumno },
    ...fechas.map(() => ({ wch: 8 })),
    { wch: 11 },
    { wch: 11 },
    { wch: 11 },
  ];

  const libro = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(libro, hoja, 'Asistencia');
  XLSX.writeFile(libro, construirNombreArchivo(meta, 'xlsx'));
};

export const exportarPDF = (historial, meta) => {
  const { fechas, filas } = construirMatriz(historial);

  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Reporte de Asistencia', 40, 40);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  let y = 60;
  doc.text(`Curso: ${meta.cursoNombre}`, 40, y);
  if (meta.alumnoNombre) {
    y += 15;
    doc.text(`Alumno: ${meta.alumnoNombre}`, 40, y);
  }
  y += 15;
  doc.text(`Rango: ${etiquetaRango(meta.rango)}`, 40, y);
  y += 15;
  doc.text(`Emitido: ${formatearFecha(new Date())}`, 40, y);
  y += 15;
  doc.text('Leyenda: P = Presente, A = Ausente, T = Tardanza', 40, y);
  const startY = y + 15;

  const head = [
    [
      'Alumno',
      ...fechas.map((f) => formatearFechaCorta(f)),
      'P',
      'A',
      'T',
    ],
  ];

  const body = filas.map((f) => [
    f.alumno,
    ...f.celdas,
    f.presentes,
    f.ausentes,
    f.tardanzas,
  ]);

  const coloresEstado = {
    P: [209, 250, 229],
    A: [254, 205, 211],
    T: [253, 230, 138],
  };

  autoTable(doc, {
    head,
    body,
    startY,
    styles: { fontSize: 8, cellPadding: 4, halign: 'center', valign: 'middle' },
    headStyles: { fillColor: [0, 96, 255], textColor: 255, fontStyle: 'bold' },
    columnStyles: {
      0: { halign: 'left', cellWidth: 150 },
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index > 0 && data.column.index <= fechas.length) {
        const valor = data.cell.raw;
        if (coloresEstado[valor]) {
          data.cell.styles.fillColor = coloresEstado[valor];
          data.cell.styles.fontStyle = 'bold';
        }
      }
    },
  });

  doc.save(construirNombreArchivo(meta, 'pdf'));
};
