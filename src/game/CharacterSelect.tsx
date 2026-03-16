import { useState } from 'react';
import { motion } from 'framer-motion';
import { CHARACTERS, CharacterDef } from './characters';
import { playSelectSound } from './audio';

interface Props {
  onSelect: (char: CharacterDef) => void;
  onSelectMultiplayer: (char: CharacterDef) => void;
  defaultToParty?: boolean;
}

const CharacterSelect = ({ onSelect, onSelectMultiplayer, defaultToParty = false }: Props) => {
  const [selected, setSelected] = useState<string>('bonky');

  const handleClick = (char: CharacterDef) => {
    playSelectSound();
    setSelected(char.id);
  };

  const selectedChar = CHARACTERS.find(c => c.id === selected)!;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
      <motion.h1
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="text-4xl md:text-5xl font-bold text-primary mb-2"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        CHOOSE YOUR BONKER
      </motion.h1>
      <p className="text-muted-foreground mb-8" style={{ fontFamily: 'var(--font-body)' }}>
        Pick a fighter and enter the arena!
      </p>

      <div className="grid grid-cols-4 md:grid-cols-6 gap-3 max-w-3xl mb-8">
        {CHARACTERS.map((char, i) => (
          <motion.button
            key={char.id}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: i * 0.04 }}
            onClick={() => handleClick(char)}
            className={`relative flex flex-col items-center p-3 rounded-2xl border-2 transition-all cursor-pointer
              ${selected === char.id
                ? 'border-primary shadow-gold scale-105 bg-card'
                : 'border-border hover:border-muted-foreground bg-card/50'
              }`}
          >
            {/* Character blob */}
            <div
              className="w-12 h-12 md:w-14 md:h-14 rounded-full mb-2 relative"
              style={{ backgroundColor: char.color }}
            >
              {/* Eyes */}
              <div className="absolute top-3 left-2 w-2.5 h-3 bg-white rounded-full" />
              <div className="absolute top-3 right-2 w-2.5 h-3 bg-white rounded-full" />
              <div
                className="absolute top-4 left-2.5 w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: char.eyeColor }}
              />
              <div
                className="absolute top-4 right-2.5 w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: char.eyeColor }}
              />
              {/* Mouth */}
              <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 w-4 h-2 border-b-2 rounded-b-full"
                style={{ borderColor: char.eyeColor }}
              />
            </div>
            <span className="text-[10px] md:text-xs font-bold text-foreground w-full text-center leading-tight break-words" style={{ fontFamily: 'var(--font-display)' }}>
              {char.name}
            </span>
            {selected === char.id && (
              <motion.div
                layoutId="selector"
                className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-xs font-bold"
              >
                ✓
              </motion.div>
            )}
          </motion.button>
        ))}
      </div>

      {/* Selected character detail */}
      <motion.div
        key={selected}
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-card border border-border rounded-2xl p-6 max-w-sm w-full text-center mb-6"
      >
        <div
          className="w-20 h-20 rounded-full mx-auto mb-3 shadow-gold"
          style={{ backgroundColor: selectedChar.color }}
        />
        <h2 className="text-2xl font-bold text-foreground" style={{ fontFamily: 'var(--font-display)' }}>
          {selectedChar.name}
        </h2>
        <p className="text-accent text-sm font-semibold mt-1">⚡ {selectedChar.ability}</p>
        <p className="text-muted-foreground text-sm mt-1">{selectedChar.personality}</p>
      </motion.div>

      <div className="flex flex-col gap-4 mt-6 w-[280px]">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onSelect(selectedChar)}
          className="w-full px-10 py-4 bg-primary text-primary-foreground font-bold text-xl rounded-2xl shadow-gold hover:brightness-110 transition-all"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          🎮 PLAY SOLO
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onSelectMultiplayer(selectedChar)}
          className={`w-full px-10 py-4 bg-secondary text-secondary-foreground font-bold text-lg border-2 rounded-2xl shadow-neon hover:brightness-110 transition-all font-display text-nowrap ${
            defaultToParty ? 'border-primary ring-2 ring-primary animate-pulse' : 'border-border'
          }`}
        >
          👫 PLAY WITH FRIENDS
        </motion.button>
      </div>

      <a
        href="/"
        className="mt-6 text-muted-foreground hover:text-foreground text-sm font-semibold transition-colors"
      >
        ← Back to Home
      </a>
    </div>
  );
};

export default CharacterSelect;
