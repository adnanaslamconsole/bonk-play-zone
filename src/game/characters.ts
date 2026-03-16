export interface CharacterDef {
  id: string;
  name: string;
  ability: string;
  personality: string;
  color: string;
  eyeColor: string;
  cssColor: string; // tailwind-friendly class
}

export const CHARACTERS: CharacterDef[] = [
  { id: 'bonky', name: 'Bonky', ability: 'Ground Pound', personality: 'Goofy class clown', color: '#FFD700', eyeColor: '#3d1a00', cssColor: 'bg-game-yellow' },
  { id: 'blobette', name: 'Blobette', ability: 'Bubble Shield', personality: 'Sassy and sweet', color: '#ff6b9d', eyeColor: '#4a0020', cssColor: 'bg-game-pink' },
  { id: 'zappy', name: 'Zappy', ability: 'Lightning Dash', personality: 'Hyperactive gremlin', color: '#00e5ff', eyeColor: '#003040', cssColor: 'bg-game-cyan' },
  { id: 'chunko', name: 'Chunko', ability: 'Belly Slam', personality: 'Sleepy heavyweight', color: '#76ff03', eyeColor: '#1a3300', cssColor: 'bg-game-green' },
  { id: 'sirbonks', name: 'Sir Bonks-a-Lot', ability: 'Hammer Spin', personality: 'Pompous knight', color: '#b388ff', eyeColor: '#1a0040', cssColor: 'bg-game-purple' },
  { id: 'wobbly', name: 'Wobbly', ability: 'Jelly Bounce', personality: 'Perpetually dizzy', color: '#448aff', eyeColor: '#001a40', cssColor: 'bg-game-blue' },
  { id: 'fluffernaut', name: 'Fluffernaut', ability: 'Cloud Jump', personality: 'Spacey dreamer', color: '#ffea00', eyeColor: '#3d3500', cssColor: 'bg-game-yellow' },
  { id: 'cactuscarl', name: 'Cactus Carl', ability: 'Spike Roll', personality: 'Prickly prankster', color: '#66bb6a', eyeColor: '#1a3300', cssColor: 'bg-game-green' },
  { id: 'toast', name: 'Toast', ability: 'Butter Slide', personality: 'Always popping up', color: '#ff9100', eyeColor: '#3d2200', cssColor: 'bg-game-orange' },
  { id: 'frosty', name: 'Frosty', ability: 'Ice Slide', personality: 'Cool and collected', color: '#80deea', eyeColor: '#006064', cssColor: 'bg-game-cyan' },
  { id: 'magma', name: 'Magma', ability: 'Lava Burst', personality: 'Short-fused hothead', color: '#ff7043', eyeColor: '#3e2723', cssColor: 'bg-game-orange' },
  { id: 'shadow', name: 'Shadow', ability: 'Stealth Dash', personality: 'Mysterious and silent', color: '#6200ea', eyeColor: '#ff00ff', cssColor: 'bg-game-purple' },
];
