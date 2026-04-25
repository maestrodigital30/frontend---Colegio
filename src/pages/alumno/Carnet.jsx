import { useState, useEffect } from 'react';
import { HiQrcode, HiIdentification } from 'react-icons/hi';
import { QRCodeSVG } from 'qrcode.react';
import apiClient from '../../services/apiClient';
import { getUploadUrl } from '../../utils/storage';
import { useAuth } from '../../features/auth/AuthContext';

const AZUL = '#0060FF';
const CELESTE = '#87CEEB';

export default function CarnetAlumnoPage() {
  const { configSistema } = useAuth();
  const [data, setData] = useState(null);
  const [cargando, setCargando] = useState(true);

  const logoUrl = configSistema?.logo ? getUploadUrl(configSistema.logo) : null;
  const nombreIE = configSistema?.nombre || 'Colegio José';

  useEffect(() => {
    apiClient.get('/alumno-portal/mi-carnet')
      .then(res => setData(res.data))
      .catch(() => {})
      .finally(() => setCargando(false));
  }, []);

  if (cargando) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: AZUL }} />
      </div>
    );
  }

  if (!data?.alumno) {
    return (
      <div className="rounded-2xl p-12 text-center bg-white" style={{ border: `2px solid ${CELESTE}` }}>
        <HiIdentification className="w-16 h-16 mx-auto mb-4" style={{ color: CELESTE }} />
        <p className="text-black font-bold">No se encontro tu carnet</p>
      </div>
    );
  }

  const { alumno, carnet, qr } = data;

  return (
    <div>
      <div className="mb-8 animate-fade-up">
        <p className="text-xs font-display font-bold uppercase tracking-widest mb-1" style={{ color: AZUL }}>Identificacion</p>
        <h1 className="text-3xl font-display font-bold text-black">Mi Carnet</h1>
        <p className="text-sm text-black/60 mt-1">Tu carnet digital y codigo QR</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Carnet */}
        <div className="rounded-2xl overflow-hidden animate-fade-up bg-white" style={{ border: `2px solid ${CELESTE}` }}>
          <div className="px-6 py-4" style={{ background: `linear-gradient(135deg, ${AZUL} 0%, ${CELESTE} 60%, #ffffff 100%)` }}>
            <div className="flex items-center gap-3">
              {logoUrl ? (
                <img src={logoUrl} alt="Logo" className="w-8 h-8 rounded-lg object-contain" style={{ background: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.5)' }} />
              ) : (
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.5)' }}>
                  <span className="text-black font-display font-extrabold text-xs">CJ</span>
                </div>
              )}
              <div>
                <h3 className="font-display font-bold text-black text-sm uppercase tracking-wider">{nombreIE}</h3>
                <p className="text-[9px] text-black/50 font-semibold uppercase tracking-widest">Carnet Escolar</p>
              </div>
            </div>
          </div>
          <div className="p-6">
            <div className="flex items-center gap-5 mb-6">
              {alumno.foto_url ? (
                <img src={getUploadUrl(alumno.foto_url)} alt="" className="w-20 h-20 rounded-xl object-cover" style={{ border: `2px solid ${CELESTE}` }} />
              ) : (
                <div className="w-20 h-20 rounded-xl flex items-center justify-center" style={{ background: '#E1F5FE', border: `2px solid ${CELESTE}` }}>
                  <HiIdentification className="w-10 h-10" style={{ color: AZUL }} />
                </div>
              )}
              <div>
                <h3 className="font-display font-extrabold text-black text-lg">{alumno.nombres} {alumno.apellidos}</h3>
                <p className="text-sm text-black font-medium">DNI: {alumno.dni || 'No registrado'}</p>
                {alumno.genero && <p className="text-xs text-black/60 mt-1 font-medium">Genero: {alumno.genero === 'M' ? 'Masculino' : 'Femenino'}</p>}
              </div>
            </div>

            {carnet && (
              <div className="p-4 rounded-xl" style={{ background: '#E1F5FE', border: `2px solid ${CELESTE}` }}>
                <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: AZUL }}>Codigo de Carnet</p>
                <p className="font-display font-extrabold text-black text-xl tracking-wider">{carnet.codigo_carnet}</p>
              </div>
            )}
          </div>
        </div>

        {/* QR */}
        <div className="rounded-2xl overflow-hidden animate-fade-up bg-white" style={{ animationDelay: '0.1s', border: `2px solid ${CELESTE}` }}>
          <div className="px-6 py-4" style={{ background: `linear-gradient(135deg, ${CELESTE} 0%, ${AZUL} 100%)` }}>
            <h3 className="font-display font-bold text-white text-sm uppercase tracking-wider">Codigo QR</h3>
          </div>
          <div className="p-6 flex flex-col items-center">
            {qr ? (
              <>
                <div className="bg-white p-4 rounded-2xl shadow-sm mb-4" style={{ border: `2px solid ${CELESTE}` }}>
                  <QRCodeSVG value={qr.valor_qr} size={200} level="H" />
                </div>
                <p className="text-xs text-black text-center font-medium">
                  Muestra este codigo para que te tomen asistencia
                </p>
                <p className="text-[10px] text-black/50 mt-2 font-mono">{qr.valor_qr}</p>
              </>
            ) : (
              <div className="py-8 text-center">
                <HiQrcode className="w-16 h-16 mx-auto mb-4" style={{ color: CELESTE }} />
                <p className="text-black text-sm font-medium">No tienes un codigo QR activo</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
