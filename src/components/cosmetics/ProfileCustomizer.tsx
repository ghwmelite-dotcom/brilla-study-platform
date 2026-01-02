import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Crown,
  Palette,
  Type,
  Shield,
  ChevronRight,
  Save,
  Eye,
} from 'lucide-react';
import { cn } from '@/utils';
import { Button, Card } from '@/components/common';
import {
  useCosmeticsStore,
  type CosmeticSlot,
  type Cosmetic,
  rarityConfig,
  getCosmeticById,
} from '@/stores/cosmeticsStore';
import { AvatarFrameSelector } from './AvatarFrameSelector';
import { TitleSelector } from './TitleSelector';

interface ProfileCustomizerProps {
  userInitials?: string;
  userName?: string;
  userLevel?: number;
  onSave?: () => void;
  className?: string;
}

type CustomizerTab = 'preview' | CosmeticSlot;

const tabConfig: Record<CustomizerTab, { icon: typeof Sparkles; label: string }> = {
  preview: { icon: Eye, label: 'Preview' },
  avatarFrame: { icon: Crown, label: 'Avatar Frame' },
  title: { icon: Type, label: 'Title' },
  profileTheme: { icon: Palette, label: 'Profile Theme' },
  badgeStyle: { icon: Shield, label: 'Badge Style' },
  nameEffect: { icon: Sparkles, label: 'Name Effect' },
};

