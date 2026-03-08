import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useGame, GameMap } from "./GameState";

// Map-specific ambient configurations
const MAP_AMBIENT: Record<GameMap, { freqs: number[]; filterFreq: number; type: OscillatorType; noiseLevel: number }> = {
  suburban:       { freqs: [110, 165, 220], filterFreq: 300, type: "sine", noiseLevel: 0.02 },
  industrial:     { freqs: [80, 120, 160], filterFreq: 400, type: "sawtooth", noiseLevel: 0.04 },
  forest:         { freqs: [130, 195, 260], filterFreq: 250, type: "sine", noiseLevel: 0.03 },
  arctic:         { freqs: [100, 150, 200, 300], filterFreq: 180, type: "sine", noiseLevel: 0.05 },
  underground:    { freqs: [55, 82, 110], filterFreq: 200, type: "triangle", noiseLevel: 0.03 },
  volcano:        { freqs: [50, 75, 100], filterFreq: 350, type: "sawtooth", noiseLevel: 0.06 },
  space_station:  { freqs: [92, 138, 184, 276], filterFreq: 500, type: "sine", noiseLevel: 0.02 },
};

// Procedural music notes — adventure-style arpeggios (BoTW-inspired calm exploration)
const EXPLORE_NOTES = [
  [261.6, 329.6, 392, 523.25], // C major
  [293.7, 349.2, 440, 587.3],  // D minor
  [329.6, 392, 493.9, 659.3],  // E minor
  [349.2, 440, 523.25, 698.5], // F major
  [392, 493.9, 587.3, 784],    // G major
  [261.6, 311.1, 392, 523.25], // Cm (tension)
];

// Intense chase notes (GD-inspired synth beats)
const CHASE_NOTES = [
  [130.8, 196, 261.6, 330],
  [146.8, 220, 293.7, 370],
  [164.8, 247, 330, 415],
  [130.8, 196, 261.6, 392],
];

class GameAudio {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private ambientOsc: OscillatorNode[] = [];
  private ambientGains: GainNode[] = [];
  private heartbeatInterval: number | null = null;
  private musicTimer: number | null = null;
  private musicGain: GainNode | null = null;
  private noiseSource: AudioBufferSourceNode | null = null;
  private noiseGain: GainNode | null = null;
  private chaseMode = false;
  private musicIndex = 0;

  init() {
    if (this.ctx) return;
    this.ctx = new AudioContext();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.35;
    this.masterGain.connect(this.ctx.destination);
    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = 0.08;
    this.musicGain.connect(this.masterGain);
  }

  startAmbient(role: string, map: GameMap) {
    if (!this.ctx || !this.masterGain) return;
    this.stopAmbient();

    const ambient = MAP_AMBIENT[map] || MAP_AMBIENT.suburban;

    // Drone oscillators
    ambient.freqs.forEach((freq, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = i < 2 ? ambient.type : "sine";
      osc.frequency.value = freq * (role === "hunter" ? 0.85 : 1);

      const filter = this.ctx!.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = ambient.filterFreq + i * 50;
      filter.Q.value = 1;

      gain.gain.value = 0;
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain!);
      osc.start();
      gain.gain.linearRampToValueAtTime(0.025 + i * 0.005, this.ctx!.currentTime + 2);

      this.ambientOsc.push(osc);
      this.ambientGains.push(gain);
    });

