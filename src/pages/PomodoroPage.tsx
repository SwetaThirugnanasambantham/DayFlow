import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  Timer,
  CheckCircle2,
  Volume2,
  VolumeX,
  Settings,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { usePreferences } from '../contexts/PreferencesContext';
import { taskService } from '../services/taskService';
import { pomodoroService } from '../services/pomodoroService';
import { notificationService } from '../services/notificationService';
import { Task, FocusSessionType, FocusSession } from '../types';
import confetti from 'canvas-confetti';

const STORAGE_KEY = 'dayflow_pomodoro_state';

interface PersistedTimerState {
  targetEndTime: number | null;
  remainingSeconds: number;
  isRunning: boolean;
  sessionType: FocusSessionType;
  completedCycles: number;
  selectedTaskId: string;
  startedAt: string;
}

export const PomodoroPage: React.FC = () => {
  const { user, isDemoUser } = useAuth();
  const effectiveUid = user?.uid || (isDemoUser ? 'demo_user_dayflow' : 'anonymous');
  const { preferences, updatePreferences } = usePreferences();

  const [sessionType, setSessionType] = useState<FocusSessionType>('focus');
  const [isRunning, setIsRunning] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(
    (preferences.pomodoroFocusMinutes || 25) * 60
  );
  const [targetEndTime, setTargetEndTime] = useState<number | null>(null);
  const [completedCycles, setCompletedCycles] = useState(0);
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [recentSessions, setRecentSessions] = useState<FocusSession[]>([]);
  const [startedAt, setStartedAt] = useState<string>(new Date().toISOString());

  // Restore persisted timer state on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed: PersistedTimerState = JSON.parse(saved);
        setSessionType(parsed.sessionType);
        setCompletedCycles(parsed.completedCycles || 0);
        setSelectedTaskId(parsed.selectedTaskId || '');
        setStartedAt(parsed.startedAt || new Date().toISOString());

        if (parsed.isRunning && parsed.targetEndTime) {
          const now = Date.now();
          const diff = Math.max(0, Math.round((parsed.targetEndTime - now) / 1000));
          if (diff > 0) {
            setRemainingSeconds(diff);
            setTargetEndTime(parsed.targetEndTime);
            setIsRunning(true);
          } else {
            // Timer expired while away
            setRemainingSeconds(0);
            setIsRunning(false);
            setTargetEndTime(null);
          }
        } else {
          setRemainingSeconds(parsed.remainingSeconds);
          setIsRunning(false);
          setTargetEndTime(null);
        }
      }
    } catch (e) {
      console.warn('Failed restoring pomodoro state:', e);
    }
  }, []);

  // Fetch tasks and focus history
  const loadData = async () => {
    const [t, s] = await Promise.all([
      taskService.getTasks(effectiveUid),
      pomodoroService.getRecentSessions(effectiveUid, 7),
    ]);
    setTasks(t || []);
    setRecentSessions(s || []);
  };

  useEffect(() => {
    loadData();
  }, [effectiveUid]);

  // Accurate drift-free tick loop relying on targetEndTime
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isRunning && targetEndTime) {
      interval = setInterval(() => {
        const now = Date.now();
        const diff = Math.max(0, Math.round((targetEndTime - now) / 1000));
        setRemainingSeconds(diff);

        if (diff <= 0) {
          clearInterval(interval!);
          handleSessionComplete();
        }
      }, 500);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, targetEndTime]);

  // Persist timer state to survive tab switches/refreshes
  useEffect(() => {
    const state: PersistedTimerState = {
      targetEndTime,
      remainingSeconds,
      isRunning,
      sessionType,
      completedCycles,
      selectedTaskId,
      startedAt,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [targetEndTime, remainingSeconds, isRunning, sessionType, completedCycles, selectedTaskId, startedAt]);

  const getDurationForType = (type: FocusSessionType) => {
    if (type === 'focus') return (preferences.pomodoroFocusMinutes || 25) * 60;
    if (type === 'short_break') return (preferences.pomodoroShortBreakMinutes || 5) * 60;
    return (preferences.pomodoroLongBreakMinutes || 15) * 60;
  };

  const handleStart = () => {
    const now = Date.now();
    const newTarget = now + remainingSeconds * 1000;
    setTargetEndTime(newTarget);
    setIsRunning(true);
    setStartedAt(new Date().toISOString());

    // Request notification permission if not yet granted
    notificationService.requestPermission();
  };

  const handlePause = () => {
    setIsRunning(false);
    setTargetEndTime(null);
  };

  const handleReset = () => {
    setIsRunning(false);
    setTargetEndTime(null);
    setRemainingSeconds(getDurationForType(sessionType));
  };

  const handleSkip = () => {
    setIsRunning(false);
    setTargetEndTime(null);
    transitionToNextSession();
  };

  const handleSessionComplete = async () => {
    setIsRunning(false);
    setTargetEndTime(null);

    // Audio chime & notification
    notificationService.notify({
      title: sessionType === 'focus' ? 'Focus Session Completed!' : 'Break Time Over!',
      message:
        sessionType === 'focus'
          ? 'Great job! Time to recharge with a restful break.'
          : 'Break finished! Ready to step back into the flow?',
      type: 'pomodoro',
      sound: preferences.enableSoundEffects,
    });

    if (sessionType === 'focus') {
      confetti({ particleCount: 50, spread: 70, origin: { y: 0.6 } });
      const durationMins = preferences.pomodoroFocusMinutes || 25;
      const associatedTask = tasks.find((t) => t.id === selectedTaskId);

      // Record focus session to Firestore
      await pomodoroService.recordSession(effectiveUid, {
        taskId: selectedTaskId || undefined,
        taskTitle: associatedTask?.title,
        sessionType: 'focus',
        durationMinutes: durationMins,
        startedAt,
      });

      // Update task actual duration if linked
      if (associatedTask) {
        const nextActual = (associatedTask.actualDuration || 0) + durationMins;
        await taskService.updateTask(effectiveUid, associatedTask.id, {
          actualDuration: nextActual,
        });
      }

      setCompletedCycles((prev) => prev + 1);
      await loadData();
    }

    transitionToNextSession();
  };

  const transitionToNextSession = () => {
    let nextType: FocusSessionType = 'focus';

    if (sessionType === 'focus') {
      const nextCycleCount = completedCycles + 1;
      const interval = preferences.pomodoroLongBreakInterval || 4;
      if (nextCycleCount % interval === 0) {
        nextType = 'long_break';
      } else {
        nextType = 'short_break';
      }
    } else {
      nextType = 'focus';
    }

    setSessionType(nextType);
    const nextDuration = getDurationForType(nextType);
    setRemainingSeconds(nextDuration);

    const autoStart =
      nextType === 'focus'
        ? preferences.pomodoroAutoStartPomodoros
        : preferences.pomodoroAutoStartBreaks;

    if (autoStart) {
      const newTarget = Date.now() + nextDuration * 1000;
      setTargetEndTime(newTarget);
      setIsRunning(true);
      setStartedAt(new Date().toISOString());
    }
  };

  const switchTypeManual = (type: FocusSessionType) => {
    setIsRunning(false);
    setTargetEndTime(null);
    setSessionType(type);
    setRemainingSeconds(getDurationForType(type));
  };

  // Format mm:ss
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const totalDuration = getDurationForType(sessionType);
  const progressPercent = Math.max(
    0,
    Math.min(100, Math.round(((totalDuration - remainingSeconds) / totalDuration) * 100))
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Timer className="w-4 h-4" />
            <span>Deep Work Protocol</span>
          </div>
          <h1 className="text-xl font-bold text-white">Pomodoro Focus Timer</h1>
          <p className="text-xs text-slate-400 mt-1">
            Drift-free, timestamp-accurate interval timer. Runs continuously even across tab sleep.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-slate-800 p-1 rounded-xl border border-slate-700">
          <button
            onClick={() => switchTypeManual('focus')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
              sessionType === 'focus' ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-400'
            }`}
          >
            Focus (25m)
          </button>
          <button
            onClick={() => switchTypeManual('short_break')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
              sessionType === 'short_break' ? 'bg-cyan-600 text-white font-semibold' : 'text-slate-400'
            }`}
          >
            Short Break (5m)
          </button>
          <button
            onClick={() => switchTypeManual('long_break')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
              sessionType === 'long_break' ? 'bg-emerald-600 text-white font-semibold' : 'text-slate-400'
            }`}
          >
            Long Break (15m)
          </button>
        </div>
      </div>

      {/* Main Timer Display Dial */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 sm:p-12 text-center shadow-2xl relative overflow-hidden">
        {/* Glow backdrop */}
        <div
          className={`absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full blur-3xl opacity-20 pointer-events-none ${
            sessionType === 'focus'
              ? 'bg-indigo-500'
              : sessionType === 'short_break'
              ? 'bg-cyan-500'
              : 'bg-emerald-500'
          }`}
        />

        {/* Task selector link */}
        <div className="max-w-xs mx-auto mb-6">
          <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
            Focus on Task (Optional):
          </label>
          <select
            value={selectedTaskId}
            onChange={(e) => setSelectedTaskId(e.target.value)}
            className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-hidden"
          >
            <option value="">No task selected (general focus)</option>
            {tasks
              .filter((t) => t.status !== 'completed')
              .map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title} ({t.priority})
                </option>
              ))}
          </select>
        </div>

        {/* Large Digital Clock Dial */}
        <div className="relative w-64 h-64 sm:w-80 sm:h-80 mx-auto flex items-center justify-center my-4">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            <circle
              className="text-slate-800"
              strokeWidth="4"
              stroke="currentColor"
              fill="transparent"
              r="44"
              cx="50"
              cy="50"
            />
            <circle
              className={
                sessionType === 'focus'
                  ? 'text-indigo-500'
                  : sessionType === 'short_break'
                  ? 'text-cyan-400'
                  : 'text-emerald-400'
              }
              strokeWidth="5"
              strokeDasharray={276.4}
              strokeDashoffset={276.4 - (276.4 * progressPercent) / 100}
              strokeLinecap="round"
              stroke="currentColor"
              fill="transparent"
              r="44"
              cx="50"
              cy="50"
              style={{ transition: 'stroke-dashoffset 0.5s ease' }}
            />
          </svg>

          <div className="absolute flex flex-col items-center">
            <span className="text-5xl sm:text-7xl font-mono font-bold tracking-tight text-white">
              {timeFormatted}
            </span>
            <span className="mt-2 text-xs uppercase font-bold tracking-widest text-slate-400">
              {sessionType.replace('_', ' ')}
            </span>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex items-center justify-center gap-4 mt-8">
          <button
            onClick={handleReset}
            className="p-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
            title="Reset Timer"
          >
            <RotateCcw className="w-5 h-5" />
          </button>

          <button
            onClick={isRunning ? handlePause : handleStart}
            className={`px-8 py-4 rounded-2xl font-bold text-sm text-white shadow-xl flex items-center gap-2.5 transition transform hover:scale-105 cursor-pointer ${
              sessionType === 'focus'
                ? 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/30'
                : 'bg-cyan-600 hover:bg-cyan-500 shadow-cyan-600/30'
            }`}
          >
            {isRunning ? (
              <>
                <Pause className="w-5 h-5 fill-current" />
                <span>Pause Session</span>
              </>
            ) : (
              <>
                <Play className="w-5 h-5 fill-current" />
                <span>Start Flow</span>
              </>
            )}
          </button>

          <button
            onClick={handleSkip}
            className="p-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
            title="Skip to Next Session"
          >
            <SkipForward className="w-5 h-5" />
          </button>
        </div>

        {/* Session counter dots */}
        <div className="flex items-center justify-center gap-2 mt-8 text-xs text-slate-400">
          <span>Completed Cycles Today:</span>
          <div className="flex items-center gap-1.5">
            {[1, 2, 3, 4].map((num) => (
              <span
                key={num}
                className={`w-3 h-3 rounded-full border transition ${
                  completedCycles % 4 >= num || completedCycles >= 4
                    ? 'bg-indigo-500 border-indigo-400 shadow-xs shadow-indigo-500/50'
                    : 'border-slate-700 bg-slate-800'
                }`}
              />
            ))}
          </div>
          <span className="font-bold text-white">({completedCycles})</span>
        </div>
      </div>

      {/* Focus History Log */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-white">Completed Focus Sessions ({recentSessions.length})</h3>

        {recentSessions.length === 0 ? (
          <p className="text-xs text-slate-500 py-4 text-center">
            No completed sessions recorded yet. Start your first 25-minute Pomodoro session above!
          </p>
        ) : (
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {recentSessions.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-800/40 border border-slate-800 text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <div>
                    <span className="font-semibold text-slate-200">
                      {s.taskTitle || 'General Focus Session'}
                    </span>
                    <div className="text-[10px] text-slate-500">{s.date}</div>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-semibold text-[11px]">
                  {s.durationMinutes} mins
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
