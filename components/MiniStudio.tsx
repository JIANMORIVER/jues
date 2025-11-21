
import React, { useState, useEffect, useRef } from 'react';
import { Task, Block } from '../types';
import { X, Power, Zap, Activity,  Menu, Disc, Volume2, Radio, CloudRain, Flame } from 'lucide-react';

interface MiniStudioProps {
  tasks: Task[];
  onClose: () => void;
  onToggleTask: (task: Task) => void;
}

// --- Advanced Audio Engine ---

class SoundEngine {
  ctx: AudioContext | null = null;
  activeNodes: AudioNode[] = [];
  activeType: 'rain' | 'fire' | null = null;

  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
        this.ctx.resume();
    }
  }

  stop() {
    this.activeNodes.forEach(node => {
      try {
        if (node instanceof AudioBufferSourceNode || node instanceof OscillatorNode) {
            node.stop();
        }
        node.disconnect();
      } catch (e) { /* ignore */ }
    });
    this.activeNodes = [];
    this.activeType = null;
  }

  // Helper: Create buffer of noise
  createNoiseBuffer(type: 'white' | 'pink' | 'brown') {
    if (!this.ctx) return null;
    const bufferSize = 2 * this.ctx.sampleRate;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = buffer.getChannelData(0);

    if (type === 'white') {
        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }
    } else if (type === 'pink') {
        let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
        for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            b0 = 0.99886 * b0 + white * 0.0555179;
            b1 = 0.99332 * b1 + white * 0.0750759;
            b2 = 0.96900 * b2 + white * 0.1538520;
            b3 = 0.86650 * b3 + white * 0.3104856;
            b4 = 0.55000 * b4 + white * 0.5329522;
            b5 = -0.7616 * b5 - white * 0.0168980;
            output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
            output[i] *= 0.11; 
            b6 = white * 0.115926;
        }
    } else if (type === 'brown') {
        let lastOut = 0;
        for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            output[i] = (lastOut + (0.02 * white)) / 1.02;
            lastOut = output[i];
            output[i] *= 3.5; 
        }
    }
    return buffer;
  }

  play(type: 'rain' | 'fire') {
    this.init();
    if (!this.ctx) return;

    if (this.activeType === type) {
      this.stop();
      return;
    }

    this.stop();
    this.activeType = type;
    const ctx = this.ctx;
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0, ctx.currentTime);
    masterGain.gain.linearRampToValueAtTime(0.4, ctx.currentTime + 0.5);
    masterGain.connect(ctx.destination);
    this.activeNodes.push(masterGain);

    if (type === 'rain') {
        // 1. Rain Base (Pink Noise)
        const buffer = this.createNoiseBuffer('pink');
        if (buffer) {
            const source = ctx.createBufferSource();
            source.buffer = buffer;
            source.loop = true;
            const filter = ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.value = 600; // Dampen it
            source.connect(filter);
            filter.connect(masterGain);
            source.start();
            this.activeNodes.push(source, filter);
        }
        
        // 2. High Rain (White Noise layer for sizzle)
        const whiteBuffer = this.createNoiseBuffer('white');
        if (whiteBuffer) {
            const source = ctx.createBufferSource();
            source.buffer = whiteBuffer;
            source.loop = true;
            const filter = ctx.createBiquadFilter();
            filter.type = 'highpass';
            filter.frequency.value = 3000;
            const gain = ctx.createGain();
            gain.gain.value = 0.05;
            source.connect(filter);
            filter.connect(gain);
            gain.connect(masterGain);
            source.start();
            this.activeNodes.push(source, filter, gain);
        }
    } 
    else if (type === 'fire') {
        // 1. Fire Rumble (Brown Noise)
        const rumbleBuffer = this.createNoiseBuffer('brown');
        if (rumbleBuffer) {
            const rumbleSource = ctx.createBufferSource();
            rumbleSource.buffer = rumbleBuffer;
            rumbleSource.loop = true;
            const rumbleFilter = ctx.createBiquadFilter();
            rumbleFilter.type = 'lowpass';
            rumbleFilter.frequency.value = 150; // Deep rumble
            const rumbleGain = ctx.createGain();
            rumbleGain.gain.value = 0.8;

            rumbleSource.connect(rumbleFilter);
            rumbleFilter.connect(rumbleGain);
            rumbleGain.connect(masterGain);
            rumbleSource.start();
            this.activeNodes.push(rumbleSource, rumbleFilter, rumbleGain);
        }

        // 2. Crackling (Random Impulses)
        // Generate a buffer with sparse, random high-amplitude spikes
        const bufferSize = 3 * ctx.sampleRate;
        const crackleBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = crackleBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            // 0.05% chance of a click per sample roughly
            if (Math.random() > 0.9992) {
                data[i] = (Math.random() * 2 - 1) * 0.9;
            } else {
                data[i] = 0;
            }
        }
        const crackleSource = ctx.createBufferSource();
        crackleSource.buffer = crackleBuffer;
        crackleSource.loop = true;
        
        // Filter to sound like snapping wood (Highpass + Bandpass combo or just Highpass)
        const crackleFilter = ctx.createBiquadFilter();
        crackleFilter.type = 'highpass';
        crackleFilter.frequency.value = 800;
        
        crackleSource.connect(crackleFilter);
        crackleFilter.connect(masterGain);
        crackleSource.start();
        this.activeNodes.push(crackleSource, crackleFilter);
    }
  }
}

