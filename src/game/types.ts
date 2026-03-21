import { ArenaTheme } from './arenaThemes';
import { CharacterDef } from './characters';

export interface SelectedCharacter {
  character: CharacterDef;
  skinId: string;
}

export interface Vec2 {
  x: number;
  y: number;
}

export interface Player {
  id: string;
  name: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  eyeColor: string;
  isPlayer: boolean;
  alive: boolean;
  bonkCooldown: number;
  stunTimer: number;
  score: number;
  facing: number;
  expression: 'normal' | 'angry' | 'stunned' | 'happy';
  knockbackResist: number;
  superBonkTimer: number;
  boosterTimer: number;
  boosterCooldown: number;
  activeAbility: string | null;
  abilityTimer: number;
  activePower: 'speed' | 'size' | 'shield' | null;
  powerTimer: number;
  isBoss?: boolean;
}

export interface PowerUp {
  x: number;
  y: number;
  type: 'speed' | 'size' | 'superBonk' | 'shield';
  radius: number;
  alive: boolean;
  pulsePhase: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export interface Hazard {
  x: number;
  y: number;
  type: 'ice' | 'trampoline' | 'trap' | 'moving';
  radius: number;
  alive: boolean;
  cooldown: number; // For trampolines/traps
  vx?: number; // For moving
  vy?: number; // For moving
  anchorX?: number;
  anchorY?: number;
  life?: number;
  maxLife?: number;
}

export type SoundEvent = 'bonk' | 'elimination' | 'powerup' | 'victory' | 'defeat';

export type GameMode = 'single-player' | 'bonk-arena' | 'obstacle-chaos' | 'team-bonk' | 'boss-bonk';

export interface GameState {
  phase: 'menu' | 'stage1Intro' | 'countdown' | 'levelSelect' | 'playing' | 'paused' | 'victory' | 'gameOver';
  level: number; // Current Level (1-100), 0 if multiplayer/endless
  players: Player[];
  powerUps: PowerUp[];
  particles: Particle[];
  hazards: Hazard[];
  arenaRadius: number;
  arenaMaxRadius: number;
  arenaCenter: Vec2;
  time: number;
  maxTime: number; // from level config
  round: number;
  playerScore: number;
  shrinkTimer: number;
  message: string;
  messageTimer: number;
  soundEvents: SoundEvent[];
  theme: ArenaTheme;
  countdownTimer: number;
  nextBossRound?: number;
  isBossRound?: boolean;
  gameMode: GameMode;
}
