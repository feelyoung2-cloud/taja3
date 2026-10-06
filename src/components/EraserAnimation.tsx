import React, { useEffect, useState } from 'react';

interface EraserAnimationProps {
  x: number;
  y: number;
  wordText: string;
  wordMeaning?: string;
  scoreGained?: number;
  onFinished: () => void;
}

export const EraserAnimation: React.FC<EraserAnimationProps> = ({
  x,
  y,
  wordText,
  wordMeaning,
  scoreGained = 100,
  onFinished,
}) => {
  const [phase, setPhase] = useState<'wipe' | 'done'>('wipe');

  useEffect(() => {
    const timer = setTimeout(() => {
      setPhase('done');
      onFinished();
    }, 700);
    return () => clearTimeout(timer);
  }, [onFinished]);

  return (
    <div
      className="absolute pointer-events-none z-40 select-none transition-all duration-300"
      style={{
        left: `${x}px`,
        top: `${y}px`,
        transform: 'translate(-50%, -50%)',
      }}
    >
      {/* Wooden Blackboard Eraser sweeping across */}
      <div
        className="relative flex items-center justify-center transition-transform duration-500 ease-out"
        style={{
          animation: 'eraserSweep 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) forwards',
        }}
      >
        {/* Realistic Eraser Widget */}
        <div className="relative w-28 h-12 shadow-2xl flex flex-col rounded-sm overflow-hidden border border-amber-950/60 rotate-6">
          {/* Wood Handle */}
          <div className="h-6 bg-amber-700 bg-gradient-to-r from-amber-800 via-amber-600 to-amber-900 border-b border-amber-950 flex items-center justify-center shadow-inner">
            <span className="text-[10px] tracking-wider text-amber-200/90 font-jua">칠판 지우개</span>
          </div>
          {/* Layered Felt Pads */}
          <div className="h-6 bg-stone-700 bg-gradient-to-b from-stone-600 to-stone-800 border-t border-stone-500/40 relative">
            <div className="absolute inset-0 bg-white/10 opacity-60" />
            <div className="absolute bottom-0 w-full h-1 bg-white/20" />
          </div>
        </div>

        {/* Chalk Dust Cloud */}
        <div className="absolute -inset-6 bg-white/20 blur-md rounded-full pointer-events-none animate-pulse" />
      </div>

      {/* Floating Score and Definition Popup */}
      <div className="absolute -top-12 left-1/2 -translate-x-1/2 whitespace-nowrap text-center animate-bounce">
        <span className="font-jua text-2xl text-yellow-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] font-bold">
          +{scoreGained}점!
        </span>
        {wordMeaning && (
          <div className="mt-1 px-3 py-1 bg-stone-900/90 border border-emerald-500/50 rounded-lg text-emerald-200 text-xs font-sans-kr max-w-xs shadow-lg backdrop-blur-sm">
            <span className="font-bold text-white mr-1">[{wordText}]</span>
            {wordMeaning}
          </div>
        )}
      </div>

      <style>{`
        @keyframes eraserSweep {
          0% {
            transform: translateX(-40px) scale(0.9) rotate(-8deg);
            opacity: 0.9;
          }
          50% {
            transform: translateX(10px) scale(1.1) rotate(6deg);
            opacity: 1;
          }
          100% {
            transform: translateX(60px) scale(1) rotate(12deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};
