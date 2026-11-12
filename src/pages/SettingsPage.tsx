import React, { useState } from 'react';
import {
  Settings,
  Moon,
  Sun,
  Palette,
  Timer,
  Bell,
  Download,
  Upload,
  User,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { usePreferences } from '../contexts/PreferencesContext';
import { taskService } from '../services/taskService';
import { habitService } from '../services/habitService';
import { routineService } from '../services/routineService';
import { THEMES } from '../constants/themes';
import { AestheticThemeId, BackgroundPattern, TypographyStyle } from '../types';

export const SettingsPage: React.FC = () => {
  const { user, isDemoUser, userProfile, updateProfileName } = useAuth();
  const effectiveUid = user?.uid || (isDemoUser ? 'demo_user_dayflow' : 'anonymous');
  const {
    preferences,
    updatePreferences,
    setAestheticTheme,
    setBackgroundPattern,
    setTypographyStyle,
  } = usePreferences();

  const [displayName, setDisplayName] = useState(userProfile?.displayName || '');
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (displayName.trim()) {
      await updateProfileName(displayName.trim());
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    }
  };

  const handleExportData = async () => {
    try {
      const [tasks, habits, routines] = await Promise.all([
        taskService.getTasks(effectiveUid),
        habitService.getHabits(effectiveUid),
        routineService.getRoutines(effectiveUid),
      ]);

      const exportPayload = {
        exportedAt: new Date().toISOString(),
        profile: userProfile,
        preferences,
        tasks,
        habits,
        routines,
      };

      const blob = new Blob([JSON.stringify(exportPayload, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dayflow_backup_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  const accentColors = [
    { id: 'indigo', name: 'Indigo Aura', color: '#4f46e5' },
    { id: 'cyan', name: 'Cyan Glow', color: '#06b6d4' },
    { id: 'emerald', name: 'Emerald Focus', color: '#10b981' },
    { id: 'amber', name: 'Amber Warmth', color: '#f59e0b' },
    { id: 'rose', name: 'Rose Bloom', color: '#f43f5e' },
    { id: 'violet', name: 'Violet Calm', color: '#8b5cf6' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-1">
          <Settings className="w-4 h-4" />
          <span>Workspace Preferences</span>
        </div>
        <h1 className="text-xl font-bold text-white">Settings & Personalization</h1>
        <p className="text-xs text-slate-400 mt-1">
          Fine-tune theme, Pomodoro timing intervals, notification quiet hours, and data export.
        </p>
      </div>

      {/* Account Profile Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <User className="w-4 h-4 text-indigo-400" />
          <span>User Profile</span>
        </h2>

        <form onSubmit={handleSaveProfile} className="space-y-4 max-w-md">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Display Name</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Email Address</label>
            <input
              type="email"
              disabled
              value={userProfile?.email || 'demo@dayflow.app'}
              className="w-full px-3 py-2 bg-slate-800/50 border border-slate-800 rounded-xl text-xs text-slate-500 cursor-not-allowed"
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white rounded-xl transition cursor-pointer"
            >
              Save Profile Changes
            </button>
            {saveSuccess && (
              <span className="text-xs text-emerald-400 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Updated
              </span>
            )}
          </div>
        </form>
      </div>

      {/* Appearance & Theming Studio */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Palette className="w-4 h-4 text-pink-400" />
              <span>Aesthetic Themes & Visual Ambiance</span>
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Transform your productivity workspace into a distinctive, beautifully styled environment.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {[
              { id: 'dark', label: 'Dark', icon: Moon },
              { id: 'light', label: 'Light', icon: Sun },
              { id: 'system', label: 'System', icon: Settings },
            ].map((themeOption) => {
              const Icon = themeOption.icon;
              const isSelected = preferences.theme === themeOption.id;
              return (
                <button
                  key={themeOption.id}
                  onClick={() => updatePreferences({ theme: themeOption.id as any })}
                  className={`flex items-center gap-1.5 py-1.5 px-3 rounded-xl border text-xs font-medium transition cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-600 text-white border-indigo-500 font-semibold'
                      : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{themeOption.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Curated Aesthetic Theme Cards */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">
            Curated Mood Themes
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {(Object.keys(THEMES) as AestheticThemeId[]).map((themeKey) => {
              const item = THEMES[themeKey];
              const isSelected = (preferences.aestheticTheme || 'default') === themeKey;
              const isDark = preferences.theme === 'dark';
              const colors = isDark ? item.dark : item.light;

              return (
                <div
                  key={item.id}
                  onClick={() => setAestheticTheme(item.id)}
                  className={`relative p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'border-indigo-500 shadow-lg shadow-indigo-500/10 ring-2 ring-indigo-500/20'
                      : 'border-slate-800 hover:border-slate-700 bg-slate-900/60'
                  }`}
                  style={{ backgroundColor: colors.card }}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold" style={{ color: colors.text }}>
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
                      className="text-[10px] font-medium mb-2"
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

                  {/* Swatches preview */}
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

        {/* Background Texture Patterns */}
        <div className="pt-2 border-t border-slate-800">
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2.5">
            Canvas Background Texture
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {[
              { id: 'subtle-grid', label: 'Fine Grid' },
              { id: 'dots', label: 'Polka Dots' },
              { id: 'glow', label: 'Ambient Glow' },
              { id: 'mesh', label: 'Gradient Mesh' },
              { id: 'none', label: 'Clean Solid' },
            ].map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setBackgroundPattern(opt.id as BackgroundPattern)}
                className={`py-2 px-3 rounded-xl border text-xs font-medium transition cursor-pointer ${
                  preferences.backgroundPattern === opt.id
                    ? 'border-indigo-500 bg-indigo-600 text-white font-semibold shadow-xs'
                    : 'border-slate-800 bg-slate-800/80 hover:bg-slate-800 text-slate-300'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Typography Style Hierarchy */}
        <div className="pt-2 border-t border-slate-800">
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2.5">
            Typography Style
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {[
              { id: 'sans', label: 'Modern Sans', desc: 'Crisp, Swiss-style precision' },
              { id: 'serif', label: 'Editorial Serif', desc: 'Literary & warm aesthetic' },
              { id: 'mono', label: 'Technical Mono', desc: 'Developer & terminal focus' },
              { id: 'rounded', label: 'Soft Rounded', desc: 'Friendly, organic curves' },
            ].map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setTypographyStyle(opt.id as TypographyStyle)}
                className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                  preferences.typographyStyle === opt.id
                    ? 'border-indigo-500 bg-indigo-950/40 text-white font-semibold'
                    : 'border-slate-800 bg-slate-800/80 hover:bg-slate-800 text-slate-300'
                }`}
              >
                <div className="text-xs font-bold text-white">{opt.label}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">{opt.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Accent Color Overrides */}
        <div className="pt-2 border-t border-slate-800">
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2.5">
            Primary Accent Tone
          </label>
          <div className="flex flex-wrap items-center gap-3">
            {accentColors.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => updatePreferences({ accentColor: c.id })}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs transition cursor-pointer ${
                  preferences.accentColor === c.id
                    ? 'border-white bg-slate-800 font-semibold text-white ring-1 ring-white'
                    : 'border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700'
                }`}
              >
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: c.color }} />
                <span>{c.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Pomodoro Timer Customization */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <Timer className="w-4 h-4 text-cyan-400" />
          <span>Pomodoro Intervals & Automation</span>
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1">Focus (Mins)</label>
            <input
              type="number"
              min={10}
              max={120}
              value={preferences.pomodoroFocusMinutes}
              onChange={(e) => updatePreferences({ pomodoroFocusMinutes: Number(e.target.value) })}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1">Short Break (Mins)</label>
            <input
              type="number"
              min={1}
              max={30}
              value={preferences.pomodoroShortBreakMinutes}
              onChange={(e) => updatePreferences({ pomodoroShortBreakMinutes: Number(e.target.value) })}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1">Long Break (Mins)</label>
            <input
              type="number"
              min={5}
              max={60}
              value={preferences.pomodoroLongBreakMinutes}
              onChange={(e) => updatePreferences({ pomodoroLongBreakMinutes: Number(e.target.value) })}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1">Long Break Every (Cycles)</label>
            <input
              type="number"
              min={2}
              max={10}
              value={preferences.pomodoroLongBreakInterval}
              onChange={(e) => updatePreferences({ pomodoroLongBreakInterval: Number(e.target.value) })}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-hidden"
            />
          </div>
        </div>

        <div className="space-y-2 pt-2">
          <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={preferences.pomodoroAutoStartBreaks}
              onChange={(e) => updatePreferences({ pomodoroAutoStartBreaks: e.target.checked })}
              className="rounded text-indigo-600 focus:ring-0"
            />
            <span>Automatically start breaks when a focus session finishes</span>
          </label>

          <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={preferences.pomodoroAutoStartPomodoros}
              onChange={(e) => updatePreferences({ pomodoroAutoStartPomodoros: e.target.checked })}
              className="rounded text-indigo-600 focus:ring-0"
            />
            <span>Automatically start next Pomodoro when a break finishes</span>
          </label>
        </div>
      </div>

      {/* Notifications and Quiet Hours */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <Bell className="w-4 h-4 text-amber-400" />
          <span>Notifications & Quiet Hours</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Evening Review Reminder Time</label>
            <input
              type="time"
              value={preferences.reviewReminderTime || '20:00'}
              onChange={(e) => updatePreferences({ reviewReminderTime: e.target.value })}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-hidden"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Quiet Hours Start</label>
              <input
                type="time"
                value={preferences.quietHoursStart || '22:00'}
                onChange={(e) => updatePreferences({ quietHoursStart: e.target.value })}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Quiet Hours End</label>
              <input
                type="time"
                value={preferences.quietHoursEnd || '07:00'}
                onChange={(e) => updatePreferences({ quietHoursEnd: e.target.value })}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-hidden"
              />
            </div>
          </div>
        </div>

        <div className="space-y-2 pt-2">
          <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={preferences.enableSoundEffects}
              onChange={(e) => updatePreferences({ enableSoundEffects: e.target.checked })}
              className="rounded text-indigo-600 focus:ring-0"
            />
            <span>Enable sound effects and acoustic chimes on completion</span>
          </label>
        </div>
      </div>

      {/* Backup and Data Export */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <Download className="w-4 h-4 text-emerald-400" />
          <span>Data Portability & Backup</span>
        </h2>
        <p className="text-xs text-slate-400">
          Your data belongs to you. Export a full JSON backup of all your tasks, subtasks, notes, habits, routines, and preferences at any time.
        </p>

        <button
          onClick={handleExportData}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-white rounded-xl transition cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>Export All Data (JSON)</span>
        </button>
      </div>
    </div>
  );
};
