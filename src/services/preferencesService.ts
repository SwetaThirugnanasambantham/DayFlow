import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase/firebase';
import { handleFirestoreError, OperationType } from './firebase/errorHandling';
import { UserPreferences } from '../types';
import { offlineStorage } from './offlineSyncService';

export const DEFAULT_PREFERENCES: UserPreferences = {
  userId: '',
  theme: 'dark',
  aestheticTheme: 'default',
  backgroundPattern: 'subtle-grid',
  typographyStyle: 'sans',
  accentColor: 'indigo',
  fontFamily: 'Inter, sans-serif',
  density: 'comfortable',
  pomodoroFocusMinutes: 25,
  pomodoroShortBreakMinutes: 5,
  pomodoroLongBreakMinutes: 15,
  pomodoroLongBreakInterval: 4,
  pomodoroAutoStartBreaks: true,
  pomodoroAutoStartPomodoros: false,
  audioVolume: 0.7,
  reviewReminderTime: '20:00',
  quietHoursStart: '22:00',
  quietHoursEnd: '07:00',
  enableSoundEffects: true,
  enableBrowserNotifications: true,
  weekStartDay: 1, // Monday
  visibleDashboardWidgets: [
    'score',
    'tasks',
    'pomodoro',
    'routines',
    'habits',
    'trends',
  ],
};

export class PreferencesService {
  private getPreferencesDoc(userId: string) {
    return doc(db, 'users', userId, 'settings', 'preferences');
  }

  async getPreferences(userId: string): Promise<UserPreferences> {
    const path = `users/${userId}/settings/preferences`;
    try {
      const snap = await getDoc(this.getPreferencesDoc(userId));
      if (snap.exists()) {
        const prefs = { ...DEFAULT_PREFERENCES, ...snap.data(), userId } as UserPreferences;
        await offlineStorage.setCache(`prefs_${userId}`, prefs);
        return prefs;
      } else {
        const defaultPrefs = { ...DEFAULT_PREFERENCES, userId };
        await this.savePreferences(userId, defaultPrefs);
        return defaultPrefs;
      }
    } catch (error) {
      console.warn('Network error loading preferences, using local cache:', error);
      const cached = await offlineStorage.getCache<UserPreferences>(`prefs_${userId}`);
      if (cached) return cached;
      return { ...DEFAULT_PREFERENCES, userId };
    }
  }

  async savePreferences(userId: string, prefs: Partial<UserPreferences>): Promise<UserPreferences> {
    const path = `users/${userId}/settings/preferences`;
    const merged = { ...DEFAULT_PREFERENCES, ...prefs, userId };

    try {
      await setDoc(this.getPreferencesDoc(userId), merged);
      await offlineStorage.setCache(`prefs_${userId}`, merged);
      return merged;
    } catch (error) {
      await offlineStorage.setCache(`prefs_${userId}`, merged);
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }
}

export const preferencesService = new PreferencesService();
