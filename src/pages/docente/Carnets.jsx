import { useState, useEffect } from 'react';
import apiClient from '../../services/apiClient';
import { getUploadUrl } from '../../utils/storage';
import { useAuth } from '../../features/auth/AuthContext';
import InputCampo from '../../components/common/InputCampo';
import Boton from '../../components/common/Boton';
import { QRCodeSVG } from 'qrcode.react';
import { HiPrinter, HiX, HiEye, HiUser } from 'react-icons/hi';

const ANIO_ESCOLAR = new Date().getFullYear();
const AZUL = '#0060FF';
const CELESTE = '#87CEEB';

/* ── Estilos CSS para la ventana de impresion ── */
const getCarnetPrintStyles = () => `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=DM+Sans:wght@400;500;600&display=swap');
  *{margin:0;padding:0;box-sizing:border-box;print-color-adjust:exact!important;-webkit-print-color-adjust:exact!important}
  body{font-family:'DM Sans',sans-serif;background:#fff}
  .print-wrap{display:flex;flex-wrap:wrap;gap:12mm;padding:10mm;justify-content:center}
  .c{
    width:105mm;height:66mm;
    border:0.3mm solid #d1d5db;border-radius:3mm;
    overflow:hidden;display:flex;flex-direction:column;
    background:#fff;page-break-inside:avoid;position:relative;
  }
  .c-hd{
    background:linear-gradient(135deg,${AZUL} 0%,${CELESTE} 60%,#ffffff 100%);
    padding:2.2mm 4mm;display:flex;align-items:center;gap:2.5mm;
    position:relative;overflow:hidden;
  }
  .c-hd::before{
    content:'';position:absolute;inset:0;
    background:repeating-linear-gradient(120deg,transparent,transparent 2mm,rgba(255,255,255,.10) 2mm,rgba(255,255,255,.10) 4mm);
  }
  .c-hd::after{
    content:'';position:absolute;right:-4mm;top:-4mm;
    width:18mm;height:18mm;border-radius:50%;
    background:rgba(255,255,255,.15);
  }
  .c-logo{
    width:8mm;height:8mm;border-radius:1.8mm;
    display:flex;align-items:center;justify-content:center;
    position:relative;z-index:1;flex-shrink:0;overflow:hidden;
    border:.4mm solid rgba(255,255,255,.5);background:rgba(255,255,255,.3);
  }
  .c-logo img{width:100%;height:100%;object-fit:contain}
  .c-logo-txt{
    font-family:'Outfit',sans-serif;font-weight:800;font-size:8pt;color:#000;
  }
  .c-hd-txt{position:relative;z-index:1}
  .c-school{font-family:'Outfit',sans-serif;font-weight:700;font-size:9.5pt;color:#000;letter-spacing:.3mm}
  .c-sub{font-size:5.5pt;color:rgba(0,0,0,.55);letter-spacing:.9mm;text-transform:uppercase;font-weight:600}
  .c-bd{flex:1;padding:2mm 4mm 1.5mm;display:flex;flex-direction:column}
  .c-tag{
    font-family:'Outfit',sans-serif;font-size:5pt;font-weight:700;
    color:${AZUL};letter-spacing:1.5mm;text-transform:uppercase;
    border-bottom:.3mm solid ${CELESTE};padding-bottom:1mm;margin-bottom:1.5mm;
  }
  .c-row{flex:1;display:flex;gap:2.5mm;align-items:center}
  .c-foto{
    flex-shrink:0;width:14mm;height:17mm;
    border-radius:1.5mm;overflow:hidden;
    border:.3mm solid ${CELESTE};background:#f8fafc;
    display:flex;align-items:center;justify-content:center;
  }
  .c-foto img{width:100%;height:100%;object-fit:cover}
  .c-foto-ph{width:100%;height:100%;display:flex;align-items:center;justify-content:center}
  .c-foto-ph svg{width:6mm;height:6mm;fill:#cbd5e1}
  .c-info{flex:1;min-width:0}
  .c-fn{font-size:5.5pt;color:#000;font-weight:500;line-height:1.15}
  .c-ln{
    font-family:'Outfit',sans-serif;font-size:7pt;font-weight:800;
    color:#000;text-transform:uppercase;letter-spacing:.2mm;
    line-height:1.2;margin-bottom:1mm;word-wrap:break-word;
  }
  .c-d{font-size:5.5pt;color:#000;line-height:1.55}
  .c-d b{font-weight:700;color:#000}
  .c-qr{
    flex-shrink:0;width:28mm;height:28mm;
    border:.4mm solid ${CELESTE};border-radius:1.5mm;
    padding:.8mm;display:flex;align-items:center;justify-content:center;
    background:#E1F5FE;
  }
  .c-qr svg{width:100%!important;height:100%!important}
  .c-noqr{
    width:100%;height:100%;display:flex;align-items:center;justify-content:center;
    font-size:5pt;color:#94a3b8;border:.3mm dashed #cbd5e1;border-radius:1mm;
  }
  .c-ft{
    background:linear-gradient(135deg,${AZUL},${CELESTE});
    padding:1.2mm 4mm;display:flex;justify-content:space-between;align-items:center;
  }
  .c-ft-l{font-family:'Outfit',sans-serif;font-size:5pt;color:#fff;letter-spacing:1.2mm;text-transform:uppercase;font-weight:600}
  .c-ft-y{font-family:'Outfit',sans-serif;font-size:6.5pt;color:#fff;font-weight:800;letter-spacing:.5mm}
  @media print{
    body{background:#fff}
    .print-wrap{padding:5mm;gap:8mm}
    .c{border-color:#e5e7eb}
  }
`;

