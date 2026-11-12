# Dayflow Firestore Database Schema

All database records are strictly isolated under `/users/{userId}/`:

## Collections Structure

### 1. User Document
`Path: /users/{userId}`
- `uid`: string (User identifier)
- `email`: string (User email)
- `displayName`: string
- `photoURL`: string (optional)
- `createdAt`: ISO 8601 string
- `timezone`: string
- `onboardingCompleted`: boolean

### 2. Tasks Collection
`Path: /users/{userId}/tasks/{taskId}`
- `id`: string
- `userId`: string
- `title`: string (1-256 chars)
- `description`: string (markdown/text)
- `status`: `'backlog' | 'todo' | 'in_progress' | 'completed' | 'cancelled' | 'archived'`
- `priority`: `'low' | 'medium' | 'high' | 'urgent'`
- `category`: string (e.g. "Work", "Study", "Personal")
- `tags`: string[]
- `startDate`: string (YYYY-MM-DD)
- `dueDate`: string (YYYY-MM-DD)
- `startTime`: string (HH:mm)
- `endTime`: string (HH:mm)
- `estimatedDuration`: number (in minutes)
- `actualDuration`: number (in minutes)
- `completedAt`: string (optional)
- `createdAt`: string
- `updatedAt`: string
- `recurrence`: `'none' | 'daily' | 'weekly' | 'weekdays' | 'monthly'`
- `reviewedAt`: string (optional)
- `rescheduledCount`: number (optional)

### 3. Nested Subtasks Collection
`Path: /users/{userId}/tasks/{taskId}/subtasks/{subtaskId}`
- `id`: string
- `taskId`: string
- `userId`: string
- `parentSubtaskId`: string | null (allows multi-level subtask hierarchies)
- `title`: string
- `completed`: boolean
- `order`: number
- `createdAt`: string

### 4. Task Notes Collection
`Path: /users/{userId}/tasks/{taskId}/notes/{noteId}`
- `id`: string
- `taskId`: string
- `userId`: string
- `content`: string
- `createdAt`: string
- `updatedAt`: string

### 5. Routines Collection
`Path: /users/{userId}/routines/{routineId}`
- `id`: string
- `userId`: string
- `title`: string
- `description`: string
- `scheduledTime`: string (HH:mm)
- `durationMinutes`: number
- `frequency`: `'daily' | 'weekdays' | 'weekends' | 'weekly' | 'custom'`
- `daysOfWeek`: number[] (0=Sun, 1=Mon, ..., 6=Sat)
- `active`: boolean
- `createdAt`: string

### 6. Routine Occurrences Collection
`Path: /users/{userId}/routineOccurrences/{occurrenceId}`
- `id`: string (`occ_{routineId}_{date}`)
- `routineId`: string
- `userId`: string
- `date`: string (YYYY-MM-DD)
- `completed`: boolean
- `completedAt`: string | null

### 7. Habits Collection
`Path: /users/{userId}/habits/{habitId}`
- `id`: string
- `userId`: string
- `title`: string
- `description`: string
- `frequency`: `'daily' | 'weekly' | 'custom'`
- `targetDaysPerWeek`: number
- `targetValue`: number
- `unit`: string (e.g. "problems", "mins", "pages")
- `color`: string (hex)
- `currentStreak`: number
- `longestStreak`: number
- `archived`: boolean
- `createdAt`: string

### 8. Habit Logs Collection
`Path: /users/{userId}/habitLogs/{logId}`
- `id`: string (`log_{habitId}_{date}`)
- `habitId`: string
- `userId`: string
- `date`: string (YYYY-MM-DD)
- `value`: number
- `completed`: boolean
- `completedAt`: string

### 9. Focus Sessions Collection
`Path: /users/{userId}/focusSessions/{sessionId}`
- `id`: string
- `userId`: string
- `taskId`: string (optional)
- `taskTitle`: string (optional)
- `sessionType`: `'focus' | 'short_break' | 'long_break'`
- `durationMinutes`: number
- `completed`: boolean
- `date`: string (YYYY-MM-DD)
- `startedAt`: string
- `completedAt`: string

### 10. User Settings Document
`Path: /users/{userId}/settings/preferences`
- `userId`: string
- `theme`: `'light' | 'dark' | 'system'`
- `accentColor`: string
- `fontFamily`: string
- `density`: `'compact' | 'comfortable' | 'spacious'`
- `pomodoroFocusMinutes`: number
- `pomodoroShortBreakMinutes`: number
- `pomodoroLongBreakMinutes`: number
- `pomodoroLongBreakInterval`: number
- `pomodoroAutoStartBreaks`: boolean
- `pomodoroAutoStartPomodoros`: boolean
- `audioVolume`: number
- `reviewReminderTime`: string (HH:mm)
- `quietHoursStart`: string (HH:mm)
- `quietHoursEnd`: string (HH:mm)
- `enableSoundEffects`: boolean
- `enableBrowserNotifications`: boolean
- `weekStartDay`: number
- `visibleDashboardWidgets`: string[]
