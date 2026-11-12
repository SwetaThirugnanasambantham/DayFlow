import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
} from 'firebase/firestore';
import { db } from './firebase/firebase';
import { handleFirestoreError, OperationType } from './firebase/errorHandling';
import { Habit, HabitLog } from '../types';
import { offlineStorage } from './offlineSyncService';

export class HabitService {
  private getHabitsCollection(userId: string) {
    return collection(db, 'users', userId, 'habits');
  }

  private getHabitLogsCollection(userId: string) {
    return collection(db, 'users', userId, 'habitLogs');
  }

  async getHabits(userId: string): Promise<Habit[]> {
    const path = `users/${userId}/habits`;
    try {
      const q = query(this.getHabitsCollection(userId), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const habits = snapshot.docs.map((d) => ({ ...d.data(), id: d.id } as Habit));
      await offlineStorage.setCache(`habits_${userId}`, habits);
      return habits;
    } catch (error) {
      console.warn('Network habit fetch failed, checking offline cache:', error);
      const cached = await offlineStorage.getCache<Habit[]>(`habits_${userId}`);
      if (cached) return cached;
      handleFirestoreError(error, OperationType.LIST, path);
    }
  }

  async createHabit(userId: string, input: Partial<Habit>): Promise<Habit> {
    const id = input.id || `habit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const path = `users/${userId}/habits/${id}`;
    const newHabit: Habit = {
      id,
      userId,
      title: input.title || 'New Habit',
      description: input.description || '',
      frequency: input.frequency || 'daily',
      targetDaysPerWeek: input.targetDaysPerWeek || 7,
      targetValue: input.targetValue || 1,
      unit: input.unit || 'times',
      color: input.color || '#4f46e5',
      currentStreak: 0,
      longestStreak: 0,
      archived: false,
      createdAt: new Date().toISOString(),
    };

    try {
      const docRef = doc(this.getHabitsCollection(userId), id);
      await setDoc(docRef, newHabit);
      return newHabit;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }

  async updateHabit(userId: string, habitId: string, updates: Partial<Habit>): Promise<void> {
    const path = `users/${userId}/habits/${habitId}`;
    try {
      const docRef = doc(this.getHabitsCollection(userId), habitId);
      await updateDoc(docRef, updates);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  }

  async deleteHabit(userId: string, habitId: string): Promise<void> {
    const path = `users/${userId}/habits/${habitId}`;
    try {
      const docRef = doc(this.getHabitsCollection(userId), habitId);
      await deleteDoc(docRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  }

  async getLogsForHabit(userId: string, habitId: string): Promise<HabitLog[]> {
    const path = `users/${userId}/habitLogs`;
    try {
      const q = query(
        this.getHabitLogsCollection(userId),
        where('habitId', '==', habitId),
        orderBy('date', 'desc')
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ ...d.data(), id: d.id } as HabitLog));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  }

  async getAllLogs(userId: string): Promise<HabitLog[]> {
    const path = `users/${userId}/habitLogs`;
    try {
      const snap = await getDocs(this.getHabitLogsCollection(userId));
      return snap.docs.map((d) => ({ ...d.data(), id: d.id } as HabitLog));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  }

  // Toggle or record habit log for a given date and recalculate streaks
  async logHabit(
    userId: string,
    habitId: string,
    dateStr: string,
    completed: boolean,
    value: number = 1
  ): Promise<void> {
    const logId = `log_${habitId}_${dateStr}`;
    const path = `users/${userId}/habitLogs/${logId}`;
    const now = new Date().toISOString();

    try {
      const logRef = doc(this.getHabitLogsCollection(userId), logId);
      const logData: HabitLog = {
        id: logId,
        habitId,
        userId,
        date: dateStr,
        value,
        completed,
        completedAt: now,
      };

      await setDoc(logRef, logData);

      // Recalculate streak
      await this.recalculateStreaks(userId, habitId);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }

  private async recalculateStreaks(userId: string, habitId: string): Promise<void> {
    const logs = await this.getLogsForHabit(userId, habitId);
    const completedDates = new Set(logs.filter((l) => l.completed).map((l) => l.date));

    // Calculate current streak
    let currentStreak = 0;
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    // Check if completed today
    let checkDate = new Date(today);
    if (!completedDates.has(todayStr)) {
      // If not completed today, check if completed yesterday to keep streak active
      checkDate.setDate(checkDate.getDate() - 1);
    }

    while (true) {
      const dateKey = checkDate.toISOString().split('T')[0];
      if (completedDates.has(dateKey)) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    // Calculate longest streak across history
    const sortedDates = Array.from(completedDates).sort();
    let longestStreak = 0;
    let tempStreak = 0;
    let lastDate: Date | null = null;

    for (const dStr of sortedDates) {
      const curDate = new Date(dStr + 'T00:00:00');
      if (lastDate) {
        const diffDays = Math.round((curDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
          tempStreak++;
        } else if (diffDays > 1) {
          tempStreak = 1;
        }
      } else {
        tempStreak = 1;
      }
      if (tempStreak > longestStreak) longestStreak = tempStreak;
      lastDate = curDate;
    }

    if (currentStreak > longestStreak) {
      longestStreak = currentStreak;
    }

    // Update habit document
    await this.updateHabit(userId, habitId, {
      currentStreak,
      longestStreak,
    });
  }
}

export const habitService = new HabitService();
