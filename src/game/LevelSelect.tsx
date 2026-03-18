import React, { useState, useEffect } from 'react';
import { loadProgress, GameProgress } from './progressStore';
import { LEVELS } from './levels';

interface LevelSelectProps {
  onSelectLevel: (level: number) => void;
  onBack: () => void;
}

export default function LevelSelect({ onSelectLevel, onBack }: LevelSelectProps) {
  const [progress, setProgress] = useState<GameProgress | null>(null);

  useEffect(() => {
    setProgress(loadProgress());
  }, []);

  if (!progress) return null;

  return (
    <div className="fixed inset-0 flex flex-col items-center bg-background overflow-x-hidden overflow-y-auto py-12 px-4 selection:bg-primary/30 z-50">
      {/* Dynamic Animated Background Elements */}
      <div className="absolute top-[10%] left-[20%] w-[500px] h-[500px] bg-primary/20 rounded-full mix-blend-screen filter blur-[100px] opacity-60 animate-blob pointer-events-none" />
      <div className="absolute bottom-[20%] right-[10%] w-[400px] h-[400px] bg-secondary/20 rounded-full mix-blend-screen filter blur-[80px] opacity-60 animate-blob animation-delay-2000 pointer-events-none" />
      <div className="absolute top-[40%] left-[40%] w-[300px] h-[300px] bg-accent/20 rounded-full mix-blend-screen filter blur-[60px] opacity-50 animate-blob animation-delay-4000 pointer-events-none" />

      {/* Header */}
      <div className="z-10 w-full max-w-5xl flex items-center justify-between mb-8 px-4 sm:px-8">
        <button 
          onClick={onBack}
          className="bg-card/90 backdrop-blur-md border border-white/10 hover:border-primary/50 text-foreground px-4 sm:px-6 py-2 sm:py-3 rounded-2xl font-bold transition-all shadow-lg hover:shadow-primary/20 hover:-translate-x-1 flex items-center gap-2 group text-sm sm:text-base"
        >
          <span className="transform transition-transform group-hover:-translate-x-1">←</span> Back
        </button>
        
        <div className="flex flex-col items-end">
          <h1 className="text-3xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-accent drop-shadow-sm font-display uppercase tracking-widest leading-none">
            Arcade
          </h1>
          <p className="text-muted-foreground font-bold tracking-[0.2em] text-[10px] sm:text-xs">SELECT STAGE</p>
        </div>
      </div>

      {/* Total Progress Banner */}
      <div className="z-10 w-full max-w-5xl mb-8 flex justify-center">
         <div className="bg-card/40 backdrop-blur-xl border border-white/10 rounded-3xl py-4 px-8 flex items-center gap-8 shadow-2xl">
           <div className="flex flex-col items-center">
             <span className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest">Total Stars</span>
             <span className="text-2xl font-black text-yellow-400 font-mono drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]">
               {Object.values(progress.levels).reduce((sum, lvl) => sum + lvl.stars, 0)} <span className="text-lg">★</span>
             </span>
           </div>
           <div className="w-px h-10 bg-white/10"></div>
           <div className="flex flex-col items-center">
             <span className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest">Coins</span>
             <span className="text-2xl font-black text-yellow-200 font-mono drop-shadow-[0_0_8px_rgba(254,240,138,0.5)]">
               {progress.totalCoins} <span className="text-lg">💰</span>
             </span>
           </div>
         </div>
      </div>

      {/* Grid Container */}
      <div className="z-10 w-full max-w-5xl bg-card/40 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-6 sm:p-10 shadow-[0_30px_60px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.1)]">
        
        <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-10 gap-3 sm:gap-4 lg:gap-5">
          {LEVELS.map((level) => {
            const lvlProgress = progress.levels[level.number];
            const isUnlocked = lvlProgress?.unlocked || false;
            const stars = lvlProgress?.stars || 0;
            const isBoss = level.number % 5 === 0;

            return (
              <button
                key={level.number}
                onClick={() => isUnlocked && onSelectLevel(level.number)}
                disabled={!isUnlocked}
                className={`relative aspect-square rounded-2xl flex flex-col items-center justify-center transition-all duration-300 group ${
                  isUnlocked 
                    ? isBoss
                      ? 'bg-gradient-to-br from-red-600/80 to-purple-900/80 hover:from-red-500 hover:to-purple-800 border-2 border-red-500/50 hover:border-red-400 shadow-[0_0_20px_rgba(239,68,68,0.2)] hover:shadow-[0_0_30px_rgba(239,68,68,0.5)] hover:-translate-y-1'
                      : 'bg-gradient-to-br from-card to-background hover:from-white/10 hover:to-card border border-white/10 hover:border-primary/50 shadow-lg hover:shadow-[0_0_20px_rgba(var(--primary),0.3)] hover:-translate-y-1'
                    : 'bg-black/40 border border-white/5 opacity-60 cursor-not-allowed grayscale'
                }`}
              >
                {/* Level Number */}
                <span className={`text-2xl sm:text-3xl font-black font-display tracking-tighter ${
                  isUnlocked ? 'text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]' : 'text-white/20'
                }`}>
                  {level.number}
                </span>

                {/* Stars Indicator */}
                {isUnlocked && (
                  <div className="absolute bottom-2 sm:bottom-3 flex gap-0.5 sm:gap-1">
                    {[1, 2, 3].map(starIdx => (
                      <span 
                        key={starIdx} 
                        className={`text-[8px] sm:text-[10px] ${
                          stars >= starIdx 
                            ? 'text-yellow-400 drop-shadow-[0_0_5px_rgba(250,204,21,0.8)]' 
                            : 'text-white/10'
                        }`}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                )}

                {/* Lock Icon */}
                {!isUnlocked && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-[2px] rounded-2xl">
                    <span className="text-xl sm:text-2xl opacity-50">🔒</span>
                  </div>
                )}

                {/* Boss Indicator */}
                {isBoss && isUnlocked && (
                  <div className="absolute -top-2 -right-2 bg-red-500 text-white text-[8px] sm:text-[10px] font-black px-2 py-0.5 rounded-full border border-red-300 shadow-[0_0_10px_rgba(239,68,68,0.8)] animate-pulse">
                    BOSS
                  </div>
                )}
                
                {/* Internal Glow on Hover */}
                {isUnlocked && (
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
