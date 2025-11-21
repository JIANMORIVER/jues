
import React, { useState, useEffect } from 'react';
import { AppData, TabType, Task, Block } from './types';
import { INITIAL_DATA } from './constants';
import { CRTOverlay, Screw, SpiralBinding, SideTag } from './components/LayoutElements';
import { TaskCard } from './components/TaskCard';
import { EditModal } from './components/EditModal';
import { Plus, X, Zap, Calendar, Flame, AlertTriangle, Trash, CheckCircle2, ArrowRight, LayoutGrid, Star, Clock, Briefcase, Archive, Trophy, CalendarDays, Columns, CalendarRange, List, Target, Palette, Monitor, Sun, Cpu } from 'lucide-react';

// Helper types for Challenge Matrix
type ChallengeFilter = 'all' | 'q1' | 'q2' | 'q3' | 'q4';
type ViewMode = 'list' | '3day' | 'week' | 'month';

// Level Configuration
const LEVEL_THRESHOLD = 500; // Points needed to level up

// Themes Configuration
const THEMES = {
  default: {
    name: 'Proxy Standard',
    '--color-zzz-black': '#080808',
    '--color-zzz-dark': '#141414',
    '--color-zzz-panel': '#1e1e1e',
    '--color-zzz-card': '#2b2b2b',
    '--color-zzz-orange': '#ff5500',
    '--color-zzz-green': '#ccff00',
    '--color-zzz-yellow': '#ffcc00',
    '--color-zzz-blue': '#00ccff',
    '--color-zzz-dim': '#888888',
    '--color-zzz-text': '#ffffff',
    '--color-zzz-border': '#000000',
    '--color-zzz-text-inv': '#000000',
    '--bg-grid-pattern': 'repeating-linear-gradient(45deg, #1a1a1a 0, #1a1a1a 2px, #141414 2px, #141414 8px)',
    '--bg-body': '#050505',
    '--overlay-crt': 'block'
  },
  light: {
    name: 'City Morning',
    '--color-zzz-black': '#e5e5e5',
    '--color-zzz-dark': '#f5f5f5',
    '--color-zzz-panel': '#ffffff',
    '--color-zzz-card': '#f0f0f0',
    '--color-zzz-orange': '#ea580c',
    '--color-zzz-green': '#65a30d',
    '--color-zzz-yellow': '#ca8a04',
    '--color-zzz-blue': '#0284c7',
    '--color-zzz-dim': '#64748b',
    '--color-zzz-text': '#0f172a',
    '--color-zzz-border': '#cbd5e1',
    '--color-zzz-text-inv': '#ffffff',
    '--bg-grid-pattern': 'repeating-linear-gradient(45deg, #f1f5f9 0, #f1f5f9 2px, #ffffff 2px, #ffffff 8px)',
    '--bg-body': '#d4d4d4',
    '--overlay-crt': 'none'
  },
  future: {
    name: 'Ether Minimalist',
    '--color-zzz-black': '#000000',
    '--color-zzz-dark': '#050505',
    '--color-zzz-panel': '#0a0a0a',
    '--color-zzz-card': '#111111',
    '--color-zzz-orange': '#ff2a6d',
    '--color-zzz-green': '#05d9e8',
    '--color-zzz-yellow': '#f9f9f9',
    '--color-zzz-blue': '#005678',
    '--color-zzz-dim': '#445566',
    '--color-zzz-text': '#d1f7ff',
    '--color-zzz-border': '#333333',
    '--color-zzz-text-inv': '#000000',
    '--bg-grid-pattern': 'linear-gradient(0deg, transparent 24%, rgba(5, 217, 232, .05) 25%, rgba(5, 217, 232, .05) 26%, transparent 27%, transparent 74%, rgba(5, 217, 232, .05) 75%, rgba(5, 217, 232, .05) 76%, transparent 77%, transparent)',
    '--bg-body': '#000000',
    '--overlay-crt': 'block'
  }
};

type ThemeKey = keyof typeof THEMES;

