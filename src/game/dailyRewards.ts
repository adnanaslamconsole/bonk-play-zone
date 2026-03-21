export type DailyRewardType = 'coins' | 'lootbox';

export interface DailyReward {
  type: DailyRewardType;
  amount: number;
  label: string;
}

export const DAILY_REWARDS: DailyReward[] = [
  { type: 'coins', amount: 50, label: '50 Coins' },
  { type: 'coins', amount: 75, label: '75 Coins' },
  { type: 'coins', amount: 100, label: '100 Coins' },
  { type: 'lootbox', amount: 1, label: '1 Lootbox' },
  { type: 'coins', amount: 150, label: '150 Coins' },
  { type: 'coins', amount: 200, label: '200 Coins' },
  { type: 'lootbox', amount: 1, label: 'Mega Lootbox' },
];

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export const getLocalDateKey = (date: Date = new Date()) => {
  return date.toLocaleDateString('en-CA');
};

const toLocalMidnight = (dateKey: string) => {
  return new Date(`${dateKey}T00:00:00`);
};

export const daysBetween = (fromKey: string, toKey: string) => {
  const from = toLocalMidnight(fromKey).getTime();
  const to = toLocalMidnight(toKey).getTime();
  return Math.floor((to - from) / MS_PER_DAY);
};

export const computeNextStreak = (
  currentStreak: number,
  lastClaimDate: string | null,
  todayKey: string
) => {
  if (!lastClaimDate) return 1;
  const diff = daysBetween(lastClaimDate, todayKey);
  if (diff === 0) return currentStreak;
  if (diff === 1) return Math.min(currentStreak + 1, DAILY_REWARDS.length);
  return 1;
};

export const getRewardForStreak = (streak: number): DailyReward => {
  const index = Math.max(1, Math.min(streak, DAILY_REWARDS.length)) - 1;
  return DAILY_REWARDS[index];
};
