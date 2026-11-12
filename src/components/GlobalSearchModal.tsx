import React, { useState, useEffect } from 'react';
import { Search, X, CheckSquare, Flame, Repeat, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Task, Habit, Routine } from '../types';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  habits: Habit[];
  routines: Routine[];
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  tasks,
  habits,
  routines,
}) => {
  const [queryText, setQueryText] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const q = queryText.toLowerCase().trim();

  const filteredTasks = q
    ? tasks.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q)
      )
    : [];

  const filteredHabits = q
    ? habits.filter(
        (h) =>
          h.title.toLowerCase().includes(q) ||
          h.description.toLowerCase().includes(q)
      )
    : [];

  const filteredRoutines = q
    ? routines.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q)
      )
    : [];

  const totalResults = filteredTasks.length + filteredHabits.length + filteredRoutines.length;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-xl rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl text-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-800">
          <Search className="w-5 h-5 text-indigo-400 shrink-0" />
          <input
            type="text"
            autoFocus
            placeholder="Type to search tasks, habits, routines, tags..."
            value={queryText}
            onChange={(e) => setQueryText(e.target.value)}
            className="w-full bg-transparent text-sm text-white placeholder-slate-500 focus:outline-hidden"
          />
          {queryText && (
            <button onClick={() => setQueryText('')} className="text-slate-500 hover:text-slate-300">
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="px-1.5 py-0.5 text-[10px] bg-slate-800 border border-slate-700 rounded text-slate-400">
            ESC
          </kbd>
        </div>

        {/* Results Body */}
        <div className="max-h-96 overflow-y-auto p-4 space-y-4">
          {!q ? (
            <div className="py-8 text-center text-xs text-slate-500">
              Type keywords to instantly search across all productivity items.
            </div>
          ) : totalResults === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              No results found for "{queryText}".
            </div>
          ) : (
            <>
              {filteredTasks.length > 0 && (
                <div>
                  <h3 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Tasks ({filteredTasks.length})
                  </h3>
                  <div className="space-y-1">
                    {filteredTasks.slice(0, 5).map((t) => (
                      <div
                        key={t.id}
                        onClick={() => {
                          navigate('/tasks');
                          onClose();
                        }}
                        className="flex items-center justify-between p-2 rounded-lg bg-slate-800/50 hover:bg-slate-800 cursor-pointer transition"
                      >
                        <div className="flex items-center gap-2.5 overflow-hidden">
                          <CheckSquare className="w-4 h-4 text-indigo-400 shrink-0" />
                          <span className="text-xs font-medium text-slate-200 truncate">{t.title}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700 text-slate-300">
                            {t.status}
                          </span>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {filteredHabits.length > 0 && (
                <div>
                  <h3 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Habits ({filteredHabits.length})
                  </h3>
                  <div className="space-y-1">
                    {filteredHabits.slice(0, 5).map((h) => (
                      <div
                        key={h.id}
                        onClick={() => {
                          navigate('/habits');
                          onClose();
                        }}
                        className="flex items-center justify-between p-2 rounded-lg bg-slate-800/50 hover:bg-slate-800 cursor-pointer transition"
                      >
                        <div className="flex items-center gap-2.5 overflow-hidden">
                          <Flame className="w-4 h-4 text-amber-400 shrink-0" />
                          <span className="text-xs font-medium text-slate-200 truncate">{h.title}</span>
                          <span className="text-[10px] text-amber-400">Streak: {h.currentStreak}d</span>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {filteredRoutines.length > 0 && (
                <div>
                  <h3 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Routines ({filteredRoutines.length})
                  </h3>
                  <div className="space-y-1">
                    {filteredRoutines.slice(0, 5).map((r) => (
                      <div
                        key={r.id}
                        onClick={() => {
                          navigate('/routines');
                          onClose();
                        }}
                        className="flex items-center justify-between p-2 rounded-lg bg-slate-800/50 hover:bg-slate-800 cursor-pointer transition"
                      >
                        <div className="flex items-center gap-2.5 overflow-hidden">
                          <Repeat className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span className="text-xs font-medium text-slate-200 truncate">{r.title}</span>
                          <span className="text-[10px] text-slate-400">{r.scheduledTime}</span>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
