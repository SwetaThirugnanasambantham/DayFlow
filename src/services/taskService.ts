import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  writeBatch,
} from 'firebase/firestore';
import { db } from './firebase/firebase';
import { handleFirestoreError, OperationType } from './firebase/errorHandling';
import { Task, Subtask, TaskNote, TaskStatus, TaskPriority } from '../types';
import { offlineStorage } from './offlineSyncService';

export class TaskService {
  private getTasksCollection(userId: string) {
    return collection(db, 'users', userId, 'tasks');
  }

  private getTaskDoc(userId: string, taskId: string) {
    return doc(db, 'users', userId, 'tasks', taskId);
  }

  private getSubtasksCollection(userId: string, taskId: string) {
    return collection(db, 'users', userId, 'tasks', taskId, 'subtasks');
  }

  private getNotesCollection(userId: string, taskId: string) {
    return collection(db, 'users', userId, 'tasks', taskId, 'notes');
  }

  async getTasks(userId: string): Promise<Task[]> {
    const path = `users/${userId}/tasks`;
    try {
      const q = query(this.getTasksCollection(userId), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const tasks: Task[] = [];

      for (const docSnap of snapshot.docs) {
        const taskData = docSnap.data() as Task;
        // Fetch subtasks and notes for this task
        const subtasksSnap = await getDocs(this.getSubtasksCollection(userId, docSnap.id));
        const notesSnap = await getDocs(this.getNotesCollection(userId, docSnap.id));

        const subtasks: Subtask[] = subtasksSnap.docs.map((d) => d.data() as Subtask);
        const notes: TaskNote[] = notesSnap.docs.map((d) => d.data() as TaskNote);

        tasks.push({
          ...taskData,
          id: docSnap.id,
          subtasks,
          notes,
        });
      }

      // Update offline cache
      await offlineStorage.setCache(`tasks_${userId}`, tasks);
      return tasks;
    } catch (error) {
      console.warn('Network task fetch failed, loading from offline cache:', error);
      const cached = await offlineStorage.getCache<Task[]>(`tasks_${userId}`);
      if (cached) return cached;
      handleFirestoreError(error, OperationType.LIST, path);
    }
  }

  async createTask(userId: string, taskInput: Partial<Task>): Promise<Task> {
    const taskId = taskInput.id || `task_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const path = `users/${userId}/tasks/${taskId}`;
    const now = new Date().toISOString();

    const newTask: Task = {
      id: taskId,
      userId,
      title: taskInput.title || 'Untitled Task',
      description: taskInput.description || '',
      status: taskInput.status || 'todo',
      priority: taskInput.priority || 'medium',
      category: taskInput.category || 'General',
      tags: taskInput.tags || [],
      startDate: taskInput.startDate || now.split('T')[0],
      dueDate: taskInput.dueDate || now.split('T')[0],
      startTime: taskInput.startTime || '',
      endTime: taskInput.endTime || '',
      estimatedDuration: taskInput.estimatedDuration || 30,
      actualDuration: taskInput.actualDuration || 0,
      createdAt: now,
      updatedAt: now,
      subtasks: taskInput.subtasks || [],
      notes: taskInput.notes || [],
      recurrence: taskInput.recurrence || 'none',
    };

    try {
      const docRef = this.getTaskDoc(userId, taskId);
      // Clean undefined for firestore
      const { subtasks, notes, ...firestoreData } = newTask;
      await setDoc(docRef, firestoreData);

      // Create initial subtasks if provided
      if (subtasks && subtasks.length > 0) {
        for (const sub of subtasks) {
          const subRef = doc(this.getSubtasksCollection(userId, taskId), sub.id);
          await setDoc(subRef, sub);
        }
      }

      // Create initial notes if provided
      if (notes && notes.length > 0) {
        for (const note of notes) {
          const noteRef = doc(this.getNotesCollection(userId, taskId), note.id);
          await setDoc(noteRef, note);
        }
      }

      return newTask;
    } catch (error) {
      await offlineStorage.queueOperation({
        action: 'create',
        collection: 'tasks',
        docId: taskId,
        data: newTask,
      });
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }

  async updateTask(userId: string, taskId: string, updates: Partial<Task>): Promise<void> {
    const path = `users/${userId}/tasks/${taskId}`;
    const now = new Date().toISOString();

    try {
      const docRef = this.getTaskDoc(userId, taskId);
      const cleanUpdates: any = {
        ...updates,
        updatedAt: now,
      };

      if (updates.status === 'completed' && !updates.completedAt) {
        cleanUpdates.completedAt = now;
      } else if (updates.status && updates.status !== 'completed') {
        cleanUpdates.completedAt = null;
      }

      // Strip nested subtasks/notes arrays before writing to parent doc
      delete cleanUpdates.subtasks;
      delete cleanUpdates.notes;

      await updateDoc(docRef, cleanUpdates);
    } catch (error) {
      await offlineStorage.queueOperation({
        action: 'update',
        collection: 'tasks',
        docId: taskId,
        data: updates,
      });
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  }

  async deleteTask(userId: string, taskId: string): Promise<void> {
    const path = `users/${userId}/tasks/${taskId}`;
    try {
      const docRef = this.getTaskDoc(userId, taskId);
      await deleteDoc(docRef);
    } catch (error) {
      await offlineStorage.queueOperation({
        action: 'delete',
        collection: 'tasks',
        docId: taskId,
      });
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  }

  // --- Subtask Management ---
  async addSubtask(
    userId: string,
    taskId: string,
    title: string,
    parentSubtaskId: string | null = null,
    order: number = 0
  ): Promise<Subtask> {
    const subtaskId = `sub_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const path = `users/${userId}/tasks/${taskId}/subtasks/${subtaskId}`;
    const newSubtask: Subtask = {
      id: subtaskId,
      taskId,
      userId,
      parentSubtaskId: parentSubtaskId || null,
      title,
      completed: false,
      order,
      createdAt: new Date().toISOString(),
    };

    try {
      const subRef = doc(this.getSubtasksCollection(userId, taskId), subtaskId);
      await setDoc(subRef, newSubtask);
      return newSubtask;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }

  async toggleSubtask(userId: string, taskId: string, subtaskId: string, completed: boolean): Promise<void> {
    const path = `users/${userId}/tasks/${taskId}/subtasks/${subtaskId}`;
    try {
      const subRef = doc(this.getSubtasksCollection(userId, taskId), subtaskId);
      await updateDoc(subRef, { completed });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  }

  async deleteSubtask(userId: string, taskId: string, subtaskId: string): Promise<void> {
    const path = `users/${userId}/tasks/${taskId}/subtasks/${subtaskId}`;
    try {
      const subRef = doc(this.getSubtasksCollection(userId, taskId), subtaskId);
      await deleteDoc(subRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  }

  // --- Task Notes Management ---
  async addNote(userId: string, taskId: string, content: string): Promise<TaskNote> {
    const noteId = `note_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const path = `users/${userId}/tasks/${taskId}/notes/${noteId}`;
    const now = new Date().toISOString();
    const newNote: TaskNote = {
      id: noteId,
      taskId,
      userId,
      content,
      createdAt: now,
      updatedAt: now,
    };

    try {
      const noteRef = doc(this.getNotesCollection(userId, taskId), noteId);
      await setDoc(noteRef, newNote);
      return newNote;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }

  async updateNote(userId: string, taskId: string, noteId: string, content: string): Promise<void> {
    const path = `users/${userId}/tasks/${taskId}/notes/${noteId}`;
    try {
      const noteRef = doc(this.getNotesCollection(userId, taskId), noteId);
      await updateDoc(noteRef, {
        content,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  }

  async deleteNote(userId: string, taskId: string, noteId: string): Promise<void> {
    const path = `users/${userId}/tasks/${taskId}/notes/${noteId}`;
    try {
      const noteRef = doc(this.getNotesCollection(userId, taskId), noteId);
      await deleteDoc(noteRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  }

  // --- End of Day Review Rescheduling Logic ---
  async handleReviewAction(
    userId: string,
    task: Task,
    action: 'continue_tomorrow' | 'reschedule_date' | 'move_backlog' | 'archive' | 'complete',
    targetDate?: string
  ): Promise<void> {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    const updates: Partial<Task> = {
      reviewedAt: now.toISOString(),
      rescheduledCount: (task.rescheduledCount || 0) + 1,
    };

    if (action === 'continue_tomorrow') {
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];
      updates.startDate = tomorrowStr;
      updates.dueDate = tomorrowStr;
      updates.status = 'todo';
    } else if (action === 'reschedule_date' && targetDate) {
      updates.startDate = targetDate;
      updates.dueDate = targetDate;
      updates.status = 'todo';
    } else if (action === 'move_backlog') {
      updates.status = 'backlog';
    } else if (action === 'archive') {
      updates.status = 'archived';
    } else if (action === 'complete') {
      updates.status = 'completed';
      updates.completedAt = now.toISOString();
    }

    await this.updateTask(userId, task.id, updates);
  }

  // Duplicate task
  async duplicateTask(userId: string, task: Task): Promise<Task> {
    const copyTitle = `${task.title} (Copy)`;
    const newTask = await this.createTask(userId, {
      ...task,
      id: undefined,
      title: copyTitle,
      status: 'todo',
      completedAt: undefined,
    });

    // Copy subtasks if any
    if (task.subtasks) {
      for (const sub of task.subtasks) {
        await this.addSubtask(userId, newTask.id, sub.title, null, sub.order);
      }
    }

    // Copy notes if any
    if (task.notes) {
      for (const note of task.notes) {
        await this.addNote(userId, newTask.id, note.content);
      }
    }

    return newTask;
  }
}

export const taskService = new TaskService();
