import React, { createContext, useContext, useState, useEffect } from 'react';
import { AmbientSound } from '../types';
import { audioEngine } from '../services/audioEngine';
import { usePreferences } from './PreferencesContext';

export interface SoundPreset {
  id: string;
  name: string;
  description: string;
  icon: string;
  soundConfigs: { id: string; volume: number }[];
}

const INITIAL_SOUNDS: AmbientSound[] = [
  { id: 'rain', name: 'Gentle Rain', category: 'nature', icon: 'CloudRain', description: 'Continuous soft rainfall soothing acoustic texture', volume: 0.5, isPlaying: false, generatorType: 'rain' },
  { id: 'thunder', name: 'Thunderstorm', category: 'nature', icon: 'CloudLightning', description: 'Deep distant thunder rolls with ambient rain', volume: 0.4, isPlaying: false, generatorType: 'thunder' },
  { id: 'ocean', name: 'Ocean Waves', category: 'nature', icon: 'Waves', description: 'Rhythmic deep swell of calming coastal tides', volume: 0.5, isPlaying: false, generatorType: 'ocean' },
  { id: 'forest', name: 'Forest Breeze', category: 'nature', icon: 'Trees', description: 'Light rustling leaves and distant songbirds', volume: 0.4, isPlaying: false, generatorType: 'forest' },
  { id: 'cafe', name: 'Café Chatter', category: 'urban', icon: 'Coffee', description: 'Gentle espresso bar murmur and warm bustle', volume: 0.4, isPlaying: false, generatorType: 'cafe' },
  { id: 'whitenoise', name: 'White Noise', category: 'noise', icon: 'Disc', description: 'Crisp uniform sound masking external distractions', volume: 0.3, isPlaying: false, generatorType: 'whitenoise' },
  { id: 'pinknoise', name: 'Pink Noise', category: 'noise', icon: 'Radio', description: 'Balanced 1/f acoustic noise for deep concentration', volume: 0.4, isPlaying: false, generatorType: 'pinknoise' },
  { id: 'brownnoise', name: 'Brown Noise', category: 'noise', icon: 'Sliders', description: 'Low rumble waterfall frequencies for calming ADHD/focus', volume: 0.5, isPlaying: false, generatorType: 'brownnoise' },
  { id: 'alpha', name: 'Alpha Waves (10 Hz)', category: 'binaural', icon: 'Zap', description: 'Binaural beat for relaxed focus and effortless learning', volume: 0.35, isPlaying: false, generatorType: 'alpha' },
  { id: 'beta', name: 'Beta Waves (18 Hz)', category: 'binaural', icon: 'Activity', description: 'Higher frequency binaural beat for active problem solving', volume: 0.3, isPlaying: false, generatorType: 'beta' },
  { id: 'theta', name: 'Theta Waves (6 Hz)', category: 'binaural', icon: 'Moon', description: 'Deep meditation and creative brainstorm frequency', volume: 0.35, isPlaying: false, generatorType: 'theta' },
  { id: 'gamma', name: 'Gamma Waves (40 Hz)', category: 'binaural', icon: 'Sparkles', description: 'Peak cognitive processing and memory consolidation', volume: 0.25, isPlaying: false, generatorType: 'gamma' },
  { id: 'ambient_pad', name: 'Ambient Harmonic Pad', category: 'music', icon: 'Music', description: 'Subtle resonant chord texture for sustained flow state', volume: 0.4, isPlaying: false, generatorType: 'ambient_pad' },
  { id: 'lofi', name: 'Lofi Chords', category: 'music', icon: 'Headphones', description: 'Mellow warm vintage keyboard progression', volume: 0.4, isPlaying: false, generatorType: 'lofi' },
];

