import { useEffect, useRef, useCallback } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useGame } from "./GameState";

// Procedural Web Audio system — no external files needed
class GameAudio {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private ambientOsc: OscillatorNode[] = [];
  private ambientGains: GainNode[] = [];
  private footstepTimer = 0;
  private isRunning = false;
  private lastTagScore = 0;
  private escapeWasOpen = false;
  private heartbeatInterval: number | null = null;

  init() {
    if (this.ctx) return;
    this.ctx = new AudioContext();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.4;
    this.masterGain.connect(this.ctx.destination);
  }

  startAmbient(role: string) {
    if (!this.ctx || !this.masterGain) return;
    this.stopAmbient();

    // Deep drone pad
    const freqs = role === "hunter" 
      ? [55, 82.5, 110, 165] // A minor – menacing
      : [65.4, 98, 130.8, 196]; // C minor – tense

    freqs.forEach((freq, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = i < 2 ? "sawtooth" : "sine";
      osc.frequency.value = freq;
      gain.gain.value = 0;
      
      // Filter for warmth
      const filter = this.ctx!.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 200 + i * 80;
      filter.Q.value = 1;

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain!);
      osc.start();

      // Fade in
      gain.gain.linearRampToValueAtTime(0.03 + i * 0.008, this.ctx!.currentTime + 2);

      this.ambientOsc.push(osc);
      this.ambientGains.push(gain);
    });

    // Add subtle LFO modulation
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    lfo.type = "sine";
    lfo.frequency.value = 0.15;
    lfoGain.gain.value = 3;
    lfo.connect(lfoGain);
    if (this.ambientOsc[0]) {
      lfoGain.connect(this.ambientOsc[0].frequency);
    }
    lfo.start();
    this.ambientOsc.push(lfo);
  }

  stopAmbient() {
    this.ambientOsc.forEach(osc => { try { osc.stop(); } catch {} });
    this.ambientOsc = [];
    this.ambientGains = [];
  }

  playFootstep(sprinting: boolean) {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    // Noise burst for footstep
    const bufferSize = this.ctx.sampleRate * 0.04;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
    }

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = sprinting ? 800 : 500;

    const gain = this.ctx.createGain();
    gain.gain.value = sprinting ? 0.12 : 0.07;
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain!);
    source.start(now);
    source.stop(now + 0.1);
  }

  playTag() {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    // Impact thud
    const osc1 = this.ctx.createOscillator();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(200, now);
    osc1.frequency.exponentialRampToValueAtTime(60, now + 0.15);
    const g1 = this.ctx.createGain();
    g1.gain.setValueAtTime(0.4, now);
    g1.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    osc1.connect(g1);
    g1.connect(this.masterGain!);
    osc1.start(now);
    osc1.stop(now + 0.25);

    // Confirmation chime
    [523.25, 659.25, 783.99].forEach((freq, i) => {
      const osc = this.ctx!.createOscillator();
      osc.type = "triangle";
      osc.frequency.value = freq;
      const g = this.ctx!.createGain();
      g.gain.setValueAtTime(0, now + i * 0.08);
      g.gain.linearRampToValueAtTime(0.15, now + i * 0.08 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.3);
      osc.connect(g);
      g.connect(this.masterGain!);
      osc.start(now + i * 0.08);
      osc.stop(now + i * 0.08 + 0.35);
    });
  }

  playCaught() {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    // Descending doom tone
    const osc = this.ctx.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(400, now);
    osc.frequency.exponentialRampToValueAtTime(50, now + 0.8);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.3, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 1);
    osc.connect(g);
    g.connect(this.masterGain!);
    osc.start(now);
    osc.stop(now + 1.1);
  }

  playEscapeOpen() {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    // Rising portal sound
    [261.6, 329.6, 392, 523.25, 659.25].forEach((freq, i) => {
      const osc = this.ctx!.createOscillator();
      osc.type = "sine";
      osc.frequency.value = freq;
      const g = this.ctx!.createGain();
      g.gain.setValueAtTime(0, now + i * 0.12);
      g.gain.linearRampToValueAtTime(0.12, now + i * 0.12 + 0.05);
      g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.6);
      osc.connect(g);
      g.connect(this.masterGain!);
      osc.start(now + i * 0.12);
      osc.stop(now + i * 0.12 + 0.65);
    });
  }

  playVictory() {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
      const osc = this.ctx!.createOscillator();
      osc.type = "triangle";
      osc.frequency.value = freq;
      const g = this.ctx!.createGain();
      g.gain.setValueAtTime(0, now + i * 0.15);
      g.gain.linearRampToValueAtTime(0.2, now + i * 0.15 + 0.03);
      g.gain.exponentialRampToValueAtTime(0.01, now + i * 0.15 + 0.8);
      osc.connect(g);
      g.connect(this.masterGain!);
      osc.start(now + i * 0.15);
      osc.stop(now + i * 0.15 + 0.85);
    });
  }

  startHeartbeat(intensity: number) {
    // intensity 0-1, higher = faster + louder
    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
    if (!this.ctx || !this.masterGain || intensity <= 0) return;

    const bpm = 60 + intensity * 120;
    const interval = 60000 / bpm;

    this.heartbeatInterval = window.setInterval(() => {
      if (!this.ctx || !this.masterGain) return;
      const now = this.ctx.currentTime;
      // Double beat
      [0, 0.1].forEach(offset => {
        const osc = this.ctx!.createOscillator();
        osc.type = "sine";
        osc.frequency.setValueAtTime(offset === 0 ? 50 : 40, now + offset);
        osc.frequency.exponentialRampToValueAtTime(20, now + offset + 0.12);
        const g = this.ctx!.createGain();
        g.gain.setValueAtTime(intensity * 0.15, now + offset);
        g.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.15);
        osc.connect(g);
        g.connect(this.masterGain!);
        osc.start(now + offset);
        osc.stop(now + offset + 0.2);
      });
    }, interval);
  }

  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  // Modulate ambient intensity based on proximity to danger
  setTension(level: number) {
    // level 0-1
    this.ambientGains.forEach((g, i) => {
      if (g.gain && this.ctx) {
        const base = 0.03 + i * 0.008;
        const target = base + level * 0.04;
        g.gain.linearRampToValueAtTime(target, this.ctx.currentTime + 0.3);
      }
    });
  }

  dispose() {
    this.stopAmbient();
    this.stopHeartbeat();
    if (this.ctx) {
      this.ctx.close();
      this.ctx = null;
    }
  }
}

