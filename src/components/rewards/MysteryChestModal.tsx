import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Lock, Gift, Star } from 'lucide-react';
import { cn } from '@/utils';
import { Button, ProgressBar } from '@/components/common';
import {
  useRewardStore,
  type MysteryChest,
  type ChestReward,
  chestConfig,
} from '@/stores/rewardStore';

interface MysteryChestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRewardClaimed?: (reward: ChestReward) => void;
}

export function MysteryChestModal({
  isOpen,
  onClose,
  onRewardClaimed,
}: MysteryChestModalProps) {
  const { availableChests, chestProgress, fetchAvailableChests, openMysteryChest, isLoading } =
    useRewardStore();
  const [selectedChest, setSelectedChest] = useState<MysteryChest | null>(null);
  const [isOpening, setIsOpening] = useState(false);
  const [reward, setReward] = useState<ChestReward | null>(null);
  const [showReward, setShowReward] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchAvailableChests();
      setSelectedChest(null);
      setReward(null);
      setShowReward(false);
    }
  }, [isOpen, fetchAvailableChests]);

  const handleOpenChest = async () => {
    if (!selectedChest || !selectedChest.available) return;

    setIsOpening(true);

    // Animate chest opening
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const result = await openMysteryChest(selectedChest.id);
    if (result) {
      setReward(result);
      setShowReward(true);
      onRewardClaimed?.(result);
    }

    setIsOpening(false);
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary':
        return 'text-amber-500';
      case 'epic':
        return 'text-purple-500';
      case 'rare':
        return 'text-blue-500';
      default:
        return 'text-neutral-500';
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-lg bg-white rounded-2xl overflow-hidden shadow-2xl"
        >
          {/* Header */}
          <div className="relative bg-gradient-to-r from-purple-600 to-pink-600 p-6 text-white">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1 rounded-full bg-white/20 hover:bg-white/30"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                <Gift className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Mystery Chests</h2>
                <p className="text-white/80 text-sm">Open chests to reveal amazing rewards!</p>
              </div>
            </div>

            {/* Chest Progress */}
            <div className="mt-4">
              <div className="flex items-center justify-between text-sm mb-1">
                <span>Next Chest Progress</span>
                <span>{Math.floor(chestProgress)}%</span>
              </div>
              <ProgressBar value={chestProgress} className="h-2" />
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <AnimatePresence mode="wait">
              {showReward && reward ? (
                // Reward Display
                <motion.div
                  key="reward"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  className="text-center py-8"
                >
                  <motion.div
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 0.5 }}
                    className="w-24 h-24 mx-auto rounded-full bg-gradient-to-r from-amber-400 to-orange-500 flex items-center justify-center mb-4"
                  >
                    <Sparkles className="w-12 h-12 text-white" />
                  </motion.div>

                  <h3 className={cn('text-2xl font-bold mb-2', getRarityColor(reward.rarity))}>
                    {reward.rarity.toUpperCase()} REWARD!
                  </h3>

                  <p className="text-lg text-neutral-700 mb-2">{reward.message}</p>

                  {reward.type === 'xp' && (
                    <div className="text-3xl font-bold text-emerald-500">+{reward.amount} XP</div>
                  )}
                  {reward.type === 'coins' && (
                    <div className="text-3xl font-bold text-amber-500">+{reward.amount} Coins</div>
                  )}
                  {reward.type === 'streak_protection' && (
                    <div className="flex items-center justify-center gap-2 text-xl font-bold text-pink-500">
                      <Star className="w-6 h-6" />
                      Streak Shield
                    </div>
                  )}
                  {reward.type === 'cosmetic' && (
                    <div className="text-xl font-bold text-purple-500">{reward.cosmeticName}</div>
                  )}

                  <Button onClick={() => setShowReward(false)} className="mt-6">
                    Open Another
                  </Button>
                </motion.div>
              ) : isOpening ? (
                // Opening Animation
                <motion.div
                  key="opening"
                  className="text-center py-8"
                >
                  <motion.div
                    animate={{
                      scale: [1, 1.2, 1],
                      rotate: [0, -10, 10, -10, 0],
                    }}
                    transition={{ duration: 0.5, repeat: Infinity }}
                    className={cn(
                      'w-32 h-32 mx-auto rounded-2xl bg-gradient-to-br flex items-center justify-center text-6xl shadow-xl',
                      selectedChest && chestConfig[selectedChest.type].color,
                      selectedChest && chestConfig[selectedChest.type].glow
                    )}
                  >
                    {selectedChest && chestConfig[selectedChest.type].icon}
                  </motion.div>

                  <motion.p
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1, repeat: Infinity }}
                    className="text-lg font-medium text-neutral-600 mt-4"
                  >
                    Opening chest...
                  </motion.p>
                </motion.div>
              ) : (
                // Chest Selection
                <motion.div key="selection">
                  <p className="text-neutral-500 text-sm mb-4">Select a chest to open:</p>

                  <div className="grid grid-cols-2 gap-4">
                    {availableChests.map((chest) => (
                      <ChestCard
                        key={chest.id}
                        chest={chest}
                        isSelected={selectedChest?.id === chest.id}
                        onSelect={() => chest.available && setSelectedChest(chest)}
                      />
                    ))}
                  </div>

                  {selectedChest && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-6"
                    >
                      <Button
                        fullWidth
                        onClick={handleOpenChest}
                        disabled={!selectedChest.available || isLoading}
                        className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                      >
                        <Gift className="w-5 h-5 mr-2" />
                        Open {selectedChest.type.charAt(0).toUpperCase() + selectedChest.type.slice(1)} Chest
                      </Button>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// Chest Card Component
interface ChestCardProps {
  chest: MysteryChest;
  isSelected: boolean;
  onSelect: () => void;
}

function ChestCard({ chest, isSelected, onSelect }: ChestCardProps) {
  const config = chestConfig[chest.type];

  return (
    <motion.button
      whileHover={chest.available ? { scale: 1.02 } : undefined}
      whileTap={chest.available ? { scale: 0.98 } : undefined}
      onClick={onSelect}
      disabled={!chest.available}
      className={cn(
        'relative p-4 rounded-xl border-2 transition-all text-center',
        chest.available
          ? `border-transparent cursor-pointer ${isSelected ? 'ring-2 ring-primary ring-offset-2' : ''}`
          : 'border-neutral-200 opacity-60 cursor-not-allowed'
      )}
    >
      {/* Chest Icon */}
      <div
        className={cn(
          'w-16 h-16 mx-auto rounded-xl bg-gradient-to-br flex items-center justify-center text-3xl shadow-lg mb-2',
          config.color,
          config.glow
        )}
      >
        {config.icon}
      </div>

      {/* Name */}
      <p className="font-bold text-neutral-900 capitalize">{chest.type} Chest</p>

      {/* Status */}
      {chest.available ? (
        <span className="text-xs text-emerald-500 font-medium">Ready to open!</span>
      ) : (
        <div className="mt-1">
          <div className="flex items-center justify-center gap-1 text-xs text-neutral-400">
            <Lock className="w-3 h-3" />
            <span>Locked</span>
          </div>
          {chest.unlockProgress !== undefined && chest.unlockProgress > 0 && (
            <div className="mt-1.5">
              <ProgressBar value={chest.unlockProgress} className="h-1" />
              <span className="text-[10px] text-neutral-400">{chest.unlockProgress}%</span>
            </div>
          )}
        </div>
      )}

      {/* Locked Overlay */}
      {!chest.available && (
        <div className="absolute inset-0 rounded-xl bg-neutral-50/50" />
      )}
    </motion.button>
  );
}

export default MysteryChestModal;
