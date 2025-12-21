import { useState } from 'react';
import { Copy, Check, RefreshCw, Clock, Users, Shield } from 'lucide-react';
import { Button, Badge } from '@/components/common';
import { useParentStore } from '@/stores';
import { cn } from '@/utils';

interface ParentInviteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ParentInviteModal({ isOpen, onClose }: ParentInviteModalProps) {
  const { currentInviteCode, isLoading, error, generateInviteCode, clearError } = useParentStore();
  const [copied, setCopied] = useState(false);

  const handleGenerateCode = async () => {
    clearError();
    await generateInviteCode();
  };

  const handleCopyCode = () => {
    if (currentInviteCode?.code) {
      navigator.clipboard.writeText(currentInviteCode.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!isOpen) return null;

  const expiresIn = currentInviteCode?.expiresAt
    ? Math.max(0, Math.floor((new Date(currentInviteCode.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60)))
    : 0;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-primary-100 rounded-lg">
            <Users className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-neutral-900">
              Parent/Guardian Access
            </h2>
            <p className="text-sm text-neutral-500">
              Generate a code for your parent to link their account
            </p>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">What parents can see:</p>
              <ul className="space-y-1 text-blue-700">
                <li>Your learning progress and scores</li>
                <li>Topic mastery and achievements</li>
                <li>Study streaks and XP points</li>
              </ul>
              <p className="mt-2 text-blue-600">
                Parents cannot see your chat messages or personal notes.
              </p>
            </div>
          </div>
        </div>

        {/* Generate Code Section */}
        {!currentInviteCode ? (
          <div className="text-center py-6">
            <Button
              onClick={handleGenerateCode}
              disabled={isLoading}
              leftIcon={isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : undefined}
            >
              {isLoading ? 'Generating...' : 'Generate Invite Code'}
            </Button>
            {error && (
              <p className="mt-3 text-sm text-red-600">{error}</p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Code Display */}
            <div className="bg-neutral-50 rounded-lg p-6 text-center">
              <p className="text-sm text-neutral-500 mb-2">Share this code with your parent:</p>
              <div className="flex items-center justify-center gap-3">
                <span className="text-4xl font-mono font-bold tracking-widest text-neutral-900">
                  {currentInviteCode.code}
                </span>
                <button
                  onClick={handleCopyCode}
                  className={cn(
                    'p-2 rounded-lg transition-colors',
                    copied ? 'bg-green-100 text-green-600' : 'bg-neutral-200 text-neutral-600 hover:bg-neutral-300'
                  )}
                >
                  {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                </button>
              </div>
              {copied && (
                <p className="mt-2 text-sm text-green-600">Copied to clipboard!</p>
              )}
            </div>

            {/* Expiry Warning */}
            <div className="flex items-center justify-center gap-2 text-sm text-neutral-500">
              <Clock className="w-4 h-4" />
              <span>
                Code expires in {expiresIn} hours
              </span>
            </div>

            {/* Existing Links */}
            {currentInviteCode.existingLinks > 0 && (
              <div className="flex items-center justify-center">
                <Badge variant="info" size="sm">
                  {currentInviteCode.existingLinks} parent{currentInviteCode.existingLinks > 1 ? 's' : ''} already linked
                </Badge>
              </div>
            )}

            {/* Generate New Code */}
            <div className="text-center">
              <button
                onClick={handleGenerateCode}
                disabled={isLoading}
                className="text-sm text-primary hover:underline"
              >
                {isLoading ? 'Generating...' : 'Generate new code'}
              </button>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="mt-6 flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
