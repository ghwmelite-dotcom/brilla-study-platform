import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HandHelping,
  X,
  Loader2,
  GraduationCap,
  MessageCircle,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/utils';

interface TutorConnectPromptProps {
  status: 'suggested' | 'requested' | 'pending' | 'connected' | 'declined' | 'none';
  onAccept: () => void;
  onDecline: () => void;
  onClose?: () => void;
  tutorName?: string;
  className?: string;
}

export function TutorConnectPrompt({
  status,
  onAccept,
  onDecline,
  onClose,
  tutorName,
  className,
}: TutorConnectPromptProps) {
  const [isAccepting, setIsAccepting] = useState(false);

  const handleAccept = async () => {
    setIsAccepting(true);
    try {
      await onAccept();
    } finally {
      setIsAccepting(false);
    }
  };

  if (status === 'none') return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className={cn(
          "fixed bottom-24 left-1/2 -translate-x-1/2 z-50",
          "w-[90vw] max-w-md",
          className
        )}
      >
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          {/* Close button */}
          {onClose && status !== 'pending' && (
            <button
              onClick={onClose}
              className="absolute top-3 right-3 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {/* Suggested state */}
          {status === 'suggested' && (
            <div className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 rounded-xl">
                  <HandHelping className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900 dark:text-white text-lg">
                    Need some extra help?
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
                    It looks like you might benefit from working with an expert tutor.
                    Would you like to connect with one?
                  </p>
                </div>
              </div>

              <div className="flex gap-3 mt-5">
                <button
                  onClick={onDecline}
                  className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  No thanks
                </button>
                <button
                  onClick={handleAccept}
                  disabled={isAccepting}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-medium rounded-xl hover:from-emerald-700 hover:to-teal-700 transition-colors disabled:opacity-70"
                >
                  {isAccepting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <GraduationCap className="w-4 h-4" />
                      Yes, connect me
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Requested/Pending state */}
          {(status === 'requested' || status === 'pending') && (
            <div className="p-6">
              <div className="text-center">
                <div className="relative w-16 h-16 mx-auto mb-4">
                  <div className="absolute inset-0 bg-violet-100 dark:bg-violet-900/30 rounded-full animate-ping opacity-50" />
                  <div className="relative w-full h-full bg-violet-100 dark:bg-violet-900/30 rounded-full flex items-center justify-center">
                    <MessageCircle className="w-7 h-7 text-violet-600 dark:text-violet-400" />
                  </div>
                </div>
                <h3 className="font-semibold text-slate-900 dark:text-white text-lg">
                  Finding a tutor...
                </h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
                  We're connecting you with an available expert tutor.
                  This usually takes less than a minute.
                </p>

                <div className="flex items-center justify-center gap-2 mt-4 text-sm text-slate-500 dark:text-slate-400">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Searching for tutors...
                </div>

                <button
                  onClick={onDecline}
                  className="mt-4 text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 underline"
                >
                  Cancel request
                </button>
              </div>
            </div>
          )}

          {/* Connected state */}
          {status === 'connected' && (
            <div className="p-6">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h3 className="font-semibold text-slate-900 dark:text-white text-lg">
                  Tutor Connected!
                </h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
                  {tutorName ? (
                    <>{tutorName} has joined your session and is ready to help!</>
                  ) : (
                    <>A tutor has joined your session and is ready to help!</>
                  )}
                </p>

                <button
                  onClick={onClose}
                  className="mt-4 px-6 py-2 bg-emerald-600 text-white font-medium rounded-xl hover:bg-emerald-700 transition-colors"
                >
                  Got it!
                </button>
              </div>
            </div>
          )}

          {/* Declined state */}
          {status === 'declined' && (
            <div className="p-6">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="font-semibold text-slate-900 dark:text-white text-lg">
                  No tutors available
                </h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
                  All tutors are currently busy. Don't worry, the AI tutor
                  is still here to help! You can try again later.
                </p>

                <button
                  onClick={onClose}
                  className="mt-4 px-6 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium rounded-xl hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
                >
                  Continue with AI
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export default TutorConnectPrompt;