export const AUDIO_PRESETS: SoundPreset[] = [
  {
    id: 'rainy_cafe',
    name: 'Rainy Coffee Shop',
    description: 'Gentle rainfall blended with ambient café murmur',
    icon: 'Coffee',
    soundConfigs: [
      { id: 'rain', volume: 0.55 },
      { id: 'cafe', volume: 0.4 },
    ],
  },
  {
    id: 'deep_binaural',
    name: 'Deep Binaural Focus',
    description: 'Brown noise with 10Hz Alpha waves for deep flow',
    icon: 'Zap',
    soundConfigs: [
      { id: 'brownnoise', volume: 0.5 },
      { id: 'alpha', volume: 0.35 },
    ],
  },
  {
    id: 'night_forest',
    name: 'Night Ocean & Forest',
    description: 'Coastal swells accompanied by gentle forest air',
    icon: 'Waves',
    soundConfigs: [
      { id: 'ocean', volume: 0.5 },
      { id: 'forest', volume: 0.35 },
    ],
  },
  {
    id: 'ambient_meditation',
    name: 'Creative Sanctuary',
    description: 'Warm ambient harmonic pad with Theta wave guidance',
    icon: 'Sparkles',
    soundConfigs: [
      { id: 'ambient_pad', volume: 0.4 },
      { id: 'theta', volume: 0.3 },
    ],
  },
];

interface AudioContextType {
  sounds: AmbientSound[];
  masterVolume: number;
  isMuted: boolean;
  activeCount: number;
  toggleSound: (id: string) => void;
  setSoundVolume: (id: string, vol: number) => void;
  setMasterVolume: (vol: number) => void;
  toggleMute: () => void;
  applyPreset: (preset: SoundPreset) => void;
  stopAll: () => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { preferences } = usePreferences();
  const [sounds, setSounds] = useState<AmbientSound[]>(INITIAL_SOUNDS);
  const [masterVolume, setMasterVolumeState] = useState<number>(preferences.audioVolume || 0.7);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  useEffect(() => {
    audioEngine.setMasterVolume(isMuted ? 0 : masterVolume);
  }, [masterVolume, isMuted]);

  const toggleSound = (id: string) => {
    setSounds((prev) =>
      prev.map((s) => {
        if (s.id === id) {
          const nextState = !s.isPlaying;
          if (nextState) {
            audioEngine.playSound(s.id, s.generatorType, s.volume);
          } else {
            audioEngine.stopSound(s.id);
          }
          return { ...s, isPlaying: nextState };
        }
        return s;
      })
    );
  };

  const setSoundVolume = (id: string, vol: number) => {
    setSounds((prev) =>
      prev.map((s) => {
        if (s.id === id) {
          audioEngine.setSoundVolume(s.id, vol);
          return { ...s, volume: vol };
        }
        return s;
      })
    );
  };

  const setMasterVolume = (vol: number) => {
    setMasterVolumeState(vol);
  };

  const toggleMute = () => {
    setIsMuted((prev) => !prev);
  };

  const stopAll = () => {
    audioEngine.stopAll();
    setSounds((prev) => prev.map((s) => ({ ...s, isPlaying: false })));
  };

  const applyPreset = (preset: SoundPreset) => {
    stopAll();
    setSounds((prev) =>
      prev.map((s) => {
        const found = preset.soundConfigs.find((c) => c.id === s.id);
        if (found) {
          audioEngine.playSound(s.id, s.generatorType, found.volume);
          return { ...s, volume: found.volume, isPlaying: true };
        }
        return { ...s, isPlaying: false };
      })
    );
  };

  const activeCount = sounds.filter((s) => s.isPlaying).length;

  return (
    <AudioContext.Provider
      value={{
        sounds,
        masterVolume,
        isMuted,
        activeCount,
        toggleSound,
        setSoundVolume,
        setMasterVolume,
        toggleMute,
        applyPreset,
        stopAll,
      }}
    >
      {children}
    </AudioContext.Provider>
  );
};

export const useAudio = () => {
  const ctx = useContext(AudioContext);
  if (!ctx) throw new Error('useAudio must be used within AudioProvider');
  return ctx;
};
