import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Repeat,
  Plus,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { taskService } from '../services/taskService';
import { routineService } from '../services/routineService';
import { Task, Routine } from '../types';

export const CalendarPage: React.FC = () => {
  const { user, isDemoUser } = useAuth();
  const effectiveUid = user?.uid || (isDemoUser ? 'demo_user_dayflow' : 'anonymous');

  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [calendarView, setCalendarView] = useState<'month' | 'week' | 'day' | 'agenda'>('month');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [t, r] = await Promise.all([
          taskService.getTasks(effectiveUid),
          routineService.getRoutines(effectiveUid),
        ]);
        setTasks(t || []);
        setRoutines(r || []);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [effectiveUid]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Navigation handlers
  const handlePrev = () => {
    const d = new Date(currentDate);
    if (calendarView === 'month') d.setMonth(d.getMonth() - 1);
    else if (calendarView === 'week') d.setDate(d.getDate() - 7);
    else d.setDate(d.getDate() - 1);
    setCurrentDate(d);
  };

  const handleNext = () => {
    const d = new Date(currentDate);
    if (calendarView === 'month') d.setMonth(d.getMonth() + 1);
    else if (calendarView === 'week') d.setDate(d.getDate() + 7);
    else d.setDate(d.getDate() + 1);
    setCurrentDate(d);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Month grid calculations
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 is Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const calendarDays: { dayNum: number; dateStr: string; isCurrentMonth: boolean }[] = [];
  // Fill previous month padding
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    const d = prevMonthLastDay - i;
    const prevDate = new Date(year, month - 1, d);
    calendarDays.push({
      dayNum: d,
      dateStr: prevDate.toISOString().split('T')[0],
      isCurrentMonth: false,
    });
  }
  // Fill current month days
  for (let d = 1; d <= daysInMonth; d++) {
    const curDate = new Date(year, month, d);
    const dateStr = curDate.toISOString().split('T')[0];
    calendarDays.push({
      dayNum: d,
      dateStr,
      isCurrentMonth: true,
    });
  }
  // Fill next month padding up to multiple of 7
  const remaining = 42 - calendarDays.length;
  for (let d = 1; d <= remaining; d++) {
    const nextDate = new Date(year, month + 1, d);
    calendarDays.push({
      dayNum: d,
      dateStr: nextDate.toISOString().split('T')[0],
      isCurrentMonth: false,
    });
  }

  // Conflict detection for today
  const selectedDateStr = currentDate.toISOString().split('T')[0];
  const selectedDateTasks = tasks.filter(
    (t) => (t.dueDate === selectedDateStr || t.startDate === selectedDateStr) && t.startTime && t.endTime
  );

  const hasConflicts = selectedDateTasks.some((t1, idx1) =>
    selectedDateTasks.some((t2, idx2) => {
      if (idx1 >= idx2) return false;
      return t1.startTime! < t2.endTime! && t2.startTime! < t1.endTime!;
    })
  );

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-6 pb-12">
      {/* Calendar Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl border border-slate-700">
            <button
              onClick={handlePrev}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleToday}
              className="px-2.5 py-1 text-xs font-semibold text-slate-200 hover:text-white hover:bg-slate-700 rounded-lg transition cursor-pointer"
            >
              Today
            </button>
            <button
              onClick={handleNext}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <h2 className="text-base font-bold text-white">
            {currentDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
          </h2>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl border border-slate-700">
          {(['month', 'week', 'day', 'agenda'] as const).map((view) => (
            <button
              key={view}
              onClick={() => setCalendarView(view)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition cursor-pointer ${
                calendarView === view
                  ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {view}
            </button>
          ))}
        </div>
      </div>

      {/* Conflict banner if conflicts detected */}
      {hasConflicts && (
        <div className="flex items-center gap-2 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-300">
          <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
          <span>Scheduling Conflict Detected: You have overlapping time blocks on this day.</span>
        </div>
      )}

      {/* Main Calendar View Area */}
      {calendarView === 'month' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          {/* Weekday column titles */}
          <div className="grid grid-cols-7 border-b border-slate-800 bg-slate-950/60 text-center py-2.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            <span>Sun</span>
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
          </div>

          {/* 6x7 Month Grid */}
          <div className="grid grid-cols-7 divide-x divide-y divide-slate-800/80">
            {calendarDays.map((cDay, idx) => {
              const dayTasks = tasks.filter((t) => t.dueDate === cDay.dateStr || t.startDate === cDay.dateStr);
              const isToday = cDay.dateStr === todayStr;

              return (
                <div
                  key={idx}
                  className={`min-h-[96px] sm:min-h-[110px] p-2 flex flex-col justify-between transition-colors ${
                    !cDay.isCurrentMonth
                      ? 'bg-slate-950/40 opacity-40'
                      : isToday
                      ? 'bg-indigo-950/20'
                      : 'hover:bg-slate-800/20'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-semibold w-6 h-6 rounded-full flex items-center justify-center ${
                        isToday
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : cDay.isCurrentMonth
                          ? 'text-slate-300'
                          : 'text-slate-600'
                      }`}
                    >
                      {cDay.dayNum}
                    </span>
                    {dayTasks.length > 0 && (
                      <span className="text-[10px] text-slate-500 font-medium">
                        {dayTasks.length} task{dayTasks.length > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>

                  <div className="space-y-1 mt-1 overflow-hidden">
                    {dayTasks.slice(0, 3).map((t) => (
                      <div
                        key={t.id}
                        title={t.title}
                        className={`text-[10px] px-1.5 py-0.5 rounded truncate font-medium ${
                          t.status === 'completed'
                            ? 'bg-slate-800 text-slate-500 line-through'
                            : t.priority === 'urgent'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : t.priority === 'high'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                        }`}
                      >
                        {t.startTime ? `${t.startTime} ` : ''}
                        {t.title}
                      </div>
                    ))}
                    {dayTasks.length > 3 && (
                      <div className="text-[9px] text-slate-500 pl-1 font-semibold">
                        +{dayTasks.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Agenda & Day List View */}
      {(calendarView === 'day' || calendarView === 'agenda' || calendarView === 'week') && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-400" />
              <span>Agenda Timeline</span>
            </h3>
            <span className="text-xs text-slate-400">Chronological schedule</span>
          </div>

          <div className="space-y-3">
            {tasks.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">No tasks scheduled yet.</p>
            ) : (
              tasks
                .filter((t) => t.dueDate)
                .sort((a, b) => (a.dueDate! > b.dueDate! ? 1 : -1))
                .map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between p-3.5 rounded-xl bg-slate-800/40 border border-slate-800 hover:border-slate-700 transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-center px-2 py-1 bg-slate-800 rounded-lg shrink-0">
                        <div className="text-[10px] uppercase font-bold text-slate-400">
                          {new Date(t.dueDate! + 'T00:00:00').toLocaleDateString(undefined, {
                            weekday: 'short',
                          })}
                        </div>
                        <div className="text-sm font-bold text-white">
                          {new Date(t.dueDate! + 'T00:00:00').getDate()}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-slate-200">{t.title}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
                          <span className="capitalize">{t.category}</span>
                          {t.startTime && (
                            <span>
                              • {t.startTime} {t.endTime ? `- ${t.endTime}` : ''}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                        t.priority === 'urgent'
                          ? 'bg-rose-500/20 text-rose-300'
                          : t.priority === 'high'
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-slate-700 text-slate-300'
                      }`}
                    >
                      {t.priority}
                    </span>
                  </div>
                ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
