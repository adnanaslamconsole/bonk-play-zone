import { useState } from 'react';
import { CHARACTERS, CharacterDef } from './characters';
import { loadProgress, unlockSkin, isSkinUnlocked } from './progressStore';
import { motion } from 'framer-motion';
import { SelectedCharacter } from './types';
import { playSound } from './soundManager';

interface Props {
  onSelect: (char: SelectedCharacter) => void;
  onSelectMultiplayer: (char: SelectedCharacter) => void;
  defaultToParty?: boolean;
}

const CharacterSelect = ({ onSelect, onSelectMultiplayer, defaultToParty = false }: Props) => {
  const [selected, setSelected] = useState<string>('bonky');
  const [selectedSkin, setSelectedSkin] = useState<string>('default');
  const progress = loadProgress();

  const handleClick = (char: CharacterDef) => {
    if (progress.characters[char.id]?.unlocked) {
      playSound('character_select');
      setSelected(char.id);
      setSelectedSkin('default'); // Reset to default skin when changing character
    }
  };

  const handleSkinSelect = (skinId: string) => {
    const skinKey = `${selected}-${skinId}`;
    if (isSkinUnlocked(skinKey) || skinId === 'default') {
      playSound('character_select');
      setSelectedSkin(skinId);
    } else {
      // Try to unlock/purchase the skin
      if (unlockSkin(skinKey)) {
        playSound('character_select');
        setSelectedSkin(skinId);
      }
    }
  };

  const selectedChar = CHARACTERS.find(c => c.id === selected && progress.characters[c.id]?.unlocked) || CHARACTERS.find(c => progress.characters[c.id]?.unlocked) || CHARACTERS[0];
  const currentSkin = selectedChar.skins.find(s => s.id === selectedSkin) || selectedChar.defaultSkin;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
      <h1
        className="text-4xl md:text-5xl font-bold text-primary mb-2"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        CHOOSE YOUR BONKER
      </h1>
      <p className="text-muted-foreground mb-8" style={{ fontFamily: 'var(--font-body)' }}>
        Pick a fighter and enter the arena!
      </p>

      <div className="grid grid-cols-4 md:grid-cols-6 gap-3 max-w-3xl mb-8">
        {CHARACTERS.map((char, i) => {
          const isUnlocked = progress.characters[char.id]?.unlocked;
          const buttonClass = !isUnlocked 
            ? 'border-gray-600 bg-gray-800/50 cursor-not-allowed' 
            : selected === char.id
            ? 'border-primary shadow-gold scale-105 bg-card'
            : 'border-border hover:border-muted-foreground bg-card/50';
          return <button
              key={char.id}
              onClick={() => handleClick(char)}
              className={"relative flex flex-col items-center p-3 rounded-2xl border-2 transition-all cursor-pointer " + buttonClass}
            >
            {/* Character blob */}
            <div
              className={`w-12 h-12 md:w-14 md:h-14 rounded-full mb-2 relative ${!isUnlocked ? 'grayscale' : ''}`}
              style={{ backgroundColor: char.defaultSkin.color }}
            >
              {/* Eyes */}
              <div className="absolute top-3 left-2 w-2.5 h-3 bg-white rounded-full" />
              <div className="absolute top-3 right-2 w-2.5 h-3 bg-white rounded-full" />
              <div
                className="absolute top-4 left-2.5 w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: char.defaultSkin.eyeColor }}
              />
              <div
                className="absolute top-4 right-2.5 w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: char.defaultSkin.eyeColor }}
              />
              {/* Mouth */}
              <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 w-4 h-2 border-b-2 rounded-b-full"
                style={{ borderColor: char.defaultSkin.eyeColor }}
              />
              {!isUnlocked && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                  <span className="text-white text-lg">🔒</span>
                </div>
              )}
            </div>
            <span className="text-[10px] md:text-xs font-bold text-foreground w-full text-center leading-tight break-words" style={{ fontFamily: 'var(--font-display)' }}>
              {char.name}
            </span>
            {selected === char.id ? (
              <div
                className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-xs font-bold"
              >
                ✓
              </div>
            ) : null}
            </button>
        } )}
      </div>

      {/* Selected character detail */}
      <div
        key={selected}
        className="bg-card border border-border rounded-2xl p-6 max-w-sm w-full text-center mb-6"
      >
        <div
          className={`w-20 h-20 rounded-full mx-auto mb-3 shadow-gold ${currentSkin.cssColor}`}
          style={{ backgroundColor: currentSkin.color }}
        />
        <h2 className="text-2xl font-bold text-foreground" style={{ fontFamily: 'var(--font-display)' }}>
          {selectedChar.name}
        </h2>
        <p className="text-accent text-sm font-semibold mt-1">⚡ {selectedChar.ability}</p>
        <p className="text-muted-foreground text-sm mt-1">{selectedChar.personality}</p>
        
        {/* Skin Selection */}
        <div className="mt-4">
          <h3 className="text-sm font-semibold text-foreground mb-2">SKINS</h3>
          <div className="flex flex-wrap gap-2 justify-center">
            {selectedChar.skins.map((skin) => {
              const skinKey = `${selectedChar.id}-${skin.id}`;
              const isUnlocked = skin.cost === 0 || isSkinUnlocked(skinKey);
              const isSelected = selectedSkin === skin.id;
              
              return (
                <button
                  key={skin.id}
                  onClick={() => handleSkinSelect(skin.id)}
                  className={`relative px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                    isSelected 
                      ? 'bg-primary text-primary-foreground' 
                      : isUnlocked
                        ? 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                        : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                  }`}
                  disabled={!isUnlocked}
                >
                  {skin.name}
                  {!isUnlocked && (
                    <span className="ml-1 text-yellow-400">💰{skin.cost}</span>
                  )}
                  {isSelected && <span className="ml-1">✓</span>}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4 mt-6 w-[280px]">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            playSound('click');
            onSelect({ character: selectedChar, skinId: selectedSkin });
          }}
          className="w-full px-10 py-4 bg-primary text-primary-foreground font-bold text-xl rounded-2xl shadow-gold hover:brightness-110 transition-all"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          🎮 PLAY SOLO
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            playSound('click');
            onSelectMultiplayer({ character: selectedChar, skinId: selectedSkin });
          }}
          className={`w-full px-10 py-4 bg-secondary text-secondary-foreground font-bold text-lg border-2 rounded-2xl shadow-neon hover:brightness-110 transition-all font-display text-nowrap ${
            defaultToParty ? 'border-primary ring-2 ring-primary animate-pulse' : 'border-border'
          }`}
        >
          👫 PLAY WITH FRIENDS
        </motion.button>
      </div>

      <a
        href="/"
        onClick={() => playSound('click')}
        className="mt-6 text-muted-foreground hover:text-foreground text-sm font-semibold transition-colors"
      >
        ← Back to Home
      </a>
    </div>
  );
};

export default CharacterSelect;
