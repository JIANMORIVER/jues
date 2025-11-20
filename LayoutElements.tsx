import React from 'react';

export const CRTOverlay: React.FC = () => (
  <div className="pointer-events-none fixed inset-0 z-50 h-full w-full select-none">
    {/* Scanlines */}
    <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%)] bg-[length:100%_4px]" />
    {/* Vignette and glow */}
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_60%,black_100%)]" />
  </div>
);

export const Screw: React.FC<{ position: string }> = ({ position }) => (
  <div className={`hidden md:block absolute h-3 w-3 rounded-full bg-[#2a2a2a] shadow-[inset_1px_1px_2px_rgba(0,0,0,1),inset_-1px_-1px_1px_rgba(255,255,255,0.1)] z-30 ${position}`}>
    <div className="absolute left-1/2 top-1/2 h-[2px] w-1.5 -translate-x-1/2 -translate-y-1/2 rotate-45 bg-[#111]" />
    <div className="absolute left-1/2 top-1/2 h-1.5 w-[2px] -translate-x-1/2 -translate-y-1/2 rotate-45 bg-[#111]" />
  </div>
);

export const SpiralBinding: React.FC = () => {
  // Generates a realistic spiral notebook binding effect
  const rings = Array.from({ length: 12 });
  return (
    <div className="hidden md:flex absolute bottom-[20px] left-[0px] top-[60px] z-10 w-[40px] flex-col items-center justify-evenly pointer-events-none">
      {/* Binding Strip Background */}
      <div className="absolute inset-y-0 left-2 w-4 bg-[#111] shadow-inner border-r border-[#333]" />
      
      {rings.map((_, i) => (
        <div key={i} className="relative h-6 w-full">
            {/* The Hole in the paper */}
            <div className="absolute right-1 top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-[#080808] shadow-[inset_0_1px_2px_rgba(0,0,0,1)] border border-[#222]" />
            
            {/* The Ring (Back part) */}
            <div className="absolute left-2 top-1/2 h-2 w-6 -translate-y-1/2 -rotate-6 bg-[#333] rounded-full -z-10" />
            
            {/* The Ring (Front part) */}
            <div className="absolute left-1 top-1/2 h-[14px] w-[34px] -translate-y-1/2 -rotate-[15deg] rounded-[10px] border-[3px] border-b-[4px] border-[#1a1a1a] border-l-[#444] border-t-[#555] shadow-[2px_2px_4px_black]" />
        </div>
      ))}
    </div>
  );
};

export const SideTag: React.FC<{ active: boolean }> = ({ active }) => (
  <div className={`hidden md:block absolute -left-[18px] top-[40px] z-0 transition-all duration-300 ${active ? '-translate-x-2' : 'translate-x-0'}`}>
    {/* Tag Body */}
    <div className="flex h-[220px] w-[50px] flex-col items-center justify-center rounded-l-xl border-2 border-r-0 border-[#111] bg-zzz-orange shadow-lg relative overflow-hidden">
      {/* Decorative lines */}
      <div className="absolute top-2 h-16 w-[2px] bg-black/20" />
      <div className="absolute bottom-2 h-16 w-[2px] bg-black/20" />
      
      {/* Text */}
      <span className="rotate-180 text-xl font-black italic tracking-[4px] text-[#111] [writing-mode:vertical-rl] select-none">
        SCHEDULE
      </span>

      {/* Gloss */}
      <div className="absolute left-0 top-0 h-full w-2 bg-white/10" />
    </div>
    
    {/* Connector shadow to main body */}
    <div className="absolute right-[-5px] top-4 h-[190px] w-4 bg-black/50 blur-sm" />
  </div>
);