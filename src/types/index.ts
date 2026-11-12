export type TaskStatus = 'backlog' | 'todo' | 'in_progress' | 'completed' | 'cancelled' | 'archived';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Subtask {
  id: string;
  taskId: string;
  userId: string;
  parentSubtaskId?: string | null; // For nested subtasks
  title: string;
  completed: boolean;
  order: number;
  createdAt: string;
}

export interface TaskNote {
  id: string;
  taskId: string;
  userId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  userId: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  category: string;
  tags: string[];
  startDate?: string; // YYYY-MM-DD
  dueDate?: string;   // YYYY-MM-DD
  startTime?: string; // HH:mm
  endTime?: string;   // HH:mm
  estimatedDuration?: number; // in minutes
  actualDuration?: number;    // in minutes
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
  subtasks?: Subtask[];
  notes?: TaskNote[];
  recurrence?: 'none' | 'daily' | 'weekly' | 'weekdays' | 'monthly';
  reviewedAt?: string;
  rescheduledCount?: number;
}

export type RoutineFrequency = 'daily' | 'weekdays' | 'weekends' | 'weekly' | 'custom';

export interface Routine {
  id: string;
  userId: string;
  title: string;
  description: string;
  scheduledTime: string; // HH:mm
  durationMinutes: number;
  frequency: RoutineFrequency;
  daysOfWeek: number[]; // 0=Sunday, 1=Monday...
  active: boolean;
  createdAt: string;
}

export interface RoutineOccurrence {
  id: string;
  routineId: string;
  userId: string;
  date: string; // YYYY-MM-DD
  completed: boolean;
  completedAt?: string;
}

export type HabitFrequency = 'daily' | 'weekly' | 'custom';

export interface Habit {
  id: string;
  userId: string;
  title: string;
  description: string;
  frequency: HabitFrequency;
  targetDaysPerWeek: number; // e.g., 7 for daily, 5 for weekdays
  targetValue?: number; // e.g., 20 (minutes), 1 (problem)
  unit?: string; // "mins", "problems", "pages", "glasses"
  color: string;
  currentStreak: number;
  longestStreak: number;
  archived: boolean;
  createdAt: string;
}

export interface HabitLog {
  id: string;
  habitId: string;
  userId: string;
  date: string; // YYYY-MM-DD
  value?: number;
  completed: boolean;
  completedAt: string;
}

export type FocusSessionType = 'focus' | 'short_break' | 'long_break';

export interface FocusSession {
  id: string;
  userId: string;
  taskId?: string;
  taskTitle?: string;
  sessionType: FocusSessionType;
  durationMinutes: number;
  completed: boolean;
  date: string; // YYYY-MM-DD
  startedAt: string;
  completedAt?: string;
}

export type AestheticThemeId =
  | 'default'
  | 'nude'
  | 'monotonic'
  | 'tropical'
  | 'city_landscape'
  | 'pastel'
  | 'nordic';

export type BackgroundPattern = 'none' | 'subtle-grid' | 'dots' | 'glow' | 'mesh';
export type TypographyStyle = 'sans' | 'serif' | 'mono' | 'rounded';

export interface UserPreferences {
  userId: string;
  theme: 'light' | 'dark' | 'system';
  aestheticTheme: AestheticThemeId;
  backgroundPattern: BackgroundPattern;
  typographyStyle: TypographyStyle;
  accentColor: string; // 'indigo' | 'emerald' | 'amber' | 'rose' | 'violet' | 'cyan'
  fontFamily: string;
  density: 'compact' | 'comfortable' | 'spacious';
  pomodoroFocusMinutes: number;
  pomodoroShortBreakMinutes: number;
  pomodoroLongBreakMinutes: number;
  pomodoroLongBreakInterval: number;
  pomodoroAutoStartBreaks: boolean;
  pomodoroAutoStartPomodoros: boolean;
  audioVolume: number; // 0 to 1
  reviewReminderTime: string; // HH:mm (default '20:00')
  quietHoursStart: string; // HH:mm
  quietHoursEnd: string; // HH:mm
  enableSoundEffects: boolean;
  enableBrowserNotifications: boolean;
  weekStartDay: number; // 0=Sunday, 1=Monday
  visibleDashboardWidgets: string[];
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  createdAt: string;
  timezone: string;
  onboardingCompleted: boolean;
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'task' | 'habit' | 'routine' | 'pomodoro' | 'review' | 'system';
  createdAt: string;
  read: boolean;
  actionUrl?: string;
}

export interface AmbientSound {
  id: string;
  name: string;
  category: 'nature' | 'noise' | 'binaural' | 'music' | 'urban';
  icon: string;
  description: string;
  volume: number; // 0 to 1
  isPlaying: boolean;
  generatorType:
    | 'rain'
    | 'thunder'
    | 'ocean'
    | 'forest'
    | 'cafe'
    | 'whitenoise'
    | 'pinknoise'
    | 'brownnoise'
    | 'alpha'
    | 'beta'
    | 'theta'
    | 'gamma'
    | 'lofi'
    | 'ambient_pad';
}
