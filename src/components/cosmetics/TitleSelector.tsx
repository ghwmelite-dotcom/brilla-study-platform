import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Lock, Type, Star } from 'lucide-react';
import { cn } from '@/utils';
import { Button, Card } from '@/components/common';
import {
  useCosmeticsStore,
  type Cosmetic,
  rarityConfig,
  getCosmeticsByType,
} from '@/stores/cosmeticsStore';

interface TitleSelectorProps {
  userName?: string;
  onSelect?: (title: Cosmetic | null) => void;
  className?: string;
}

export function TitleSelector({
  userName = 'John Doe',
  onSelect,
  className,
}: TitleSelectorProps) {
  const {
    equippedCosmetics,
    hasCosmetic,
    equipCosmetic,
    unequipCosmetic,
  } = useCosmeticsStore();

  const titles = getCosmeticsByType('title');
  const [previewTitle, setPreviewTitle] = useState<string | null>(
    equippedCosmetics.title || null
  );

  const selectedTitle = titles.find((t) => t.id === previewTitle);

  const handleSelectTitle = async (title: Cosmetic) => {
    if (!hasCosmetic(title.id)) return;

    setPreviewTitle(title.id);
    await equipCosmetic(title.id, 'title');
    onSelect?.(title);
  };

  const handleRemoveTitle = async () => {
    setPreviewTitle(null);
    await unequipCosmetic('title');
    onSelect?.(null);
  };

  // Group titles by rarity
  const groupedTitles = {
    legendary: titles.filter((t) => t.rarity === 'legendary'),
    epic: titles.filter((t) => t.rarity === 'epic'),
    rare: titles.filter((t) => t.rarity === 'rare'),
    common: titles.filter((t) => t.rarity === 'common'),
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Preview */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2">
          <Type className="w-5 h-5 text-primary" />
          Title Preview
        </h3>

        <div className="text-center py-4">
          <motion.div
            key={previewTitle || 'none'}
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            <p className="text-2xl font-bold text-neutral-900">{userName}</p>
            {selectedTitle ? (
              <div className="flex items-center justify-center gap-2 mt-2">
                {selectedTitle.rarity === 'legendary' && (
                  <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                )}
                <span
                  className={cn(
                    'text-lg font-semibold',
                    rarityConfig[selectedTitle.rarity].text
                  )}
                >
                  {selectedTitle.name}
                </span>
                {selectedTitle.rarity === 'legendary' && (
                  <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                )}
              </div>
            ) : (
              <p className="text-neutral-400 mt-2">No title selected</p>
            )}
          </motion.div>

          {selectedTitle && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleRemoveTitle}
              className="mt-4"
            >
              Remove Title
            </Button>
          )}
        </div>
      </Card>

      {/* Title Selection */}
      <div className="space-y-6">
        {(['legendary', 'epic', 'rare', 'common'] as const).map((rarity) => {
          const rarityTitles = groupedTitles[rarity];
          if (rarityTitles.length === 0) return null;

          const config = rarityConfig[rarity];

          return (
            <div key={rarity}>
              <div className="flex items-center gap-2 mb-3">
                <div
                  className={cn(
                    'w-3 h-3 rounded-full',
                    config.bg,
                    config.border,
                    'border-2'
                  )}
                />
                <h4 className={cn('font-medium capitalize', config.text)}>{rarity} Titles</h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {rarityTitles.map((title) => {
                  const isOwned = hasCosmetic(title.id);
                  const isSelected = previewTitle === title.id;

                  return (
                    <motion.button
                      key={title.id}
                      whileHover={isOwned ? { scale: 1.02 } : undefined}
                      whileTap={isOwned ? { scale: 0.98 } : undefined}
                      onClick={() => isOwned && handleSelectTitle(title)}
                      disabled={!isOwned}
                      className={cn(
                        'relative p-4 rounded-xl border-2 text-left transition-all',
                        isOwned
                          ? `${config.border} ${config.bg} hover:shadow-md cursor-pointer`
                          : 'border-neutral-200 bg-neutral-50 opacity-60 cursor-not-allowed',
                        isSelected && 'ring-2 ring-primary ring-offset-2',
                        config.glow
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className={cn('font-bold', isOwned ? config.text : 'text-neutral-400')}>
                            {title.name}
                          </p>
                          <p className="text-xs text-neutral-500 mt-0.5 line-clamp-1">
                            {title.description}
                          </p>
                        </div>

                        {isSelected && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="w-6 h-6 rounded-full bg-primary flex items-center justify-center"
                          >
                            <Check className="w-3 h-3 text-white" />
                          </motion.div>
                        )}

                        {!isOwned && (
                          <div className="w-6 h-6 rounded-full bg-neutral-200 flex items-center justify-center">
                            <Lock className="w-3 h-3 text-neutral-400" />
                          </div>
                        )}
                      </div>

                      {/* Unlock requirement hint */}
                      {!isOwned && (
                        <p className="text-[10px] text-neutral-400 mt-2">
                          {title.unlockMethod === 'level' && `Level ${title.unlockLevel}`}
                          {title.unlockMethod === 'achievement' && 'Achievement'}
                          {title.unlockMethod === 'streak' && 'Streak milestone'}
                          {title.unlockMethod === 'battle' && 'Battle wins'}
                        </p>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default TitleSelector;
