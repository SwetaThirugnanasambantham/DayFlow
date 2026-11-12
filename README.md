# Dayflow — Personal Productivity & Life Management Application

Dayflow is a comprehensive, production-oriented personal productivity ecosystem built using **React**, **TypeScript**, **Vite**, **Tailwind CSS**, and **Firebase**.

Dayflow unifies daily and long-term task management, calendar scheduling, habit tracking with streak algorithms, recurring routines, a drift-free Pomodoro focus timer, ambient focus sound synthesis via the Web Audio API, an End-of-Day review workflow, real productivity analytics, customizable workspaces, and offline PWA support.

---

## Key Modules & Features

1. **Authentication & Identity**: Firebase Authentication (Google popup, email/password registration, password reset, session persistence) plus an immediate offline Explorer Demo mode.
2. **Advanced Task Management**: Full CRUD, 4 priority levels (Low, Medium, High, Urgent), 6 workflow statuses (Backlog, To Do, In Progress, Completed, Cancelled, Archived), category tags, start and due dates, estimated vs actual duration, List View and Kanban Board View.
3. **Nested Subtasks**: Multi-level hierarchical subtask trees (e.g. DSA → Arrays, Strings; Technical → DBMS, OS) with calculated completion progress percentages.
4. **Task Notes**: Contextual scratchpad and timestamped notes per task that remain associated during status transitions and rescheduling.
5. **Calendar & Scheduling**: Month, Week, Day, and Agenda timelines with scheduling conflict detection and deadline tracking.
6. **End-of-Day Review & Rescheduling**: Dedicated evening workflow for unresolved tasks with one-click actions: continue tomorrow, reschedule to a custom date, move to backlog, archive, or complete. Zero task loss or duplicate tasks.
7. **Daily Routines & Cadence**: Recurring rituals (Morning routine, Evening revision, etc.) with automated idempotent daily occurrences. Completing today's occurrence never affects tomorrow's.
8. **Habit Tracker & Consistency**: Daily, weekly, and custom frequency habits with streak tracking, longest streaks, 7-day interactive check-ins, and 30-day calendar heatmaps.
9. **Pomodoro Focus Timer**: Timestamp-based drift-free interval timer (25 min focus / 5 min short break / 15 min long break) that survives browser tab sleep and page reloads. Associates sessions with tasks and records history in Firestore.
10. **Focus Audio & Ambient Mixer**: 14 procedural sound channels (Rain, Thunderstorm, Ocean waves, Forest, Café chatter, White/Pink/Brown noise, Alpha 10Hz, Beta 18Hz, Theta 6Hz, Gamma 40Hz binaural waves, Ambient harmonic chords) synthesized in-browser via the Web Audio API. 100% offline, zero external MP3 link breakage.
11. **Reminders & Notifications**: Browser Notification API, acoustic completion chimes, quiet hours enforcement, and in-app logs.
12. **Productivity Analytics**: Dynamic calculation of Dayflow score, completion rates, deep work hours, category breakdowns, and weekly trends using Recharts.
13. **Customization & Personalization**: Dark, Light, and System themes, 6 color accents, density toggles, Pomodoro interval customization, and full JSON data export.
14. **Progressive Web App (PWA)**: Auto-updating service worker, manifest with standard 192x192 and 512x512 icons, iOS home screen guidance, and IndexedDB offline cache.
15. **Desktop Productivity Companion**: Compact always-on-top style HUD layout with mini-timer, quick task entry, and daily checklist.

---

## Getting Started

### Local Development

1. Install dependencies:
```bash
npm install
```

2. Start the development server on port 3000:
```bash
npm run dev
```

3. Open your browser at `http://localhost:3000`.

### Production Build

```bash
npm run build
```
The compiled output will be generated in `dist/`.
