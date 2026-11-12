import React, { useState, useEffect } from 'react';
import {
  RotateCcw,
  Calendar,
  ArrowRight,
  CheckCircle2,
  Archive,
  Inbox,
  Clock,
  Sparkles,
  ChevronRight,
  PartyPopper,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { taskService } from '../services/taskService';
import { Task } from '../types';
import confetti from 'canvas-confetti';

export const ReviewPage: React.FC = () => {
  const { user, isDemoUser } = useAuth();
  const effectiveUid = user?.uid || (isDemoUser ? 'demo_user_dayflow' : 'anonymous');

  const [unfinishedTasks, setUnfinishedTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [customDate, setCustomDate] = useState(new Date().toISOString().split('T')[0]);
  const [isCompletedAll, setIsCompletedAll] = useState(false);

  const todayStr = new Date().toISOString().split('T')[0];

  const fetchUnfinishedTasks = async () => {
    try {
      setLoading(true);
      const allTasks = await taskService.getTasks(effectiveUid);
      // Tasks scheduled on or before today that are not completed or archived
      const unfinished = (allTasks || []).filter((t) => {
        if (t.status === 'completed' || t.status === 'archived' || t.status === 'cancelled') return false;
        return t.dueDate && t.dueDate <= todayStr;
      });
      setUnfinishedTasks(unfinished);
      setIsCompletedAll(unfinished.length === 0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnfinishedTasks();
  }, [effectiveUid]);

  const handleAction = async (
    action: 'continue_tomorrow' | 'reschedule_date' | 'move_backlog' | 'archive' | 'complete',
    targetDate?: string
  ) => {
    const currentTask = unfinishedTasks[currentIndex];
    if (!currentTask) return;

    await taskService.handleReviewAction(effectiveUid, currentTask, action, targetDate);

    if (currentIndex >= unfinishedTasks.length - 1) {
      setIsCompletedAll(true);
      confetti({ particleCount: 70, spread: 80, origin: { y: 0.6 } });
    } else {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const currentTask = unfinishedTasks[currentIndex];

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      {/* Review Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 p-6 rounded-2xl flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-1">
            <RotateCcw className="w-4 h-4" />
            <span>End-of-Day Productivity Audit</span>
          </div>
          <h1 className="text-xl font-bold text-white">Daily Review & Rescheduling</h1>
          <p className="text-xs text-slate-400 mt-1">
            Ensure no task is left behind. Reflect, adapt your commitments, and set yourself up for a clear tomorrow.
          </p>
        </div>
        {!isCompletedAll && unfinishedTasks.length > 0 && (
          <div className="text-right shrink-0">
            <span className="text-2xl font-bold text-white">
              {currentIndex + 1}
              <span className="text-xs text-slate-500 font-normal"> / {unfinishedTasks.length}</span>
            </span>
            <div className="text-[10px] text-slate-400 uppercase font-semibold">In Progress</div>
          </div>
        )}
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-500 text-xs">Loading review session...</div>
      ) : isCompletedAll ? (
        /* Completion State */
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-emerald-500 to-cyan-500 p-0.5 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <PartyPopper className="w-8 h-8 text-emerald-400" />
            </div>
          </div>
          <h2 className="text-lg font-bold text-white">Daily Review Complete!</h2>
          <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
            All your scheduled tasks for today have been reviewed, completed, or safely rescheduled.
            Your mind is free of unresolved mental debt. Rest well!
          </p>
          <button
            onClick={fetchUnfinishedTasks}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 rounded-xl transition cursor-pointer"
          >
            Re-check Schedule
          </button>
        </div>
      ) : (
        /* Active Task Review Card */
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          {/* Task Card Header */}
          <div className="flex items-start justify-between pb-4 border-b border-slate-800">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400">
                Unfinished Task
              </span>
              <h2 className="text-lg font-bold text-white mt-1">{currentTask.title}</h2>
              <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-400">
                <span className="capitalize">{currentTask.category}</span>
                <span>• Priority: <strong className="text-slate-200 uppercase">{currentTask.priority}</strong></span>
                {currentTask.dueDate && <span>• Due: {currentTask.dueDate}</span>}
              </div>
            </div>
          </div>

          {/* Description */}
          {currentTask.description ? (
            <p className="text-xs text-slate-300 leading-relaxed bg-slate-800/40 p-4 rounded-xl border border-slate-800">
              {currentTask.description}
            </p>
          ) : (
            <p className="text-xs text-slate-500 italic">No detailed description provided for this task.</p>
          )}

          {/* Subtasks summary */}
          {currentTask.subtasks && currentTask.subtasks.length > 0 && (
            <div className="p-3.5 bg-slate-800/30 rounded-xl border border-slate-800">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Subtasks Progress ({currentTask.subtasks.filter((s) => s.completed).length}/
                {currentTask.subtasks.length})
              </div>
              <div className="space-y-1">
                {currentTask.subtasks.map((s) => (
                  <div key={s.id} className="text-xs text-slate-300 flex items-center gap-2">
                    <span className={s.completed ? 'text-emerald-400' : 'text-slate-500'}>
                      {s.completed ? '✓' : '○'}
                    </span>
                    <span className={s.completed ? 'line-through text-slate-500' : ''}>{s.title}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Review Decision Buttons */}
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Choose Next Action:
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Option 1: Continue Tomorrow */}
              <button
                onClick={() => handleAction('continue_tomorrow')}
                className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-left transition cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                  <ArrowRight className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-white">Continue Tomorrow</div>
                  <div className="text-[10px] text-slate-400">Reschedules dueDate to tomorrow</div>
                </div>
              </button>

              {/* Option 2: Mark Complete */}
              <button
                onClick={() => handleAction('complete')}
                className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-left transition cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-white">Mark Complete</div>
                  <div className="text-[10px] text-slate-400">Finish and log accomplishment</div>
                </div>
              </button>

              {/* Option 3: Move to Backlog */}
              <button
                onClick={() => handleAction('move_backlog')}
                className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-left transition cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                  <Inbox className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-white">Move to Backlog</div>
                  <div className="text-[10px] text-slate-400">Remove due date for future planning</div>
                </div>
              </button>

              {/* Option 4: Archive */}
              <button
                onClick={() => handleAction('archive')}
                className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-left transition cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-lg bg-slate-700 text-slate-300 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                  <Archive className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-white">Archive Task</div>
                  <div className="text-[10px] text-slate-400">No longer relevant, store in archives</div>
                </div>
              </button>
            </div>

            {/* Custom Reschedule Date */}
            <div className="flex items-center gap-2 pt-2">
              <input
                type="date"
                value={customDate}
                onChange={(e) => setCustomDate(e.target.value)}
                className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-hidden"
              />
              <button
                onClick={() => handleAction('reschedule_date', customDate)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white rounded-xl transition cursor-pointer"
              >
                Reschedule to This Date
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
