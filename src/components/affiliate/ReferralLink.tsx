import { useState } from 'react';
import { Copy, Check, Share2, MessageCircle, Send } from 'lucide-react';
import { useAffiliateStore } from '@/stores/affiliateStore';

interface ReferralLinkProps {
  variant?: 'compact' | 'full';
  showShareButtons?: boolean;
}

export function ReferralLink({ variant = 'full', showShareButtons = true }: ReferralLinkProps) {
  const { profile, copyReferralLink } = useAffiliateStore();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const success = await copyReferralLink();
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const referralLink = profile?.referralLink || '';
  const referralCode = profile?.referralCode || '';

  const shareText = `Join me on Brilla - Ghana's #1 study platform for BECE, WASSCE & NSMQ prep! Get premium features free for 14 days. Use my link: ${referralLink}`;

  const shareLinks = {
    whatsapp: `https://wa.me/?text=${encodeURIComponent(shareText)}`,
    telegram: `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent('Join Brilla and start your exam prep journey!')}`,
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}`,
  };

  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-2">
        <div className="flex-1 bg-neutral-100 rounded-lg px-3 py-2 text-sm font-mono text-neutral-700 truncate">
          {referralCode}
        </div>
        <button
          onClick={handleCopy}
          className={`p-2 rounded-lg transition-colors ${
            copied
              ? 'bg-green-100 text-green-600'
              : 'bg-primary text-white hover:bg-primary-dark'
          }`}
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-card p-6">
      <div className="flex items-center gap-2 mb-4">
        <Share2 className="w-5 h-5 text-primary" />
        <h3 className="font-semibold text-neutral-900">Your Referral Link</h3>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <div className="flex-1 bg-neutral-50 border border-neutral-200 rounded-lg px-4 py-3 text-sm font-mono text-neutral-700 truncate">
          {referralLink}
        </div>
        <button
          onClick={handleCopy}
          className={`px-4 py-3 rounded-lg font-medium transition-all flex items-center gap-2 ${
            copied
              ? 'bg-green-100 text-green-600'
              : 'bg-primary text-white hover:bg-primary-dark'
          }`}
        >
          {copied ? (
            <>
              <Check className="w-4 h-4" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              Copy
            </>
          )}
        </button>
      </div>

      {showShareButtons && (
        <>
          <p className="text-sm text-neutral-500 mb-3">Share directly:</p>
          <div className="flex gap-2">
            <a
              href={shareLinks.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-2 px-4 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
            >
              <MessageCircle className="w-4 h-4" />
              WhatsApp
            </a>
            <a
              href={shareLinks.telegram}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-2 px-4 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              Telegram
            </a>
          </div>
        </>
      )}

      <div className="mt-4 pt-4 border-t border-neutral-100">
        <div className="flex items-center justify-between text-sm">
          <span className="text-neutral-500">Your referral code:</span>
          <span className="font-mono font-semibold text-primary">{referralCode}</span>
        </div>
      </div>
    </div>
  );
}

export default ReferralLink;
