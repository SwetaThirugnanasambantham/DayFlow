import React from 'react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { WifiOff } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-lg bg-amber-500/90 text-white px-3 py-1.5 text-xs font-medium shadow-lg backdrop-blur-xs border border-amber-400/30 animate-pulse">
      <WifiOff className="w-3.5 h-3.5" />
      <span>Offline Mode — Cached data is in use. Changes will sync when reconnected.</span>
    </div>
  );
};
