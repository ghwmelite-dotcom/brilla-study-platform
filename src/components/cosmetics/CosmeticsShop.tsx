import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Crown,
  Palette,
  Type,
  Shield,
  Lock,
  Check,
  Coins,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/utils';
import { Button, Card } from '@/components/common';
import {
  useCosmeticsStore,
  type Cosmetic,
  type CosmeticSlot,
  type CosmeticRarity,
  rarityConfig,
  getCosmeticsByType,
} from '@/stores/cosmeticsStore';

interface CosmeticsShopProps {
  className?: string;
  onSelectCosmetic?: (cosmetic: Cosmetic) => void;
}

const slotConfig: Record<CosmeticSlot, { icon: typeof Sparkles; label: string; description: string }> = {
  avatarFrame: {
    icon: Crown,
    label: 'Avatar Frames',
    description: 'Customize the border around your avatar',
  },
  title: {
    icon: Type,
    label: 'Titles',
    description: 'Display a title under your name',
  },
  profileTheme: {
    icon: Palette,
    label: 'Profile Themes',
    description: 'Change your profile background',
  },
  badgeStyle: {
    icon: Shield,
    label: 'Badge Styles',
    description: 'Customize how your badges look',
  },
  nameEffect: {
    icon: Sparkles,
    label: 'Name Effects',
    description: 'Add effects to your display name',
  },
};

const rarityOrder: CosmeticRarity[] = ['common', 'rare', 'epic', 'legendary'];

export function CosmeticsShop({ className, onSelectCosmetic }: CosmeticsShopProps) {
  const [selectedSlot, setSelectedSlot] = useState<CosmeticSlot>('avatarFrame');
  const [selectedRarity, setSelectedRarity] = useState<CosmeticRarity | 'all'>('all');

  const {
    ownedCosmetics,
    equippedCosmetics,
    coins,
    hasCosmetic,
    equipCosmetic,
    purchaseCosmetic,
  } = useCosmeticsStore();

  const cosmetics = getCosmeticsByType(selectedSlot).filter(
    (c) => selectedRarity === 'all' || c.rarity === selectedRarity
  );

  const handleEquip = async (cosmetic: Cosmetic) => {
    if (hasCosmetic(cosmetic.id)) {
      await equipCosmetic(cosmetic.id, cosmetic.type);
      onSelectCosmetic?.(cosmetic);
    }
  };

  const handlePurchase = async (cosmetic: Cosmetic) => {
    const success = await purchaseCosmetic(cosmetic.id);
    if (success) {
      onSelectCosmetic?.(cosmetic);
    }
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header with coins */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900">Cosmetics Shop</h2>
          <p className="text-neutral-500">Customize your profile with unique items</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-amber-100">
          <Coins className="w-5 h-5 text-amber-600" />
          <span className="font-bold text-amber-600">{coins.toLocaleString()}</span>
        </div>
      </div>

      {/* Slot Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {(Object.entries(slotConfig) as [CosmeticSlot, typeof slotConfig['avatarFrame']][]).map(
          ([slot, config]) => {
            const Icon = config.icon;
            const isActive = selectedSlot === slot;
            const ownedCount = ownedCosmetics.filter((o) =>
              getCosmeticsByType(slot).some((c) => c.id === o.cosmeticId)
            ).length;
            const totalCount = getCosmeticsByType(slot).length;

            return (
              <button
                key={slot}
                onClick={() => setSelectedSlot(slot)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-xl whitespace-nowrap transition-all',
                  isActive
                    ? 'bg-primary text-white'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                )}
              >
                <Icon className="w-4 h-4" />
                <span className="font-medium">{config.label}</span>
                <span
                  className={cn(
                    'text-xs px-2 py-0.5 rounded-full',
                    isActive ? 'bg-white/20 text-white' : 'bg-neutral-200 text-neutral-500'
                  )}
                >
                  {ownedCount}/{totalCount}
                </span>
              </button>
            );
          }
        )}
      </div>

      {/* Rarity Filter */}
      <div className="flex gap-2">
        <button
          onClick={() => setSelectedRarity('all')}
          className={cn(
            'px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
            selectedRarity === 'all'
              ? 'bg-neutral-900 text-white'
              : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
          )}
        >
          All
        </button>
        {rarityOrder.map((rarity) => (
          <button
            key={rarity}
            onClick={() => setSelectedRarity(rarity)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-all',
              selectedRarity === rarity
                ? `${rarityConfig[rarity].bg} ${rarityConfig[rarity].text} ${rarityConfig[rarity].border} border`
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            )}
          >
            {rarity}
          </button>
        ))}
      </div>

      {/* Cosmetics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence mode="popLayout">
          {cosmetics.map((cosmetic) => (
            <CosmeticCard
              key={cosmetic.id}
              cosmetic={cosmetic}
              isOwned={hasCosmetic(cosmetic.id)}
              isEquipped={equippedCosmetics[cosmetic.type] === cosmetic.id}
              coins={coins}
              onEquip={handleEquip}
              onPurchase={handlePurchase}
            />
          ))}
        </AnimatePresence>
      </div>

      {cosmetics.length === 0 && (
        <Card className="p-8 text-center">
          <Sparkles className="w-12 h-12 mx-auto text-neutral-300 mb-3" />
          <p className="text-neutral-500">No cosmetics found with the selected filters</p>
        </Card>
      )}
    </div>
  );
}

// Individual cosmetic card
interface CosmeticCardProps {
  cosmetic: Cosmetic;
  isOwned: boolean;
  isEquipped: boolean;
  coins: number;
  onEquip: (cosmetic: Cosmetic) => void;
  onPurchase: (cosmetic: Cosmetic) => void;
}

function CosmeticCard({
  cosmetic,
  isOwned,
  isEquipped,
  coins,
  onEquip,
  onPurchase,
}: CosmeticCardProps) {
  const rarity = rarityConfig[cosmetic.rarity];
  const canAfford = !cosmetic.price || coins >= cosmetic.price;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        className={cn(
          'overflow-hidden border-2 transition-all hover:shadow-lg',
          rarity.border,
          isEquipped && 'ring-2 ring-primary ring-offset-2',
          rarity.glow
        )}
      >
        {/* Preview Area */}
        <div className={cn('h-24 flex items-center justify-center', rarity.bg)}>
          <CosmeticPreview cosmetic={cosmetic} />
        </div>

        {/* Info */}
        <div className="p-4">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="font-semibold text-neutral-900">{cosmetic.name}</h3>
              <span
                className={cn(
                  'text-xs font-medium capitalize px-2 py-0.5 rounded-full',
                  rarity.bg,
                  rarity.text
                )}
              >
                {cosmetic.rarity}
              </span>
            </div>
            {isEquipped && (
              <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-primary-100 text-primary text-xs font-medium">
                <Check className="w-3 h-3" />
                Equipped
              </div>
            )}
          </div>

          <p className="text-sm text-neutral-500 mb-4 line-clamp-2">{cosmetic.description}</p>

          {/* Unlock Requirement */}
          {!isOwned && (
            <div className="mb-4 text-xs text-neutral-400">
              {cosmetic.unlockMethod === 'level' && (
                <span className="flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  Unlocks at Level {cosmetic.unlockLevel}
                </span>
              )}
              {cosmetic.unlockMethod === 'achievement' && (
                <span className="flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  Unlock via achievement
                </span>
              )}
              {cosmetic.unlockMethod === 'streak' && (
                <span className="flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  Earn with streak milestone
                </span>
              )}
              {cosmetic.unlockMethod === 'battle' && (
                <span className="flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  Win battles to unlock
                </span>
              )}
              {cosmetic.unlockMethod === 'purchase' && cosmetic.price && (
                <span className="flex items-center gap-1">
                  <Coins className="w-3 h-3" />
                  {cosmetic.price.toLocaleString()} coins
                </span>
              )}
            </div>
          )}

          {/* Action Button */}
          {isOwned ? (
            <Button
              fullWidth
              variant={isEquipped ? 'outline' : 'primary'}
              onClick={() => onEquip(cosmetic)}
              disabled={isEquipped}
            >
              {isEquipped ? 'Currently Equipped' : 'Equip'}
              {!isEquipped && <ChevronRight className="w-4 h-4 ml-1" />}
            </Button>
          ) : cosmetic.unlockMethod === 'purchase' && cosmetic.price ? (
            <Button
              fullWidth
              variant="primary"
              onClick={() => onPurchase(cosmetic)}
              disabled={!canAfford}
            >
              <Coins className="w-4 h-4 mr-1" />
              {canAfford ? `Buy for ${cosmetic.price}` : 'Not enough coins'}
            </Button>
          ) : (
            <Button fullWidth variant="outline" disabled>
              <Lock className="w-4 h-4 mr-1" />
              Locked
            </Button>
          )}
        </div>
      </Card>
    </motion.div>
  );
}

