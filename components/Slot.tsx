import React, { forwardRef } from 'react';
import { SlotData } from '../types';

interface SlotProps {
  data: SlotData;
  isTarget: boolean;
}

export const Slot = forwardRef<HTMLDivElement, SlotProps>(({ data, isTarget }, ref) => {
  // Create arrays for visual rendering
  const reds = Array.from({ length: data.redCount });
  const blues = Array.from({ length: data.blueCount });

  return (
    <div
      ref={ref}
      className={`
        relative flex flex-col items-center justify-end h-24 rounded-lg border-2 transition-colors duration-300
        ${isTarget 
          ? 'bg-slate-700/80 border-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.3)]' 
          : 'bg-slate-800/40 border-slate-700'}
      `}
    >
      {/* Cup Lip - z-20 to be above pills if they pile up high, but below flying pills */}
      <div className="absolute top-0 w-full h-2 bg-slate-700/50 rounded-t-sm z-20 pointer-events-none" />

      {/* Pills inside the cup */}
      {/* z-10 ensures they sit above the cup background */}
      <div className="w-full p-2 flex flex-wrap gap-1 justify-center items-end content-end z-10 min-h-[20px]">
        {reds.map((_, i) => (
          <div key={`r-${i}`} className="w-3 h-3 rounded-full bg-red-500 border border-black/30 shadow-sm" />
        ))}
        {blues.map((_, i) => (
          <div key={`b-${i}`} className="w-3 h-3 rounded-full bg-blue-500 border border-black/30 shadow-sm" />
        ))}
      </div>

      {/* Label */}
      <div className="absolute -bottom-6 text-[10px] text-slate-500 uppercase tracking-wide font-bold">
        {data.isNight ? 'Night' : 'Morn'}
      </div>
    </div>
  );
});

Slot.displayName = 'Slot';