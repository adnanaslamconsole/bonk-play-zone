import { ARENA_THEMES } from './arenaThemes';
import { getMonsterForLevel } from './monsters';

export interface LevelDef {
  number: number;
  totalEnemies: number;
  enemyTypes: string[]; // e.g. 'basic', 'fast', 'heavy'
  hazardType: 'none' | 'traps' | 'moving' | 'mixed';
  hazardCount: number;
  timeLimit: number; // in seconds, 0 = no limit
  starRequirements: {
    one: number; // Max time or min score
    two: number;
    three: number;
  };
  theme: string; // Theme name
  monster?: string | null; // Monster ID if boss level
}

export const LEVELS: LevelDef[] = Array.from({ length: 100 }, (_, i) => {
  const level = i + 1;
  const isBoss = level % 3 === 0;
  
  // Base Difficulty Curve
  const enemies = Math.min(20, Math.floor(level * 1.5) + 2);
  
  // Hazards - unique per level
  const hazardTypes: LevelDef['hazardType'][] = ['none', 'traps', 'moving', 'mixed'];
  const hazardType = hazardTypes[level % hazardTypes.length];
  const hazardCount = hazardType === 'none' ? 0 : Math.floor(level / 3) + 1;

  // Time requirements (tighter as levels go up)
  const baseTime = 60 + enemies * 5; // generous base
  
  // Unique theme per level
  const theme = ARENA_THEMES[level % ARENA_THEMES.length].name;
  
  // Monster for boss levels
  const monster = isBoss ? getMonsterForLevel(level)?.id || null : null;

  return {
    number: level,
    totalEnemies: enemies,
    enemyTypes: level > 10 ? ['basic', 'fast'] : ['basic'],
    hazardType,
    hazardCount,
    timeLimit: isBoss ? 120 : 0, 
    starRequirements: {
      one: baseTime,
      two: Math.floor(baseTime * 0.75),
      three: Math.floor(baseTime * 0.5),
    },
    theme,
    monster,
  };
});
