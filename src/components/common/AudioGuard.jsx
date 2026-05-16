import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import audioService from '../../services/audioService';

const RUTAS_TRIVIA_JUGAR = ['/trivia/jugar', '/docente/trivia-jugar'];

export default function AudioGuard() {
  const location = useLocation();
  useEffect(() => {
    const enJuego = RUTAS_TRIVIA_JUGAR.some(p => location.pathname.startsWith(p));
    if (!enJuego) audioService.stopMusic();
  }, [location.pathname]);
  return null;
}
