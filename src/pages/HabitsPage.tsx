import React, { useState, useEffect } from 'react';
import {
  Flame,
  Plus,
  Check,
  Calendar,
  Trophy,
  Trash2,
  TrendingUp,
  X,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { habitService } from '../services/habitService';
import { Habit, HabitLog, HabitFrequency } from '../types';
import confetti from 'canvas-confetti';

export const HabitsPage: React.FC = () => {
  const { user, isDemoUser } = useAuth();
  const effectiveUid = user?.uid || (isDemoUser ? 'demo_user_dayflow' : 'anonymous');

  const [habits, setHabits] = useState<Habit[]>([]);
  const [habitLogs, setHabitLogs] = useState<HabitLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal Create state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [frequency, setFrequency] = useState<HabitFrequency>('daily');
  const [targetValue, setTargetValue] = useState(1);
  const [unit, setUnit] = useState('times');
  const [color, setColor] = useState('#4f46e5');

  const todayStr = new Date().toISOString().split('T')[0];

  const loadData = async () => {
    try {
      setLoading(true);
      const [h, l] = await Promise.all([
        habitService.getHabits(effectiveUid),
        habitService.getAllLogs(effectiveUid),
      ]);
      setHabits(h || []);
      setHabitLogs(l || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [effectiveUid]);

  const handleCreateHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    await habitService.createHabit(effectiveUid, {
      title: title.trim(),
      description: description.trim(),
      frequency,
      targetDaysPerWeek: frequency === 'daily' ? 7 : 5,
      targetValue: Number(targetValue) || 1,
      unit,
      color,
    });

    setTitle('');
    setDescription('');
    setIsModalOpen(false);
    await loadData();
  };

  const handleToggleLog = async (habit: Habit, dateStr: string) => {
    const isCompleted = habitLogs.some(
      (l) => l.habitId === habit.id && l.date === dateStr && l.completed
    );
    const nextCompleted = !isCompleted;
    if (nextCompleted && dateStr === todayStr) {
      confetti({ particleCount: 40, spread: 60, origin: { y: 0.7 } });
    }
    await habitService.logHabit(effectiveUid, habit.id, dateStr, nextCompleted, habit.targetValue || 1);
    await loadData();
  };

  const handleDeleteHabit = async (id: string) => {
    if (confirm('Delete this habit and all associated logs?')) {
      await habitService.deleteHabit(effectiveUid, id);
      await loadData();
    }
  };

  // Past 7 days array for weekly pills
  const past7Days: { dateStr: string; dayLabel: string }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    past7Days.push({
      dateStr: d.toISOString().split('T')[0],
      dayLabel: d.toLocaleDateString(undefined, { weekday: 'narrow' }),
    });
  }

  // Past 30 days for heatmap
  const past30Days: string[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    past30Days.push(d.toISOString().split('T')[0]);
  }

  const colorOptions = [
    { label: 'Indigo', hex: '#4f46e5' },
    { label: 'Cyan', hex: '#06b6d4' },
    { label: 'Emerald', hex: '#10b981' },
    { label: 'Amber', hex: '#f59e0b' },
    { label: 'Rose', hex: '#f43f5e' },
    { label: 'Purple', hex: '#8b5cf6' },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <div>
          <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Flame className="w-4 h-4 fill-amber-400" />
            <span>Consistency Engine</span>
          </div>
          <h1 className="text-xl font-bold text-white">Habit Tracker & Streaks</h1>
          <p className="text-xs text-slate-400 mt-1">
            Build unshakeable daily habits. Track consistency, maintain streaks, and celebrate steady progress.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white shadow-md shadow-indigo-600/30 transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Habit</span>
        </button>
      </div>

      {/* Habit Cards Grid */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-12 text-center text-slate-500 text-xs">Loading habits...</div>
        ) : habits.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400 text-xs">
            No habits configured yet. Create habits like "Solve 1 DSA Problem Daily" or "Read 20 Mins" to start your streak!
          </div>
        ) : (
          habits.map((habit) => {
            const isCompletedToday = habitLogs.some(
              (l) => l.habitId === habit.id && l.date === todayStr && l.completed
            );

            return (
              <div
                key={habit.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4 hover:border-slate-700 transition"
              >
                {/* Top Habit Info Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleToggleLog(habit, todayStr)}
                      className={`w-7 h-7 rounded-xl flex items-center justify-center border transition cursor-pointer ${
                        isCompletedToday
                          ? 'bg-amber-500 border-amber-500 text-white shadow-xs'
                          : 'border-slate-700 bg-slate-800 hover:border-amber-400'
                      }`}
                      title="Check in for today"
                    >
                      {isCompletedToday ? <Check className="w-4 h-4 stroke-[3]" /> : null}
                    </button>
                    <div>
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <span>{habit.title}</span>
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: habit.color || '#4f46e5' }}
                        />
                      </h3>
                      {habit.description && (
                        <p className="text-[11px] text-slate-400 mt-0.5">{habit.description}</p>
                      )}
                    </div>
                  </div>

                  {/* Streaks KPIs */}
                  <div className="flex items-center gap-4 self-end sm:self-auto">
                    <div className="text-center px-3 py-1.5 bg-slate-800/80 rounded-xl border border-slate-700/60">
                      <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                        <Flame className="w-3 h-3 fill-amber-400 text-amber-400" />
                        <span>Current</span>
                      </div>
                      <div className="text-sm font-bold text-amber-400">{habit.currentStreak} days</div>
                    </div>

                    <div className="text-center px-3 py-1.5 bg-slate-800/80 rounded-xl border border-slate-700/60">
                      <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                        <Trophy className="w-3 h-3 text-cyan-400" />
                        <span>Best</span>
                      </div>
                      <div className="text-sm font-bold text-cyan-400">{habit.longestStreak} days</div>
                    </div>

                    <button
                      onClick={() => handleDeleteHabit(habit.id)}
                      className="p-2 text-slate-500 hover:text-rose-400 transition"
                      title="Delete Habit"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* 7-Day Quick Check-in Row */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-800/60">
                  <span className="text-[11px] font-semibold text-slate-400">Past 7 Days:</span>
                  <div className="flex items-center gap-2">
                    {past7Days.map((d) => {
                      const isDone = habitLogs.some(
                        (l) => l.habitId === habit.id && l.date === d.dateStr && l.completed
                      );
                      const isToday = d.dateStr === todayStr;

                      return (
                        <div key={d.dateStr} className="text-center">
                          <button
                            onClick={() => handleToggleLog(habit, d.dateStr)}
                            className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold transition cursor-pointer ${
                              isDone
                                ? 'bg-amber-500 text-white'
                                : 'bg-slate-800 border border-slate-700 text-slate-500 hover:border-slate-500'
                            } ${isToday ? 'ring-2 ring-indigo-500' : ''}`}
                            title={`${d.dateStr}: ${isDone ? 'Completed' : 'Missed'}`}
                          >
                            {isDone ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : d.dayLabel}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 30-Day Heatmap Visualization */}
                <div className="pt-2">
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    30-Day Heatmap
                  </div>
                  <div className="grid grid-cols-15 sm:grid-cols-30 gap-1">
                    {past30Days.map((dStr) => {
                      const isDone = habitLogs.some(
                        (l) => l.habitId === habit.id && l.date === dStr && l.completed
                      );
                      return (
                        <div
                          key={dStr}
                          onClick={() => handleToggleLog(habit, dStr)}
                          className={`h-4 rounded-xs transition cursor-pointer ${
                            isDone ? 'bg-amber-500' : 'bg-slate-800 hover:bg-slate-700'
                          }`}
                          title={`${dStr}: ${isDone ? 'Completed' : 'Incomplete'}`}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal: Create Habit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 text-slate-100">
            <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
              <h2 className="text-base font-bold text-white">Create Habit</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateHabit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Habit Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Solve 1 DSA Problem, Read 20 Mins, Exercise..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Why is this habit important?</label>
                <textarea
                  rows={2}
                  placeholder="Purpose, cues, and motivation..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Target Value</label>
                  <input
                    type="number"
                    min={1}
                    value={targetValue}
                    onChange={(e) => setTargetValue(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Unit</label>
                  <input
                    type="text"
                    placeholder="e.g. mins, problems, pages"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Color Accent</label>
                <div className="flex items-center gap-2">
                  {colorOptions.map((c) => (
                    <button
                      key={c.hex}
                      type="button"
                      onClick={() => setColor(c.hex)}
                      className={`w-6 h-6 rounded-full transition cursor-pointer ${
                        color === c.hex ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900' : ''
                      }`}
                      style={{ backgroundColor: c.hex }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition"
                >
                  Save Habit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
