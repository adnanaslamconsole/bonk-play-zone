import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { LootboxReward } from './lootbox';
import { playSound } from './soundManager';

interface LootboxRewardModalProps {
  open: boolean;
  reward: LootboxReward | null;
  onClose: () => void;
}

export default function LootboxRewardModal({ open, reward, onClose }: LootboxRewardModalProps) {
  if (!reward || reward.type === 'none') return null;

  useEffect(() => {
    if (open) {
      playSound('lootbox_open');
      playSound('modal_open');
    }
  }, [open]);

  const handleClose = () => {
    playSound('click');
    playSound('modal_close');
    onClose();
  };

  const icon = reward.type === 'coins' ? '💰' : '🧬';
  const title = reward.type === 'coins' ? 'Coins!' : 'New Character!';
  const description =
    reward.type === 'coins'
      ? `You received ${reward.coins} coins!`
      : `Unlocked ${reward.characterName}!`;

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-2xl z-[90] flex flex-col items-center justify-center p-6 text-center select-none overflow-hidden">
          <motion.div
            initial={{ opacity: 0, scale: 0.7, y: 100 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 40 }}
            transition={{ type: 'spring', damping: 12 }}
            className="relative z-10 max-w-md w-full bg-gradient-to-br from-purple-600/20 to-pink-600/20 border border-purple-400/40 backdrop-blur-3xl rounded-[4rem] p-8 sm:p-12 shadow-[0_0_150px_rgba(168,85,247,0.15)] ring-1 ring-white/10"
          >
            <motion.div
              initial={{ rotate: -10, scale: 0 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ delay: 0.3, type: 'spring' }}
              className="absolute -top-6 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-400 to-pink-600 px-6 py-2 rounded-2xl shadow-xl border border-white/20"
            >
              <span className="text-[10px] font-black text-white uppercase tracking-[0.4em]">Loot Box Opened</span>
            </motion.div>

            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5, type: 'spring', stiffness: 200 }}
              className="text-8xl mb-6"
            >
              {icon}
            </motion.div>

            <motion.h1
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-purple-200 to-pink-400 mb-4 font-display uppercase tracking-tighter"
            >
              {title}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
              className="text-white/80 text-lg mb-8"
            >
              {description}
            </motion.p>

            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.1 }}
              onClick={handleClose}
              className="w-full h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-[2.5rem] text-white font-black text-xl shadow-[0_20px_50px_rgba(168,85,247,0.4)] hover:shadow-[0_25px_60px_rgba(168,85,247,0.5)] active:scale-95 transition-all outline-none border-4 border-white/20"
            >
              AWESOME!
            </motion.button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
