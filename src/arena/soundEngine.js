// Procedural Web Audio Sound Effects & Dynamic Music Sequencer for Arena Hero 11.8
// Layered MOBA audio architecture: Master DynamicsCompressor + filtered Delay Ambiance bus + multi-harmonic synthesis

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.compressor = null;
    this.masterSfxGain = null;
    this.masterBgmGain = null;
    this.sfxAmbianceSend = null;
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
    this.activeVoices = 0;
    this.maxVoices = 22;
    this.lowPowerAudio = false;
    this._narrativeDuck = 1;
    this._infernoAmbTimer = 2.2;
    this._pageHidden = typeof document !== "undefined" ? Boolean(document.hidden) : false;

    if (typeof window !== "undefined") {
      const unlockHandler = () => {
        this.unlocked = true;
        if (this._pageHidden) return;
        const ctx = this.ensureContext(true);
        if (ctx && this.musicEnabled && this.musicMode !== "off" && this.musicMode !== "paused" && !this.bgmTimerId) {
          this.startMusicLoop();
        }
      };
      window.addEventListener("pointerdown", unlockHandler, { passive: true });
      window.addEventListener("keydown", unlockHandler, { passive: true });
      window.addEventListener("touchstart", unlockHandler, { passive: true });

      const onVisibility = () => {
        const hidden = typeof document !== "undefined" ? Boolean(document.hidden) : false;
        this._pageHidden = hidden;
        if (hidden) {
          this.stopMusicLoop();
          if (this.ctx && this.ctx.state === "running" && typeof this.ctx.suspend === "function") {
            this.ctx.suspend().catch(() => {});
          }
        } else {
          if (this.ctx && this.ctx.state === "suspended" && typeof this.ctx.resume === "function" && (this.enabled || this.musicEnabled)) {
            this.ctx.resume().catch(() => {});
          }
          if (this.unlocked && this.musicEnabled && this.musicMode !== "off" && this.musicMode !== "paused") {
            this.startMusicLoop();
          }
        }
      };
      if (typeof document !== "undefined") {
        document.addEventListener("visibilitychange", onVisibility);
      }
      window.addEventListener("pagehide", () => {
        this._pageHidden = true;
        this.stopMusicLoop();
        if (this.ctx && this.ctx.state === "running" && typeof this.ctx.suspend === "function") {
          this.ctx.suspend().catch(() => {});
        }
      });
    }
  }

  setPerformanceProfile({ maxVoices, lowPowerAudio } = {}) {
    if (typeof maxVoices === "number" && Number.isFinite(maxVoices)) {
      this.maxVoices = Math.max(8, Math.min(36, Math.round(maxVoices)));
    }
    if (typeof lowPowerAudio === "boolean") {
      this.lowPowerAudio = lowPowerAudio;
    }
  }

  _canSpawnVoice(isCritical = false) {
    if (this._pageHidden) return false;
    const cap = isCritical ? this.maxVoices + 4 : this.maxVoices;
    return this.activeVoices < cap;
  }

  _trackVoice(node, durationSec = 0.25) {
    this.activeVoices += 1;
    let released = false;
    const release = () => {
      if (released) return;
      released = true;
      this.activeVoices = Math.max(0, this.activeVoices - 1);
    };
    try {
      node.onended = release;
    } catch {
    }
    const fallbackMs = Math.max(80, Math.min(5000, Math.round((durationSec + 0.12) * 1000)));
    setTimeout(release, fallbackMs);
  }

  canThrottle(key, minGapMs = 60) {
    const now = typeof performance !== "undefined" && performance.now ? performance.now() : Date.now();
    const prev = this.lastCooldowns.get(key) || 0;
    if (now - prev < minGapMs) return true;
    if (this.lastCooldowns.size > 160) {
      this.lastCooldowns.clear();
    }
    this.lastCooldowns.set(key, now);
    return false;
  }

  jitter(val, pct = 0.06) {
    const delta = (Math.random() * 2 - 1) * pct;
    return val * (1 + delta);
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

        // Master compressor prevents clipping when multiple skills/kills trigger simultaneously
        if (typeof this.ctx.createDynamicsCompressor === "function") {
          this.compressor = this.ctx.createDynamicsCompressor();
          this.compressor.threshold.setValueAtTime(-16, this.ctx.currentTime);
          this.compressor.knee.setValueAtTime(18, this.ctx.currentTime);
          this.compressor.ratio.setValueAtTime(5.5, this.ctx.currentTime);
          this.compressor.attack.setValueAtTime(0.004, this.ctx.currentTime);
          this.compressor.release.setValueAtTime(0.14, this.ctx.currentTime);
          this.compressor.connect(this.ctx.destination);
        }

        const outDest = this.compressor || this.ctx.destination;

        this.masterSfxGain = this.ctx.createGain();
        this.masterSfxGain.gain.value = this.enabled ? this.volume : 0;
        this.masterSfxGain.connect(outDest);

        this.masterBgmGain = this.ctx.createGain();
        this.masterBgmGain.gain.value = this.musicEnabled ? this.musicVolume * 0.42 : 0;
        this.masterBgmGain.connect(outDest);

        // Filtered delay ambiance bus for spatial MOBA hall shimmer & magic tails
        if (typeof this.ctx.createDelay === "function") {
          try {
            const send = this.ctx.createGain();
            send.gain.value = 0.24;
            const delay = this.ctx.createDelay(0.5);
            delay.delayTime.value = 0.085;
            const lp = this.ctx.createBiquadFilter();
            lp.type = "lowpass";
            lp.frequency.value = 2600;
            const feedback = this.ctx.createGain();
            feedback.gain.value = 0.22;

            send.connect(delay);
            delay.connect(lp);
            lp.connect(feedback);
            feedback.connect(delay);
            lp.connect(this.masterSfxGain);
            this.sfxAmbianceSend = send;
          } catch {
            this.sfxAmbianceSend = null;
          }
        }

        this.noiseBuffer = this.createNoiseBuffer(this.ctx, 1.5);
      }
      if (this.ctx.state === "suspended" && typeof this.ctx.resume === "function") {
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
        const duckScale = typeof this._narrativeDuck === "number" ? this._narrativeDuck : 1;
        const targetBgm =
          this.musicEnabled && this.musicMode !== "off"
            ? this.musicVolume * 0.42 * pausedScale * duckScale
            : 0;
        this.masterBgmGain.gain.setTargetAtTime(targetBgm, now, 0.06);
      }
    } catch {
      // Ignore AudioParam errors
    }
  }

  setNarrativeDuck(active) {
    this._narrativeDuck = active ? 0.16 : 1;
    this.syncVolumes();
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

  playMusicNote(freq, time, dur, type = "triangle", gainAmt = 0.12, filterFreq = 2200, pan = 0) {
    if (!this.ctx || !this.masterBgmGain || !this.musicEnabled || this._pageHidden) return;
    if (!this._canSpawnVoice(false)) return;
    try {
      const osc = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, time);
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(filterFreq, time);
      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.linearRampToValueAtTime(gainAmt, time + Math.min(0.025, dur * 0.15));
      gain.gain.exponentialRampToValueAtTime(0.0001, time + dur);
      osc.connect(filter);
      filter.connect(gain);
      if (!this.lowPowerAudio && pan !== 0 && typeof this.ctx.createStereoPanner === "function") {
        const panner = this.ctx.createStereoPanner();
        panner.pan.setValueAtTime(Math.max(-0.8, Math.min(0.8, pan)), time);
        gain.connect(panner);
        panner.connect(this.masterBgmGain);
      } else {
        gain.connect(this.masterBgmGain);
      }
      this._trackVoice(osc, Math.max(0.05, time - this.ctx.currentTime + dur));
      osc.start(time);
      osc.stop(time + dur + 0.025);
    } catch {
      // Ignore
    }
  }

  playMusicDrum(kind, time) {
    if (!this.ctx || !this.masterBgmGain || !this.musicEnabled || this._pageHidden) return;
    if (!this._canSpawnVoice(false)) return;
    try {
      if (kind === "kick") {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(140, time);
        osc.frequency.exponentialRampToValueAtTime(36, time + 0.14);
        gain.gain.setValueAtTime(0.32, time);
        gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.16);
        osc.connect(gain);
        gain.connect(this.masterBgmGain);
        this._trackVoice(osc, Math.max(0.05, time - this.ctx.currentTime + 0.18));
        osc.start(time);
        osc.stop(time + 0.18);
      } else if (kind === "timpani") {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(92, time);
        osc.frequency.exponentialRampToValueAtTime(55, time + 0.28);
        gain.gain.setValueAtTime(0.18, time);
        gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.32);
        osc.connect(gain);
        gain.connect(this.masterBgmGain);
        this._trackVoice(osc, Math.max(0.05, time - this.ctx.currentTime + 0.34));
        osc.start(time);
        osc.stop(time + 0.34);
      } else if (kind === "snare" && this.noiseBuffer) {
        const src = this.ctx.createBufferSource();
        src.buffer = this.noiseBuffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = "bandpass";
        filter.frequency.setValueAtTime(1850, time);
        filter.Q.setValueAtTime(0.95, time);
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.16, time);
        gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.12);
        src.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterBgmGain);
        this._trackVoice(src, Math.max(0.05, time - this.ctx.currentTime + 0.13));
        src.start(time, 0, 0.13);
      } else if (kind === "hat" && this.noiseBuffer) {
        const src = this.ctx.createBufferSource();
        src.buffer = this.noiseBuffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = "highpass";
        filter.frequency.setValueAtTime(6600, time);
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.055, time);
        gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.045);
        src.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterBgmGain);
        this._trackVoice(src, Math.max(0.05, time - this.ctx.currentTime + 0.05));
        src.start(time, 0, 0.05);
      } else if (kind === "crash" && this.noiseBuffer) {
        const src = this.ctx.createBufferSource();
        src.buffer = this.noiseBuffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = "bandpass";
        filter.frequency.setValueAtTime(4800, time);
        filter.Q.setValueAtTime(0.7, time);
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.001, time);
        gain.gain.linearRampToValueAtTime(0.09, time + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.65);
        src.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterBgmGain);
        this._trackVoice(src, Math.max(0.05, time - this.ctx.currentTime + 0.68));
        src.start(time, 0, 0.68);
      }
    } catch {
      // Ignore
    }
  }

  scheduleMusicSteps() {
    if (!this.ctx || !this.musicEnabled || this._pageHidden) return;
    if (this.musicMode === "off" || this.musicMode === "paused") return;
    if (this.ctx.state !== "running") return;

    const bpm = this.musicMode === "boss" ? 148 : this.musicMode === "battle" ? 132 : 94;
    const sixteenth = 60 / bpm / 4;
    const lookahead = 0.24;

    if (this.nextNoteTime < this.ctx.currentTime - 0.5) {
      this.nextNoteTime = this.ctx.currentTime + 0.05;
    }

    while (this.nextNoteTime < this.ctx.currentTime + lookahead) {
      this.triggerBgmStep(this.stepIndex, this.nextNoteTime, sixteenth);
      this.nextNoteTime += sixteenth;
      this.stepIndex = (this.stepIndex + 1) % 64;
    }
  }

  triggerBgmStep(step, t, stepDur) {
    if (this.musicMode === "menu") {
      // Glorious Royal Overture in D Dorian -> triumphant Picardy lift (4-bar 64-step orchestral phrasing)
      // Bar 1: Dm9 | Bar 2: Cmaj7 | Bar 3: Bbmaj7 | Bar 4: C6 -> A7sus4 -> Dmaj uplift
      const bar = Math.floor(step / 16);
      const local = step % 16;
      const chordRoots = [38, 36, 34, 33]; // D2, C2, Bb1, A1
      const chordThirds = [53, 52, 50, 52]; // F3, E3, D3, E3 (bar4 sus/maj shimmer)
      const chordFifths = [57, 55, 53, 57]; // A3, G3, F3, A3
      const chordSevenths = [60, 59, 57, 61]; // C4, B3, A3, C#4 (glorious dominant pull back to Dm)

      // Soaring French Horn + String Fanfare Melody across 64 steps (2-step resolution)
      const fanfareMelody = [
        62, 0, 69, 0, 74, 0, 72, 74,   // Bar 1: D4 -> A4 -> D5 -> C5-D5
        72, 0, 67, 0, 71, 0, 72, 0,    // Bar 2: C5 -> G4 -> B4 -> C5
        70, 0, 65, 0, 69, 0, 70, 72,   // Bar 3: Bb4 -> F4 -> A4 -> Bb4-C5
        69, 0, 73, 0, 76, 0, 81, 0,    // Bar 4: A4 -> C#5 -> E5 -> A5 soaring resolution
      ];
      // Golden Harp & Celesta shimmering arpeggio
      const harpArp = [
        62, 69, 74, 76, 74, 69, 65, 69,
        60, 67, 72, 74, 72, 67, 64, 67,
        58, 65, 70, 74, 70, 65, 62, 65,
        57, 64, 69, 73, 76, 73, 69, 64,
      ];

      if (local === 0) {
        this.playMusicDrum("timpani", t);
        if (bar === 0 || bar === 2) this.playMusicDrum("crash", t);
        const root = chordRoots[bar];
        const third = chordThirds[bar];
        const fifth = chordFifths[bar];
        const sev = chordSevenths[bar];
        // Rich orchestral low brass & stereo warm string ensemble pad
        this.playMusicNote(this.midiToFreq(root), t, stepDur * 15.2, "triangle", 0.16, 480, 0);
        this.playMusicNote(this.midiToFreq(root + 12), t, stepDur * 14.8, "sawtooth", 0.048, 760, -0.28);
        this.playMusicNote(this.midiToFreq(fifth), t, stepDur * 14.8, "sawtooth", 0.042, 920, 0.28);
        this.playMusicNote(this.midiToFreq(third), t, stepDur * 14.5, "sine", 0.072, 1150, -0.18);
        this.playMusicNote(this.midiToFreq(sev), t, stepDur * 14.0, "triangle", 0.046, 1380, 0.22);
      }
      if (local === 8) {
        this.playMusicDrum("timpani", t);
        // Subtle mid-bar horn swell
        this.playMusicNote(this.midiToFreq(chordFifths[bar] + 12), t, stepDur * 7.2, "triangle", 0.055, 1100, 0.16);
      }
      if (step % 8 === 4) this.playMusicDrum("hat", t);

      if (step % 2 === 0) {
        const idx = (step >> 1) % 32;
        this.playMusicNote(
          this.midiToFreq(harpArp[idx]),
          t,
          stepDur * 2.5,
          "triangle",
          0.068,
          2500,
          idx % 2 === 0 ? -0.34 : 0.34
        );
        const mel = fanfareMelody[idx];
        if (mel > 0) {
          this.playMusicNote(this.midiToFreq(mel), t, stepDur * 3.4, "sawtooth", 0.062, 1650, -0.1);
          this.playMusicNote(this.midiToFreq(mel), t, stepDur * 3.6, "triangle", 0.082, 2400, 0.12);
          if (idx >= 24) {
            // Octave glory layer on the final cadence bar
            this.playMusicNote(this.midiToFreq(mel + 12), t, stepDur * 3.2, "sine", 0.04, 3400, 0);
          }
        }
      }
      return;
    }

    if (this.musicMode === "battle") {
      // Glorious Heroic Combat Anthem in D Minor -> F -> Bb -> C -> A7 (64-step heroic progression)
      const bar = Math.floor(step / 16);
      const local = step % 16;
      const bassSeq = [
        // Bar 1: Dm heroic march
        38, 0, 38, 0, 38, 0, 41, 0, 38, 0, 45, 0, 43, 0, 41, 0,
        // Bar 2: F -> C noble lift
        41, 0, 41, 0, 41, 0, 45, 0, 36, 0, 36, 0, 40, 0, 43, 0,
        // Bar 3: Bb -> Gm soaring battle cry
        34, 0, 34, 0, 38, 0, 41, 0, 43, 0, 43, 0, 46, 0, 43, 0,
        // Bar 4: C -> A/C# grand turnaround
        36, 0, 36, 0, 43, 0, 48, 0, 45, 0, 45, 0, 49, 0, 52, 0,
      ];
      const leadSeq = [
        // Bar 1: Glorious Brass Call
        62, 0, 65, 69, 0, 74, 72, 0, 69, 0, 67, 69, 0, 65, 64, 0,
        // Bar 2: Triumphant Answer
        65, 0, 69, 72, 0, 77, 76, 0, 72, 0, 67, 72, 0, 74, 72, 0,
        // Bar 3: Soaring Climax
        70, 0, 74, 77, 0, 74, 70, 0, 67, 0, 70, 74, 0, 79, 77, 0,
        // Bar 4: Heroic Ascension
        76, 0, 72, 74, 76, 0, 79, 0, 73, 0, 76, 81, 0, 79, 76, 0,
      ];
      const harmonyThirds = [57, 60, 58, 61]; // Bar pad harmony center
      const chordPadRoots = [50, 53, 46, 48];

      if (step % 4 === 0) this.playMusicDrum("kick", t);
      if (step % 8 === 4) this.playMusicDrum("snare", t);
      if (step % 2 === 1) this.playMusicDrum("hat", t);
      if (local === 0) {
        this.playMusicDrum("timpani", t);
        if (bar === 0 || bar === 2) this.playMusicDrum("crash", t);
      }

      const bass = bassSeq[step];
      if (bass > 0) {
        this.playMusicNote(this.midiToFreq(bass), t, stepDur * 1.9, "sawtooth", 0.115, 680, 0);
        this.playMusicNote(this.midiToFreq(bass), t, stepDur * 2.0, "triangle", 0.08, 420, 0);
      }
      const lead = leadSeq[step];
      if (lead > 0) {
        // Double brass/string heroic lead + high harmony shimmer
        this.playMusicNote(this.midiToFreq(lead), t, stepDur * 1.9, "triangle", 0.095, 2700, -0.18);
        this.playMusicNote(this.midiToFreq(lead), t, stepDur * 1.7, "sawtooth", 0.048, 1750, 0.18);
        this.playMusicNote(this.midiToFreq(lead + 12), t, stepDur * 1.3, "sine", 0.032, 3400, 0.24);
      }
      if (step % 8 === 0) {
        const padRoot = chordPadRoots[bar];
        const padThird = harmonyThirds[bar];
        this.playMusicNote(this.midiToFreq(padRoot), t, stepDur * 7.2, "sawtooth", 0.045, 950, -0.32);
        this.playMusicNote(this.midiToFreq(padRoot + 7), t, stepDur * 7.2, "sine", 0.068, 1300, 0.32);
        this.playMusicNote(this.midiToFreq(padThird), t, stepDur * 6.8, "triangle", 0.042, 1450, 0);
      }
      return;
    }

    if (this.musicMode === "boss") {
      // Majestic Cataclysmic Boss Symphony in C# Harmonic Minor (64 steps)
      const bar = Math.floor(step / 16);
      const local = step % 16;
      const bassSeq = [
        37, 37, 0, 37, 37, 0, 38, 0, 37, 37, 0, 37, 40, 0, 38, 0,
        35, 35, 0, 35, 37, 0, 38, 0, 40, 0, 38, 0, 37, 0, 36, 0,
        37, 37, 0, 44, 37, 0, 45, 0, 44, 44, 0, 40, 38, 0, 37, 0,
        33, 33, 0, 37, 35, 0, 39, 0, 44, 0, 48, 0, 49, 0, 44, 0,
      ];
      const leadSeq = [
        61, 0, 62, 65, 68, 0, 65, 62, 61, 0, 64, 68, 73, 0, 72, 68,
        62, 0, 65, 69, 74, 0, 73, 69, 68, 65, 64, 62, 61, 0, 60, 0,
        61, 0, 68, 73, 72, 0, 68, 65, 69, 0, 73, 76, 80, 0, 77, 73,
        72, 0, 68, 69, 73, 0, 76, 0, 80, 0, 84, 0, 85, 0, 80, 0,
      ];
      const bossPads = [49, 50, 49, 44]; // C#3, D3, C#3, G#2

      if (step % 4 === 0 || step % 16 === 6 || step % 16 === 14) this.playMusicDrum("kick", t);
      if (step % 8 === 4) this.playMusicDrum("snare", t);
      if (step % 16 === 0) this.playMusicDrum("timpani", t);
      if (local === 0 && (bar === 0 || bar === 2)) this.playMusicDrum("crash", t);
      this.playMusicDrum("hat", t);

      const bass = bassSeq[step];
      if (bass > 0) {
        this.playMusicNote(this.midiToFreq(bass), t, stepDur * 1.45, "sawtooth", 0.135, 780, 0);
      }
      const lead = leadSeq[step];
      if (lead > 0) {
        this.playMusicNote(this.midiToFreq(lead), t, stepDur * 1.6, "sawtooth", 0.075, 2250, 0.16);
        this.playMusicNote(this.midiToFreq(lead - 12), t, stepDur * 1.6, "triangle", 0.062, 1300, -0.16);
        this.playMusicNote(this.midiToFreq(lead + 7), t, stepDur * 1.3, "sine", 0.03, 2800, 0.25);
      }
      if (step % 8 === 0) {
        const chordRoot = bossPads[bar];
        this.playMusicNote(this.midiToFreq(chordRoot), t, stepDur * 7.2, "sawtooth", 0.05, 880, -0.25);
        this.playMusicNote(this.midiToFreq(chordRoot + 7), t, stepDur * 7.2, "sawtooth", 0.044, 1020, 0.25);
        this.playMusicNote(this.midiToFreq(chordRoot + 12), t, stepDur * 6.8, "triangle", 0.04, 1280, 0);
      }
    }
  }

  // =========================================================
  // CORE SYNTH HELPERS FOR SFX
  // =========================================================

  playTone(startFreq, endFreq, duration, type = "sine", vol = 0.25, delay = 0) {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterSfxGain) return;
    if (!this._canSpawnVoice(false)) return;
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
      this._trackVoice(osc, delay + duration + 0.03);
      osc.start(now);
      osc.stop(now + duration + 0.025);
    } catch {
      // Ignore
    }
  }

  playLayerTone({
    startFreq = 440,
    endFreq = 440,
    duration = 0.16,
    type = "sine",
    vol = 0.2,
    delay = 0,
    pan = 0,
    sendAmbiance = false,
    filterType = "lowpass",
    filterFreq = 4800,
    q = 0.8,
    detune = 0,
    attack = 0.012,
  } = {}) {
    if (!this._canSpawnVoice(true)) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.masterSfxGain) return;
    try {
      const now = ctx.currentTime + delay;
      const osc = ctx.createOscillator();
      osc.type = type;
      if (detune) osc.detune.setValueAtTime(detune, now);
      osc.frequency.setValueAtTime(Math.max(24, startFreq), now);
      osc.frequency.exponentialRampToValueAtTime(Math.max(24, endFreq), now + duration);

      const filter = this.ctx.createBiquadFilter();
      filter.type = filterType;
      filter.frequency.setValueAtTime(Math.max(60, filterFreq), now);
      filter.Q.setValueAtTime(q, now);

      const gain = ctx.createGain();
      const peak = Math.max(0.001, vol);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(peak, now + Math.min(attack, duration * 0.4));
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      osc.connect(filter);
      filter.connect(gain);

      const useAmbiance = sendAmbiance && this.sfxAmbianceSend && !this.lowPowerAudio && this.activeVoices < this.maxVoices * 0.75;
      if (!this.lowPowerAudio && pan !== 0 && typeof ctx.createStereoPanner === "function") {
        const panner = ctx.createStereoPanner();
        panner.pan.setValueAtTime(Math.max(-0.9, Math.min(0.9, pan)), now);
        gain.connect(panner);
        panner.connect(this.masterSfxGain);
        if (useAmbiance) panner.connect(this.sfxAmbianceSend);
      } else {
        gain.connect(this.masterSfxGain);
        if (useAmbiance) gain.connect(this.sfxAmbianceSend);
      }

      this._trackVoice(osc, delay + duration);
      osc.start(now);
      osc.stop(now + duration + 0.03);
    } catch {
      // Ignore
    }
  }

  playChord(freqs = [440, 554, 659], duration = 0.35, {
    type = "triangle",
    vol = 0.14,
    delay = 0,
    stagger = 0.025,
    filterFreq = 3200,
    sendAmbiance = true,
  } = {}) {
    const notes = this.lowPowerAudio && freqs.length > 3 ? [freqs[0], freqs[1], freqs[freqs.length - 1]] : freqs;
    notes.forEach((f, idx) => {
      const pan = !this.lowPowerAudio && notes.length > 1 ? ((idx / (notes.length - 1)) - 0.5) * 0.5 : 0;
      this.playLayerTone({
        startFreq: f,
        endFreq: f * 1.003,
        duration,
        type,
        vol,
        delay: delay + idx * stagger,
        filterFreq,
        pan,
        sendAmbiance,
      });
    });
  }

  playMetallicClang(baseFreq = 720, duration = 0.18, vol = 0.13, delay = 0, pan = 0) {
    const ratios = this.lowPowerAudio || this.activeVoices > this.maxVoices * 0.7 ? [1, 1.48] : [1, 1.48, 2.13, 2.89];
    ratios.forEach((r, idx) => {
      this.playLayerTone({
        startFreq: baseFreq * r,
        endFreq: baseFreq * r * 0.94,
        duration: duration * (1 - idx * 0.14),
        type: idx % 2 === 0 ? "triangle" : "sine",
        vol: vol * Math.pow(0.68, idx),
        delay,
        pan,
        sendAmbiance: idx === 0,
        filterFreq: 5200,
        attack: 0.004,
      });
    });
  }

  playSubPunch(startFreq = 145, endFreq = 38, duration = 0.16, vol = 0.26, delay = 0) {
    this.playLayerTone({
      startFreq,
      endFreq,
      duration,
      type: "sine",
      vol,
      delay,
      filterFreq: 420,
      attack: 0.004,
    });
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
    pan = 0,
    sendAmbiance = false,
  } = {}) {
    if (!this._canSpawnVoice(true)) return;
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
      const useAmbiance = sendAmbiance && this.sfxAmbianceSend && !this.lowPowerAudio && this.activeVoices < this.maxVoices * 0.75;
      if (!this.lowPowerAudio && pan !== 0 && typeof ctx.createStereoPanner === "function") {
        const panner = ctx.createStereoPanner();
        panner.pan.setValueAtTime(Math.max(-0.9, Math.min(0.9, pan)), now);
        gain.connect(panner);
        panner.connect(this.masterSfxGain);
        if (useAmbiance) panner.connect(this.sfxAmbianceSend);
      } else {
        gain.connect(this.masterSfxGain);
        if (useAmbiance) gain.connect(this.sfxAmbianceSend);
      }
      const offset = Math.random() * 0.5;
      this._trackVoice(src, delay + duration);
      src.start(now, offset, duration + 0.03);
    } catch {
      // Ignore
    }
  }

  // =========================================================
  // LOBBY, UI & SYSTEM SOUNDS
  // =========================================================

  playHover() {
    if (this.canThrottle("hover", 65)) return;
    this.playLayerTone({
      startFreq: this.jitter(920, 0.04),
      endFreq: 1180,
      duration: 0.035,
      type: "sine",
      vol: 0.045,
      filterFreq: 3000,
      attack: 0.004,
    });
  }

  playClick() {
    this.playLayerTone({
      startFreq: this.jitter(580, 0.03),
      endFreq: 840,
      duration: 0.055,
      type: "triangle",
      vol: 0.14,
      filterFreq: 2800,
      attack: 0.005,
    });
    this.playLayerTone({
      startFreq: 1240,
      endFreq: 960,
      duration: 0.04,
      type: "sine",
      vol: 0.05,
      attack: 0.003,
    });
  }

  playTabSwitch() {
    if (this.canThrottle("tabSwitch", 45)) return;
    this.playLayerTone({
      startFreq: 460,
      endFreq: 720,
      duration: 0.07,
      type: "sine",
      vol: 0.11,
      sendAmbiance: true,
    });
    this.playLayerTone({
      startFreq: 920,
      endFreq: 1220,
      duration: 0.075,
      type: "triangle",
      vol: 0.07,
      delay: 0.02,
      sendAmbiance: true,
    });
  }

  playModalOpen() {
    if (this.canThrottle("modalOpen", 75)) return;
    this.playFilteredNoise({
      duration: 0.12,
      filterType: "bandpass",
      freqStart: 600,
      freqEnd: 2200,
      q: 1.8,
      gainPeak: 0.08,
      sendAmbiance: true,
    });
    this.playChord([440, 554.37, 659.25], 0.18, {
      type: "sine",
      vol: 0.09,
      stagger: 0.025,
      sendAmbiance: true,
    });
  }

  playModalClose() {
    if (this.canThrottle("modalClose", 75)) return;
    this.playLayerTone({
      startFreq: 660,
      endFreq: 392,
      duration: 0.11,
      type: "sine",
      vol: 0.11,
      filterFreq: 1800,
    });
    this.playLayerTone({
      startFreq: 440,
      endFreq: 293.66,
      duration: 0.12,
      type: "triangle",
      vol: 0.07,
      delay: 0.02,
    });
  }

  playCopy() {
    this.playLayerTone({
      startFreq: 1046.5,
      endFreq: 1318.5,
      duration: 0.08,
      type: "sine",
      vol: 0.14,
      sendAmbiance: true,
    });
    this.playLayerTone({
      startFreq: 1567.98,
      endFreq: 1760,
      duration: 0.12,
      type: "triangle",
      vol: 0.11,
      delay: 0.045,
      sendAmbiance: true,
    });
  }

  playError() {
    if (this.canThrottle("uiError", 120)) return;
    this.playSubPunch(130, 68, 0.14, 0.18);
    this.playLayerTone({
      startFreq: 220,
      endFreq: 165,
      duration: 0.16,
      type: "sawtooth",
      vol: 0.12,
      filterFreq: 720,
    });
    this.playLayerTone({
      startFreq: 196,
      endFreq: 146,
      duration: 0.18,
      type: "sawtooth",
      vol: 0.11,
      delay: 0.09,
      filterFreq: 640,
    });
  }

  playHeroSelect(heroId = "eohyen") {
    if (this.canThrottle("heroSelect", 80)) return;
    this.playSubPunch(155, 58, 0.11, 0.16);
    switch (heroId) {
      case "dung":
        this.playMetallicClang(680, 0.16, 0.11);
        this.playLayerTone({ startFreq: 1180, endFreq: 520, duration: 0.14, type: "sawtooth", vol: 0.09, filterFreq: 2400, sendAmbiance: true });
        break;
      case "tin":
      case "bao":
      case "duy":
        this.playMetallicClang(980, 0.15, 0.11);
        this.playFilteredNoise({ duration: 0.12, filterType: "highpass", freqStart: 2800, freqEnd: 1100, gainPeak: 0.11, sendAmbiance: true });
        break;
      case "kin":
        this.playFilteredNoise({ duration: 0.16, filterType: "bandpass", freqStart: 700, freqEnd: 1900, q: 2.2, gainPeak: 0.12, sendAmbiance: true });
        this.playChord([523.25, 659.25, 783.99], 0.2, { type: "sine", vol: 0.08, stagger: 0.03 });
        break;
      case "eohyen":
        this.playLayerTone({ startFreq: 1480, endFreq: 1046, duration: 0.16, type: "sine", vol: 0.12, sendAmbiance: true });
        this.playFilteredNoise({ duration: 0.14, filterType: "highpass", freqStart: 3600, freqEnd: 1800, gainPeak: 0.09, sendAmbiance: true });
        break;
      case "longhoi":
      case "danh":
        this.playFilteredNoise({ duration: 0.18, filterType: "bandpass", freqStart: 540, freqEnd: 240, q: 1.2, gainPeak: 0.14, sendAmbiance: true });
        this.playLayerTone({ startFreq: 260, endFreq: 520, duration: 0.18, type: "sawtooth", vol: 0.09, filterFreq: 1400 });
        break;
      case "trung":
      case "duccong":
      case "luan":
        this.playChord([392, 493.88, 587.33, 783.99], 0.24, { type: "sine", vol: 0.08, stagger: 0.025, sendAmbiance: true });
        break;
      case "gau":
        this.playSubPunch(115, 40, 0.22, 0.24);
        this.playMetallicClang(340, 0.18, 0.12);
        break;
      case "taidu":
        this.playLayerTone({ startFreq: 540, endFreq: 1080, duration: 0.12, type: "triangle", vol: 0.12, sendAmbiance: true });
        this.playLayerTone({ startFreq: 880, endFreq: 1480, duration: 0.1, type: "sine", vol: 0.08, delay: 0.05 });
        break;
      case "nguyen":
        this.playChord([440, 554.37, 659.25, 880], 0.28, { type: "triangle", vol: 0.09, stagger: 0.03, sendAmbiance: true });
        break;
      case "phong":
        this.playPhongDash();
        this.playChord([587.33, 739.99, 880, 1174.66], 0.22, { type: "sine", vol: 0.08, stagger: 0.025, sendAmbiance: true });
        break;
      case "dang":
        this.playDangTigerPunch(1);
        this.playDangTigerRoar();
        break;
      case "thien":
        this.playThienAscend();
        break;
      case "thanh":
        this.playThanhSnakeCast();
        this.playChord([329.63, 440, 523.25], 0.24, { type: "sine", vol: 0.08, stagger: 0.03, sendAmbiance: true });
        break;
      case "nhi":
        this.playNhiAmmoSwitch(0);
        this.playFilteredNoise({ duration: 0.14, filterType: "bandpass", freqStart: 1200, freqEnd: 2600, q: 1.8, gainPeak: 0.11, sendAmbiance: true });
        break;
      case "minh":
        this.playMinhSanctuary();
        this.playChord([523.25, 659.25, 783.99, 1046.5], 0.28, { type: "sine", vol: 0.09, stagger: 0.025, sendAmbiance: true });
        break;
      case "ducanh":
        this.playDucAnhFortress();
        this.playSubPunch(105, 34, 0.24, 0.26);
        break;
      case "bach":
        this.playBachDash(1);
        this.playChord([523.25, 659.25, 783.99, 1046.5], 0.2, { type: "triangle", vol: 0.08, stagger: 0.025, sendAmbiance: true });
        break;
      case "thai":
        this.playThaiArenaDomain();
        this.playSubPunch(110, 38, 0.22, 0.24);
        break;
      case "khair":
        this.playKhairRailAim(1);
        this.playKhairSniperShot();
        break;
      default:
        this.playChord([440, 659.25], 0.18, { type: "triangle", vol: 0.1, sendAmbiance: true });
    }
  }

  playHeroSkillPreview(heroId = "eohyen", skillKey = "atk") {
    if (skillKey === "passive") {
      this.playHeroSelect(heroId);
      return;
    }
    if (skillKey === "atk") {
      if (["kin", "longhoi"].includes(heroId)) this.playBow();
      else if (["trung", "duccong", "luan"].includes(heroId)) this.playOrb();
      else if (["tin", "bao", "phong"].includes(heroId)) this.playDaggerSlash(1);
      else if (heroId === "duy") this.playShurikenThrow();
      else if (heroId === "dung") this.playSpear();
      else if (heroId === "gau") this.playHeavyPunch(1);
      else if (heroId === "dang") this.playDangTigerPunch(1);
      else if (heroId === "thien") this.playThienBasic(0);
      else if (heroId === "danh") this.playHeavySword(1);
      else if (heroId === "taidu") this.playTurretShot();
      else if (heroId === "nguyen") this.playHolyLight();
      else if (heroId === "thanh") this.playThanhSnakeCast();
      else if (heroId === "nhi") this.playBow();
      else if (heroId === "minh") this.playMinhBasic();
      else if (heroId === "ducanh") this.playDucAnhSmash();
      else if (heroId === "bach") this.playDaggerSlash(1.2);
      else if (heroId === "thai") this.playThaiHalberd();
      else if (heroId === "khair") this.playKhairSniperShot();
      else this.playIceSlash();
      return;
    }
    if (skillKey === "c1") {
      if (heroId === "thien") {
        this.playThienSwords();
        return;
      }
      if (heroId === "thanh") {
        this.playThanhSnakeCast();
        return;
      }
      if (heroId === "nhi") {
        this.playNhiAmmoSwitch(1);
        return;
      }
      if (heroId === "minh") {
        this.playMinhChains();
        return;
      }
      if (heroId === "ducanh") {
        this.playDucAnhRoll();
        return;
      }
      if (heroId === "bach") {
        this.playBachDash(1);
        return;
      }
      if (heroId === "thai") {
        this.playThaiSlam(true);
        return;
      }
      if (heroId === "khair") {
        this.playKhairBeacon();
        return;
      }
    }
    if (skillKey === "c2") {
      if (heroId === "thien") {
        this.playThienTimeZone();
        return;
      }
      if (heroId === "thanh") {
        this.playThanhDevour();
        return;
      }
      if (heroId === "nhi") {
        this.playNhiFlaskBreak();
        return;
      }
      if (heroId === "minh") {
        this.playMinhSanctuary();
        return;
      }
      if (heroId === "ducanh") {
        this.playDucAnhFortress();
        return;
      }
      if (heroId === "bach") {
        this.playBachDaggerFan();
        return;
      }
      if (heroId === "thai") {
        this.playThaiRoar(true);
        return;
      }
      if (heroId === "khair") {
        this.playKhairRailBlast();
        return;
      }
    }
    if (skillKey === "c3") {
      if (heroId === "dung") this.playThunderStrike();
      else if (heroId === "tin") this.playRealmSlash();
      else if (heroId === "kin") this.playTornadoStorm();
      else if (heroId === "trung" || heroId === "duccong") this.playBlackHole();
      else if (heroId === "eohyen") this.playIceStorm();
      else if (heroId === "longhoi" || heroId === "danh") this.playDragonRoar();
      else if (heroId === "gau") this.playEarthSlam();
      else if (heroId === "bao") this.playDeathSeal();
      else if (heroId === "luan") this.playLaserRay();
      else if (heroId === "taidu") this.playMissileBarrage();
      else if (heroId === "nguyen") this.playSanctuaryWave();
      else if (heroId === "phong") this.playPhongDeathFlurry();
      else if (heroId === "dang") this.playDangTigerRoar();
      else if (heroId === "thien") this.playThienPortal(false);
      else if (heroId === "thanh") this.playThanhGuardShield();
      else if (heroId === "nhi") this.playNhiUltShot();
      else if (heroId === "minh") this.playMinhPrison();
      else if (heroId === "ducanh") this.playDucAnhMeteor();
      else if (heroId === "bach") this.playBachUltMatrix();
      else if (heroId === "thai") this.playThaiArenaDomain();
      else if (heroId === "khair") this.playKhairUltRecoil();
      else this.playShurikenThrow();
      return;
    }
    if (skillKey === "c4" && heroId === "thien") {
      this.playThienSunUlt();
      return;
    }
    this.playHeroSelect(heroId);
  }

  playHeroLockIn() {
    if (this.canThrottle("heroLockIn", 180)) return;
    this.playSubPunch(125, 36, 0.28, 0.3);
    this.playMetallicClang(540, 0.28, 0.14, 0.01);
    this.playChord([392, 493.88, 587.33, 783.99], 0.42, {
      type: "triangle",
      vol: 0.12,
      delay: 0.04,
      stagger: 0.035,
      sendAmbiance: true,
    });
  }

  playReadyCheck() {
    if (this.canThrottle("readyCheck", 120)) return;
    this.playChord([587.33, 880], 0.18, { type: "sine", vol: 0.14, stagger: 0.055, sendAmbiance: true });
    this.playMetallicClang(1174.66, 0.18, 0.09, 0.06);
  }

  playMatchStart() {
    if (this.canThrottle("matchStart", 250)) return;
    this.playSubPunch(110, 34, 0.4, 0.34);
    this.playFilteredNoise({
      duration: 0.36,
      filterType: "bandpass",
      freqStart: 420,
      freqEnd: 2400,
      q: 1.5,
      gainPeak: 0.18,
      sendAmbiance: true,
    });
    this.playChord([293.66, 440, 587.33, 880], 0.55, {
      type: "sawtooth",
      vol: 0.11,
      delay: 0.04,
      stagger: 0.05,
      filterFreq: 2600,
      sendAmbiance: true,
    });
    this.playMetallicClang(740, 0.32, 0.12, 0.12);
  }

  playLobbyPing(kind = "gather") {
    if (this.canThrottle("lobbyPing", 100)) return;
    if (kind === "ready") {
      this.playChord([659.25, 987.77, 1318.5], 0.24, { type: "sine", vol: 0.12, stagger: 0.045, sendAmbiance: true });
      return;
    }
    if (kind === "wait") {
      this.playLayerTone({ startFreq: 698.46, endFreq: 523.25, duration: 0.14, type: "triangle", vol: 0.14, sendAmbiance: true });
      this.playLayerTone({ startFreq: 523.25, endFreq: 440, duration: 0.18, type: "sine", vol: 0.12, delay: 0.08, sendAmbiance: true });
      return;
    }
    // "gather"
    this.playLayerTone({ startFreq: 783.99, endFreq: 1046.5, duration: 0.12, type: "sine", vol: 0.14, sendAmbiance: true });
    this.playLayerTone({ startFreq: 1046.5, endFreq: 1567.98, duration: 0.22, type: "triangle", vol: 0.12, delay: 0.07, sendAmbiance: true });
  }

  playEquip() {
    if (this.canThrottle("equip", 60)) return;
    this.playSubPunch(170, 62, 0.1, 0.16);
    this.playMetallicClang(640, 0.16, 0.12, 0.01);
    this.playLayerTone({ startFreq: 587.33, endFreq: 880, duration: 0.14, type: "sine", vol: 0.13, delay: 0.04, sendAmbiance: true });
  }

  playUnequip() {
    if (this.canThrottle("unequip", 60)) return;
    this.playLayerTone({ startFreq: 620, endFreq: 330, duration: 0.11, type: "triangle", vol: 0.13 });
    this.playFilteredNoise({ duration: 0.08, filterType: "lowpass", freqStart: 1200, freqEnd: 380, gainPeak: 0.09 });
  }

  playTestSample() {
    this.playHeroLockIn();
  }

  playCoin() {
    this.playLayerTone({ startFreq: this.jitter(987, 0.03), endFreq: 1318, duration: 0.08, type: "sine", vol: 0.18, sendAmbiance: true });
    this.playLayerTone({ startFreq: 1318, endFreq: 1760, duration: 0.14, type: "sine", vol: 0.16, delay: 0.05, sendAmbiance: true });
  }

  playCoinPickup() {
    this.playCoin();
  }

  playBuy() {
    this.playSubPunch(180, 72, 0.09, 0.15);
    this.playChord([523.25, 659.25, 1046.5], 0.18, { type: "triangle", vol: 0.13, stagger: 0.04, sendAmbiance: true });
  }

  playUpgrade() {
    this.playSubPunch(160, 52, 0.14, 0.18);
    this.playLayerTone({ startFreq: 440, endFreq: 660, duration: 0.12, type: "sawtooth", vol: 0.12, filterFreq: 2100 });
    this.playChord([659.25, 880, 1318.5], 0.24, { type: "triangle", vol: 0.14, delay: 0.06, stagger: 0.045, sendAmbiance: true });
  }

  playFanfare() {
    this.playChord([523.25, 659.25, 783.99, 1046.5], 0.42, {
      type: "triangle",
      vol: 0.16,
      stagger: 0.09,
      sendAmbiance: true,
    });
  }

  playHeal() {
    if (this.canThrottle("heal", 150)) return;
    this.playChord([523.25, 659.25, 987.77], 0.2, { type: "sine", vol: 0.11, stagger: 0.045, sendAmbiance: true });
  }

  playLevelUp() {
    this.playSubPunch(140, 48, 0.2, 0.22);
    this.playChord([440, 554.37, 659.25, 880, 1108.73], 0.36, {
      type: "triangle",
      vol: 0.14,
      stagger: 0.06,
      sendAmbiance: true,
    });
  }

  // =========================================================
  // COMBAT IMPACT, KILL, PROGRESSION & STATUS SOUNDS
  // =========================================================

  playHit() {
    if (this.canThrottle("hit", 60)) return;
    this.playSubPunch(this.jitter(165, 0.1), 58, 0.065, 0.13);
    this.playFilteredNoise({
      duration: 0.055,
      filterType: "bandpass",
      freqStart: this.jitter(1150, 0.12),
      freqEnd: 320,
      q: 1.2,
      gainPeak: 0.11,
      attack: 0.004,
    });
  }

  playPlayerHurt() {
    if (this.canThrottle("playerHurt", 75)) return;
    this.playSubPunch(125, 42, 0.11, 0.22);
    this.playLayerTone({ startFreq: 210, endFreq: 86, duration: 0.09, type: "sawtooth", vol: 0.12, filterFreq: 900 });
    this.playFilteredNoise({ duration: 0.08, filterType: "lowpass", freqStart: 950, freqEnd: 220, gainPeak: 0.14, attack: 0.005 });
  }

  playCritHit() {
    if (this.canThrottle("critHit", 50)) return;
    this.playSubPunch(this.jitter(190, 0.08), 48, 0.09, 0.22);
    this.playMetallicClang(this.jitter(1180, 0.08), 0.16, 0.13);
    this.playFilteredNoise({
      duration: 0.09,
      filterType: "highpass",
      freqStart: 2800,
      freqEnd: 1100,
      q: 1.6,
      gainPeak: 0.15,
      attack: 0.004,
    });
  }

  playKill(streak = 1) {
    if (this.canThrottle("kill", 55)) return;
    const base = 392 * Math.pow(1.06, Math.min(8, Math.max(0, streak - 1)));
    this.playSubPunch(140, 44, 0.12, 0.18);
    this.playLayerTone({ startFreq: base, endFreq: base * 1.5, duration: 0.14, type: "triangle", vol: 0.15, sendAmbiance: true });
    this.playMetallicClang(base * 1.8, 0.12, 0.08, 0.02);
  }

  playMultiKill(streak = 2) {
    if (this.canThrottle("multiKill", 160)) return;
    const root = streak >= 5 ? 587.33 : streak === 4 ? 523.25 : streak === 3 ? 493.88 : 440;
    this.playSubPunch(130, 38, 0.22, 0.24);
    this.playChord([root, root * 1.25, root * 1.5, root * 2], 0.34, {
      type: "triangle",
      vol: 0.13,
      delay: 0.03,
      stagger: 0.045,
      sendAmbiance: true,
    });
  }

  playComboRankUp(rank = "C") {
    if (this.canThrottle("comboRank", 180)) return;
    const map = {
      C: [523.25, 659.25],
      B: [587.33, 739.99, 880],
      A: [659.25, 830.61, 987.77],
      S: [783.99, 987.77, 1174.66, 1567.98],
      SS: [880, 1108.73, 1318.51, 1760],
    };
    const notes = map[rank] || map.C;
    this.playChord(notes, 0.26, { type: "sine", vol: 0.12, stagger: 0.04, sendAmbiance: true });
  }

  playXpOrb() {
    if (this.canThrottle("xpOrb", 45)) return;
    const f = this.jitter(1180, 0.12);
    this.playLayerTone({
      startFreq: f,
      endFreq: f * 1.38,
      duration: 0.065,
      type: "sine",
      vol: 0.09,
      pan: (Math.random() - 0.5) * 0.4,
      sendAmbiance: true,
      attack: 0.004,
    });
  }

  playShieldAbsorb() {
    if (this.canThrottle("shieldAbsorb", 65)) return;
    this.playLayerTone({
      startFreq: this.jitter(480, 0.06),
      endFreq: 760,
      duration: 0.09,
      type: "sine",
      vol: 0.12,
      sendAmbiance: true,
    });
    this.playMetallicClang(920, 0.09, 0.06);
  }

  playShieldBreak() {
    if (this.canThrottle("shieldBreak", 120)) return;
    this.playSubPunch(150, 48, 0.16, 0.2);
    this.playFilteredNoise({ duration: 0.2, filterType: "highpass", freqStart: 3800, freqEnd: 1100, q: 2.0, gainPeak: 0.2 });
    this.playLayerTone({ startFreq: 1120, endFreq: 320, duration: 0.18, type: "triangle", vol: 0.14 });
  }

  playStun() {
    if (this.canThrottle("stun", 140)) return;
    this.playSubPunch(125, 42, 0.16, 0.22);
    this.playMetallicClang(440, 0.24, 0.13);
    this.playLayerTone({ startFreq: 680, endFreq: 310, duration: 0.22, type: "sine", vol: 0.14, sendAmbiance: true });
  }

  playWaveStart(isBossWave = false) {
    if (this.canThrottle("waveStart", 200)) return;
    if (isBossWave) {
      this.playSubPunch(100, 32, 0.42, 0.34);
      this.playChord([220, 233.08, 329.63], 0.52, { type: "sawtooth", vol: 0.12, stagger: 0.06, filterFreq: 1600, sendAmbiance: true });
      return;
    }
    this.playSubPunch(120, 42, 0.24, 0.26);
    this.playChord([329.63, 440, 659.25], 0.32, { type: "triangle", vol: 0.12, stagger: 0.05, sendAmbiance: true });
  }

  playWaveClear() {
    if (this.canThrottle("waveClear", 220)) return;
    this.playSubPunch(135, 46, 0.2, 0.22);
    this.playChord([523.25, 659.25, 783.99, 1046.5], 0.46, {
      type: "triangle",
      vol: 0.15,
      delay: 0.03,
      stagger: 0.075,
      sendAmbiance: true,
    });
  }

  playBossPhase(phase = 2) {
    if (this.canThrottle("bossPhase", 260)) return;
    this.playSubPunch(phase >= 3 ? 95 : 112, 30, 0.48, 0.36);
    this.playFilteredNoise({
      duration: 0.42,
      filterType: "bandpass",
      freqStart: phase >= 3 ? 2600 : 1800,
      freqEnd: 240,
      q: 1.4,
      gainPeak: 0.26,
      sendAmbiance: true,
    });
    const chord = phase >= 3 ? [220, 261.63, 311.13, 440] : [246.94, 293.66, 369.99];
    this.playChord(chord, 0.48, { type: "sawtooth", vol: 0.12, stagger: 0.04, filterFreq: 2100, sendAmbiance: true });
  }

  playVictory() {
    if (this.canThrottle("victory", 400)) return;
    this.playSubPunch(125, 40, 0.34, 0.28);
    this.playChord([392, 493.88, 587.33, 783.99], 0.42, { type: "triangle", vol: 0.14, stagger: 0.08, sendAmbiance: true });
    this.playChord([523.25, 659.25, 783.99, 1046.5, 1318.5], 0.72, {
      type: "triangle",
      vol: 0.15,
      delay: 0.34,
      stagger: 0.07,
      sendAmbiance: true,
    });
  }

  playDefeat() {
    if (this.canThrottle("defeat", 400)) return;
    this.playSubPunch(105, 34, 0.45, 0.28);
    this.playChord([392, 349.23, 311.13, 261.63], 0.65, {
      type: "triangle",
      vol: 0.14,
      stagger: 0.14,
      filterFreq: 1400,
      sendAmbiance: true,
    });
  }

  playRevive() {
    if (this.canThrottle("revive", 200)) return;
    this.playChord([440, 554.37, 659.25, 880, 1108.73], 0.45, {
      type: "sine",
      vol: 0.14,
      stagger: 0.05,
      sendAmbiance: true,
    });
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
      sendAmbiance: true,
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
    this.playLayerTone({ startFreq: this.jitter(520, 0.06), endFreq: 210, duration: 0.09, type: "triangle", vol: 0.16 });
    this.playFilteredNoise({ duration: 0.11, filterType: "bandpass", freqStart: 1650, freqEnd: 650, q: 2.4, gainPeak: 0.14 });
  }

  playWhirlwind() {
    this.playWind(0.45, 0.26);
    this.playLayerTone({ startFreq: 360, endFreq: 880, duration: 0.28, type: "sine", vol: 0.18, sendAmbiance: true });
    this.playLayerTone({ startFreq: 720, endFreq: 420, duration: 0.26, type: "triangle", vol: 0.12, delay: 0.12, sendAmbiance: true });
  }

  playTornadoStorm() {
    this.playWind(0.65, 0.3);
    this.playLayerTone({ startFreq: 280, endFreq: 960, duration: 0.36, type: "sine", vol: 0.18, sendAmbiance: true });
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
    this.playLayerTone({ startFreq: this.jitter(1180, 0.05), endFreq: 620, duration: 0.12, type: "sine", vol: 0.17, sendAmbiance: true });
    this.playLayerTone({ startFreq: 1760, endFreq: 1320, duration: 0.1, type: "triangle", vol: 0.12, delay: 0.02, sendAmbiance: true });
    this.playFilteredNoise({ duration: 0.12, filterType: "highpass", freqStart: 3200, freqEnd: 1800, q: 1.4, gainPeak: 0.14 });
  }

  playIceSlash() {
    this.playSlash();
    this.playLayerTone({ startFreq: this.jitter(1480, 0.05), endFreq: 920, duration: 0.12, type: "sine", vol: 0.15, sendAmbiance: true });
    this.playFilteredNoise({ duration: 0.14, filterType: "highpass", freqStart: 3600, freqEnd: 2200, q: 1.6, gainPeak: 0.15 });
  }

  playIceShatter() {
    if (this.canThrottle("iceShatter", 70)) return;
    this.playFilteredNoise({ duration: 0.22, filterType: "highpass", freqStart: 4200, freqEnd: 1900, q: 2.2, gainPeak: 0.26, sendAmbiance: true });
    this.playMetallicClang(1950, 0.14, 0.12);
    this.playLayerTone({ startFreq: 3100, endFreq: 1980, duration: 0.1, type: "sine", vol: 0.14, delay: 0.03 });
  }

  playIceShield() {
    this.playChord([880, 1320, 1760], 0.24, { type: "sine", vol: 0.12, stagger: 0.03, sendAmbiance: true });
    this.playFilteredNoise({ duration: 0.2, filterType: "bandpass", freqStart: 2800, freqEnd: 4200, q: 2.8, gainPeak: 0.14 });
  }

  playIceStorm() {
    this.playWind(0.5, 0.22);
    this.playIceShatter();
    this.playLayerTone({ startFreq: 1560, endFreq: 980, duration: 0.26, type: "sine", vol: 0.14, delay: 0.08, sendAmbiance: true });
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
      sendAmbiance: true,
    });
    this.playLayerTone({ startFreq: 190, endFreq: 75, duration: duration * 0.85, type: "sawtooth", vol: 0.15, filterFreq: 1100 });
  }

  playFireball() {
    this.playSubPunch(175, 52, 0.24, 0.22);
    this.playLayerTone({ startFreq: this.jitter(320, 0.05), endFreq: 88, duration: 0.3, type: "sawtooth", vol: 0.2, filterFreq: 1800 });
    this.playFire(0.32, 0.24);
  }

  playFox() {
    this.playLayerTone({ startFreq: 540, endFreq: 840, duration: 0.13, type: "triangle", vol: 0.17, sendAmbiance: true });
    this.playLayerTone({ startFreq: 920, endFreq: 1320, duration: 0.1, type: "sine", vol: 0.12, sendAmbiance: true });
    this.playFilteredNoise({ duration: 0.14, filterType: "bandpass", freqStart: 1200, freqEnd: 520, q: 1.5, gainPeak: 0.15 });
  }

  playDragonRoar() {
    this.playSubPunch(130, 36, 0.42, 0.32);
    this.playLayerTone({ startFreq: 150, endFreq: 62, duration: 0.45, type: "sawtooth", vol: 0.24, filterFreq: 1400, sendAmbiance: true });
    this.playLayerTone({ startFreq: 230, endFreq: 84, duration: 0.4, type: "square", vol: 0.1, delay: 0.03, filterFreq: 1200 });
    this.playFire(0.48, 0.3);
  }

  // --- LIGHTNING / ELECTRIC SHOCK (Dũng, Boss Màn 12 & 15) ---
  playSpear() {
    this.playLayerTone({ startFreq: this.jitter(460, 0.06), endFreq: 145, duration: 0.1, type: "sawtooth", vol: 0.16, filterFreq: 2400 });
    this.playMetallicClang(940, 0.09, 0.09);
    this.playFilteredNoise({ duration: 0.08, filterType: "highpass", freqStart: 2200, freqEnd: 1100, q: 1.4, gainPeak: 0.1 });
  }

  playElectricZap() {
    if (this.canThrottle("zap", 65)) return;
    this.playLayerTone({ startFreq: this.jitter(1450, 0.08), endFreq: 240, duration: 0.14, type: "sawtooth", vol: 0.18, filterFreq: 3800, sendAmbiance: true });
    this.playLayerTone({ startFreq: 880, endFreq: 170, duration: 0.16, type: "square", vol: 0.1, delay: 0.02, filterFreq: 2200 });
    this.playFilteredNoise({ duration: 0.15, filterType: "bandpass", freqStart: 3600, freqEnd: 1400, q: 3.0, gainPeak: 0.24 });
  }

  playLightning() {
    this.playElectricZap();
    this.playSubPunch(180, 44, 0.28, 0.24);
    this.playFilteredNoise({ duration: 0.26, delay: 0.03, filterType: "lowpass", freqStart: 1100, freqEnd: 240, q: 1.0, gainPeak: 0.24, sendAmbiance: true });
  }

  playThunderStrike() {
    this.playElectricZap();
    this.playSubPunch(160, 34, 0.42, 0.32);
    this.playFilteredNoise({ duration: 0.45, delay: 0.04, filterType: "lowpass", freqStart: 1400, freqEnd: 180, q: 0.9, gainPeak: 0.3, sendAmbiance: true });
  }

  // --- EXPLOSION / EARTH SLAM / ROCK (Gấu, Boss Màn 3, Meteors, Rocket) ---
  playExplosion() {
    if (this.canThrottle("explosion", 55)) return;
    this.playSubPunch(165, 36, 0.34, 0.3);
    this.playLayerTone({ startFreq: 115, endFreq: 34, duration: 0.38, type: "triangle", vol: 0.2, delay: 0.02 });
    this.playFilteredNoise({ duration: 0.38, filterType: "lowpass", freqStart: 950, freqEnd: 170, q: 0.9, gainPeak: 0.32, sendAmbiance: true });
  }

  playHeavyPunch(step = 0) {
    const base = step === 2 ? 140 : step === 1 ? 175 : 200;
    this.playSubPunch(base, 44, step === 2 ? 0.22 : 0.14, 0.28);
    this.playLayerTone({ startFreq: base * 1.6, endFreq: 65, duration: 0.1, type: "sawtooth", vol: 0.13, filterFreq: 1600 });
    this.playFilteredNoise({ duration: 0.14, filterType: "lowpass", freqStart: 1100, freqEnd: 280, q: 1.1, gainPeak: 0.22 });
  }

  playEarthSlam() {
    this.playSubPunch(135, 32, 0.44, 0.34);
    this.playMetallicClang(260, 0.24, 0.12);
    this.playFilteredNoise({ duration: 0.44, filterType: "lowpass", freqStart: 780, freqEnd: 140, q: 1.1, gainPeak: 0.34, sendAmbiance: true });
  }

  playRockRoll() {
    this.playLayerTone({ startFreq: 110, endFreq: 65, duration: 0.35, type: "sawtooth", vol: 0.18, filterFreq: 620 });
    this.playFilteredNoise({ duration: 0.38, filterType: "lowpass", freqStart: 520, freqEnd: 180, q: 1.4, gainPeak: 0.26 });
  }

  playShieldBlock() {
    this.playSubPunch(180, 68, 0.12, 0.18);
    this.playMetallicClang(560, 0.18, 0.13);
    this.playLayerTone({ startFreq: 620, endFreq: 420, duration: 0.18, type: "sine", vol: 0.15, delay: 0.03, sendAmbiance: true });
  }

  // --- SWORD / DAGGER / SHADOW / VOID / COSMIC ---
  playSlash() {
    this.playLayerTone({ startFreq: this.jitter(680, 0.07), endFreq: 190, duration: 0.09, type: "sawtooth", vol: 0.15, filterFreq: 2600 });
    this.playMetallicClang(this.jitter(820, 0.08), 0.08, 0.06);
    this.playFilteredNoise({ duration: 0.09, filterType: "bandpass", freqStart: 2200, freqEnd: 700, q: 1.5, gainPeak: 0.14 });
  }

  playDaggerSlash(step = 0) {
    const pitch = this.jitter(step === 2 ? 1120 : step === 1 ? 940 : 840, 0.06);
    this.playLayerTone({ startFreq: pitch, endFreq: 260, duration: 0.08, type: "sawtooth", vol: 0.15, filterFreq: 3200 });
    this.playMetallicClang(pitch * 1.1, 0.07, 0.07);
    this.playFilteredNoise({ duration: 0.08, filterType: "highpass", freqStart: 2600, freqEnd: 1200, q: 1.6, gainPeak: 0.14 });
  }

  playHeavySword(step = 0) {
    const pitch = this.jitter(step === 2 ? 420 : 520, 0.05);
    this.playSubPunch(170, 54, 0.15, 0.22);
    this.playLayerTone({ startFreq: pitch, endFreq: 120, duration: 0.15, type: "sawtooth", vol: 0.19, filterFreq: 2200 });
    this.playMetallicClang(pitch * 0.9, 0.16, 0.11);
    this.playFilteredNoise({ duration: 0.14, filterType: "bandpass", freqStart: 1500, freqEnd: 420, q: 1.4, gainPeak: 0.19 });
  }

  playDash() {
    this.playLayerTone({ startFreq: 260, endFreq: 660, duration: 0.15, type: "triangle", vol: 0.18, sendAmbiance: true });
    this.playFilteredNoise({ duration: 0.16, filterType: "bandpass", freqStart: 900, freqEnd: 2400, q: 1.8, gainPeak: 0.16 });
  }

  playSmokeVanish() {
    this.playLayerTone({ startFreq: 360, endFreq: 150, duration: 0.18, type: "sine", vol: 0.18, sendAmbiance: true });
    this.playFilteredNoise({ duration: 0.24, filterType: "lowpass", freqStart: 1400, freqEnd: 320, q: 1.2, gainPeak: 0.22 });
  }

  playAmbushSlash() {
    this.playSubPunch(195, 54, 0.14, 0.22);
    this.playLayerTone({ startFreq: 1180, endFreq: 290, duration: 0.14, type: "sawtooth", vol: 0.19, filterFreq: 3400 });
    this.playMetallicClang(1080, 0.16, 0.12);
    this.playFilteredNoise({ duration: 0.14, filterType: "highpass", freqStart: 2400, freqEnd: 950, q: 1.5, gainPeak: 0.2 });
  }

  playDeathSeal() {
    this.playSubPunch(155, 44, 0.2, 0.22);
    this.playLayerTone({ startFreq: 620, endFreq: 140, duration: 0.22, type: "sawtooth", vol: 0.2, filterFreq: 2200, sendAmbiance: true });
    this.playLayerTone({ startFreq: 980, endFreq: 320, duration: 0.2, type: "sine", vol: 0.16, delay: 0.03, sendAmbiance: true });
    this.playFilteredNoise({ duration: 0.2, filterType: "bandpass", freqStart: 2200, freqEnd: 650, q: 2.0, gainPeak: 0.2 });
  }

  playRealmSlash() {
    this.playSubPunch(145, 36, 0.36, 0.3);
    this.playLayerTone({ startFreq: 180, endFreq: 48, duration: 0.38, type: "sawtooth", vol: 0.24, filterFreq: 1800, sendAmbiance: true });
    this.playLayerTone({ startFreq: 1360, endFreq: 260, duration: 0.2, type: "sawtooth", vol: 0.2, delay: 0.04, filterFreq: 3400, sendAmbiance: true });
    this.playFilteredNoise({ duration: 0.26, filterType: "bandpass", freqStart: 3200, freqEnd: 800, q: 2.2, gainPeak: 0.24 });
  }

  playOrb() {
    this.playLayerTone({ startFreq: this.jitter(340, 0.06), endFreq: 620, duration: 0.13, type: "sine", vol: 0.16, sendAmbiance: true });
    this.playLayerTone({ startFreq: 680, endFreq: 920, duration: 0.1, type: "triangle", vol: 0.08, delay: 0.02, sendAmbiance: true });
  }

  playCosmic() {
    this.playChord([280, 420, 560], 0.22, { type: "sine", vol: 0.12, stagger: 0.02, sendAmbiance: true });
    this.playLayerTone({ startFreq: 640, endFreq: 320, duration: 0.15, type: "sawtooth", vol: 0.09, filterFreq: 1800 });
  }

  playBlackHole() {
    this.playSubPunch(130, 32, 0.48, 0.3);
    this.playLayerTone({ startFreq: 190, endFreq: 58, duration: 0.48, type: "sine", vol: 0.24, sendAmbiance: true });
    this.playLayerTone({ startFreq: 280, endFreq: 110, duration: 0.46, type: "sawtooth", vol: 0.13, delay: 0.04, filterFreq: 1400 });
    this.playFilteredNoise({ duration: 0.48, filterType: "bandpass", freqStart: 750, freqEnd: 180, q: 2.6, gainPeak: 0.22, sendAmbiance: true });
  }

  playBossWarn() {
    this.playSubPunch(115, 38, 0.28, 0.26);
    this.playLayerTone({ startFreq: 210, endFreq: 145, duration: 0.26, type: "sawtooth", vol: 0.18, filterFreq: 1300, sendAmbiance: true });
    this.playLayerTone({ startFreq: 145, endFreq: 110, duration: 0.28, type: "triangle", vol: 0.18, delay: 0.08, sendAmbiance: true });
  }

  playDragonBreath() {
    if (this.canThrottle("dragonBreath", 85)) return;
    this.playLayerTone({ startFreq: 170, endFreq: 62, duration: 0.34, type: "sawtooth", vol: 0.22, filterFreq: 1500 });
    this.playLayerTone({ startFreq: 260, endFreq: 105, duration: 0.28, type: "triangle", vol: 0.15, delay: 0.02 });
    this.playFire(0.36, 0.28);
  }

  playPoisonPool() {
    if (this.canThrottle("poisonPool", 90)) return;
    this.playLayerTone({ startFreq: 290, endFreq: 140, duration: 0.22, type: "sine", vol: 0.18, sendAmbiance: true });
    this.playLayerTone({ startFreq: 420, endFreq: 210, duration: 0.18, type: "triangle", vol: 0.12, delay: 0.03 });
    this.playFilteredNoise({ duration: 0.28, filterType: "bandpass", freqStart: 950, freqEnd: 340, q: 2.2, gainPeak: 0.2 });
  }

  playBloodMoon() {
    if (this.canThrottle("bloodMoon", 90)) return;
    this.playSubPunch(155, 44, 0.24, 0.24);
    this.playLayerTone({ startFreq: 540, endFreq: 130, duration: 0.3, type: "sawtooth", vol: 0.2, filterFreq: 2200, sendAmbiance: true });
    this.playLayerTone({ startFreq: 220, endFreq: 68, duration: 0.34, type: "triangle", vol: 0.2, delay: 0.03 });
    this.playFilteredNoise({ duration: 0.28, filterType: "bandpass", freqStart: 1800, freqEnd: 460, q: 1.8, gainPeak: 0.22 });
  }

  playHolyLight() {
    if (this.canThrottle("holyLight", 90)) return;
    this.playChord([587.33, 880, 1318.51], 0.28, { type: "sine", vol: 0.13, stagger: 0.03, sendAmbiance: true });
    this.playFilteredNoise({ duration: 0.24, filterType: "highpass", freqStart: 2600, freqEnd: 1200, q: 1.4, gainPeak: 0.14 });
  }

  playOmegaCataclysm() {
    if (this.canThrottle("omegaCataclysm", 95)) return;
    this.playSubPunch(120, 30, 0.48, 0.36);
    this.playLayerTone({ startFreq: 130, endFreq: 34, duration: 0.48, type: "sawtooth", vol: 0.26, filterFreq: 1600, sendAmbiance: true });
    this.playLayerTone({ startFreq: 620, endFreq: 180, duration: 0.36, type: "sawtooth", vol: 0.18, delay: 0.04, filterFreq: 2400 });
    this.playFilteredNoise({ duration: 0.48, filterType: "lowpass", freqStart: 1200, freqEnd: 150, q: 1.0, gainPeak: 0.32, sendAmbiance: true });
  }

  playActiveItem(kind = "shield") {
    if (kind === "storm_wrath") {
      this.playThunderStrike();
      return;
    }
    if (kind === "blood_frenzy") {
      this.playLayerTone({ startFreq: 320, endFreq: 740, duration: 0.18, type: "sawtooth", vol: 0.18, filterFreq: 2400, sendAmbiance: true });
      this.playLayerTone({ startFreq: 640, endFreq: 960, duration: 0.2, type: "triangle", vol: 0.16, delay: 0.05, sendAmbiance: true });
      return;
    }
    if (kind === "crimson_phase") {
      this.playDash();
      this.playLayerTone({ startFreq: 440, endFreq: 880, duration: 0.18, type: "sine", vol: 0.18, delay: 0.03, sendAmbiance: true });
      return;
    }
    if (kind === "emperor_ascension" || kind === "immortal_dome") {
      this.playHolyLight();
      this.playShieldBlock();
      return;
    }
    this.playShieldBlock();
    this.playLayerTone({ startFreq: 520, endFreq: 1040, duration: 0.22, type: "sine", vol: 0.18, delay: 0.03, sendAmbiance: true });
  }

  playDroneSwitch() {
    if (this.canThrottle("droneSwitch", 80)) return;
    this.playLayerTone({ startFreq: 520, endFreq: 1040, duration: 0.11, type: "sine", vol: 0.18, sendAmbiance: true });
    this.playLayerTone({ startFreq: 780, endFreq: 1320, duration: 0.1, type: "triangle", vol: 0.12, delay: 0.04 });
  }

  playTurretShot() {
    if (this.canThrottle("turretShot", 70)) return;
    this.playLayerTone({ startFreq: this.jitter(860, 0.07), endFreq: 280, duration: 0.09, type: "square", vol: 0.08, filterFreq: 2600 });
    this.playFilteredNoise({ duration: 0.07, filterType: "bandpass", freqStart: 1900, freqEnd: 700, q: 2.0, gainPeak: 0.11 });
  }

  playPortalOpen() {
    if (this.canThrottle("portalOpen", 90)) return;
    this.playChord([260, 390, 520], 0.28, { type: "sine", vol: 0.12, stagger: 0.03, sendAmbiance: true });
    this.playFilteredNoise({ duration: 0.26, filterType: "bandpass", freqStart: 1600, freqEnd: 520, q: 1.8, gainPeak: 0.18, sendAmbiance: true });
  }

  playLaserRay() {
    if (this.canThrottle("laserRay", 95)) return;
    this.playSubPunch(165, 52, 0.26, 0.24);
    this.playLayerTone({ startFreq: 180, endFreq: 72, duration: 0.42, type: "sawtooth", vol: 0.22, filterFreq: 2000, sendAmbiance: true });
    this.playLayerTone({ startFreq: 920, endFreq: 320, duration: 0.36, type: "sawtooth", vol: 0.15, delay: 0.02, filterFreq: 3200 });
    this.playFilteredNoise({ duration: 0.38, filterType: "bandpass", freqStart: 2400, freqEnd: 480, q: 1.4, gainPeak: 0.24 });
  }

  playSanctuaryWave() {
    if (this.canThrottle("sanctuaryWave", 90)) return;
    this.playChord([440, 554.37, 659.25, 880], 0.32, { type: "sine", vol: 0.12, stagger: 0.04, sendAmbiance: true });
  }

  playMissileBarrage() {
    if (this.canThrottle("missileBarrage", 85)) return;
    this.playSubPunch(180, 56, 0.22, 0.22);
    this.playLayerTone({ startFreq: 260, endFreq: 82, duration: 0.26, type: "sawtooth", vol: 0.19, filterFreq: 1800 });
    this.playFilteredNoise({ duration: 0.28, filterType: "lowpass", freqStart: 1300, freqEnd: 220, q: 1.2, gainPeak: 0.25, sendAmbiance: true });
  }

  playShurikenThrow() {
    if (this.canThrottle("shurikenThrow", 38)) return;
    this.playLayerTone({ startFreq: this.jitter(1180, 0.08), endFreq: 420, duration: 0.08, type: "triangle", vol: 0.14 });
    this.playMetallicClang(this.jitter(1420, 0.06), 0.06, 0.06);
    this.playFilteredNoise({ duration: 0.07, filterType: "bandpass", freqStart: 3200, freqEnd: 1100, q: 2.8, gainPeak: 0.16 });
  }

  playDecoySummon() {
    if (this.canThrottle("decoySummon", 110)) return;
    this.playLayerTone({ startFreq: 320, endFreq: 640, duration: 0.16, type: "triangle", vol: 0.18, sendAmbiance: true });
    this.playLayerTone({ startFreq: 480, endFreq: 220, duration: 0.18, type: "sine", vol: 0.14, delay: 0.04, sendAmbiance: true });
    this.playFilteredNoise({ duration: 0.18, filterType: "lowpass", freqStart: 1200, freqEnd: 320, q: 1.4, gainPeak: 0.22 });
  }

  playDecoyDetonate() {
    if (this.canThrottle("decoyDetonate", 120)) return;
    this.playSubPunch(180, 42, 0.34, 0.3);
    this.playLayerTone({ startFreq: 190, endFreq: 48, duration: 0.38, type: "sawtooth", vol: 0.26, filterFreq: 1800, sendAmbiance: true });
    this.playLayerTone({ startFreq: 540, endFreq: 140, duration: 0.32, type: "triangle", vol: 0.18, delay: 0.02 });
    this.playFilteredNoise({ duration: 0.36, filterType: "lowpass", freqStart: 1800, freqEnd: 180, q: 1.2, gainPeak: 0.34 });
  }

  playDuyHealOrb() {
    if (this.canThrottle("duyHealOrb", 95)) return;
    this.playChord([587.33, 880, 1174.66], 0.18, { type: "sine", vol: 0.11, stagger: 0.03, sendAmbiance: true });
  }

  playPhongDash() {
    if (this.canThrottle("phongDash", 55)) return;
    this.playLayerTone({ startFreq: 1320, endFreq: 380, duration: 0.13, type: "sine", vol: 0.18, sendAmbiance: true });
    this.playFilteredNoise({ duration: 0.14, filterType: "highpass", freqStart: 3800, freqEnd: 1200, gainPeak: 0.18, sendAmbiance: true });
  }

  playPhongIllusionSpawn() {
    if (this.canThrottle("phongIllusion", 80)) return;
    this.playChord([659.25, 987.77, 1318.51], 0.2, { type: "sine", vol: 0.095, stagger: 0.025, sendAmbiance: true });
    this.playFilteredNoise({ duration: 0.14, filterType: "bandpass", freqStart: 2200, freqEnd: 800, q: 2.0, gainPeak: 0.12 });
  }

  playPhongSwap() {
    if (this.canThrottle("phongSwap", 90)) return;
    this.playSubPunch(195, 70, 0.18, 0.2);
    this.playLayerTone({ startFreq: 980, endFreq: 1960, duration: 0.14, type: "triangle", vol: 0.16, sendAmbiance: true });
    this.playChord([523.25, 783.99, 1046.5], 0.22, { type: "sine", vol: 0.09, delay: 0.04, stagger: 0.02 });
  }

  playPhongDeathFlurry() {
    if (this.canThrottle("phongFlurry", 110)) return;
    this.playSubPunch(170, 46, 0.26, 0.28);
    this.playMetallicClang(1480, 0.22, 0.15);
    this.playChord([440, 659.25, 880, 1318.51], 0.34, { type: "triangle", vol: 0.11, stagger: 0.03, sendAmbiance: true });
    this.playFilteredNoise({ duration: 0.28, filterType: "highpass", freqStart: 3200, freqEnd: 900, gainPeak: 0.22 });
  }

  playDangTigerPunch(step = 1) {
    if (this.canThrottle("dangPunch", 50)) return;
    const base = 130 + (step % 3) * 18;
    this.playSubPunch(base + 55, 42, 0.16, 0.26);
    this.playLayerTone({ startFreq: 260 + step * 30, endFreq: 75, duration: 0.14, type: "sawtooth", vol: 0.16, filterFreq: 1400 });
    this.playFilteredNoise({ duration: 0.12, filterType: "lowpass", freqStart: 1600, freqEnd: 260, gainPeak: 0.2 });
  }

  playDangTigerWave() {
    if (this.canThrottle("dangWave", 80)) return;
    this.playSubPunch(160, 48, 0.2, 0.26);
    this.playLayerTone({ startFreq: 380, endFreq: 110, duration: 0.22, type: "sawtooth", vol: 0.2, filterFreq: 1900, sendAmbiance: true });
    this.playFilteredNoise({ duration: 0.2, filterType: "bandpass", freqStart: 1500, freqEnd: 420, q: 1.4, gainPeak: 0.24 });
  }

  playDangBlackArmor() {
    if (this.canThrottle("dangArmor", 100)) return;
    this.playSubPunch(140, 52, 0.22, 0.22);
    this.playChord([293.66, 440, 587.33], 0.3, { type: "triangle", vol: 0.12, stagger: 0.03, sendAmbiance: true });
    this.playMetallicClang(420, 0.18, 0.1);
  }

  playDangTigerRoar() {
    if (this.canThrottle("dangRoar", 120)) return;
    this.playSubPunch(145, 34, 0.38, 0.34);
    this.playLayerTone({ startFreq: 210, endFreq: 58, duration: 0.42, type: "sawtooth", vol: 0.26, filterFreq: 1350, sendAmbiance: true });
    this.playLayerTone({ startFreq: 315, endFreq: 86, duration: 0.36, type: "triangle", vol: 0.18, delay: 0.03, filterFreq: 1600 });
    this.playFilteredNoise({ duration: 0.36, filterType: "lowpass", freqStart: 1900, freqEnd: 220, q: 1.1, gainPeak: 0.32, sendAmbiance: true });
  }

  playThienBasic(step = 0) {
    if (this.canThrottle("thienBasic", 45)) return;
    const base = 740 + (step % 3) * 90;
    this.playLayerTone({ startFreq: this.jitter(base, 0.05), endFreq: base * 1.45, duration: 0.11, type: "sine", vol: 0.14, sendAmbiance: true });
    this.playMetallicClang(base * 1.65, 0.09, 0.08);
    this.playFilteredNoise({ duration: 0.09, filterType: "highpass", freqStart: 3600, freqEnd: 1600, q: 1.5, gainPeak: 0.12 });
  }

  playThienSwords() {
    if (this.canThrottle("thienSwords", 75)) return;
    this.playSubPunch(175, 58, 0.18, 0.22);
    this.playChord([659.25, 880, 1174.66, 1567.98], 0.32, { type: "triangle", vol: 0.11, stagger: 0.025, sendAmbiance: true });
    for (let i = 0; i < 4; i++) {
      this.playMetallicClang(1480 + i * 210, 0.1, 0.075, i * 0.032);
    }
    this.playFilteredNoise({ duration: 0.22, filterType: "highpass", freqStart: 4200, freqEnd: 1500, gainPeak: 0.18, sendAmbiance: true });
  }

  playThienTimeZone() {
    if (this.canThrottle("thienTime", 95)) return;
    this.playSubPunch(135, 42, 0.28, 0.24);
    this.playChord([523.25, 659.25, 987.77, 1318.51], 0.42, { type: "sine", vol: 0.11, stagger: 0.035, sendAmbiance: true });
    this.playLayerTone({ startFreq: 1680, endFreq: 420, duration: 0.32, type: "sine", vol: 0.13, sendAmbiance: true });
  }

  playThienPortal(isReturn = false) {
    if (this.canThrottle("thienPortal", 75)) return;
    this.playSubPunch(165, 50, 0.22, 0.24);
    this.playLayerTone({
      startFreq: isReturn ? 1240 : 480,
      endFreq: isReturn ? 480 : 1480,
      duration: 0.22,
      type: "sine",
      vol: 0.16,
      sendAmbiance: true,
    });
    this.playChord([587.33, 880, 1174.66], 0.26, { type: "triangle", vol: 0.1, stagger: 0.025, sendAmbiance: true });
  }

  playThienSunUlt() {
    if (this.canThrottle("thienUlt", 140)) return;
    this.playSubPunch(115, 28, 0.55, 0.38);
    this.playChord([392, 587.33, 783.99, 1174.66, 1567.98], 0.65, {
      type: "triangle",
      vol: 0.14,
      delay: 0.02,
      stagger: 0.035,
      sendAmbiance: true,
    });
    this.playLayerTone({ startFreq: 210, endFreq: 840, duration: 0.48, type: "sawtooth", vol: 0.18, filterFreq: 2400, sendAmbiance: true });
    this.playFilteredNoise({ duration: 0.52, filterType: "bandpass", freqStart: 2600, freqEnd: 320, q: 1.2, gainPeak: 0.32, sendAmbiance: true });
  }

  playThienAscend() {
    if (this.canThrottle("thienAscend", 120)) return;
    this.playSubPunch(145, 44, 0.28, 0.26);
    this.playChord([523.25, 659.25, 783.99, 1046.5, 1318.51], 0.52, {
      type: "sine",
      vol: 0.12,
      stagger: 0.04,
      sendAmbiance: true,
    });
  }

  playThienGodMode(active = true) {
    if (this.canThrottle("thienGod", 90)) return;
    this.playSubPunch(active ? 130 : 165, 46, 0.22, 0.24);
    this.playChord(active ? [587.33, 880, 1174.66, 1760] : [880, 587.33, 440], 0.34, {
      type: "sine",
      vol: 0.12,
      stagger: 0.03,
      sendAmbiance: true,
    });
  }

  playThanhSnakeCast(isEcho = false) {
    if (this.canThrottle("thanhCast", isEcho ? 35 : 55)) return;
    const fStart = isEcho ? 2300 : 1900;
    const fEnd = isEcho ? 3800 : 3400;
    this.playFilteredNoise({ duration: 0.16, filterType: "bandpass", freqStart: fStart, freqEnd: fEnd, q: 2.8, gainPeak: isEcho ? 0.11 : 0.14, sendAmbiance: true });
    this.playLayerTone({ startFreq: isEcho ? 620 : 520, endFreq: isEcho ? 1020 : 860, duration: 0.15, type: "triangle", vol: isEcho ? 0.1 : 0.13, sendAmbiance: true });
  }

  playThanhDevour() {
    if (this.canThrottle("thanhDevour", 110)) return;
    this.playSubPunch(125, 36, 0.36, 0.34);
    this.playLayerTone({ startFreq: 210, endFreq: 95, duration: 0.32, type: "sawtooth", vol: 0.15, filterFreq: 980, sendAmbiance: true });
    this.playFilteredNoise({ duration: 0.24, filterType: "bandpass", freqStart: 1200, freqEnd: 460, q: 1.5, gainPeak: 0.2, sendAmbiance: true });
  }

  playThanhGuardShield() {
    if (this.canThrottle("thanhGuard", 85)) return;
    this.playChord([392, 523.25, 659.25, 783.99], 0.3, { type: "sine", vol: 0.11, stagger: 0.03, sendAmbiance: true });
    this.playFilteredNoise({ duration: 0.15, filterType: "highpass", freqStart: 2200, freqEnd: 1200, gainPeak: 0.1, sendAmbiance: true });
  }

  /** @param {number | string} [ammo] */
  playNhiAmmoSwitch(ammo = 0) {
    if (this.canThrottle("nhiAmmo", 50)) return;
    const idx = typeof ammo === "string" ? (ammo === "green" ? 1 : ammo === "life" ? 2 : 0) : ammo;
    const baseFreqs = [620, 740, 880];
    const f = baseFreqs[Math.abs(idx) % 3] || 660;
    this.playMetallicClang(f, 0.09, 0.08);
    this.playLayerTone({ startFreq: f, endFreq: f * 1.38, duration: 0.11, type: "triangle", vol: 0.12, sendAmbiance: true });
  }

  playNhiFlaskBreak() {
    if (this.canThrottle("nhiFlask", 75)) return;
    this.playSubPunch(160, 56, 0.18, 0.22);
    this.playFilteredNoise({ duration: 0.22, filterType: "highpass", freqStart: 3200, freqEnd: 950, gainPeak: 0.18, sendAmbiance: true });
    this.playLayerTone({ startFreq: 920, endFreq: 380, duration: 0.18, type: "sawtooth", vol: 0.1, filterFreq: 1600, sendAmbiance: true });
  }

  playNhiPoisonSizzle() {
    if (this.canThrottle("nhiSizzle", 120)) return;
    this.playFilteredNoise({ duration: 0.14, filterType: "bandpass", freqStart: 2400, freqEnd: 3600, q: 2.2, gainPeak: 0.11, sendAmbiance: true });
  }

  playNhiUltShot() {
    if (this.canThrottle("nhiUlt", 100)) return;
    this.playSubPunch(145, 42, 0.26, 0.28);
    this.playLayerTone({ startFreq: 1120, endFreq: 340, duration: 0.26, type: "sawtooth", vol: 0.16, filterFreq: 2800, sendAmbiance: true });
    this.playFilteredNoise({ duration: 0.24, filterType: "bandpass", freqStart: 2600, freqEnd: 780, q: 1.4, gainPeak: 0.22, sendAmbiance: true });
  }

  playCerberusRoar() {
    if (this.canThrottle("cerberusRoar", 140)) return;
    // Deep seismic bass slam + 3 staggered demonic hound growls + lightning snap
    this.playSubPunch(110, 26, 0.58, 0.36);
    this.playLayerTone({ startFreq: 145, endFreq: 54, duration: 0.44, type: "sawtooth", vol: 0.18, filterFreq: 920, sendAmbiance: true });
    this.playLayerTone({ startFreq: 192, endFreq: 68, duration: 0.48, type: "sawtooth", vol: 0.15, filterFreq: 1200, delay: 0.045, sendAmbiance: true });
    this.playLayerTone({ startFreq: 235, endFreq: 86, duration: 0.52, type: "sawtooth", vol: 0.14, filterFreq: 1450, delay: 0.09, sendAmbiance: true });
    this.playChord([293.66, 440, 587.33, 880], 0.42, { type: "triangle", vol: 0.11, delay: 0.02, stagger: 0.03, sendAmbiance: true });
    this.playFilteredNoise({ duration: 0.46, filterType: "bandpass", freqStart: 2200, freqEnd: 340, q: 1.4, gainPeak: 0.26, sendAmbiance: true });
  }

  playMinhBasic() {
    if (this.canThrottle("minhBasic", 60)) return;
    this.playLayerTone({ startFreq: 660, endFreq: 990, duration: 0.12, type: "sine", vol: 0.12, sendAmbiance: true });
    this.playLayerTone({ startFreq: 1320, endFreq: 880, duration: 0.11, type: "triangle", vol: 0.07, delay: 0.02, sendAmbiance: true });
  }

  playMinhChains() {
    if (this.canThrottle("minhChains", 80)) return;
    this.playMetallicClang(1120, 0.18, 0.12);
    this.playLayerTone({ startFreq: 523.25, endFreq: 784, duration: 0.22, type: "triangle", vol: 0.13, sendAmbiance: true });
    this.playFilteredNoise({ duration: 0.18, filterType: "highpass", freqStart: 3200, freqEnd: 1500, gainPeak: 0.13, sendAmbiance: true });
  }

  playMinhSanctuary() {
    if (this.canThrottle("minhSanct", 90)) return;
    this.playSubPunch(165, 58, 0.2, 0.18);
    this.playChord([523.25, 659.25, 987.77, 1318.5], 0.34, { type: "sine", vol: 0.11, stagger: 0.03, sendAmbiance: true });
  }

  playMinhPrison() {
    if (this.canThrottle("minhPrison", 110)) return;
    this.playSubPunch(125, 42, 0.3, 0.26);
    this.playMetallicClang(840, 0.24, 0.13);
    this.playChord([392, 523.25, 783.99, 1046.5], 0.42, { type: "triangle", vol: 0.12, stagger: 0.035, sendAmbiance: true });
  }

  playMinhPrisonDetonate() {
    if (this.canThrottle("minhDet", 90)) return;
    this.playSubPunch(115, 34, 0.36, 0.28);
    this.playChord([587.33, 783.99, 1174.66], 0.38, { type: "sine", vol: 0.14, stagger: 0.02, sendAmbiance: true });
    this.playFilteredNoise({ duration: 0.26, filterType: "bandpass", freqStart: 2400, freqEnd: 680, q: 1.5, gainPeak: 0.2, sendAmbiance: true });
  }

  playDucAnhSmash() {
    if (this.canThrottle("ducanhAtk", 65)) return;
    this.playSubPunch(118, 44, 0.14, 0.2);
    this.playMetallicClang(460, 0.14, 0.12);
    this.playFilteredNoise({ duration: 0.12, filterType: "lowpass", freqStart: 1200, freqEnd: 320, gainPeak: 0.16, sendAmbiance: true });
  }

  playDucAnhRoll() {
    if (this.canThrottle("ducanhRoll", 100)) return;
    this.playSubPunch(95, 32, 0.32, 0.28);
    this.playMetallicClang(520, 0.22, 0.14);
    this.playLayerTone({ startFreq: 165, endFreq: 92, duration: 0.32, type: "sawtooth", vol: 0.14, filterFreq: 920, sendAmbiance: true });
  }

  playDucAnhFortress() {
    if (this.canThrottle("ducanhFort", 100)) return;
    this.playSubPunch(110, 36, 0.26, 0.26);
    this.playMetallicClang(680, 0.26, 0.16);
    this.playChord([220, 329.63, 440], 0.28, { type: "triangle", vol: 0.1, stagger: 0.025, sendAmbiance: true });
  }

  playDucAnhMeteor() {
    if (this.canThrottle("ducanhMeteor", 110)) return;
    this.playSubPunch(88, 24, 0.54, 0.36);
    this.playMetallicClang(380, 0.3, 0.16);
    this.playLayerTone({ startFreq: 280, endFreq: 52, duration: 0.42, type: "sawtooth", vol: 0.16, filterFreq: 1100, sendAmbiance: true });
    this.playFilteredNoise({ duration: 0.4, filterType: "bandpass", freqStart: 1900, freqEnd: 280, q: 1.2, gainPeak: 0.26, sendAmbiance: true });
  }

  // =========================================================
  // MAP 2: HOẢ NGỤC TÀN TRO (INFERNO ASH) AUDIO CUES & AMBIENCE
  // =========================================================

  playInfernoThunder() {
    if (this.canThrottle("infThunder", 180)) return;
    this.playSubPunch(72, 24, 0.58, 0.34);
    this.playLayerTone({ startFreq: this.jitter(145, 0.08), endFreq: 38, duration: 0.52, type: "sawtooth", vol: 0.18, filterFreq: 780, sendAmbiance: true });
    this.playFilteredNoise({ duration: 0.48, filterType: "lowpass", freqStart: 2200, freqEnd: 180, q: 0.9, gainPeak: 0.28, sendAmbiance: true });
  }

  playInfernoWhisper() {
    if (this.canThrottle("infWhisper", 450)) return;
    this.playFilteredNoise({ duration: 0.42, filterType: "bandpass", freqStart: 1650, freqEnd: 920, q: 4.5, gainPeak: 0.085, sendAmbiance: true });
    this.playLayerTone({ startFreq: this.jitter(784, 0.04), endFreq: 698, duration: 0.36, type: "sine", vol: 0.065, delay: 0.04, sendAmbiance: true });
    this.playLayerTone({ startFreq: 587, endFreq: 523, duration: 0.34, type: "sine", vol: 0.05, delay: 0.14, sendAmbiance: true });
  }

  playInfernoTerminalLog() {
    if (this.canThrottle("infTerminal", 220)) return;
    this.playLayerTone({ startFreq: 1180, endFreq: 1180, duration: 0.06, type: "square", vol: 0.085, filterFreq: 2400 });
    this.playLayerTone({ startFreq: 880, endFreq: 980, duration: 0.07, type: "square", vol: 0.075, delay: 0.075, filterFreq: 2400 });
    this.playLayerTone({ startFreq: 1320, endFreq: 1320, duration: 0.09, type: "triangle", vol: 0.09, delay: 0.16, sendAmbiance: true });
    this.playFilteredNoise({ duration: 0.28, filterType: "bandpass", freqStart: 2400, freqEnd: 1600, q: 3.0, gainPeak: 0.045, delay: 0.1 });
  }

  playInfernoSecretDiscovery() {
    if (this.canThrottle("infSecret", 250)) return;
    this.playSubPunch(115, 44, 0.28, 0.22);
    this.playChord([293.66, 440, 523.25, 659.25], 0.48, { type: "triangle", vol: 0.11, stagger: 0.04, sendAmbiance: true });
    this.playChord([880, 1174.66], 0.36, { type: "sine", vol: 0.085, delay: 0.14, stagger: 0.04, sendAmbiance: true });
  }

  playInfernoTrungLaugh() {
    if (this.canThrottle("infTrungLaugh", 500)) return;
    this.playSubPunch(82, 34, 0.38, 0.2);
    const notes = [245, 222, 198, 174];
    notes.forEach((f, idx) => {
      const delay = idx * 0.17;
      this.playLayerTone({ startFreq: f, endFreq: f * 0.84, duration: 0.13, type: "sawtooth", vol: 0.075, delay, filterFreq: 760, sendAmbiance: true });
      this.playLayerTone({ startFreq: f * 1.5, endFreq: f * 1.28, duration: 0.12, type: "sine", vol: 0.055, delay, sendAmbiance: true });
    });
  }

  playInfernoDoorUnlock() {
    if (this.canThrottle("infDoor", 180)) return;
    this.playSubPunch(130, 42, 0.26, 0.24);
    this.playMetallicClang(420, 0.24, 0.14);
    this.playMetallicClang(620, 0.2, 0.11, 0.09);
    this.playFilteredNoise({ duration: 0.24, filterType: "lowpass", freqStart: 950, freqEnd: 220, q: 1.2, gainPeak: 0.18 });
  }

  playInfernoWallShatter() {
    if (this.canThrottle("infWall", 150)) return;
    this.playSubPunch(96, 26, 0.42, 0.34);
    this.playLayerTone({ startFreq: 180, endFreq: 42, duration: 0.36, type: "sawtooth", vol: 0.2, filterFreq: 1200, sendAmbiance: true });
    this.playFilteredNoise({ duration: 0.38, filterType: "lowpass", freqStart: 2200, freqEnd: 190, q: 1.0, gainPeak: 0.3, sendAmbiance: true });
  }

  playInfernoMissileLock() {
    if (this.canThrottle("infLock", 240)) return;
    this.playLayerTone({ startFreq: 980, endFreq: 1280, duration: 0.075, type: "triangle", vol: 0.11 });
    this.playLayerTone({ startFreq: 1180, endFreq: 1480, duration: 0.085, type: "triangle", vol: 0.11, delay: 0.095 });
  }

  updateInfernoAmbience(zoneId, inCombat, dt) {
    if (!this.enabled || this._pageHidden) return;
    this._infernoAmbTimer = (this._infernoAmbTimer ?? 2.5) - Math.max(0, Number(dt) || 0);
    if (this._infernoAmbTimer > 0) return;
    this._infernoAmbTimer = inCombat ? 6.5 : 4.8;
    if (!this._canSpawnVoice(false)) return;

    if (zoneId === "sacrificial_vault" || zoneId === "four_chairs") {
      this.playLayerTone({ startFreq: this.jitter(92, 0.05), endFreq: 76, duration: 0.9, type: "sine", vol: 0.06, sendAmbiance: true });
      this.playFilteredNoise({ duration: 0.65, filterType: "bandpass", freqStart: 420, freqEnd: 260, q: 2.2, gainPeak: 0.04, sendAmbiance: true });
    } else if (zoneId === "ash_square" || zoneId === "burn_archive") {
      this.playFilteredNoise({ duration: 0.72, filterType: "bandpass", freqStart: 920, freqEnd: 460, q: 1.8, gainPeak: 0.055, sendAmbiance: true });
      if (zoneId === "ash_square" && Math.random() < 0.45) {
        this.playLayerTone({ startFreq: 740, endFreq: 660, duration: 0.28, type: "sine", vol: 0.04, delay: 0.12, sendAmbiance: true });
      }
    } else if (zoneId === "meteor_crater") {
      this.playChord([146.83, 220, 277.18], 0.75, { type: "sine", vol: 0.045, stagger: 0.06, sendAmbiance: true });
    } else {
      this.playFilteredNoise({ duration: 0.68, filterType: "lowpass", freqStart: 780, freqEnd: 260, q: 1.1, gainPeak: 0.05, sendAmbiance: true });
    }
  }

  // =========================================================
  // MAP 3: BĂNG MỘ VĨNH CỬU (FROZEN TOMB) AUDIO CUES & AMBIENCE
  // =========================================================

  playFrozenBell() {
    if (this.canThrottle("ftBell", 420)) return;
    this.playSubPunch(86, 36, 0.65, 0.28);
    this.playChord([196.0, 293.66, 466.16, 587.33], 1.15, {
      type: "triangle",
      vol: 0.11,
      stagger: 0.025,
      sendAmbiance: true,
    });
    this.playMetallicClang(523.25, 0.55, 0.12);
  }

  playIceCrack() {
    if (this.canThrottle("ftCrack", 140)) return;
    this.playFilteredNoise({ duration: 0.22, filterType: "highpass", freqStart: 2800, freqEnd: 820, q: 1.6, gainPeak: 0.24, sendAmbiance: true });
    this.playLayerTone({ startFreq: 1420, endFreq: 420, duration: 0.16, type: "triangle", vol: 0.14, sendAmbiance: true });
  }

  playBlizzardWind() {
    if (this.canThrottle("ftBlizzard", 700)) return;
    this.playFilteredNoise({ duration: 0.95, filterType: "bandpass", freqStart: 420, freqEnd: 1250, q: 1.4, gainPeak: 0.16, sendAmbiance: true });
    this.playLayerTone({ startFreq: 185, endFreq: 120, duration: 0.72, type: "sine", vol: 0.07, sendAmbiance: true });
  }

  playGhostWhisper() {
    if (this.canThrottle("ftWhisper", 380)) return;
    this.playFilteredNoise({ duration: 0.48, filterType: "bandpass", freqStart: 1950, freqEnd: 880, q: 4.8, gainPeak: 0.09, sendAmbiance: true });
    this.playLayerTone({ startFreq: this.jitter(659.25, 0.04), endFreq: 523.25, duration: 0.42, type: "sine", vol: 0.065, delay: 0.05, sendAmbiance: true });
  }

  playClockReverse() {
    if (this.canThrottle("ftClock", 280)) return;
    this.playMetallicClang(1380, 0.06, 0.1);
    this.playMetallicClang(960, 0.07, 0.09, 0.16);
  }

  playResearchTape() {
    if (this.canThrottle("ftTape", 350)) return;
    this.playMetallicClang(780, 0.07, 0.12);
    this.playFilteredNoise({ duration: 0.42, filterType: "bandpass", freqStart: 1450, freqEnd: 680, q: 3.2, gainPeak: 0.075, delay: 0.06, sendAmbiance: true });
    this.playLayerTone({ startFreq: 311.13, endFreq: 207.65, duration: 0.48, type: "sine", vol: 0.09, delay: 0.1, sendAmbiance: true });
  }

  updateFrozenTombAmbience(zoneId, inCombat, dt) {
    if (!this.enabled || this._pageHidden) return;
    this._frozenAmbTimer = (this._frozenAmbTimer ?? 2.8) - Math.max(0, Number(dt) || 0);
    if (this._frozenAmbTimer > 0) return;
    this._frozenAmbTimer = inCombat ? 6.8 : 5.0;
    if (!this._canSpawnVoice(false)) return;

    if (zoneId === "zone_6" || zoneId === "zone_7") {
      this.playLayerTone({ startFreq: this.jitter(82, 0.06), endFreq: 68, duration: 0.95, type: "sine", vol: 0.055, sendAmbiance: true });
      this.playFilteredNoise({ duration: 0.65, filterType: "bandpass", freqStart: 380, freqEnd: 240, q: 2.5, gainPeak: 0.038, sendAmbiance: true });
    } else if (zoneId === "zone_3" || zoneId === "zone_4") {
      this.playFilteredNoise({ duration: 0.78, filterType: "bandpass", freqStart: 960, freqEnd: 480, q: 2.0, gainPeak: 0.048, sendAmbiance: true });
      if (Math.random() < 0.38) {
        this.playLayerTone({ startFreq: 587.33, endFreq: 523.25, duration: 0.35, type: "sine", vol: 0.036, delay: 0.1, sendAmbiance: true });
      }
    } else {
      this.playFilteredNoise({ duration: 0.72, filterType: "bandpass", freqStart: 640, freqEnd: 320, q: 1.5, gainPeak: 0.045, sendAmbiance: true });
    }
  }

  // =========================================================
  // MAP 4: RỪNG OÁN NIỆM (GRUDGE FOREST) AUDIO CUES & AMBIENCE
  // =========================================================

  playGrudgeFlute() {
    if (this.canThrottle("gfFlute", 520)) return;
    this.playLayerTone({ startFreq: 392.0, endFreq: 369.99, duration: 0.62, type: "sine", vol: 0.085, sendAmbiance: true });
    this.playLayerTone({ startFreq: 523.25, endFreq: 493.88, duration: 0.56, type: "sine", vol: 0.06, delay: 0.24, sendAmbiance: true });
    this.playFilteredNoise({ duration: 0.55, filterType: "bandpass", freqStart: 920, freqEnd: 620, q: 5.5, gainPeak: 0.03, sendAmbiance: true });
  }

  playGrudgeChime() {
    if (this.canThrottle("gfChime", 260)) return;
    this.playChord([587.33, 880, 1174.66], 0.52, { type: "sine", vol: 0.07, stagger: 0.045, sendAmbiance: true });
  }

  playGrudgeTwigSnap() {
    if (this.canThrottle("gfTwig", 180)) return;
    this.playFilteredNoise({ duration: 0.09, filterType: "bandpass", freqStart: 2400, freqEnd: 920, q: 2.2, gainPeak: 0.24 });
    this.playLayerTone({ startFreq: 640, endFreq: 190, duration: 0.075, type: "triangle", vol: 0.12 });
  }

  playGrudgeWhisper() {
    if (this.canThrottle("gfWhisper", 440)) return;
    this.playFilteredNoise({ duration: 0.52, filterType: "bandpass", freqStart: 1750, freqEnd: 780, q: 4.5, gainPeak: 0.09, sendAmbiance: true });
    this.playLayerTone({ startFreq: this.jitter(523.25, 0.04), endFreq: 440, duration: 0.44, type: "sine", vol: 0.058, delay: 0.06, sendAmbiance: true });
  }

  playGrudgeDuyLaugh() {
    if (this.canThrottle("gfDuyLaugh", 600)) return;
    this.playSubPunch(74, 30, 0.42, 0.22);
    const notes = [262, 238, 214, 186];
    notes.forEach((f, idx) => {
      const delay = idx * 0.16;
      this.playLayerTone({ startFreq: f, endFreq: f * 0.85, duration: 0.14, type: "sawtooth", vol: 0.07, delay, filterFreq: 720, sendAmbiance: true });
      this.playLayerTone({ startFreq: f * 1.48, endFreq: f * 1.32, duration: 0.13, type: "sine", vol: 0.05, delay, sendAmbiance: true });
    });
  }

  playGrudgeRootErupt() {
    if (this.canThrottle("gfRoot", 180)) return;
    this.playSubPunch(92, 28, 0.38, 0.3);
    this.playFilteredNoise({ duration: 0.34, filterType: "lowpass", freqStart: 1600, freqEnd: 200, q: 1.1, gainPeak: 0.26, sendAmbiance: true });
  }

  playGrudgeSecretDiscovery() {
    if (this.canThrottle("gfSecret", 300)) return;
    this.playSubPunch(104, 42, 0.32, 0.22);
    this.playChord([246.94, 369.99, 493.88, 659.25], 0.58, { type: "triangle", vol: 0.1, stagger: 0.04, sendAmbiance: true });
    this.playChord([783.99, 1046.5], 0.42, { type: "sine", vol: 0.075, delay: 0.15, stagger: 0.05, sendAmbiance: true });
  }

  updateGrudgeForestAmbience(zoneId, inSilenceZone, hasDanger, dt) {
    if (!this.enabled || this._pageHidden) return;
    if (inSilenceZone) return; // Sudden Silence Zones drop ambient sound cleanly
    this._grudgeAmbTimer = (this._grudgeAmbTimer ?? 2.6) - Math.max(0, Number(dt) || 0);
    if (this._grudgeAmbTimer > 0) return;
    this._grudgeAmbTimer = hasDanger ? 6.2 : 4.6;
    if (!this._canSpawnVoice(false)) return;

    if (zoneId === "zone_8" || zoneId === "zone_3") {
      this.playLayerTone({ startFreq: this.jitter(76, 0.06), endFreq: 62, duration: 0.95, type: "sine", vol: 0.055, sendAmbiance: true });
      if (Math.random() < 0.35) this.playGrudgeFlute();
    } else if (zoneId === "zone_2" || zoneId === "zone_7") {
      this.playFilteredNoise({ duration: 0.72, filterType: "bandpass", freqStart: 880, freqEnd: 420, q: 2.2, gainPeak: 0.045, sendAmbiance: true });
      if (Math.random() < 0.38) this.playGrudgeWhisper();
    } else {
      this.playFilteredNoise({ duration: 0.76, filterType: "lowpass", freqStart: 640, freqEnd: 240, q: 1.3, gainPeak: 0.048, sendAmbiance: true });
      if (Math.random() < 0.28) this.playGrudgeChime();
    }
  }

  // =========================================================
  // MAP 5: THÀNH PHỐ VẠN KHÔNG (VOID CITY) AUDIO CUES & AMBIENCE
  // =========================================================

  playVoidClockChime() {
    if (this.canThrottle("vcClock", 420)) return;
    this.playMetallicClang(440, 0.22, 0.16);
    this.playMetallicClang(220, 0.34, 0.12, 0.18);
    this.playLayerTone({ startFreq: 110, endFreq: 82.41, duration: 0.72, type: "triangle", vol: 0.09, delay: 0.08, sendAmbiance: true });
  }

  playVoidPageRustle() {
    if (this.canThrottle("vcPage", 220)) return;
    this.playFilteredNoise({ duration: 0.26, filterType: "bandpass", freqStart: 2800, freqEnd: 1100, q: 2.6, gainPeak: 0.085, sendAmbiance: true });
    this.playFilteredNoise({ duration: 0.18, filterType: "highpass", freqStart: 1900, freqEnd: 3200, q: 1.8, gainPeak: 0.055, delay: 0.09, sendAmbiance: true });
  }

  playVoidFootstep() {
    if (this.canThrottle("vcStep", 380)) return;
    this.playSubPunch(118, 46, 0.09, 0.09);
    this.playFilteredNoise({ duration: 0.1, filterType: "bandpass", freqStart: 1200, freqEnd: 420, q: 2.4, gainPeak: 0.06, delay: 0.16, sendAmbiance: true });
  }

  playVoidTheaterChord() {
    if (this.canThrottle("vcTheater", 550)) return;
    this.playChord([196.0, 233.08, 293.66, 369.99], 0.85, { type: "sine", vol: 0.072, stagger: 0.07, sendAmbiance: true });
    this.playLayerTone({ startFreq: 98.0, endFreq: 92.5, duration: 0.9, type: "triangle", vol: 0.065, sendAmbiance: true });
  }

  playVoidSecretChime() {
    if (this.canThrottle("vcSecret", 320)) return;
    this.playSubPunch(112, 46, 0.35, 0.22);
    this.playChord([293.66, 440.0, 587.33, 880.0], 0.68, { type: "sine", vol: 0.095, stagger: 0.055, sendAmbiance: true });
    this.playChord([1046.5, 1318.5], 0.48, { type: "triangle", vol: 0.065, delay: 0.2, stagger: 0.05, sendAmbiance: true });
  }

  playVoidPageStorm() {
    if (this.canThrottle("vcStorm", 280)) return;
    this.playSubPunch(86, 30, 0.38, 0.28);
    this.playFilteredNoise({ duration: 0.48, filterType: "bandpass", freqStart: 2200, freqEnd: 480, q: 1.9, gainPeak: 0.22, sendAmbiance: true });
    this.playLayerTone({ startFreq: 311.13, endFreq: 155.56, duration: 0.44, type: "sawtooth", vol: 0.07, filterFreq: 920, sendAmbiance: true });
  }

  updateVoidCityAmbience(zoneId, clockReversed, hasDanger, dt) {
    if (!this.enabled || this._pageHidden) return;
    this._voidAmbTimer = (this._voidAmbTimer ?? 2.4) - Math.max(0, Number(dt) || 0);
    if (this._voidAmbTimer > 0) return;
    this._voidAmbTimer = hasDanger ? 6.0 : 4.4;
    if (!this._canSpawnVoice(false)) return;

    if (zoneId === "zone_5") {
      this.playVoidClockChime();
    } else if (zoneId === "zone_4" || zoneId === "zone_7") {
      this.playVoidPageRustle();
      this.playLayerTone({ startFreq: this.jitter(146.83, 0.04), endFreq: 130.81, duration: 0.72, type: "sine", vol: 0.042, sendAmbiance: true });
    } else if (zoneId === "zone_3") {
      this.playVoidFootstep();
    } else if (zoneId === "zone_6") {
      if (Math.random() < 0.45) this.playVoidTheaterChord();
    } else if (zoneId === "zone_8") {
      this.playLayerTone({ startFreq: clockReversed ? 110 : 73.42, endFreq: 58.27, duration: 1.05, type: "sine", vol: 0.055, sendAmbiance: true });
    } else {
      this.playFilteredNoise({ duration: 0.8, filterType: "bandpass", freqStart: 560, freqEnd: 260, q: 1.8, gainPeak: 0.042, sendAmbiance: true });
    }
  }

  // =========================================================
  // HEROES: BÁCH, THÁI, KHAIR
  // =========================================================

  playBachDash(step = 1) {
    if (this.canThrottle("bachDash", 75)) return;
    this.playFilteredNoise({ duration: 0.16, filterType: "bandpass", freqStart: 1200 + step * 350, freqEnd: 3400, q: 1.6, gainPeak: 0.17, sendAmbiance: true });
    this.playLayerTone({ startFreq: 680 + step * 110, endFreq: 1320, duration: 0.13, type: "triangle", vol: 0.11, sendAmbiance: true });
    this.playMetallicClang(1180 + step * 160, 0.1, 0.08);
  }

  playBachDaggerFan() {
    if (this.canThrottle("bachFan", 120)) return;
    this.playFilteredNoise({ duration: 0.14, filterType: "highpass", freqStart: 2200, freqEnd: 4600, gainPeak: 0.14, sendAmbiance: true });
    [0, 1, 2].forEach((i) => {
      this.playLayerTone({ startFreq: 980 + i * 190, endFreq: 540 + i * 110, duration: 0.09, type: "sine", vol: 0.08, delay: i * 0.025 });
    });
  }

  playBachUltMatrix() {
    if (this.canThrottle("bachUlt", 240)) return;
    this.playSubPunch(125, 42, 0.24, 0.26);
    [0, 1, 2, 3, 4].forEach((i) => {
      const d = i * 0.11;
      this.playFilteredNoise({ duration: 0.1, filterType: "highpass", freqStart: 2600, freqEnd: 5200, gainPeak: 0.13, delay: d, sendAmbiance: true });
      this.playLayerTone({ startFreq: 740 + i * 130, endFreq: 1480, duration: 0.11, type: "sawtooth", vol: 0.075, delay: d, filterFreq: 2600 });
    });
    this.playChord([523.25, 783.99, 1046.5], 0.36, { type: "triangle", vol: 0.11, delay: 0.52, stagger: 0.025, sendAmbiance: true });
  }

  playThaiHalberd() {
    if (this.canThrottle("thaiAtk", 110)) return;
    this.playSubPunch(115, 44, 0.14, 0.18);
    this.playMetallicClang(440, 0.18, 0.13);
    this.playFilteredNoise({ duration: 0.14, filterType: "lowpass", freqStart: 1900, freqEnd: 450, gainPeak: 0.15, sendAmbiance: true });
  }

  playThaiSlam(upgraded = false) {
    if (this.canThrottle("thaiSlam", 140)) return;
    this.playSubPunch(upgraded ? 76 : 92, 26, 0.34, upgraded ? 0.36 : 0.28);
    this.playMetallicClang(upgraded ? 620 : 480, 0.26, 0.16);
    this.playFilteredNoise({ duration: 0.26, filterType: "lowpass", freqStart: 1400, freqEnd: 180, q: 1.2, gainPeak: 0.26, sendAmbiance: true });
  }

  playThaiRoar(upgraded = false) {
    if (this.canThrottle("thaiRoar", 180)) return;
    this.playSubPunch(95, 32, 0.3, 0.28);
    this.playLayerTone({ startFreq: 196, endFreq: upgraded ? 440 : 330, duration: 0.32, type: "sawtooth", vol: 0.14, filterFreq: 1150, sendAmbiance: true });
    if (upgraded) {
      this.playChord([293.66, 440, 587.33], 0.34, { type: "triangle", vol: 0.1, stagger: 0.03, sendAmbiance: true });
    }
  }

  playThaiArenaDomain() {
    if (this.canThrottle("thaiArena", 280)) return;
    this.playSubPunch(72, 24, 0.48, 0.38);
    this.playMetallicClang(392, 0.44, 0.2);
    this.playChord([220, 293.66, 440, 587.33], 0.56, { type: "sawtooth", vol: 0.095, filterFreq: 1500, stagger: 0.04, sendAmbiance: true });
    this.playChord([440, 659.25, 880], 0.44, { type: "triangle", vol: 0.09, delay: 0.18, stagger: 0.035, sendAmbiance: true });
  }

  playKhairSniperShot() {
    if (this.canThrottle("khairAtk", 180)) return;
    this.playSubPunch(120, 38, 0.18, 0.26);
    this.playLayerTone({ startFreq: 1650, endFreq: 320, duration: 0.16, type: "sawtooth", vol: 0.13, filterFreq: 2800, sendAmbiance: true });
    this.playFilteredNoise({ duration: 0.15, filterType: "bandpass", freqStart: 3600, freqEnd: 900, q: 1.5, gainPeak: 0.2, sendAmbiance: true });
  }

  playKhairBeacon() {
    if (this.canThrottle("khairBeacon", 160)) return;
    this.playFilteredNoise({ duration: 0.16, filterType: "highpass", freqStart: 2000, freqEnd: 4200, gainPeak: 0.14, sendAmbiance: true });
    this.playChord([523.25, 659.25, 987.77], 0.3, { type: "sine", vol: 0.09, stagger: 0.03, sendAmbiance: true });
  }

  playKhairRailAim(charge = 0) {
    if (this.canThrottle("khairAim", 240)) return;
    this.playLayerTone({ startFreq: 480 + charge * 420, endFreq: 860 + charge * 620, duration: 0.18, type: "sine", vol: 0.075, sendAmbiance: true });
  }

  playKhairRailBlast() {
    if (this.canThrottle("khairRail", 160)) return;
    this.playSubPunch(78, 22, 0.42, 0.42);
    this.playLayerTone({ startFreq: 2400, endFreq: 180, duration: 0.34, type: "sawtooth", vol: 0.18, filterFreq: 3600, sendAmbiance: true });
    this.playFilteredNoise({ duration: 0.36, filterType: "bandpass", freqStart: 4800, freqEnd: 520, q: 1.2, gainPeak: 0.32, sendAmbiance: true });
    this.playChord([587.33, 880, 1174.66], 0.28, { type: "triangle", vol: 0.09, delay: 0.03, sendAmbiance: true });
  }

  playKhairUltRecoil() {
    if (this.canThrottle("khairUlt", 240)) return;
    this.playSubPunch(66, 20, 0.48, 0.44);
    this.playLayerTone({ startFreq: 1900, endFreq: 120, duration: 0.38, type: "sawtooth", vol: 0.18, filterFreq: 3200, sendAmbiance: true });
    this.playFilteredNoise({ duration: 0.45, filterType: "lowpass", freqStart: 3200, freqEnd: 240, q: 1.0, gainPeak: 0.35, sendAmbiance: true });
  }
}

export const R = new SoundEngine();