const PLACEHOLDER_SVG = `<div class="c-foto-ph"><svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/></svg></div>`;

/* ── Genera HTML de un carnet para la ventana de impresion ── */
const carnetHTML = (al, curso, carnet, svgStr, fotoFullUrl, logoUrl, nombreIE) => `
<div class="c">
  <div class="c-hd">
    <div class="c-logo">${logoUrl ? `<img src="${logoUrl}" alt="" />` : `<span class="c-logo-txt">CJ</span>`}</div>
    <div class="c-hd-txt">
      <div class="c-school">${nombreIE || 'Colegio Jos&eacute;'}</div>
      <div class="c-sub">Carnet Estudiantil</div>
    </div>
  </div>
  <div class="c-bd">
    <div class="c-tag">Identificaci&oacute;n del Alumno</div>
    <div class="c-row">
      <div class="c-foto">${fotoFullUrl ? `<img src="${fotoFullUrl}" alt="" />` : PLACEHOLDER_SVG}</div>
      <div class="c-info">
        <div class="c-fn">${al.nombres}</div>
        <div class="c-ln">${al.apellidos}</div>
        <div class="c-d"><b>DNI:</b> ${al.dni || '\u2014'}</div>
        <div class="c-d"><b>C&oacute;digo:</b> ${carnet?.codigo_carnet || '\u2014'}</div>
        <div class="c-d"><b>Curso:</b> ${curso}</div>
      </div>
      <div class="c-qr">${svgStr || '<div class="c-noqr">Sin QR</div>'}</div>
    </div>
  </div>
  <div class="c-ft">
    <span class="c-ft-l">Identificaci&oacute;n Oficial</span>
    <span class="c-ft-y">${ANIO_ESCOLAR}</span>
  </div>
</div>`;

/* ══════════════════════════════════════════════
   Componente principal
   ══════════════════════════════════════════════ */