export function ProfileCustomizer({
  userInitials = 'JD',
  userName = 'John Doe',
  userLevel = 15,
  onSave,
  className,
}: ProfileCustomizerProps) {
  const [activeTab, setActiveTab] = useState<CustomizerTab>('preview');
  const { equippedCosmetics } = useCosmeticsStore();

  const equippedFrame = equippedCosmetics.avatarFrame
    ? getCosmeticById(equippedCosmetics.avatarFrame)
    : null;
  const equippedTitle = equippedCosmetics.title
    ? getCosmeticById(equippedCosmetics.title)
    : null;
  const equippedTheme = equippedCosmetics.profileTheme
    ? getCosmeticById(equippedCosmetics.profileTheme)
    : null;
  const equippedNameEffect = equippedCosmetics.nameEffect
    ? getCosmeticById(equippedCosmetics.nameEffect)
    : null;

  return (
    <div className={cn('grid lg:grid-cols-[280px_1fr] gap-6', className)}>
      {/* Sidebar */}
      <div className="space-y-4">
        <Card className="p-4">
          <h3 className="font-semibold text-neutral-900 mb-3">Customization</h3>
          <nav className="space-y-1">
            {(Object.entries(tabConfig) as [CustomizerTab, typeof tabConfig['preview']][]).map(
              ([tab, config]) => {
                const Icon = config.icon;
                const isActive = activeTab === tab;

                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all',
                      isActive
                        ? 'bg-primary text-white'
                        : 'text-neutral-600 hover:bg-neutral-100'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="flex-1 font-medium">{config.label}</span>
                    <ChevronRight
                      className={cn('w-4 h-4', isActive ? 'text-white' : 'text-neutral-400')}
                    />
                  </button>
                );
              }
            )}
          </nav>
        </Card>

        {/* Quick Stats */}
        <Card className="p-4">
          <h4 className="text-sm font-medium text-neutral-500 mb-3">Equipped Items</h4>
          <div className="space-y-2">
            {equippedFrame && (
              <div className="flex items-center gap-2">
                <Crown className="w-4 h-4 text-neutral-400" />
                <span className="text-sm text-neutral-600">{equippedFrame.name}</span>
              </div>
            )}
            {equippedTitle && (
              <div className="flex items-center gap-2">
                <Type className="w-4 h-4 text-neutral-400" />
                <span className="text-sm text-neutral-600">{equippedTitle.name}</span>
              </div>
            )}
            {equippedTheme && (
              <div className="flex items-center gap-2">
                <Palette className="w-4 h-4 text-neutral-400" />
                <span className="text-sm text-neutral-600">{equippedTheme.name}</span>
              </div>
            )}
            {equippedNameEffect && (
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-neutral-400" />
                <span className="text-sm text-neutral-600">{equippedNameEffect.name}</span>
              </div>
            )}
          </div>
        </Card>

        <Button fullWidth onClick={onSave}>
          <Save className="w-4 h-4 mr-2" />
          Save Changes
        </Button>
      </div>

      {/* Main Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'preview' && (
            <ProfilePreview
              userInitials={userInitials}
              userName={userName}
              userLevel={userLevel}
              frame={equippedFrame}
              title={equippedTitle}
              theme={equippedTheme}
              nameEffect={equippedNameEffect}
            />
          )}

          {activeTab === 'avatarFrame' && (
            <AvatarFrameSelector
              userInitials={userInitials}
              userName={userName}
            />
          )}

          {activeTab === 'title' && <TitleSelector userName={userName} />}

          {activeTab === 'profileTheme' && (
            <ThemeSelector />
          )}

          {activeTab === 'badgeStyle' && (
            <BadgeStyleSelector />
          )}

          {activeTab === 'nameEffect' && (
            <NameEffectSelector userName={userName} />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// Profile Preview Component
interface ProfilePreviewProps {
  userInitials: string;
  userName: string;
  userLevel: number;
  frame?: Cosmetic | null;
  title?: Cosmetic | null;
  theme?: Cosmetic | null;
  nameEffect?: Cosmetic | null;
}

function ProfilePreview({
  userInitials,
  userName,
  userLevel,
  frame,
  title,
  theme,
  nameEffect,
}: ProfilePreviewProps) {
  return (
    <Card className="overflow-hidden">
      {/* Theme Background */}
      <div
        className={cn('h-32 relative', theme?.cssClass || 'bg-gradient-to-r from-primary to-primary-600')}
        style={theme?.gradient ? { background: theme.gradient } : undefined}
      >
        <div className="absolute inset-0 bg-black/10" />
      </div>

      {/* Profile Info */}
      <div className="px-6 pb-6">
        {/* Avatar */}
        <div className="relative -mt-12 mb-4">
          <div
            className={cn(
              'w-24 h-24 rounded-full bg-white flex items-center justify-center shadow-lg',
              frame?.cssClass || 'ring-4 ring-white'
            )}
            style={
              frame?.gradient
                ? { background: frame.gradient, padding: '4px' }
                : undefined
            }
          >
            <div className="w-full h-full rounded-full bg-primary-100 flex items-center justify-center">
              <span className="text-3xl font-bold text-primary">{userInitials}</span>
            </div>
          </div>

          {/* Level Badge */}
          <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-white font-bold text-sm shadow">
            {userLevel}
          </div>
        </div>

        {/* Name with Effect */}
        <h2
          className={cn('text-2xl font-bold', nameEffect?.cssClass || 'text-neutral-900')}
        >
          {userName}
        </h2>

        {/* Title */}
        {title && (
          <div className="flex items-center gap-1 mt-1">
            <span
              className={cn(
                'text-sm font-semibold',
                rarityConfig[title.rarity].text
              )}
            >
              {title.name}
            </span>
          </div>
        )}

        {/* Stats Preview */}
        <div className="flex gap-6 mt-4 pt-4 border-t border-neutral-100">
          <div>
            <p className="text-2xl font-bold text-neutral-900">1,234</p>
            <p className="text-sm text-neutral-500">Total XP</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-neutral-900">7</p>
            <p className="text-sm text-neutral-500">Day Streak</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-neutral-900">15</p>
            <p className="text-sm text-neutral-500">Badges</p>
          </div>
        </div>
      </div>
    </Card>
  );
}

// Theme Selector
import { getCosmeticsByType } from '@/stores/cosmeticsStore';