// Preview component for different cosmetic types
function CosmeticPreview({ cosmetic }: { cosmetic: Cosmetic }) {
  switch (cosmetic.type) {
    case 'avatarFrame':
      return (
        <div className="relative">
          <div
            className={cn(
              'w-16 h-16 rounded-full bg-neutral-300 flex items-center justify-center text-2xl',
              cosmetic.cssClass
            )}
            style={
              cosmetic.gradient
                ? {
                    background: cosmetic.gradient,
                    padding: '4px',
                  }
                : undefined
            }
          >
            <div className="w-full h-full rounded-full bg-neutral-200 flex items-center justify-center">
              JD
            </div>
          </div>
        </div>
      );

    case 'title':
      return (
        <div className="text-center">
          <p className="text-sm text-neutral-500">Your Name</p>
          <p className={cn('font-semibold', rarityConfig[cosmetic.rarity].text)}>
            {cosmetic.name}
          </p>
        </div>
      );

    case 'profileTheme':
      return (
        <div
          className={cn('w-full h-full', cosmetic.cssClass)}
          style={cosmetic.gradient ? { background: cosmetic.gradient } : undefined}
        />
      );

    case 'badgeStyle':
      return (
        <div className="flex gap-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className={cn(
                'w-8 h-8 bg-amber-400 flex items-center justify-center',
                cosmetic.cssClass
              )}
            >
              <span className="text-xs font-bold text-white">{i}</span>
            </div>
          ))}
        </div>
      );

    case 'nameEffect':
      return (
        <p className={cn('text-xl font-bold', cosmetic.cssClass)}>{cosmetic.name}</p>
      );

    default:
      return <Sparkles className="w-12 h-12 text-neutral-400" />;
  }
}

export default CosmeticsShop;
