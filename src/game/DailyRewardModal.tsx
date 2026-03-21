import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { DailyReward, DAILY_REWARDS } from './dailyRewards';
import { playSound } from './soundManager';

interface DailyRewardModalProps {
  open: boolean;
  reward: DailyReward | null;
  currentStreak: number;
  nextStreak: number;
  onClose: () => void;
  onClaim: () => void;
}

export default function DailyRewardModal({
  open,
  reward,
  currentStreak,
  nextStreak,
  onClose,
  onClaim,
}: DailyRewardModalProps) {
  if (!reward) return null;

  useEffect(() => {
    if (open) {
      playSound('modal_open');
    }
  }, [open]);

  const handleClose = () => {
    playSound('modal_close');
    onClose();
  };

  const handleClaim = () => {
    playSound('click');
    playSound('reward_claim');
    if (reward.type === 'coins') {
      playSound('coin_gain');
    }
    onClaim();
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[85] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-xl"
            onClick={handleClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 20 }}
            transition={{ type: 'spring', damping: 16 }}
            className="relative z-10 w-full max-w-lg bg-gradient-to-br from-[#14131b] via-[#1a1f2a] to-[#111017] border border-white/10 rounded-[2.5rem] p-6 sm:p-8 text-center shadow-[0_40px_120px_rgba(0,0,0,0.7)]"
          >
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-6 py-2 rounded-2xl bg-gradient-to-r from-emerald-400 to-cyan-400 text-black text-[10px] font-black uppercase tracking-[0.4em]">
              Daily Reward
            </div>

            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tighter mb-2">Day {nextStreak} Bonus</h2>
            <p className="text-white/60 text-sm uppercase tracking-widest mb-6">Current streak: {currentStreak} days</p>

            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="text-4xl">{reward.type === 'coins' ? '💰' : '🎁'}</div>
              <div className="text-white text-2xl font-black">{reward.label}</div>
            </div>

            <div className="grid grid-cols-7 gap-2 mb-6">
              {DAILY_REWARDS.map((entry, idx) => {
                const day = idx + 1;
                const isNext = day === nextStreak;
                const isClaimed = day <= currentStreak;
                return (
                  <div
                    key={entry.label}
                    className={`rounded-xl p-2 text-[10px] font-black uppercase tracking-wider border ${
                      isNext
                        ? 'bg-emerald-400/20 border-emerald-300/60 text-emerald-200'
                        : isClaimed
                          ? 'bg-white/10 border-white/20 text-white/60'
                          : 'bg-white/5 border-white/10 text-white/30'
                    }`}
                  >
                    Day {day}
                  </div>
                );
              })}
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={handleClaim}
                className="w-full h-14 bg-gradient-to-r from-emerald-400 to-cyan-400 text-black font-black text-lg rounded-[2rem] uppercase tracking-widest shadow-[0_20px_40px_rgba(16,185,129,0.3)] active:scale-95 transition-all"
              >
                Claim Reward
              </button>
              <button
                onClick={handleClose}
                className="w-full h-11 bg-white/5 border border-white/10 rounded-[2rem] text-white/60 font-black text-xs uppercase tracking-[0.4em] hover:bg-white/10 active:scale-95 transition-all"
              >
                Later
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
