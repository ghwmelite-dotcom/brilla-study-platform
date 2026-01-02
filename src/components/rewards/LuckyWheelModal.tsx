import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Clock } from 'lucide-react';
import { Button } from '@/components/common';
import { useRewardStore, type ChestReward } from '@/stores/rewardStore';

interface LuckyWheelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRewardClaimed?: (reward: ChestReward) => void;
}

export function LuckyWheelModal({
  isOpen,
  onClose,
  onRewardClaimed,
}: LuckyWheelModalProps) {
  const { luckyWheel, fetchLuckyWheel, spinLuckyWheel, isLoading } = useRewardStore();
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [reward, setReward] = useState<ChestReward | null>(null);
  const [showReward, setShowReward] = useState(false);
  const wheelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      fetchLuckyWheel();
      setReward(null);
      setShowReward(false);
      setRotation(0);
    }
  }, [isOpen, fetchLuckyWheel]);

  const handleSpin = async () => {
    if (!luckyWheel || luckyWheel.spinsRemaining <= 0 || isSpinning) return;

    setIsSpinning(true);

    // Calculate random rotation (5-10 full rotations + random segment)
    const extraRotations = (5 + Math.random() * 5) * 360;
    const randomAngle = Math.random() * 360;
    const totalRotation = rotation + extraRotations + randomAngle;

    setRotation(totalRotation);

    // Wait for animation to complete
    await new Promise((resolve) => setTimeout(resolve, 5000));

    const result = await spinLuckyWheel();
    if (result) {
      setReward(result);
      setShowReward(true);
      onRewardClaimed?.(result);
    }

    setIsSpinning(false);
  };

  const getTimeUntilNextSpin = () => {
    if (!luckyWheel?.nextSpinAt) return null;

    const now = new Date();
    const next = new Date(luckyWheel.nextSpinAt);
    const diff = next.getTime() - now.getTime();

    if (diff <= 0) return null;

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    return `${hours}h ${minutes}m`;
  };

  if (!isOpen) return null;

  const segments = luckyWheel?.segments || [];
  const segmentAngle = 360 / segments.length;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 rounded-2xl overflow-hidden shadow-2xl"
        >
          {/* Header */}
          <div className="relative p-6 text-white text-center">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1 rounded-full bg-white/20 hover:bg-white/30"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center justify-center gap-2 mb-2">
              <Sparkles className="w-6 h-6 text-yellow-400" />
              <h2 className="text-2xl font-bold">Lucky Wheel</h2>
              <Sparkles className="w-6 h-6 text-yellow-400" />
            </div>
            <p className="text-white/70 text-sm">Spin to win amazing rewards!</p>

            {luckyWheel && (
              <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-sm">
                <span>{luckyWheel.spinsRemaining} spin{luckyWheel.spinsRemaining !== 1 ? 's' : ''} remaining</span>
              </div>
            )}
          </div>

          {/* Wheel */}
          <div className="relative flex justify-center py-8">
            {/* Pointer */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
              <div className="w-0 h-0 border-l-[15px] border-r-[15px] border-t-[25px] border-l-transparent border-r-transparent border-t-yellow-400 drop-shadow-lg" />
            </div>

            {/* Wheel Container */}
            <motion.div
              ref={wheelRef}
              animate={{ rotate: rotation }}
              transition={{
                duration: 5,
                ease: [0.2, 0.8, 0.3, 0.99],
              }}
              className="relative w-72 h-72 rounded-full shadow-2xl"
              style={{
                background: `conic-gradient(${segments
                  .map((seg, i) => `${seg.color} ${i * segmentAngle}deg ${(i + 1) * segmentAngle}deg`)
                  .join(', ')})`,
              }}
            >
              {/* Segment Labels */}
              {segments.map((segment, index) => {
                const angle = index * segmentAngle + segmentAngle / 2;
                const radians = (angle - 90) * (Math.PI / 180);
                const x = 50 + 35 * Math.cos(radians);
                const y = 50 + 35 * Math.sin(radians);

                return (
                  <div
                    key={segment.id}
                    className="absolute text-white text-xs font-bold whitespace-nowrap"
                    style={{
                      left: `${x}%`,
                      top: `${y}%`,
                      transform: `translate(-50%, -50%) rotate(${angle}deg)`,
                    }}
                  >
                    {segment.label}
                  </div>
                );
              })}

              {/* Center */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-white shadow-lg flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-purple-600" />
                </div>
              </div>
            </motion.div>
          </div>

          {/* Action */}
          <div className="p-6 pt-0">
            <AnimatePresence mode="wait">
              {showReward && reward ? (
                <motion.div
                  key="reward"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-center"
                >
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 0.5, repeat: 3 }}
                    className="text-3xl font-bold text-yellow-400 mb-4"
                  >
                    {reward.message}
                  </motion.div>

                  <Button
                    onClick={() => {
                      setShowReward(false);
                      setReward(null);
                    }}
                    className="bg-white text-purple-900 hover:bg-white/90"
                  >
                    {luckyWheel && luckyWheel.spinsRemaining > 0 ? 'Spin Again!' : 'Close'}
                  </Button>
                </motion.div>
              ) : (
                <motion.div key="spin">
                  {luckyWheel && luckyWheel.spinsRemaining > 0 ? (
                    <Button
                      fullWidth
                      onClick={handleSpin}
                      disabled={isSpinning || isLoading}
                      className="bg-gradient-to-r from-yellow-400 to-orange-500 text-neutral-900 font-bold text-lg py-3 hover:from-yellow-500 hover:to-orange-600"
                    >
                      {isSpinning ? (
                        <motion.span
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        >
                          <Sparkles className="w-6 h-6" />
                        </motion.span>
                      ) : (
                        <>
                          <Sparkles className="w-6 h-6 mr-2" />
                          SPIN!
                        </>
                      )}
                    </Button>
                  ) : (
                    <div className="text-center text-white">
                      <div className="flex items-center justify-center gap-2 text-white/70 mb-3">
                        <Clock className="w-5 h-5" />
                        <span>Next spin available in:</span>
                      </div>
                      <p className="text-2xl font-bold text-yellow-400">
                        {getTimeUntilNextSpin() || 'Loading...'}
                      </p>
                    </div>
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

export default LuckyWheelModal;
