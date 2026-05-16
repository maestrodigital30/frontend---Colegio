import { useEffect } from 'react';
import audioService from '../services/audioService';

export default function useAudioCleanup() {
  useEffect(() => {
    return () => {
      audioService.stopAll();
    };
  }, []);
}
