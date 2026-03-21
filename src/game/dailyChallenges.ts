export interface DailyChallenge {
  id: string;
  description: string;
  reward: number; // coins
  progress: number;
  target: number;
  completed: boolean;
}

export const getDailyChallenges = (): DailyChallenge[] => {
  const today = new Date().toDateString();
  const stored = localStorage.getItem('bonk_daily_challenges');
  if (stored) {
    const parsed = JSON.parse(stored);
    if (parsed.date === today) {
      return parsed.challenges;
    }
  }
  
  // Generate new challenges
  const challenges: DailyChallenge[] = [
    { id: 'bonks', description: 'Perform 50 bonks', reward: 100, progress: 0, target: 50, completed: false },
    { id: 'wins', description: 'Win 3 matches', reward: 150, progress: 0, target: 3, completed: false },
    { id: 'survive', description: 'Survive for 2 minutes', reward: 200, progress: 0, target: 120, completed: false },
  ];
  
  localStorage.setItem('bonk_daily_challenges', JSON.stringify({ date: today, challenges }));
  return challenges;
};

export const updateDailyChallenge = (id: string, increment: number = 1) => {
  const challenges = getDailyChallenges();
  const challenge = challenges.find(c => c.id === id);
  if (challenge && !challenge.completed) {
    if (id === 'survive') {
      challenge.progress = Math.max(challenge.progress, increment); // Set to max survived time
    } else {
      challenge.progress += increment;
    }
    if (challenge.progress >= challenge.target) {
      challenge.completed = true;
      // Add reward
      import('./progressStore').then(({ addCoins }) => addCoins(challenge.reward));
    }
    const today = new Date().toDateString();
    localStorage.setItem('bonk_daily_challenges', JSON.stringify({ date: today, challenges }));
  }
};