import React, { useState, useEffect } from 'react';
import {
  Repeat,
  Plus,
  CheckCircle2,
  Circle,
  Clock,
  Calendar,
  Trash2,
  Check,
  Edit2,
  X,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { routineService } from '../services/routineService';
import { Routine, RoutineOccurrence, RoutineFrequency } from '../types';
import confetti from 'canvas-confetti';

export const RoutinesPage: React.FC = () => {
  const { user, isDemoUser } = useAuth();
  const effectiveUid = user?.uid || (isDemoUser ? 'demo_user_dayflow' : 'anonymous');

  const [routines, setRoutines] = useState<Routine[]>([]);
  const [occurrences, setOccurrences] = useState<RoutineOccurrence[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal create state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [scheduledTime, setScheduledTime] = useState('08:00');
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [frequency, setFrequency] = useState<RoutineFrequency>('daily');
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5]); // Weekdays default

  const todayStr = new Date().toISOString().split('T')[0];

  const loadData = async () => {
    try {
      setLoading(true);
      const [allRoutines, todayOccs] = await Promise.all([
        routineService.getRoutines(effectiveUid),
        routineService.getOccurrencesForDate(effectiveUid, todayStr),
      ]);
      setRoutines(allRoutines || []);
      setOccurrences(todayOccs || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [effectiveUid]);

  const handleCreateRoutine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    await routineService.createRoutine(effectiveUid, {
      title: title.trim(),
      description: description.trim(),
      scheduledTime,
      durationMinutes: Number(durationMinutes) || 30,
      frequency,
      daysOfWeek: selectedDays,
      active: true,
    });

    setTitle('');
    setDescription('');
    setIsModalOpen(false);
    await loadData();
  };

  const handleToggleOccurrence = async (occurrence: RoutineOccurrence) => {
    const nextState = !occurrence.completed;
    if (nextState) {
      confetti({ particleCount: 30, spread: 60, origin: { y: 0.8 } });
    }
    await routineService.toggleOccurrence(effectiveUid, occurrence.id, nextState);
    await loadData();
  };

  const handleDeleteRoutine = async (id: string) => {
    if (confirm('Delete this routine?')) {
      await routineService.deleteRoutine(effectiveUid, id);
      await loadData();
    }
  };

  const handleToggleActive = async (routine: Routine) => {
    await routineService.updateRoutine(effectiveUid, routine.id, { active: !routine.active });
    await loadData();
  };

  const weekdaysLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Repeat className="w-4 h-4" />
            <span>Habitual Rituals</span>
          </div>
          <h1 className="text-xl font-bold text-white">Daily Routines & Cadence</h1>
          <p className="text-xs text-slate-400 mt-1">
            Anchor your morning, work blocks, and evening wind-down with consistent recurring routines.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white shadow-md shadow-indigo-600/30 transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Routine</span>
        </button>
      </div>

      {/* Today's Checklist Grid */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Today's Routine Checklist</span>
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Independent daily occurrences automatically generated for today.
            </p>
          </div>
          <span className="text-xs font-bold text-emerald-400">
            {occurrences.filter((o) => o.completed).length} / {occurrences.length} Done
          </span>
        </div>

        {loading ? (
          <div className="py-8 text-center text-slate-500 text-xs">Loading routines...</div>
        ) : occurrences.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs">
            No routines scheduled for today. Add routines below to establish your daily rhythm.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {occurrences.map((occ) => {
              const routine = routines.find((r) => r.id === occ.routineId);
              if (!routine) return null;

              return (
                <div
                  key={occ.id}
                  onClick={() => handleToggleOccurrence(occ)}
                  className={`flex items-center justify-between p-3.5 rounded-xl border transition cursor-pointer ${
                    occ.completed
                      ? 'bg-emerald-950/20 border-emerald-800/40 text-slate-400'
                      : 'bg-slate-800/50 border-slate-800 hover:border-slate-700 text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div
                      className={`w-5 h-5 rounded-lg flex items-center justify-center border transition ${
                        occ.completed
                          ? 'bg-emerald-500 border-emerald-500 text-white'
                          : 'border-slate-600 bg-slate-900'
                      }`}
                    >
                      {occ.completed && <Check className="w-3.5 h-3.5" />}
                    </div>
                    <div className="overflow-hidden">
                      <div
                        className={`text-xs font-semibold truncate ${
                          occ.completed ? 'line-through text-slate-500' : 'text-slate-100'
                        }`}
                      >
                        {routine.title}
                      </div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                        <Clock className="w-3 h-3 text-slate-500" />
                        <span>{routine.scheduledTime}</span>
                        <span>• {routine.durationMinutes} mins</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Routine Definitions List */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-white">Configured Routines ({routines.length})</h2>

        <div className="space-y-3">
          {routines.map((r) => (
            <div
              key={r.id}
              className="flex items-center justify-between p-4 rounded-xl bg-slate-800/40 border border-slate-800 hover:border-slate-700 transition"
            >
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold text-white">{r.title}</h3>
                  <span
                    className={`text-[9px] uppercase px-1.5 py-0.5 rounded font-semibold ${
                      r.active ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    {r.active ? 'Active' : 'Paused'}
                  </span>
                </div>
                {r.description && <p className="text-[11px] text-slate-400 mt-1">{r.description}</p>}
                <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-500">
                  <span className="capitalize text-slate-400">Frequency: {r.frequency}</span>
                  <span>• Time: {r.scheduledTime}</span>
                  <span>• Duration: {r.durationMinutes} mins</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleToggleActive(r)}
                  className={`px-2.5 py-1 text-xs rounded-lg border transition ${
                    r.active
                      ? 'border-slate-700 text-slate-400 hover:text-white'
                      : 'border-emerald-600/40 text-emerald-400 bg-emerald-950/20'
                  }`}
                >
                  {r.active ? 'Pause' : 'Activate'}
                </button>
                <button
                  onClick={() => handleDeleteRoutine(r.id)}
                  className="p-1.5 text-slate-500 hover:text-rose-400 transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal: Create Routine */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 text-slate-100">
            <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
              <h2 className="text-base font-bold text-white">Create Routine</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateRoutine} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Routine Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Morning Focus Ritual, DSA Practice, Evening Review..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Steps or cues for this routine..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Scheduled Time</label>
                  <input
                    type="time"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Duration (Mins)</label>
                  <input
                    type="number"
                    min={5}
                    step={5}
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Frequency</label>
                <select
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value as RoutineFrequency)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-hidden"
                >
                  <option value="daily">Daily (7 days)</option>
                  <option value="weekdays">Weekdays (Mon - Fri)</option>
                  <option value="weekends">Weekends (Sat - Sun)</option>
                  <option value="weekly">Weekly</option>
                  <option value="custom">Custom Days</option>
                </select>
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
                  Save Routine
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
