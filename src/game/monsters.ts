export interface MonsterDef {
  id: string;
  name: string;
  description: string;
  color: string;
  eyeColor: string;
  size: number; // radius multiplier
  health: number;
  abilities: string[];
  weakness: string; // how to defeat
}

export const MONSTERS: MonsterDef[] = [
  {
    id: 'giant_slime',
    name: 'Giant Slime',
    description: 'A massive, bouncy blob that absorbs impacts.',
    color: '#76ff03',
    eyeColor: '#1a3300',
    size: 3,
    health: 100,
    abilities: ['Bounce Back', 'Split on Hit'],
    weakness: 'Lightning Dash to evaporate',
  },
  {
    id: 'fire_dragon',
    name: 'Fire Dragon',
    description: 'Breathes fire and flies around the arena.',
    color: '#ff7043',
    eyeColor: '#3e2723',
    size: 2.5,
    health: 120,
    abilities: ['Fire Breath', 'Fly'],
    weakness: 'Bubble Shield to extinguish',
  },
  {
    id: 'ice_golem',
    name: 'Ice Golem',
    description: 'Slow but powerful, freezes on contact.',
    color: '#80deea',
    eyeColor: '#006064',
    size: 3.5,
    health: 150,
    abilities: ['Freeze Touch', 'Ice Shards'],
    weakness: 'Ground Pound to shatter',
  },
  {
    id: 'shadow_beast',
    name: 'Shadow Beast',
    description: 'Invisible and sneaky, strikes from shadows.',
    color: '#6200ea',
    eyeColor: '#ff00ff',
    size: 2,
    health: 80,
    abilities: ['Invisibility', 'Shadow Strike'],
    weakness: 'Hammer Spin to reveal',
  },
  {
    id: 'toxic_blob',
    name: 'Toxic Blob',
    description: 'Spreads poison that slows players.',
    color: '#66bb6a',
    eyeColor: '#1a3300',
    size: 2.8,
    health: 110,
    abilities: ['Poison Spread', 'Regeneration'],
    weakness: 'Spike Roll to puncture',
  },
  // Add more as needed
];

export function getMonsterForLevel(level: number): MonsterDef | null {
  if (level % 3 !== 0) return null; // Boss every 3 levels
  const index = Math.floor((level - 1) / 3) % MONSTERS.length;
  return MONSTERS[index];
}