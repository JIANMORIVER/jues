import React, { useState, useEffect } from 'react';
import { Task } from '../types';
import { Check, Play, Flame, Clock, AlertCircle, Trash2 } from 'lucide-react';

interface TaskCardProps {
  item: Task;
  type: 'daily' | 'target' | 'training' | 'challenge';
  variant?: 'default' | 'compact'; 
  onEdit: (item: Task) => void;
  onAction: (item: Task) => void;
  onDelete: (item: Task) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({ item, type, variant = 'default', onEdit, onAction, onDelete }) => {
  const isCompleted = item.completed;
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [isUrgent, setIsUrgent] = useState(false);

  const handleAction = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAction(item);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation(); // Critical: Stop click from triggering card edit
    onDelete(item);
  };

  // Countdown Logic
  useEffect(() => {
    if (type !== 'challenge' || !item.time || isCompleted) return;

    const updateTimer = () => {
      const now = new Date().getTime();
      const target = new Date(item.time!).getTime();
      const diff = target - now;

      if (diff <= 0) {
        setTimeLeft('EXPIRED');
        setIsUrgent(true);
      } else {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        
        if (days > 0) setTimeLeft(`${days}d ${hours}h`);
        else setTimeLeft(`${hours}h ${minutes}m`);
        
        setIsUrgent(days < 1); 
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 60000); 
    return () => clearInterval(interval);
  }, [item.time, type, isCompleted]);

  // Header Logic
  let topInfo = "";
  const typeLabels: Record<string, string> = {
    daily: '日常',
    target: '目标',
    training: '训练',
    challenge: '挑战'
  };

  if (type === 'challenge') {
     if (item.importance && item.urgency) topInfo = "DO FIRST";
     else if (item.importance && !item.urgency) topInfo = "SCHEDULE";
     else if (!item.importance && item.urgency) topInfo = "DELEGATE";
     else topInfo = "LATER";
  } else {
    topInfo = typeLabels[type];
  }

  // Compact styling overrides
  const isCompact = variant === 'compact';
  // Ultra-compact dimensions for mobile to absolutely prevent vertical shifting
  const cardWidthClass = isCompact ? 'min-w-[120px] w-[120px] min-h-[70px] md:min-w-[180px] md:w-[180px] md:min-h-[120px]' : 'min-h-[140px] md:min-h-[170px]';
  const titleSizeClass = isCompact ? 'text-[9px] md:text-xs mb-0.5 leading-tight' : 'text-base md:text-lg mb-1.5 leading-tight';
  const paddingClass = isCompact ? 'p-1.5 md:p-2' : 'p-3 md:p-4';

  return (
    <div
      onClick={() => onEdit(item)}
      className={`
        group relative flex cursor-pointer flex-col justify-between rounded-xl md:rounded-2xl border-[2px] md:border-[3px] border-black transition-all hover:-translate-y-1 overflow-hidden
        ${cardWidthClass} ${paddingClass}
        ${isCompleted 
            ? 'bg-[#1a1a1a] border-[#333] opacity-80' 
            : 'bg-zzz-card shadow-[3px_3px_0_rgba(0,0,0,0.5)] md:shadow-[5px_5px_0_rgba(0,0,0,0.5)] hover:border-[#666] hover:shadow-[5px_5px_0_rgba(0,0,0,0.5)]'
        }
      `}
    >
      {/* Delete Button - High Z-Index to ensure clickability */}
      <button 
        onClick={handleDelete}
        className="absolute top-0.5 right-0.5 md:top-1.5 md:right-1.5 z-50 text-[#666] hover:text-red-500 transition-colors p-1.5 rounded-full hover:bg-black/40"
        title="删除"
      >
        <Trash2 size={isCompact ? 10 : 16} />
      </button>

      {/* Completed Stamp */}
      {isCompleted && (
        <div className={`pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-12 rounded border-2 md:border-4 border-[#444] font-black text-[#444] z-10 whitespace-nowrap tracking-widest opacity-60 ${isCompact ? 'text-[8px] px-1 border' : 'text-2xl md:text-3xl px-4'}`}>
          COMPLETED
        </div>
      )}

      <div>
        {/* Header Line */}
        <div className="mb-0.5 md:mb-1 flex items-center justify-between text-xs font-bold pr-4">
            <div className="flex items-center gap-1">
                <div className={`rounded-full shadow-[0_0_5px] 
                    ${isCompact ? 'h-1 w-1 md:h-1.5 md:w-1.5' : 'h-2 w-2'}
                    ${isCompleted ? 'bg-gray-500' : 
                      type === 'daily' ? 'bg-zzz-yellow shadow-zzz-yellow' : 
                      type === 'target' ? 'bg-zzz-green shadow-zzz-green' :
                      type === 'training' ? 'bg-zzz-blue shadow-zzz-blue' :
                      'bg-red-500 shadow-red-500'
                    }`} 
                />
                <span className={`uppercase tracking-wider ${isCompleted ? 'text-gray-500' : 'text-zzz-dim'} ${isCompact ? 'text-[7px] md:text-[9px]' : 'text-[10px] md:text-xs'}`}>{topInfo}</span>
            </div>
        </div>
        
        <h3 className={`font-black drop-shadow-sm line-clamp-2 ${titleSizeClass} ${isCompleted ? 'text-[#666] line-through' : 'text-white'}`}>
            {item.title}
        </h3>
        
        {/* Hide desc completely on compact mobile to save space */}
        {!isCompact && (
            <p className={`text-[10px] md:text-xs font-medium line-clamp-2 md:line-clamp-3 ${isCompleted ? 'text-[#444]' : 'text-[#888]'}`}>
                {item.desc || 'No description...'}
            </p>
        )}
        
        {/* Separator Line */}
        <div className={`w-full border-b-2 border-dashed border-[#333] ${isCompact ? 'my-0.5 opacity-30' : 'my-2 md:my-3'}`} />
      </div>

      <div className="flex items-end justify-between">
        <div>
          <div className={`font-bold uppercase text-[#555] ${isCompact ? 'text-[6px] md:text-[8px] mb-0' : 'text-[9px] md:text-[10px] mb-0.5'}`}>Reward</div>
          <div className={`flex items-center gap-1 font-black italic ${isCompleted ? 'text-[#555]' : 'text-white'} ${isCompact ? 'text-[9px] md:text-xs' : 'text-base md:text-lg'}`}>
            <Flame size={isCompact ? 8 : 14} className={isCompleted ? 'text-[#444]' : 'text-zzz-orange fill-zzz-orange'} />
            {item.reward}
          </div>
        </div>

        {type === 'training' ? (
          <button
            onClick={handleAction}
            className="flex items-center gap-1 rounded-full border border-zzz-blue bg-[#000] px-1.5 py-0.5 md:px-4 md:py-2 text-[8px] md:text-xs font-black italic text-zzz-blue shadow-inner transition-all hover:bg-zzz-blue hover:text-black hover:shadow-[0_0_15px_rgba(0,204,255,0.5)]"
          >
             DEPLOY <Play size={6} className="md:w-3 md:h-3" fill="currentColor" />
          </button>
        ) : (
          <button
            onClick={handleAction}
            className={`
              rounded-full border font-black italic shadow-inner transition-all
              ${isCompact ? 'px-2 py-0.5 text-[8px] md:text-[9px]' : 'px-4 py-1.5 md:px-5 md:py-2 text-[10px] md:text-xs'}
              ${isCompleted 
                ? 'border-[#333] bg-transparent text-[#555] hover:text-[#888]' 
                : 'border-zzz-green bg-black text-zzz-green hover:bg-zzz-green hover:text-black hover:shadow-[0_0_15px_rgba(204,255,0,0.5)]'
              }
            `}
          >
            {isCompleted ? 'UNDO' : (isCompact ? 'GO' : 'COMPLETE')}
          </button>
        )}
      </div>
    </div>
  );
};