export default function CarnetsPage() {
  const { configSistema } = useAuth();
  const [cursos, setCursos] = useState([]);
  const [cursoSel, setCursoSel] = useState('');
  const [alumnos, setAlumnos] = useState([]);
  const [preview, setPreview] = useState(null);

  const logoUrl = configSistema?.logo ? getUploadUrl(configSistema.logo) : null;
  const nombreIE = configSistema?.nombre || 'Colegio José';

  useEffect(() => {
    apiClient.get('/cursos').then(({ data }) => setCursos(data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!cursoSel) { setAlumnos([]); return; }
    apiClient.get('/alumnos').then(({ data }) => {
      setAlumnos(data.filter(a =>
        a.estado === 1 &&
        a.tbl_alumnos_cursos?.some(ac => ac.id_curso === parseInt(cursoSel) && ac.estado === 1)
      ));
    }).catch(() => setAlumnos([]));
  }, [cursoSel]);

  const cursoObj = cursos.find(c => c.id === parseInt(cursoSel));
  const cursoNombre = cursoObj
    ? `${cursoObj.nombre} - ${cursoObj.grado || ''} ${cursoObj.seccion || ''}`.trim()
    : '';

  /* ── Helpers de impresion ── */
  const grabSvg = (id) => {
    const el = document.querySelector(`#qr-${id} svg`);
    return el ? el.outerHTML : '';
  };

  const abrirImpresion = (bodyHTML) => {
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(
      `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Carnet - ${nombreIE}</title><style>${getCarnetPrintStyles()}</style></head><body><div class="print-wrap">${bodyHTML}</div></body></html>`
    );
    w.document.close();
    setTimeout(() => w.print(), 1000);
  };

  const imprimirUno = (al) => {
    const ct = al.tbl_carnets_alumnos?.find(c => c.estado === 1);
    const fotoUrl = al.foto_url ? getUploadUrl(al.foto_url) : null;
    abrirImpresion(carnetHTML(al, cursoNombre, ct, grabSvg(al.id), fotoUrl, logoUrl, nombreIE));
  };

  const imprimirTodos = () => {
    const html = alumnos.map(a => {
      const ct = a.tbl_carnets_alumnos?.find(c => c.estado === 1);
      const fotoUrl = a.foto_url ? getUploadUrl(a.foto_url) : null;
      return carnetHTML(a, cursoNombre, ct, grabSvg(a.id), fotoUrl, logoUrl, nombreIE);
    }).join('');
    abrirImpresion(html);
  };

  return (
    <div className="animate-fade-up" style={{ fontSize: '115%' }}>
      {/* ── Encabezado ── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-xs font-display font-bold uppercase tracking-widest mb-1" style={{ color: AZUL }}>
            Identificaci&oacute;n
          </p>
          <h1 className="text-3xl font-display font-bold text-black">Carnets QR</h1>
        </div>
        {alumnos.length > 0 && (
          <Boton onClick={imprimirTodos}>
            <span className="flex items-center gap-2">
              <HiPrinter className="w-4 h-4" />Imprimir Todos
            </span>
          </Boton>
        )}
      </div>

      {/* ── Selector de curso ── */}
      <div className="w-72 mb-6">
        <InputCampo
          label="Curso" name="curso" type="select"
          value={cursoSel}
          onChange={(e) => setCursoSel(e.target.value)}
          options={cursos.filter(c => c.estado === 1).map(c => ({
            value: c.id.toString(),
            label: `${c.nombre} - ${c.grado || ''} ${c.seccion || ''}`,
          }))}
        />
      </div>

      {/* ── Grid de carnets ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 stagger-children">
        {alumnos.map((a) => {
          const carnetData = a.tbl_carnets_alumnos?.find(c => c.estado === 1);
          const qr = a.tbl_qr_alumnos?.find(q => q.estado === 1);
          const fotoUrl = a.foto_url ? getUploadUrl(a.foto_url) : null;
          return (
            <div key={a.id} className="group relative animate-fade-up">
              {/* Carnet visual */}
              <div
                className="rounded-2xl overflow-hidden border shadow-glass bg-white flex flex-col"
                style={{ aspectRatio: '105 / 66', borderColor: CELESTE }}
              >
                {/* Header azul eléctrico → celeste → blanco */}
                <div className="px-4 py-2 relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${AZUL} 0%, ${CELESTE} 60%, #ffffff 100%)` }}>
                  <div
                    className="absolute inset-0"
                    style={{ background: 'repeating-linear-gradient(120deg,transparent,transparent 6px,rgba(255,255,255,.10) 6px,rgba(255,255,255,.10) 12px)' }}
                  />
                  <div className="absolute -right-3 -top-3 w-14 h-14 rounded-full bg-white/[.12]" />
                  <div className="relative flex items-center gap-2">
                    {/* Logo I.E. */}
                    <div className="w-8 h-8 rounded-lg border border-white/50 flex items-center justify-center flex-shrink-0 overflow-hidden" style={{ background: 'rgba(255,255,255,0.35)' }}>
                      {logoUrl ? (
                        <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
                      ) : (
                        <span className="text-black font-display font-extrabold text-[10px]">CJ</span>
                      )}
                    </div>
                    <div>
                      <div className="font-display font-bold text-black text-xs tracking-wide leading-tight">
                        {nombreIE}
                      </div>
                      <div className="text-[7px] text-black/50 tracking-[0.15em] uppercase font-semibold">
                        Carnet Estudiantil
                      </div>
                    </div>
                  </div>
                </div>

                {/* Cuerpo */}
                <div className="px-3 py-1.5 flex-1 flex flex-col min-h-0">
                  <div className="text-[7px] font-display font-bold tracking-[0.2em] uppercase pb-1 mb-1.5" style={{ color: AZUL, borderBottom: `2px solid ${CELESTE}` }}>
                    Identificaci&oacute;n del Alumno
                  </div>
                  <div className="flex gap-2 items-center flex-1 min-h-0">
                    {/* Foto */}
                    <div className="flex-shrink-0 w-[46px] h-[56px] rounded-lg overflow-hidden bg-slate-50 flex items-center justify-center" style={{ border: `1.5px solid ${CELESTE}` }}>
                      {fotoUrl ? (
                        <img src={fotoUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <HiUser className="w-5 h-5 text-slate-300" />
                      )}
                    </div>
                    {/* Datos */}
                    <div className="flex-1 min-w-0">
                      <p className="text-[8px] text-black font-medium leading-tight">{a.nombres}</p>
                      <p className="font-display font-extrabold text-black text-[10px] uppercase tracking-wide leading-tight break-words">
                        {a.apellidos}
                      </p>
                      <div className="mt-0.5 space-y-0">
                        <p className="text-[7px] text-black">
                          <span className="font-bold">DNI:</span> {a.dni || '\u2014'}
                        </p>
                        <p className="text-[7px] text-black break-words">
                          <span className="font-bold">C&oacute;digo:</span>{' '}
                          {carnetData?.codigo_carnet || '\u2014'}
                        </p>
                        <p className="text-[7px] text-black break-words">
                          <span className="font-bold">Curso:</span> {cursoNombre}
                        </p>
                      </div>
                    </div>
                    {/* QR */}
                    <div
                      id={`qr-${a.id}`}
                      className="flex-shrink-0 w-[88px] h-[88px] rounded-lg p-1 flex items-center justify-center"
                      style={{ border: `2px solid ${CELESTE}`, background: '#E1F5FE' }}
                    >
                      {qr?.valor_qr ? (
                        <QRCodeSVG value={qr.valor_qr} size={76} />
                      ) : (
                        <span className="text-[6px] text-slate-400">Sin QR</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer azul eléctrico → celeste */}
                <div className="px-4 py-1 flex justify-between items-center" style={{ background: `linear-gradient(135deg, ${AZUL}, ${CELESTE})` }}>
                  <span className="text-[6px] text-white tracking-[0.15em] uppercase font-display font-semibold">
                    Identificaci&oacute;n Oficial
                  </span>
                  <span className="text-[8px] text-white font-display font-extrabold tracking-wide">
                    {ANIO_ESCOLAR}
                  </span>
                </div>
              </div>

              {/* Overlay de acciones al hover */}
              <div className="absolute inset-0 rounded-2xl bg-slate-900/0 group-hover:bg-slate-900/40 transition-all duration-300 flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto">
                <button
                  onClick={() => setPreview(a)}
                  className="p-2.5 rounded-xl bg-white/90 backdrop-blur hover:bg-white text-slate-700 shadow-lg transition-all duration-200 hover:scale-110 active:scale-95"
                  style={{ '--tw-shadow-color': CELESTE }}
                  title="Vista previa"
                >
                  <HiEye className="w-5 h-5" />
                </button>
                <button
                  onClick={() => imprimirUno(a)}
                  className="p-2.5 rounded-xl bg-white/90 backdrop-blur hover:bg-white text-slate-700 shadow-lg transition-all duration-200 hover:scale-110 active:scale-95"
                  title="Imprimir carnet"
                >
                  <HiPrinter className="w-5 h-5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {cursoSel && alumnos.length === 0 && (
        <p className="text-black text-center py-12 font-bold">No hay alumnos en este curso</p>
      )}

      {/* ══ Modal de vista previa ══ */}
      {preview && (
        <ModalCarnet
          alumno={preview}
          cursoNombre={cursoNombre}
          logoUrl={logoUrl}
          nombreIE={nombreIE}
          onClose={() => setPreview(null)}
          onPrint={(al) => { imprimirUno(al); setPreview(null); }}
        />
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════
   Modal de vista previa del carnet
   ══════════════════════════════════════════════ */
function ModalCarnet({ alumno, cursoNombre, logoUrl, nombreIE, onClose, onPrint }) {
  const carnet = alumno.tbl_carnets_alumnos?.find(c => c.estado === 1);
  const qr = alumno.tbl_qr_alumnos?.find(q => q.estado === 1);
  const fotoUrl = alumno.foto_url ? getUploadUrl(alumno.foto_url) : null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm animate-fade-in" />

      <div className="relative animate-scale-in w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
        {/* Cerrar */}
        <button
          onClick={onClose}
          className="absolute -top-3 -right-3 z-10 w-8 h-8 rounded-full bg-white shadow-lg border border-glass flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors"
        >
          <HiX className="w-4 h-4" />
        </button>

        {/* Carnet ampliado */}
        <div
          className="rounded-2xl overflow-hidden shadow-glass-lg bg-white flex flex-col"
          style={{ aspectRatio: '105 / 66', border: `2px solid ${CELESTE}` }}
        >
          {/* Header */}
          <div className="px-6 py-3 relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${AZUL} 0%, ${CELESTE} 60%, #ffffff 100%)` }}>
            <div
              className="absolute inset-0"
              style={{ background: 'repeating-linear-gradient(120deg,transparent,transparent 8px,rgba(255,255,255,.10) 8px,rgba(255,255,255,.10) 16px)' }}
            />
            <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full bg-white/[.12]" />
            <div className="relative flex items-center gap-3">
              {/* Logo I.E. */}
              <div className="w-10 h-10 rounded-xl border-2 border-white/50 flex items-center justify-center flex-shrink-0 overflow-hidden" style={{ background: 'rgba(255,255,255,0.35)' }}>
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
                ) : (
                  <span className="text-black font-display font-extrabold text-sm">CJ</span>
                )}
              </div>
              <div>
                <div className="font-display font-bold text-black text-base tracking-wide">{nombreIE}</div>
                <div className="text-[9px] text-black/50 tracking-[0.2em] uppercase font-semibold">Carnet Estudiantil</div>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="px-5 py-2.5 flex-1 flex flex-col min-h-0">
            <div className="text-[9px] font-display font-bold tracking-[0.25em] uppercase pb-1.5 mb-2" style={{ color: AZUL, borderBottom: `2px solid ${CELESTE}` }}>
              Identificaci&oacute;n del Alumno
            </div>
            <div className="flex gap-3 items-center flex-1 min-h-0">
              {/* Foto */}
              <div className="flex-shrink-0 w-[70px] h-[85px] rounded-xl overflow-hidden bg-slate-50 flex items-center justify-center" style={{ border: `2px solid ${CELESTE}` }}>
                {fotoUrl ? (
                  <img src={fotoUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <HiUser className="w-8 h-8 text-slate-300" />
                )}
              </div>
              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-xs text-black font-medium leading-tight">{alumno.nombres}</p>
                <p className="font-display font-extrabold text-black text-base uppercase tracking-wide leading-tight break-words">
                  {alumno.apellidos}
                </p>
                <div className="mt-1.5 space-y-0.5">
                  <p className="text-[11px] text-black">
                    <span className="font-bold">DNI:</span> {alumno.dni || '\u2014'}
                  </p>
                  <p className="text-[11px] text-black break-words">
                    <span className="font-bold">C&oacute;digo:</span>{' '}
                    {carnet?.codigo_carnet || '\u2014'}
                  </p>
                  <p className="text-[11px] text-black break-words">
                    <span className="font-bold">Curso:</span> {cursoNombre}
                  </p>
                </div>
              </div>
              {/* QR */}
              <div className="flex-shrink-0 w-[136px] h-[136px] rounded-xl p-1.5 flex items-center justify-center" style={{ border: `2px solid ${CELESTE}`, background: '#E1F5FE' }}>
                {qr?.valor_qr ? (
                  <QRCodeSVG value={qr.valor_qr} size={116} />
                ) : (
                  <span className="text-xs text-slate-400">Sin QR</span>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-1.5 flex justify-between items-center" style={{ background: `linear-gradient(135deg, ${AZUL}, ${CELESTE})` }}>
            <span className="text-[8px] text-white tracking-[0.2em] uppercase font-display font-semibold">
              Identificaci&oacute;n Oficial
            </span>
            <span className="text-[10px] text-white font-display font-extrabold tracking-wide">{ANIO_ESCOLAR}</span>
          </div>
        </div>

        {/* Boton imprimir */}
        <div className="flex justify-center mt-4">
          <Boton onClick={() => onPrint(alumno)}>
            <span className="flex items-center gap-2">
              <HiPrinter className="w-4 h-4" />Imprimir Carnet
            </span>
          </Boton>
        </div>
      </div>
    </div>
  );
}
