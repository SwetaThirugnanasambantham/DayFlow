import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  CheckSquare,
  Calendar,
  Repeat,
  Flame,
  Timer,
  RotateCcw,
  Headphones,
  BarChart3,
  Settings,
  Monitor,
  LogOut,
  User,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { PWAInstallButton } from './PWAInstallButton';

interface SidebarProps {
  isOpen: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { userProfile, isDemoUser, logout } = useAuth();

  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/tasks', label: 'My Tasks', icon: CheckSquare },
    { to: '/calendar', label: 'Calendar', icon: Calendar },
    { to: '/routines', label: 'Daily Routines', icon: Repeat },
    { to: '/habits', label: 'Habit Tracker', icon: Flame },
    { to: '/pomodoro', label: 'Focus Timer', icon: Timer },
    { to: '/review', label: 'Evening Review', icon: RotateCcw },
    { to: '/audio', label: 'Focus Audio', icon: Headphones },
    { to: '/analytics', label: 'Analytics', icon: BarChart3 },
    { to: '/settings', label: 'Settings', icon: Settings },
    { to: '/companion', label: 'Desktop Widget', icon: Monitor },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs lg:hidden"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 flex flex-col bg-slate-900 border-r border-slate-800 text-slate-200 transition-transform duration-200 lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-800/80">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-cyan-500 to-emerald-400 p-0.5 shadow-md flex items-center justify-center">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-cyan-400" />
            </div>
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
              <span>Dayflow</span>
              <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                PRO
              </span>
            </h1>
            <p className="text-[11px] text-slate-400">Life & Productivity OS</p>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5 text-xs font-medium">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-indigo-600 text-white font-semibold shadow-xs shadow-indigo-500/20'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Install widget in sidebar */}
        <div className="px-4 py-2 border-t border-slate-800/60 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">Offline PWA</span>
          <PWAInstallButton />
        </div>

        {/* User profile footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-cyan-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                {userProfile?.displayName ? userProfile.displayName.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
              </div>
              <div className="overflow-hidden">
                <div className="text-xs font-medium text-slate-200 truncate">
                  {userProfile?.displayName || 'User'}
                </div>
                <div className="text-[10px] text-slate-500 truncate">
                  {isDemoUser ? 'Explorer Demo Mode' : userProfile?.email || 'Signed In'}
                </div>
              </div>
            </div>
            <button
              onClick={() => logout()}
              title="Sign Out"
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-md transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
