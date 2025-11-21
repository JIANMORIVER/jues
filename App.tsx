import React, { useState, useEffect } from 'react';
import { AppData, TabType, Task, Block } from './types';
import { INITIAL_DATA } from './constants';
import { CRTOverlay, Screw, SpiralBinding, SideTag } from './components/LayoutElements';
import { TaskCard } from './components/TaskCard';
import { EditModal } from './components/EditModal';
import { Plus, X, Zap, Calendar, Flame, AlertTriangle, Trash, CheckCircle2, ArrowRight, LayoutGrid, Star, Clock, Briefcase, Archive } from 'lucide-react';

// Helper types for Challenge Matrix
type ChallengeFilter = 'all' | 'q1' | 'q2' | 'q3' | 'q4';

function App() {
  const [data, setData] = useState<AppData>(INITIAL_DATA);
  const [currentTab, setCurrentTab] = useState<TabType>('daily');
  const [isSidebarVisible, setSidebarVisible] = useState(true);
  const [dailyFilter, setDailyFilter] = useState<'all' | Block>('all');
  const [challengeFilter, setChallengeFilter] = useState<ChallengeFilter>('all');
  
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
        setChallengeFilter('all'); // Reset filter when entering challenge tab
    }
  }, [currentTab]);

  // --- Handlers ---

  const handleToggleComplete = (item: Task, type: TabType) => {
    if (type === 'training') return;

    const newData = { ...data };
    const list = newData[type as keyof AppData] as Task[];
    const taskIndex = list.findIndex(t => t.id === item.id);
    
    if (taskIndex > -1) {
        const task = list[taskIndex];
        const wasCompleted = task.completed;
        task.completed = !wasCompleted;
        
        // Score logic
        const change = task.reward;
        if (!wasCompleted) {
            newData.score = Math.min(400, newData.score + change);
        } else {
            newData.score = Math.max(0, newData.score - change);
        }
    }
    setData(newData);
  };

  const handleDeleteTask = (item: Task, type: TabType) => {
      if (window.confirm(`确定要删除 "${item.title}" 吗?`)) {
          setData(prev => {
              // Securely update state by filtering the specific array
              const currentList = prev[type] as Task[];
              const updatedList = currentList.filter(t => t.id !== item.id);
              return {
                  ...prev,
                  [type]: updatedList
              };
          });
      }
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
    setEditingTask(item);
    setEditingType(type);
    setModalOpen(true);
  };

  const handleOpenAdd = () => {
    // Auto-set matrix values based on current filter if adding from challenge specific view
    let defaultImp = false;
    let defaultUrg = false;

    if (currentTab === 'challenge') {
        if (challengeFilter === 'q1') { defaultImp = true; defaultUrg = true; }
        if (challengeFilter === 'q2') { defaultImp = true; defaultUrg = false; }
        if (challengeFilter === 'q3') { defaultImp = false; defaultUrg = true; }
        if (challengeFilter === 'q4') { defaultImp = false; defaultUrg = false; }
    }

    const newItem: Task = {
        id: Date.now(),
        title: "",
        desc: "",
        reward: 50,
        completed: false,
        subtasks: [],
        block: "morning",
        time: "",
        importance: defaultImp,
        urgency: defaultUrg
    };
    setEditingTask(newItem);
    setEditingType(currentTab);
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
      if (window.confirm("确认清理今日已完成的行程吗？")) {
          setData(prev => {
              const activeTasks = prev.daily.filter(t => !t.completed);
              return {
                  ...prev,
                  daily: activeTasks
              };
          });
      }
  };

  const handleHorizontalWheel = (e: React.WheelEvent<HTMLDivElement>) => {
      if (e.deltaY !== 0) {
          e.currentTarget.scrollLeft += e.deltaY;
          // Stop propagation to prevent scrolling parents in some browsers/OS
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
                type={type}
                onEdit={() => handleOpenEdit(item, type)}
                onDelete={(t) => handleDeleteTask(t, type)}
                onAction={type === 'training' ? initiateDeploy : (t) => handleToggleComplete(t, type)}
            />
        ))}
    </div>
  );

  // Special render for Challenge Tab (Eisenhower Matrix)
  const renderChallengeContent = () => {
    // Group items
    const q1 = data.challenge.filter(t => t.importance && t.urgency);
    const q2 = data.challenge.filter(t => t.importance && !t.urgency);
    const q3 = data.challenge.filter(t => !t.importance && t.urgency);
    const q4 = data.challenge.filter(t => !t.importance && !t.urgency);

    // 1. ALL VIEW: Matrix Dashboard
    if (challengeFilter === 'all') {
        const renderQuadrant = (title: string, tasks: Task[], colorClass: string, borderColor: string, targetFilter: ChallengeFilter) => (
            <div className={`flex flex-col gap-2 md:gap-3 rounded-xl border-2 bg-[#111] p-2 md:p-3 ${borderColor} min-h-[130px] md:min-h-[200px] relative overflow-hidden group hover:bg-[#151515] transition-colors`}>
                {/* Clickable Overlay to drill down */}
                <div 
                    className="absolute inset-0 z-0 cursor-pointer" 
                    onClick={() => setChallengeFilter(targetFilter)}
                    title="点击查看完整列表"
                />

                <div className={`flex items-center justify-between border-b border-[#333] pb-1 md:pb-2 z-10 pointer-events-none mx-1`}>
                    <span className={`text-sm md:text-lg font-black italic uppercase ${colorClass}`}>{title}</span>
                    <span className="font-mono text-[9px] md:text-xs text-[#555]">{tasks.length} ITEMS</span>
                </div>
                
                {/* Horizontal Scroll Container */}
                <div 
                    className="flex flex-row gap-2 md:gap-3 overflow-x-auto pb-2 pt-1 z-10 relative no-scrollbar h-full items-start px-1"
                    onWheel={handleHorizontalWheel}
                >
                    {tasks.length === 0 && <div className="w-full py-6 md:py-8 text-center text-[10px] md:text-xs text-[#444] italic pointer-events-none">- 暂无项目 -</div>}
                    {tasks.map(item => (
                         <div key={item.id} className="shrink-0" onMouseEnter={(e) => e.stopPropagation()}>
                             <TaskCard 
                                item={item} 
                                type="challenge"
                                variant="compact" // Use compact variant for matrix view
                                onEdit={() => handleOpenEdit(item, 'challenge')}
                                onDelete={(t) => handleDeleteTask(t, 'challenge')}
                                onAction={(t) => handleToggleComplete(t, 'challenge')}
                            />
                         </div>
                    ))}
                    {/* Spacer for padding right */}
                    <div className="w-2 shrink-0"></div>
                </div>
            </div>
        );

        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 pb-10 h-full overflow-y-auto custom-scrollbar">
                {renderQuadrant("I. 重要且紧急", q1, "text-red-500", "border-red-900/40 hover:border-red-500/30", "q1")}
                {renderQuadrant("II. 重要不紧急", q2, "text-zzz-blue", "border-blue-900/40 hover:border-blue-500/30", "q2")}
                {renderQuadrant("III. 紧急不重要", q3, "text-zzz-yellow", "border-yellow-900/40 hover:border-yellow-500/30", "q3")}
                {renderQuadrant("IV. 不重要不紧急", q4, "text-gray-500", "border-gray-800 hover:border-gray-600", "q4")}
            </div>
        );
    }

    // 2. INDIVIDUAL QUADRANT VIEW
    let itemsToRender: Task[] = [];
    let filterTitle = "";
    
    if (challengeFilter === 'q1') { itemsToRender = q1; filterTitle = "I. 重要且紧急"; }
    if (challengeFilter === 'q2') { itemsToRender = q2; filterTitle = "II. 重要不紧急"; }
    if (challengeFilter === 'q3') { itemsToRender = q3; filterTitle = "III. 紧急不重要"; }
    if (challengeFilter === 'q4') { itemsToRender = q4; filterTitle = "IV. 不重要不紧急"; }

    return (
        <div className="flex flex-col h-full pb-5 animate-in fade-in slide-in-from-right-4 duration-300">
             <div className="mb-4 flex items-center gap-2 text-sm font-bold text-[#666] bg-[#111] p-2 rounded border border-[#222]">
                <LayoutGrid size={14} className="cursor-pointer hover:text-white" onClick={() => setChallengeFilter('all')} />
                <span>/</span>
                <span className="text-white">{filterTitle}</span>
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

  const getBlockName = (block: Block) => {
      const names: Record<Block, string> = {
          morning: "上午 (06:00 - 12:00)",
          afternoon: "下午 (12:00 - 18:00)",
          evening: "晚上 (18:00 - 00:00)"
      };
      return names[block];
  }

  const getTabStyles = (tab: TabType, isActive: boolean) => {
      const baseStyles = "relative rounded-t-xl border-2 border-b-0 border-black px-4 md:px-8 py-2 md:py-3 text-sm md:text-lg font-black italic uppercase transition-all flex-shrink-0";
      
      if (!isActive) {
          return `${baseStyles} h-[40px] md:h-[48px] bg-[#333] text-[#888] hover:text-white`;
      }
      
      // Active styles per tab
      const activeMap: Record<TabType, string> = {
          daily: 'z-10 h-[48px] md:h-[55px] bg-zzz-yellow text-[#111] shadow-[0_-4px_15px_rgba(255,204,0,0.3)]',
          target: 'z-10 h-[48px] md:h-[55px] bg-zzz-green text-[#111] shadow-[0_-4px_15px_rgba(204,255,0,0.3)]',
          training: 'z-10 h-[48px] md:h-[55px] bg-zzz-blue text-[#111] shadow-[0_-4px_15px_rgba(0,204,255,0.3)]',
          challenge: 'z-10 h-[48px] md:h-[55px] bg-red-600 text-white shadow-[0_-4px_15px_rgba(255,0,0,0.3)]'
      };
      
      return `${baseStyles} ${activeMap[tab]}`;
  };

  return (
    <div className="flex h-[100dvh] w-full flex-col md:h-screen md:items-center md:justify-center bg-zzz-black p-0 md:p-4 bg-[radial-gradient(circle_at_center,#222_0%,#000_100%)] text-white">
      <CRTOverlay />

      {/* Main Device Container */}
      <div className="relative flex h-full w-full md:max-h-[680px] md:max-w-[1050px] flex-col rounded-none border-0 md:rounded-[30px] md:border-4 md:border-[#111] bg-zzz-dark p-2 md:p-3 md:shadow-[0_0_0_4px_#2a2a2a,0_0_60px_black] bg-grid-pattern">
        
        {/* Decorative Screws */}
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

            {/* Mobile Utility Buttons (Placed adjacent to tabs) */}
            <div className="md:hidden flex items-center gap-1 ml-2 pb-1 relative">
               <div className="relative">
                  <button 
                      onClick={handleBatteryClick}
                      className="flex h-[40px] w-[40px] items-center justify-center rounded-full border-2 border-black bg-[#222] text-white shadow-[0_4px_0_#000] active:translate-y-1 active:shadow-none"
                  >
                      <Zap size={18} className="fill-currentColor text-white hover:text-zzz-green transition-colors" />
                  </button>
                  {/* Battery Toasts */}
                  {batteryToasts.map((toast) => (
                      <div 
                          key={toast.id}
                          className="absolute right-0 -bottom-10 pointer-events-none animate-out fade-out slide-out-to-bottom-4 duration-1000 whitespace-nowrap font-black italic text-zzz-green text-sm bg-black px-2 py-1 rounded border border-zzz-green shadow-[0_0_10px_#ccff00] z-50"
                      >
                          电量+1
                      </div>
                  ))}
               </div>
               
               <button className="flex h-[40px] w-[40px] items-center justify-center rounded-full border-2 border-black bg-[#a33] text-white shadow-[0_4px_0_#000] active:translate-y-1 active:shadow-none">
                  <X size={22} strokeWidth={3} />
               </button>
            </div>
          </div>

          {/* Desktop Utility Buttons (Right Aligned) */}
          <div className="hidden md:flex mb-2.5 items-center gap-3 ml-auto relative">
             <div className="flex items-center gap-2 rounded-full border-2 border-[#333] bg-black px-4 py-1.5 shadow-inner">
                <AlertTriangle size={14} className="text-zzz-yellow" />
                <span className="text-sm font-bold text-[#aaa]">待办: {data.daily.filter(t=>!t.completed).length}</span>
             </div>
             
             <div className="relative">
                <button 
                    onClick={handleBatteryClick}
                    className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-black bg-[#222] text-white shadow-[0_4px_0_#000] transition-all hover:text-zzz-green active:translate-y-1 active:shadow-none"
                >
                    <Zap size={20} fill="currentColor" />
                </button>
                {/* Desktop Battery Toasts */}
                {batteryToasts.map((toast) => (
                    <div 
                        key={toast.id}
                        className="absolute right-0 -top-8 pointer-events-none animate-out fade-out slide-out-to-top-4 duration-1000 whitespace-nowrap font-black italic text-zzz-green text-sm bg-black px-2 py-1 rounded border border-zzz-green shadow-[0_0_10px_#ccff00]"
                    >
                        电量+1
                    </div>
                ))}
             </div>

             <button className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-black bg-[#a33] text-white shadow-[0_4px_0_#000] transition-all hover:bg-[#f44] active:translate-y-1 active:shadow-none">
                <X size={24} strokeWidth={3} />
             </button>
          </div>
        </div>

        {/* Main Body Area */}
        <div className="relative flex flex-1 flex-col md:flex-row overflow-hidden rounded-none md:rounded-b-[20px] border-t-2 md:border-3 border-black bg-zzz-panel shadow-none md:shadow-[inset_0_0_50px_rgba(0,0,0,0.8)]">
            
            {/* Sidebar (Hidden on Mobile) */}
            <div className={`hidden md:flex relative z-20 w-[220px] flex-col gap-3 pt-[40px] transition-all duration-300 ${isSidebarVisible ? 'translate-x-0 opacity-100' : '-translate-x-[100px] opacity-0 w-0 overflow-hidden'}`}>
                
                <SideTag active={isSidebarVisible} />
                <SpiralBinding />
                
                {/* Sidebar Menu Group */}
                <div className="ml-[45px] mt-4 flex flex-col gap-2 pr-2">
                    {/* Main Schedule Button */}
                    <div 
                        onClick={() => { setCurrentTab('daily'); setDailyFilter('all'); }}
                        className={`group relative flex cursor-pointer items-center gap-3 overflow-hidden rounded-r-lg border-l-4 p-3 transition-all
                        ${currentTab === 'daily' && dailyFilter === 'all' 
                            ? 'border-zzz-orange bg-gradient-to-r from-white/10 to-transparent' 
                            : 'border-transparent hover:bg-white/5'}`}
                    >
                        <Calendar size={20} className={`${currentTab === 'daily' && dailyFilter === 'all' ? 'text-zzz-orange' : 'text-[#666] group-hover:text-[#999]'}`} />
                        <span className={`text-lg font-black italic tracking-wide ${currentTab === 'daily' && dailyFilter === 'all' ? 'text-white' : 'text-[#666] group-hover:text-[#ccc]'}`}>
                            行程安排
                        </span>
                        {/* Decorative Tech Line */}
                        {currentTab === 'daily' && dailyFilter === 'all' && (
                            <div className="absolute bottom-0 right-0 h-[2px] w-1/2 bg-zzz-orange shadow-[0_0_5px_#ff5500]" />
                        )}
                    </div>

                    {/* Submenu Items */}
                    <div className={`flex flex-col gap-1 transition-all duration-300 ${currentTab === 'daily' ? 'opacity-100' : 'opacity-50'}`}>
                        <div className="ml-6 flex flex-col border-l-2 border-[#333] pl-4 pt-2 space-y-2">
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
                                        }}
                                        className={`group relative flex cursor-pointer items-center justify-between rounded-md px-3 py-2 transition-all
                                        ${isActive 
                                            ? 'bg-[#1a1a1a] shadow-[inset_2px_0_0_#ccff00]' 
                                            : 'hover:bg-[#111]'}`}
                                    >
                                        <div className="flex flex-col">
                                            <span className={`text-sm font-black italic ${isActive ? 'text-zzz-green' : 'text-[#666] group-hover:text-[#aaa]'}`}>
                                                {item.label}
                                            </span>
                                            <span className="text-[10px] font-mono text-[#444]">{item.icon}</span>
                                        </div>
                                        
                                        {isActive && <ArrowRight size={12} className="text-zzz-green animate-pulse" />}
                                        
                                        {/* Hover Indicator */}
                                        <div className={`absolute left-0 top-1/2 h-1 w-1 -translate-x-[19px] -translate-y-1/2 rounded-full transition-colors ${isActive ? 'bg-zzz-green shadow-[0_0_5px_#ccff00]' : 'bg-[#333] group-hover:bg-[#666]'}`} />
                                    </div>
                                );
                             })}
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex flex-1 flex-col overflow-hidden px-2 py-2 md:px-[30px] md:py-[20px]">
                
                {/* Mobile Filter Bar for Daily Tab */}
                {currentTab === 'daily' && (
                    <div className="md:hidden flex gap-2 mb-2 overflow-x-auto pb-2 no-scrollbar flex-shrink-0">
                        <button
                            onClick={() => setDailyFilter('all')}
                            className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-bold border transition-all ${dailyFilter === 'all' ? 'bg-zzz-orange text-white border-zzz-orange' : 'bg-[#111] text-[#666] border-[#333]'}`}
                        >
                            全部行程
                        </button>
                         {[
                            { key: 'morning', label: '上午' },
                            { key: 'afternoon', label: '下午' },
                            { key: 'evening', label: '晚上' }
                         ].map((item) => (
                            <button
                                key={item.key}
                                onClick={() => setDailyFilter(item.key as Block)}
                                className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-bold border transition-all ${dailyFilter === item.key ? 'bg-zzz-green text-black border-zzz-green' : 'bg-[#111] text-[#666] border-[#333]'}`}
                            >
                                {item.label}
                            </button>
                         ))}
                    </div>
                )}
                
                {/* Progress Section */}
                <div className="mb-3 md:mb-5 rounded-xl md:rounded-2xl border-2 border-[#333] bg-[#111] p-3 md:p-5 shadow-inner flex-shrink-0">
                    <div className="mb-1 md:mb-2 flex items-end justify-between">
                        <div className="text-[10px] md:text-xs font-bold text-[#888]">今日最大活跃度</div>
                        <div className="text-lg md:text-2xl font-black italic text-white">
                            <span className="text-zzz-orange">🔥</span> {data.score}
                        </div>
                    </div>
                    
                    {/* Aligned Progress Bar */}
                    <div className="relative mb-4 md:mb-6 mt-3 md:mt-6 h-2 md:h-3 w-full rounded-full border border-[#333] bg-[#000]">
                        {/* Fill */}
                        <div 
                            className="relative h-full rounded-full bg-zzz-green shadow-[0_0_10px_#ccff00] transition-all duration-500 ease-out"
                            style={{ width: `${Math.min(100, (data.score / 400) * 100)}%` }}
                        >
                             <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_4px,rgba(0,0,0,0.1)_4px,rgba(0,0,0,0.1)_8px)]" />
                        </div>

                        {/* Nodes */}
                        {[100, 200, 300, 400].map(val => {
                            const pct = (val / 400) * 100;
                            const reached = data.score >= val;
                            return (
                                <div 
                                    key={val} 
                                    className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 transform z-10"
                                    style={{ left: `${pct}%` }}
                                >
                                    <div className="flex flex-col items-center gap-0.5 md:gap-1">
                                        <div className={`flex h-4 w-4 md:h-8 md:w-8 items-center justify-center rounded-full border-[2px] md:border-[3px] transition-all duration-300 shadow-lg ${reached ? 'bg-zzz-green border-[#111] shadow-[0_0_15px_#ccff00]' : 'bg-[#1a1a1a] border-[#333]'}`}>
                                            {reached ? (
                                                <CheckCircle2 size={10} className="md:w-4 md:h-4 text-black" strokeWidth={3} />
                                            ) : (
                                                <Flame size={8} className="md:w-[14px] md:h-[14px] text-[#444] fill-[#444]" />
                                            )}
                                        </div>
                                        <span className={`absolute -bottom-4 md:-bottom-6 font-mono text-[8px] md:text-[10px] font-bold tracking-wider ${reached ? 'text-zzz-green' : 'text-[#444]'}`}>
                                            {val}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* List Header */}
                <div className="mb-3 md:mb-5 flex flex-row items-center justify-between border-b border-[#222] pb-2 gap-2 md:gap-0 flex-shrink-0">
                    <div className="flex items-end gap-4">
                        {/* Title Logic: Click title to return to matrix if in challenge tab */}
                        {currentTab === 'challenge' && challengeFilter !== 'all' ? (
                             <button 
                                onClick={() => setChallengeFilter('all')}
                                className="group flex items-end gap-2 transition-opacity hover:opacity-80"
                                title="点击返回四象限视图"
                             >
                                <h2 className="text-xl md:text-3xl font-black italic uppercase tracking-tight text-white drop-shadow-[2px_2px_0_black] cursor-pointer">
                                    {getTabLabel(currentTab)}
                                </h2>
                                <span className="hidden md:inline mb-1 rounded bg-[#333] px-2 py-0.5 text-[9px] md:text-[10px] font-bold text-[#999] group-hover:bg-zzz-orange group-hover:text-black">
                                    ↩ 返回
                                </span>
                             </button>
                        ) : (
                            <h2 className="text-xl md:text-3xl font-black italic uppercase tracking-tight text-white drop-shadow-[2px_2px_0_black]">
                                {getTabLabel(currentTab)} <span className="hidden md:inline text-xs md:text-sm font-normal text-[#666] not-italic">/// LIST VIEW</span>
                            </h2>
                        )}
                    </div>
                    
                    <div className="flex gap-2 items-center">
                        {/* Quadrant Controls (Only for Challenge) */}
                        {currentTab === 'challenge' && (
                            <div className="flex gap-1 md:gap-2 mr-2 md:mr-4">
                                <button 
                                    onClick={() => setChallengeFilter('q1')} 
                                    className={`h-6 w-8 md:h-7 md:w-12 flex items-center justify-center rounded border transition-all ${challengeFilter === 'q1' ? 'bg-red-600 border-white shadow-[0_0_10px_red] scale-105' : 'bg-red-900/20 border-red-900/50 hover:bg-red-900/50 hover:border-red-500'}`} 
                                    title="重要且紧急"
                                >
                                    <AlertTriangle size={12} className={`md:w-[14px] md:h-[14px] ${challengeFilter === 'q1' ? 'text-white' : 'text-red-500'}`} />
                                </button>
                                
                                <button 
                                    onClick={() => setChallengeFilter('q2')} 
                                    className={`h-6 w-8 md:h-7 md:w-12 flex items-center justify-center rounded border transition-all ${challengeFilter === 'q2' ? 'bg-zzz-blue border-white shadow-[0_0_10px_#00ccff] scale-105' : 'bg-blue-900/20 border-blue-900/50 hover:bg-blue-900/50 hover:border-zzz-blue'}`} 
                                    title="重要不紧急"
                                >
                                    <Calendar size={12} className={`md:w-[14px] md:h-[14px] ${challengeFilter === 'q2' ? 'text-black' : 'text-zzz-blue'}`} />
                                </button>

                                <button 
                                    onClick={() => setChallengeFilter('q3')} 
                                    className={`h-6 w-8 md:h-7 md:w-12 flex items-center justify-center rounded border transition-all ${challengeFilter === 'q3' ? 'bg-zzz-yellow border-white shadow-[0_0_10px_#ffcc00] scale-105' : 'bg-yellow-900/20 border-yellow-900/50 hover:bg-yellow-900/50 hover:border-zzz-yellow'}`} 
                                    title="紧急不重要"
                                >
                                    <Zap size={12} className={`md:w-[14px] md:h-[14px] ${challengeFilter === 'q3' ? 'text-black' : 'text-zzz-yellow'}`} />
                                </button>

                                <button 
                                    onClick={() => setChallengeFilter('q4')} 
                                    className={`h-6 w-8 md:h-7 md:w-12 flex items-center justify-center rounded border transition-all ${challengeFilter === 'q4' ? 'bg-gray-500 border-white shadow-[0_0_10px_gray] scale-105' : 'bg-gray-900/30 border-gray-800 hover:bg-gray-800 hover:border-gray-500'}`} 
                                    title="不重要不紧急"
                                >
                                    <Archive size={12} className={`md:w-[14px] md:h-[14px] ${challengeFilter === 'q4' ? 'text-white' : 'text-gray-500'}`} />
                                </button>
                            </div>
                        )}

                        <button 
                            onClick={handleOpenAdd}
                            className="group flex items-center gap-1 rounded-full border border-[#555] bg-[#111] px-4 md:px-5 py-1 md:py-1.5 font-bold italic text-white shadow-md transition-all hover:border-zzz-green hover:bg-zzz-green hover:text-black hover:shadow-[0_0_15px_#ccff00]"
                        >
                            <Plus size={14} className="md:w-4 md:h-4 transition-transform group-hover:rotate-90" /> <span className="text-xs md:text-sm">新增</span>
                        </button>
                    </div>
                </div>

                {/* Views */}
                <div className="flex-1 overflow-y-auto pr-1 md:pr-2 custom-scrollbar">
                    {currentTab === 'daily' && (
                        <div className="pb-10">
                            {(['morning', 'afternoon', 'evening'] as Block[])
                                .filter(block => dailyFilter === 'all' || dailyFilter === block)
                                .map(block => {
                                    const tasks = data.daily.filter(t => t.block === block);
                                    return (
                                        <div key={block} className="mb-6 md:mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                            <div className="mb-2 md:mb-3 flex items-center gap-2 border-b border-[#222] pb-1">
                                                <div className={`h-1.5 w-1.5 md:h-2 md:w-2 rounded-sm ${block === 'morning' ? 'bg-yellow-500' : block === 'afternoon' ? 'bg-orange-500' : 'bg-blue-500'}`} />
                                                <div className="text-[10px] md:text-xs font-black tracking-widest text-[#666]">
                                                    {getBlockName(block).toUpperCase()}
                                                </div>
                                            </div>
                                            
                                            {tasks.length === 0 ? (
                                                <div className="flex h-16 md:h-24 items-center justify-center rounded-xl border-2 border-dashed border-[#222] bg-[#0a0a0a] text-[10px] md:text-xs font-bold text-[#333]">
                                                    - 空闲 -
                                                </div>
                                            ) : (
                                                renderGrid(tasks, 'daily')
                                            )}
                                        </div>
                                    );
                            })}

                            {/* Clear Completed Button */}
                            <div className="mt-4 flex justify-center">
                                <button 
                                    onClick={handleClearCompletedDaily}
                                    className="flex w-full max-w-sm items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#333] bg-[#080808] py-3 text-xs font-bold text-[#555] transition-all hover:border-red-900 hover:bg-red-950/20 hover:text-red-500"
                                >
                                    <Trash size={14} /> 清理今日已完成事项
                                </button>
                            </div>
                        </div>
                    )}

                    {currentTab === 'target' && renderGrid(data.target, 'target')}
                    
                    {currentTab === 'training' && renderGrid(data.training, 'training')}

                    {currentTab === 'challenge' && renderChallengeContent()}
                </div>

            </div>
        </div>

        {/* Deploy Modal Overlay */}
        {deployItem && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 px-4">
                <div className="w-full md:w-[400px] rounded-2xl border-2 border-zzz-blue bg-[#111] p-1 shadow-[0_0_30px_rgba(0,204,255,0.3)]">
                    <div className="rounded-xl border border-[#222] bg-[#080808] p-4 md:p-6">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-xl font-black italic text-zzz-blue">部署确认</h3>
                            <button onClick={() => setDeployItem(null)} className="text-[#666] hover:text-white"><X size={20} /></button>
                        </div>
                        <p className="mb-6 text-sm text-[#888]">
                            正在部署 <span className="font-bold text-white">"{deployItem.title}"</span>。<br/>请选择目标执行时段：
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
                                    className={`group flex items-center justify-between rounded-lg border border-[#333] bg-[#111] px-4 py-3 transition-all hover:bg-[#1a1a1a] ${opt.border}`}
                                >
                                    <span className={`font-black italic ${opt.color}`}>{opt.label}</span>
                                    <span className="font-mono text-xs text-[#555] group-hover:text-white">{opt.time}</span>
                                </button>
                            ))}
                        </div>
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