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
}

export const LEVELS: LevelDef[] = Array.from({ length: 100 }, (_, i) => {
  const level = i + 1;
  const isBoss = level % 5 === 0;
  
  // Base Difficulty Curve
  const enemies = Math.min(20, Math.floor(level * 1.5) + 2);
  
  // Hazards
  let hazardType: LevelDef['hazardType'] = 'none';
  if (level >= 11 && level <= 15) hazardType = 'traps';
  if (level >= 16 && level <= 20) hazardType = 'moving';
  if (level >= 21) hazardType = 'mixed';
  
  const hazardCount = hazardType === 'none' ? 0 : Math.floor(level / 3);

  // Time requirements (tighter as levels go up)
  const baseTime = 60 + enemies * 5; // generous base
  
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
    }
  };
});
