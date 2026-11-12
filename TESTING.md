# Dayflow Testing Strategy & Verification

## 1. Automated Verification Checks

Dayflow includes type-safety and syntax validation via TypeScript compilation and linting:

```bash
# Verify TypeScript typings and syntax
npm run lint
```

```bash
# Test production bundling
npm run build
```

## 2. Business Logic Test Scenarios

### Task Management & Subtasks
- [x] Create task with title, category, priority, due date.
- [x] Add nested subtasks (`parentSubtaskId`) and verify completion percentage updates dynamically.
- [x] Autosave notes in task inspector and verify persistence.
- [x] Duplicate task and verify copy includes notes and subtask copies.
- [x] Reschedule task during End-of-Day Review and verify notes and subtasks remain intact without duplicates.

### Daily Routines & Occurrences
- [x] Create routine with frequency and scheduled time.
- [x] Verify `getOccurrencesForDate` creates an idempotent occurrence for today.
- [x] Check off today's routine and verify tomorrow's occurrence remains unaffected.

### Habit Tracking & Streaks
- [x] Log habit completion for today.
- [x] Verify current streak increments.
- [x] Check missed day boundary handling.
- [x] Verify 30-day heatmap reflects completed log dates.

### Pomodoro Drift-Free Timer
- [x] Start 25-minute Pomodoro session.
- [x] Refresh browser or switch tabs; verify time remaining calculates from `targetEndTime` without clock drift.
- [x] Complete session; verify Firestore records the focus session and plays audio chime.

### Web Audio Synthesizer
- [x] Trigger Rain, Ocean, and Café ambient channels simultaneously.
- [x] Verify individual volume sliders and master mute controls operate smoothly.
- [x] Verify binaural waves (Alpha, Beta, Theta, Gamma) generate dual-channel frequency offsets without external network requests.
