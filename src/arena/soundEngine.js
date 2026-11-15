// Procedural Web Audio Sound Effects & Dynamic Music Sequencer for Arena Hero 5.0

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.masterSfxGain = null;
    this.masterBgmGain = null;
    this.noiseBuffer = null;

    this.enabled = true;
    this.volume = 0.45;
    this.musicEnabled = true;
    this.musicVolume = 0.35;

    this.musicMode = "off"; // "off" | "menu" | "battle" | "boss" | "paused"
    this.bgmTimerId = null;
    this.nextNoteTime = 0;
    this.stepIndex = 0;
    this.unlocked = false;
    this.lastCooldowns = new Map();

    if (typeof window !== "undefined") {
      const unlockHandler = () => {
        this.unlocked = true;
        const ctx = this.ensureContext(true);
        if (ctx && this.musicEnabled && this.musicMode !== "off" && this.musicMode !== "paused" && !this.bgmTimerId) {
          this.startMusicLoop();
        }
      };
      window.addEventListener("pointerdown", unlockHandler, { passive: true });
      window.addEventListener("keydown", unlockHandler, { passive: true });
      window.addEventListener("touchstart", unlockHandler, { passive: true });
    }
  }

  canThrottle(key, minGapMs = 60) {
    const now = performance.now();
    const prev = this.lastCooldowns.get(key) || 0;
    if (now - prev < minGapMs) return true;
    this.lastCooldowns.set(key, now);
    return false;
  }

  ensureContext(forceForMusic = false) {
    if (!forceForMusic && !this.enabled) return null;
    if (forceForMusic && !this.enabled && !this.musicEnabled) return null;
    if (typeof window === "undefined") return null;
    try {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return null;
        this.ctx = new AudioCtx();

        this.masterSfxGain = this.ctx.createGain();
        this.masterSfxGain.gain.value = this.enabled ? this.volume : 0;
        this.masterSfxGain.connect(this.ctx.destination);

        this.masterBgmGain = this.ctx.createGain();
        this.masterBgmGain.gain.value = this.musicEnabled ? this.musicVolume * 0.42 : 0;
        this.masterBgmGain.connect(this.ctx.destination);

        this.noiseBuffer = this.createNoiseBuffer(this.ctx, 1.5);
      }
      if (this.ctx.state === "suspended") {
        this.ctx.resume().catch(() => {});
      }
      return this.ctx;
    } catch {
      return null;
    }
  }

  syncVolumes() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    try {
      if (this.masterSfxGain) {
        this.masterSfxGain.gain.setTargetAtTime(this.enabled ? this.volume : 0, now, 0.02);
      }
      if (this.masterBgmGain) {
        const pausedScale = this.musicMode === "paused" ? 0.25 : 1;
        const targetBgm =
          this.musicEnabled && this.musicMode !== "off"
            ? this.musicVolume * 0.42 * pausedScale
            : 0;
        this.masterBgmGain.gain.setTargetAtTime(targetBgm, now, 0.06);
      }
    } catch {
      // Ignore AudioParam errors
    }
  }

  setSfxEnabled(val) {
    this.enabled = !!val;
    this.syncVolumes();
  }

  setSfxVolume(val) {
    this.volume = Math.max(0, Math.min(1, Number(val) || 0));
    this.syncVolumes();
  }

  setMusicEnabled(val) {
    this.musicEnabled = !!val;
    this.syncVolumes();
    if (this.musicEnabled && this.musicMode !== "off" && this.musicMode !== "paused") {
      this.startMusicLoop();
    } else if (!this.musicEnabled) {
      this.stopMusicLoop();
    }
  }

  setMusicVolume(val) {
    this.musicVolume = Math.max(0, Math.min(1, Number(val) || 0));
    this.syncVolumes();
  }

  setMusicMode(mode) {
    if (this.musicMode === mode) return;
    const prevMode = this.musicMode;
    this.musicMode = mode;
    this.syncVolumes();
    if (mode === "off") {
      this.stopMusicLoop();
      return;
    }
    if (mode === "paused") {
      return;
    }
    if (prevMode === "off" || prevMode === "paused" || prevMode !== mode) {
      if (prevMode !== mode && prevMode !== "paused") {
        this.stepIndex = 0;
      }
      if (this.musicEnabled) {
        this.startMusicLoop();
      }
    }
  }

  createNoiseBuffer(ctx, durationSec = 1.5) {
    const sampleRate = ctx.sampleRate || 44100;
    const length = Math.floor(sampleRate * durationSec);
    const buffer = ctx.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99765 * b0 + white * 0.099046;
      b1 = 0.963 * b1 + white * 0.2965164;
      b2 = 0.57 * b2 + white * 1.0526913;
      data[i] = Math.max(-1, Math.min(1, (b0 + b1 + b2 + white * 0.1848) * 0.24));
    }
    return buffer;
  }

  // =========================================================
  // PROCEDURAL DYNAMIC BGM SEQUENCER
  // =========================================================

  startMusicLoop() {
    if (this.bgmTimerId || !this.musicEnabled) return;
    const ctx = this.ensureContext(true);
    if (!ctx) return;
    this.nextNoteTime = ctx.currentTime + 0.06;
    this.bgmTimerId = setInterval(() => this.scheduleMusicSteps(), 90);
  }

  stopMusicLoop() {
    if (this.bgmTimerId) {
      clearInterval(this.bgmTimerId);
      this.bgmTimerId = null;
    }
  }

  midiToFreq(midi) {
    return 440 * Math.pow(2, (midi - 69) / 12);
  }

  playMusicNote(freq, time, dur, type = "triangle", gainAmt = 0.12, filterFreq = 2200) {
    if (!this.ctx || !this.masterBgmGain || !this.musicEnabled) return;
    try {
      const osc = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, time);
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(filterFreq, time);
      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.linearRampToValueAtTime(gainAmt, time + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + dur);
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterBgmGain);
      osc.start(time);
      osc.stop(time + dur + 0.02);
    } catch {
      // Ignore
    }
  }

  playMusicDrum(kind, time) {
    if (!this.ctx || !this.masterBgmGain || !this.musicEnabled) return;
    try {
      if (kind === "kick") {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(135, time);
        osc.frequency.exponentialRampToValueAtTime(38, time + 0.14);
        gain.gain.setValueAtTime(0.32, time);
        gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.16);
        osc.connect(gain);
        gain.connect(this.masterBgmGain);
        osc.start(time);
        osc.stop(time + 0.18);
      } else if (kind === "snare" && this.noiseBuffer) {
        const src = this.ctx.createBufferSource();
        src.buffer = this.noiseBuffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = "bandpass";
        filter.frequency.setValueAtTime(1800, time);
        filter.Q.setValueAtTime(0.9, time);
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.16, time);
        gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.12);
        src.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterBgmGain);
        src.start(time, 0, 0.13);
      } else if (kind === "hat" && this.noiseBuffer) {
        const src = this.ctx.createBufferSource();
        src.buffer = this.noiseBuffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = "highpass";
        filter.frequency.setValueAtTime(6500, time);
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.055, time);
        gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.045);
        src.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterBgmGain);
        src.start(time, 0, 0.05);
      }
    } catch {
      // Ignore
    }
  }

  scheduleMusicSteps() {
    if (!this.ctx || !this.musicEnabled) return;
    if (this.musicMode === "off" || this.musicMode === "paused") return;
    if (this.ctx.state !== "running") return;

    const bpm = this.musicMode === "boss" ? 148 : this.musicMode === "battle" ? 132 : 96;
    const sixteenth = 60 / bpm / 4;
    const lookahead = 0.24;

    if (this.nextNoteTime < this.ctx.currentTime - 0.5) {
      this.nextNoteTime = this.ctx.currentTime + 0.05;
    }

    while (this.nextNoteTime < this.ctx.currentTime + lookahead) {
      this.triggerBgmStep(this.stepIndex, this.nextNoteTime, sixteenth);
      this.nextNoteTime += sixteenth;
      this.stepIndex = (this.stepIndex + 1) % 32;
    }
  }

  triggerBgmStep(step, t, stepDur) {
    if (this.musicMode === "menu") {
      // Atmospheric Dorian heroic menu theme (D minor / C / Bb / A)
      const bassProg = [38, 38, 38, 38, 36, 36, 36, 36, 34, 34, 34, 34, 33, 33, 33, 33];
      const arpNotes = [62, 69, 74, 72, 69, 65, 67, 69, 60, 67, 72, 70, 69, 64, 65, 69];
      if (step % 2 === 0) {
        const idx = (step >> 1) % 16;
        if (step % 8 === 0) {
          this.playMusicNote(this.midiToFreq(bassProg[idx]), t, stepDur * 7.5, "triangle", 0.16, 480);
          this.playMusicNote(this.midiToFreq(bassProg[idx] + 19), t, stepDur * 7.5, "sine", 0.08, 900);
        }
        this.playMusicNote(this.midiToFreq(arpNotes[idx]), t, stepDur * 2.2, "sine", 0.095, 2400);
      }
      return;
    }

    if (this.musicMode === "battle") {
      // Driving heroic MOBA combat theme in D minor
      const bassSeq = [
        38, 0, 38, 0, 38, 0, 41, 0,
        36, 0, 36, 0, 36, 0, 39, 0,
        34, 0, 34, 0, 34, 0, 38, 0,
        33, 0, 33, 0, 36, 0, 40, 0,
      ];
      const leadSeq = [
        62, 0, 65, 69, 0, 67, 65, 0,
        64, 0, 67, 72, 0, 70, 69, 0,
        62, 0, 65, 70, 0, 69, 67, 0,
        64, 65, 69, 0, 72, 0, 70, 69,
      ];
      if (step % 4 === 0) this.playMusicDrum("kick", t);
      if (step % 8 === 4) this.playMusicDrum("snare", t);
      if (step % 2 === 1) this.playMusicDrum("hat", t);

      const bass = bassSeq[step];
      if (bass > 0) {
        this.playMusicNote(this.midiToFreq(bass), t, stepDur * 1.8, "sawtooth", 0.12, 620);
      }
      const lead = leadSeq[step];
      if (lead > 0) {
        this.playMusicNote(this.midiToFreq(lead), t, stepDur * 1.7, "triangle", 0.1, 2600);
      }
      if (step % 8 === 0) {
        const root = bass || 38;
        this.playMusicNote(this.midiToFreq(root + 12), t, stepDur * 5, "sine", 0.07, 1200);
        this.playMusicNote(this.midiToFreq(root + 19), t, stepDur * 5, "sine", 0.055, 1400);
      }
      return;
    }

    if (this.musicMode === "boss") {
      // Intense dramatic Boss theme in C# Phrygian / Harmonic Minor
      const bassSeq = [
        37, 37, 0, 37, 37, 0, 38, 0,
        37, 37, 0, 37, 40, 0, 38, 0,
        35, 35, 0, 35, 37, 0, 38, 0,
        40, 0, 38, 0, 37, 0, 36, 0,
      ];
      const leadSeq = [
        61, 0, 62, 65, 68, 0, 65, 62,
        61, 0, 64, 68, 73, 0, 72, 68,
        62, 0, 65, 69, 74, 0, 73, 69,
        68, 65, 64, 62, 61, 0, 60, 0,
      ];
      if (step % 4 === 0 || step % 16 === 6 || step % 16 === 14) this.playMusicDrum("kick", t);
      if (step % 8 === 4) this.playMusicDrum("snare", t);
      this.playMusicDrum("hat", t);

      const bass = bassSeq[step];
      if (bass > 0) {
        this.playMusicNote(this.midiToFreq(bass), t, stepDur * 1.4, "sawtooth", 0.145, 760);
      }
      const lead = leadSeq[step];
      if (lead > 0) {
        this.playMusicNote(this.midiToFreq(lead), t, stepDur * 1.5, "sawtooth", 0.085, 2100);
        this.playMusicNote(this.midiToFreq(lead - 12), t, stepDur * 1.5, "triangle", 0.06, 1300);
      }
      if (step % 8 === 0) {
        const chordRoot = step < 16 ? 49 : step < 24 ? 50 : 48;
        this.playMusicNote(this.midiToFreq(chordRoot), t, stepDur * 6.5, "sawtooth", 0.05, 880);
        this.playMusicNote(this.midiToFreq(chordRoot + 7), t, stepDur * 6.5, "sawtooth", 0.045, 950);
      }
    }
  }

  // =========================================================
  // CORE SYNTH HELPERS FOR SFX
  // =========================================================

  playTone(startFreq, endFreq, duration, type = "sine", vol = 0.25, delay = 0) {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterSfxGain) return;
    try {
      const now = ctx.currentTime + delay;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(Math.max(25, startFreq), now);
      osc.frequency.exponentialRampToValueAtTime(Math.max(25, endFreq), now + duration);
      const peak = Math.max(0.001, vol);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(peak, now + Math.min(0.014, duration * 0.25));
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      osc.connect(gain);
      gain.connect(this.masterSfxGain);
      osc.start(now);
      osc.stop(now + duration + 0.025);
    } catch {
      // Ignore
    }
  }

  playFilteredNoise({
    duration = 0.25,
    delay = 0,
    filterType = "bandpass",
    freqStart = 800,
    freqEnd = 400,
    q = 1.4,
    gainPeak = 0.24,
    attack = 0.015,
  } = {}) {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterSfxGain || !this.noiseBuffer) return;
    try {
      const now = ctx.currentTime + delay;
      const src = ctx.createBufferSource();
      src.buffer = this.noiseBuffer;
      const filter = ctx.createBiquadFilter();
      filter.type = filterType;
      filter.Q.setValueAtTime(q, now);
      filter.frequency.setValueAtTime(Math.max(40, freqStart), now);
      filter.frequency.exponentialRampToValueAtTime(Math.max(40, freqEnd), now + duration);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(Math.max(0.001, gainPeak), now + Math.min(attack, duration * 0.4));
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      src.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterSfxGain);
      const offset = Math.random() * 0.5;
      src.start(now, offset, duration + 0.03);
    } catch {
      // Ignore
    }
  }

  // =========================================================
  // UI & SYSTEM SOUNDS
  // =========================================================

  playClick() {
    this.playTone(540, 740, 0.06, "triangle", 0.16);
  }

  playCoin() {
    this.playTone(987, 1318, 0.08, "sine", 0.2);
    this.playTone(1318, 1760, 0.12, "sine", 0.18, 0.05);
  }

  playBuy() {
    this.playTone(523, 659, 0.09, "triangle", 0.18);
    this.playTone(659, 1046, 0.14, "sine", 0.2, 0.07);
  }

  playUpgrade() {
    this.playTone(440, 660, 0.1, "sawtooth", 0.15);
    this.playTone(660, 880, 0.12, "triangle", 0.2, 0.06);
    this.playTone(880, 1320, 0.2, "sine", 0.25, 0.12);
  }

  playFanfare() {
    this.playTone(523, 659, 0.15, "triangle", 0.22);
    this.playTone(659, 784, 0.15, "triangle", 0.22, 0.12);
    this.playTone(784, 1046, 0.35, "triangle", 0.26, 0.24);
  }

  playHeal() {
    if (this.canThrottle("heal", 160)) return;
    this.playTone(523, 659, 0.11, "sine", 0.14);
    this.playTone(659, 988, 0.16, "sine", 0.13, 0.06);
  }

  playLevelUp() {
    this.playTone(440, 554, 0.14, "triangle", 0.2);
    this.playTone(554, 659, 0.14, "triangle", 0.2, 0.1);
    this.playTone(659, 880, 0.24, "triangle", 0.22, 0.2);
  }

  playHit() {
    if (this.canThrottle("hit", 65)) return;
    this.playTone(170, 72, 0.06, "square", 0.09);
    this.playFilteredNoise({ duration: 0.05, filterType: "lowpass", freqStart: 900, freqEnd: 240, gainPeak: 0.1 });
  }

  // =========================================================
  // ELEMENTAL & HERO-SPECIFIC SKILL / BOSS SOUNDS
  // =========================================================

  // --- WIND / STORM (Kin, Boss Màn 9 C2) ---
  playWind(duration = 0.28, gainPeak = 0.22) {
    this.playFilteredNoise({
      duration,
      filterType: "bandpass",
      freqStart: 420,
      freqEnd: 1350,
      q: 2.2,
      gainPeak,
      attack: 0.04,
    });
    this.playFilteredNoise({
      duration: duration * 0.9,
      delay: 0.04,
      filterType: "bandpass",
      freqStart: 1200,
      freqEnd: 380,
      q: 1.8,
      gainPeak: gainPeak * 0.7,
      attack: 0.05,
    });
  }

  playBow() {
    this.playTone(520, 210, 0.09, "triangle", 0.16);
    this.playFilteredNoise({ duration: 0.11, filterType: "bandpass", freqStart: 1600, freqEnd: 650, q: 2.4, gainPeak: 0.14 });
  }

  playWhirlwind() {
    this.playWind(0.45, 0.26);
    this.playTone(360, 880, 0.28, "sine", 0.18);
    this.playTone(720, 420, 0.26, "triangle", 0.12, 0.12);
  }

  playTornadoStorm() {
    this.playWind(0.65, 0.3);
    this.playTone(280, 960, 0.36, "sine", 0.18);
    for (let i = 0; i < 4; i++) {
      this.playFilteredNoise({
        duration: 0.12,
        delay: i * 0.11,
        filterType: "bandpass",
        freqStart: 2200,
        freqEnd: 900,
        q: 2.0,
        gainPeak: 0.14,
      });
    }
  }

  // --- ICE / FROST SHATTER (Éo Hyên, Trung C1, Boss Màn 9) ---
  playIce() {
    this.playTone(1180, 620, 0.12, "sine", 0.17);
    this.playTone(1760, 1320, 0.1, "triangle", 0.12, 0.02);
    this.playFilteredNoise({ duration: 0.12, filterType: "highpass", freqStart: 3200, freqEnd: 1800, q: 1.4, gainPeak: 0.14 });
  }

  playIceSlash() {
    this.playSlash();
    this.playTone(1480, 920, 0.12, "sine", 0.15);
    this.playFilteredNoise({ duration: 0.14, filterType: "highpass", freqStart: 3600, freqEnd: 2200, q: 1.6, gainPeak: 0.15 });
  }

  playIceShatter() {
    if (this.canThrottle("iceShatter", 70)) return;
    this.playFilteredNoise({ duration: 0.22, filterType: "highpass", freqStart: 4200, freqEnd: 1900, q: 2.2, gainPeak: 0.26 });
    this.playTone(2400, 1450, 0.09, "triangle", 0.15);
    this.playTone(3100, 1980, 0.1, "sine", 0.14, 0.03);
    this.playTone(1850, 1120, 0.11, "sine", 0.14, 0.06);
  }

  playIceShield() {
    this.playTone(880, 1320, 0.2, "sine", 0.17);
    this.playTone(1320, 1760, 0.22, "triangle", 0.13, 0.04);
    this.playFilteredNoise({ duration: 0.2, filterType: "bandpass", freqStart: 2800, freqEnd: 4200, q: 2.8, gainPeak: 0.14 });
  }

  playIceStorm() {
    this.playWind(0.5, 0.22);
    this.playIceShatter();
    this.playTone(1560, 980, 0.26, "sine", 0.14, 0.08);
  }

  // --- FIRE / DRAGON / METEOR (Long Hói, Danh, Trung C3, Boss Màn 6) ---
  playFire(duration = 0.34, gainPeak = 0.26) {
    this.playFilteredNoise({
      duration,
      filterType: "bandpass",
      freqStart: 620,
      freqEnd: 260,
      q: 1.0,
      gainPeak,
      attack: 0.02,
    });
    this.playTone(190, 75, duration * 0.85, "sawtooth", 0.15);
  }

  playFireball() {
    this.playTone(320, 88, 0.3, "sawtooth", 0.22);
    this.playTone(180, 58, 0.34, "triangle", 0.18, 0.03);
    this.playFire(0.32, 0.24);
  }

  playFox() {
    this.playTone(540, 840, 0.13, "triangle", 0.17);
    this.playTone(920, 1320, 0.1, "sine", 0.12);
    this.playFilteredNoise({ duration: 0.14, filterType: "bandpass", freqStart: 1200, freqEnd: 520, q: 1.5, gainPeak: 0.15 });
  }

  playDragonRoar() {
    this.playTone(150, 62, 0.45, "sawtooth", 0.26);
    this.playTone(230, 84, 0.4, "square", 0.12, 0.03);
    this.playFire(0.48, 0.3);
  }

  // --- LIGHTNING / ELECTRIC SHOCK (Dũng, Boss Màn 12 & 15) ---
  playSpear() {
    this.playTone(460, 145, 0.1, "sawtooth", 0.16);
    this.playTone(960, 340, 0.08, "sine", 0.12);
    this.playFilteredNoise({ duration: 0.08, filterType: "highpass", freqStart: 2200, freqEnd: 1100, q: 1.4, gainPeak: 0.1 });
  }

  playElectricZap() {
    if (this.canThrottle("zap", 65)) return;
    this.playTone(1450, 240, 0.14, "sawtooth", 0.18);
    this.playTone(880, 170, 0.16, "square", 0.11, 0.02);
    this.playFilteredNoise({ duration: 0.15, filterType: "bandpass", freqStart: 3600, freqEnd: 1400, q: 3.0, gainPeak: 0.24 });
  }

  playLightning() {
    this.playElectricZap();
    this.playTone(220, 48, 0.28, "sawtooth", 0.2);
    this.playFilteredNoise({ duration: 0.26, delay: 0.03, filterType: "lowpass", freqStart: 1100, freqEnd: 240, q: 1.0, gainPeak: 0.24 });
  }

  playThunderStrike() {
    this.playElectricZap();
    this.playTone(160, 36, 0.42, "sawtooth", 0.26, 0.02);
    this.playFilteredNoise({ duration: 0.45, delay: 0.04, filterType: "lowpass", freqStart: 1400, freqEnd: 180, q: 0.9, gainPeak: 0.3 });
  }

  // --- EXPLOSION / EARTH SLAM / ROCK (Gấu, Boss Màn 3, Meteors, Rocket) ---
  playExplosion() {
    if (this.canThrottle("explosion", 55)) return;
    this.playTone(170, 38, 0.34, "sawtooth", 0.25);
    this.playTone(115, 34, 0.38, "triangle", 0.22, 0.02);
    this.playFilteredNoise({ duration: 0.38, filterType: "lowpass", freqStart: 950, freqEnd: 170, q: 0.9, gainPeak: 0.32 });
  }

  playHeavyPunch(step = 0) {
    const base = step === 2 ? 140 : step === 1 ? 175 : 200;
    this.playTone(base, 48, step === 2 ? 0.22 : 0.14, "triangle", 0.26);
    this.playTone(base * 1.6, 65, 0.1, "sawtooth", 0.13);
    this.playFilteredNoise({ duration: 0.14, filterType: "lowpass", freqStart: 1100, freqEnd: 280, q: 1.1, gainPeak: 0.22 });
  }

  playEarthSlam() {
    this.playTone(135, 34, 0.42, "triangle", 0.3);
    this.playTone(95, 30, 0.44, "sawtooth", 0.2, 0.02);
    this.playFilteredNoise({ duration: 0.44, filterType: "lowpass", freqStart: 780, freqEnd: 140, q: 1.1, gainPeak: 0.34 });
  }

  playRockRoll() {
    this.playTone(110, 65, 0.35, "sawtooth", 0.18);
    this.playFilteredNoise({ duration: 0.38, filterType: "lowpass", freqStart: 520, freqEnd: 180, q: 1.4, gainPeak: 0.26 });
  }

  playShieldBlock() {
    this.playTone(280, 520, 0.14, "triangle", 0.22);
    this.playTone(620, 420, 0.18, "sine", 0.16, 0.03);
  }

  // --- SWORD / DAGGER / SHADOW / VOID / COSMIC (Tin, Bảo, Danh, Trung, Đức Cống, Boss 12 & 15) ---
  playSlash() {
    this.playTone(680, 190, 0.09, "sawtooth", 0.16);
    this.playFilteredNoise({ duration: 0.09, filterType: "bandpass", freqStart: 2200, freqEnd: 700, q: 1.5, gainPeak: 0.14 });
  }

  playDaggerSlash(step = 0) {
    const pitch = step === 2 ? 1120 : step === 1 ? 940 : 840;
    this.playTone(pitch, 260, 0.08, "sawtooth", 0.15);
    this.playFilteredNoise({ duration: 0.08, filterType: "highpass", freqStart: 2600, freqEnd: 1200, q: 1.6, gainPeak: 0.14 });
  }

  playHeavySword(step = 0) {
    const pitch = step === 2 ? 420 : 520;
    this.playTone(pitch, 120, 0.15, "sawtooth", 0.2);
    this.playTone(240, 72, 0.16, "triangle", 0.18);
    this.playFilteredNoise({ duration: 0.14, filterType: "bandpass", freqStart: 1500, freqEnd: 420, q: 1.4, gainPeak: 0.19 });
  }

  playDash() {
    this.playTone(260, 660, 0.15, "triangle", 0.2);
    this.playFilteredNoise({ duration: 0.16, filterType: "bandpass", freqStart: 900, freqEnd: 2400, q: 1.8, gainPeak: 0.16 });
  }

  playSmokeVanish() {
    this.playTone(360, 150, 0.18, "sine", 0.18);
    this.playFilteredNoise({ duration: 0.24, filterType: "lowpass", freqStart: 1400, freqEnd: 320, q: 1.2, gainPeak: 0.22 });
  }

  playAmbushSlash() {
    this.playTone(1180, 290, 0.14, "sawtooth", 0.2);
    this.playTone(460, 140, 0.18, "triangle", 0.18);
    this.playFilteredNoise({ duration: 0.14, filterType: "highpass", freqStart: 2400, freqEnd: 950, q: 1.5, gainPeak: 0.2 });
  }

  playDeathSeal() {
    this.playTone(620, 140, 0.22, "sawtooth", 0.22);
    this.playTone(980, 320, 0.2, "sine", 0.16, 0.03);
    this.playFilteredNoise({ duration: 0.2, filterType: "bandpass", freqStart: 2200, freqEnd: 650, q: 2.0, gainPeak: 0.2 });
  }

  playRealmSlash() {
    this.playTone(180, 48, 0.38, "sawtooth", 0.26);
    this.playTone(1360, 260, 0.2, "sawtooth", 0.22, 0.04);
    this.playFilteredNoise({ duration: 0.26, filterType: "bandpass", freqStart: 3200, freqEnd: 800, q: 2.2, gainPeak: 0.24 });
  }

  playOrb() {
    this.playTone(340, 620, 0.13, "sine", 0.16);
    this.playTone(680, 920, 0.1, "triangle", 0.08, 0.02);
  }

  playCosmic() {
    this.playTone(280, 560, 0.18, "sine", 0.2);
    this.playTone(640, 320, 0.15, "sawtooth", 0.1);
  }

  playBlackHole() {
    this.playTone(190, 58, 0.48, "sine", 0.26);
    this.playTone(280, 110, 0.46, "sawtooth", 0.14, 0.04);
    this.playFilteredNoise({ duration: 0.48, filterType: "bandpass", freqStart: 750, freqEnd: 180, q: 2.6, gainPeak: 0.22 });
  }

  playBossWarn() {
    this.playTone(210, 145, 0.26, "sawtooth", 0.2);
    this.playTone(145, 110, 0.28, "triangle", 0.18, 0.08);
  }

  playDragonBreath() {
    if (this.canThrottle("dragonBreath", 85)) return;
    this.playTone(170, 62, 0.34, "sawtooth", 0.22);
    this.playTone(260, 105, 0.28, "triangle", 0.15, 0.02);
    this.playFire(0.36, 0.28);
  }

  playPoisonPool() {
    if (this.canThrottle("poisonPool", 90)) return;
    this.playTone(290, 140, 0.22, "sine", 0.18);
    this.playTone(420, 210, 0.18, "triangle", 0.12, 0.03);
    this.playFilteredNoise({ duration: 0.28, filterType: "bandpass", freqStart: 950, freqEnd: 340, q: 2.2, gainPeak: 0.2 });
  }

  playBloodMoon() {
    if (this.canThrottle("bloodMoon", 90)) return;
    this.playTone(540, 130, 0.3, "sawtooth", 0.21);
    this.playTone(220, 68, 0.34, "triangle", 0.2, 0.03);
    this.playFilteredNoise({ duration: 0.28, filterType: "bandpass", freqStart: 1800, freqEnd: 460, q: 1.8, gainPeak: 0.22 });
  }

  playHolyLight() {
    if (this.canThrottle("holyLight", 90)) return;
    this.playTone(587, 880, 0.22, "sine", 0.2);
    this.playTone(880, 1318, 0.26, "triangle", 0.16, 0.04);
    this.playFilteredNoise({ duration: 0.24, filterType: "highpass", freqStart: 2600, freqEnd: 1200, q: 1.4, gainPeak: 0.14 });
  }

  playOmegaCataclysm() {
    if (this.canThrottle("omegaCataclysm", 95)) return;
    this.playTone(130, 34, 0.48, "sawtooth", 0.28);
    this.playTone(620, 180, 0.36, "sawtooth", 0.18, 0.04);
    this.playFilteredNoise({ duration: 0.48, filterType: "lowpass", freqStart: 1200, freqEnd: 150, q: 1.0, gainPeak: 0.32 });
  }

  playActiveItem(kind = "shield") {
    if (kind === "storm_wrath") {
      this.playThunderStrike();
      return;
    }
    if (kind === "blood_frenzy") {
      this.playTone(320, 740, 0.18, "sawtooth", 0.2);
      this.playTone(640, 960, 0.2, "triangle", 0.16, 0.05);
      return;
    }
    if (kind === "crimson_phase") {
      this.playDash();
      this.playTone(440, 880, 0.18, "sine", 0.18, 0.03);
      return;
    }
    if (kind === "emperor_ascension" || kind === "immortal_dome") {
      this.playHolyLight();
      this.playShieldBlock();
      return;
    }
    this.playShieldBlock();
    this.playTone(520, 1040, 0.22, "sine", 0.18, 0.03);
  }

  playDroneSwitch() {
    if (this.canThrottle("droneSwitch", 80)) return;
    this.playTone(520, 1040, 0.11, "sine", 0.18);
    this.playTone(780, 1320, 0.1, "triangle", 0.12, 0.04);
  }

  playTurretShot() {
    if (this.canThrottle("turretShot", 70)) return;
    this.playTone(860, 280, 0.09, "square", 0.09);
    this.playFilteredNoise({ duration: 0.07, filterType: "bandpass", freqStart: 1900, freqEnd: 700, q: 2.0, gainPeak: 0.11 });
  }

  playPortalOpen() {
    if (this.canThrottle("portalOpen", 90)) return;
    this.playTone(260, 680, 0.28, "sine", 0.18);
    this.playTone(520, 980, 0.24, "triangle", 0.14, 0.04);
    this.playFilteredNoise({ duration: 0.26, filterType: "bandpass", freqStart: 1600, freqEnd: 520, q: 1.8, gainPeak: 0.18 });
  }

  playLaserRay() {
    if (this.canThrottle("laserRay", 95)) return;
    this.playTone(180, 72, 0.42, "sawtooth", 0.24);
    this.playTone(920, 320, 0.36, "sawtooth", 0.16, 0.02);
    this.playFilteredNoise({ duration: 0.38, filterType: "bandpass", freqStart: 2400, freqEnd: 480, q: 1.4, gainPeak: 0.24 });
  }

  playSanctuaryWave() {
    if (this.canThrottle("sanctuaryWave", 90)) return;
    this.playTone(440, 660, 0.26, "sine", 0.18);
    this.playTone(554, 830, 0.28, "sine", 0.14, 0.04);
    this.playTone(659, 988, 0.3, "triangle", 0.12, 0.08);
  }

  playMissileBarrage() {
    if (this.canThrottle("missileBarrage", 85)) return;
    this.playTone(260, 82, 0.26, "sawtooth", 0.2);
    this.playFilteredNoise({ duration: 0.28, filterType: "lowpass", freqStart: 1300, freqEnd: 220, q: 1.2, gainPeak: 0.25 });
  }
}

export const R = new SoundEngine();