function App() {
  const [data, setData] = useState<AppData>(INITIAL_DATA);
  const [currentTab, setCurrentTab] = useState<TabType>('daily');
  const [isSidebarVisible, setSidebarVisible] = useState(true);
  const [dailyFilter, setDailyFilter] = useState<'all' | Block>('all');
  const [challengeFilter, setChallengeFilter] = useState<ChallengeFilter>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  
  // Theme State
  const [currentTheme, setCurrentTheme] = useState<ThemeKey>('default');
  const [isThemeModalOpen, setThemeModalOpen] = useState(false);

  // Modals
  const [isModalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editingType, setEditingType] = useState<TabType | null>(null);
  
  // Deploy Modal State
  const [deployItem, setDeployItem] = useState<Task | null>(null);

  // Battery Toast State
  const [batteryToasts, setBatteryToasts] = useState<{id: number}[]>([]);

  useEffect(() => {
    setSidebarVisible(currentTab === 'daily');
    if (currentTab === 'challenge') {
        setChallengeFilter('all'); 
    }
  }, [currentTab]);

  // Apply Theme
  useEffect(() => {
    const root = document.documentElement;
    const themeConfig = THEMES[currentTheme];
    Object.entries(themeConfig).forEach(([key, value]) => {
      if (key.startsWith('--')) {
        root.style.setProperty(key, value);
      }
    });
  }, [currentTheme]);

  // Derived State for Leveling System
  const currentLevel = Math.floor(data.score / LEVEL_THRESHOLD) + 1;
  const currentLevelProgress = data.score % LEVEL_THRESHOLD;
  const progressPercentage = (currentLevelProgress / LEVEL_THRESHOLD) * 100;

  // --- Helper Functions ---

  const getBlock = (t: Task): Block => {
    if (t.block) return t.block;
    if (t.time) {
        const h = new Date(t.time).getHours();
        if (h < 12) return 'morning';
        if (h < 18) return 'afternoon';
        return 'evening';
    }
    return 'morning';
  }

  const isSameDay = (d1: Date, d2: Date) => {
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
  }

  const setTimeForInput = (date: Date, h: number, m: number) => {
    const d = new Date(date);
    d.setHours(h, m, 0, 0);
    const offset = d.getTimezoneOffset() * 60000;
    return (new Date(d.getTime() - offset)).toISOString().slice(0, 16);
  }

  const getTasksForDate = (date: Date) => {
    const isToday = isSameDay(date, new Date());
    const routines = isToday ? data.daily : [];

    const challenges = data.challenge.filter(t => {
        if (!t.time) return false;
        const tDate = new Date(t.time);
        return isSameDay(tDate, date);
    });

    return [...routines, ...challenges].sort((a, b) => {
        const aTime = a.time ? new Date(a.time).getTime() : 0;
        const bTime = b.time ? new Date(b.time).getTime() : 0;
        if (!a.time && !b.time) return 0;
        if (!a.time) return -1;
        if (!b.time) return 1;
        return aTime - bTime;
    });
  };

  // --- Handlers ---

  const handleToggleComplete = (item: Task, type: TabType) => {
    if (type === 'training') return;

    const newData = { ...data };
    const isChallengeInDaily = currentTab === 'daily' && item.time !== undefined;
    const targetType = isChallengeInDaily ? 'challenge' : type;

    const list = newData[targetType as keyof AppData] as Task[];
    const taskIndex = list.findIndex(t => t.id === item.id);
    
    if (taskIndex > -1) {
        const task = list[taskIndex];
        const wasCompleted = task.completed;
        task.completed = !wasCompleted;
        
        const change = task.reward;
        if (!wasCompleted) {
            newData.score = newData.score + change;
        } else {
            newData.score = Math.max(0, newData.score - change);
        }
    }
    setData(newData);
  };

  const handleDeleteTask = (item: Task, type: TabType) => {
      const isChallengeInDaily = currentTab === 'daily' && item.time !== undefined;
      const targetType = isChallengeInDaily ? 'challenge' : type;

      setData(prev => {
          const currentList = prev[targetType] as Task[];
          const updatedList = currentList.filter(t => t.id !== item.id);
          return {
              ...prev,
              [targetType]: updatedList
          };
      });
  };

  const initiateDeploy = (item: Task) => {
    setDeployItem(item);
  };

  const confirmDeploy = (block: Block) => {
    if (!deployItem) return;
    
    const newTask: Task = {
        ...deployItem,
        id: Date.now(),
        completed: false,
        block: block,
        subtasks: deployItem.subtasks.map(s => ({ ...s }))
    };

    setData(prev => ({
        ...prev,
        daily: [...prev.daily, newTask]
    }));
    
    setDeployItem(null);
    setCurrentTab('daily');
    setDailyFilter('all');
  };

  const handleOpenEdit = (item: Task, type: TabType) => {
    const isChallengeInDaily = currentTab === 'daily' && item.time !== undefined;
    setEditingTask(item);
    setEditingType(isChallengeInDaily ? 'challenge' : type);
    setModalOpen(true);
  };

  const handleOpenAdd = (targetDate?: Date) => {
    let defaultImp = false;
    let defaultUrg = false;
    let defaultTime = "";

    if (currentTab === 'challenge') {
        if (challengeFilter === 'q1') { defaultImp = true; defaultUrg = true; }
        if (challengeFilter === 'q2') { defaultImp = true; defaultUrg = false; }
        if (challengeFilter === 'q3') { defaultImp = false; defaultUrg = true; }
        if (challengeFilter === 'q4') { defaultImp = false; defaultUrg = false; }
    }

    if (targetDate) {
        defaultTime = setTimeForInput(targetDate, 9, 0);
    }

    const newItem: Task = {
        id: Date.now(),
        title: "",
        desc: "",
        reward: 50,
        completed: false,
        subtasks: [],
        block: "morning",
        time: defaultTime,
        importance: defaultImp,
        urgency: defaultUrg
    };
    
    setEditingTask(newItem);
    setEditingType(targetDate ? 'challenge' : currentTab);
    setModalOpen(true);
  };

  const handleSaveTask = (savedTask: Task) => {
    if (!editingType) return;

    setData(prev => {
        const list = [...prev[editingType]];
        const idx = list.findIndex(t => t.id === savedTask.id);
        
        if (idx > -1) {
            list[idx] = savedTask;
        } else {
            list.push(savedTask);
        }
        
        return { ...prev, [editingType]: list };
    });
    setModalOpen(false);
  };

  const handleClearCompletedDaily = () => {
      setData(prev => {
          const activeTasks = prev.daily.filter(t => !t.completed);
          return {
              ...prev,
              daily: activeTasks
          };
      });
  };

  const handleHorizontalWheel = (e: React.WheelEvent<HTMLDivElement>) => {
      if (e.deltaY !== 0) {
          e.currentTarget.scrollLeft += e.deltaY;
          e.stopPropagation(); 
      }
  };

  const handleBatteryClick = () => {
      const id = Date.now();
      setBatteryToasts(prev => [...prev, { id }]);
      setTimeout(() => {
          setBatteryToasts(prev => prev.filter(t => t.id !== id));
      }, 1000);
  };

  // --- Render Helpers ---

  const renderGrid = (items: Task[], type: TabType) => (
    <div className="grid grid-cols-1 md:grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-3 md:gap-4 pb-5">
        {items.map(item => (
            <TaskCard 
                key={item.id} 
                item={item} 
                type={item.time && currentTab === 'daily' ? 'challenge' : type}
                onEdit={() => handleOpenEdit(item, type)}
                onDelete={(t) => handleDeleteTask(t, type)}
                onAction={type === 'training' ? initiateDeploy : (t) => handleToggleComplete(t, type)}
            />
        ))}
    </div>
  );

  const renderDailyContent = () => {
      const today = new Date();

      const renderBlockGroup = (groupTasks: Task[], label: string, dotColor: string, isLarge: boolean = false) => {
          if (groupTasks.length === 0) return null;
          return (
              <div className={`${isLarge ? 'mb-3 md:mb-4' : 'mb-1.5 md:mb-2'}`}>
                <div className="flex items-center gap-1 mb-0.5 md:mb-1 opacity-70">
                    <div className={`h-1 w-1 md:h-1.5 md:w-1.5 rounded-full ${dotColor}`}></div>
                    <span className={`${isLarge ? 'text-xs md:text-sm' : 'text-[8px] md:text-[10px]'} font-black uppercase text-zzz-dim leading-none`}>{label}</span>
                </div>
                <div className={`grid ${isLarge ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2' : 'flex flex-col gap-1 md:gap-2'}`}>
                    {groupTasks.map(task => (
                        <div key={task.id} className="transform origin-top">
                            <TaskCard 
                              item={task} 
                              type={task.time ? 'challenge' : 'daily'} 
                              variant="compact"
                              onEdit={() => handleOpenEdit(task, 'daily')}
                              onDelete={(t) => handleDeleteTask(t, 'daily')}
                              onAction={(t) => handleToggleComplete(t, 'daily')}
                            />
                        </div>
                    ))}
                </div>
              </div>
          );
      };

      const renderDayCell = (date: Date, isLarge: boolean = false) => {
          const tasks = getTasksForDate(date);
          const isToday = isSameDay(date, new Date());
          const isWeekView = viewMode === 'week';
          
          const morning = tasks.filter(t => getBlock(t) === 'morning');
          const afternoon = tasks.filter(t => getBlock(t) === 'afternoon');
          const evening = tasks.filter(t => getBlock(t) === 'evening');

          const contentHeightClass = isWeekView 
             ? (isLarge ? 'max-h-[320px]' : 'max-h-[240px]') 
             : '';

          return (
              <div 
                className={`flex flex-col rounded-xl border-2 transition-all duration-300
                    ${isToday ? 'border-zzz-border bg-zzz-dark' : 'border-zzz-panel bg-zzz-black'} 
                    ${isLarge ? 'p-3 md:p-4 shadow-[0_0_30px_var(--color-zzz-border)] z-10' : 'p-1 md:p-2 opacity-90 hover:opacity-100'} 
                    relative group min-w-0 overflow-hidden
                    ${isWeekView ? 'w-full min-h-[80px]' : 'h-full'} 
                `}
                onClick={() => !isLarge && isSameDay(date, new Date()) && setViewMode('list')}
              >
                  <div className={`flex justify-between items-start border-b border-zzz-border ${isLarge ? 'pb-2 mb-2' : 'pb-1 mb-1'} px-1 ${isToday ? 'text-zzz-green' : 'text-zzz-dim'}`}>
                      <div className="min-w-0 overflow-hidden">
                          <div className={`${isLarge ? 'text-lg md:text-2xl' : 'text-[10px] md:text-xs'} font-black italic truncate leading-tight mb-0.5`}>
                              {date.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })}
                              {isLarge && <span className="ml-2 text-sm not-italic text-zzz-dim font-normal uppercase tracking-widest">Today</span>}
                          </div>
                          <div className={`${isLarge ? 'text-xs md:text-sm' : 'text-[8px] md:text-[9px]'} font-mono uppercase leading-tight opacity-70 truncate`}>
                              {date.toLocaleDateString('en-US', { weekday: isLarge ? 'long' : 'short' })}
                          </div>
                      </div>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleOpenAdd(date); }}
                        className={`opacity-0 group-hover:opacity-100 transition-opacity hover:text-zzz-green shrink-0 ${isLarge ? 'p-2 bg-zzz-panel rounded-lg hover:bg-zzz-green hover:text-zzz-text-inv' : 'p-0.5'}`}
                        title="Add task"
                      >
                          <Plus size={isLarge ? 16 : 12} />
                      </button>
                  </div>
                  
                  <div className={`flex-1 flex flex-col overflow-y-auto custom-scrollbar px-0.5 ${contentHeightClass}`}>
                      {renderBlockGroup(morning, 'AM', 'bg-zzz-yellow', isLarge)}
                      {renderBlockGroup(afternoon, 'PM', 'bg-zzz-orange', isLarge)}
                      {renderBlockGroup(evening, 'Night', 'bg-zzz-blue', isLarge)}
                      
                      {tasks.length === 0 && (
                          <div 
                            onClick={() => handleOpenAdd(date)}
                            className="flex-1 flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity min-h-[40px]"
                          >
                              <div className={`text-center text-zzz-dim italic border border-dashed border-zzz-border rounded hover:border-zzz-green hover:text-zzz-green w-full flex items-center justify-center gap-2 ${isLarge ? 'py-8 text-sm' : 'p-1 text-[8px]'}`}>
                                <Plus size={isLarge ? 16 : 10} /> {isLarge ? 'NO SCHEDULE / ADD NEW' : '+'}
                              </div>
                          </div>
                      )}
                  </div>
              </div>
          );
      };

      if (viewMode === 'list') {
          const combinedTasks = getTasksForDate(today);
          const morningTasks = combinedTasks.filter(t => getBlock(t) === 'morning');
          const afternoonTasks = combinedTasks.filter(t => getBlock(t) === 'afternoon');
          const eveningTasks = combinedTasks.filter(t => getBlock(t) === 'evening');
          
          const renderListSection = (blockTasks: Task[], block: Block, color: string, label: string) => (
             <div className="mb-6 md:mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="mb-2 md:mb-3 flex items-center gap-2 border-b border-zzz-border pb-1">
                    <div className={`h-1.5 w-1.5 md:h-2 md:w-2 rounded-sm ${color}`} />
                    <div className="text-[10px] md:text-xs font-black tracking-widest text-zzz-dim">
                        {label.toUpperCase()}
                    </div>
                </div>
                {blockTasks.length === 0 ? (
                    <div className="flex h-16 md:h-24 items-center justify-center rounded-xl border-2 border-dashed border-zzz-border bg-zzz-black text-[10px] md:text-xs font-bold text-zzz-dim">
                        - 空闲 -
                    </div>
                ) : (
                    renderGrid(blockTasks, 'daily')
                )}
             </div>
          );

          return (
            <div className="pb-10">
                {(dailyFilter === 'all' || dailyFilter === 'morning') && renderListSection(morningTasks, 'morning', 'bg-yellow-500', 'MORNING / 上午')}
                {(dailyFilter === 'all' || dailyFilter === 'afternoon') && renderListSection(afternoonTasks, 'afternoon', 'bg-orange-500', 'AFTERNOON / 下午')}
                {(dailyFilter === 'all' || dailyFilter === 'evening') && renderListSection(eveningTasks, 'evening', 'bg-blue-500', 'EVENING / 晚上')}
                
                <div className="mt-4 flex justify-center">
                    <button 
                        onClick={handleClearCompletedDaily}
                        className="flex w-full max-w-sm items-center justify-center gap-2 rounded-xl border-2 border-dashed border-zzz-border bg-zzz-black py-3 text-xs font-bold text-zzz-dim transition-all hover:border-red-900 hover:bg-red-950/20 hover:text-red-500"
                    >
                        <Trash size={14} /> 清理今日已完成事项
                    </button>
                </div>
            </div>
          );
      }

      if (viewMode === 'week') {
          const offsets = [-3, -2, -1, 0, 1, 2, 3];
          const dates = offsets.map(o => {
             const d = new Date();
             d.setDate(today.getDate() + o);
             return d;
          });

          return (
              <div className="flex flex-col w-full gap-4 pb-6">
                  <div className="grid grid-cols-3 gap-2 items-start">
                      {dates.slice(0, 3).map((date, i) => (
                          <div key={i} className="min-w-0 w-full">{renderDayCell(date, false)}</div>
                      ))}
                  </div>
                  <div className="w-full">
                      {renderDayCell(dates[3], true)}
                  </div>
                  <div className="grid grid-cols-3 gap-2 items-start">
                      {dates.slice(4, 7).map((date, i) => (
                          <div key={i} className="min-w-0 w-full">{renderDayCell(date, false)}</div>
                      ))}
                  </div>
              </div>
          );
      }

      if (viewMode === '3day') {
          const dates = [0, 1, 2].map(i => {
              const d = new Date();
              d.setDate(today.getDate() + i);
              return d;
          });

          return (
              <div className="grid grid-cols-3 gap-2 h-full pb-2">
                  {dates.map((date, i) => (
                      <div key={i} className="h-full min-w-0">{renderDayCell(date, false)}</div>
                  ))}
              </div>
          );
      }

      if (viewMode === 'month') {
          const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
          const startDay = new Date(today.getFullYear(), today.getMonth(), 1).getDay(); 
          const gridSlots = Array.from({ length: daysInMonth + startDay });

          return (
              <div className="grid grid-cols-7 gap-1 h-full overflow-y-auto custom-scrollbar pb-4">
                  {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(d => (
                      <div key={d} className="text-center text-[10px] font-bold text-zzz-dim py-1">{d}</div>
                  ))}
                  {gridSlots.map((_, i) => {
                      const dayNum = i - startDay + 1;
                      if (dayNum < 1) return <div key={i} className="bg-transparent" />;
                      
                      const currentDate = new Date(today.getFullYear(), today.getMonth(), dayNum);
                      const tasks = getTasksForDate(currentDate);
                      const isToday = isSameDay(currentDate, new Date());

                      return (
                          <div 
                            key={i} 
                            onClick={() => handleOpenAdd(currentDate)}
                            className={`min-h-[80px] md:min-h-[100px] rounded border p-1 flex flex-col cursor-pointer hover:border-zzz-blue transition-colors ${isToday ? 'border-zzz-green bg-zzz-dark' : 'border-zzz-panel bg-zzz-black'}`}
                          >
                              <div className="flex justify-between items-start">
                                  <span className={`text-[10px] font-black ${isToday ? 'text-zzz-green' : 'text-zzz-dim'}`}>{dayNum}</span>
                                  <Plus size={10} className="text-zzz-dim opacity-0 hover:opacity-100" />
                              </div>
                              <div className="flex-1 flex flex-col gap-1 mt-1 overflow-hidden">
                                  {tasks.slice(0, 3).map(t => (
                                      <div key={t.id} className={`h-1.5 md:h-2 w-full rounded-sm relative group/dot ${t.completed ? 'bg-zzz-panel' : t.time ? 'bg-red-500' : 'bg-zzz-yellow'}`} title={t.title}>
                                          <div className="hidden group-hover/dot:block absolute bottom-full left-1/2 -translate-x-1/2 bg-black border border-zzz-border text-white text-[8px] p-1 whitespace-nowrap z-50 mb-1">
                                              {t.title}
                                          </div>
                                      </div>
                                  ))}
                                  {tasks.length > 3 && <div className="text-[8px] text-zzz-dim text-center">+{tasks.length - 3}</div>}
                              </div>
                          </div>
                      );
                  })}
              </div>
          );
      }
  }

  const renderChallengeContent = () => {
    const q1 = data.challenge.filter(t => t.importance && t.urgency);
    const q2 = data.challenge.filter(t => t.importance && !t.urgency);
    const q3 = data.challenge.filter(t => !t.importance && t.urgency);
    const q4 = data.challenge.filter(t => !t.importance && !t.urgency);

    if (challengeFilter === 'all') {
        const renderQuadrant = (title: string, tasks: Task[], colorClass: string, borderColor: string, targetFilter: ChallengeFilter) => (
            <div className={`flex flex-col gap-2 md:gap-3 rounded-xl border-2 bg-zzz-dark p-2 md:p-3 ${borderColor} min-h-[130px] md:min-h-[200px] relative overflow-hidden group hover:bg-zzz-panel transition-colors`}>
                <div 
                    className="absolute inset-0 z-0 cursor-pointer" 
                    onClick={() => setChallengeFilter(targetFilter)}
                    title="点击查看完整列表"
                />

                <div className={`flex items-center justify-between border-b border-zzz-border pb-1 md:pb-2 z-10 pointer-events-none mx-1`}>
                    <span className={`text-sm md:text-lg font-black italic uppercase ${colorClass}`}>{title}</span>
                    <span className="font-mono text-[9px] md:text-xs text-zzz-dim">{tasks.length} ITEMS</span>
                </div>
                
                <div 
                    className="flex flex-row gap-2 md:gap-3 overflow-x-auto pb-2 pt-1 z-10 relative no-scrollbar h-full items-start px-1"
                    onWheel={handleHorizontalWheel}
                >
                    {tasks.length === 0 && <div className="w-full py-6 md:py-8 text-center text-[10px] md:text-xs text-zzz-dim italic pointer-events-none">- 暂无项目 -</div>}
                    {tasks.map(item => (
                         <div key={item.id} className="shrink-0" onMouseEnter={(e) => e.stopPropagation()}>
                             <TaskCard 
                                item={item} 
                                type="challenge"
                                variant="compact"
                                onEdit={() => handleOpenEdit(item, 'challenge')}
                                onDelete={(t) => handleDeleteTask(t, 'challenge')}
                                onAction={(t) => handleToggleComplete(t, 'challenge')}
                            />
                         </div>
                    ))}
                    <div className="w-2 shrink-0"></div>
                </div>
            </div>
        );

        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 pb-10 h-full overflow-y-auto custom-scrollbar">
                {renderQuadrant("I. 重要且紧急", q1, "text-red-500", "border-red-900/40 hover:border-red-500/30", "q1")}
                {renderQuadrant("II. 重要不紧急", q2, "text-zzz-blue", "border-blue-900/40 hover:border-blue-500/30", "q2")}
                {renderQuadrant("III. 紧急不重要", q3, "text-zzz-yellow", "border-yellow-900/40 hover:border-yellow-500/30", "q3")}
                {renderQuadrant("IV. 不重要不紧急", q4, "text-zzz-dim", "border-zzz-dim/40 hover:border-zzz-dim/60", "q4")}
            </div>
        );
    }

    let itemsToRender: Task[] = [];
    let filterTitle = "";
    
    if (challengeFilter === 'q1') { itemsToRender = q1; filterTitle = "I. 重要且紧急"; }
    if (challengeFilter === 'q2') { itemsToRender = q2; filterTitle = "II. 重要不紧急"; }
    if (challengeFilter === 'q3') { itemsToRender = q3; filterTitle = "III. 紧急不重要"; }
    if (challengeFilter === 'q4') { itemsToRender = q4; filterTitle = "IV. 不重要不紧急"; }

    return (
        <div className="flex flex-col h-full pb-5 animate-in fade-in slide-in-from-right-4 duration-300">
             <div className="mb-4 flex items-center gap-2 text-sm font-bold text-zzz-dim bg-zzz-dark p-2 rounded border border-zzz-border">
                <LayoutGrid size={14} className="cursor-pointer hover:text-zzz-text" onClick={() => setChallengeFilter('all')} />
                <span>/</span>
                <span className="text-zzz-text">{filterTitle}</span>
             </div>
             <div className="overflow-y-auto custom-scrollbar pr-2 flex-1">
                {renderGrid(itemsToRender, 'challenge')}
             </div>
        </div>
    );
  };

  const getTabLabel = (tab: TabType) => {
      const labels: Record<TabType, string> = {
          daily: "日常安排",
          target: "长期目标",
          training: "训练模组",
          challenge: "重要使命"
      };
      return labels[tab];
  };
  
  const getTabName = (tab: TabType) => {
      const names: Record<TabType, string> = {
          daily: "日常",
          target: "目标",
          training: "训练",
          challenge: "挑战"
      };
      return names[tab];
  }

  const getTabStyles = (tab: TabType, isActive: boolean) => {
      const baseStyles = "relative rounded-t-xl border-2 border-b-0 border-zzz-border px-4 md:px-8 py-2 md:py-3 text-sm md:text-lg font-black italic uppercase transition-all flex-shrink-0";
      
      if (!isActive) {
          return `${baseStyles} h-[40px] md:h-[48px] bg-zzz-card text-zzz-dim hover:text-zzz-text`;
      }
      
      const activeMap: Record<TabType, string> = {
          daily: 'z-10 h-[48px] md:h-[55px] bg-zzz-yellow text-zzz-text-inv shadow-[0_-4px_15px_rgba(255,204,0,0.3)]',
          target: 'z-10 h-[48px] md:h-[55px] bg-zzz-green text-zzz-text-inv shadow-[0_-4px_15px_rgba(204,255,0,0.3)]',
          training: 'z-10 h-[48px] md:h-[55px] bg-zzz-blue text-zzz-text-inv shadow-[0_-4px_15px_rgba(0,204,255,0.3)]',
          challenge: 'z-10 h-[48px] md:h-[55px] bg-red-600 text-white shadow-[0_-4px_15px_rgba(255,0,0,0.3)]'
      };
      
      return `${baseStyles} ${activeMap[tab]}`;
  };

  return (
    <div className="flex h-[100dvh] w-full flex-col md:h-screen md:items-center md:justify-center bg-zzz-black p-0 md:p-4 bg-[radial-gradient(circle_at_center,var(--color-zzz-panel),var(--color-zzz-black))] text-zzz-text">
      <CRTOverlay />

      {/* Main Device Container */}
      <div className="relative flex h-full w-full md:max-h-[680px] md:max-w-[1050px] flex-col rounded-none border-0 md:rounded-[30px] md:border-4 md:border-zzz-border bg-zzz-dark p-2 md:p-3 md:shadow-[0_0_0_4px_var(--color-zzz-card),0_0_60px_black] bg-grid-pattern">
        
        <Screw position="top-[15px] left-[15px]" />
        <Screw position="top-[15px] right-[15px]" />
        <Screw position="bottom-[15px] left-[15px]" />
        <Screw position="bottom-[15px] right-[15px]" />

        {/* Top Bar */}
        <div className="z-20 mb-0 flex flex-wrap md:flex-nowrap h-auto min-h-[60px] items-end justify-between px-2 md:px-5 py-2 md:py-0 gap-2">
          <div className="flex items-end gap-1 overflow-x-auto no-scrollbar w-full md:w-auto pb-1 md:pb-0">
            {/* Tabs */}
            {(['daily', 'target', 'training', 'challenge'] as TabType[]).map(tab => (
              <button
                key={tab}
                onClick={() => setCurrentTab(tab)}
                className={getTabStyles(tab, currentTab === tab)}
              >
                 <div className="absolute inset-x-0 top-0 h-1 rounded-t-xl bg-white/10" />
                 {getTabName(tab)}
              </button>
            ))}

            {/* Mobile Utility Buttons */}
            <div className="md:hidden flex items-center gap-1 ml-2 pb-1 relative">
               <div className="relative">
                  <button 
                      onClick={handleBatteryClick}
                      className="flex h-[40px] w-[40px] items-center justify-center rounded-full border-2 border-zzz-border bg-zzz-card text-zzz-text shadow-[0_4px_0_var(--color-zzz-border)] active:translate-y-1 active:shadow-none"
                  >
                      <Zap size={18} className="fill-currentColor text-zzz-text hover:text-zzz-green transition-colors" />
                  </button>
                  {batteryToasts.map((toast) => (
                      <div 
                          key={toast.id}
                          className="absolute right-0 -bottom-10 pointer-events-none animate-out fade-out slide-out-to-bottom-4 duration-1000 whitespace-nowrap font-black italic text-zzz-green text-sm bg-zzz-black px-2 py-1 rounded border border-zzz-green shadow-[0_0_10px_#ccff00] z-50"
                      >
                          电量+1
                      </div>
                  ))}
               </div>
               
               <button onClick={() => setThemeModalOpen(true)} className="flex h-[40px] w-[40px] items-center justify-center rounded-full border-2 border-zzz-border bg-zzz-panel text-zzz-text shadow-[0_4px_0_var(--color-zzz-border)] active:translate-y-1 active:shadow-none">
                  <Palette size={22} strokeWidth={2} />
               </button>
            </div>
          </div>

          {/* Desktop Utility Buttons */}
          <div className="hidden md:flex mb-2.5 items-center gap-3 ml-auto relative">
             <div className="flex items-center gap-2 rounded-full border-2 border-zzz-border bg-zzz-black px-4 py-1.5 shadow-inner">
                <AlertTriangle size={14} className="text-zzz-yellow" />
                <span className="text-sm font-bold text-zzz-dim">待办: {data.daily.filter(t=>!t.completed).length}</span>
             </div>
             
             <div className="relative">
                <button 
                    onClick={handleBatteryClick}
                    className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-zzz-border bg-zzz-card text-zzz-text shadow-[0_4px_0_var(--color-zzz-border)] transition-all hover:text-zzz-green active:translate-y-1 active:shadow-none"
                >
                    <Zap size={20} fill="currentColor" />
                </button>
                {batteryToasts.map((toast) => (
                    <div 
                        key={toast.id}
                        className="absolute right-0 -top-8 pointer-events-none animate-out fade-out slide-out-to-top-4 duration-1000 whitespace-nowrap font-black italic text-zzz-green text-sm bg-zzz-black px-2 py-1 rounded border border-zzz-green shadow-[0_0_10px_#ccff00]"
                    >
                        电量+1
                    </div>
                ))}
             </div>

             <button 
               onClick={() => setThemeModalOpen(true)}
               className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-zzz-border bg-zzz-panel text-zzz-text shadow-[0_4px_0_var(--color-zzz-border)] transition-all hover:bg-zzz-card active:translate-y-1 active:shadow-none"
               title="Change Style"
             >
                <Palette size={20} strokeWidth={2} />
             </button>
          </div>
        </div>

        {/* Main Body Area */}
        <div className="relative flex flex-1 flex-col md:flex-row overflow-hidden rounded-none md:rounded-b-[20px] border-t-2 md:border-3 border-zzz-border bg-zzz-panel shadow-none md:shadow-[inset_0_0_50px_rgba(0,0,0,0.2)]">
            
            {/* Sidebar (Hidden on Mobile) */}
            <div className={`hidden md:flex relative z-20 w-[220px] flex-col gap-3 pt-[40px] transition-all duration-300 ${isSidebarVisible ? 'translate-x-0 opacity-100' : '-translate-x-[100px] opacity-0 w-0 overflow-hidden'} h-full justify-between`}>
                
                <SideTag active={isSidebarVisible} />
                <SpiralBinding />
                
                {/* Sidebar Menu Group - Scrollable */}
                <div className="ml-[45px] mt-4 flex flex-col gap-2 pr-2 overflow-y-auto no-scrollbar pb-4 flex-1">
                    {/* Main Schedule Button */}
                    <div 
                        onClick={() => { setCurrentTab('daily'); setDailyFilter('all'); }}
                        className={`group relative flex cursor-pointer items-center gap-3 overflow-hidden rounded-r-lg border-l-4 p-3 transition-all
                        ${currentTab === 'daily' && dailyFilter === 'all' 
                            ? 'border-zzz-orange bg-gradient-to-r from-white/10 to-transparent' 
                            : 'border-transparent hover:bg-white/5'}`}
                    >
                        <Calendar size={20} className={`${currentTab === 'daily' && dailyFilter === 'all' ? 'text-zzz-orange' : 'text-zzz-dim group-hover:text-zzz-text'}`} />
                        <span className={`text-lg font-black italic tracking-wide ${currentTab === 'daily' && dailyFilter === 'all' ? 'text-zzz-text' : 'text-zzz-dim group-hover:text-zzz-text'}`}>
                            行程安排
                        </span>
                        {currentTab === 'daily' && dailyFilter === 'all' && (
                            <div className="absolute bottom-0 right-0 h-[2px] w-1/2 bg-zzz-orange shadow-[0_0_5px_var(--color-zzz-orange)]" />
                        )}
                    </div>

                    {/* Submenu Items (Time Filter) */}
                    <div className={`flex flex-col gap-1 transition-all duration-300 ${currentTab === 'daily' ? 'opacity-100' : 'opacity-50'}`}>
                        <div className="ml-6 flex flex-col border-l-2 border-zzz-border pl-4 pt-2 space-y-2">
                             {[
                                { key: 'morning', label: '上午', icon: '06:00' },
                                { key: 'afternoon', label: '下午', icon: '12:00' },
                                { key: 'evening', label: '晚上', icon: '18:00' }
                             ].map((item) => {
                                const isActive = dailyFilter === item.key;
                                return (
                                    <div 
                                        key={item.key}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setDailyFilter(item.key as Block);
                                            setViewMode('list');
                                        }}
                                        className={`group relative flex cursor-pointer items-center justify-between rounded-md px-3 py-2 transition-all
                                        ${isActive && viewMode === 'list'
                                            ? 'bg-zzz-card shadow-[inset_2px_0_0_var(--color-zzz-green)]' 
                                            : 'hover:bg-zzz-dark'}`}
                                    >
                                        <div className="flex flex-col">
                                            <span className={`text-sm font-black italic ${isActive && viewMode === 'list' ? 'text-zzz-green' : 'text-zzz-dim group-hover:text-zzz-text'}`}>
                                                {item.label}
                                            </span>
                                            <span className="text-[10px] font-mono text-zzz-dim">{item.icon}</span>
                                        </div>
                                        {isActive && viewMode === 'list' && <ArrowRight size={12} className="text-zzz-green animate-pulse" />}
                                    </div>
                                );
                             })}
                        </div>
                    </div>
                </div>
                
                {/* Calendar Views Section */}
                {currentTab === 'daily' && (
                    <div className="ml-[45px] mb-6 animate-in fade-in duration-500 z-10">
                        <div className="mb-2 pl-2 text-[10px] font-bold text-zzz-dim uppercase tracking-widest">View Mode / 视图</div>
                        <div className="flex flex-col gap-1">
                            {[
                                { id: '3day', label: '三日视图', icon: Columns },
                                { id: 'week', label: '周视图', icon: CalendarDays },
                                { id: 'month', label: '月视图', icon: CalendarRange },
                                { id: 'list', label: '列表视图', icon: List }
                            ].map((opt) => (
                                <button
                                    key={opt.id}
                                    onClick={() => setViewMode(opt.id as ViewMode)}
                                    className={`flex items-center gap-3 rounded-r-lg border-l-2 px-4 py-2 transition-all
                                    ${viewMode === opt.id 
                                        ? 'border-zzz-blue bg-white/5 text-zzz-blue' 
                                        : 'border-transparent text-zzz-dim hover:bg-white/5 hover:text-zzz-text'}`}
                                >
                                    <opt.icon size={14} />
                                    <span className="text-xs font-bold italic">{opt.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Content Area */}
            <div className="flex flex-1 flex-col overflow-hidden px-2 py-2 md:px-[30px] md:py-[20px]">
                
                {currentTab === 'daily' && (
                    <div className="md:hidden flex gap-2 mb-2 overflow-x-auto pb-2 no-scrollbar flex-shrink-0">
                        <button
                            onClick={() => { setViewMode('list'); setDailyFilter('all'); }}
                            className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-bold border transition-all ${viewMode === 'list' && dailyFilter === 'all' ? 'bg-zzz-orange text-white border-zzz-orange' : 'bg-zzz-dark text-zzz-dim border-zzz-border'}`}
                        >
                            全部
                        </button>
                         {[
                            { id: '3day', label: '3日' },
                            { id: 'week', label: '周' },
                            { id: 'month', label: '月' }
                         ].map((opt) => (
                             <button
                                key={opt.id}
                                onClick={() => setViewMode(opt.id as ViewMode)}
                                className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-bold border transition-all ${viewMode === opt.id ? 'bg-zzz-blue text-black border-zzz-blue' : 'bg-zzz-dark text-zzz-dim border-zzz-border'}`}
                             >
                                {opt.label}
                             </button>
                         ))}
                    </div>
                )}
                
                {/* PROGRESS SECTION */}
                <div className="mb-3 md:mb-5 rounded-xl md:rounded-2xl border-2 border-zzz-border bg-zzz-dark p-3 md:p-5 shadow-inner flex-shrink-0">
                    <div className="mb-1 md:mb-2 flex items-end justify-between">
                        <div className="flex items-center gap-2 md:gap-4">
                            <div className="flex flex-col items-center justify-center rounded border border-zzz-green bg-zzz-black px-2 py-1 shadow-[0_0_10px_rgba(204,255,0,0.2)]">
                                <span className="text-[8px] md:text-[10px] font-bold leading-none text-zzz-dim uppercase">Proxy Lv.</span>
                                <span className="text-xl md:text-2xl font-black leading-none text-zzz-green italic">{String(currentLevel).padStart(2, '0')}</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] md:text-xs font-bold text-zzz-dim uppercase">Total Activity / 累计活跃度</span>
                                <div className="text-sm md:text-lg font-black italic text-zzz-text">
                                    <span className="text-zzz-orange">🔥</span> {data.score}
                                </div>
                            </div>
                        </div>
                        <div className="text-[10px] md:text-xs font-mono text-zzz-dim">
                            NEXT LEVEL: <span className="text-zzz-green">{currentLevelProgress}</span> / {LEVEL_THRESHOLD}
                        </div>
                    </div>
                    <div className="relative mb-4 md:mb-6 mt-3 md:mt-6 h-2 md:h-3 w-full rounded-full border border-zzz-border bg-zzz-black">
                        <div 
                            className="relative h-full rounded-full bg-zzz-green shadow-[0_0_10px_#ccff00] transition-all duration-500 ease-out"
                            style={{ width: `${Math.max(2, progressPercentage)}%` }}
                        >
                             <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_4px,rgba(0,0,0,0.1)_4px,rgba(0,0,0,0.1)_8px)]" />
                        </div>
                        {[0.25, 0.5, 0.75, 1.0].map((pct, index) => {
                            const thresholdVal = LEVEL_THRESHOLD * pct;
                            const isLit = currentLevelProgress >= thresholdVal;
                            return (
                                <div 
                                    key={index} 
                                    className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 transform z-10"
                                    style={{ left: `${pct * 100}%` }}
                                >
                                    <div className="flex flex-col items-center gap-0.5 md:gap-1">
                                        <div className={`flex h-4 w-4 md:h-8 md:w-8 items-center justify-center rounded-full border-[2px] md:border-[3px] transition-all duration-300 shadow-lg ${isLit ? 'bg-zzz-green border-zzz-black shadow-[0_0_15px_#ccff00]' : 'bg-zzz-card border-zzz-border'}`}>
                                            {isLit ? (
                                                <CheckCircle2 size={10} className="md:w-4 md:h-4 text-black" strokeWidth={3} />
                                            ) : (
                                                <Trophy size={8} className="md:w-[14px] md:h-[14px] text-zzz-dim" />
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* List Header */}
                <div className="mb-3 md:mb-5 flex flex-row items-center justify-between border-b border-zzz-border pb-2 gap-2 md:gap-0 flex-shrink-0">
                    <div className="flex items-end gap-4">
                        {currentTab === 'challenge' && challengeFilter !== 'all' ? (
                             <button 
                                onClick={() => setChallengeFilter('all')}
                                className="group flex items-end gap-2 transition-opacity hover:opacity-80"
                                title="点击返回四象限视图"
                             >
                                <h2 className="text-xl md:text-3xl font-black italic uppercase tracking-tight text-zzz-text drop-shadow-[2px_2px_0_black] cursor-pointer">
                                    {getTabLabel(currentTab)}
                                </h2>
                                <span className="hidden md:inline mb-1 rounded bg-zzz-card px-2 py-0.5 text-[9px] md:text-[10px] font-bold text-zzz-dim group-hover:bg-zzz-orange group-hover:text-black">
                                    ↩ 返回
                                </span>
                             </button>
                        ) : (
                            <h2 className="text-xl md:text-3xl font-black italic uppercase tracking-tight text-zzz-text drop-shadow-[2px_2px_0_var(--color-zzz-border)]">
                                {getTabLabel(currentTab)} <span className="hidden md:inline text-xs md:text-sm font-normal text-zzz-dim not-italic">/// {viewMode === 'list' ? 'LIST VIEW' : 'CALENDAR MODE'}</span>
                            </h2>
                        )}
                    </div>
                    
                    <div className="flex gap-2 items-center">
                        {currentTab === 'challenge' && (
                            <div className="flex gap-1 md:gap-2 mr-2 md:mr-4">
                                <button 
                                    onClick={() => setChallengeFilter('q1')} 
                                    className={`h-6 w-8 md:h-7 md:w-12 flex items-center justify-center rounded border transition-all ${challengeFilter === 'q1' ? 'bg-red-600 border-white shadow-[0_0_10px_red] scale-105' : 'bg-red-900/20 border-red-900/50 hover:bg-red-900/50 hover:border-red-500'}`} 
                                >
                                    <AlertTriangle size={12} className={`md:w-[14px] md:h-[14px] ${challengeFilter === 'q1' ? 'text-white' : 'text-red-500'}`} />
                                </button>
                                <button 
                                    onClick={() => setChallengeFilter('q2')} 
                                    className={`h-6 w-8 md:h-7 md:w-12 flex items-center justify-center rounded border transition-all ${challengeFilter === 'q2' ? 'bg-zzz-blue border-white shadow-[0_0_10px_#00ccff] scale-105' : 'bg-blue-900/20 border-blue-900/50 hover:bg-blue-900/50 hover:border-zzz-blue'}`} 
                                >
                                    <Calendar size={12} className={`md:w-[14px] md:h-[14px] ${challengeFilter === 'q2' ? 'text-black' : 'text-zzz-blue'}`} />
                                </button>
                                <button 
                                    onClick={() => setChallengeFilter('q3')} 
                                    className={`h-6 w-8 md:h-7 md:w-12 flex items-center justify-center rounded border transition-all ${challengeFilter === 'q3' ? 'bg-zzz-yellow border-white shadow-[0_0_10px_#ffcc00] scale-105' : 'bg-yellow-900/20 border-yellow-900/50 hover:bg-yellow-900/50 hover:border-zzz-yellow'}`} 
                                >
                                    <Zap size={12} className={`md:w-[14px] md:h-[14px] ${challengeFilter === 'q3' ? 'text-black' : 'text-zzz-yellow'}`} />
                                </button>
                                <button 
                                    onClick={() => setChallengeFilter('q4')} 
                                    className={`h-6 w-8 md:h-7 md:w-12 flex items-center justify-center rounded border transition-all ${challengeFilter === 'q4' ? 'bg-gray-500 border-white shadow-[0_0_10px_gray] scale-105' : 'bg-gray-900/30 border-gray-800 hover:bg-gray-800 hover:border-gray-500'}`} 
                                >
                                    <Archive size={12} className={`md:w-[14px] md:h-[14px] ${challengeFilter === 'q4' ? 'text-white' : 'text-gray-500'}`} />
                                </button>
                            </div>
                        )}

                        <button 
                            onClick={() => handleOpenAdd()}
                            className="group flex items-center gap-1 rounded-full border border-zzz-dim bg-zzz-black px-4 md:px-5 py-1 md:py-1.5 font-bold italic text-zzz-text shadow-md transition-all hover:border-zzz-green hover:bg-zzz-green hover:text-zzz-text-inv hover:shadow-[0_0_15px_#ccff00]"
                        >
                            <Plus size={14} className="md:w-4 md:h-4 transition-transform group-hover:rotate-90" /> <span className="text-xs md:text-sm">新增</span>
                        </button>
                    </div>
                </div>

                {/* Views */}
                <div className="flex-1 overflow-y-auto pr-1 md:pr-2 custom-scrollbar">
                    {currentTab === 'daily' && renderDailyContent()}
                    {currentTab === 'target' && renderGrid(data.target, 'target')}
                    {currentTab === 'training' && renderGrid(data.training, 'training')}
                    {currentTab === 'challenge' && renderChallengeContent()}
                </div>

            </div>
        </div>

        {/* Deploy Modal Overlay */}
        {deployItem && (
            <div className="absolute inset-0 z-[2000] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 px-4">
                <div className="w-full md:w-[400px] rounded-2xl border-2 border-zzz-blue bg-zzz-dark p-1 shadow-[0_0_30px_rgba(0,204,255,0.3)]">
                    <div className="rounded-xl border border-zzz-border bg-zzz-black p-4 md:p-6">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-xl font-black italic text-zzz-blue">部署确认</h3>
                            <button onClick={() => setDeployItem(null)} className="text-zzz-dim hover:text-zzz-text"><X size={20} /></button>
                        </div>
                        <p className="mb-6 text-sm text-zzz-dim">
                            正在部署 <span className="font-bold text-zzz-text">"{deployItem.title}"</span>。<br/>请选择目标执行时段：
                        </p>
                        <div className="grid grid-cols-1 gap-3">
                            {[
                                { id: 'morning', label: '上午', time: '06:00 - 12:00', color: 'text-yellow-500', border: 'hover:border-yellow-500' },
                                { id: 'afternoon', label: '下午', time: '12:00 - 18:00', color: 'text-orange-500', border: 'hover:border-orange-500' },
                                { id: 'evening', label: '晚上', time: '18:00 - 00:00', color: 'text-blue-500', border: 'hover:border-blue-500' }
                            ].map(opt => (
                                <button
                                    key={opt.id}
                                    onClick={() => confirmDeploy(opt.id as Block)}
                                    className={`group flex items-center justify-between rounded-lg border border-zzz-border bg-zzz-card px-4 py-3 transition-all hover:bg-zzz-dark ${opt.border}`}
                                >
                                    <span className={`font-black italic ${opt.color}`}>{opt.label}</span>
                                    <span className="font-mono text-xs text-zzz-dim group-hover:text-zzz-text">{opt.time}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        )}
        
        {/* Theme Selection Modal */}
        {isThemeModalOpen && (
            <div className="absolute inset-0 z-[3000] flex items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-200 px-4">
                <div className="w-full max-w-lg rounded-[20px] border-2 border-zzz-border bg-zzz-black shadow-[0_0_50px_rgba(0,0,0,0.5)] p-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4">
                        <button onClick={() => setThemeModalOpen(false)} className="text-zzz-dim hover:text-zzz-text"><X size={24} /></button>
                    </div>
                    
                    <div className="mb-8">
                        <h2 className="text-2xl font-black italic text-zzz-text mb-2 flex items-center gap-2">
                           <Palette className="text-zzz-orange" /> INTERFACE STYLE
                        </h2>
                        <p className="text-zzz-dim text-sm">Select your preferred neural interface aesthetic.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <button 
                           onClick={() => setCurrentTheme('default')}
                           className={`group flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all ${currentTheme === 'default' ? 'border-zzz-orange bg-zzz-dark' : 'border-zzz-border bg-zzz-panel hover:border-zzz-dim'}`}
                        >
                           <div className="h-16 w-full rounded bg-[#141414] border border-[#333] relative overflow-hidden shadow-inner">
                               <div className="absolute top-2 left-2 h-2 w-8 bg-[#ff5500]"></div>
                               <div className="absolute bottom-0 w-full h-1 bg-[#ccff00]"></div>
                           </div>
                           <div className="text-center">
                               <div className={`font-bold text-sm ${currentTheme === 'default' ? 'text-zzz-orange' : 'text-zzz-text'}`}>Retro-Hollow</div>
                               <div className="text-[10px] text-zzz-dim">Classic Interface</div>
                           </div>
                           {currentTheme === 'default' && <div className="absolute top-2 right-2 h-2 w-2 rounded-full bg-zzz-orange shadow-[0_0_5px_#ff5500]" />}
                        </button>

                        <button 
                           onClick={() => setCurrentTheme('light')}
                           className={`group flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all ${currentTheme === 'light' ? 'border-blue-500 bg-white' : 'border-zzz-border bg-zzz-panel hover:border-zzz-dim'}`}
                        >
                           <div className="h-16 w-full rounded bg-[#f5f5f5] border border-[#ccc] relative overflow-hidden shadow-inner">
                               <div className="absolute top-2 left-2 h-2 w-8 bg-[#0284c7]"></div>
                               <div className="absolute bottom-0 w-full h-1 bg-[#0284c7]"></div>
                           </div>
                           <div className="text-center">
                               <div className={`font-bold text-sm ${currentTheme === 'light' ? 'text-blue-600' : 'text-zzz-text'}`}>City Morning</div>
                               <div className="text-[10px] text-zzz-dim">Clean / Light</div>
                           </div>
                           {currentTheme === 'light' && <div className="absolute top-2 right-2 h-2 w-2 rounded-full bg-blue-500 shadow-[0_0_5px_blue]" />}
                        </button>

                        <button 
                           onClick={() => setCurrentTheme('future')}
                           className={`group flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all ${currentTheme === 'future' ? 'border-[#05d9e8] bg-[#050505]' : 'border-zzz-border bg-zzz-panel hover:border-zzz-dim'}`}
                        >
                           <div className="h-16 w-full rounded bg-[#000] border border-[#05d9e8] relative overflow-hidden shadow-[0_0_10px_rgba(5,217,232,0.2)]">
                               <div className="absolute top-2 left-2 h-2 w-8 bg-[#05d9e8]"></div>
                               <div className="absolute bottom-0 w-full h-0.5 bg-[#ff2a6d]"></div>
                           </div>
                           <div className="text-center">
                               <div className={`font-bold text-sm ${currentTheme === 'future' ? 'text-[#05d9e8]' : 'text-zzz-text'}`}>Ether Minimal</div>
                               <div className="text-[10px] text-zzz-dim">High Contrast</div>
                           </div>
                           {currentTheme === 'future' && <div className="absolute top-2 right-2 h-2 w-2 rounded-full bg-[#05d9e8] shadow-[0_0_5px_#05d9e8]" />}
                        </button>
                    </div>
                    
                    <div className="mt-8 flex justify-center">
                        <button 
                            onClick={() => setThemeModalOpen(false)}
                            className="rounded-full bg-zzz-text text-zzz-text-inv px-8 py-2 text-xs font-black italic hover:scale-105 transition-transform"
                        >
                            CONFIRM SELECTION
                        </button>
                    </div>
                </div>
            </div>
        )}

      </div>

      <EditModal 
        isOpen={isModalOpen}
        task={editingTask}
        type={editingType}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveTask}
      />

    </div>
  );
}

export default App;
