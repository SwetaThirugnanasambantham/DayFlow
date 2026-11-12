import React from 'react';
import { Menu, Plus, Sun, Moon, Volume2, VolumeX, Headphones, Search, Monitor, Palette } from 'lucide-react';
import { usePreferences } from '../contexts/PreferencesContext';
import { useAudio } from '../contexts/AudioContext';
import { useNavigate } from 'react-router-dom';

interface NavbarProps {
  onOpenSidebar: () => void;
  onOpenQuickTask: () => void;
  onOpenSearch: () => void;
  onOpenThemeSelector: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenSidebar,
  onOpenQuickTask,
  onOpenSearch,
  onOpenThemeSelector,
}) => {
  const { preferences, toggleTheme } = usePreferences();
  const { activeCount, isMuted, toggleMute } = useAudio();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-14 px-4 lg:px-6 bg-slate-900/90 border-b border-slate-800 backdrop-blur-md text-slate-200">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenSidebar}
          className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 lg:hidden cursor-pointer"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Global search trigger */}
        <button
          onClick={onOpenSearch}
          className="flex items-center gap-2 px-3 py-1.5 text-xs text-slate-400 bg-slate-800/80 hover:bg-slate-800 hover:text-slate-200 border border-slate-700/60 rounded-lg transition w-44 sm:w-64 cursor-pointer"
        >
          <Search className="w-3.5 h-3.5" />
          <span className="flex-1 text-left truncate">Search tasks, habits...</span>
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] bg-slate-900 border border-slate-700 rounded text-slate-400">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-2">
        {/* Quick Task Creation */}
        <button
          onClick={onOpenQuickTask}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm shadow-indigo-600/30 transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">New Task</span>
        </button>

        {/* Focus Audio Mini Control */}
        <div className="flex items-center gap-1 px-2 py-1 bg-slate-800/80 border border-slate-700/50 rounded-lg text-xs">
          <button
            onClick={() => navigate('/audio')}
            className={`p-1 rounded hover:bg-slate-700 transition flex items-center gap-1 cursor-pointer ${
              activeCount > 0 ? 'text-cyan-400' : 'text-slate-400'
            }`}
            title="Focus Audio Mixer"
          >
            <Headphones className="w-3.5 h-3.5" />
            {activeCount > 0 && <span className="text-[10px] font-bold">{activeCount}</span>}
          </button>
          {activeCount > 0 && (
            <button
              onClick={toggleMute}
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-700 transition cursor-pointer"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>

        {/* Desktop Companion shortcut */}
        <button
          onClick={() => navigate('/companion')}
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer hidden md:flex"
          title="Open Desktop Companion Widget"
        >
          <Monitor className="w-4 h-4" />
        </button>

        {/* Aesthetic Themes Studio */}
        <button
          onClick={onOpenThemeSelector}
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer relative"
          title="Aesthetic Theme Studio (Nude, Monotonic, Tropical, City, Pastel)"
        >
          <Palette className="w-4 h-4 text-pink-400" />
        </button>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer"
          title="Toggle Light/Dark Theme"
        >
          {preferences.theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
};
