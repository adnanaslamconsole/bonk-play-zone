export interface LevelProgress {
  unlocked: boolean;
  stars: number; // 0 to 3
  bestTime: number; // in milliseconds
}

export interface CharacterProgress {
  unlocked: boolean;
  level: number;
  xp: number;
}

export interface EmoteDef {
  id: string;
  name: string;
  description: string;
  cost: number;
}

export interface GameProgress {
  levels: Record<number, LevelProgress>;
  totalCoins: number;
  totalXP: number;
  playerLevel: number;
  characters: Record<string, CharacterProgress>;
  unlockedSkins: string[]; // Array of skin IDs like 'bonky-golden'
  unlockedEmotes: string[]; // Array of emote IDs
  lootBoxes: number;
  dailyStreak: number;
  lastClaimDate: string | null; // YYYY-MM-DD
  lastLoginDate: string | null; // YYYY-MM-DD
}

import { CHARACTERS } from './characters';
import { computeNextStreak, getLocalDateKey, getRewardForStreak, DailyReward } from './dailyRewards';
import { rollLootboxReward, LootboxReward } from './lootbox';

export interface DailyRewardStatus {
  canClaim: boolean;
  currentStreak: number;
  nextStreak: number;
  reward: DailyReward;
}

export const EMOTES: EmoteDef[] = [
  { id: 'victory-dance', name: 'Victory Dance', description: 'Celebrate your win!', cost: 200 },
  { id: 'sad-tears', name: 'Sad Tears', description: 'When things go wrong', cost: 150 },
  { id: 'angry-stomp', name: 'Angry Stomp', description: 'Show your frustration', cost: 250 },
  { id: 'happy-bounce', name: 'Happy Bounce', description: 'Express joy', cost: 180 },
  { id: 'cool-pose', name: 'Cool Pose', description: 'Strike a pose', cost: 300 },
];

const STORAGE_KEY = 'bonk-royale-progress';

const UNLOCK_ORDER = [
  'fluffernaut', 'cactuscarl', 'chunko', 'wobbly', 'shadow', 'magma', 'blobette', 'toast', 'frosty', 'sirbonks', 'zappy'
];

const getInitialProgress = (): GameProgress => {
  const initialChars: Record<string, CharacterProgress> = {};
  CHARACTERS.forEach(char => {
    initialChars[char.id] = { unlocked: char.id === 'bonky', level: 1, xp: 0 };
  });
  
  return {
    levels: {
      1: { unlocked: true, stars: 0, bestTime: 0 },
    },
    totalCoins: 0,
    totalXP: 0,
    playerLevel: 1,
    characters: initialChars,
    unlockedSkins: [],
    unlockedEmotes: [],
    lootBoxes: 0,
    dailyStreak: 0,
    lastClaimDate: null,
    lastLoginDate: null,
  };
};

export const loadProgress = (): GameProgress => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return getInitialProgress();
    
    // Merge saved data with initial structure in case of new fields
    const parsed = JSON.parse(saved);
    const initial = getInitialProgress();
    
    // Ensure all characters are present
    const mergedChars = { ...initial.characters };
    Object.keys(parsed.characters || {}).forEach(charId => {
      if (mergedChars[charId]) {
        mergedChars[charId] = { ...mergedChars[charId], ...parsed.characters[charId] };
      }
    });
    
    return {
      ...initial,
      ...parsed,
      levels: { ...initial.levels, ...parsed.levels },
      characters: mergedChars,
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
  if (levelNumber < 100) {
    const nextLvl = levelNumber + 1;
    if (!progress.levels[nextLvl]) {
      progress.levels[nextLvl] = { unlocked: true, stars: 0, bestTime: 0 };
    }
  }
  
  // Unlock character every 10 levels starting from 10
  if (levelNumber >= 10 && levelNumber % 10 === 0) {
    const unlockIndex = Math.floor((levelNumber - 10) / 10);
    if (unlockIndex < UNLOCK_ORDER.length) {
      const charId = UNLOCK_ORDER[unlockIndex];
      if (!progress.characters[charId] || !progress.characters[charId].unlocked) {
        unlockCharacter(charId);
      }
    }
  }
  
  saveProgress(progress);
};

export const addXP = (amount: number) => {
  const progress = loadProgress();
  progress.totalXP += amount;
  // Level up every 1000 XP
  const newLevel = Math.floor(progress.totalXP / 1000) + 1;
  if (newLevel > progress.playerLevel) {
    progress.playerLevel = newLevel;
    // Unlock rewards
  }
  saveProgress(progress);
};

export const addCoins = (amount: number) => {
  const progress = loadProgress();
  progress.totalCoins += amount;
  saveProgress(progress);
};

export const spendCoins = (amount: number): boolean => {
  const progress = loadProgress();
  if (progress.totalCoins < amount) return false;
  progress.totalCoins -= amount;
  saveProgress(progress);
  return true;
};

