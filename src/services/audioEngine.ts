// Procedural Web Audio API Ambient Sound & Focus Synthesizer Engine
import { AmbientSound } from '../types';

class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private soundNodes: Map<
    string,
    {
      gain: GainNode;
      stop: () => void;
    }
  > = new Map();

  private getContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.7, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  setMasterVolume(volume: number) {
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(Math.max(0, Math.min(1, volume)), this.ctx.currentTime, 0.05);
    }
  }

  setSoundVolume(soundId: string, volume: number) {
    const node = this.soundNodes.get(soundId);
    if (node && this.ctx) {
      node.gain.gain.setTargetAtTime(Math.max(0, Math.min(1, volume)), this.ctx.currentTime, 0.05);
    }
  }

  playSound(soundId: string, generatorType: string, volume: number = 0.5) {
    const ctx = this.getContext();
    if (this.soundNodes.has(soundId)) {
      this.stopSound(soundId);
    }

    const soundGain = ctx.createGain();
    soundGain.gain.setValueAtTime(volume, ctx.currentTime);
    soundGain.connect(this.masterGain!);

    const stopFn = this.createGenerator(generatorType, soundGain);
    this.soundNodes.set(soundId, { gain: soundGain, stop: stopFn });
  }

  stopSound(soundId: string) {
    const node = this.soundNodes.get(soundId);
    if (node) {
      node.stop();
      this.soundNodes.delete(soundId);
    }
  }

  stopAll() {
    this.soundNodes.forEach((node) => node.stop());
    this.soundNodes.clear();
  }

  // Play a brief clean chime notification (e.g. pomodoro end or task completed)
  playChime(type: 'complete' | 'pomodoro' | 'alert' = 'complete') {
    const ctx = this.getContext();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    gain.connect(ctx.destination);
    osc.connect(gain);

    if (type === 'complete') {
      // Pleasant two-tone bell
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.setTargetAtTime(880, now + 0.1, 0.05); // A5
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
      osc.start(now);
      osc.stop(now + 0.85);
    } else if (type === 'pomodoro') {
      // Gentle meditation bowl harmonic
      osc.frequency.setValueAtTime(432, now);
      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 2.5);
      osc.start(now);
      osc.stop(now + 2.6);
    } else {
      osc.frequency.setValueAtTime(440, now);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      osc.start(now);
      osc.stop(now + 0.45);
    }
  }

  private createGenerator(type: string, outputNode: GainNode): () => void {
    const ctx = this.getContext();
    const cleanupFns: Array<() => void> = [];

    switch (type) {
      case 'whitenoise': {
        const bufferSize = 2 * ctx.sampleRate;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          output[i] = Math.random() * 2 - 1;
        }
        const whiteNoise = ctx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;
        whiteNoise.loop = true;
        whiteNoise.connect(outputNode);
        whiteNoise.start();
        cleanupFns.push(() => {
          whiteNoise.stop();
          whiteNoise.disconnect();
        });
        break;
      }

      case 'pinknoise': {
        const bufferSize = 2 * ctx.sampleRate;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          b0 = 0.99886 * b0 + white * 0.0555179;
          b1 = 0.99332 * b1 + white * 0.0750759;
          b2 = 0.96900 * b2 + white * 0.1538520;
          b3 = 0.86650 * b3 + white * 0.3104856;
          b4 = 0.55000 * b4 + white * 0.5329522;
          b5 = -0.7616 * b5 - white * 0.0168980;
          output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
          b6 = white * 0.115926;
        }
        const pinkSource = ctx.createBufferSource();
        pinkSource.buffer = noiseBuffer;
        pinkSource.loop = true;
        pinkSource.connect(outputNode);
        pinkSource.start();
        cleanupFns.push(() => {
          pinkSource.stop();
          pinkSource.disconnect();
        });
        break;
      }

      case 'brownnoise': {
        const bufferSize = 2 * ctx.sampleRate;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        let lastOut = 0.0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          output[i] = (lastOut + 0.02 * white) / 1.02;
          lastOut = output[i];
          output[i] *= 3.5; // Gain compensation
        }
        const brownSource = ctx.createBufferSource();
        brownSource.buffer = noiseBuffer;
        brownSource.loop = true;
        brownSource.connect(outputNode);
        brownSource.start();
        cleanupFns.push(() => {
          brownSource.stop();
          brownSource.disconnect();
        });
        break;
      }

      case 'rain': {
        // Pink noise filtered through lowpass and highpass
        const bufferSize = 2 * ctx.sampleRate;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        let lastOut = 0.0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          output[i] = (lastOut + 0.05 * white) / 1.05;
          lastOut = output[i];
        }
        const rainSource = ctx.createBufferSource();
        rainSource.buffer = noiseBuffer;
        rainSource.loop = true;

        const lpFilter = ctx.createBiquadFilter();
        lpFilter.type = 'lowpass';
        lpFilter.frequency.setValueAtTime(1400, ctx.currentTime);

        const hpFilter = ctx.createBiquadFilter();
        hpFilter.type = 'highpass';
        hpFilter.frequency.setValueAtTime(250, ctx.currentTime);

        rainSource.connect(hpFilter);
        hpFilter.connect(lpFilter);
        lpFilter.connect(outputNode);
        rainSource.start();

        cleanupFns.push(() => {
          rainSource.stop();
          rainSource.disconnect();
        });
        break;
      }

      case 'thunder': {
        // Deep rumble with occasional bursts
        const osc = ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(45, ctx.currentTime);

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(90, ctx.currentTime);

        const lfo = ctx.createOscillator();
        lfo.frequency.setValueAtTime(0.2, ctx.currentTime);
        const lfoGain = ctx.createGain();
        lfoGain.gain.setValueAtTime(30, ctx.currentTime);
        lfo.connect(lfoGain);
        lfoGain.connect(filter.frequency);

        osc.connect(filter);
        filter.connect(outputNode);
        osc.start();
        lfo.start();

        cleanupFns.push(() => {
          osc.stop();
          lfo.stop();
          osc.disconnect();
        });
        break;
      }

      case 'ocean': {
        // Rhythmic swelling lowpass noise
        const bufferSize = 2 * ctx.sampleRate;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        let lastOut = 0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          output[i] = (lastOut + 0.03 * white) / 1.03;
          lastOut = output[i];
        }
        const source = ctx.createBufferSource();
        source.buffer = noiseBuffer;
        source.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(300, ctx.currentTime);

        const swellGain = ctx.createGain();
        const lfo = ctx.createOscillator();
        lfo.frequency.setValueAtTime(0.08, ctx.currentTime); // ~12 sec swell
        const lfoGain = ctx.createGain();
        lfoGain.gain.setValueAtTime(0.35, ctx.currentTime);
        swellGain.gain.setValueAtTime(0.5, ctx.currentTime);

        lfo.connect(lfoGain);
        lfoGain.connect(swellGain.gain);

        source.connect(filter);
        filter.connect(swellGain);
        swellGain.connect(outputNode);
        source.start();
        lfo.start();

        cleanupFns.push(() => {
          source.stop();
          lfo.stop();
          source.disconnect();
        });
        break;
      }

      case 'cafe': {
        // Bandpassed murmurs and gentle background texture
        const osc1 = ctx.createOscillator();
        osc1.type = 'triangle';
        osc1.frequency.setValueAtTime(110, ctx.currentTime);

        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(500, ctx.currentTime);
        filter.Q.setValueAtTime(1.5, ctx.currentTime);

        const lfo = ctx.createOscillator();
        lfo.frequency.setValueAtTime(0.4, ctx.currentTime);
        const lfoGain = ctx.createGain();
        lfoGain.gain.setValueAtTime(150, ctx.currentTime);
        lfo.connect(lfoGain);
        lfoGain.connect(filter.frequency);

        osc1.connect(filter);
        filter.connect(outputNode);
        osc1.start();
        lfo.start();

        cleanupFns.push(() => {
          osc1.stop();
          lfo.stop();
          osc1.disconnect();
        });
        break;
      }

      case 'forest': {
        // High frequency bird-like chirps + soft air
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(2400, ctx.currentTime);

        const birdGain = ctx.createGain();
        birdGain.gain.setValueAtTime(0.05, ctx.currentTime);

        const lfo = ctx.createOscillator();
        lfo.frequency.setValueAtTime(0.8, ctx.currentTime);
        lfo.connect(birdGain.gain);

        osc.connect(birdGain);
        birdGain.connect(outputNode);
        osc.start();
        lfo.start();

        cleanupFns.push(() => {
          osc.stop();
          lfo.stop();
          osc.disconnect();
        });
        break;
      }

      // Binaural Beat Generators (Alpha 10Hz, Beta 18Hz, Theta 6Hz, Gamma 40Hz)
      case 'alpha':
      case 'beta':
      case 'theta':
      case 'gamma': {
        const beatFreq = type === 'theta' ? 6 : type === 'alpha' ? 10 : type === 'beta' ? 18 : 40;
        const carrier = 220; // 220 Hz base frequency (A3)

        const oscL = ctx.createOscillator();
        const oscR = ctx.createOscillator();
        oscL.type = 'sine';
        oscR.type = 'sine';
        oscL.frequency.setValueAtTime(carrier, ctx.currentTime);
        oscR.frequency.setValueAtTime(carrier + beatFreq, ctx.currentTime);

        const merger = ctx.createChannelMerger(2);
        oscL.connect(merger, 0, 0);
        oscR.connect(merger, 0, 1);
        merger.connect(outputNode);

        oscL.start();
        oscR.start();

        cleanupFns.push(() => {
          oscL.stop();
          oscR.stop();
          oscL.disconnect();
          oscR.disconnect();
        });
        break;
      }

      case 'ambient_pad':
      case 'lofi':
      default: {
        // Warm harmonic chord pad
        const freqs = [174.61, 220.0, 261.63, 329.63]; // F-A-C-E chord
        const oscillators: OscillatorNode[] = [];

        freqs.forEach((freq) => {
          const osc = ctx.createOscillator();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, ctx.currentTime);

          const filter = ctx.createBiquadFilter();
          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(600, ctx.currentTime);

          osc.connect(filter);
          filter.connect(outputNode);
          osc.start();
          oscillators.push(osc);
        });

        cleanupFns.push(() => {
          oscillators.forEach((o) => {
            o.stop();
            o.disconnect();
          });
        });
        break;
      }
    }

    return () => {
      cleanupFns.forEach((fn) => {
        try {
          fn();
        } catch {}
      });
    };
  }
}

export const audioEngine = new AudioEngine();