    // Wind/noise layer
    if (ambient.noiseLevel > 0) {
      const bufferSize = this.ctx.sampleRate * 4;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1);
      this.noiseSource = this.ctx.createBufferSource();
      this.noiseSource.buffer = buffer;
      this.noiseSource.loop = true;
      this.noiseGain = this.ctx.createGain();
      this.noiseGain.gain.value = ambient.noiseLevel;
      const noiseFilter = this.ctx.createBiquadFilter();
      noiseFilter.type = "bandpass";
      noiseFilter.frequency.value = map === "arctic" ? 800 : map === "volcano" ? 200 : 400;
      noiseFilter.Q.value = 0.5;
      this.noiseSource.connect(noiseFilter);
      noiseFilter.connect(this.noiseGain);
      this.noiseGain.connect(this.masterGain!);
      this.noiseSource.start();
    }

    // LFO
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    lfo.type = "sine";
    lfo.frequency.value = 0.12;
    lfoGain.gain.value = 2;
    lfo.connect(lfoGain);
    if (this.ambientOsc[0]) lfoGain.connect(this.ambientOsc[0].frequency);
    lfo.start();
    this.ambientOsc.push(lfo);

    // Start procedural music
    this.startMusic();
  }

  private startMusic() {
    if (this.musicTimer) clearInterval(this.musicTimer);
    this.musicIndex = 0;
    this.musicTimer = window.setInterval(() => this.playMusicNote(), 2000);
  }

  private playMusicNote() {
    if (!this.ctx || !this.musicGain) return;
    const notes = this.chaseMode ? CHASE_NOTES : EXPLORE_NOTES;
    const chord = notes[this.musicIndex % notes.length];
    this.musicIndex++;
    const now = this.ctx.currentTime;
    const tempo = this.chaseMode ? 0.15 : 0.25;

    chord.forEach((freq, i) => {
      const osc = this.ctx!.createOscillator();
      osc.type = this.chaseMode ? "square" : "triangle";
      osc.frequency.value = freq;
      const g = this.ctx!.createGain();
      const delay = i * tempo;
      g.gain.setValueAtTime(0, now + delay);
      g.gain.linearRampToValueAtTime(this.chaseMode ? 0.06 : 0.04, now + delay + 0.03);
      g.gain.exponentialRampToValueAtTime(0.001, now + delay + (this.chaseMode ? 0.3 : 0.8));

      const filter = this.ctx!.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = this.chaseMode ? 2000 : 800;

      osc.connect(filter);
      filter.connect(g);
      g.connect(this.musicGain!);
      osc.start(now + delay);
      osc.stop(now + delay + 1);
    });
  }

  setChaseMode(chase: boolean) {
    if (chase !== this.chaseMode) {
      this.chaseMode = chase;
      // Adjust music tempo
      if (this.musicTimer) clearInterval(this.musicTimer);
      this.musicTimer = window.setInterval(() => this.playMusicNote(), chase ? 800 : 2000);
    }
  }

  stopAmbient() {
    this.ambientOsc.forEach(osc => { try { osc.stop(); } catch {} });
    this.ambientOsc = [];
    this.ambientGains = [];
    if (this.noiseSource) { try { this.noiseSource.stop(); } catch {} this.noiseSource = null; }
    if (this.musicTimer) { clearInterval(this.musicTimer); this.musicTimer = null; }
  }

  playFootstep(sprinting: boolean) {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const bufferSize = this.ctx.sampleRate * 0.04;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = sprinting ? 800 : 500;
    const gain = this.ctx.createGain();
    gain.gain.value = sprinting ? 0.1 : 0.06;
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    source.connect(filter); filter.connect(gain); gain.connect(this.masterGain!);
    source.start(now); source.stop(now + 0.1);
  }

  playTag() {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const osc1 = this.ctx.createOscillator();
    osc1.type = "sine"; osc1.frequency.setValueAtTime(200, now); osc1.frequency.exponentialRampToValueAtTime(60, now + 0.15);
    const g1 = this.ctx.createGain(); g1.gain.setValueAtTime(0.35, now); g1.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    osc1.connect(g1); g1.connect(this.masterGain!); osc1.start(now); osc1.stop(now + 0.25);
    [523.25, 659.25, 783.99].forEach((freq, i) => {
      const osc = this.ctx!.createOscillator(); osc.type = "triangle"; osc.frequency.value = freq;
      const g = this.ctx!.createGain();
      g.gain.setValueAtTime(0, now + i * 0.08); g.gain.linearRampToValueAtTime(0.12, now + i * 0.08 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.3);
      osc.connect(g); g.connect(this.masterGain!); osc.start(now + i * 0.08); osc.stop(now + i * 0.08 + 0.35);
    });
  }

  playCaught() {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator(); osc.type = "sawtooth";
    osc.frequency.setValueAtTime(400, now); osc.frequency.exponentialRampToValueAtTime(50, now + 0.8);
    const g = this.ctx.createGain(); g.gain.setValueAtTime(0.25, now); g.gain.exponentialRampToValueAtTime(0.001, now + 1);
    osc.connect(g); g.connect(this.masterGain!); osc.start(now); osc.stop(now + 1.1);
  }

  playEscapeOpen() {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    [261.6, 329.6, 392, 523.25, 659.25].forEach((freq, i) => {
      const osc = this.ctx!.createOscillator(); osc.type = "sine"; osc.frequency.value = freq;
      const g = this.ctx!.createGain();
      g.gain.setValueAtTime(0, now + i * 0.12); g.gain.linearRampToValueAtTime(0.1, now + i * 0.12 + 0.05);
      g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.6);
      osc.connect(g); g.connect(this.masterGain!); osc.start(now + i * 0.12); osc.stop(now + i * 0.12 + 0.65);
    });
  }

  playVictory() {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
      const osc = this.ctx!.createOscillator(); osc.type = "triangle"; osc.frequency.value = freq;
      const g = this.ctx!.createGain();
      g.gain.setValueAtTime(0, now + i * 0.15); g.gain.linearRampToValueAtTime(0.15, now + i * 0.15 + 0.03);
      g.gain.exponentialRampToValueAtTime(0.01, now + i * 0.15 + 0.8);
      osc.connect(g); g.connect(this.masterGain!); osc.start(now + i * 0.15); osc.stop(now + i * 0.15 + 0.85);
    });
  }

  playCoinCollect() {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator(); osc.type = "sine";
    osc.frequency.setValueAtTime(800, now); osc.frequency.exponentialRampToValueAtTime(1200, now + 0.1);
    const g = this.ctx.createGain(); g.gain.setValueAtTime(0.08, now); g.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    osc.connect(g); g.connect(this.masterGain!); osc.start(now); osc.stop(now + 0.2);
  }

  playCheckpoint() {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    [523.25, 783.99, 1046.5].forEach((freq, i) => {
      const osc = this.ctx!.createOscillator(); osc.type = "triangle"; osc.frequency.value = freq;
      const g = this.ctx!.createGain();
      g.gain.setValueAtTime(0, now + i * 0.1); g.gain.linearRampToValueAtTime(0.1, now + i * 0.1 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.4);
      osc.connect(g); g.connect(this.masterGain!); osc.start(now + i * 0.1); osc.stop(now + i * 0.1 + 0.45);
    });
  }

  startHeartbeat(intensity: number) {
    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
    if (!this.ctx || !this.masterGain || intensity <= 0) return;
    const bpm = 60 + intensity * 120;
    this.heartbeatInterval = window.setInterval(() => {
      if (!this.ctx || !this.masterGain) return;
      const now = this.ctx.currentTime;
      [0, 0.1].forEach(offset => {
        const osc = this.ctx!.createOscillator(); osc.type = "sine";
        osc.frequency.setValueAtTime(offset === 0 ? 50 : 40, now + offset);
        osc.frequency.exponentialRampToValueAtTime(20, now + offset + 0.12);
        const g = this.ctx!.createGain();
        g.gain.setValueAtTime(intensity * 0.12, now + offset);
        g.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.15);
        osc.connect(g); g.connect(this.masterGain!); osc.start(now + offset); osc.stop(now + offset + 0.2);
      });
    }, 60000 / bpm);
  }

  stopHeartbeat() {
    if (this.heartbeatInterval) { clearInterval(this.heartbeatInterval); this.heartbeatInterval = null; }
  }

  setTension(level: number) {
    this.ambientGains.forEach((g, i) => {
      if (g.gain && this.ctx) {
        g.gain.linearRampToValueAtTime(0.025 + i * 0.005 + level * 0.03, this.ctx.currentTime + 0.3);
      }
    });
  }

  dispose() {
    this.stopAmbient();
    this.stopHeartbeat();
    if (this.ctx) { this.ctx.close(); this.ctx = null; }
  }
}

