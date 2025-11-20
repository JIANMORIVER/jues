import React, { useState, useEffect } from 'react';
import { Task } from '../types';
import { Check, Play, Flame, Clock, AlertCircle } from 'lucide-react';

interface TaskCardProps {
  item: Task;
  type: 'daily' | 'target' | 'training' | 'challenge';
  variant?: 'default' | 'compact'; // Added variant prop
  onEdit: (item: Task) => void;
  onAction: (item: Task) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({ item, type, variant = 'default', onEdit, onAction }) => {
  const isCompleted = item.completed;
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [isUrgent, setIsUrgent] = useState(false);

  const handleAction = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAction(item);
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
        
        setIsUrgent(days < 1); // Urgent if less than 1 day
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 60000); // Update every minute
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
  // Made compact cards smaller as requested
  const cardWidthClass = isCompact ? 'min-w-[180px] w-[180px] min-h-[120px]' : 'min-h-[180px]';
  const titleSizeClass = isCompact ? 'text-xs mb-1 leading-tight' : 'text-lg mb-2 leading-tight';
  const paddingClass = isCompact ? 'p-2.5' : 'p-4';

  return (
    <div
      onClick={() => onEdit(item)}
      className={`
        group relative flex cursor-pointer flex-col justify-between rounded-2xl border-[3px] border-black transition-all hover:-translate-y-1
        ${cardWidthClass} ${paddingClass}
        ${isCompleted 
            ? 'bg-[#1a1a1a] border-[#333] opacity-80' 
            : 'bg-zzz-card shadow-[5px_5px_0_rgba(0,0,0,0.5)] hover:border-[#666] hover:shadow-[7px_7px_0_rgba(0,0,0,0.5)]'
        }
      `}
    >
      {/* Completed Stamp */}
      {isCompleted && (
        <div className={`pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-12 rounded border-4 border-[#444] font-black text-[#444] z-10 whitespace-nowrap tracking-widest opacity-60 ${isCompact ? 'text-sm px-2 border-2' : 'text-3xl px-4'}`}>
          COMPLETED
        </div>
      )}

      <div>
        {/* Header Line */}
        <div className="mb-2 flex items-center justify-between text-xs font-bold">
            <div className="flex items-center gap-1.5">
                <div className={`rounded-full shadow-[0_0_5px] 
                    ${isCompact ? 'h-1.5 w-1.5' : 'h-2 w-2'}
                    ${isCompleted ? 'bg-gray-500' : 
                      type === 'daily' ? 'bg-zzz-yellow shadow-zzz-yellow' : 
                      type === 'target' ? 'bg-zzz-green shadow-zzz-green' :
                      type === 'training' ? 'bg-zzz-blue shadow-zzz-blue' :
                      'bg-red-500 shadow-red-500'
                    }`} 
                />
                <span className={`uppercase tracking-wider ${isCompleted ? 'text-gray-500' : 'text-zzz-dim'} ${isCompact ? 'text-[9px]' : ''}`}>{topInfo}</span>
            </div>
            
            {/* Countdown Badge */}
            {timeLeft && !isCompleted && (
                <div className={`flex items-center gap-1 rounded px-1.5 py-0.5 font-mono 
                    ${isCompact ? 'text-[8px]' : 'text-[10px]'}
                    ${isUrgent ? 'bg-red-950 text-red-500 animate-pulse' : 'bg-[#111] text-zzz-blue'}`}>
                    <Clock size={isCompact ? 8 : 10} />
                    {timeLeft}
                </div>
            )}
        </div>
        
        <h3 className={`font-black drop-shadow-sm line-clamp-2 ${titleSizeClass} ${isCompleted ? 'text-[#666] line-through' : 'text-white'}`}>
            {item.title}
        </h3>
        
        {!isCompact && (
            <p className={`text-xs font-medium line-clamp-3 ${isCompleted ? 'text-[#444]' : 'text-[#888]'}`}>
                {item.desc || 'No description provided...'}
            </p>
        )}
        
        <div className={`w-full border-b-2 border-dashed border-[#333] ${isCompact ? 'my-1.5' : 'my-3'}`} />
      </div>

      <div className="flex items-end justify-between">
        <div>
          <div className={`font-bold uppercase text-[#555] ${isCompact ? 'text-[8px] mb-0' : 'text-[10px] mb-0.5'}`}>Reward</div>
          <div className={`flex items-center gap-1 font-black italic ${isCompleted ? 'text-[#555]' : 'text-white'} ${isCompact ? 'text-xs' : 'text-lg'}`}>
            <Flame size={isCompact ? 10 : 16} className={isCompleted ? 'text-[#444]' : 'text-zzz-orange fill-zzz-orange'} />
            {item.reward}
          </div>
        </div>

        {type === 'training' ? (
          <button
            onClick={handleAction}
            className="flex items-center gap-1 rounded-full border border-zzz-blue bg-[#000] px-4 py-2 text-xs font-black italic text-zzz-blue shadow-inner transition-all hover:bg-zzz-blue hover:text-black hover:shadow-[0_0_15px_rgba(0,204,255,0.5)]"
          >
             DEPLOY <Play size={10} fill="currentColor" />
          </button>
        ) : (
          <button
            onClick={handleAction}
            className={`
              rounded-full border font-black italic shadow-inner transition-all
              ${isCompact ? 'px-2.5 py-0.5 text-[9px]' : 'px-5 py-2 text-xs'}
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