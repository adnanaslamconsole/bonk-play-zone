export interface SkinDef {
  id: string;
  name: string;
  color: string;
  eyeColor: string;
  cssColor: string;
  cost: number; // coins to unlock
}

export interface CharacterDef {
  id: string;
  name: string;
  ability: string;
  personality: string;
  defaultSkin: SkinDef;
  skins: SkinDef[];
}

export const CHARACTERS: CharacterDef[] = [
  { 
    id: 'bonky', 
    name: 'Bonky', 
    ability: 'Ground Pound', 
    personality: 'Goofy class clown', 
    defaultSkin: { id: 'default', name: 'Classic', color: '#FFD700', eyeColor: '#3d1a00', cssColor: 'bg-game-yellow', cost: 0 },
    skins: [
      { id: 'default', name: 'Classic', color: '#FFD700', eyeColor: '#3d1a00', cssColor: 'bg-game-yellow', cost: 0 },
      { id: 'golden', name: 'Golden', color: '#FFD700', eyeColor: '#FFD700', cssColor: 'bg-yellow-400', cost: 500 },
      { id: 'rainbow', name: 'Rainbow', color: '#FF6B9D', eyeColor: '#00E5FF', cssColor: 'bg-gradient-to-r from-pink-400 to-cyan-400', cost: 1000 },
    ]
  },
  { 
    id: 'blobette', 
    name: 'Blobette', 
    ability: 'Bubble Shield', 
    personality: 'Sassy and sweet', 
    defaultSkin: { id: 'default', name: 'Classic', color: '#ff6b9d', eyeColor: '#4a0020', cssColor: 'bg-game-pink', cost: 0 },
    skins: [
      { id: 'default', name: 'Classic', color: '#ff6b9d', eyeColor: '#4a0020', cssColor: 'bg-game-pink', cost: 0 },
      { id: 'neon', name: 'Neon Pink', color: '#FF1493', eyeColor: '#FF69B4', cssColor: 'bg-pink-500', cost: 400 },
    ]
  },
  // Add more skins for other characters similarly
  { 
    id: 'zappy', 
    name: 'Zappy', 
    ability: 'Lightning Dash', 
    personality: 'Hyperactive gremlin', 
    defaultSkin: { id: 'default', name: 'Classic', color: '#00e5ff', eyeColor: '#003040', cssColor: 'bg-game-cyan', cost: 0 },
    skins: [
      { id: 'default', name: 'Classic', color: '#00e5ff', eyeColor: '#003040', cssColor: 'bg-game-cyan', cost: 0 },
      { id: 'electric', name: 'Electric Blue', color: '#1E90FF', eyeColor: '#00FFFF', cssColor: 'bg-blue-400', cost: 600 },
    ]
  },
  // For brevity, I'll keep default skins for others
  { 
    id: 'chunko', 
    name: 'Chunko', 
    ability: 'Belly Slam', 
    personality: 'Sleepy heavyweight', 
    defaultSkin: { id: 'default', name: 'Classic', color: '#76ff03', eyeColor: '#1a3300', cssColor: 'bg-game-green', cost: 0 },
    skins: [
      { id: 'default', name: 'Classic', color: '#76ff03', eyeColor: '#1a3300', cssColor: 'bg-game-green', cost: 0 },
    ]
  },
  { 
    id: 'sirbonks', 
    name: 'Sir Bonks-a-Lot', 
    ability: 'Hammer Spin', 
    personality: 'Pompous knight', 
    defaultSkin: { id: 'default', name: 'Classic', color: '#b388ff', eyeColor: '#1a0040', cssColor: 'bg-game-purple', cost: 0 },
    skins: [
      { id: 'default', name: 'Classic', color: '#b388ff', eyeColor: '#1a0040', cssColor: 'bg-game-purple', cost: 0 },
    ]
  },
  { 
    id: 'wobbly', 
    name: 'Wobbly', 
    ability: 'Jelly Bounce', 
    personality: 'Perpetually dizzy', 
    defaultSkin: { id: 'default', name: 'Classic', color: '#448aff', eyeColor: '#001a40', cssColor: 'bg-game-blue', cost: 0 },
    skins: [
      { id: 'default', name: 'Classic', color: '#448aff', eyeColor: '#001a40', cssColor: 'bg-game-blue', cost: 0 },
    ]
  },
  { 
    id: 'fluffernaut', 
    name: 'Fluffernaut', 
    ability: 'Cloud Jump', 
    personality: 'Spacey dreamer', 
    defaultSkin: { id: 'default', name: 'Classic', color: '#ffea00', eyeColor: '#3d3500', cssColor: 'bg-game-yellow', cost: 0 },
    skins: [
      { id: 'default', name: 'Classic', color: '#ffea00', eyeColor: '#3d3500', cssColor: 'bg-game-yellow', cost: 0 },
    ]
  },
  { 
    id: 'cactuscarl', 
    name: 'Cactus Carl', 
    ability: 'Spike Roll', 
    personality: 'Prickly prankster', 
    defaultSkin: { id: 'default', name: 'Classic', color: '#66bb6a', eyeColor: '#1a3300', cssColor: 'bg-game-green', cost: 0 },
    skins: [
      { id: 'default', name: 'Classic', color: '#66bb6a', eyeColor: '#1a3300', cssColor: 'bg-game-green', cost: 0 },
    ]
  },
  { 
    id: 'toast', 
    name: 'Toast', 
    ability: 'Butter Slide', 
    personality: 'Always popping up', 
    defaultSkin: { id: 'default', name: 'Classic', color: '#ff9100', eyeColor: '#3d2200', cssColor: 'bg-game-orange', cost: 0 },
    skins: [
      { id: 'default', name: 'Classic', color: '#ff9100', eyeColor: '#3d2200', cssColor: 'bg-game-orange', cost: 0 },
    ]
  },
  { 
    id: 'frosty', 
    name: 'Frosty', 
    ability: 'Ice Slide', 
    personality: 'Cool and collected', 
    defaultSkin: { id: 'default', name: 'Classic', color: '#80deea', eyeColor: '#006064', cssColor: 'bg-game-cyan', cost: 0 },
    skins: [
      { id: 'default', name: 'Classic', color: '#80deea', eyeColor: '#006064', cssColor: 'bg-game-cyan', cost: 0 },
    ]
  },
  { 
    id: 'magma', 
    name: 'Magma', 
    ability: 'Lava Burst', 
    personality: 'Short-fused hothead', 
    defaultSkin: { id: 'default', name: 'Classic', color: '#ff7043', eyeColor: '#3e2723', cssColor: 'bg-game-orange', cost: 0 },
    skins: [
      { id: 'default', name: 'Classic', color: '#ff7043', eyeColor: '#3e2723', cssColor: 'bg-game-orange', cost: 0 },
    ]
  },
  { 
    id: 'shadow', 
    name: 'Shadow', 
    ability: 'Stealth Dash', 
    personality: 'Mysterious and silent', 
    defaultSkin: { id: 'default', name: 'Classic', color: '#6200ea', eyeColor: '#ff00ff', cssColor: 'bg-game-purple', cost: 0 },
    skins: [
      { id: 'default', name: 'Classic', color: '#6200ea', eyeColor: '#ff00ff', cssColor: 'bg-game-purple', cost: 0 },
    ]
  },
];
