import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Share2,
  Clock,
  Calendar,
  User,
  Loader2,
  AlertCircle,
  Copy,
  Check,
} from 'lucide-react';
import { RecordingPlayer } from '@/components/whiteboard';
import type { WhiteboardRecording } from '@/types/whiteboard';
import { recordingsService, toWhiteboardRecording } from '@/lib/services';

// Fetch recording from API
async function fetchRecording(id: string): Promise<WhiteboardRecording | null> {
  try {
    const data = await recordingsService.get(id);
    if (!data || !data.id) {
      return null;
    }
    return toWhiteboardRecording(data);
  } catch (error) {
    console.error('Failed to fetch recording:', error);
    return null;
  }
}

export default function RecordingViewer() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [recording, setRecording] = useState<WhiteboardRecording | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (id) {
      loadRecording(id);
    }
  }, [id]);

  const loadRecording = async (recordingId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await fetchRecording(recordingId);
      if (data) {
        setRecording(data);
      } else {
        setError('Recording not found');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load recording');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDuration = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleCopyLink = async () => {
    const shareUrl = window.location.href;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleBack = () => {
    navigate('/teacher/whiteboard');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-teal-600 animate-spin mx-auto mb-4" />
          <p className="text-neutral-600">Loading recording...</p>
        </div>
      </div>
    );
  }

  if (error || !recording) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-neutral-900 mb-2">
            {error || 'Recording not found'}
          </h2>
          <p className="text-neutral-600 mb-6">
            The recording you're looking for might have been deleted or moved.
          </p>
          <button
            onClick={handleBack}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
          >
            Back to Whiteboards
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-900">
      {/* Header */}
      <header className="bg-neutral-800 border-b border-neutral-700 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBack}
              className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-700 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div>
              <h1 className="text-lg font-semibold text-white">{recording.title}</h1>
              <div className="flex items-center gap-4 text-sm text-neutral-400">
                {recording.teacherName && (
                  <span className="flex items-center gap-1">
                    <User className="w-4 h-4" />
                    {recording.teacherName}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {formatDate(recording.createdAt)}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {formatDuration(recording.duration)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowShareModal(true)}
              className="flex items-center gap-2 px-3 py-2 text-neutral-300 hover:text-white hover:bg-neutral-700 rounded-lg transition-colors"
            >
              <Share2 className="w-4 h-4" />
              <span className="hidden sm:inline">Share</span>
            </button>
          </div>
        </div>
      </header>

      {/* Player */}
      <main className="max-w-7xl mx-auto p-4 lg:p-8">
        <RecordingPlayer
          recording={recording}
          className="w-full aspect-video"
          autoPlay={false}
        />

        {/* Description */}
        {recording.description && (
          <div className="mt-6 bg-neutral-800 rounded-lg p-4">
            <h3 className="text-sm font-medium text-neutral-300 mb-2">Description</h3>
            <p className="text-neutral-400">{recording.description}</p>
          </div>
        )}
      </main>

      {/* Share Modal */}
      {showShareModal && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setShowShareModal(false)}
          />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-xl shadow-xl z-50 p-6">
            <h3 className="text-lg font-semibold text-neutral-900 mb-4">Share Recording</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Share link
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={window.location.href}
                    readOnly
                    className="flex-1 px-3 py-2 bg-neutral-100 border border-neutral-200 rounded-lg text-sm text-neutral-600"
                  />
                  <button
                    onClick={handleCopyLink}
                    className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copy
                      </>
                    )}
                  </button>
                </div>
              </div>

              <p className="text-sm text-neutral-500">
                Anyone with this link can view the recording.
              </p>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowShareModal(false)}
                className="px-4 py-2 text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