const gameAudio = new GameAudio();

export default function AudioSystem() {
  const { role, selectedMap, isPlaying, gameOver, gameResult, score, escapeOpen, stamina, maxStamina, matchCoins } = useGame();
  const { camera } = useThree();
  const lastPos = useRef(camera.position.clone());
  const footstepAccum = useRef(0);
  const lastScore = useRef(0);
  const lastCoins = useRef(0);
  const escapeWasOpen = useRef(false);
  const gameWasOver = useRef(false);
  const initialized = useRef(false);

  useEffect(() => {
    if (isPlaying && !initialized.current) {
      gameAudio.init();
      initialized.current = true;
      if (role && selectedMap) gameAudio.startAmbient(role, selectedMap);
    }
  }, [isPlaying, role, selectedMap]);

  useEffect(() => {
    if (score > lastScore.current && score > 0) gameAudio.playTag();
    lastScore.current = score;
  }, [score]);

  useEffect(() => {
    if (matchCoins > lastCoins.current && matchCoins > 0) gameAudio.playCoinCollect();
    lastCoins.current = matchCoins;
  }, [matchCoins]);

  useEffect(() => {
    if (escapeOpen && !escapeWasOpen.current) gameAudio.playEscapeOpen();
    escapeWasOpen.current = escapeOpen;
  }, [escapeOpen]);

  useEffect(() => {
    if (gameOver && !gameWasOver.current) {
      gameAudio.stopHeartbeat();
      if (gameResult === "win") gameAudio.playVictory();
      else gameAudio.playCaught();
      gameAudio.stopAmbient();
    }
    gameWasOver.current = gameOver;
  }, [gameOver, gameResult]);

  useEffect(() => () => { gameAudio.dispose(); initialized.current = false; }, []);

  useFrame((_, delta) => {
    if (!isPlaying || gameOver) return;
    const moved = camera.position.distanceTo(lastPos.current);
    lastPos.current.copy(camera.position);
    if (moved > 0.01) {
      const isSprinting = stamina < maxStamina - 1;
      footstepAccum.current += delta;
      if (footstepAccum.current >= (isSprinting ? 0.25 : 0.4)) {
        gameAudio.playFootstep(isSprinting);
        footstepAccum.current = 0;
      }
      gameAudio.setChaseMode(isSprinting);
    } else {
      footstepAccum.current = 0;
      gameAudio.setChaseMode(false);
    }
    if (role === "runner") {
      const staminaPct = stamina / maxStamina;
      if (staminaPct < 0.3) gameAudio.startHeartbeat(1 - staminaPct);
      else gameAudio.stopHeartbeat();
    }
  });

  return null;
}
