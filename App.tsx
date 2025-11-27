import React, { useState, useRef, useEffect } from 'react';
import { Hopper } from './components/Hopper';
import { Slot } from './components/Slot';
import { FlyingPill } from './components/FlyingPill';
import { PillType, SlotData, FlyingPillData } from './types';
import { Play, RotateCcw, AlertTriangle, CheckCircle2 } from 'lucide-react';

// --- Constants & Config ---
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const ANIMATION_DURATION = 600; // ms match FlyingPill duration
const STEP_DELAY = 100; // ms pause between steps

// --- Helper: Generate Initial Grid ---
const generateEmptySlots = (): SlotData[] => {
  const slots: SlotData[] = [];
  DAYS.forEach((day, index) => {
    // Morning Slot
    slots.push({
      id: `${day}-M`,
      dayIndex: index,
      isNight: false,
      redCount: 0,
      blueCount: 0,
      label: `${day} Morning`,
    });
    // Night Slot
    slots.push({
      id: `${day}-N`,
      dayIndex: index,
      isNight: true,
      redCount: 0,
      blueCount: 0,
      label: `${day} Night`,
    });
  });
  return slots;
};

export default function App() {
  // --- State ---
  const [hopperACount, setHopperACount] = useState(0);
  const [hopperBCount, setHopperBCount] = useState(0);
  const [slots, setSlots] = useState<SlotData[]>(generateEmptySlots());
  
  const [isSorting, setIsSorting] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const [currentSlotIndex, setCurrentSlotIndex] = useState(0);
  const [currentStep, setCurrentStep] = useState<'IDLE' | 'MOVING_RED' | 'MOVING_BLUE'>('IDLE');
  
  // Transient state for animations
  const [flyingPills, setFlyingPills] = useState<FlyingPillData[]>([]);

  // --- Refs for Coordinate Calculation ---
  const hopperARef = useRef<HTMLDivElement>(null);
  const hopperBRef = useRef<HTMLDivElement>(null);
  const slotRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // --- Handlers ---

  const handleAddHopperA = () => {
    setHopperACount(prev => prev + 20);
    if (errorMsg && hopperACount + 20 > 0) setErrorMsg(null);
  };

  const handleAddHopperB = () => {
    setHopperBCount(prev => prev + 20);
    if (errorMsg && hopperBCount + 20 > 0) setErrorMsg(null);
  };

  const resetMachine = () => {
    setIsSorting(false);
    setIsPaused(false);
    setIsComplete(false);
    setErrorMsg(null);
    setCurrentSlotIndex(0);
    setCurrentStep('IDLE');
    setSlots(generateEmptySlots());
    setFlyingPills([]);
  };

  const startSort = () => {
    if (hopperACount === 0 && hopperBCount === 0) return;
    setIsSorting(true);
    setIsPaused(false);
    setErrorMsg(null);
    setIsComplete(false);
    
    // If we finished before, reset slots but keep pills in hoppers
    if (currentSlotIndex >= slots.length) {
       setSlots(generateEmptySlots());
       setCurrentSlotIndex(0);
    }
  };

  // --- Animation Spawner ---
  const spawnFlyingPill = (type: PillType, targetSlotId: string) => {
    const sourceRef = type === PillType.RED ? hopperARef : hopperBRef;
    const targetRef = slotRefs.current.get(targetSlotId);

    if (sourceRef.current && targetRef) {
      const sourceRect = sourceRef.current.getBoundingClientRect();
      const targetRect = targetRef.getBoundingClientRect();

      const newPill: FlyingPillData = {
        id: Math.random().toString(36).substr(2, 9),
        type,
        // Center of Hopper
        startX: sourceRect.left + sourceRect.width / 2 - 10,
        startY: sourceRect.top + sourceRect.height / 2 - 10,
        // Center(ish) of Slot
        endX: targetRect.left + targetRect.width / 2 - 10,
        endY: targetRect.top + targetRect.height / 2 + 10, 
      };

      setFlyingPills(prev => [...prev, newPill]);
    }
  };

  // --- GAME LOOP PART 1: DECISION ENGINE ---
  // This effect decides what to do next when the machine is IDLE.
  // It handles spawning the animation and decrementing the hopper.
  useEffect(() => {
    if (!isSorting || isPaused || isComplete || currentStep !== 'IDLE') return;

    // Check if we are done with all slots
    if (currentSlotIndex >= slots.length) {
      setIsComplete(true);
      setIsSorting(false);
      return;
    }

    const currentSlot = slots[currentSlotIndex];
    if (!currentSlot) return;

    const needsRed = !currentSlot.isNight && currentSlot.redCount === 0;
    const needsBlue = currentSlot.blueCount === 0;

    // Add a small delay for rhythm
    const decisionTimer = setTimeout(() => {
      if (needsRed) {
        if (hopperACount > 0) {
          spawnFlyingPill(PillType.RED, currentSlot.id);
          setHopperACount(prev => prev - 1);
          setCurrentStep('MOVING_RED');
        } else {
          setIsPaused(true);
          setErrorMsg("Hopper A Empty! Refill to continue.");
        }
      } else if (needsBlue) {
        if (hopperBCount > 0) {
          spawnFlyingPill(PillType.BLUE, currentSlot.id);
          setHopperBCount(prev => prev - 1);
          setCurrentStep('MOVING_BLUE');
        } else {
          setIsPaused(true);
          setErrorMsg("Hopper B Empty! Refill to continue.");
        }
      } else {
        // Slot is full, move to next
        setCurrentSlotIndex(prev => prev + 1);
        // Step remains IDLE, triggering this effect again for the next slot
      }
    }, STEP_DELAY);

    return () => clearTimeout(decisionTimer);
  }, [isSorting, isPaused, isComplete, currentStep, currentSlotIndex, slots, hopperACount, hopperBCount]);


  // --- GAME LOOP PART 2: ARRIVAL ENGINE ---
  // This effect handles the "Landing" of the pill.
  // CRITICAL: It does NOT depend on hopperCounts or slots, only on the step.
  // This prevents the timeout from being cleared when hopper state updates.
  useEffect(() => {
    if (currentStep === 'IDLE') return;

    const arrivalTimer = setTimeout(() => {
      setSlots(prev => {
        const next = [...prev];
        const slot = { ...next[currentSlotIndex] };

        if (currentStep === 'MOVING_RED') {
          slot.redCount += 1;
        } else if (currentStep === 'MOVING_BLUE') {
          slot.blueCount += 1;
        }

        next[currentSlotIndex] = slot;
        return next;
      });
      
      setCurrentStep('IDLE');
    }, ANIMATION_DURATION);

    return () => clearTimeout(arrivalTimer);
  }, [currentStep, currentSlotIndex]); // Stable dependencies


  // --- Render ---
  return (
    <div className="min-h-screen flex flex-col items-center p-6 gap-8 max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-white">AutoPill Sort 3000</h1>
        <p className="text-slate-400">Automated Weekly Medication Organizer</p>
      </div>

      {/* TOP SECTION: Hoppers */}
      <div className="flex flex-col md:flex-row gap-12 w-full justify-center items-end relative z-10">
        <Hopper
          ref={hopperARef}
          type={PillType.RED}
          count={hopperACount}
          label="Hopper A"
          subLabel="Morning Only"
          onAdd={handleAddHopperA}
          isActive={isSorting && currentStep === 'MOVING_RED'}
        />
        
        <Hopper
          ref={hopperBRef}
          type={PillType.BLUE}
          count={hopperBCount}
          label="Hopper B"
          subLabel="Twice Daily"
          onAdd={handleAddHopperB}
          isActive={isSorting && currentStep === 'MOVING_BLUE'}
        />
      </div>

      {/* MIDDLE SECTION: Controls & Status */}
      <div className="flex flex-col items-center gap-4 w-full max-w-2xl bg-slate-800/30 p-6 rounded-2xl border border-slate-700/50 backdrop-blur-md">
        
        <div className="flex gap-4">
          {!isSorting && !isPaused && !isComplete && (
            <button
              onClick={startSort}
              disabled={hopperACount === 0 && hopperBCount === 0}
              className="flex items-center gap-2 px-8 py-4 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-xl font-bold text-lg transition-all shadow-lg active:scale-95 disabled:scale-100"
            >
              <Play fill="currentColor" />
              START WEEKLY BATCH SORT
            </button>
          )}

          {(isSorting || isPaused) && !isComplete && (
            <div className="flex items-center gap-4">
              <div className="text-emerald-400 font-mono text-xl animate-pulse">
                {isPaused ? "PAUSED" : "PROCESSING..."}
              </div>
               {isPaused && (
                  <button 
                    onClick={() => { setIsPaused(false); setIsSorting(true); }}
                    className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg font-bold"
                  >
                    Resume
                  </button>
               )}
            </div>
          )}

          {isComplete && (
             <div className="flex items-center gap-2 text-emerald-400 text-xl font-bold">
                <CheckCircle2 size={32} />
                BATCH COMPLETE
             </div>
          )}

          <button
            onClick={resetMachine}
            className="flex items-center gap-2 px-4 py-4 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl font-semibold transition-colors"
            title="Reset Grid"
          >
            <RotateCcw size={20} />
          </button>
        </div>

        {/* Error Message Display */}
        {errorMsg && (
          <div className="flex items-center gap-2 text-amber-400 bg-amber-900/30 px-4 py-2 rounded-lg border border-amber-500/30 animate-bounce">
            <AlertTriangle size={20} />
            {errorMsg}
          </div>
        )}

      </div>

      {/* BOTTOM SECTION: Grid Output */}
      <div className="w-full overflow-x-auto pb-8">
        <div className="grid grid-cols-7 gap-x-2 gap-y-12 min-w-[800px] bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
          
          {/* Day Headers */}
          {DAYS.map(day => (
            <div key={day} className="text-center font-bold text-slate-400 uppercase tracking-widest border-b border-slate-700 pb-2">
              {day}
            </div>
          ))}

          {/* Row 1: Mornings */}
          {Array.from({ length: 7 }).map((_, colIndex) => {
             const logicIndex = colIndex * 2;
             const slot = slots[logicIndex];
             return (
               <Slot 
                  key={slot.id} 
                  ref={(el) => {
                    if (el) slotRefs.current.set(slot.id, el);
                  }}
                  data={slot}
                  isTarget={isSorting && !isPaused && currentSlotIndex === logicIndex}
               />
             );
          })}

          {/* Row 2: Nights */}
          {Array.from({ length: 7 }).map((_, colIndex) => {
             const logicIndex = (colIndex * 2) + 1;
             const slot = slots[logicIndex];
             return (
               <Slot 
                  key={slot.id} 
                  ref={(el) => {
                    if (el) slotRefs.current.set(slot.id, el);
                  }}
                  data={slot}
                  isTarget={isSorting && !isPaused && currentSlotIndex === logicIndex}
               />
             );
          })}

        </div>
      </div>

      {/* Layer for Flying Pills */}
      {flyingPills.map(pill => (
        <FlyingPill
          key={pill.id}
          {...pill}
          onComplete={() => {
            setFlyingPills(prev => prev.filter(p => p.id !== pill.id));
          }}
        />
      ))}

    </div>
  );
}