const gameAudio = new GameAudio();

export default function AudioSystem() {
  const { role, isPlaying, gameOver, gameResult, score, escapeOpen, stamina, maxStamina } = useGame();
  const { camera } = useThree();
  const lastPos = useRef(camera.position.clone());
  const footstepAccum = useRef(0);
  const lastScore = useRef(0);
  const escapeWasOpen = useRef(false);
  const gameWasOver = useRef(false);
  const initialized = useRef(false);

  // Init audio on first play
  useEffect(() => {
    if (isPlaying && !initialized.current) {
      gameAudio.init();
      initialized.current = true;
      if (role) gameAudio.startAmbient(role);
    }
  }, [isPlaying, role]);

  // Tag sound
  useEffect(() => {
    if (score > lastScore.current && score > 0) {
      gameAudio.playTag();
    }
    lastScore.current = score;
  }, [score]);

  // Escape open sound
  useEffect(() => {
    if (escapeOpen && !escapeWasOpen.current) {
      gameAudio.playEscapeOpen();
    }
    escapeWasOpen.current = escapeOpen;
  }, [escapeOpen]);

  // Game over sounds
  useEffect(() => {
    if (gameOver && !gameWasOver.current) {
      gameAudio.stopHeartbeat();
      if (gameResult === "win") {
        gameAudio.playVictory();
      } else {
        gameAudio.playCaught();
      }
      gameAudio.stopAmbient();
    }
    gameWasOver.current = gameOver;
  }, [gameOver, gameResult]);

  // Cleanup
  useEffect(() => {
    return () => { gameAudio.dispose(); initialized.current = false; };
  }, []);

  useFrame((_, delta) => {
    if (!isPlaying || gameOver) return;

    // Footsteps based on actual movement
    const moved = camera.position.distanceTo(lastPos.current);
    lastPos.current.copy(camera.position);

    if (moved > 0.01) {
      const isSprinting = stamina < maxStamina - 1; // rough check if sprinting
      const stepInterval = isSprinting ? 0.25 : 0.4;
      footstepAccum.current += delta;
      if (footstepAccum.current >= stepInterval) {
        gameAudio.playFootstep(isSprinting);
        footstepAccum.current = 0;
      }
    } else {
      footstepAccum.current = 0;
    }

    // Heartbeat when low stamina or danger nearby (runner mode)
    if (role === "runner") {
      const staminaPct = stamina / maxStamina;
      if (staminaPct < 0.3) {
        gameAudio.startHeartbeat(1 - staminaPct);
      } else {
        gameAudio.stopHeartbeat();
      }
    }
  });

  return null;
}
