import React, { useState, useEffect } from 'react';
import { Task, Subtask } from '../types';
import { X, Plus, Trash2, Zap, Star, Clock } from 'lucide-react';

interface EditModalProps {
  isOpen: boolean;
  task: Task | null;
  type: string | null;
  onClose: () => void;
  onSave: (task: Task) => void;
}

export const EditModal: React.FC<EditModalProps> = ({ isOpen, task, type, onClose, onSave }) => {
  const [editedTask, setEditedTask] = useState<Task | null>(null);

  useEffect(() => {
    if (task) {
      // Default importance/urgency if missing
      const t = JSON.parse(JSON.stringify(task));
      if (t.importance === undefined) t.importance = false;
      if (t.urgency === undefined) t.urgency = false;
      setEditedTask(t);
    }
  }, [task]);

  if (!isOpen || !editedTask) return null;

  const handleChange = (field: keyof Task, value: any) => {
    setEditedTask(prev => prev ? { ...prev, [field]: value } : null);
  };

  const handleSubtaskChange = (index: number, field: keyof Subtask, value: any) => {
    if (!editedTask) return;
    const newSubtasks = [...editedTask.subtasks];
    newSubtasks[index] = { ...newSubtasks[index], [field]: value };
    setEditedTask({ ...editedTask, subtasks: newSubtasks });
  };

  const addSubtask = () => {
    if (!editedTask) return;
    setEditedTask({ 
      ...editedTask, 
      subtasks: [...editedTask.subtasks, { text: '', done: false }] 
    });
  };

  const removeSubtask = (index: number) => {
    if (!editedTask) return;
    const newSubtasks = editedTask.subtasks.filter((_, i) => i !== index);
    setEditedTask({ ...editedTask, subtasks: newSubtasks });
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/90 backdrop-blur-md animate-in fade-in zoom-in-95 duration-200">
      <div className="relative flex max-h-[90vh] w-[650px] flex-col overflow-hidden rounded-[20px] border-2 border-[#333] bg-[#0a0a0a] shadow-[0_0_80px_rgba(0,0,0,1)]">
        
        {/* Decorative CRT Lines */}
        <div className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(transparent,transparent_2px,rgba(0,0,0,0.2)_2px,rgba(0,0,0,0.2)_4px)] z-0 opacity-20" />

        {/* Header */}
        <div className="relative z-10 flex items-center justify-between border-b border-[#333] bg-[#111] px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="h-3 w-3 animate-pulse rounded-full bg-zzz-green shadow-[0_0_10px_#ccff00]" />
            <span className="font-mono text-lg font-black tracking-widest text-white italic">
              {editedTask.id ? 'EDIT_PROTOCOL' : 'INIT_NEW_TASK'}
            </span>
          </div>
          <div className="font-mono text-xs text-[#555]">[SYS.VER.2.4]</div>
        </div>

        {/* Body */}
        <div className="relative z-10 flex-1 overflow-y-auto p-8 custom-scrollbar">
          
          <div className="grid grid-cols-1 gap-6">
            {/* Title & Desc */}
            <div className="space-y-4">
              <div className="group">
                <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-zzz-dim transition-colors group-focus-within:text-zzz-green">Title / 标题</label>
                <input 
                  value={editedTask.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  className="w-full border-b-2 border-[#333] bg-transparent px-2 py-2 font-black text-xl text-white placeholder-[#333] transition-colors focus:border-zzz-green focus:outline-none"
                  placeholder="ENTER_TITLE..."
                />
              </div>

              <div className="group">
                <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-zzz-dim transition-colors group-focus-within:text-zzz-green">Description / 描述</label>
                <textarea 
                  value={editedTask.desc}
                  onChange={(e) => handleChange('desc', e.target.value)}
                  className="w-full resize-none rounded bg-[#111] p-3 text-sm text-[#ccc] placeholder-[#444] border border-transparent focus:border-zzz-green focus:outline-none focus:bg-[#000]"
                  placeholder="Enter detailed description..."
                  rows={3}
                />
              </div>
            </div>

            {/* Quadrant Matrix Selector (Only for Challenge) */}
            {type === 'challenge' && (
              <div className="rounded-xl border border-[#333] bg-[#0f0f0f] p-4">
                <label className="mb-3 block text-center text-[10px] font-bold uppercase tracking-wider text-zzz-blue">
                  — Priority Matrix / 优先级评估 —
                </label>
                <div className="flex gap-4">
                  {/* Importance Toggle */}
                  <div 
                    onClick={() => handleChange('importance', !editedTask.importance)}
                    className={`flex-1 cursor-pointer rounded-lg border p-3 transition-all ${
                      editedTask.importance 
                        ? 'border-zzz-orange bg-zzz-orange/10 shadow-[inset_0_0_20px_rgba(255,85,0,0.2)]' 
                        : 'border-[#333] bg-[#080808] hover:border-[#555]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs font-bold ${editedTask.importance ? 'text-zzz-orange' : 'text-[#666]'}`}>重要性</span>
                      <Star size={16} className={editedTask.importance ? 'fill-zzz-orange text-zzz-orange' : 'text-[#333]'} />
                    </div>
                    <div className={`text-xl font-black italic ${editedTask.importance ? 'text-white' : 'text-[#444]'}`}>
                      {editedTask.importance ? 'IMPORTANT' : 'NORMAL'}
                    </div>
                  </div>

                  {/* Urgency Toggle */}
                  <div 
                    onClick={() => handleChange('urgency', !editedTask.urgency)}
                    className={`flex-1 cursor-pointer rounded-lg border p-3 transition-all ${
                      editedTask.urgency 
                        ? 'border-zzz-green bg-zzz-green/10 shadow-[inset_0_0_20px_rgba(204,255,0,0.2)]' 
                        : 'border-[#333] bg-[#080808] hover:border-[#555]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs font-bold ${editedTask.urgency ? 'text-zzz-green' : 'text-[#666]'}`}>紧急性</span>
                      <Zap size={16} className={editedTask.urgency ? 'fill-zzz-green text-zzz-green' : 'text-[#333]'} />
                    </div>
                    <div className={`text-xl font-black italic ${editedTask.urgency ? 'text-white' : 'text-[#444]'}`}>
                      {editedTask.urgency ? 'URGENT' : 'CASUAL'}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Parameters Grid */}
            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-[#666]">Reward</label>
                  <div className="flex items-center rounded bg-[#111] px-3 py-2 border border-[#333]">
                    <span className="mr-2 text-zzz-orange">🔥</span>
                    <input 
                      type="number"
                      value={editedTask.reward}
                      onChange={(e) => handleChange('reward', parseInt(e.target.value) || 0)}
                      className="w-full bg-transparent font-bold text-white focus:outline-none"
                    />
                  </div>
               </div>

               {type === 'daily' && (
                 <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-[#666]">Time Block</label>
                    <select 
                      value={editedTask.block || 'morning'}
                      onChange={(e) => handleChange('block', e.target.value)}
                      className="w-full rounded bg-[#111] px-3 py-2 text-sm font-bold text-white border border-[#333] focus:border-zzz-blue outline-none appearance-none"
                    >
                      <option value="morning">Morning / 上午</option>
                      <option value="afternoon">Afternoon / 下午</option>
                      <option value="evening">Evening / 晚上</option>
                    </select>
                 </div>
               )}

               {type === 'challenge' && (
                 <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-[#666]">Deadline</label>
                    <div className="relative">
                      <input 
                        type="datetime-local"
                        value={editedTask.time || ''}
                        onChange={(e) => handleChange('time', e.target.value)}
                        className="w-full rounded bg-[#111] px-3 py-2 text-xs font-bold text-white border border-[#333] focus:border-zzz-blue outline-none"
                      />
                      <Clock className="absolute right-2 top-1/2 -translate-y-1/2 text-[#444] pointer-events-none" size={14} />
                    </div>
                 </div>
               )}
            </div>

            {/* Subtasks */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase text-[#666]">Checklist ({editedTask.subtasks.length})</label>
              <div className="space-y-2">
                {editedTask.subtasks.map((st, idx) => (
                  <div key={idx} className="group flex items-center gap-3 rounded border border-[#222] bg-[#050505] p-2 transition-colors hover:border-[#444]">
                    <input 
                      type="checkbox"
                      checked={st.done}
                      onChange={(e) => handleSubtaskChange(idx, 'done', e.target.checked)}
                      className="h-4 w-4 rounded border-[#444] bg-[#111] accent-zzz-green"
                    />
                    <input 
                      value={st.text}
                      onChange={(e) => handleSubtaskChange(idx, 'text', e.target.value)}
                      className="flex-1 bg-transparent text-sm text-[#ccc] placeholder-[#444] focus:outline-none"
                      placeholder="Subtask item..."
                    />
                    <button 
                      onClick={() => removeSubtask(idx)}
                      className="opacity-0 transition-opacity group-hover:opacity-100 text-[#444] hover:text-red-500"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
                <button 
                  onClick={addSubtask}
                  className="flex w-full items-center justify-center gap-2 rounded border border-dashed border-[#333] bg-transparent py-2 text-xs font-bold text-[#666] transition-all hover:border-zzz-green hover:text-zzz-green"
                >
                  <Plus size={12} /> ADD CHECK_ITEM
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 flex justify-end gap-4 border-t border-[#333] bg-[#111] px-6 py-4">
          <button 
            onClick={onClose}
            className="rounded-lg border border-[#444] px-6 py-2 text-xs font-bold text-[#888] transition-colors hover:border-white hover:text-white"
          >
            CANCEL
          </button>
          <button 
            onClick={() => onSave(editedTask)}
            className="flex items-center gap-2 rounded-lg bg-zzz-green px-8 py-2 text-sm font-black italic text-black shadow-[0_0_20px_rgba(204,255,0,0.3)] transition-transform hover:scale-105 hover:shadow-[0_0_30px_rgba(204,255,0,0.5)] active:scale-95"
          >
            CONFIRM <span className="font-sans not-italic">→</span>
          </button>
        </div>

      </div>
    </div>
  );
};