/**
 * Web Audio API synthesizer for Glow Well.
 * Synthesizes cave ambient drones, water droplets, jumps, bubbles, bounces, and mystery jingles.
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  public isMuted: boolean = false;
  private ambientInterval: number | null = null;

  // Dynamic proximity ambient nodes
  private proximityMasterGain: GainNode | null = null;
  private proximityFilter: BiquadFilterNode | null = null;
  private proximityDroneOsc: OscillatorNode | null = null;
  private proximityShimmerOsc: OscillatorNode | null = null;
  private proximityShimmerGain: GainNode | null = null;
  private proximityActive: boolean = false;
  private currentSceneRoom: string = '0,1';

  public init() {
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    this.startAmbient();
    this.initProximitySynth();
  }

  /**
   * Adapts environmental acoustics based on the current room context.
   */
  public setSceneRoom(roomKey: string) {
    this.currentSceneRoom = roomKey;
  }

  private getSceneStoneMultiplier(): number {
    switch (this.currentSceneRoom) {
      case '0,0': // Ancient Altar: quiet, reverent stone acoustics
        return 0.75;
      case '0,1': // Glow Springs: soft mossy stone
        return 0.85;
      case '1,0': // Switch Chamber: resonant stone echo
        return 1.15;
      case '1,1': // Abyssal Cavern: heavy, deep stone reverberation
        return 1.25;
      default:
        return 1.0;
    }
  }

  private getSceneWaterMultiplier(): number {
    switch (this.currentSceneRoom) {
      case '0,1': // Glow Springs: immediate water pool proximity, rich aquatic resonance
        return 1.35;
      case '1,1': // Abyssal cavern: distant dripping
        return 0.9;
      default:
        return 0.75;
    }
  }

  private initProximitySynth() {
    if (this.proximityActive || !this.ctx) return;
    try {
      // Continuous background proximity synthesizer
      this.proximityMasterGain = this.ctx.createGain();
      this.proximityMasterGain.gain.setValueAtTime(0.0001, this.ctx.currentTime);

      this.proximityFilter = this.ctx.createBiquadFilter();
      this.proximityFilter.type = 'lowpass';
      this.proximityFilter.frequency.setValueAtTime(140, this.ctx.currentTime);
      this.proximityFilter.Q.setValueAtTime(4.5, this.ctx.currentTime);

      // Low resonant cavern hum
      this.proximityDroneOsc = this.ctx.createOscillator();
      this.proximityDroneOsc.type = 'triangle';
      this.proximityDroneOsc.frequency.setValueAtTime(65.4, this.ctx.currentTime); // C2

      // High shimmering overtone that opens up near secrets
      this.proximityShimmerOsc = this.ctx.createOscillator();
      this.proximityShimmerOsc.type = 'sine';
      this.proximityShimmerOsc.frequency.setValueAtTime(523.25, this.ctx.currentTime); // C5

      this.proximityShimmerGain = this.ctx.createGain();
      this.proximityShimmerGain.gain.setValueAtTime(0.0001, this.ctx.currentTime);

      this.proximityDroneOsc.connect(this.proximityFilter);
      this.proximityShimmerOsc.connect(this.proximityShimmerGain);
      this.proximityShimmerGain.connect(this.proximityFilter);

      this.proximityFilter.connect(this.proximityMasterGain);
      this.proximityMasterGain.connect(this.ctx.destination);

      this.proximityDroneOsc.start();
      this.proximityShimmerOsc.start();
      this.proximityActive = true;
    } catch {
      // Audio safety
    }
  }

  /**
   * Updates dynamic ambient intensity based on player proximity to eggs & creatures.
   * @param minDistance - Closest distance in pixels to an uncollected egg or undiscovered creature
   */
  public updateProximity(minDistance: number) {
    if (this.isMuted || !this.ctx || !this.proximityMasterGain || !this.proximityFilter || !this.proximityShimmerGain) {
      return;
    }

    try {
      const now = this.ctx.currentTime;
      // Proximity factor: 0 when far (>= 220px), 1 when right next to secret (<= 25px)
      const maxRange = 220;
      const minRange = 25;
      const clampedDist = Math.max(minRange, Math.min(maxRange, minDistance));
      const proximityFactor = 1 - (clampedDist - minRange) / (maxRange - minRange);

      if (proximityFactor > 0.05) {
        // Master gain smoothly swells
        const targetMasterGain = 0.02 + proximityFactor * 0.12;
        this.proximityMasterGain.gain.setTargetAtTime(targetMasterGain, now, 0.15);

        // Lowpass filter opens up as you get closer, revealing high shimmering overtones
        const targetFreq = 140 + Math.pow(proximityFactor, 1.8) * 1600;
        this.proximityFilter.frequency.setTargetAtTime(targetFreq, now, 0.15);

        // Shimmer oscillator swells and glissandos softly
        const targetShimmerGain = proximityFactor * 0.08;
        this.proximityShimmerGain.gain.setTargetAtTime(targetShimmerGain, now, 0.15);

        // Shimmer harmonic notes (C5 -> E5 -> G5 -> B5)
        const shimmerPitches = [523.25, 659.25, 783.99, 987.77];
        const pitchIdx = Math.min(3, Math.floor(proximityFactor * 4));
        this.proximityShimmerOsc?.frequency.setTargetAtTime(shimmerPitches[pitchIdx], now, 0.25);
      } else {
        // Fade out quietly when far
        this.proximityMasterGain.gain.setTargetAtTime(0.0001, now, 0.4);
        this.proximityShimmerGain.gain.setTargetAtTime(0.0001, now, 0.4);
        this.proximityFilter.frequency.setTargetAtTime(140, now, 0.4);
      }
    } catch {
      // Audio safety
    }
  }

  public playFootstepRock(volumeScale = 1.0) {
    if (this.isMuted || !this.ctx) return;
    try {
      // Very soft, textured stone scuff / tap
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(420, this.ctx.currentTime);

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(105 + Math.random() * 35, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(45, this.ctx.currentTime + 0.05);

      // Volume scaled by velocity and current scene room acoustics
      const targetGain = 0.042 * Math.max(0.2, volumeScale) * this.getSceneStoneMultiplier();
      gain.gain.setValueAtTime(targetGain, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.0001, this.ctx.currentTime + 0.05);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.05);
    } catch {
      // Audio safety
    }
  }

  /**
   * Material friction sound for sliding against rocky walls, firm landings, or brushing stone blocks.
   */
  public playStoneScrape(intensity = 1.0) {
    if (this.isMuted || !this.ctx) return;
    try {
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(360 + Math.random() * 80, this.ctx.currentTime);
      filter.Q.setValueAtTime(2.8, this.ctx.currentTime);

      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(85 + Math.random() * 20, this.ctx.currentTime);
      osc1.frequency.linearRampToValueAtTime(60, this.ctx.currentTime + 0.08);

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(140 + Math.random() * 40, this.ctx.currentTime);
      osc2.frequency.linearRampToValueAtTime(90, this.ctx.currentTime + 0.08);

      const targetGain = 0.05 * Math.min(1.5, Math.max(0.2, intensity)) * this.getSceneStoneMultiplier();
      gain.gain.setValueAtTime(targetGain, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.0001, this.ctx.currentTime + 0.08);

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc1.start();
      osc2.start();
      osc1.stop(this.ctx.currentTime + 0.08);
      osc2.stop(this.ctx.currentTime + 0.08);
    } catch {
      // Audio safety
    }
  }

  public playWaterRipple(intensity = 1.0) {
    if (this.isMuted || !this.ctx) return;
    try {
      // Soft organic liquid droplet / ripple bubbling sound adjusted to scene
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      const baseFreq = 340 + Math.random() * 90;
      osc.frequency.setValueAtTime(baseFreq, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.45, this.ctx.currentTime + 0.04);
      osc.frequency.exponentialRampToValueAtTime(180, this.ctx.currentTime + 0.09);

      const targetGain = 0.055 * Math.max(0.3, intensity) * this.getSceneWaterMultiplier();
      gain.gain.setValueAtTime(targetGain, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.0001, this.ctx.currentTime + 0.09);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.09);
    } catch {
      // Audio safety
    }
  }

  public playAchievement() {
    if (this.isMuted || !this.ctx) return;
    try {
      // Grand ethereal triumph fanfare chord
      const chords = [523.25, 659.25, 783.99, 1046.5, 1318.51];
      chords.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        const start = this.ctx.currentTime + idx * 0.07;
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.14, start);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.55);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(start);
        osc.stop(start + 0.55);
      });
    } catch {
      // Audio safety
    }
  }

  public playPlatformDepress() {
    if (this.isMuted || !this.ctx) return;
    try {
      // Heavy mechanical stone rumble and deep click
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(95, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(35, this.ctx.currentTime + 0.35);

      gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.35);
    } catch {
      // Audio safety
    }
  }

  public playPathUnlock() {
    if (this.isMuted || !this.ctx) return;
    try {
      // Resonant deep stone portal unlocking chord
      const freqs = [174.61, 220.0, 261.63, 349.23];
      freqs.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        const start = this.ctx.currentTime + idx * 0.07;
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.16, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.65);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(start);
        osc.stop(start + 0.65);
      });
    } catch {
      // Audio safety
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.isMuted) {
      this.stopAmbient();
      if (this.proximityMasterGain && this.ctx) {
        this.proximityMasterGain.gain.setValueAtTime(0.0001, this.ctx.currentTime);
      }
    } else {
      this.init();
    }
    return this.isMuted;
  }

  public playJump() {
    if (this.isMuted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(160, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(360, this.ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.12);
    } catch {
      // Audio safety
    }
  }

  public playBubble() {
    if (this.isMuted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(420, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(180, this.ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.15);
    } catch {
      // Audio safety
    }
  }

  public playBounce() {
    if (this.isMuted || !this.ctx) return;
    try {
      // Dual oscillator for rich bouncy bubble pop & spring
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(220, this.ctx.currentTime);
      osc1.frequency.exponentialRampToValueAtTime(620, this.ctx.currentTime + 0.2);

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(440, this.ctx.currentTime);
      osc2.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 0.16);

      gain.gain.setValueAtTime(0.28, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.ctx.destination);

      osc1.start();
      osc2.start();
      osc1.stop(this.ctx.currentTime + 0.2);
      osc2.stop(this.ctx.currentTime + 0.2);
    } catch {
      // Audio safety
    }
  }

  public playSwitch() {
    if (this.isMuted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(260, this.ctx.currentTime);
      osc.frequency.setValueAtTime(390, this.ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 0.22);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.22);
    } catch {
      // Audio safety
    }
  }

  public playEgg() {
    if (this.isMuted || !this.ctx) return;
    try {
      // Magical Animal Well style mystical arpeggio
      const freqs = [523.25, 659.25, 783.99, 1046.5, 1318.5];
      freqs.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        const startTime = this.ctx.currentTime + idx * 0.08;
        osc.frequency.setValueAtTime(freq, startTime);
        gain.gain.setValueAtTime(0.18, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.45);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(startTime);
        osc.stop(startTime + 0.45);
      });
    } catch {
      // Audio safety
    }
  }

  public playWin() {
    if (this.isMuted || !this.ctx) return;
    try {
      // Grand ethereal chord
      const chords = [392.0, 523.25, 659.25, 783.99, 1046.5];
      chords.forEach((freq) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 2.5);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 2.5);
      });
    } catch {
      // Audio safety
    }
  }

  public playCreatureDiscovery() {
    if (this.isMuted || !this.ctx) return;
    try {
      // Ethereal mystical chord for discovering a creature
      const notes = [659.25, 830.61, 987.77, 1318.51];
      notes.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        const start = this.ctx.currentTime + idx * 0.08;
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.12, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.4);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(start);
        osc.stop(start + 0.4);
      });
    } catch {
      // Audio safety
    }
  }

  public playCroak() {
    if (this.isMuted || !this.ctx) return;
    try {
      // Organic frog resonant throat croak
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(340, this.ctx.currentTime);
      filter.Q.setValueAtTime(3.8, this.ctx.currentTime);

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(140, this.ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(195, this.ctx.currentTime + 0.05);
      osc.frequency.linearRampToValueAtTime(115, this.ctx.currentTime + 0.17);

      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 0.17);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.17);
    } catch {
      // Audio safety
    }
  }

  public playPush() {
    if (this.isMuted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(80, this.ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(60, this.ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 0.1);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.1);
    } catch {
      // Audio safety
    }
  }

  public playBreak() {
    if (this.isMuted || !this.ctx) return;
    try {
      // Noise burst + low boom for rock crumbling
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(140, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.25);
      gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.25);
    } catch {
      // Audio safety
    }
  }

  public playSave() {
    if (this.isMuted || !this.ctx) return;
    try {
      // Animal Well Telephone / Shrine chime
      const notes = [440, 554.37, 659.25, 880];
      notes.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        const start = this.ctx.currentTime + idx * 0.07;
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.14, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.35);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(start);
        osc.stop(start + 0.35);
      });
    } catch {
      // Audio safety
    }
  }

  public playSplash() {
    if (this.isMuted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(320, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(120, this.ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 0.1);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.1);
    } catch {
      // Audio safety
    }
  }

  private startAmbient() {
    if (this.ambientInterval) return;
    this.ambientInterval = window.setInterval(() => {
      if (this.isMuted || !this.ctx) return;
      // Occasional subterranean water droplet / resonant bell
      if (Math.random() > 0.45) {
        try {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          const notes = [440, 554.37, 659.25, 880, 987.77];
          const note = notes[Math.floor(Math.random() * notes.length)];
          osc.type = 'sine';
          osc.frequency.setValueAtTime(note, this.ctx.currentTime);
          gain.gain.setValueAtTime(0.025, this.ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 1.2);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start();
          osc.stop(this.ctx.currentTime + 1.2);
        } catch {
          // ignore
        }
      }
    }, 2800);
  }

  private stopAmbient() {
    if (this.ambientInterval) {
      clearInterval(this.ambientInterval);
      this.ambientInterval = null;
    }
  }
}

export const AudioEngine = new SoundEngine();
