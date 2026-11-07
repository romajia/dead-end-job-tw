type AudioContextConstructor = typeof AudioContext;

export class AudioManager {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private filter: BiquadFilterNode | null = null;
  private ambienceNodes: AudioNode[] = [];
  private rockTimer = 0;
  private scooterTimer = 0;
  private rockStep = 0;
  private unlocked = false;
  private volume = 0.18;

  private ensureContext(): AudioContext | null {
    if (this.context) return this.context;
    const Constructor = (window.AudioContext || (window as Window & { webkitAudioContext?: AudioContextConstructor }).webkitAudioContext);
    if (!Constructor) return null;
    this.context = new Constructor();
    this.master = this.context.createGain();
    this.filter = this.context.createBiquadFilter();
    this.filter.type = 'lowpass';
    this.filter.frequency.value = 1500;
    this.master.gain.value = this.volume;
    this.filter.connect(this.master);
    this.master.connect(this.context.destination);
    return this.context;
  }

  public async unlock(): Promise<void> {
    const context = this.ensureContext();
    if (!context) return;
    try { await context.resume(); } catch { return; }
    this.unlocked = true;
    this.startAmbience();
  }

  private startAmbience(): void {
    const context = this.context;
    const destination = this.filter;
    if (!context || !destination || this.ambienceNodes.length > 0) return;
    const compressor = context.createDynamicsCompressor();
    compressor.threshold.value = -22;
    compressor.ratio.value = 3;
    compressor.connect(destination);
    const hum = context.createOscillator();
    hum.type = 'sine';
    hum.frequency.value = 55;
    const humGain = context.createGain();
    humGain.gain.value = 0.13;
    hum.connect(humGain).connect(compressor);
    hum.start();
    const wooden = context.createOscillator();
    wooden.type = 'triangle';
    wooden.frequency.value = 110;
    const woodenGain = context.createGain();
    woodenGain.gain.value = 0.016;
    wooden.connect(woodenGain).connect(compressor);
    wooden.start();
    this.ambienceNodes.push(hum, humGain, wooden, woodenGain, compressor);
    this.scooterTimer = window.setInterval(() => {
      if (Math.random() < 0.7) this.tone(110, 1.15, 'sawtooth', 0.035, 75);
    }, 32_000);
  }

  private tone(frequency: number, duration: number, type: OscillatorType, gain: number, endFrequency?: number): void {
    const context = this.context;
    const destination = this.filter;
    if (!context || !destination || !this.unlocked) return;
    const oscillator = context.createOscillator();
    const envelope = context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(Math.min(1500, frequency), context.currentTime);
    if (endFrequency !== undefined) oscillator.frequency.exponentialRampToValueAtTime(Math.max(35, Math.min(1500, endFrequency)), context.currentTime + duration);
    envelope.gain.setValueAtTime(0.0001, context.currentTime);
    envelope.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain), context.currentTime + 0.012);
    envelope.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + duration);
    oscillator.connect(envelope).connect(destination);
    oscillator.start();
    oscillator.stop(context.currentTime + duration + 0.03);
  }

  private noise(duration: number, gain: number, centerFrequency = 500): void {
    const context = this.context;
    const destination = this.filter;
    if (!context || !destination || !this.unlocked) return;
    const frameCount = Math.max(1, Math.floor(context.sampleRate * duration));
    const buffer = context.createBuffer(1, frameCount, context.sampleRate);
    const channel = buffer.getChannelData(0);
    for (let i = 0; i < channel.length; i += 1) channel[i] = (Math.random() * 2 - 1) * (1 - i / channel.length);
    const source = context.createBufferSource();
    const filter = context.createBiquadFilter();
    const envelope = context.createGain();
    filter.type = 'lowpass';
    filter.frequency.value = Math.min(1300, centerFrequency);
    source.buffer = buffer;
    envelope.gain.setValueAtTime(Math.max(0.0001, gain), context.currentTime);
    envelope.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + duration);
    source.connect(filter).connect(envelope).connect(destination);
    source.start();
  }

  public play(name: 'step' | 'interact' | 'calendar' | 'warning' | 'snap' | 'slash' | 'hit' | 'dodge' | 'revive' | 'cash' | 'stamp' | 'scooter'): void {
    if (!this.unlocked) return;
    switch (name) {
      case 'step': this.tone(85, 0.07, 'triangle', 0.035, 65); break;
      case 'interact': this.tone(440, 0.08, 'triangle', 0.035, 330); break;
      case 'calendar': this.noise(0.3, 0.08, 420); this.tone(160, 0.3, 'sawtooth', 0.06, 80); break;
      case 'warning': this.tone(92, 0.5, 'sine', 0.12, 58); break;
      case 'snap': this.noise(0.16, 0.13, 700); this.tone(180, 0.18, 'square', 0.08, 90); break;
      case 'slash': this.tone(145, 0.24, 'sawtooth', 0.11, 60); this.noise(0.13, 0.06, 850); break;
      case 'hit': this.tone(78, 0.24, 'sine', 0.18, 42); this.noise(0.11, 0.08, 320); break;
      case 'dodge': this.noise(0.18, 0.04, 900); this.tone(130, 0.18, 'triangle', 0.05, 70); break;
      case 'revive': this.tone(220, 0.6, 'sine', 0.12, 440); this.tone(110, 0.45, 'triangle', 0.08, 220); break;
      case 'cash': this.tone(740, 0.05, 'square', 0.045, 620); break;
      case 'stamp': this.tone(64, 0.42, 'sine', 0.2, 36); this.noise(0.25, 0.1, 280); break;
      case 'scooter': this.tone(110, 0.8, 'sawtooth', 0.035, 75); break;
    }
  }

  public setBreathMuffle(active: boolean): void {
    if (!this.context || !this.filter || !this.unlocked) return;
    const time = this.context.currentTime;
    const frequency = active ? 320 : 1500;
    this.filter.frequency.cancelScheduledValues(time);
    this.filter.frequency.setTargetAtTime(frequency, time, 0.22);
    if (active) this.tone(65, 0.1, 'sine', 0.045);
  }

  public startOverclockRock(): void {
    if (!this.unlocked || this.rockTimer) return;
    this.rockStep = 0;
    const beatMs = 60000 / 135 / 2;
    this.rockTimer = window.setInterval(() => {
      const bass = [55, 55, 73, 65, 49, 49, 65, 73][this.rockStep % 8] ?? 55;
      this.tone(bass, 0.17, 'sawtooth', 0.11, bass * 0.72);
      if (this.rockStep % 4 === 2) this.noise(0.11, 0.07, 1100);
      if (this.rockStep % 8 === 0 || this.rockStep % 8 === 4) this.tone(48, 0.12, 'sine', 0.15, 38);
      this.rockStep += 1;
    }, beatMs);
  }

  public stopOverclockRock(): void {
    if (this.rockTimer) window.clearInterval(this.rockTimer);
    this.rockTimer = 0;
  }

  public setMasterVolume(value: number): void {
    this.volume = Math.max(0, Math.min(0.5, value));
    if (this.context && this.master) this.master.gain.setTargetAtTime(this.volume, this.context.currentTime, 0.08);
  }

  public destroy(): void {
    this.stopOverclockRock();
    if (this.scooterTimer) window.clearInterval(this.scooterTimer);
    this.scooterTimer = 0;
    for (const node of this.ambienceNodes) {
      if (node instanceof OscillatorNode) { try { node.stop(); } catch { /* Already stopped. */ } }
      node.disconnect();
    }
    this.ambienceNodes = [];
    if (this.context && this.context.state !== 'closed') void this.context.close();
    this.context = null;
  }
}
