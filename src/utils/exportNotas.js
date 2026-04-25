import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { TIPOS_CALIFICACION } from './constants';
import { formatearFecha } from './formatters';

const slug = (texto = '') =>
  texto
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toLowerCase();

const vacio = (esLetras) => (esLetras ? '' : 0);

const normalizar = (v, esLetras) => {
  if (v === null || v === undefined || v === '') return vacio(esLetras);
  if (esLetras) return v;
  const num = typeof v === 'number' ? v : parseFloat(v);
  return Number.isFinite(num) ? num : vacio(esLetras);
};

const construirMatriz = ({ alumnos, componentes, notas, esLetras }) => {
  const notasPorAlumno = new Map();
  notas.forEach((n) => {
    const detalles = {};
    (n.tbl_notas_detalle || []).forEach((d) => {
      detalles[d.id_componente_nota] = esLetras ? d.valor_letra : d.valor_numerico;
    });
    notasPorAlumno.set(n.id_alumno, {
      detalles,
      final: esLetras ? n.nota_final_letra : n.nota_final_numerica,
    });
  });

  const filas = [...alumnos]
    .sort((a, b) => {
      const ap = (a.apellidos || '').localeCompare(b.apellidos || '', 'es');
      return ap !== 0 ? ap : (a.nombres || '').localeCompare(b.nombres || '', 'es');
    })
    .map((a) => {
      const reg = notasPorAlumno.get(a.id);
      const celdas = componentes.map((c) => normalizar(reg?.detalles?.[c.id], esLetras));
      return {
        alumno: `${a.apellidos}, ${a.nombres}`,
        celdas,
        final: normalizar(reg?.final, esLetras),
      };
    });

  return filas;
};

const construirNombreArchivo = (meta, extension) => {
  const partes = [
    'notas',
    slug(meta.cursoNombre),
    slug(meta.periodoNombre),
    meta.alumnoNombre ? slug(meta.alumnoNombre) : null,
  ].filter(Boolean);
  return `${partes.join('_')}.${extension}`;
};

const etiquetaComponente = (c, esLetras) =>
  esLetras ? c.nombre_componente : `${c.nombre_componente} (${c.peso_porcentaje}%)`;

export const exportarNotasExcel = ({ alumnos, componentes, notas, esquema, meta }) => {
  const esLetras = esquema?.tipo_calificacion === TIPOS_CALIFICACION.LETRAS;
  const filas = construirMatriz({ alumnos, componentes, notas, esLetras });

  const encabezadoInfo = [
    ['Registro de Notas'],
    [`Curso: ${meta.cursoNombre}`],
    [`Periodo: ${meta.periodoNombre}`],
    ...(meta.alumnoNombre ? [[`Alumno: ${meta.alumnoNombre}`]] : []),
    [`Tipo de calificación: ${esLetras ? 'Letras' : 'Numérico'}`],
    [`Emitido: ${formatearFecha(new Date())}`],
    [],
  ];

  const encabezadoTabla = [
    'Alumno',
    ...componentes.map((c) => etiquetaComponente(c, esLetras)),
    'Final',
  ];

  const filasTabla = filas.map((f) => [f.alumno, ...f.celdas, f.final]);

  const aoa = [...encabezadoInfo, encabezadoTabla, ...filasTabla];
  const hoja = XLSX.utils.aoa_to_sheet(aoa);

  const anchoAlumno = Math.max(20, ...filas.map((f) => f.alumno.length + 2));
  const anchoComp = Math.max(
    14,
    ...componentes.map((c) => etiquetaComponente(c, esLetras).length + 2)
  );
  hoja['!cols'] = [
    { wch: anchoAlumno },
    ...componentes.map(() => ({ wch: anchoComp })),
    { wch: 10 },
  ];

  const libro = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(libro, hoja, 'Notas');
  XLSX.writeFile(libro, construirNombreArchivo(meta, 'xlsx'));
};

export const exportarNotasPDF = ({ alumnos, componentes, notas, esquema, meta }) => {
  const esLetras = esquema?.tipo_calificacion === TIPOS_CALIFICACION.LETRAS;
  const filas = construirMatriz({ alumnos, componentes, notas, esLetras });

  const orientacion = componentes.length > 5 ? 'landscape' : 'portrait';
  const doc = new jsPDF({ orientation: orientacion, unit: 'pt', format: 'a4' });

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Registro de Notas', 40, 40);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  let y = 60;
  doc.text(`Curso: ${meta.cursoNombre}`, 40, y);
  y += 15;
  doc.text(`Periodo: ${meta.periodoNombre}`, 40, y);
  if (meta.alumnoNombre) {
    y += 15;
    doc.text(`Alumno: ${meta.alumnoNombre}`, 40, y);
  }
  y += 15;
  doc.text(`Tipo: ${esLetras ? 'Letras' : 'Numérico'}`, 40, y);
  y += 15;
  doc.text(`Emitido: ${formatearFecha(new Date())}`, 40, y);
  const startY = y + 15;

  const head = [[
    'Alumno',
    ...componentes.map((c) => etiquetaComponente(c, esLetras)),
    'Final',
  ]];

  const body = filas.map((f) => [f.alumno, ...f.celdas, f.final]);

  autoTable(doc, {
    head,
    body,
    startY,
    styles: { fontSize: 8, cellPadding: 4, halign: 'center', valign: 'middle' },
    headStyles: { fillColor: [0, 96, 255], textColor: 255, fontStyle: 'bold' },
    columnStyles: {
      0: { halign: 'left', cellWidth: 150 },
      [componentes.length + 1]: { fillColor: [254, 243, 199], fontStyle: 'bold' },
    },
  });

  doc.save(construirNombreArchivo(meta, 'pdf'));
};