const engine = new SoundEngine();

// --- Components ---

const Screw: React.FC<{ className?: string }> = ({ className }) => (
    <div className={`h-3 w-3 rounded-full bg-[#333] shadow-[inset_0_1px_2px_rgba(0,0,0,0.8),0_1px_0_rgba(255,255,255,0.2)] flex items-center justify-center ${className}`}>
        <div className="w-1.5 h-[2px] bg-[#111] rotate-45"></div>
        <div className="w-[2px] h-1.5 bg-[#111] rotate-45 absolute"></div>
    </div>
);

const Knob: React.FC<{ label: string, value?: number, color?: string }> = ({ label, value = 0, color = "bg-[#d1d1d1]" }) => (
    <div className="flex flex-col items-center gap-1">
        <div className={`relative w-12 h-12 rounded-full ${color} shadow-[0_4px_6px_rgba(0,0,0,0.4),inset_0_2px_4px_rgba(255,255,255,0.5)] flex items-center justify-center cursor-pointer group active:scale-95 transition-transform`}>
            <div className="absolute inset-0 rounded-full border border-black/10"></div>
            {/* Indicator */}
            <div 
                className="absolute w-1 h-4 bg-black/80 top-1 rounded-full shadow-[0_0_2px_rgba(0,0,0,0.5)] transition-transform duration-500"
                style={{ transform: `rotate(${value * 3.6}deg)`, transformOrigin: '50% 22px' }}
            />
            {/* Grip Texture */}
            <div className="absolute inset-0 rounded-full border-[4px] border-dashed border-black/5 opacity-50"></div>
        </div>
        <span className="text-[8px] font-black text-[#555] uppercase tracking-wider">{label}</span>
    </div>
);

