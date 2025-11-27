import React, { useEffect, useState } from 'react';
import { PillType } from '../types';

interface FlyingPillProps {
  type: PillType;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  onComplete: () => void;
}

export const FlyingPill: React.FC<FlyingPillProps> = ({
  type,
  startX,
  startY,
  endX,
  endY,
  onComplete,
}) => {
  const [style, setStyle] = useState<React.CSSProperties>({
    position: 'fixed',
    left: startX,
    top: startY,
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    backgroundColor: type === PillType.RED ? '#ef4444' : '#3b82f6', // Tailwind red-500 : blue-500
    zIndex: 9999,
    transition: 'transform 0.6s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.2s ease-in',
    transform: 'translate(0, 0) scale(1.5)',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
    pointerEvents: 'none',
  });

  useEffect(() => {
    // Trigger the animation in the next frame
    const frameId = requestAnimationFrame(() => {
      setStyle((prev) => ({
        ...prev,
        transform: `translate(${endX - startX}px, ${endY - startY}px) scale(1)`,
      }));
    });

    // Cleanup after animation duration
    const timerId = setTimeout(() => {
      onComplete();
    }, 600); // Matches transition duration

    return () => {
      cancelAnimationFrame(frameId);
      clearTimeout(timerId);
    };
  }, [endX, endY, startX, startY, onComplete]);

  return <div style={style} />;
};
