import React from 'react';
import {
  Headphones,
  Volume2,
  VolumeX,
  Play,
  Square,
  Sparkles,
  CloudRain,
  CloudLightning,
  Waves,
  Trees,
  Coffee,
  Disc,
  Radio,
  Sliders,
  Zap,
  Activity,
  Moon,
  Music,
} from 'lucide-react';
import { useAudio, AUDIO_PRESETS, SoundPreset } from '../contexts/AudioContext';

export const AudioPage: React.FC = () => {
  const {
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
  } = useAudio();

  const getIcon = (id: string) => {
    switch (id) {
      case 'rain': return CloudRain;
      case 'thunder': return CloudLightning;
      case 'ocean': return Waves;
      case 'forest': return Trees;
      case 'cafe': return Coffee;
      case 'whitenoise': return Disc;
      case 'pinknoise': return Radio;
      case 'brownnoise': return Sliders;
      case 'alpha': return Zap;
      case 'beta': return Activity;
      case 'theta': return Moon;
      case 'gamma': return Sparkles;
      case 'ambient_pad': return Music;
      case 'lofi': default: return Headphones;
    }
  };

  const categories = [
    { id: 'nature', title: 'Nature & Atmosphere' },
    { id: 'noise', title: 'Acoustic Noise Colors' },
    { id: 'binaural', title: 'Binaural Brainwave Frequencies' },
    { id: 'music', title: 'Harmonic Flow & Music' },
    { id: 'urban', title: 'Urban & Café' },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Header and Master Controls */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Headphones className="w-4 h-4" />
            <span>Acoustic Focus Studio</span>
          </div>
          <h1 className="text-xl font-bold text-white">Ambient Sound & Focus Mixer</h1>
          <p className="text-xs text-slate-400 mt-1">
            Layer procedural ambient noise, rainfall, coffee shop murmurs, and binaural waves.
          </p>
        </div>

        {/* Master Volume and Mute Controls */}
        <div className="flex items-center gap-3 bg-slate-800/80 p-2.5 rounded-xl border border-slate-700">
          <button
            onClick={toggleMute}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 transition cursor-pointer"
            title={isMuted ? 'Unmute Master' : 'Mute Master'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
          </button>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400">Master:</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={masterVolume}
              onChange={(e) => setMasterVolume(Number(e.target.value))}
              className="w-24 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
            <span className="text-[11px] font-mono text-slate-300 w-7">
              {Math.round(masterVolume * 100)}%
            </span>
          </div>

          {activeCount > 0 && (
            <button
              onClick={stopAll}
              className="px-2.5 py-1 text-[11px] font-semibold bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border border-rose-500/30 rounded-lg transition cursor-pointer"
            >
              Stop All ({activeCount})
            </button>
          )}
        </div>
      </div>

      {/* Presets Grid */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
        <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Curated Sound Presets</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {AUDIO_PRESETS.map((preset) => (
            <div
              key={preset.id}
              onClick={() => applyPreset(preset)}
              className="p-3.5 rounded-xl bg-slate-800/40 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 transition cursor-pointer group"
            >
              <div className="text-xs font-bold text-white group-hover:text-cyan-400 transition">
                {preset.name}
              </div>
              <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                {preset.description}
              </p>
              <div className="mt-2 text-[10px] text-indigo-400 font-semibold flex items-center gap-1">
                <Play className="w-3 h-3 fill-current" /> Play Preset
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 14 Sound Channels Categorized */}
      <div className="space-y-6">
        {categories.map((cat) => {
          const catSounds = sounds.filter((s) => s.category === cat.id);
          if (catSounds.length === 0) return null;

          return (
            <div key={cat.id} className="space-y-3">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                {cat.title}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {catSounds.map((sound) => {
                  const Icon = getIcon(sound.id);
                  return (
                    <div
                      key={sound.id}
                      className={`p-4 rounded-xl border transition-all ${
                        sound.isPlaying
                          ? 'bg-slate-800/90 border-cyan-500/50 shadow-md shadow-cyan-500/5'
                          : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center transition ${
                              sound.isPlaying
                                ? 'bg-cyan-500/20 text-cyan-400 ring-1 ring-cyan-500/40'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-white">{sound.name}</div>
                            <span className="text-[10px] text-slate-500 capitalize">{sound.category}</span>
                          </div>
                        </div>

                        <button
                          onClick={() => toggleSound(sound.id)}
                          className={`w-7 h-7 rounded-lg flex items-center justify-center transition cursor-pointer ${
                            sound.isPlaying
                              ? 'bg-cyan-500 text-slate-950 shadow-xs'
                              : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                          }`}
                          title={sound.isPlaying ? 'Pause' : 'Play'}
                        >
                          {sound.isPlaying ? (
                            <Square className="w-3 h-3 fill-current" />
                          ) : (
                            <Play className="w-3 h-3 fill-current" />
                          )}
                        </button>
                      </div>

                      <p className="text-[10px] text-slate-400 mb-3 line-clamp-2 leading-relaxed">
                        {sound.description}
                      </p>

                      {/* Channel Volume Slider */}
                      <div className="flex items-center gap-2 pt-1 border-t border-slate-800/80">
                        <Volume2 className="w-3 h-3 text-slate-500" />
                        <input
                          type="range"
                          min={0}
                          max={1}
                          step={0.05}
                          value={sound.volume}
                          onChange={(e) => setSoundVolume(sound.id, Number(e.target.value))}
                          className="flex-1 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                        />
                        <span className="text-[10px] font-mono text-slate-400 w-6 text-right">
                          {Math.round(sound.volume * 100)}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
