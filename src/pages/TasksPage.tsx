import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Circle,
  Clock,
  Calendar,
  Flag,
  Tag,
  Trash2,
  Copy,
  ChevronRight,
  ChevronDown,
  LayoutList,
  Columns,
  Sparkles,
  FileText,
  Save,
  X,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { taskService } from '../services/taskService';
import { Task, Subtask, TaskNote, TaskStatus, TaskPriority } from '../types';
import confetti from 'canvas-confetti';

export const TasksPage: React.FC = () => {
  const { user, isDemoUser } = useAuth();
  const effectiveUid = user?.uid || (isDemoUser ? 'demo_user_dayflow' : 'anonymous');

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // Filters & search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'dueDate' | 'priority' | 'createdAt'>('dueDate');

  // Subtask creation within selected task
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [newSubtaskParentId, setNewSubtaskParentId] = useState<string>('');

  // Note creation within selected task
  const [noteContent, setNoteContent] = useState('');
  const [noteSaving, setNoteSaving] = useState(false);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const data = await taskService.getTasks(effectiveUid);
      setTasks(data || []);
      // If a task was selected, refresh its reference
      if (selectedTask) {
        const updatedSelected = data?.find((t) => t.id === selectedTask.id);
        if (updatedSelected) setSelectedTask(updatedSelected);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, [effectiveUid]);

  const handleToggleTaskStatus = async (task: Task) => {
    const nextStatus: TaskStatus = task.status === 'completed' ? 'todo' : 'completed';
    if (nextStatus === 'completed') {
      confetti({ particleCount: 35, spread: 60, origin: { y: 0.8 } });
    }
    await taskService.updateTask(effectiveUid, task.id, { status: nextStatus });
    await loadTasks();
  };

  const handleDeleteTask = async (taskId: string) => {
    if (confirm('Are you sure you want to delete this task?')) {
      await taskService.deleteTask(effectiveUid, taskId);
      if (selectedTask?.id === taskId) setSelectedTask(null);
      await loadTasks();
    }
  };

  const handleDuplicateTask = async (task: Task) => {
    await taskService.duplicateTask(effectiveUid, task);
    await loadTasks();
  };

  const handleAddSubtask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask || !newSubtaskTitle.trim()) return;

    await taskService.addSubtask(
      effectiveUid,
      selectedTask.id,
      newSubtaskTitle.trim(),
      newSubtaskParentId || null,
      (selectedTask.subtasks?.length || 0) + 1
    );

    setNewSubtaskTitle('');
    setNewSubtaskParentId('');
    await loadTasks();
  };

  const handleToggleSubtask = async (sub: Subtask) => {
    if (!selectedTask) return;
    await taskService.toggleSubtask(effectiveUid, selectedTask.id, sub.id, !sub.completed);
    await loadTasks();
  };

  const handleDeleteSubtask = async (subId: string) => {
    if (!selectedTask) return;
    await taskService.deleteSubtask(effectiveUid, selectedTask.id, subId);
    await loadTasks();
  };

  const handleSaveNote = async () => {
    if (!selectedTask || !noteContent.trim() || noteSaving) return;
    setNoteSaving(true);
    try {
      await taskService.addNote(effectiveUid, selectedTask.id, noteContent.trim());
      setNoteContent('');
      await loadTasks();
    } finally {
      setNoteSaving(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!selectedTask) return;
    await taskService.deleteNote(effectiveUid, selectedTask.id, noteId);
    await loadTasks();
  };

  // Filter and sort tasks
  const filteredTasks = tasks.filter((t) => {
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;
    if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;
    if (categoryFilter !== 'all' && t.category !== categoryFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        t.title.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (sortBy === 'dueDate') {
      return (a.dueDate || '9999') > (b.dueDate || '9999') ? 1 : -1;
    }
    if (sortBy === 'priority') {
      const pMap = { urgent: 4, high: 3, medium: 2, low: 1 };
      return (pMap[b.priority] || 0) - (pMap[a.priority] || 0);
    }
    return (b.createdAt || '') > (a.createdAt || '') ? 1 : -1;
  });

  const categories = Array.from(new Set(tasks.map((t) => t.category).filter(Boolean)));

  const kanbanColumns: { status: TaskStatus; label: string }[] = [
    { status: 'backlog', label: 'Backlog' },
    { status: 'todo', label: 'To Do' },
    { status: 'in_progress', label: 'In Progress' },
    { status: 'completed', label: 'Completed' },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Header controls bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-2xl">
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Filter tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-hidden"
            />
          </div>

          <div className="flex items-center gap-1.5 bg-slate-800 p-1 rounded-lg border border-slate-700">
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded text-xs transition cursor-pointer ${
                viewMode === 'list' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
              title="List View"
            >
              <LayoutList className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-1.5 rounded text-xs transition cursor-pointer ${
                viewMode === 'kanban' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
              title="Kanban Board View"
            >
              <Columns className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-hidden"
          >
            <option value="all">All Statuses</option>
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="backlog">Backlog</option>
            <option value="archived">Archived</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-hidden"
          >
            <option value="all">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          {categories.length > 0 && (
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-hidden"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          )}

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-hidden"
          >
            <option value="dueDate">Sort by Due Date</option>
            <option value="priority">Sort by Priority</option>
            <option value="createdAt">Sort by Creation</option>
          </select>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Task List or Kanban Board */}
        <div className={selectedTask ? 'lg:col-span-2' : 'lg:col-span-3'}>
          {loading ? (
            <div className="p-12 text-center text-slate-500 text-xs">Loading tasks...</div>
          ) : viewMode === 'list' ? (
            /* LIST VIEW */
            <div className="space-y-2">
              {sortedTasks.length === 0 ? (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-400 text-xs">
                  No tasks matching your current filters.
                </div>
              ) : (
                sortedTasks.map((t) => {
                  const isDone = t.status === 'completed';
                  const isSelected = selectedTask?.id === t.id;
                  const subCount = t.subtasks?.length || 0;
                  const completedSub = t.subtasks?.filter((s) => s.completed).length || 0;
                  const percent = subCount > 0 ? Math.round((completedSub / subCount) * 100) : 0;

                  return (
                    <div
                      key={t.id}
                      onClick={() => setSelectedTask(t)}
                      className={`flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'border-indigo-500 bg-indigo-950/20'
                          : isDone
                          ? 'bg-slate-950/40 border-slate-800/60 opacity-60'
                          : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleTaskStatus(t);
                          }}
                          className="text-slate-400 hover:text-emerald-400 transition"
                        >
                          {isDone ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                          ) : (
                            <Circle className="w-5 h-5" />
                          )}
                        </button>

                        <div className="overflow-hidden">
                          <div
                            className={`text-xs font-semibold truncate ${
                              isDone ? 'line-through text-slate-500' : 'text-slate-100'
                            }`}
                          >
                            {t.title}
                          </div>
                          <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-slate-400">
                            <span className="capitalize">{t.category}</span>
                            {t.dueDate && (
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-slate-500" />
                                {t.dueDate}
                              </span>
                            )}
                            {subCount > 0 && (
                              <span className="text-cyan-400 font-medium">
                                {completedSub}/{subCount} subtasks ({percent}%)
                              </span>
                            )}
                            {t.notes && t.notes.length > 0 && (
                              <span className="flex items-center gap-0.5 text-slate-400">
                                <FileText className="w-3 h-3" />
                                {t.notes.length}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mt-2 sm:mt-0 justify-end">
                        <span
                          className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                            t.priority === 'urgent'
                              ? 'bg-rose-500/20 text-rose-300'
                              : t.priority === 'high'
                              ? 'bg-amber-500/20 text-amber-300'
                              : t.priority === 'medium'
                              ? 'bg-indigo-500/20 text-indigo-300'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {t.priority}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDuplicateTask(t);
                          }}
                          title="Duplicate task"
                          className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded transition"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteTask(t.id);
                          }}
                          title="Delete task"
                          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            /* KANBAN BOARD VIEW */
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {kanbanColumns.map((col) => {
                const columnTasks = sortedTasks.filter((t) => t.status === col.status);
                return (
                  <div key={col.status} className="bg-slate-900 border border-slate-800 rounded-2xl p-3 flex flex-col">
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-xs font-bold text-slate-200 uppercase tracking-wider">
                      <span>{col.label}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-400">
                        {columnTasks.length}
                      </span>
                    </div>
                    <div className="space-y-2 flex-1 overflow-y-auto max-h-[600px] pr-1">
                      {columnTasks.map((t) => (
                        <div
                          key={t.id}
                          onClick={() => setSelectedTask(t)}
                          className={`p-3 rounded-xl border bg-slate-800/60 hover:bg-slate-800 border-slate-700/60 cursor-pointer transition ${
                            selectedTask?.id === t.id ? 'border-indigo-500' : ''
                          }`}
                        >
                          <div className="text-xs font-medium text-slate-100 line-clamp-2">{t.title}</div>
                          <div className="flex items-center justify-between mt-2 text-[10px] text-slate-400">
                            <span>{t.category}</span>
                            <span
                              className={`font-semibold ${
                                t.priority === 'urgent'
                                  ? 'text-rose-400'
                                  : t.priority === 'high'
                                  ? 'text-amber-400'
                                  : 'text-indigo-400'
                              }`}
                            >
                              {t.priority}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Selected Task Inspector (Nested Subtasks & Notes) */}
        {selectedTask && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-5">
            {/* Header */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-800">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">
                  Task Details
                </span>
                <h3 className="text-base font-bold text-white mt-0.5">{selectedTask.title}</h3>
              </div>
              <button
                onClick={() => setSelectedTask(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Description */}
            {selectedTask.description && (
              <p className="text-xs text-slate-300 leading-relaxed bg-slate-800/40 p-3 rounded-xl border border-slate-800">
                {selectedTask.description}
              </p>
            )}

            {/* Subtasks Section with Hierarchical View */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  Nested Subtasks
                </h4>
                {selectedTask.subtasks && selectedTask.subtasks.length > 0 && (
                  <span className="text-[10px] text-cyan-400 font-semibold">
                    {Math.round(
                      (selectedTask.subtasks.filter((s) => s.completed).length /
                        selectedTask.subtasks.length) *
                        100
                    )}
                    % Done
                  </span>
                )}
              </div>

              {/* Add subtask form */}
              <form onSubmit={handleAddSubtask} className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add step (e.g. Arrays, Strings, Trees)..."
                    value={newSubtaskTitle}
                    onChange={(e) => setNewSubtaskTitle(e.target.value)}
                    className="flex-1 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-hidden"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-xs font-medium text-white rounded-lg transition"
                  >
                    Add
                  </button>
                </div>

                {/* Optional parent subtask selection for nesting */}
                {selectedTask.subtasks && selectedTask.subtasks.length > 0 && (
                  <select
                    value={newSubtaskParentId}
                    onChange={(e) => setNewSubtaskParentId(e.target.value)}
                    className="w-full px-2 py-1 bg-slate-800 border border-slate-700 rounded text-[11px] text-slate-300"
                  >
                    <option value="">Top level (no parent)</option>
                    {selectedTask.subtasks.map((s) => (
                      <option key={s.id} value={s.id}>
                        Child of: {s.title}
                      </option>
                    ))}
                  </select>
                )}
              </form>

              {/* Subtask items tree */}
              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                {selectedTask.subtasks?.map((sub) => {
                  const isChild = !!sub.parentSubtaskId;
                  return (
                    <div
                      key={sub.id}
                      className={`flex items-center justify-between p-2 rounded-lg border transition ${
                        isChild ? 'ml-5 bg-slate-950/40 border-slate-800/50' : 'bg-slate-800/50 border-slate-700/50'
                      }`}
                    >
                      <div className="flex items-center gap-2 overflow-hidden">
                        <input
                          type="checkbox"
                          checked={sub.completed}
                          onChange={() => handleToggleSubtask(sub)}
                          className="w-3.5 h-3.5 rounded text-indigo-600 focus:ring-0 cursor-pointer"
                        />
                        <span
                          className={`text-xs truncate ${
                            sub.completed ? 'line-through text-slate-500' : 'text-slate-200'
                          }`}
                        >
                          {sub.title}
                        </span>
                      </div>
                      <button
                        onClick={() => handleDeleteSubtask(sub.id)}
                        className="text-slate-500 hover:text-rose-400 p-1"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Task Notes Section */}
            <div className="space-y-3 pt-3 border-t border-slate-800">
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-indigo-400" />
                <span>Task Notes & Scratchpad</span>
              </h4>

              <div className="space-y-2">
                <textarea
                  rows={3}
                  placeholder="Capture quick thoughts, progress updates, or code snippets..."
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-hidden"
                />
                <button
                  onClick={handleSaveNote}
                  disabled={noteSaving || !noteContent.trim()}
                  className="w-full py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-200 rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{noteSaving ? 'Saving note...' : 'Add Note to Task'}</span>
                </button>
              </div>

              {/* Saved Notes list */}
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {selectedTask.notes?.map((n) => (
                  <div key={n.id} className="p-2.5 rounded-lg bg-slate-800/40 border border-slate-800 text-xs space-y-1">
                    <div className="flex items-center justify-between text-[10px] text-slate-500">
                      <span>{new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      <button onClick={() => handleDeleteNote(n.id)} className="hover:text-rose-400">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                    <p className="text-slate-300 whitespace-pre-wrap">{n.content}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