export const MiniStudio: React.FC<MiniStudioProps> = ({ tasks, onClose, onToggleTask }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeNoise, setActiveNoise] = useState<'rain' | 'fire' | null>(null);
  const [bootSequence, setBootSequence] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    setTimeout(() => setBootSequence(false), 800);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    return () => engine.stop();
  }, []);

  const handleNoiseToggle = (type: 'rain' | 'fire') => {
    engine.play(type);
    setActiveNoise(engine.activeType);
  };

  const getBlock = (d: Date): Block => {
    const h = d.getHours();
    if (h < 12) return 'morning';
    if (h < 18) return 'afternoon';
    return 'evening';
  };

  const currentBlock = getBlock(currentTime);
  const filteredTasks = tasks.filter(t => {
      if (t.block) return t.block === currentBlock;
      if (t.time) {
          const th = new Date(t.time).getHours();
          const tb = (th < 12) ? 'morning' : (th < 18 ? 'afternoon' : 'evening');
          return tb === currentBlock;
      }
      return false; 
  });

  const noiseButtons = [
    { id: 'rain', label: 'RAIN-01', icon: <CloudRain size={20} /> },
    { id: 'fire', label: 'EMBERS', icon: <Flame size={20} /> },
  ];

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-300 p-4">
      
      {/* MAIN CHASSIS */}
      <div className="relative w-[420px] h-[720px] bg-[#e0ddd5] rounded-[20px] shadow-[0_0_0_1px_#1a1a1a,0_30px_80px_rgba(0,0,0,1)] flex flex-col overflow-hidden select-none font-sans">
        
        {/* INTEGRATED POWER/EXIT BUTTON */}
        <button 
            onClick={onClose}
            className="absolute top-5 right-5 z-50 w-10 h-10 bg-[#2a2a2a] rounded border-2 border-[#444] shadow-[0_3px_0_#000] active:translate-y-[2px] active:shadow-none flex items-center justify-center group hover:bg-[#333] transition-colors"
            title="Power Off / Exit"
        >
            <Power size={18} className="text-[#666] group-hover:text-red-500 transition-colors" />
        </button>

        {/* TOP HOUSING */}
        <div className="h-[280px] bg-[#2a2a2a] m-4 mb-0 rounded-t-[10px] rounded-b-[4px] p-4 relative shadow-[inset_0_0_20px_rgba(0,0,0,1)] border-b-4 border-[#111]">
             {/* Industrial details */}
             <Screw className="absolute top-3 left-3" />
             <Screw className="absolute top-3 right-14" />
             <div className="absolute top-3 left-1/2 -translate-x-1/2 w-20 h-2 bg-[#111] rounded-full"></div>

             {/* SCREEN BEZEL */}
             <div className="h-full w-full bg-[#000] rounded-[4px] border-[6px] border-[#333] shadow-[0_0_0_1px_#555] relative overflow-hidden flex flex-col">
                {/* SCREEN GLARE */}
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none z-20"></div>
                
                {/* CRT CONTENT */}
                <div className={`flex-1 bg-[#0a0800] p-4 font-pixel text-[#ffaa00] relative flex flex-col ${bootSequence ? 'items-center justify-center' : ''}`}>
                    {/* Scanlines */}
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px] pointer-events-none z-10" />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_50%,rgba(0,0,0,0.8)_120%)] pointer-events-none z-10" />
                    
                    {bootSequence ? (
                        <div className="text-center animate-pulse">
                            <div className="text-2xl font-bold mb-2">SYSTEM BOOT</div>
                            <div className="text-xs">INITIALIZING AUDIO CORE...</div>
                        </div>
                    ) : (
                        <>
                            {/* Header */}
                            <div className="flex justify-between items-end border-b border-[#ffaa00]/40 pb-1 mb-2 shrink-0">
                                <div>
                                    <div className="text-[10px] tracking-[0.2em] opacity-70">CURRENT TIME</div>
                                    <div className="text-3xl leading-none font-bold drop-shadow-[0_0_8px_rgba(255,170,0,0.6)]">
                                        {currentTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                    </div>
                                </div>
                                <div className="text-right pr-8">
                                    <div className="text-[10px] tracking-[0.2em] opacity-70">{currentBlock.toUpperCase()} BLOCK</div>
                                    <div className="text-sm bg-[#ffaa00] text-black px-1 font-bold inline-block">
                                        ACT: {filteredTasks.length - filteredTasks.filter(t=>t.completed).length}
                                    </div>
                                </div>
                            </div>

                            {/* Task List */}
                            <div className="flex-1 overflow-y-auto no-scrollbar relative space-y-2 py-1">
                                {filteredTasks.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-[#ffaa00]/50">
                                        <div className="text-4xl mb-2">--:--</div>
                                        <div className="text-xs tracking-widest">NO ACTIVE PROTOCOLS</div>
                                    </div>
                                ) : (
                                    filteredTasks.map(task => (
                                        <div 
                                            key={task.id} 
                                            onClick={() => onToggleTask(task)}
                                            className={`group flex items-start gap-2 cursor-pointer hover:bg-[#ffaa00]/20 p-1 transition-colors ${task.completed ? 'opacity-40' : ''}`}
                                        >
                                            <div className={`mt-[3px] w-2 h-2 border border-[#ffaa00] flex items-center justify-center shrink-0 ${task.completed ? 'bg-[#ffaa00]' : ''}`} />
                                            <div className={`text-sm leading-tight uppercase tracking-wide ${task.completed ? 'line-through' : ''}`}>
                                                {task.title}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Footer Visualizer Simulation */}
                            <div className="mt-2 h-8 border-t border-[#ffaa00]/40 pt-1 flex items-end justify-between gap-[2px] opacity-80">
                                {Array.from({length: 20}).map((_, i) => (
                                    <div 
                                        key={i} 
                                        className="w-full bg-[#ffaa00] transition-all duration-100"
                                        style={{ 
                                            height: activeNoise ? `${Math.random() * 100}%` : '5%',
                                            opacity: activeNoise ? 1 : 0.3 
                                        }} 
                                    />
                                ))}
                            </div>
                        </>
                    )}
                </div>
             </div>
        </div>

        {/* MID CONTROL DECK */}
        <div className="bg-[#dcd9d2] flex-1 p-6 pt-8 relative flex flex-col gap-8">
             {/* Decorative Panel Lines */}
             <div className="absolute top-0 left-4 right-4 h-[1px] bg-[#bbb] shadow-[0_1px_0_#fff]"></div>
             
             {/* Branding Strip */}
             <div className="absolute top-2 left-6 flex gap-2 items-center opacity-60">
                 <div className="w-2 h-2 bg-[#ff5500] rounded-full"></div>
                 <span className="text-[8px] font-black tracking-[0.3em] text-[#444]">G-SERIES STUDIO</span>
             </div>

             {/* KNOB SECTION */}
             <div className="flex justify-between items-center px-2">
                 <Knob label="VOLUME" value={75} color="bg-[#e8e8e8]" />
                 <div className="h-10 w-[1px] bg-[#ccc] shadow-[1px_0_0_#fff]"></div>
                 <Knob label="TUNE" value={30} color="bg-[#e8e8e8]" />
                 <div className="h-10 w-[1px] bg-[#ccc] shadow-[1px_0_0_#fff]"></div>
                 <Knob label="FREQ" value={90} color="bg-[#ff5500]" />
             </div>

             {/* MAIN PANEL (Dark Grey Insert) */}
             <div className="bg-[#333] rounded-xl p-1 shadow-[inset_0_2px_5px_rgba(0,0,0,0.5),0_1px_0_#fff]">
                 <div className="bg-[#2a2a2a] rounded-lg border border-[#444] p-4 flex flex-col gap-4">
                     
                     {/* Small Display Strip */}
                     <div className="h-6 bg-[#111] rounded flex items-center justify-between px-2 border border-[#000] shadow-[inset_0_1px_3px_rgba(0,0,0,1)]">
                         <span className="text-[8px] text-[#666] font-mono">OUTPUT MODE</span>
                         <span className={`text-[10px] font-mono font-bold ${activeNoise ? 'text-[#00ff00] animate-pulse' : 'text-[#555]'}`}>
                            {activeNoise ? activeNoise.toUpperCase() : 'STANDBY'}
                         </span>
                     </div>

                     {/* TACTILE BUTTONS */}
                     <div className="grid grid-cols-2 gap-4">
                        {noiseButtons.map((btn) => {
                            const isActive = activeNoise === btn.id;
                            return (
                                <button
                                    key={btn.id}
                                    onClick={() => handleNoiseToggle(btn.id as any)}
                                    className={`
                                        group relative h-16 rounded-[6px] transition-all duration-100
                                        flex flex-col items-center justify-center gap-1
                                        ${isActive 
                                            ? 'bg-[#ddd] translate-y-[3px] shadow-[0_1px_0_rgba(0,0,0,0.5)] border-t-0' 
                                            : 'bg-[#e5e5e5] -translate-y-0 shadow-[0_4px_0_#111,0_6px_5px_rgba(0,0,0,0.3)] border-t border-white/50 hover:bg-[#fff]'
                                        }
                                    `}
                                >
                                    <div className={`text-[#333] ${isActive ? 'text-[#ff5500]' : 'text-[#444]'}`}>
                                        {btn.icon}
                                    </div>
                                    <span className="text-[10px] font-black text-[#555] tracking-wider">{btn.label}</span>
                                    
                                    {/* LED Indicator on button */}
                                    <div className={`absolute top-2 right-2 w-1.5 h-1.5 rounded-full ${isActive ? 'bg-[#ff5500] shadow-[0_0_5px_#ff5500]' : 'bg-[#444]'}`} />
                                </button>
                            )
                        })}
                     </div>
                 </div>
             </div>

             {/* SPEAKER GRILL */}
             <div className="mt-auto relative h-24 w-full rounded-[8px] bg-[#222] shadow-[inset_0_2px_5px_rgba(0,0,0,0.8)] border-b border-[#555] overflow-hidden">
                 {/* Mesh Pattern */}
                 <div 
                    className="absolute inset-0 opacity-60"
                    style={{
                        backgroundImage: 'radial-gradient(#000 2px, transparent 2.5px)',
                        backgroundSize: '6px 6px',
                        backgroundColor: '#333'
                    }}
                 />
                 {/* Logo on grill */}
                 <div className="absolute bottom-2 right-3 text-[#666] font-bold italic text-xs tracking-widest">
                     STEREO
                 </div>
             </div>

        </div>

        {/* SIDE BUTTONS (Visual only - sticking out) */}
        <div className="absolute -right-[6px] top-[340px] w-[6px] h-12 bg-[#b0aba0] rounded-r border-y border-r border-[#999] shadow-md"></div>
        <div className="absolute -right-[6px] top-[400px] w-[6px] h-8 bg-[#ff5500] rounded-r border-y border-r border-[#cc4400] shadow-md"></div>

      </div>
    </div>
  );
};
