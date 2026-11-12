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
import { Routine, RoutineOccurrence } from '../types';
import { offlineStorage } from './offlineSyncService';

export class RoutineService {
  private getRoutinesCollection(userId: string) {
    return collection(db, 'users', userId, 'routines');
  }

  private getOccurrencesCollection(userId: string) {
    return collection(db, 'users', userId, 'routineOccurrences');
  }

  async getRoutines(userId: string): Promise<Routine[]> {
    const path = `users/${userId}/routines`;
    try {
      const q = query(this.getRoutinesCollection(userId), orderBy('scheduledTime', 'asc'));
      const snapshot = await getDocs(q);
      const routines = snapshot.docs.map((d) => ({ ...d.data(), id: d.id } as Routine));
      await offlineStorage.setCache(`routines_${userId}`, routines);
      return routines;
    } catch (error) {
      console.warn('Network routine fetch failed, checking offline cache:', error);
      const cached = await offlineStorage.getCache<Routine[]>(`routines_${userId}`);
      if (cached) return cached;
      handleFirestoreError(error, OperationType.LIST, path);
    }
  }

  async createRoutine(userId: string, input: Partial<Routine>): Promise<Routine> {
    const id = input.id || `routine_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const path = `users/${userId}/routines/${id}`;
    const newRoutine: Routine = {
      id,
      userId,
      title: input.title || 'New Routine',
      description: input.description || '',
      scheduledTime: input.scheduledTime || '08:00',
      durationMinutes: input.durationMinutes || 30,
      frequency: input.frequency || 'daily',
      daysOfWeek: input.daysOfWeek || [0, 1, 2, 3, 4, 5, 6],
      active: input.active !== undefined ? input.active : true,
      createdAt: new Date().toISOString(),
    };

    try {
      const docRef = doc(this.getRoutinesCollection(userId), id);
      await setDoc(docRef, newRoutine);
      return newRoutine;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }

  async updateRoutine(userId: string, routineId: string, updates: Partial<Routine>): Promise<void> {
    const path = `users/${userId}/routines/${routineId}`;
    try {
      const docRef = doc(this.getRoutinesCollection(userId), routineId);
      await updateDoc(docRef, updates);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  }

  async deleteRoutine(userId: string, routineId: string): Promise<void> {
    const path = `users/${userId}/routines/${routineId}`;
    try {
      const docRef = doc(this.getRoutinesCollection(userId), routineId);
      await deleteDoc(docRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  }

  // Generate or fetch today's occurrences for active routines
  async getOccurrencesForDate(userId: string, dateStr: string): Promise<RoutineOccurrence[]> {
    const path = `users/${userId}/routineOccurrences`;
    try {
      const q = query(this.getOccurrencesCollection(userId), where('date', '==', dateStr));
      const snap = await getDocs(q);
      const existingOccurrences = snap.docs.map((d) => ({ ...d.data(), id: d.id } as RoutineOccurrence));

      const routines = await this.getRoutines(userId);
      const targetDate = new Date(dateStr + 'T00:00:00');
      const dayOfWeek = targetDate.getDay();

      const activeTodayRoutines = routines.filter((r) => {
        if (!r.active) return false;
        if (r.frequency === 'daily') return true;
        if (r.frequency === 'weekdays') return dayOfWeek >= 1 && dayOfWeek <= 5;
        if (r.frequency === 'weekends') return dayOfWeek === 0 || dayOfWeek === 6;
        if (r.frequency === 'custom' || r.frequency === 'weekly') {
          return r.daysOfWeek && r.daysOfWeek.includes(dayOfWeek);
        }
        return true;
      });

      // For any routine without an occurrence today, create an idempotent occurrence
      for (const r of activeTodayRoutines) {
        const found = existingOccurrences.find((o) => o.routineId === r.id);
        if (!found) {
          const occId = `occ_${r.id}_${dateStr}`;
          const newOcc: RoutineOccurrence = {
            id: occId,
            routineId: r.id,
            userId,
            date: dateStr,
            completed: false,
          };
          const occRef = doc(this.getOccurrencesCollection(userId), occId);
          await setDoc(occRef, newOcc);
          existingOccurrences.push(newOcc);
        }
      }

      return existingOccurrences;
    } catch (error) {
      console.warn('Network error in getOccurrencesForDate:', error);
      handleFirestoreError(error, OperationType.LIST, path);
    }
  }

  async toggleOccurrence(userId: string, occurrenceId: string, completed: boolean): Promise<void> {
    const path = `users/${userId}/routineOccurrences/${occurrenceId}`;
    try {
      const occRef = doc(this.getOccurrencesCollection(userId), occurrenceId);
      await updateDoc(occRef, {
        completed,
        completedAt: completed ? new Date().toISOString() : null,
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  }
}

export const routineService = new RoutineService();
