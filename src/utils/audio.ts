// Synthesized School Bell using Web Audio API (Zero external assets needed, 100% reliable)
class BellPlayer {
  private ctx: AudioContext | null = null;

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public playSchoolChime() {
    try {
      this.initContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      // Classic 4-note Westminster school bell chime: E4 (329.63Hz), G#4 (415.30Hz), F#4 (369.99Hz), B3 (246.94Hz) or bright C-E-D-G
      const notes = [
        { freq: 523.25, time: 0.0, dur: 0.8 },  // C5
        { freq: 659.25, time: 0.7, dur: 0.8 },  // E5
        { freq: 587.33, time: 1.4, dur: 0.8 },  // D5
        { freq: 392.00, time: 2.1, dur: 1.5 },  // G4
      ];

      notes.forEach((n) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(n.freq, now + n.time);

        // Gentle envelope: strike and long harmonic decay
        gain.gain.setValueAtTime(0, now + n.time);
        gain.gain.linearRampToValueAtTime(0.3, now + n.time + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, now + n.time + n.dur);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + n.time);
        osc.stop(now + n.time + n.dur);
      });
    } catch {
      // Audio might be blocked if user hasn't interacted yet
    }
  }
}

export const bellPlayer = new BellPlayer();
