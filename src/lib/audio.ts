/**
 * Web Audio API synthesized sound generator for Chalkboard Typing Game.
 * Fully self-contained with no external network dependencies or broken audio files.
 */

class SoundController {
  private ctx: AudioContext | null = null;
  public isMuted: boolean = false;

  constructor() {
    // Read user preference from localStorage
    try {
      const saved = localStorage.getItem('chalk_game_muted');
      if (saved !== null) {
        this.isMuted = saved === 'true';
      }
    } catch {
      // ignore
    }
  }

  private initCtx(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    try {
      localStorage.setItem('chalk_game_muted', String(this.isMuted));
    } catch {
      // ignore
    }
    return this.isMuted;
  }

  /**
   * Sound of chalk typing / tapping on blackboard
   */
  public playChalkType() {
    if (this.isMuted) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(800 + Math.random() * 400, ctx.currentTime);
      filter.Q.setValueAtTime(3, ctx.currentTime);

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(350 + Math.random() * 100, ctx.currentTime);

      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.06);
    } catch {
      // ignore
    }
  }

  /**
   * Sound of chalkboard eraser sweeping / wiping chalk off the board
   */
  public playEraserWipe() {
    if (this.isMuted) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    try {
      // Generate noise buffer for eraser brushing texture
      const bufferSize = ctx.sampleRate * 0.25;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.4));
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1400, ctx.currentTime);
      filter.frequency.linearRampToValueAtTime(600, ctx.currentTime + 0.22);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.24);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      noise.start();

      // Add a happy chime tone on top of the sweep
      const chime = ctx.createOscillator();
      const chimeGain = ctx.createGain();
      chime.type = 'sine';
      chime.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      chime.frequency.setValueAtTime(659.25, ctx.currentTime + 0.06); // E5
      chime.frequency.setValueAtTime(783.99, ctx.currentTime + 0.12); // G5
      chimeGain.gain.setValueAtTime(0.08, ctx.currentTime);
      chimeGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);

      chime.connect(chimeGain);
      chimeGain.connect(ctx.destination);
      chime.start();
      chime.stop(ctx.currentTime + 0.24);
    } catch {
      // ignore
    }
  }

  /**
   * Sound when word hits bottom and a heart is lost
   */
  public playHeartLost() {
    if (this.isMuted) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 0.25);

      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch {
      // ignore
    }
  }

  /**
   * Sound when a stage is cleared (cheerful classroom school bell / chime)
   */
  public playStageClear() {
    if (this.isMuted) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    try {
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.12);

        const startTime = ctx.currentTime + idx * 0.12;
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.2, startTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.4);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.45);
      });
    } catch {
      // ignore
    }
  }

  /**
   * Sound for complete game victory
   */
  public playGameClear() {
    if (this.isMuted) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    try {
      const notes = [523.25, 587.33, 659.25, 698.46, 783.99, 880, 1046.5];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        const startTime = ctx.currentTime + idx * 0.1;
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0.22, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.5);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.55);
      });
    } catch {
      // ignore
    }
  }
}

export const sound = new SoundController();
