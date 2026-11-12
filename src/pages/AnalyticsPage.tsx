import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  PieChart as PieIcon,
  CheckCircle2,
  Clock,
  Flame,
  Repeat,
  Calendar,
  Sparkles,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area,
} from 'recharts';
import { useAuth } from '../contexts/AuthContext';
import { taskService } from '../services/taskService';
import { habitService } from '../services/habitService';
import { routineService } from '../services/routineService';
import { pomodoroService } from '../services/pomodoroService';
import { analyticsService, ProductivitySummary } from '../services/analyticsService';

export const AnalyticsPage: React.FC = () => {
  const { user, isDemoUser } = useAuth();
  const effectiveUid = user?.uid || (isDemoUser ? 'demo_user_dayflow' : 'anonymous');

  const [summary, setSummary] = useState<ProductivitySummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const [tasks, habits, logs, routines, focus] = await Promise.all([
          taskService.getTasks(effectiveUid),
          habitService.getHabits(effectiveUid),
          habitService.getAllLogs(effectiveUid),
          routineService.getRoutines(effectiveUid),
          pomodoroService.getRecentSessions(effectiveUid, 30),
        ]);

        const todayStr = new Date().toISOString().split('T')[0];
        const occs = await routineService.getOccurrencesForDate(effectiveUid, todayStr);

        const data = analyticsService.calculateProductivitySummary(
          tasks || [],
          habits || [],
          logs || [],
          routines || [],
          occs || [],
          focus || []
        );
        setSummary(data);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [effectiveUid]);

  const COLORS = ['#4f46e5', '#06b6d4', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6'];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-1">
          <BarChart3 className="w-4 h-4" />
          <span>Productivity Intelligence</span>
        </div>
        <h1 className="text-xl font-bold text-white">Analytics & Performance Insights</h1>
        <p className="text-xs text-slate-400 mt-1">
          Quantitative review of your completion velocity, deep work volume, and habit consistency.
        </p>
      </div>

      {loading || !summary ? (
        <div className="p-12 text-center text-slate-500 text-xs">Computing productivity metrics...</div>
      ) : (
        <>
          {/* Top Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
              <div className="text-[11px] font-semibold text-slate-400 uppercase">Task Completion Rate</div>
              <div className="text-2xl font-bold text-white mt-1">{summary.taskCompletionRate}%</div>
              <div className="text-[10px] text-emerald-400 mt-0.5">
                {summary.completedTasks} of {summary.totalTasks} tasks resolved
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
              <div className="text-[11px] font-semibold text-slate-400 uppercase">Deep Work Volume</div>
              <div className="text-2xl font-bold text-white mt-1">
                {(summary.totalFocusMinutes / 60).toFixed(1)} <span className="text-xs font-normal">hrs</span>
              </div>
              <div className="text-[10px] text-cyan-400 mt-0.5">
                {summary.completedFocusSessions} Pomodoro sessions logged
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
              <div className="text-[11px] font-semibold text-slate-400 uppercase">Estimated vs Actual</div>
              <div className="text-2xl font-bold text-white mt-1">
                {summary.actualHours}h <span className="text-xs text-slate-500 font-normal">/ {summary.estimatedHours}h est.</span>
              </div>
              <div className="text-[10px] text-indigo-400 mt-0.5">Time estimation fidelity</div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
              <div className="text-[11px] font-semibold text-slate-400 uppercase">Routine Reliability</div>
              <div className="text-2xl font-bold text-white mt-1">{summary.routineCompletionRate}%</div>
              <div className="text-[10px] text-amber-400 mt-0.5">Habit consistency: {summary.habitConsistencyRate}%</div>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Weekly Activity Area Chart */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-cyan-400" />
                  <span>Weekly Output Distribution</span>
                </h3>
                <span className="text-[11px] text-slate-500">Last 7 Days</span>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={summary.weeklyTrend}>
                    <defs>
                      <linearGradient id="colorFocus" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorTasks" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                      </linearGradient>
                    </defs>
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
                    <Area type="monotone" dataKey="focusMinutes" name="Focus Mins" stroke="#06b6d4" fillOpacity={1} fill="url(#colorFocus)" />
                    <Area type="monotone" dataKey="tasksDone" name="Tasks Done" stroke="#4f46e5" fillOpacity={1} fill="url(#colorTasks)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Category Breakdown Pie Chart */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <PieIcon className="w-4 h-4 text-indigo-400" />
                  <span>Tasks by Category</span>
                </h3>
                <span className="text-[11px] text-slate-500">Current Distribution</span>
              </div>

              <div className="h-64 w-full flex items-center justify-center">
                {summary.categoryBreakdown.length === 0 ? (
                  <p className="text-xs text-slate-500">No task category data available yet.</p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={summary.categoryBreakdown}
                        dataKey="count"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={4}
                      >
                        {summary.categoryBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0f172a',
                          borderColor: '#1e293b',
                          borderRadius: '8px',
                          fontSize: '11px',
                        }}
                      />
                      <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '11px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
