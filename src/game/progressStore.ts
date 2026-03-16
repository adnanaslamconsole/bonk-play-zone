export interface LevelProgress {
  unlocked: boolean;
  stars: number; // 0 to 3
  bestTime: number; // in milliseconds
}

export interface GameProgress {
  levels: Record<number, LevelProgress>;
  totalCoins: number;
}

const STORAGE_KEY = 'bonkstars_progress';

const getInitialProgress = (): GameProgress => ({
  levels: {
    1: { unlocked: true, stars: 0, bestTime: 0 },
  },
  totalCoins: 0,
});

export const loadProgress = (): GameProgress => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return getInitialProgress();
    
    // Merge saved data with initial structure in case of new fields
    const parsed = JSON.parse(saved);
    const initial = getInitialProgress();
    
    return {
      ...initial,
      ...parsed,
      levels: { ...initial.levels, ...parsed.levels }
    };
  } catch (err) {
    console.error('Failed to load progress', err);
    return getInitialProgress();
  }
};

export const saveProgress = (progress: GameProgress) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch (err) {
    console.error('Failed to save progress', err);
  }
};

export const unlockLevel = (levelNumber: number) => {
  const progress = loadProgress();
  if (!progress.levels[levelNumber]) {
    progress.levels[levelNumber] = { unlocked: true, stars: 0, bestTime: 0 };
    saveProgress(progress);
  }
};

export const saveLevelCompletion = (levelNumber: number, stars: number, timeMs: number) => {
  const progress = loadProgress();
  const current = progress.levels[levelNumber] || { unlocked: true, stars: 0, bestTime: 0 };
  
  progress.levels[levelNumber] = {
    unlocked: true,
    stars: Math.max(current.stars, stars),
    bestTime: current.bestTime === 0 ? timeMs : Math.min(current.bestTime, timeMs),
  };
  
  // Auto-unlock next level
  if (levelNumber < 30) {
    const nextLvl = levelNumber + 1;
    if (!progress.levels[nextLvl]) {
      progress.levels[nextLvl] = { unlocked: true, stars: 0, bestTime: 0 };
    }
  }
  
  saveProgress(progress);
};

export const addCoins = (amount: number) => {
  const progress = loadProgress();
  progress.totalCoins += amount;
  saveProgress(progress);
};
