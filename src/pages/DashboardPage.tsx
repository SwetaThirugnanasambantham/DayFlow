import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  Circle,
  Clock,
  Flame,
  Repeat,
  Sparkles,
  Timer,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Play,
  RotateCcw,
  Check,
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { useAuth } from '../contexts/AuthContext';
import { taskService } from '../services/taskService';
import { habitService } from '../services/habitService';
import { routineService } from '../services/routineService';
import { pomodoroService } from '../services/pomodoroService';
import { analyticsService, ProductivitySummary } from '../services/analyticsService';
import { Task, Habit, HabitLog, Routine, RoutineOccurrence, FocusSession } from '../types';
import confetti from 'canvas-confetti';

interface DashboardPageProps {
  onOpenQuickTask: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onOpenQuickTask }) => {
  const { user, isDemoUser, userProfile } = useAuth();
  const effectiveUid = user?.uid || (isDemoUser ? 'demo_user_dayflow' : 'anonymous');
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [habitLogs, setHabitLogs] = useState<HabitLog[]>([]);
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [occurrences, setOccurrences] = useState<RoutineOccurrence[]>([]);
  const [focusSessions, setFocusSessions] = useState<FocusSession[]>([]);
  const [summary, setSummary] = useState<ProductivitySummary | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];

  const loadData = async () => {
    try {
      setLoading(true);
      const [fetchedTasks, fetchedHabits, fetchedLogs, fetchedRoutines, fetchedOccurrences, fetchedFocus] =
        await Promise.all([
          taskService.getTasks(effectiveUid),
          habitService.getHabits(effectiveUid),
          habitService.getAllLogs(effectiveUid),
          routineService.getRoutines(effectiveUid),
          routineService.getOccurrencesForDate(effectiveUid, todayStr),
          pomodoroService.getRecentSessions(effectiveUid, 7),
        ]);

      setTasks(fetchedTasks || []);
      setHabits(fetchedHabits || []);
      setHabitLogs(fetchedLogs || []);
      setRoutines(fetchedRoutines || []);
      setOccurrences(fetchedOccurrences || []);
      setFocusSessions(fetchedFocus || []);

      const calculatedSummary = analyticsService.calculateProductivitySummary(
        fetchedTasks || [],
        fetchedHabits || [],
        fetchedLogs || [],
        fetchedRoutines || [],
        fetchedOccurrences || [],
        fetchedFocus || []
      );
      setSummary(calculatedSummary);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [effectiveUid]);

  const handleToggleTask = async (task: Task) => {
    const nextStatus = task.status === 'completed' ? 'todo' : 'completed';
    if (nextStatus === 'completed') {
      confetti({ particleCount: 40, spread: 60, origin: { y: 0.8 } });
    }
    await taskService.updateTask(effectiveUid, task.id, { status: nextStatus });
    await loadData();
  };

  const handleToggleRoutine = async (occurrence: RoutineOccurrence) => {
    const nextState = !occurrence.completed;
    if (nextState) {
      confetti({ particleCount: 30, spread: 50, origin: { y: 0.8 } });
    }
    await routineService.toggleOccurrence(effectiveUid, occurrence.id, nextState);
    await loadData();
  };

  const handleToggleHabit = async (habit: Habit) => {
    const isCompletedToday = habitLogs.some((l) => l.habitId === habit.id && l.date === todayStr && l.completed);
    const nextCompleted = !isCompletedToday;
    if (nextCompleted) {
      confetti({ particleCount: 45, spread: 70, origin: { y: 0.7 } });
    }
    await habitService.logHabit(effectiveUid, habit.id, todayStr, nextCompleted, habit.targetValue || 1);
    await loadData();
  };

  const todayTasks = tasks.filter((t) => t.dueDate === todayStr || t.startDate === todayStr);
  const unfinishedCount = tasks.filter((t) => t.status !== 'completed' && t.status !== 'archived').length;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 p-6 rounded-2xl">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>Good day, {userProfile?.displayName?.split(' ')[0] || 'Productivity Hero'}</span>
            <Sparkles className="w-5 h-5 text-amber-400" />
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Today is{' '}
            {new Date().toLocaleDateString(undefined, {
              weekday: 'long',
              month: 'short',
              day: 'numeric',
            })}
            . Let's conquer your goals with clear focus.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => navigate('/review')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-indigo-400" />
            <span>Evening Review</span>
          </button>
          <button
            onClick={onOpenQuickTask}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white shadow-md shadow-indigo-600/30 transition cursor-pointer"
          >
            <span>+ Add Task</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Productivity Score */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center gap-4">
          <div className="relative w-14 h-14 flex items-center justify-center shrink-0">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-slate-800"
                strokeWidth="3.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-indigo-500"
                strokeDasharray={`${summary?.dailyScore || 85}, 100`}
                strokeWidth="3.5"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <span className="absolute text-sm font-bold text-white">
              {summary?.dailyScore || 85}%
            </span>
          </div>
          <div>
            <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
              Dayflow Score
            </div>
            <div className="text-xs text-indigo-300 font-semibold mt-0.5">
              {summary && summary.dailyScore >= 80 ? 'Peak Flow' : 'On Track'}
            </div>
          </div>
        </div>

        {/* Task Velocity */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
              Tasks Completed
            </div>
            <div className="text-xl font-bold text-white mt-1">
              {summary?.completedTasks || 0}
              <span className="text-xs font-normal text-slate-500"> / {summary?.totalTasks || 0}</span>
            </div>
            <div className="text-[10px] text-emerald-400 mt-0.5">
              {summary?.taskCompletionRate || 0}% Completion
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* Focus Hours */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
              Focus Minutes
            </div>
            <div className="text-xl font-bold text-white mt-1">
              {summary?.totalFocusMinutes || 0}
              <span className="text-xs font-normal text-slate-500"> mins</span>
            </div>
            <div className="text-[10px] text-cyan-400 mt-0.5">
              {summary?.completedFocusSessions || 0} Pomodoro Sessions
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <Timer className="w-5 h-5" />
          </div>
        </div>

        {/* Habit Consistency */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
              Habit Consistency
            </div>
            <div className="text-xl font-bold text-white mt-1">
              {summary?.habitConsistencyRate || 0}%
            </div>
            <div className="text-[10px] text-amber-400 mt-0.5">
              {habits.filter((h) => h.currentStreak > 0).length} active streaks
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Flame className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Grid: Today's Tasks & Side Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 spans): Today's Schedule & Actionable Tasks */}
        <div className="lg:col-span-2 space-y-6">
          {/* Today's Tasks Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-indigo-400" />
                <h2 className="text-sm font-bold text-white">Today's Focus Tasks</h2>
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                  {todayTasks.filter((t) => t.status === 'completed').length}/{todayTasks.length}
                </span>
              </div>
              <button
                onClick={() => navigate('/tasks')}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 cursor-pointer"
              >
                <span>View All</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {todayTasks.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                No tasks scheduled for today yet.
                <button
                  onClick={onOpenQuickTask}
                  className="block mx-auto mt-2 text-indigo-400 hover:underline font-medium cursor-pointer"
                >
                  + Add your first task for today
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {todayTasks.map((t) => {
                  const isDone = t.status === 'completed';
                  const subCount = t.subtasks?.length || 0;
                  const completedSub = t.subtasks?.filter((s) => s.completed).length || 0;

                  return (
                    <div
                      key={t.id}
                      className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                        isDone
                          ? 'bg-slate-950/40 border-slate-800/50 opacity-60'
                          : 'bg-slate-800/40 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <button
                          onClick={() => handleToggleTask(t)}
                          className="text-slate-400 hover:text-emerald-400 transition cursor-pointer"
                        >
                          {isDone ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                          ) : (
                            <Circle className="w-5 h-5" />
                          )}
                        </button>
                        <div className="overflow-hidden">
                          <div
                            className={`text-xs font-medium truncate ${
                              isDone ? 'line-through text-slate-500' : 'text-slate-200'
                            }`}
                          >
                            {t.title}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400">
                            <span className="capitalize text-slate-400">{t.category}</span>
                            {t.startTime && <span>• {t.startTime}</span>}
                            {subCount > 0 && (
                              <span>
                                • {completedSub}/{subCount} subtasks
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded font-medium ${
                            t.priority === 'urgent'
                              ? 'bg-rose-500/20 text-rose-300'
                              : t.priority === 'high'
                              ? 'bg-amber-500/20 text-amber-300'
                              : t.priority === 'medium'
                              ? 'bg-indigo-500/20 text-indigo-300'
                              : 'bg-slate-700 text-slate-300'
                          }`}
                        >
                          {t.priority}
                        </span>
                        <button
                          onClick={() => navigate('/pomodoro')}
                          title="Start focus timer on this task"
                          className="p-1 rounded text-slate-400 hover:text-cyan-400 hover:bg-slate-700 transition"
                        >
                          <Play className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Weekly Productivity Trend Bar Chart */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <h2 className="text-sm font-bold text-white">7-Day Productivity Velocity</h2>
              </div>
              <span className="text-[11px] text-slate-400">Tasks Completed & Focus Minutes</span>
            </div>

            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={summary?.weeklyTrend || []}>
                  <XAxis dataKey="day" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#1e293b',
                      borderRadius: '8px',
                      fontSize: '11px',
                    }}
                  />
                  <Bar dataKey="tasksDone" name="Tasks Completed" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="focusMinutes" name="Focus Mins" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Right Column (1 span): Pomodoro Quick Widget, Daily Routines, Habits */}
        <div className="space-y-6">
          {/* Pomodoro Quick Widget */}
          <div className="bg-gradient-to-b from-indigo-950/60 to-slate-900 border border-indigo-500/20 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Timer className="w-4 h-4 text-cyan-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Quick Focus Session
                </h3>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-semibold">
                25 MIN
              </span>
            </div>
            <p className="text-xs text-slate-300 mb-4">
              Enter distraction-free flow with scientific 25-minute Pomodoro intervals.
            </p>
            <button
              onClick={() => navigate('/pomodoro')}
              className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white shadow-md shadow-indigo-600/30 flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Launch Focus Timer</span>
            </button>
          </div>

          {/* Daily Routines Checklist */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Repeat className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Today's Routines
                </h3>
              </div>
              <button
                onClick={() => navigate('/routines')}
                className="text-xs text-indigo-400 hover:underline"
              >
                Manage
              </button>
            </div>

            {occurrences.length === 0 ? (
              <p className="text-xs text-slate-500 py-3 text-center">No active routines today.</p>
            ) : (
              <div className="space-y-2">
                {occurrences.slice(0, 4).map((occ) => {
                  const routine = routines.find((r) => r.id === occ.routineId);
                  if (!routine) return null;
                  return (
                    <div
                      key={occ.id}
                      onClick={() => handleToggleRoutine(occ)}
                      className={`flex items-center justify-between p-2.5 rounded-xl border transition cursor-pointer ${
                        occ.completed
                          ? 'bg-emerald-950/20 border-emerald-800/40 text-slate-400 line-through'
                          : 'bg-slate-800/40 border-slate-800 hover:border-slate-700 text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-4 h-4 rounded flex items-center justify-center border text-[10px] ${
                            occ.completed
                              ? 'bg-emerald-500 border-emerald-500 text-white'
                              : 'border-slate-600'
                          }`}
                        >
                          {occ.completed && <Check className="w-3 h-3" />}
                        </div>
                        <span className="text-xs font-medium truncate">{routine.title}</span>
                      </div>
                      <span className="text-[10px] text-slate-500">{routine.scheduledTime}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Habits Mini Tracker */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Habit Streaks
                </h3>
              </div>
              <button
                onClick={() => navigate('/habits')}
                className="text-xs text-indigo-400 hover:underline"
              >
                View
              </button>
            </div>

            {habits.length === 0 ? (
              <p className="text-xs text-slate-500 py-3 text-center">No habits added yet.</p>
            ) : (
              <div className="space-y-2">
                {habits.slice(0, 4).map((h) => {
                  const isDoneToday = habitLogs.some(
                    (l) => l.habitId === h.id && l.date === todayStr && l.completed
                  );
                  return (
                    <div
                      key={h.id}
                      onClick={() => handleToggleHabit(h)}
                      className={`flex items-center justify-between p-2.5 rounded-xl border transition cursor-pointer ${
                        isDoneToday
                          ? 'bg-amber-950/20 border-amber-800/40'
                          : 'bg-slate-800/40 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-4 h-4 rounded flex items-center justify-center border text-[10px] ${
                            isDoneToday
                              ? 'bg-amber-500 border-amber-500 text-white'
                              : 'border-slate-600'
                          }`}
                        >
                          {isDoneToday && <Check className="w-3 h-3" />}
                        </div>
                        <span className="text-xs font-medium text-slate-200 truncate">{h.title}</span>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] font-bold text-amber-400">
                        <Flame className="w-3 h-3 fill-amber-400 text-amber-400" />
                        <span>{h.currentStreak}d</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
