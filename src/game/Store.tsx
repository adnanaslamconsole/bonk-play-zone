import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { playSound } from './soundManager';

interface CoinPack {
  id: string;
  amount: number;
  label: string;
  tag: string;
  mode: 'ad' | 'coming';
}

interface StoreProps {
  open: boolean;
  coins: number;
  lootBoxes: number;
  lootboxCost: number;
  onClose: () => void;
  onBuyCoins: (amount: number) => void;
  onBuyLootbox: () => void;
  onOpenLootbox?: () => void;
}

export default function Store({
  open,
  coins,
  lootBoxes,
  lootboxCost,
  onClose,
  onBuyCoins,
  onBuyLootbox,
  onOpenLootbox,
}: StoreProps) {
  const [selectedPack, setSelectedPack] = useState<CoinPack | null>(null);
  const prevOpenRef = useRef(open);

  const closeStore = () => {
    playSound('modal_close');
    onClose();
  };

  const closePackModal = () => {
    playSound('modal_close');
    setSelectedPack(null);
  };

  useEffect(() => {
    if (!open) setSelectedPack(null);
  }, [open]);

  useEffect(() => {
    if (open && !prevOpenRef.current) {
      playSound('store_open');
      playSound('modal_open');
    }
    prevOpenRef.current = open;
  }, [open]);

  const coinPacks = useMemo<CoinPack[]>(
    () => [
      { id: 'starter', amount: 100, label: 'Starter Pack', tag: 'Watch Ad', mode: 'ad' },
      { id: 'booster', amount: 500, label: 'Booster Pack', tag: 'Coming Soon', mode: 'coming' },
      { id: 'mega', amount: 1000, label: 'Mega Pack', tag: 'Coming Soon', mode: 'coming' },
      { id: 'blitz', amount: 250, label: 'Ad Blitz', tag: 'Watch Ad', mode: 'ad' },
    ],
    []
  );

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-xl"
            onClick={closeStore}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 20 }}
            transition={{ type: 'spring', damping: 18 }}
            className="relative z-10 w-full max-w-2xl bg-gradient-to-br from-[#121218] via-[#1a1c24] to-[#14121a] border border-white/10 rounded-[2.5rem] p-6 sm:p-8 shadow-[0_40px_120px_rgba(0,0,0,0.7)]"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-white/50 text-xs uppercase tracking-[0.4em] font-bold">In-Game Store</p>
                <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tighter">BONK MART</h2>
              </div>
              <button
                onClick={closeStore}
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-all"
                aria-label="Close store"
              >
                ✕
              </button>
            </div>

            <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-2xl px-4 py-3 mb-6">
              <div className="text-white/70 text-sm font-bold uppercase tracking-widest">Wallet</div>
              <div className="text-yellow-300 text-xl font-black">{coins} 🪙</div>
            </div>

            <div className="mb-8">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-white font-black uppercase tracking-widest text-xs">Buy Coins</h3>
                <span className="text-white/40 text-[10px] uppercase tracking-[0.3em]">No real payments</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {coinPacks.map((pack) => (
                  <button
                    key={pack.id}
                    onClick={() => {
                      playSound('click');
                      playSound('modal_open');
                      setSelectedPack(pack);
                    }}
                    className="group bg-white/5 hover:bg-white/10 border border-white/10 hover:border-yellow-400/40 rounded-2xl p-4 text-left transition-all"
                  >
                    <div className="text-2xl">🪙</div>
                    <div className="text-white font-bold text-sm mt-2">{pack.amount} Coins</div>
                    <div className="text-white/40 text-[10px] uppercase tracking-widest mt-1">{pack.label}</div>
                    <div className="mt-3 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-yellow-400/20 text-yellow-200">
                      {pack.tag}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-400/30 rounded-2xl p-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-white font-black text-lg">Lootbox</h3>
                  <p className="text-white/60 text-xs uppercase tracking-widest">Random character or coins</p>
                </div>
                <div className="text-yellow-200 font-black text-lg">{lootboxCost} 🪙</div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 mt-4">
                <button
                  onClick={() => {
                    playSound('click');
                    if (coins < lootboxCost) {
                      playSound('error');
                      return;
                    }
                    playSound('purchase_success');
                    onBuyLootbox();
                  }}
                  className={`flex-1 h-12 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-black uppercase tracking-widest text-sm shadow-lg active:scale-95 transition-all ${
                    coins < lootboxCost ? 'opacity-40 cursor-not-allowed' : ''
                  }`}
                >
                  Buy & Open
                </button>
                {onOpenLootbox && (
                  <button
                    onClick={() => {
                      playSound('click');
                      if (lootBoxes <= 0) {
                        playSound('error');
                        return;
                      }
                      onOpenLootbox();
                    }}
                    className={`flex-1 h-12 rounded-2xl bg-white/5 border border-white/10 text-white/70 font-black uppercase tracking-widest text-sm hover:bg-white/10 active:scale-95 transition-all ${
                      lootBoxes <= 0 ? 'opacity-40 cursor-not-allowed' : ''
                    }`}
                  >
                    Open Owned ({lootBoxes})
                  </button>
                )}
              </div>
            </div>
          </motion.div>

          {selectedPack && (
            <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-black/80" onClick={closePackModal} />
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="relative z-10 w-full max-w-sm bg-[#16161e] border border-white/10 rounded-[2rem] p-6 text-center"
              >
                <div className="text-4xl mb-4">🪙</div>
                <h4 className="text-white font-black text-2xl mb-2">{selectedPack.amount} Coins</h4>
                {selectedPack.mode === 'coming' ? (
                  <p className="text-white/60 text-sm mb-6">Coming soon. Real payments are disabled for this build.</p>
                ) : (
                  <p className="text-white/60 text-sm mb-6">Watch a quick ad to claim this pack instantly.</p>
                )}

                {selectedPack.mode === 'ad' ? (
                  <button
                    onClick={() => {
                      playSound('click');
                      playSound('purchase_success');
                      playSound('coin_gain');
                      onBuyCoins(selectedPack.amount);
                      closePackModal();
                    }}
                    className="w-full h-12 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl text-black font-black uppercase tracking-widest text-sm"
                  >
                    Watch Ad (Instant)
                  </button>
                ) : (
                  <button
                    onClick={closePackModal}
                    className="w-full h-12 bg-white/10 rounded-2xl text-white/80 font-black uppercase tracking-widest text-sm"
                  >
                    Close
                  </button>
                )}
              </motion.div>
            </div>
          )}
        </div>
      )}
    </AnimatePresence>
  );
}