function ThemeSelector() {
  const { equippedCosmetics, hasCosmetic, equipCosmetic } = useCosmeticsStore();
  const themes = getCosmeticsByType('profileTheme');

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-neutral-900">Profile Themes</h3>
      <p className="text-neutral-500">Choose a background theme for your profile</p>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {themes.map((theme) => {
          const isOwned = hasCosmetic(theme.id);
          const isSelected = equippedCosmetics.profileTheme === theme.id;
          const rarity = rarityConfig[theme.rarity];

          return (
            <motion.button
              key={theme.id}
              whileHover={isOwned ? { scale: 1.02 } : undefined}
              whileTap={isOwned ? { scale: 0.98 } : undefined}
              onClick={() => isOwned && equipCosmetic(theme.id, 'profileTheme')}
              disabled={!isOwned}
              className={cn(
                'relative overflow-hidden rounded-xl border-2 transition-all',
                isOwned ? `${rarity.border} cursor-pointer` : 'border-neutral-200 opacity-50',
                isSelected && 'ring-2 ring-primary ring-offset-2'
              )}
            >
              <div
                className={cn('h-24', theme.cssClass)}
                style={theme.gradient ? { background: theme.gradient } : undefined}
              />
              <div className="p-3 bg-white">
                <p className="font-medium text-neutral-900 text-sm">{theme.name}</p>
                <span className={cn('text-xs capitalize', rarity.text)}>{theme.rarity}</span>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

// Badge Style Selector
function BadgeStyleSelector() {
  const { equippedCosmetics, hasCosmetic, equipCosmetic } = useCosmeticsStore();
  const badgeStyles = getCosmeticsByType('badgeStyle');

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-neutral-900">Badge Styles</h3>
      <p className="text-neutral-500">Customize how your achievement badges look</p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {badgeStyles.map((style) => {
          const isOwned = hasCosmetic(style.id);
          const isSelected = equippedCosmetics.badgeStyle === style.id;
          const rarity = rarityConfig[style.rarity];

          return (
            <motion.button
              key={style.id}
              whileHover={isOwned ? { scale: 1.05 } : undefined}
              whileTap={isOwned ? { scale: 0.95 } : undefined}
              onClick={() => isOwned && equipCosmetic(style.id, 'badgeStyle')}
              disabled={!isOwned}
              className={cn(
                'p-4 rounded-xl border-2 transition-all',
                isOwned ? `${rarity.border} ${rarity.bg} cursor-pointer` : 'border-neutral-200 opacity-50',
                isSelected && 'ring-2 ring-primary ring-offset-2'
              )}
            >
              <div className="flex justify-center gap-2 mb-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={cn(
                      'w-8 h-8 bg-amber-400 flex items-center justify-center',
                      style.cssClass
                    )}
                  >
                    <span className="text-xs font-bold text-white">{i}</span>
                  </div>
                ))}
              </div>
              <p className="font-medium text-neutral-900 text-sm">{style.name}</p>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

// Name Effect Selector
function NameEffectSelector({ userName }: { userName: string }) {
  const { equippedCosmetics, hasCosmetic, equipCosmetic } = useCosmeticsStore();
  const nameEffects = getCosmeticsByType('nameEffect');

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-neutral-900">Name Effects</h3>
      <p className="text-neutral-500">Add special effects to your display name</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {nameEffects.map((effect) => {
          const isOwned = hasCosmetic(effect.id);
          const isSelected = equippedCosmetics.nameEffect === effect.id;
          const rarity = rarityConfig[effect.rarity];

          return (
            <motion.button
              key={effect.id}
              whileHover={isOwned ? { scale: 1.02 } : undefined}
              whileTap={isOwned ? { scale: 0.98 } : undefined}
              onClick={() => isOwned && equipCosmetic(effect.id, 'nameEffect')}
              disabled={!isOwned}
              className={cn(
                'p-4 rounded-xl border-2 text-left transition-all',
                isOwned ? `${rarity.border} ${rarity.bg} cursor-pointer` : 'border-neutral-200 opacity-50',
                isSelected && 'ring-2 ring-primary ring-offset-2'
              )}
            >
              <p className={cn('text-xl font-bold mb-2', effect.cssClass)}>{userName}</p>
              <p className="font-medium text-neutral-900 text-sm">{effect.name}</p>
              <span className={cn('text-xs capitalize', rarity.text)}>{effect.rarity}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

export default ProfileCustomizer;
