import React, { forwardRef } from 'react';
import { PillType } from '../types';
import { Plus } from 'lucide-react';

interface HopperProps {
  type: PillType;
  count: number;
  label: string;
  subLabel: string;
  onAdd: () => void;
  isActive: boolean;
}

// Forward ref to allow parent to get coordinates for animation
export const Hopper = forwardRef<HTMLDivElement, HopperProps>(
  ({ type, count, label, subLabel, onAdd, isActive }, ref) => {
    const isRed = type === PillType.RED;
    const colorClass = isRed ? 'bg-red-500' : 'bg-blue-500';
    const ringClass = isRed ? 'ring-red-500' : 'ring-blue-500';
    const shadowClass = isRed ? 'shadow-red-900/50' : 'shadow-blue-900/50';

    // Visualize pills inside (capped at 50 for performance/visuals)
    const visualPills = Array.from({ length: Math.min(count, 48) });

    return (
      <div className="flex flex-col items-center gap-4 w-full max-w-sm">
        <div className="text-center">
          <h2 className={`text-xl font-bold ${isRed ? 'text-red-400' : 'text-blue-400'}`}>
            {label}
          </h2>
          <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold">
            {subLabel}
          </p>
        </div>

        {/* The Hopper Container */}
        <div
          ref={ref}
          className={`
            relative w-full h-40 bg-slate-800/50 border-2 rounded-xl overflow-hidden backdrop-blur-sm transition-all duration-300
            ${isActive ? `border-white ring-2 ${ringClass}` : 'border-slate-700'}
            shadow-xl ${shadowClass}
          `}
        >
          {/* Glass reflection effect */}
          <div className="absolute top-0 right-0 w-2/3 h-full bg-gradient-to-l from-white/5 to-transparent pointer-events-none" />
          
          {/* Pill Pile Visualization */}
          <div className="absolute bottom-0 w-full p-4 flex flex-wrap-reverse content-start gap-1 justify-center max-h-full overflow-hidden">
            {visualPills.map((_, i) => (
              <div
                key={i}
                className={`w-4 h-4 rounded-full ${colorClass} shadow-sm border border-black/20`}
              />
            ))}
          </div>
          
          {/* Count Overlay */}
          <div className="absolute top-2 left-3 bg-slate-900/80 px-3 py-1 rounded-full text-2xl font-mono font-bold text-white border border-slate-700">
            {count}
          </div>
        </div>

        {/* Controls */}
        <button
          onClick={onAdd}
          className={`
            flex items-center gap-2 px-6 py-3 rounded-lg font-bold transition-all active:scale-95
            ${isRed 
              ? 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-900/20' 
              : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20'}
          `}
        >
          <Plus size={18} />
          Add 20 Pills
        </button>
      </div>
    );
  }
);

Hopper.displayName = 'Hopper';
