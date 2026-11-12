import React, { useState, useEffect } from 'react';
import {
  Monitor,
  CheckCircle2,
  Circle,
  Play,
  Pause,
  Plus,
  Flame,
  Repeat,
  RotateCcw,
  Sparkles,
  ExternalLink,
  Check,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { taskService } from '../services/taskService';
import { routineService } from '../services/routineService';
import { habitService } from '../services/habitService';
import { pomodoroService } from '../services/pomodoroService';
import { Task, Routine, RoutineOccurrence, Habit } from '../types';

export const DesktopCompanionPage: React.FC = () => {
  const { user, isDemoUser } = useAuth();
  const effectiveUid = user?.uid || (isDemoUser ? 'demo_user_dayflow' : 'anonymous');

  const [tasks, setTasks] = useState<Task[]>([]);
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [occurrences, setOccurrences] = useState<RoutineOccurrence[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [quickTitle, setQuickTitle] = useState('');

  // Mini timer state
  const [timerSeconds, setTimerSeconds] = useState(25 * 60);
  const [timerRunning, setTimerRunning] = useState(false);

  const todayStr = new Date().toISOString().split('T')[0];

  const loadData = async () => {
    const [t, r, occs, h] = await Promise.all([
      taskService.getTasks(effectiveUid),
      routineService.getRoutines(effectiveUid),
      routineService.getOccurrencesForDate(effectiveUid, todayStr),
      habitService.getHabits(effectiveUid),
    ]);
    setTasks(t || []);
    setRoutines(r || []);
    setOccurrences(occs || []);
    setHabits(h || []);
  };

  useEffect(() => {
    loadData();
  }, [effectiveUid]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (timerRunning) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => {
          if (prev <= 1) {
            setTimerRunning(false);
            return 25 * 60;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerRunning]);

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;
    await taskService.createTask(effectiveUid, {
      title: quickTitle.trim(),
      dueDate: todayStr,
      status: 'todo',
    });
    setQuickTitle('');
    await loadData();
  };

  const handleToggleTask = async (task: Task) => {
    const nextStatus = task.status === 'completed' ? 'todo' : 'completed';
    await taskService.updateTask(effectiveUid, task.id, { status: nextStatus });
    await loadData();
  };

  const handleToggleOcc = async (occ: RoutineOccurrence) => {
    await routineService.toggleOccurrence(effectiveUid, occ.id, !occ.completed);
    await loadData();
  };

  const mins = Math.floor(timerSeconds / 60);
  const secs = timerSeconds % 60;
  const timeFormatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  const todayTasks = tasks.filter((t) => t.dueDate === todayStr || t.status === 'in_progress');

  return (
    <div className="max-w-xl mx-auto space-y-6 pb-12">
      {/* Companion Title Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between">
        <div>
          <div className="flex items-center gap-1.5 text-cyan-400 text-[11px] font-bold uppercase tracking-wider mb-0.5">
            <Monitor className="w-3.5 h-3.5" />
            <span>Desktop Companion Mode</span>
          </div>
          <h1 className="text-base font-bold text-white">Compact Productivity HUD</h1>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Designed to dock alongside code editors, design tools, or document workspaces.
          </p>
        </div>
      </div>

      {/* Mini Companion HUD Card */}
      <div className="bg-slate-900 border-2 border-indigo-500/40 rounded-2xl shadow-2xl p-5 space-y-5 backdrop-blur-md">
        {/* Mini Pomodoro Bar */}
        <div className="flex items-center justify-between bg-slate-950 p-3 rounded-xl border border-slate-800">
          <div className="flex items-center gap-3">
            <span className="text-2xl font-mono font-bold text-white">{timeFormatted}</span>
            <span className="text-[10px] uppercase font-bold text-indigo-400 px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20">
              Focus 25m
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setTimerRunning(!timerRunning)}
              className={`p-2 rounded-xl text-white font-bold transition cursor-pointer ${
                timerRunning ? 'bg-amber-600 hover:bg-amber-500' : 'bg-indigo-600 hover:bg-indigo-500'
              }`}
            >
              {timerRunning ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
            </button>
            <button
              onClick={() => {
                setTimerRunning(false);
                setTimerSeconds(25 * 60);
              }}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Quick Task Entry */}
        <form onSubmit={handleQuickAdd} className="flex gap-2">
          <input
            type="text"
            placeholder="Quick capture task for today..."
            value={quickTitle}
            onChange={(e) => setQuickTitle(e.target.value)}
            className="flex-1 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden"
          />
          <button
            type="submit"
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white rounded-xl transition"
          >
            Add
          </button>
        </form>

        {/* Compact Today's Checklist */}
        <div className="space-y-2">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Today's Tasks ({todayTasks.filter((t) => t.status === 'completed').length}/{todayTasks.length})
          </div>
          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {todayTasks.length === 0 ? (
              <p className="text-xs text-slate-500 py-3 text-center">No tasks scheduled for today.</p>
            ) : (
              todayTasks.map((t) => (
                <div
                  key={t.id}
                  onClick={() => handleToggleTask(t)}
                  className={`flex items-center justify-between p-2 rounded-lg border transition cursor-pointer ${
                    t.status === 'completed'
                      ? 'bg-slate-950/40 border-slate-800 text-slate-500 line-through'
                      : 'bg-slate-800/60 border-slate-700/60 text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    {t.status === 'completed' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <Circle className="w-4 h-4 text-slate-500 shrink-0" />
                    )}
                    <span className="text-xs font-medium truncate">{t.title}</span>
                  </div>
                  <span className="text-[10px] text-slate-400">{t.category}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Compact Routines */}
        <div className="space-y-2 pt-2 border-t border-slate-800">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Daily Routines
          </div>
          <div className="grid grid-cols-2 gap-2">
            {occurrences.slice(0, 4).map((occ) => {
              const r = routines.find((item) => item.id === occ.routineId);
              if (!r) return null;
              return (
                <div
                  key={occ.id}
                  onClick={() => handleToggleOcc(occ)}
                  className={`p-2 rounded-lg border text-xs font-medium flex items-center justify-between cursor-pointer transition ${
                    occ.completed
                      ? 'bg-emerald-950/20 border-emerald-800/40 text-slate-400 line-through'
                      : 'bg-slate-800/40 border-slate-700/60 text-slate-200'
                  }`}
                >
                  <span className="truncate">{r.title}</span>
                  {occ.completed && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Integration Plan Note (Module 18) */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-400 space-y-2">
        <div className="font-semibold text-slate-200 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>Desktop Companion Architecture Note</span>
        </div>
        <p className="leading-relaxed text-[11px]">
          Dayflow can be wrapped directly with <strong>Tauri</strong> or <strong>Electron</strong> to run as an always-on-top frameless floating desktop widget on Windows 10/11. The core logic, IndexedDB offline sync, and Firebase Authentication remain unified across both the browser PWA and the desktop executable.
        </p>
      </div>
    </div>
  );
};
