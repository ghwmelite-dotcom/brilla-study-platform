import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic,
  MicOff,
  Volume2,
  Maximize,
  Minimize,
  Users,
  LogOut,
  Cloud,
  BookOpen,
  Music,
  X,
} from 'lucide-react';
import { cn } from '@/utils';

interface ImmersiveControlsProps {
  visible: boolean;
  isFullscreen: boolean;
  voiceEnabled: boolean;
  ambientSound: 'none' | 'rain' | 'library' | 'lofi';
  ambientVolume: number;
  inviteCode: string | null;
  onToggleFullscreen: () => void;
  onToggleVoice: () => void;
  onChangeAmbient: (sound: 'none' | 'rain' | 'library' | 'lofi') => void;
  onChangeVolume: (volume: number) => void;
  onInviteFriends: () => void;
  onExit: () => void;
}

const AMBIENT_OPTIONS = [
  { id: 'none', label: 'None', icon: X },
  { id: 'rain', label: 'Rain', icon: Cloud },
  { id: 'library', label: 'Library', icon: BookOpen },
  { id: 'lofi', label: 'Lo-Fi', icon: Music },
] as const;

export function ImmersiveControls({
  visible,
  isFullscreen,
  voiceEnabled,
  ambientSound,
  ambientVolume,
  inviteCode,
  onToggleFullscreen,
  onToggleVoice,
  onChangeAmbient,
  onChangeVolume,
  onInviteFriends,
  onExit,
}: ImmersiveControlsProps) {
  const [showAmbientMenu, setShowAmbientMenu] = useState(false);

  return (
    <>
      {/* Bottom control bar */}
      <AnimatePresence>
        {visible && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-3 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl"
          >
            {/* Voice toggle */}
            <button
              onClick={onToggleVoice}
              className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center transition-all",
                voiceEnabled
                  ? "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
                  : "bg-white/5 text-white/40 hover:bg-white/10 hover:text-white/60"
              )}
              title={voiceEnabled ? "Voice enabled" : "Voice disabled"}
            >
              {voiceEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
            </button>

            {/* Ambient sounds */}
            <div className="relative">
              <button
                onClick={() => setShowAmbientMenu(!showAmbientMenu)}
                className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center transition-all",
                  ambientSound !== 'none'
                    ? "bg-violet-500/20 text-violet-400 hover:bg-violet-500/30"
                    : "bg-white/5 text-white/40 hover:bg-white/10 hover:text-white/60"
                )}
                title="Ambient sounds"
              >
                <Volume2 className="w-5 h-5" />
              </button>

              {/* Ambient menu */}
              <AnimatePresence>
                {showAmbientMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-3 bg-slate-900/95 backdrop-blur-xl rounded-xl border border-white/10 shadow-2xl"
                  >
                    <p className="text-xs text-white/40 mb-2 text-center">Ambient Sound</p>
                    <div className="flex gap-2 mb-3">
                      {AMBIENT_OPTIONS.map((option) => {
                        const Icon = option.icon;
                        return (
                          <button
                            key={option.id}
                            onClick={() => {
                              onChangeAmbient(option.id);
                              if (option.id === 'none') setShowAmbientMenu(false);
                            }}
                            className={cn(
                              "w-10 h-10 rounded-lg flex items-center justify-center transition-all",
                              ambientSound === option.id
                                ? "bg-violet-500 text-white"
                                : "bg-white/5 text-white/40 hover:bg-white/10"
                            )}
                            title={option.label}
                          >
                            <Icon className="w-4 h-4" />
                          </button>
                        );
                      })}
                    </div>

                    {/* Volume slider */}
                    {ambientSound !== 'none' && (
                      <div className="flex items-center gap-2">
                        <Volume2 className="w-3 h-3 text-white/40" />
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.1"
                          value={ambientVolume}
                          onChange={(e) => onChangeVolume(parseFloat(e.target.value))}
                          className="w-24 h-1 bg-white/20 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-violet-400 [&::-webkit-slider-thumb]:rounded-full"
                        />
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Divider */}
            <div className="w-px h-8 bg-white/10" />

            {/* Invite friends */}
            <button
              onClick={onInviteFriends}
              className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center transition-all",
                inviteCode
                  ? "bg-blue-500/20 text-blue-400 hover:bg-blue-500/30"
                  : "bg-white/5 text-white/40 hover:bg-white/10 hover:text-white/60"
              )}
              title="Invite friends"
            >
              <Users className="w-5 h-5" />
            </button>

            {/* Fullscreen toggle */}
            <button
              onClick={onToggleFullscreen}
              className="w-12 h-12 rounded-xl flex items-center justify-center bg-white/5 text-white/40 hover:bg-white/10 hover:text-white/60 transition-all"
              title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            >
              {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
            </button>

            {/* Divider */}
            <div className="w-px h-8 bg-white/10" />

            {/* Exit */}
            <button
              onClick={onExit}
              className="w-12 h-12 rounded-xl flex items-center justify-center bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all"
              title="Exit session"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edge hint indicators */}
      <AnimatePresence>
        {!visible && (
          <>
            {/* Bottom edge hint */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-t from-white/5 to-transparent pointer-events-none"
            />
          </>
        )}
      </AnimatePresence>

      {/* Keyboard hint (shown briefly) */}
      <AnimatePresence>
        {visible && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 1 }}
            className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs text-white/30"
          >
            Press ESC or say "exit" to leave
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default ImmersiveControls;