export const addCharacterXP = (characterId: string, amount: number) => {
  const progress = loadProgress();
  if (!progress.characters[characterId]) {
    progress.characters[characterId] = { unlocked: false, level: 1, xp: 0 };
  }
  progress.characters[characterId].xp += amount;
  const newLevel = Math.floor(progress.characters[characterId].xp / 500) + 1;
  progress.characters[characterId].level = Math.max(progress.characters[characterId].level, newLevel);
  saveProgress(progress);
};

export const unlockCharacter = (characterId: string) => {
  const progress = loadProgress();
  if (!progress.characters[characterId]) {
    progress.characters[characterId] = { unlocked: true, level: 1, xp: 0 };
  } else {
    progress.characters[characterId].unlocked = true;
  }
  saveProgress(progress);
};

export const addLootBox = (amount: number = 1) => {
  const progress = loadProgress();
  progress.lootBoxes += amount;
  saveProgress(progress);
};

const openLootBoxFromProgress = (progress: GameProgress): LootboxReward => {
  if (progress.lootBoxes <= 0) return { type: 'none' };
  progress.lootBoxes--;

  const lockedCharacters = CHARACTERS.filter(
    (char) => !progress.characters[char.id]?.unlocked
  );

  const reward = rollLootboxReward(lockedCharacters);

  if (reward.type === 'coins') {
    progress.totalCoins += reward.coins;
  } else if (reward.type === 'character') {
    if (!progress.characters[reward.characterId]) {
      progress.characters[reward.characterId] = { unlocked: true, level: 1, xp: 0 };
    } else {
      progress.characters[reward.characterId].unlocked = true;
    }
  }

  return reward;
};

export const openLootBox = (): LootboxReward => {
  const progress = loadProgress();
  const reward = openLootBoxFromProgress(progress);
  saveProgress(progress);
  return reward;
};

export const purchaseAndOpenLootBox = (cost: number): LootboxReward | null => {
  const progress = loadProgress();
  if (progress.totalCoins < cost) return null;
  progress.totalCoins -= cost;
  progress.lootBoxes += 1;
  const reward = openLootBoxFromProgress(progress);
  saveProgress(progress);
  return reward;
};

export const recordLogin = () => {
  const progress = loadProgress();
  const today = getLocalDateKey();
  progress.lastLoginDate = today;
  saveProgress(progress);
};

export const getDailyRewardStatus = (): DailyRewardStatus => {
  const progress = loadProgress();
  const today = getLocalDateKey();
  const nextStreak = computeNextStreak(progress.dailyStreak, progress.lastClaimDate, today);
  const reward = getRewardForStreak(nextStreak);
  return {
    canClaim: progress.lastClaimDate !== today,
    currentStreak: progress.dailyStreak,
    nextStreak,
    reward,
  };
};

export const claimDailyReward = (): { reward: DailyReward; streak: number } | null => {
  const progress = loadProgress();
  const today = getLocalDateKey();
  if (progress.lastClaimDate === today) return null;
  const nextStreak = computeNextStreak(progress.dailyStreak, progress.lastClaimDate, today);
  const reward = getRewardForStreak(nextStreak);

  progress.dailyStreak = nextStreak;
  progress.lastClaimDate = today;

  if (reward.type === 'coins') {
    progress.totalCoins += reward.amount;
  } else if (reward.type === 'lootbox') {
    progress.lootBoxes += reward.amount;
  }

  saveProgress(progress);
  return { reward, streak: nextStreak };
};

export const unlockSkin = (skinId: string): boolean => {
  const progress = loadProgress();
  if (progress.unlockedSkins.includes(skinId)) return false;
  
  // Find the skin cost
  let cost = 0;
  for (const char of CHARACTERS) {
    const skin = char.skins.find(s => `${char.id}-${s.id}` === skinId);
    if (skin) {
      cost = skin.cost;
      break;
    }
  }
  
  if (progress.totalCoins >= cost) {
    progress.totalCoins -= cost;
    progress.unlockedSkins.push(skinId);
    saveProgress(progress);
    return true;
  }
  return false;
};

export const unlockEmote = (emoteId: string): boolean => {
  const progress = loadProgress();
  if (progress.unlockedEmotes.includes(emoteId)) return false;
  
  const emote = EMOTES.find(e => e.id === emoteId);
  if (!emote) return false;
  
  if (progress.totalCoins >= emote.cost) {
    progress.totalCoins -= emote.cost;
    progress.unlockedEmotes.push(emoteId);
    saveProgress(progress);
    return true;
  }
  return false;
};

export const isSkinUnlocked = (skinId: string): boolean => {
  const progress = loadProgress();
  return progress.unlockedSkins.includes(skinId);
};

export const isEmoteUnlocked = (emoteId: string): boolean => {
  const progress = loadProgress();
  return progress.unlockedEmotes.includes(emoteId);
};
