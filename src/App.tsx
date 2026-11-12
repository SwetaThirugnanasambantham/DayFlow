import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { PreferencesProvider } from './contexts/PreferencesContext';
import { AudioProvider } from './contexts/AudioContext';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { QuickTaskModal } from './components/QuickTaskModal';
import { GlobalSearchModal } from './components/GlobalSearchModal';
import { ThemeSelectorModal } from './components/ThemeSelectorModal';
import { OfflineIndicator } from './components/OfflineIndicator';

import { AuthPage } from './pages/AuthPage';
import { DashboardPage } from './pages/DashboardPage';
import { TasksPage } from './pages/TasksPage';
import { CalendarPage } from './pages/CalendarPage';
import { RoutinesPage } from './pages/RoutinesPage';
import { HabitsPage } from './pages/HabitsPage';
import { PomodoroPage } from './pages/PomodoroPage';
import { ReviewPage } from './pages/ReviewPage';
import { AudioPage } from './pages/AudioPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { SettingsPage } from './pages/SettingsPage';
import { DesktopCompanionPage } from './pages/DesktopCompanionPage';

import { taskService } from './services/taskService';
import { habitService } from './services/habitService';
import { routineService } from './services/routineService';
import { Task, Habit, Routine } from './types';
import { Sparkles } from 'lucide-react';

const AppShell: React.FC = () => {
  const { user, isDemoUser, loading } = useAuth();
  const effectiveUid = user?.uid || (isDemoUser ? 'demo_user_dayflow' : 'anonymous');

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [quickTaskOpen, setQuickTaskOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [themeSelectorOpen, setThemeSelectorOpen] = useState(false);

  // Search cached data
  const [tasks, setTasks] = useState<Task[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [routines, setRoutines] = useState<Routine[]>([]);

  const refreshSearchData = async () => {
    if (!user && !isDemoUser) return;
    try {
      const [t, h, r] = await Promise.all([
        taskService.getTasks(effectiveUid),
        habitService.getHabits(effectiveUid),
        routineService.getRoutines(effectiveUid),
      ]);
      setTasks(t || []);
      setHabits(h || []);
      setRoutines(r || []);
    } catch {}
  };

  const handleOpenSearch = async () => {
    await refreshSearchData();
    setSearchOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-100">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 via-cyan-500 to-emerald-400 p-0.5 shadow-xl flex items-center justify-center animate-pulse">
          <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-cyan-400" />
          </div>
        </div>
        <p className="mt-4 text-xs font-semibold text-slate-400 tracking-wider uppercase">
          Initializing Dayflow...
        </p>
      </div>
    );
  }

  if (!user && !isDemoUser) {
    return <AuthPage />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Sidebar Navigation */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content View with Sidebar Offset on lg screens */}
      <div className="lg:pl-64 flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <Navbar
          onOpenSidebar={() => setSidebarOpen(true)}
          onOpenQuickTask={() => setQuickTaskOpen(true)}
          onOpenSearch={handleOpenSearch}
          onOpenThemeSelector={() => setThemeSelectorOpen(true)}
        />

        {/* Routed Page Container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          <Routes>
            <Route path="/" element={<DashboardPage onOpenQuickTask={() => setQuickTaskOpen(true)} />} />
            <Route path="/tasks" element={<TasksPage />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/routines" element={<RoutinesPage />} />
            <Route path="/habits" element={<HabitsPage />} />
            <Route path="/pomodoro" element={<PomodoroPage />} />
            <Route path="/review" element={<ReviewPage />} />
            <Route path="/audio" element={<AudioPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/companion" element={<DesktopCompanionPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>

      {/* Global Modals & Indicators */}
      <QuickTaskModal
        isOpen={quickTaskOpen}
        onClose={() => setQuickTaskOpen(false)}
        onTaskCreated={refreshSearchData}
      />

      <GlobalSearchModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        tasks={tasks}
        habits={habits}
        routines={routines}
      />

      <ThemeSelectorModal
        isOpen={themeSelectorOpen}
        onClose={() => setThemeSelectorOpen(false)}
      />

      <OfflineIndicator />
    </div>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <PreferencesProvider>
          <AudioProvider>
            <AppShell />
          </AudioProvider>
        </PreferencesProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
