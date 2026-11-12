import { Task, Habit, HabitLog, Routine, RoutineOccurrence, FocusSession } from '../types';

export interface ProductivitySummary {
  dailyScore: number;
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  overdueTasks: number;
  taskCompletionRate: number;
  totalFocusMinutes: number;
  completedFocusSessions: number;
  routineCompletionRate: number;
  habitConsistencyRate: number;
  estimatedHours: number;
  actualHours: number;
  weeklyTrend: {
    day: string;
    tasksDone: number;
    focusMinutes: number;
    habitsDone: number;
  }[];
  categoryBreakdown: {
    name: string;
    count: number;
  }[];
  priorityBreakdown: {
    name: string;
    count: number;
  }[];
}

export class AnalyticsService {
  calculateProductivitySummary(
    tasks: Task[],
    habits: Habit[],
    habitLogs: HabitLog[],
    routines: Routine[],
    occurrences: RoutineOccurrence[],
    focusSessions: FocusSession[]
  ): ProductivitySummary {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    // Filter valid tasks
    const activeTasks = tasks.filter((t) => t.status !== 'archived');
    const totalTasks = activeTasks.length;
    const completedTasks = activeTasks.filter((t) => t.status === 'completed').length;
    const inProgressTasks = activeTasks.filter((t) => t.status === 'in_progress').length;

    // Overdue tasks
    const overdueTasks = activeTasks.filter((t) => {
      if (t.status === 'completed' || t.status === 'cancelled') return false;
      return t.dueDate && t.dueDate < todayStr;
    }).length;

    const taskCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Focus sessions
    const completedFocus = focusSessions.filter((s) => s.completed && s.sessionType === 'focus');
    const totalFocusMinutes = completedFocus.reduce((acc, s) => acc + (s.durationMinutes || 0), 0);
    const completedFocusSessions = completedFocus.length;

    // Routines completion rate
    const totalOccurrences = occurrences.length;
    const completedOccurrences = occurrences.filter((o) => o.completed).length;
    const routineCompletionRate = totalOccurrences > 0 ? Math.round((completedOccurrences / totalOccurrences) * 100) : 100;

    // Habit consistency (completed logs vs active habits)
    const activeHabits = habits.filter((h) => !h.archived);
    const todayHabitLogs = habitLogs.filter((l) => l.date === todayStr && l.completed);
    const habitConsistencyRate =
      activeHabits.length > 0 ? Math.min(100, Math.round((todayHabitLogs.length / activeHabits.length) * 100)) : 100;

    // Estimated vs Actual hours
    const estimatedMinutes = activeTasks.reduce((acc, t) => acc + (t.estimatedDuration || 0), 0);
    const actualMinutes = activeTasks.reduce((acc, t) => acc + (t.actualDuration || 0), 0);
    const estimatedHours = parseFloat((estimatedMinutes / 60).toFixed(1));
    const actualHours = parseFloat((actualMinutes / 60).toFixed(1));

    // Calculate Daily Productivity Score (0 - 100)
    // 35% Tasks completion, 25% Habits, 20% Routines, 20% Focus (target: 60 mins)
    const taskScore = Math.min(35, (taskCompletionRate / 100) * 35);
    const habitScore = Math.min(25, (habitConsistencyRate / 100) * 25);
    const routineScore = Math.min(20, (routineCompletionRate / 100) * 20);
    const focusTarget = 60; // 60 minutes goal
    const focusScore = Math.min(20, (totalFocusMinutes / focusTarget) * 20);

    const dailyScore = Math.min(100, Math.round(taskScore + habitScore + routineScore + focusScore));

    // 7-day weekly trend
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weeklyTrend: ProductivitySummary['weeklyTrend'] = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dStr = d.toISOString().split('T')[0];
      const dayLabel = daysOfWeek[d.getDay()];

      const doneTasks = activeTasks.filter(
        (t) => t.status === 'completed' && t.completedAt && t.completedAt.startsWith(dStr)
      ).length;

      const fMins = focusSessions
        .filter((s) => s.completed && s.sessionType === 'focus' && s.date === dStr)
        .reduce((sum, s) => sum + (s.durationMinutes || 0), 0);

      const hDone = habitLogs.filter((l) => l.date === dStr && l.completed).length;

      weeklyTrend.push({
        day: dayLabel,
        tasksDone: doneTasks,
        focusMinutes: fMins,
        habitsDone: hDone,
      });
    }

    // Category breakdown
    const categoryMap: Record<string, number> = {};
    activeTasks.forEach((t) => {
      const cat = t.category || 'General';
      categoryMap[cat] = (categoryMap[cat] || 0) + 1;
    });
    const categoryBreakdown = Object.entries(categoryMap).map(([name, count]) => ({ name, count }));

    // Priority breakdown
    const priorityMap: Record<string, number> = { urgent: 0, high: 0, medium: 0, low: 0 };
    activeTasks.forEach((t) => {
      if (priorityMap[t.priority] !== undefined) {
        priorityMap[t.priority]++;
      }
    });
    const priorityBreakdown = Object.entries(priorityMap).map(([name, count]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      count,
    }));

    return {
      dailyScore: totalTasks === 0 && activeHabits.length === 0 ? 85 : dailyScore,
      totalTasks,
      completedTasks,
      inProgressTasks,
      overdueTasks,
      taskCompletionRate,
      totalFocusMinutes,
      completedFocusSessions,
      routineCompletionRate,
      habitConsistencyRate,
      estimatedHours,
      actualHours,
      weeklyTrend,
      categoryBreakdown,
      priorityBreakdown,
    };
  }
}

export const analyticsService = new AnalyticsService();
