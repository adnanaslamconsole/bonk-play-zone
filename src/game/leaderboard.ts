// Leaderboard with localStorage persistence

export interface LeaderboardEntry {
  name: string;
  score: number;
  round: number;
  date: string;
}

const STORAGE_KEY = 'bonk-royale-leaderboard';
const MAX_ENTRIES = 10;

export function getLeaderboard(): LeaderboardEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as LeaderboardEntry[];
  } catch {
    return [];
  }
}

export function addScore(name: string, score: number, round: number): LeaderboardEntry[] {
  const entries = getLeaderboard();
  entries.push({ name, score, round, date: new Date().toLocaleDateString() });
  entries.sort((a, b) => b.score - a.score);
  const trimmed = entries.slice(0, MAX_ENTRIES);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  return trimmed;
}

export function isHighScore(score: number): boolean {
  const entries = getLeaderboard();
  if (entries.length < MAX_ENTRIES) return score > 0;
  return score > entries[entries.length - 1].score;
}
