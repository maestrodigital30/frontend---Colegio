import { getUploadUrl } from '../utils/storage';

const STORAGE_KEY_MUSICA = 'audio.musica.enabled';
const STORAGE_KEY_SFX = 'audio.sfx.enabled';

class AudioService {
  constructor() {
    this.bgMusic = null;
    this.bgMusicSrc = null;
    this.sfxMap = new Map(); // tipo_evento → HTMLAudioElement preloaded
    this.musicaEnabled = this._readBool(STORAGE_KEY_MUSICA, true);
    this.sfxEnabled = this._readBool(STORAGE_KEY_SFX, true);
    this.musicVolume = 0.4;
    this.sfxVolume = 0.8;
  }

  _readBool(key, def) {
    const raw = localStorage.getItem(key);
    if (raw === null) return def;
    return raw === 'true';
  }

  setSounds(sonidos) {
    // sonidos: array de { tipo_evento, ruta_archivo }
    this.sfxMap.clear();
    for (const s of sonidos) {
      const url = getUploadUrl(s.ruta_archivo);
      if (!url) continue;
      const audio = new Audio(url);
      audio.preload = 'auto';
      audio.volume = this.sfxVolume;
      this.sfxMap.set(s.tipo_evento, audio);
    }
  }

  playSfx(tipoEvento) {
    if (!this.sfxEnabled) return;
    const audio = this.sfxMap.get(tipoEvento);
    if (!audio) return;
    try {
      audio.currentTime = 0;
      audio.play().catch(() => { /* autoplay puede ser denegado por el navegador */ });
    } catch { /* errores transitorios de la Audio API se ignoran */ }
  }

  playMusic(rutaArchivo) {
    const url = getUploadUrl(rutaArchivo);
    if (!url) { this.stopMusic(); return; }

    if (this.bgMusic && this.bgMusicSrc === url) {
      if (this.musicaEnabled) this.bgMusic.play().catch(() => {});
      return;
    }

    this.stopMusic();
    if (!this.musicaEnabled) { this.bgMusicSrc = url; return; }

    this.bgMusic = new Audio(url);
    this.bgMusic.loop = true;
    this.bgMusic.volume = this.musicVolume;
    this.bgMusicSrc = url;
    this.bgMusic.play().catch(() => {});
  }

  stopMusic() {
    if (this.bgMusic) {
      try { this.bgMusic.pause(); this.bgMusic.currentTime = 0; } catch { /* ignorar errores de la Audio API */ }
      this.bgMusic = null;
    }
    this.bgMusicSrc = null;
  }

  toggleMusica(enabled) {
    this.musicaEnabled = enabled;
    localStorage.setItem(STORAGE_KEY_MUSICA, String(enabled));
    if (!enabled) {
      if (this.bgMusic) { try { this.bgMusic.pause(); } catch { /* ignorar errores de la Audio API */ } }
    } else if (this.bgMusicSrc) {
      this.playMusic(this.bgMusicSrc.replace(/^.*\/uploads\//, ''));
    }
  }

  toggleSfx(enabled) {
    this.sfxEnabled = enabled;
    localStorage.setItem(STORAGE_KEY_SFX, String(enabled));
  }

  stopAll() {
    this.stopMusic();
    for (const audio of this.sfxMap.values()) {
      try { audio.pause(); audio.currentTime = 0; } catch { /* ignorar errores de la Audio API */ }
    }
  }

  isMusicaEnabled() { return this.musicaEnabled; }
  isSfxEnabled() { return this.sfxEnabled; }
}

const audioService = new AudioService();
export default audioService;
