import { audioEngine } from './audioEngine';
import { NotificationItem } from '../types';

class NotificationService {
  private notifications: NotificationItem[] = [];

  async requestPermission(): Promise<NotificationPermission> {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        return await Notification.requestPermission();
      } catch (e) {
        console.warn('Notification permission request error:', e);
      }
    }
    return 'denied';
  }

  isQuietHours(quietStart?: string, quietEnd?: string): boolean {
    if (!quietStart || !quietEnd) return false;
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const [startH, startM] = quietStart.split(':').map(Number);
    const [endH, endM] = quietEnd.split(':').map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    if (startMinutes <= endMinutes) {
      return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
    } else {
      // Over midnight
      return currentMinutes >= startMinutes || currentMinutes <= endMinutes;
    }
  }

  notify(options: {
    title: string;
    message: string;
    type?: NotificationItem['type'];
    actionUrl?: string;
    sound?: boolean;
    quietHoursStart?: string;
    quietHoursEnd?: string;
  }) {
    const { title, message, type = 'system', actionUrl, sound = true, quietHoursStart, quietHoursEnd } = options;

    const inQuietHours = this.isQuietHours(quietHoursStart, quietHoursEnd);

    // Audio chime if permitted and not quiet hours
    if (sound && !inQuietHours) {
      audioEngine.playChime(type === 'pomodoro' ? 'pomodoro' : 'alert');
    }

    // Store in internal history
    const item: NotificationItem = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId: 'current',
      title,
      message,
      type,
      createdAt: new Date().toISOString(),
      read: false,
      actionUrl,
    };
    this.notifications.unshift(item);

    // Trigger browser notification if supported and permitted
    if (
      typeof window !== 'undefined' &&
      'Notification' in window &&
      Notification.permission === 'granted' &&
      !inQuietHours
    ) {
      try {
        new Notification(title, {
          body: message,
          icon: '/pwa-192x192.png',
          badge: '/icon.svg',
        });
      } catch (e) {
        console.warn('Native notification failed:', e);
      }
    }

    return item;
  }

  getNotifications(): NotificationItem[] {
    return [...this.notifications];
  }

  markAllAsRead(): void {
    this.notifications.forEach((n) => (n.read = true));
  }
}

export const notificationService = new NotificationService();
