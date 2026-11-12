import {
  collection,
  doc,
  getDocs,
  setDoc,
  query,
  where,
  orderBy,
} from 'firebase/firestore';
import { db } from './firebase/firebase';
import { handleFirestoreError, OperationType } from './firebase/errorHandling';
import { FocusSession, FocusSessionType } from '../types';

export class PomodoroService {
  private getSessionsCollection(userId: string) {
    return collection(db, 'users', userId, 'focusSessions');
  }

  async recordSession(
    userId: string,
    session: {
      taskId?: string;
      taskTitle?: string;
      sessionType: FocusSessionType;
      durationMinutes: number;
      startedAt: string;
    }
  ): Promise<FocusSession> {
    const id = `focus_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const path = `users/${userId}/focusSessions/${id}`;
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];

    const newSession: FocusSession = {
      id,
      userId,
      taskId: session.taskId,
      taskTitle: session.taskTitle,
      sessionType: session.sessionType,
      durationMinutes: session.durationMinutes,
      completed: true,
      date: dateStr,
      startedAt: session.startedAt,
      completedAt: now.toISOString(),
    };

    try {
      const docRef = doc(this.getSessionsCollection(userId), id);
      await setDoc(docRef, newSession);
      return newSession;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }

  async getRecentSessions(userId: string, limitDays: number = 7): Promise<FocusSession[]> {
    const path = `users/${userId}/focusSessions`;
    try {
      const q = query(this.getSessionsCollection(userId), orderBy('completedAt', 'desc'));
      const snap = await getDocs(q);
      const all = snap.docs.map((d) => ({ ...d.data(), id: d.id } as FocusSession));

      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - limitDays);
      const cutoffStr = cutoff.toISOString().split('T')[0];

      return all.filter((s) => s.date >= cutoffStr);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  }

  async getTodayFocusMinutes(userId: string): Promise<number> {
    const todayStr = new Date().toISOString().split('T')[0];
    const path = `users/${userId}/focusSessions`;
    try {
      const q = query(this.getSessionsCollection(userId), where('date', '==', todayStr));
      const snap = await getDocs(q);
      const todaySessions = snap.docs
        .map((d) => d.data() as FocusSession)
        .filter((s) => s.sessionType === 'focus' && s.completed);

      return todaySessions.reduce((acc, s) => acc + (s.durationMinutes || 0), 0);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  }
}

export const pomodoroService = new PomodoroService();
