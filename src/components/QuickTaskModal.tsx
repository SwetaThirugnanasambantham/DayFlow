import React, { useState } from 'react';
import { X, Calendar, Clock, Tag, Flag, Plus, Trash2 } from 'lucide-react';
import { taskService } from '../services/taskService';
import { useAuth } from '../contexts/AuthContext';
import { TaskPriority } from '../types';

interface QuickTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTaskCreated?: () => void;
}

export const QuickTaskModal: React.FC<QuickTaskModalProps> = ({ isOpen, onClose, onTaskCreated }) => {
  const { user, isDemoUser } = useAuth();
  const effectiveUid = user?.uid || (isDemoUser ? 'demo_user_dayflow' : 'anonymous');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [category, setCategory] = useState('Work');
  const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('');
  const [estimatedDuration, setEstimatedDuration] = useState(30);
  const [subtasks, setSubtasks] = useState<string[]>([]);
  const [subtaskInput, setSubtaskInput] = useState('');
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleAddSubtask = () => {
    if (!subtaskInput.trim()) return;
    setSubtasks([...subtasks, subtaskInput.trim()]);
    setSubtaskInput('');
  };

  const handleRemoveSubtask = (idx: number) => {
    setSubtasks(subtasks.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || saving) return;

    setSaving(true);
    try {
      const created = await taskService.createTask(effectiveUid, {
        title: title.trim(),
        description: description.trim(),
        priority,
        category,
        dueDate,
        startDate: dueDate,
        startTime: startTime || undefined,
        estimatedDuration: Number(estimatedDuration) || 30,
        status: 'todo',
      });

      // Add subtasks
      for (let i = 0; i < subtasks.length; i++) {
        await taskService.addSubtask(effectiveUid, created.id, subtasks[i], null, i);
      }

      setTitle('');
      setDescription('');
      setSubtasks([]);
      onClose();
      if (onTaskCreated) onTaskCreated();
    } catch (err) {
      console.error('Failed to create task:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl text-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <h2 className="text-base font-semibold text-white">Create New Task</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Task Title *</label>
            <input
              type="text"
              required
              autoFocus
              placeholder="e.g. Complete DSA tree problems, prepare slides..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Description / Notes</label>
            <textarea
              rows={2}
              placeholder="Add key context, resources, or goals..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Row of metadata inputs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1 flex items-center gap-1">
                <Flag className="w-3 h-3 text-indigo-400" /> Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full px-2 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-hidden"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1 flex items-center gap-1">
                <Tag className="w-3 h-3 text-cyan-400" /> Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-2 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-hidden"
              >
                <option value="Work">Work</option>
                <option value="Study">Study</option>
                <option value="Health">Health</option>
                <option value="Personal">Personal</option>
                <option value="Project">Project</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-emerald-400" /> Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-2 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1 flex items-center gap-1">
                <Clock className="w-3 h-3 text-amber-400" /> Est. Mins
              </label>
              <input
                type="number"
                min={5}
                step={5}
                value={estimatedDuration}
                onChange={(e) => setEstimatedDuration(Number(e.target.value))}
                className="w-full px-2 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Subtasks breakdown */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Break into Subtasks (Optional)</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                placeholder="Add subtask step (e.g. Arrays, Strings)..."
                value={subtaskInput}
                onChange={(e) => setSubtaskInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSubtask();
                  }
                }}
                className="flex-1 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-hidden"
              />
              <button
                type="button"
                onClick={handleAddSubtask}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs font-medium text-slate-200 flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            </div>

            {subtasks.length > 0 && (
              <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                {subtasks.map((st, i) => (
                  <div key={i} className="flex items-center justify-between px-2.5 py-1.5 bg-slate-800/60 rounded-md text-xs text-slate-300">
                    <span>{i + 1}. {st}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSubtask(i)}
                      className="text-slate-500 hover:text-rose-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !title.trim()}
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-lg shadow-sm shadow-indigo-600/30 transition cursor-pointer"
            >
              {saving ? 'Creating...' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
