# Dayflow Architecture & System Design

## 1. High-Level Architectural Overview

Dayflow follows a modular Single Page Application (SPA) architecture designed for reliability, offline resilience, and zero-trust security:

```
┌─────────────────────────────────────────────────────────────┐
│                    Dayflow UI Shell                         │
│  (React 19 + TypeScript + Tailwind CSS + Lucide React)      │
│                                                             │
│   Navbar (Search, Quick Task, Audio Mini-Player, Theme)     │
│   Sidebar (Responsive Nav, PWA Install, User Profile)       │
├─────────────────────────────────────────────────────────────┤
│                    Application State & Contexts             │
│   • AuthContext (Firebase Auth + Offline Explorer Mode)     │
│   • PreferencesContext (Themes, Accents, Intervals)         │
│   • AudioContext (14 Web Audio Channels, Presets)           │
├─────────────────────────────────────────────────────────────┤
│                    Service Layer                            │
│   • taskService (CRUD, Subtask Hierarchy, Notes, Review)   │
│   • routineService (Idempotent Occurrences, Checklists)     │
│   • habitService (Streak Calculations, Heatmaps, Logs)      │
│   • pomodoroService (Timestamp Timing, History Logs)        │
│   • audioEngine (Web Audio Procedural Sound Synthesizer)    │
│   • analyticsService (Daily Productivity Score, Charts)     │
│   • notificationService (Quiet Hours, Browser API, Chimes)  │
│   • offlineStorage (IndexedDB Key-Value Cache & Queue)      │
├─────────────────────────────────────────────────────────────┤
│                    Backend Infrastructure                   │
│   • Cloud Firestore (Per-User Isolated Subtrees)           │
│   • Firebase Authentication (Google, Email/Password)        │
│   • Firestore Security Rules (Strict ABAC & Path Guards)    │
│   • Service Worker & Web App Manifest (PWA Cache)           │
└─────────────────────────────────────────────────────────────┘
```

## 2. State & Data Flow Principles

1. **User Scoping**: All user entities reside strictly in the per-user path: `/users/{userId}/*`. This guarantees mathematical tenant isolation in Firestore security rules.
2. **Offline-First Persistence**: Writes and reads interact through the service layer, maintaining a fast local mirror in IndexedDB (`dayflow_offline_db`). When network dropouts occur, the UI continues functioning without crash or unhandled promise rejection.
3. **Drift-Free Timing**: The Pomodoro system never relies on `setInterval` tick count alone (which throttles when the tab is inactive or machine sleeps). Instead, it computes remaining time against `targetEndTime = Date.now() + remainingSeconds * 1000` and saves state to `localStorage`.
4. **Procedural Web Audio Engine**: Ambient audio is synthesized on the fly using Web Audio oscillators, pink/brown noise buffers, and biquad filters. This delivers 100% reliable sound with zero external bandwidth dependency, no missing audio files, and zero copyright issues.
