import { useRef, useEffect, useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, User, Trophy } from 'lucide-react';
import { createInitialState, updateGame, renderGame, resetGame } from './engine';
import { GameState, SoundEvent } from './types';
import { CharacterDef } from './characters';
import CharacterSelect from './CharacterSelect';
import { addScore, getLeaderboard, isHighScore, LeaderboardEntry } from './leaderboard';
import {
  playBonkSound, playEliminationSound, playPowerUpSound,
  playVictorySound, playDefeatSound,
  startBackgroundMusic, stopBackgroundMusic,
} from './audio';
import PartyLobby from './PartyLobby';
import { networkManager } from './NetworkManager';
import LevelSelect from './LevelSelect';
import { loadProgress, saveLevelCompletion } from './progressStore';
import { LEVELS } from './levels';

const BonkRoyaleGame = () => {
  const [selectedChar, setSelectedChar] = useState<CharacterDef | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);
  const [isMultiplayer, setIsMultiplayer] = useState(false);
  const [inLobby, setInLobby] = useState(false);
  const [prefilledRoom, setPrefilledRoom] = useState<string | null>(null);
  const [gamePhase, setGamePhase] = useState<'menu' | 'levelSelect' | 'playing' | 'paused' | 'victory' | 'gameOver'>('menu');
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [scoreSaved, setScoreSaved] = useState(false);
  const [showBoostBlast, setShowBoostBlast] = useState(false);
  const [starsEarned, setStarsEarned] = useState(0);
  const [showLevelStart, setShowLevelStart] = useState(false);
  const showLevelStartRef = useRef(false);
  const prevCooldownRef = useRef(0);


  // Watch for Booster Ready Signal
  useEffect(() => {
    const timer = setInterval(() => {
      const p = stateRef.current?.players.find(p => p.isPlayer);
      if (p) {
        if (prevCooldownRef.current > 0 && p.boosterCooldown === 0) {
          setShowBoostBlast(true);
          setTimeout(() => setShowBoostBlast(false), 1000);
        }
        prevCooldownRef.current = p.boosterCooldown;
      }
    }, 100);
    return () => clearInterval(timer);
  }, []);

  // Level Start Banner Trigger
  useEffect(() => {
    if (selectedLevel) {
      setShowLevelStart(true);
      showLevelStartRef.current = true;
      const timer = setTimeout(() => {
        setShowLevelStart(false);
        showLevelStartRef.current = false;
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [selectedLevel]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<GameState | null>(null);
  const inputRef = useRef({
    up: false, down: false, left: false, right: false,
    bonk: false,
    mouseX: 0, mouseY: 0,
    touchActive: false,
    touchMoveX: 0, touchMoveY: 0,
    touchBonk: false,
    boost: false,
  });
  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const [showMobileControls, setShowMobileControls] = useState(false);
  const [joystickPos, setJoystickPos] = useState({ x: 100, y: 100, active: false });
  const joystickRef = useRef<{ active: boolean; startX: number; startY: number }>({ active: false, startX: 0, startY: 0 });

  useEffect(() => {
    // Detect room and mode from URL
    const urlParams = new URLSearchParams(window.location.search);
    const room = urlParams.get('room');
    const mode = urlParams.get('mode');
    
    if (room && room.length === 4) {
      setPrefilledRoom(room.toUpperCase());
    }
    
    if (mode === 'party' || room) {
      setIsMultiplayer(true);
    }

    if (window.innerWidth < 768) {
      setShowMobileControls(true);
    }
  }, []);

  // Selective Scroller Locking: Lock only when in the arena
  useEffect(() => {
    const isArenaActive = selectedChar && !inLobby;
    if (isArenaActive) {
      document.body.classList.add('lock-scroller');
    } else {
      document.body.classList.remove('lock-scroller');
    }
    return () => {
      document.body.classList.remove('lock-scroller');
    };
  }, [selectedChar, inLobby]);

  const getCanvasSize = useCallback(() => {
    const isMobile = window.innerWidth < 768;
    const w = isMobile ? window.innerWidth : Math.min(window.innerWidth, 900);
    const h = isMobile ? window.innerHeight : Math.min(window.innerHeight - 60, 700);
    return { w, h };
  }, []);

  const handleSoundEvents = useCallback((events: SoundEvent[]) => {
    for (const e of events) {
      switch (e) {
        case 'bonk': playBonkSound(); break;
        case 'elimination': playEliminationSound(); break;
        case 'powerup': playPowerUpSound(); break;
        case 'victory': playVictorySound(); break;
        case 'defeat': playDefeatSound(); break;
      }
    }
  }, []);

  // Save score on game over
  const saveScore = useCallback(() => {
    if (!stateRef.current || scoreSaved) return;
    const state = stateRef.current;
    if (state.phase === 'gameOver' && selectedChar) {
      const entries = addScore(selectedChar.name, state.playerScore, state.round);
      setLeaderboard(entries);
      setScoreSaved(true);
    }
  }, [selectedChar, scoreSaved]);

  useEffect(() => {
    // Only start game if a character is selected AND we aren't in the lobby AND (we selected a level or we are in multiplayer)
    if (!selectedChar || inLobby || (!isMultiplayer && selectedLevel === null)) return;
    if (!canvasRef.current) return;
    
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    setShowMobileControls(isTouch);

    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    const { w, h } = getCanvasSize();
    canvas.width = w;
    canvas.height = h;

    const lvlConfig = selectedLevel ? LEVELS.find(l => l.number === selectedLevel) : null;
    const maxTime = lvlConfig ? lvlConfig.timeLimit : 0;

    const handleVictory = (finalTimes: number) => {
      if (!selectedLevel || !lvlConfig) return;
      
      let stars = 1;
      if (finalTimes <= lvlConfig.starRequirements.three) stars = 3;
      else if (finalTimes <= lvlConfig.starRequirements.two) stars = 2;
      
      setStarsEarned(stars);
      saveLevelCompletion(selectedLevel, stars, finalTimes * 1000);
    };

    stateRef.current = createInitialState(w, h, selectedChar, isMultiplayer, 1, selectedLevel || 0, maxTime);
    if (networkManager.role === 'host') {
      stateRef.current.phase = 'playing'; // Network games start immediately upon entering the arena
    } else if (!isMultiplayer) {
      stateRef.current.phase = 'playing'; // Arcade levels start immediately
    }
    setGamePhase(stateRef.current.phase);
    setScoreSaved(false);
    startBackgroundMusic();

    const onKeyDown = (e: KeyboardEvent) => {
      const inp = inputRef.current;
      if (e.key === 'ArrowUp' || e.key === 'w') inp.up = true;
      if (e.key === 'ArrowDown' || e.key === 's') inp.down = true;
      if (e.key === 'ArrowLeft' || e.key === 'a') inp.left = true;
      if (e.key === 'ArrowRight' || e.key === 'd') inp.right = true;
      if (e.key === ' ') { inp.bonk = true; e.preventDefault(); }
      if (e.key === 'Shift') { inp.boost = true; e.preventDefault(); }
      if (e.key === 'Escape') {
        if (stateRef.current) {
          if (stateRef.current.phase === 'playing') {
            stateRef.current.phase = 'paused';
            setGamePhase('paused');
          } else if (stateRef.current.phase === 'paused') {
            stateRef.current.phase = 'playing';
            setGamePhase('playing');
          }
        }
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      const inp = inputRef.current;
      if (e.key === 'ArrowUp' || e.key === 'w') inp.up = false;
      if (e.key === 'ArrowDown' || e.key === 's') inp.down = false;
      if (e.key === 'ArrowLeft' || e.key === 'a') inp.left = false;
      if (e.key === 'ArrowRight' || e.key === 'd') inp.right = false;
      if (e.key === ' ') inp.bonk = false;
      if (e.key === 'Shift') inp.boost = false;
    };

    const onClick = () => {
      if (!stateRef.current) return;
      if (stateRef.current.phase === 'menu' && networkManager.role !== 'client') {
        stateRef.current.phase = 'playing';
      } else if (stateRef.current.phase === 'gameOver' && networkManager.role !== 'client') {
        setScoreSaved(false);
        stateRef.current = resetGame(stateRef.current, w, h, selectedChar, isMultiplayer);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    canvas.addEventListener('click', onClick);

    let prevPhase = 'menu';
    const loop = (timestamp: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp;
      const dt = Math.min((timestamp - lastTimeRef.current) / 1000, 0.05);
      lastTimeRef.current = timestamp;

      if (stateRef.current) {
        // If Client: Send input, render latest remote state (skip local update)
        if (networkManager.role === 'client') {
           networkManager.sendInput(inputRef.current);
           if (networkManager.lastReceivedState) {
             stateRef.current = networkManager.lastReceivedState;
             if (stateRef.current.phase !== prevPhase) {
               setGamePhase(stateRef.current.phase);
               prevPhase = stateRef.current.phase;
             }
             renderGame(ctx, stateRef.current, w, h);
           }
        } else {
          // If Host or Local: run full simulation
          // Guard simulation: Don't update game while Level Start banner is visible
          if (!showLevelStartRef.current) {
            stateRef.current = updateGame(stateRef.current, inputRef.current, dt);
          }

          // If Host: Broadcast state to clients
          if (networkManager.role === 'host') {
            networkManager.broadcastState(stateRef.current);
          }

          // Process sound events
          if (stateRef.current.soundEvents.length > 0) {
            handleSoundEvents(stateRef.current.soundEvents);
            stateRef.current.soundEvents = [];
          }

          // Auto-save score on game over transition
          if (stateRef.current.phase === 'gameOver' && prevPhase !== 'gameOver') {
            saveScore();
          }

          if (stateRef.current.phase === 'victory' && prevPhase !== 'victory') {
            handleVictory(stateRef.current.time);
          }
          
          if (stateRef.current.phase !== prevPhase) {
            setGamePhase(stateRef.current.phase);
          }
          
          prevPhase = stateRef.current.phase;

          renderGame(ctx, stateRef.current, w, h);
        }

        inputRef.current.bonk = false;
        inputRef.current.touchBonk = false;
        // boost remains true while key is held, or if handled as a toggle? 
        // Logic in engine.ts handles activation on press and cooldown.
        // We set it to false only on keyup. 
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      canvas.removeEventListener('click', onClick);
      cancelAnimationFrame(rafRef.current);
      stopBackgroundMusic();
      networkManager.disconnect();
    };
  }, [selectedChar, selectedLevel, inLobby, getCanvasSize, handleSoundEvents, saveScore, isMultiplayer, gamePhase]);

  const handleJoystickStart = (e: React.TouchEvent) => {
    e.preventDefault();
    const touch = e.touches[0];
    // Dynamic Joystick Spawning: Set anchor to where the thumb touched
    setJoystickPos({ x: touch.clientX, y: touch.clientY, active: true });
    joystickRef.current = { active: true, startX: touch.clientX, startY: touch.clientY };
    inputRef.current.touchActive = true;
  };

  const handleJoystickMove = (e: React.TouchEvent) => {
    e.preventDefault();
    if (!joystickRef.current.active) return;
    const touch = e.touches[0];
    const dx = touch.clientX - joystickRef.current.startX;
    const dy = touch.clientY - joystickRef.current.startY;
    const maxDist = 40;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const clamp = Math.min(dist, maxDist);
    if (dist > 5) {
      inputRef.current.touchMoveX = (dx / dist) * (clamp / maxDist);
      inputRef.current.touchMoveY = (dy / dist) * (clamp / maxDist);
    } else {
      inputRef.current.touchMoveX = 0;
      inputRef.current.touchMoveY = 0;
    }
  };

  const handleJoystickEnd = () => {
    joystickRef.current.active = false;
    setJoystickPos(prev => ({ ...prev, active: false }));
    inputRef.current.touchActive = false;
    inputRef.current.touchMoveX = 0;
    inputRef.current.touchMoveY = 0;
  };

  const handleBonkBtn = () => {
    inputRef.current.touchBonk = true;
    if (stateRef.current) {
      const { w, h } = getCanvasSize();
      if (stateRef.current.phase === 'menu') {
        stateRef.current.phase = 'playing';
      } else if (stateRef.current.phase === 'gameOver') {
        setScoreSaved(false);
        if (selectedChar) {
          stateRef.current = resetGame(stateRef.current, w, h, selectedChar, isMultiplayer);
        }
      }
    }
  };

  if (!selectedChar) {
    return (
      <div className="relative">
        {prefilledRoom && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-primary/20 backdrop-blur-md border border-primary/30 px-6 py-3 rounded-full animate-bounce">
            <p className="text-primary font-bold text-sm">
              ✨ Invited to join room: <span className="underline">{prefilledRoom}</span>
            </p>
          </div>
        )}
        <CharacterSelect 
          onSelect={(c) => {
            setSelectedChar(c);
            setIsMultiplayer(false);
            setInLobby(false);
          }} 
          onSelectMultiplayer={(c) => {
            setSelectedChar(c);
            setIsMultiplayer(true);
            setInLobby(true);
          }}
          defaultToParty={isMultiplayer}
        />
      </div>
    );
  }

  if (inLobby && selectedChar) {
    return (
      <PartyLobby 
        playerChar={selectedChar} 
        playerName={selectedChar.name + (Math.floor(Math.random() * 1000))}
        onGameStart={() => setInLobby(false)}
        onBack={() => {
          setSelectedChar(null);
          setInLobby(false);
          setIsMultiplayer(false);
        }}
      />
    );
  }

  if (gamePhase === 'levelSelect' && selectedChar) {
    return (
      <LevelSelect 
        onSelectLevel={(lvl) => {
          setSelectedLevel(lvl);
          setGamePhase('playing');
        }}
        onBack={() => {
          setGamePhase('menu');
          if (stateRef.current) stateRef.current.phase = 'menu';
        }}
      />
    );
  }

  return (
<div
  className="fixed inset-0 bg-background select-none overflow-hidden flex items-center justify-center z-0"
  style={{ touchAction: "none" }}
>
      <canvas
        ref={canvasRef}
        className="rounded-2xl border-2 border-white/10 shadow-2xl max-w-full max-h-[90vh] object-contain"
        style={{ touchAction: 'none' }}
      />

      {/* Level Start Splash Banner */}
      <AnimatePresence>
        {showLevelStart && selectedLevel && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[70] flex items-center justify-center pointer-events-none select-none"
          >
            <motion.div
              initial={{ scale: 0.8, y: 50, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 1.2, y: -50, opacity: 0 }}
              transition={{ type: "spring", damping: 15 }}
              className="relative px-12 py-8 rounded-[3rem] bg-black/20 backdrop-blur-3xl border border-white/20 shadow-[0_50px_100px_rgba(0,0,0,0.8)] overflow-hidden"
            >
              {/* Animated Accents */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10" />
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />
              <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-secondary to-transparent opacity-50" />

              <div className="relative text-center">
                <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.5em] mb-3">Entering Arena</p>
                <h2 className="text-6xl sm:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-white/40 mb-1 font-display tracking-tight uppercase">
                  Stage {selectedLevel}
                </h2>
                <div className="flex items-center justify-center gap-3">
                  <div className="h-px w-8 bg-white/20" />
                  <p className="text-primary font-black text-xs uppercase tracking-widest">
                    {selectedLevel % 5 === 0 ? "🔥 BOSS BATTLE 🔥" : 
                     selectedLevel <= 5 ? "Tutorial Zone" :
                     selectedLevel <= 10 ? "Power Surge" :
                     selectedLevel <= 15 ? "The Traps" :
                     selectedLevel <= 20 ? "Motion Sickness" : "Grand Finale"}
                  </p>
                  <div className="h-px w-8 bg-white/20" />
                </div>
                <p className="mt-6 text-white/60 text-[9px] font-bold uppercase tracking-[0.2em] animate-pulse">Eliminate All Enemies</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Top Navigation Bar - Premium "Pro-Gaming" Logic */}
      <div className="absolute top-4 left-4 right-4 h-12 bg-black/40 backdrop-blur-xl border border-white/10 flex items-center justify-between px-3 rounded-2xl z-50 shadow-[0_10px_30px_rgba(0,0,0,0.5)] landscape:hidden md:landscape:flex">
        <div className="flex items-center gap-1.5">
           <button 
             onClick={() => { window.location.href = '/'; }}
             className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center transition-all active:scale-90 active:bg-white/20 group"
             title="Home"
           >
              <Home className="w-4 h-4 text-white/70 group-hover:text-white" />
           </button>
           <button 
             onClick={() => { stopBackgroundMusic(); networkManager.disconnect(); setSelectedChar(null); setInLobby(false); }}
             className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center transition-all active:scale-90 active:bg-white/20 group"
             title="Change Character"
           >
              <User className="w-4 h-4 text-white/70 group-hover:text-white" />
           </button>
        </div>

        <div className="flex items-center gap-2">
           <button 
             onClick={() => { setLeaderboard(getLeaderboard()); setShowLeaderboard(!showLeaderboard); }}
             className="px-4 h-9 rounded-xl bg-gradient-to-r from-yellow-400/20 via-orange-500/20 to-yellow-600/20 border border-yellow-500/30 flex items-center gap-2 transition-all active:scale-95 group overflow-hidden relative shadow-lg"
           >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
              <Trophy className="w-4 h-4 text-yellow-400" />
              <span className="text-[11px] font-black text-yellow-100/90 tracking-widest uppercase">SCORES</span>
           </button>
        </div>
      </div>

      {/* Persistent Level Indicator */}
      {selectedLevel && gamePhase !== 'menu' && (
        <div className="absolute top-[4.5rem] left-1/2 -translate-x-1/2 z-40 bg-black/20 backdrop-blur-md px-4 py-1 rounded-full border border-white/5 pointer-events-none">
          <p className="text-[10px] font-black text-white/40 tracking-[0.3em] uppercase">Stage {selectedLevel}</p>
        </div>
      )}

      {showMobileControls && gamePhase !== 'menu' && (
        <div 
          className="absolute inset-x-0 bottom-0 top-0 pointer-events-none z-40 select-none"
        >
          {/* Universal Native Joystick Layer - Captures touches on the left side */}
          <div 
            className="absolute inset-y-0 left-0 w-1/2 pointer-events-auto"
            onTouchStart={handleJoystickStart}
            onTouchMove={handleJoystickMove}
            onTouchEnd={handleJoystickEnd}
          />

          {/* Joystick Visual Component */}
          <div 
            className={`absolute w-32 h-32 rounded-full pointer-events-none transition-opacity duration-300 flex items-center justify-center ${
              joystickPos.active ? 'opacity-100' : 'opacity-40'
            }`}
            style={{ 
              left: joystickPos.active ? joystickPos.x - 64 : 40, 
              bottom: joystickPos.active ? 'auto' : 40,
              top: joystickPos.active ? joystickPos.y - 64 : 'auto',
            }}
          >
            {/* Premium Native Joystick Base */}
            <div className="absolute inset-0 rounded-full bg-black/40 border-2 border-white/20 backdrop-blur-xl shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]" />
            <div className="absolute inset-6 rounded-full border border-white/10" />
            
            {/* High-Fidelity Handle */}
            <div 
              className={`w-16 h-16 rounded-full bg-gradient-to-br from-white/40 via-white/20 to-transparent border border-white/50 shadow-[0_10px_25px_rgba(0,0,0,0.6)] flex items-center justify-center relative z-10 active:scale-95 transition-transform duration-75 ${
                !joystickPos.active ? 'opacity-50' : ''
              }`}
              style={{
                transform: `translate(${inputRef.current.touchMoveX * 44}px, ${inputRef.current.touchMoveY * 44}px)`,
              }}
            >
              <div className="w-6 h-6 rounded-full bg-white/50 blur-[1px] shadow-inner" />
              {/* Pro Halo Glow */}
              <div className="absolute inset-[-6px] rounded-full bg-cyan-400/20 blur-xl opacity-40 animate-pulse" />
              <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-white/10 to-transparent" />
            </div>
          </div>

          <div className="absolute inset-x-0 bottom-0 flex justify-between items-end p-6 pb-12 pointer-events-none">
            <div className="w-24 h-24" /> {/* Spacer for Joystick area */}

            {/* Micro Satellite Cluster with Unified HUD */}
            <div className="flex flex-col items-end gap-3 pointer-events-none">
              {/* Status Label (Glass Look) */}
              {(() => {
                const p = stateRef.current?.players.find((p) => p.isPlayer);
                if (!p) return null;
                const isBoosting = p.boosterTimer > 0;
                const isReady = p.boosterCooldown <= 0 && !isBoosting;
                return (
                  <div
                    className={`text-[9px] font-black px-2.5 py-1 rounded-full backdrop-blur-xl border border-white/10 transition-all duration-300 shadow-lg uppercase tracking-tighter ${
                      isBoosting
                        ? 'bg-cyan-500/30 text-cyan-200 animate-pulse border-cyan-400/30 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                        : isReady
                          ? 'bg-green-500/30 text-green-200 border-green-400/30'
                          : 'bg-white/5 text-white/40 border-white/5'
                    }`}
                  >
                    {isBoosting
                      ? '⚡ Boosting ⚡'
                      : isReady
                        ? 'Booster Ready'
                        : 'Recharging...'}
                    {isReady && (
                      <motion.span 
                        animate={{ opacity: [0.4, 1, 0.4] }} 
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="ml-2 inline-block w-2 h-2 rounded-full bg-[#a2ff00] shadow-[0_0_8px_#a2ff00]"
                      />
                    )}
                  </div>
                );
              })()}

              {/* Satellite Booster Button with Pro Progress Ring */}
              <div className="relative">
                <AnimatePresence>
                  {showBoostBlast && (
                    <motion.div 
                      initial={{ scale: 0.8, opacity: 1 }}
                      animate={{ scale: 2.5, opacity: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.6, ease: "easeOut" }}
                      className="absolute inset-0 rounded-full border-4 border-cyan-400 shadow-[0_0_30px_rgba(6,182,212,0.8)] z-0 pointer-events-none"
                    />
                  )}
                </AnimatePresence>

                {(() => {
                  const p = stateRef.current?.players.find((p) => p.isPlayer);
                  const cooldownRatio = p
                    ? p.boosterTimer > 0
                      ? p.boosterTimer / 3.0
                      : 1 - p.boosterCooldown / 10.0
                    : 0;
                  const isBoosting = p?.boosterTimer > 0;
                  const isReady = p?.boosterCooldown <= 0 && !isBoosting;
                  return (
                    <svg className="absolute inset-[-5px] w-[calc(100%+10px)] h-[calc(100%+10px)] -rotate-90 pointer-events-none drop-shadow-[0_0_5px_rgba(255,255,255,0.2)]">
                      <circle
                        cx="50%"
                        cy="50%"
                        r="44%"
                        fill="none"
                        stroke="rgba(255,255,255,0.05)"
                        strokeWidth="4"
                      />
                      <circle
                        cx="50%"
                        cy="50%"
                        r="44%"
                        fill="none"
                        stroke={isBoosting ? '#00fbff' : isReady ? '#a2ff00' : '#ff9100'}
                        strokeWidth="4"
                        strokeDasharray="100"
                        strokeDashoffset={100 - Math.max(0, Math.min(1, cooldownRatio)) * 100}
                        className="transition-all duration-300 ease-linear"
                        strokeLinecap="round"
                      />
                    </svg>
                  );
                })()}
                <button
                  className={`w-16 h-16 rounded-full bg-gradient-to-br from-cyan-400 via-blue-600 to-indigo-800 text-white font-black text-[9px] shadow-[0_8px_20px_rgba(0,0,0,0.5),inset_0_2px_4px_rgba(255,255,255,0.3)] active:scale-90 transition-all pointer-events-auto border-2 border-white/20 outline outline-4 outline-white/5 flex items-center justify-center flex-col gap-0 relative overflow-hidden ${
                    stateRef.current?.players.find((p) => p.isPlayer)
                      ?.boosterCooldown === 0
                      ? 'shadow-[0_0_30px_rgba(6,182,212,0.6)] saturate-150 animate-pulse'
                      : 'opacity-70 saturate-50'
                  }`}
                  onTouchStart={(e) => {
                    e.preventDefault();
                    inputRef.current.boost = true;
                  }}
                  onTouchEnd={(e) => {
                    e.preventDefault();
                    inputRef.current.boost = false;
                  }}
                >
                  <span className="text-xl filter drop-shadow-md z-10">⚡</span>
                  <span className="tracking-tighter z-10">BOOST</span>
                  {/* Inner Glow Shimmer */}
                  <div className={`absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent pointer-events-none transition-transform duration-1000 ${
                    stateRef.current?.players.find((p) => p.isPlayer)?.boosterCooldown === 0 ? 'animate-shimmer' : ''
                  }`} />
                </button>
              </div>

              {/* Main Command BONK Button (Metallic Sunburst Design) */}
              <button
                className="w-22 h-22 aspect-square rounded-full bg-gradient-to-r from-yellow-400 via-orange-500 to-red-600 text-white font-black text-base shadow-[0_12px_30px_rgba(0,0,0,0.6),inset_0_4px_8px_rgba(255,255,255,0.4)] active:scale-95 active:shadow-inner transition-all pointer-events-auto border-[3px] border-white/40 outline outline-6 outline-white/5 flex items-center justify-center uppercase tracking-tighter relative overflow-hidden group"
                style={{ textShadow: '0 2px 5px rgba(0,0,0,0.5)', padding: 0 }}
                onTouchStart={(e) => {
                  e.preventDefault();
                  handleBonkBtn();
                }}
              >
                <span className="z-10 relative">Bonk</span>
                {/* Sunburst Glow */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.2)_0%,_transparent_70%)] pointer-events-none" />
                {/* Metallic Highlight */}
                <div className="absolute -inset-full bg-gradient-to-r from-transparent via-white/20 to-transparent rotate-45 group-active:translate-x-full transition-transform duration-300" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 1. Instruction Overlay (Menu Phase) */}
      {gamePhase === 'menu' && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-xl z-[60] flex flex-col items-center justify-center p-4 sm:p-6 text-center overflow-y-auto">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="max-w-md w-full bg-white/5 border border-white/20 backdrop-blur-2xl rounded-[2.5rem] p-6 sm:p-10 shadow-[0_40px_100px_rgba(0,0,0,0.7),inset_0_1px_1px_rgba(255,255,255,0.1)] relative overflow-hidden my-auto"
          >
            {/* Animated Background Glow */}
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-primary/20 blur-[80px] rounded-full pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-secondary/20 blur-[80px] rounded-full pointer-events-none" />

            <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-yellow-200 via-yellow-400 to-orange-600 mb-2 tracking-tighter uppercase font-display" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}>
              BONK ROYALE
            </h1>
            <p className="text-white/50 text-xs mb-6 sm:mb-10 font-bold tracking-[0.3em] uppercase">Multiplayer Arena Battle</p>
            
            <div className="grid grid-cols-1 gap-3 sm:gap-4 mb-8 sm:mb-12">
              <div className="flex items-center gap-4 bg-white/5 p-4 rounded-3xl border border-white/10 group hover:bg-white/10 transition-colors">
                <div className="w-14 h-14 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-2xl flex items-center justify-center text-2xl shadow-lg group-hover:scale-110 transition-transform">🕹️</div>
                <div className="text-left leading-tight">
                  <p className="text-white font-black text-xs uppercase tracking-widest mb-1">Movement</p>
                  <p className="text-white/40 text-[11px] font-medium uppercase tracking-tighter">Use keys or the virtual joystick</p>
                </div>
              </div>
              <div className="flex items-center gap-4 bg-white/5 p-4 rounded-3xl border border-white/10 group hover:bg-white/10 transition-colors">
                <div className="w-14 h-14 bg-gradient-to-br from-orange-400 to-red-600 rounded-2xl flex items-center justify-center text-2xl shadow-lg group-hover:scale-110 transition-transform">💥</div>
                <div className="text-left leading-tight">
                  <p className="text-white font-black text-xs uppercase tracking-widest mb-1">The Bonk</p>
                  <p className="text-white/40 text-[11px] font-medium uppercase tracking-tighter">Hammer enemies off the arena edge</p>
                </div>
              </div>
            </div>

            <button 
              onClick={() => { 
                const newPhase = isMultiplayer ? 'playing' : 'levelSelect';
                if (stateRef.current) {
                  stateRef.current.phase = newPhase;
                }
                setGamePhase(newPhase);
              }}
              className="w-full h-16 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-600 rounded-3xl text-white font-black text-xl shadow-[0_15px_30px_rgba(249,115,22,0.3)] active:scale-90 transition-all group relative overflow-hidden ring-4 ring-orange-500/20"
            >
              <div className="absolute inset-0 bg-white/30 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              <span className="relative z-10 flex items-center justify-center gap-2">
                START BATTLE <span className="text-2xl">→</span>
              </span>
            </button>
          </motion.div>
        </div>
      )}

      {/* 2. PAUSE OVERLAY */}
      {gamePhase === 'paused' && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-xl z-[60] flex flex-col items-center justify-center p-6 text-center">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-sm w-full bg-white/5 border border-white/10 backdrop-blur-2xl rounded-[2.5rem] p-10 shadow-2xl"
          >
            <h1 className="text-4xl font-black text-white mb-8 tracking-tighter uppercase font-display">
              Paused
            </h1>
            <div className="space-y-4">
              <button 
                onClick={() => { if (stateRef.current) stateRef.current.phase = 'playing'; }}
                className="w-full h-16 bg-gradient-to-r from-cyan-400 to-blue-600 rounded-3xl text-white font-black text-xl shadow-lg active:scale-95 transition-all outline-none"
              >
                RESUME
              </button>
              <button 
                onClick={() => { 
                  if (stateRef.current) {
                    stateRef.current.phase = isMultiplayer ? 'menu' : 'levelSelect';
                    setGamePhase(stateRef.current.phase);
                  }
                }}
                className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl text-white/70 font-bold active:scale-95 transition-all outline-none"
              >
                QUIT TO MENU
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* 3. Game Over Overlay (GameOver Phase) */}
      {gamePhase === 'gameOver' && (
        <div className="absolute inset-0 bg-black/90 backdrop-blur-xl z-[60] flex flex-col items-center justify-center p-6 text-center">
          {(() => {
            const player = stateRef.current?.players.find(p => p.isPlayer);
            const won = player?.alive;
            return (
              <motion.div 
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-sm w-full"
              >
                <div className={`text-7xl mb-6 ${won ? 'animate-bounce' : 'grayscale'}`}>{won ? '🏆' : '💀'}</div>
                <h2 className={`text-6xl font-black mb-6 tracking-tighter uppercase font-display ${won ? 'text-yellow-400' : 'text-red-500'}`}>
                  {won ? 'Victory!' : 'Bonked!'}
                </h2>
                <div className="bg-white/5 border border-white/10 backdrop-blur-3xl rounded-[2.5rem] p-8 mb-8 shadow-2xl relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
                  <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.4em] mb-2">Final Score</p>
                  <p className="text-white text-5xl font-black mb-6 tracking-tighter">{stateRef.current?.playerScore || 0}</p>
                  
                  <div className="flex justify-between items-center text-[11px] font-black mb-6">
                    <span className="text-white/30 uppercase tracking-[0.2em]">Level Progress</span>
                    <span className="text-yellow-400">STAGE {stateRef.current?.round || 1}</span>
                  </div>
                  
                  {/* Minified Leaderboard inside Game Over */}
                  <div className="space-y-2 mt-2 border-t border-white/10 pt-6">
                    {leaderboard.slice(0, 3).map((entry, i) => (
                      <div key={i} className="flex justify-between items-center text-[11px] font-bold">
                        <span className="text-white/40 uppercase tracking-tighter">{i+1}. {entry.name}</span>
                        <span className="text-yellow-400/80 font-mono">{entry.score}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-4">
                  <button 
                    onClick={() => { 
                      setGamePhase(isMultiplayer ? 'menu' : 'levelSelect');
                      if (stateRef.current) stateRef.current.phase = isMultiplayer ? 'menu' : 'levelSelect';
                    }}
                    className="flex-1 h-16 bg-white/5 hover:bg-white/10 border border-white/10 rounded-3xl text-white/50 font-black text-sm uppercase tracking-widest active:scale-95 transition-all outline-none"
                  >
                    Quit
                  </button>
                  <button 
                    onClick={() => { 
                      setScoreSaved(false);
                      const { w, h } = getCanvasSize();
                      stateRef.current = resetGame(stateRef.current!, w, h, selectedChar!, isMultiplayer);
                    }}
                    className={`flex-[2] h-16 ${won ? 'bg-gradient-to-r from-yellow-400 to-orange-600' : 'bg-gradient-to-r from-cyan-400 to-blue-600'} rounded-3xl text-white font-black text-xl shadow-xl active:scale-95 transition-all outline-none`}
                  >
                    {won ? 'PLAY AGAIN' : 'RETRY'}
                  </button>
                </div>
              </motion.div>
            );
          })()}
        </div>
      )}

      {/* 4. Victory Overlay (Victory Phase) */}
      {gamePhase === 'victory' && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-xl z-[60] flex flex-col items-center justify-center p-6 text-center">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-yellow-400/10 rounded-full blur-[120px] animate-pulse" />
            <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-orange-500/10 rounded-full blur-[120px] animate-pulse delay-1000" />
          </div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative z-10 max-w-sm w-full bg-white/5 border border-yellow-500/30 backdrop-blur-3xl rounded-[3rem] p-10 shadow-[0_0_100px_rgba(234,179,8,0.1)]"
          >
            <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-100 to-yellow-600 mb-2 drop-shadow-sm font-display uppercase tracking-tighter">
              Cleared!
            </h1>
            <p className="text-yellow-500/50 text-[10px] font-black uppercase tracking-[0.5em] mb-10">Stage Complete</p>
            
            <div className="flex justify-center gap-6 my-10">
              {[1, 2, 3].map((star) => {
                 const achieved = star <= starsEarned; 
                 return (
                  <motion.div 
                    key={star} 
                    initial={{ scale: 0 }}
                    animate={{ scale: achieved ? 1 : 0.8 }}
                    transition={{ delay: 0.2 * star, type: "spring" }}
                    className={`text-6xl transform ${achieved ? 'text-yellow-400 drop-shadow-[0_0_20px_rgba(250,204,21,0.8)]' : 'text-white/5 grayscale'}`}
                  >
                    ★
                  </motion.div>
                 )
              })}
            </div>

            <div className="flex flex-col gap-4 mt-12">
              <button 
                onClick={() => { 
                  if (selectedLevel && selectedLevel < 30) {
                    setSelectedLevel(selectedLevel + 1);
                  } else {
                    setGamePhase('levelSelect');
                  }
                }}
                className="w-full h-16 bg-gradient-to-r from-yellow-400 via-orange-500 to-yellow-600 rounded-3xl text-black font-black text-xl shadow-[0_10px_40px_rgba(250,204,21,0.3)] active:scale-95 transition-all outline-none"
              >
                {selectedLevel && selectedLevel < 30 ? 'NEXT LEVEL' : 'ALL CLEAR!'}
              </button>
              <button 
                onClick={() => { 
                  setGamePhase('levelSelect');
                  if (stateRef.current) stateRef.current.phase = 'levelSelect';
                }}
                className="w-full h-14 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-white/50 font-black text-sm uppercase tracking-widest active:scale-95 transition-all outline-none"
              >
                STAGES
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* 4. Leaderboard overlay (Manual Toggle) */}
      {showLeaderboard && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[60]" onClick={() => setShowLeaderboard(false)}>
          <div
            className="bg-[#1a1c1e] border border-white/10 rounded-[2.5rem] p-8 max-w-sm w-full mx-4 shadow-[0_30px_60px_rgba(0,0,0,0.8)]"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-3xl font-black text-white text-center mb-6 tracking-tighter" style={{ fontFamily: 'var(--font-display)' }}>
              🏆 TOP BONKERS
            </h2>
            {leaderboard.length === 0 ? (
              <p className="text-white/40 text-center text-sm py-10">No scores yet. Start bonking!</p>
            ) : (
              <div className="space-y-2 mb-8">
                {leaderboard.slice(0, 5).map((entry, i) => (
                  <div
                    key={i}
                    className={`flex items-center justify-between px-4 py-3 rounded-2xl transition-all ${
                      i === 0 ? 'bg-yellow-400/10 border border-yellow-400/20' : 'bg-white/5 border border-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg w-6 text-center">{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}</span>
                      <span className="text-sm font-bold text-white/90">{entry.name}</span>
                    </div>
                    <div className="text-right">
                      <span className={`text-sm font-black ${i === 0 ? 'text-yellow-400' : 'text-white/60'}`}>{entry.score}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <button
              onClick={() => setShowLeaderboard(false)}
              className="w-full py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-white/60 font-bold text-sm transition-all active:scale-95"
            >
              DISMISS
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BonkRoyaleGame;
