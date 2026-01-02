import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Lock, Crown } from 'lucide-react';
import { cn } from '@/utils';
import { Button, Card } from '@/components/common';
import {
  useCosmeticsStore,
  type Cosmetic,
  rarityConfig,
  getCosmeticsByType,
} from '@/stores/cosmeticsStore';

interface AvatarFrameSelectorProps {
  userInitials?: string;
  userName?: string;
  onSelect?: (frame: Cosmetic | null) => void;
  className?: string;
}

export function AvatarFrameSelector({
  userInitials = 'JD',
  userName = 'John Doe',
  onSelect,
  className,
}: AvatarFrameSelectorProps) {
  const {
    equippedCosmetics,
    hasCosmetic,
    equipCosmetic,
    unequipCosmetic,
  } = useCosmeticsStore();

  const frames = getCosmeticsByType('avatarFrame');
  const [previewFrame, setPreviewFrame] = useState<string | null>(
    equippedCosmetics.avatarFrame || null
  );

  const selectedFrame = frames.find((f) => f.id === previewFrame);

  const handleSelectFrame = async (frame: Cosmetic) => {
    if (!hasCosmetic(frame.id)) return;

    setPreviewFrame(frame.id);
    await equipCosmetic(frame.id, 'avatarFrame');
    onSelect?.(frame);
  };

  const handleRemoveFrame = async () => {
    setPreviewFrame(null);
    await unequipCosmetic('avatarFrame');
    onSelect?.(null);
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Preview */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2">
          <Crown className="w-5 h-5 text-primary" />
          Avatar Frame Preview
        </h3>

        <div className="flex items-center gap-6">
          {/* Avatar Preview */}
          <div className="relative">
            <motion.div
              key={previewFrame || 'none'}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.2 }}
              className={cn(
                'w-24 h-24 rounded-full flex items-center justify-center',
                selectedFrame?.cssClass || 'ring-4 ring-neutral-200'
              )}
              style={
                selectedFrame?.gradient
                  ? { background: selectedFrame.gradient, padding: '6px' }
                  : undefined
              }
            >
              <div className="w-full h-full rounded-full bg-primary-100 flex items-center justify-center">
                <span className="text-2xl font-bold text-primary">{userInitials}</span>
              </div>
            </motion.div>

            {selectedFrame && selectedFrame.rarity === 'legendary' && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center"
              >
                <Crown className="w-3 h-3 text-white" />
              </motion.div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1">
            <p className="text-xl font-bold text-neutral-900">{userName}</p>
            {selectedFrame ? (
              <div className="flex items-center gap-2 mt-1">
                <span
                  className={cn(
                    'text-sm font-medium px-2 py-0.5 rounded-full capitalize',
                    rarityConfig[selectedFrame.rarity].bg,
                    rarityConfig[selectedFrame.rarity].text
                  )}
                >
                  {selectedFrame.rarity}
                </span>
                <span className="text-sm text-neutral-600">{selectedFrame.name}</span>
              </div>
            ) : (
              <p className="text-sm text-neutral-500 mt-1">No frame selected</p>
            )}
          </div>

          {selectedFrame && (
            <Button variant="outline" size="sm" onClick={handleRemoveFrame}>
              Remove Frame
            </Button>
          )}
        </div>
      </Card>

      {/* Frame Selection Grid */}
      <div>
        <h4 className="font-medium text-neutral-700 mb-3">Available Frames</h4>
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
          {frames.map((frame) => {
            const isOwned = hasCosmetic(frame.id);
            const isSelected = previewFrame === frame.id;
            const rarity = rarityConfig[frame.rarity];

            return (
              <motion.button
                key={frame.id}
                whileHover={isOwned ? { scale: 1.05 } : undefined}
                whileTap={isOwned ? { scale: 0.95 } : undefined}
                onClick={() => isOwned && handleSelectFrame(frame)}
                disabled={!isOwned}
                className={cn(
                  'relative p-2 rounded-xl border-2 transition-all',
                  isOwned
                    ? `${rarity.border} hover:shadow-md cursor-pointer`
                    : 'border-neutral-200 opacity-50 cursor-not-allowed',
                  isSelected && 'ring-2 ring-primary ring-offset-2'
                )}
                title={frame.name}
              >
                {/* Mini Avatar Preview */}
                <div
                  className={cn(
                    'w-12 h-12 mx-auto rounded-full flex items-center justify-center',
                    frame.cssClass
                  )}
                  style={
                    frame.gradient
                      ? { background: frame.gradient, padding: '3px' }
                      : undefined
                  }
                >
                  <div className="w-full h-full rounded-full bg-neutral-200 flex items-center justify-center">
                    <span className="text-xs font-bold text-neutral-600">
                      {userInitials}
                    </span>
                  </div>
                </div>

                {/* Selected Indicator */}
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center"
                  >
                    <Check className="w-3 h-3 text-white" />
                  </motion.div>
                )}

                {/* Lock Indicator */}
                {!isOwned && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/60 rounded-xl">
                    <Lock className="w-4 h-4 text-neutral-400" />
                  </div>
                )}

                {/* Rarity Indicator */}
                <div
                  className={cn(
                    'mt-1 text-[10px] font-medium text-center capitalize truncate',
                    rarity.text
                  )}
                >
                  {frame.name}
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Rarity Legend */}
      <div className="flex flex-wrap gap-4 text-sm">
        {(['common', 'rare', 'epic', 'legendary'] as const).map((rarity) => (
          <div key={rarity} className="flex items-center gap-1.5">
            <div
              className={cn(
                'w-3 h-3 rounded-full border-2',
                rarityConfig[rarity].border,
                rarityConfig[rarity].bg
              )}
            />
            <span className="capitalize text-neutral-600">{rarity}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AvatarFrameSelector;
