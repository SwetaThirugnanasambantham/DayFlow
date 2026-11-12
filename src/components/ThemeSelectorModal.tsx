import React from 'react';
import { X, Check, Palette, Sparkles, Sliders, Type, Grid, Volume2 } from 'lucide-react';
import { usePreferences } from '../contexts/PreferencesContext';
import { useAudio } from '../contexts/AudioContext';
import { THEMES } from '../constants/themes';
import { AestheticThemeId, BackgroundPattern, TypographyStyle } from '../types';

interface ThemeSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ThemeSelectorModal: React.FC<ThemeSelectorModalProps> = ({ isOpen, onClose }) => {
  const {
    preferences,
    setAestheticTheme,
    setBackgroundPattern,
    setTypographyStyle,
    toggleTheme,
  } = usePreferences();
  const { toggleSound, sounds } = useAudio();

  if (!isOpen) return null;

  const currentTheme = preferences.aestheticTheme || 'default';
  const isDark = preferences.theme === 'dark';

  const patternOptions: { id: BackgroundPattern; label: string }[] = [
    { id: 'subtle-grid', label: 'Fine Grid' },
    { id: 'dots', label: 'Polka Dots' },
    { id: 'glow', label: 'Ambient Glow' },
    { id: 'mesh', label: 'Gradient Mesh' },
    { id: 'none', label: 'Clean Solid' },
  ];

  const typographyOptions: { id: TypographyStyle; label: string; desc: string }[] = [
    { id: 'sans', label: 'Modern Sans', desc: 'Clean, Swiss-style precision' },
    { id: 'serif', label: 'Editorial Serif', desc: 'Bookish, literary elegance' },
    { id: 'mono', label: 'Technical Mono', desc: 'Developer & terminal focus' },
    { id: 'rounded', label: 'Soft Rounded', desc: 'Friendly, calming curves' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-3xl rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl text-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-6">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 via-pink-500 to-amber-400 p-0.5 flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Palette className="w-4 h-4 text-pink-400" />
              </div>
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Aesthetic Theme Studio</span>
                <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300">
                  Curated
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                Immerse your productivity space in custom mood environments.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Theme Palette Cards Grid */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Atmospheric Themes</span>
              </h3>
              <button
                onClick={toggleTheme}
                className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition"
              >
                Switch to {isDark ? 'Light' : 'Dark'} Variant
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {(Object.keys(THEMES) as AestheticThemeId[]).map((themeKey) => {
                const item = THEMES[themeKey];
                const isSelected = currentTheme === themeKey;
                const colors = isDark ? item.dark : item.light;

                return (
                  <div
                    key={item.id}
                    onClick={() => setAestheticTheme(item.id)}
                    className={`relative p-4 rounded-2xl border-2 transition-all cursor-pointer group flex flex-col justify-between ${
                      isSelected
                        ? 'border-indigo-500 shadow-lg shadow-indigo-500/10'
                        : 'border-slate-800 hover:border-slate-700 bg-slate-900/60'
                    }`}
                    style={{ backgroundColor: colors.card }}
                  >
                    {/* Top indicator & Title */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span
                          className="text-xs font-bold"
                          style={{ color: colors.text }}
                        >
                          {item.name}
                        </span>
                        {isSelected && (
                          <span
                            className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] shadow-sm"
                            style={{ backgroundColor: colors.accent }}
                          >
                            <Check className="w-3 h-3 stroke-[3]" />
                          </span>
                        )}
                      </div>

                      <div
                        className="text-[10px] font-medium mb-2.5"
                        style={{ color: colors.accent }}
                      >
                        {item.tagline}
                      </div>

                      <p
                        className="text-[11px] leading-relaxed mb-3 line-clamp-2"
                        style={{ color: colors.textMuted }}
                      >
                        {item.description}
                      </p>
                    </div>

                    {/* Color Swatches preview bar */}
                    <div className="flex items-center gap-1.5 pt-2 border-t border-slate-700/30">
                      {item.swatches.map((swatch, idx) => (
                        <div
                          key={idx}
                          className="w-5 h-5 rounded-md shadow-xs border border-black/10"
                          style={{ backgroundColor: swatch }}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Background Pattern Options */}
          <div className="pt-2 border-t border-slate-800">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <Grid className="w-3.5 h-3.5 text-cyan-400" />
              <span>Background Canvas Texture</span>
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {patternOptions.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setBackgroundPattern(opt.id)}
                  className={`py-2 px-3 rounded-xl border text-xs font-medium transition cursor-pointer ${
                    preferences.backgroundPattern === opt.id
                      ? 'border-indigo-500 bg-indigo-600 text-white font-semibold shadow-xs'
                      : 'border-slate-800 bg-slate-850 hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Typography Hierarchy */}
          <div className="pt-2 border-t border-slate-800">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <Type className="w-3.5 h-3.5 text-emerald-400" />
              <span>Typography Personality</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {typographyOptions.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setTypographyStyle(opt.id)}
                  className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                    preferences.typographyStyle === opt.id
                      ? 'border-indigo-500 bg-indigo-950/30 text-white'
                      : 'border-slate-800 bg-slate-850 hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  <div className="text-xs font-bold text-white">{opt.label}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950/60 border-t border-slate-800">
          <span className="text-xs text-slate-400">
            Selected: <strong className="text-white capitalize">{currentTheme.replace('_', ' ')}</strong> ({preferences.theme})
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white rounded-xl shadow-md shadow-indigo-600/30 transition cursor-pointer"
          >
            Apply & Close
          </button>
        </div>
      </div>
    </div>
  );
};
