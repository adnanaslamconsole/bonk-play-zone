import { CharacterDef } from './characters';

export type LootboxReward =
  | { type: 'coins'; coins: number }
  | { type: 'character'; characterId: string; characterName: string }
  | { type: 'none' };

export const rollLootboxReward = (lockedCharacters: CharacterDef[]): LootboxReward => {
  const hasLocked = lockedCharacters.length > 0;
  const grantCharacter = hasLocked && Math.random() < 0.6;

  if (grantCharacter) {
    const picked = lockedCharacters[Math.floor(Math.random() * lockedCharacters.length)];
    return { type: 'character', characterId: picked.id, characterName: picked.name };
  }

  const coins = Math.floor(Math.random() * 200) + 50; // 50-250 coins
  return { type: 'coins', coins };
};
