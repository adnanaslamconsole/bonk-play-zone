import React, { useState, useEffect } from 'react';
import { CharacterDef } from './characters';import { SelectedCharacter } from './types';import { networkManager } from './NetworkManager';

interface PartyLobbyProps {
  playerChar: CharacterDef;
  playerName: string;
  onGameStart: () => void;
  onBack: () => void;
}

export default function PartyLobby({ playerChar, playerName, onGameStart, onBack }: PartyLobbyProps) {
  const [roomCode, setRoomCode] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [players, setPlayers] = useState<any[]>(networkManager.playersInRoom);
  const [mode, setMode] = useState<'select' | 'hosting' | 'joining'>(networkManager.role === 'host' ? 'hosting' : networkManager.role === 'client' ? 'joining' : 'select');
  const [copied, setCopied] = useState(false);

  const [timeLeft, setTimeLeft] = useState<number>(300); // 5 minutes in seconds

  useEffect(() => {
    // Check if there is a room in the URL and auto-join
    const urlParams = new URLSearchParams(window.location.search);
    const urlRoom = urlParams.get('room');
    if (urlRoom && mode === 'select' && joinCode === '') {
      const code = urlRoom;
      setJoinCode(code);
      setMode('joining');
      const join = async () => {
        try {
          await networkManager.joinRoom(code, playerName, playerChar);
        } catch (err) {
          console.error("Failed to auto-join", err);
          alert("Lobby not found or expired.");
          setMode('select');
        }
      };
      join();
    }
  }, [mode, joinCode, playerName, playerChar]);

  useEffect(() => {
    // Timer Logic
    let interval: any;
    if (mode !== 'select') {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 0) return 0;
          return prev - 1;
        });
      }, 1000);
    } else {
      setTimeLeft(300);
    }
    return () => clearInterval(interval);
  }, [mode]);

  useEffect(() => {
    // Setup network callbacks
    networkManager.onLobbyUpdate = (newPlayers) => {
      console.log('[Lobby] Received update:', newPlayers);
      setPlayers([...newPlayers]); // force new reference
    };

    networkManager.onGameStart = () => {
      onGameStart();
    };

    networkManager.onLobbyExpired = () => {
      alert("Time expired\nNo game was started\nReturning to home screen");
      handleLeave();
    };

    return () => {
      networkManager.onLobbyUpdate = null;
      networkManager.onGameStart = null;
      networkManager.onLobbyExpired = null;
    };
  }, [onGameStart]);

  const handleHost = async () => {
    setMode('hosting');
    try {
      const code = await networkManager.createRoom(playerName, playerChar);
      setRoomCode(code);
    } catch (err) {
      console.error("Failed to create room", err);
      setMode('select');
    }
  };

  const handleJoin = async () => {
    if (!joinCode) return;
    setMode('joining');
    try {
      await networkManager.joinRoom(joinCode, playerName, playerChar);
    } catch (err) {
      console.error("Failed to join room", err);
      alert("Lobby not found or expired.");
      setMode('select');
    }
  };

  const handleLeave = () => {
    networkManager.disconnect();
    setMode('select');
    setRoomCode('');
    setJoinCode('');
    setPlayers([]);
    setTimeLeft(300);
    // Remove ?room= from URL without reloading
    const url = new URL(window.location.href);
    url.searchParams.delete('room');
    window.history.pushState({}, '', url.toString());
  };

  const startActualGame = () => {
    networkManager.startGame();
    onGameStart(); // Local start for host
  };

  const copyInviteLink = () => {
    const url = new URL(window.location.href);
    url.searchParams.set('room', networkManager.roomId || '');
    navigator.clipboard.writeText(url.toString());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (mode === 'select') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background relative overflow-hidden">
        {/* Background blobs */}
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-primary/20 rounded-full mix-blend-screen filter blur-3xl opacity-50 animate-blob" />
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-secondary/20 rounded-full mix-blend-screen filter blur-3xl opacity-50 animate-blob animation-delay-2000" />
        
        <div className="z-10 bg-card/90 backdrop-blur-md p-8 rounded-3xl border-2 border-border shadow-neon max-w-md w-full text-center">
          <h1 className="text-4xl font-bold text-primary mb-2 drop-shadow-sm font-display uppercase tracking-wider">
            Multiplayer Party
          </h1>
          <p className="text-muted-foreground mb-8 text-sm">Play online with your friends!</p>
          
          <div className="flex flex-col gap-4">
            <button 
              onClick={handleHost}
              className="w-full py-4 rounded-xl bg-primary text-primary-foreground font-bold text-lg shadow-gold hover:scale-105 active:scale-95 transition-all"
            >
              👑 Host a Game
            </button>
            
            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-muted-foreground/30"></div>
              <span className="flex-shrink-0 mx-4 text-muted-foreground text-sm font-bold">OR</span>
              <div className="flex-grow border-t border-muted-foreground/30"></div>
            </div>

            <div className="flex gap-2">
              <input 
                type="text" 
                placeholder="ROOM CONNECTION ID" 
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                className="w-full bg-background border-2 border-border rounded-xl px-4 py-3 text-center sm:text-lg font-bold text-foreground placeholder-muted-foreground outline-none focus:border-primary transition-colors overflow-hidden text-ellipsis whitespace-nowrap"
                style={{ fontFamily: 'monospace' }}
              />
              <button 
                onClick={handleJoin}
                disabled={joinCode.length < 3}
                className="px-6 rounded-xl bg-secondary text-secondary-foreground font-bold shadow-neon disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed hover:scale-105 active:scale-95 transition-all"
              >
                JOIN
              </button>
            </div>
          </div>
          
          <button 
            onClick={onBack}
            className="mt-8 text-muted-foreground hover:text-foreground font-bold text-sm transition-colors"
          >
            ← Back to Character Select
          </button>
        </div>
      </div>
    );
  }

  // Lobby View (Host or Joined)
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background relative overflow-hidden">
      <div className="z-10 w-full max-w-4xl p-4">
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 mb-8">
          <button 
            onClick={handleLeave} 
            className="text-muted-foreground hover:text-foreground font-bold border-2 border-border/20 rounded-xl px-4 py-3 sm:py-2 transition-all text-sm flex items-center justify-center gap-2"
          >
            ← Leave Room
          </button>
          
          <div className="bg-card border-2 border-primary/50 shadow-neon px-4 py-3 rounded-2xl flex items-center justify-between sm:justify-start gap-4 relative flex-1 max-w-md mx-auto sm:mx-0">
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 overflow-hidden">
              <span className="text-muted-foreground font-bold text-[10px] sm:text-xs uppercase tracking-[2px]">Invite Link</span>
              <span className="text-sm sm:text-base font-bold text-primary tracking-[1px] font-mono leading-none truncate max-w-[150px] sm:max-w-xs">{networkManager.roomId}</span>
            </div>
            <button 
              onClick={copyInviteLink}
              className={`px-3 py-2 rounded-lg text-[10px] sm:text-xs font-bold transition-all shrink-0 border border-border/20 ${
                copied ? 'bg-green-500 text-white border-green-400' : 'bg-muted hover:bg-muted/80 text-muted-foreground'
              }`}
            >
              {copied ? 'COPIED!' : '🔗 COPY LINK'}
            </button>
          </div>
        </div>
        
        {/* Timer UI */}
        <div className="text-center mb-6">
           <span className="text-xl font-bold font-mono text-primary bg-primary/10 px-4 py-2 rounded-xl border border-primary/20 shadow-neon">
             Game starts in: {Math.floor(timeLeft / 60).toString().padStart(2, '0')}:{(timeLeft % 60).toString().padStart(2, '0')}
           </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {players.map((p, i) => (
            <div key={i} className="bg-card border-2 border-border p-4 rounded-2xl flex flex-col items-center gap-3 relative overflow-hidden group">
              {i === 0 && <div className="absolute top-2 left-2 text-xl" title="Host">👑</div>}
              
              <div 
                className="w-20 h-20 rounded-full flex items-center justify-center shadow-inner relative"
                style={{ backgroundColor: p.character.color }}
              >
                 <span className="text-3xl font-bold text-black/20">?</span>
                 {p.id === networkManager.playerId && (
                   <div className="absolute -bottom-1 bg-primary text-primary-foreground text-[10px] font-black px-2 py-0.5 rounded-full shadow-neon border border-white/20">
                     YOU
                   </div>
                 )}
              </div>
              
              <div className="text-center">
                <p className="font-bold text-foreground text-lg truncate max-w-[120px]">{p.name}</p>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{p.character.name}</p>
              </div>
            </div>
          ))}
          
          {/* Empty slots */}
          {Array.from({ length: Math.max(0, 8 - players.length) }).map((_, i) => (
            <div key={`empty-${i}`} className="bg-muted/30 border-2 border-dashed border-border/50 p-4 rounded-2xl flex flex-col items-center justify-center gap-3 opacity-50">
              <div className="w-16 h-16 rounded-full border-2 border-muted-foreground/30 flex items-center justify-center">
                 <span className="text-muted-foreground/30 text-xl font-bold">+</span>
              </div>
              <p className="text-sm font-bold text-muted-foreground">Waiting...</p>
            </div>
          ))}
        </div>

        <div className="flex justify-center">
          {networkManager.role === 'host' ? (
            <button 
              onClick={startActualGame}
              disabled={players.length < 1} // Can start alone for testing
              className="px-12 py-5 rounded-2xl bg-primary text-primary-foreground font-bold text-2xl shadow-gold hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              START BRAWL!
            </button>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="px-12 py-5 rounded-2xl bg-muted text-muted-foreground font-bold text-xl border-2 border-border shadow-inner">
                {players.length <= 1 ? 'Connecting to host...' : 'Waiting for Host to start...'}
              </div>
              {players.length <= 1 && (
                <p className="text-xs text-muted-foreground animate-pulse">Ensure your friend has the lobby open!</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
