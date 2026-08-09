import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import * as fabric from 'fabric';
import {
  ArrowLeft,
  Save,
  Check,
  Loader2,
  ChevronDown,
  Image as ImageIcon,
  FileDown,
  Video,
  VideoOff,
} from 'lucide-react';
import { WhiteboardCanvas, WhiteboardToolbar, RecordingControls, WebcamPreview } from '@/components/whiteboard';
import type { WhiteboardCanvasRef } from '@/components/whiteboard';
import { useWhiteboardStore } from '@/stores/whiteboardStore';
import { useAuthStore } from '@/stores/authStore';
import { useWhiteboardRecorder } from '@/hooks/useWhiteboardRecorder';
import type { WebcamSettings, RecordingSession } from '@/types/whiteboard';
import { DEFAULT_WEBCAM_SETTINGS } from '@/types/whiteboard';
import { recordingsService } from '@/lib/services';

export default function WhiteboardEditor() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const canvasRef = useRef<WhiteboardCanvasRef>(null);

  const { user } = useAuthStore();
  const {
    saveWhiteboard,
    loadWhiteboard,
    startNewWhiteboard,
    hasUnsavedChanges,
    markUnsavedChanges,
    lastSaved,
    canUndo,
    canRedo,
    undo,
    redo,
    zoom,
    setZoom,
    history,
    historyIndex,
  } = useWhiteboardStore();

  const [title, setTitle] = useState('Untitled Whiteboard');
  const [isSaving, setIsSaving] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ width: 1200, height: 800 });
  const [webcamSettings, setWebcamSettings] = useState<WebcamSettings>(DEFAULT_WEBCAM_SETTINGS);
  const [fabricCanvas, setFabricCanvas] = useState<fabric.Canvas | null>(null);
  const [, setLastRecording] = useState<RecordingSession | null>(null);

  // Recording hook
  const {
    recordingState,
    duration: recordingDuration,
    webcamStream,
    audioLevel,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    requestPermissions,
    hasAudioPermission,
    hasWebcamPermission,
    error: recordingError,
  } = useWhiteboardRecorder({
    canvas: fabricCanvas,
    enableAudio: true,
    enableWebcam: webcamSettings.enabled,
    webcamSettings,
  });

  // Load existing whiteboard or start new
  useEffect(() => {
    const loadData = async () => {
      if (id) {
        const whiteboard = await loadWhiteboard(id);
        if (whiteboard) {
          setTitle(whiteboard.title);
          // Load canvas JSON after canvas is ready
          setTimeout(() => {
            canvasRef.current?.loadFromJSON(whiteboard.canvasJSON);
          }, 100);
        }
      } else {
        startNewWhiteboard();
        setTitle('Untitled Whiteboard');
      }
    };
    loadData();
  }, [id]);

  // Calculate canvas size based on viewport
  useEffect(() => {
    const calculateSize = () => {
      const width = Math.min(window.innerWidth - 48, 1400);
      const height = Math.min(window.innerHeight - 200, 900);
      setCanvasSize({ width, height });
    };

    calculateSize();
    window.addEventListener('resize', calculateSize);
    return () => window.removeEventListener('resize', calculateSize);
  }, []);

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z' && !e.shiftKey) {
          e.preventDefault();
          handleUndo();
        } else if ((e.key === 'y') || (e.key === 'z' && e.shiftKey)) {
          e.preventDefault();
          handleRedo();
        } else if (e.key === 's') {
          e.preventDefault();
          handleSave();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSave = useCallback(async () => {
    if (!canvasRef.current || !user) return;

    setIsSaving(true);
    try {
      const canvasJSON = canvasRef.current.toJSON();
      const thumbnail = canvasRef.current.toDataURL({ format: 'png', quality: 0.5 });

      await saveWhiteboard({
        id: id || undefined,
        title,
        description: '',
        canvasJSON,
        thumbnail,
        canvasWidth: canvasSize.width,
        canvasHeight: canvasSize.height,
      });

      markUnsavedChanges(false);
    } catch (err) {
      console.error('Failed to save whiteboard:', err);
      alert('Failed to save whiteboard. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }, [id, title, user, saveWhiteboard, markUnsavedChanges, canvasSize]);

  const handleUndo = useCallback(() => {
    const state = undo();
    if (state && canvasRef.current) {
      canvasRef.current.loadFromJSON(state.json);
    }
  }, [undo]);

  const handleRedo = useCallback(() => {
    const state = redo();
    if (state && canvasRef.current) {
      canvasRef.current.loadFromJSON(state.json);
    }
  }, [redo]);

  const handleClear = useCallback(() => {
    if (window.confirm('Are you sure you want to clear the canvas? This cannot be undone.')) {
      canvasRef.current?.clear();
    }
  }, []);

  const handleExportPNG = useCallback(() => {
    if (!canvasRef.current) return;

    const dataURL = canvasRef.current.toDataURL({ format: 'png', quality: 1 });
    const link = document.createElement('a');
    link.download = `${title.replace(/[^a-z0-9]/gi, '_')}.png`;
    link.href = dataURL;
    link.click();
    setShowExportMenu(false);
  }, [title]);

  const handleExportJPEG = useCallback(() => {
    if (!canvasRef.current) return;

    const dataURL = canvasRef.current.toDataURL({ format: 'jpeg', quality: 0.9 });
    const link = document.createElement('a');
    link.download = `${title.replace(/[^a-z0-9]/gi, '_')}.jpg`;
    link.href = dataURL;
    link.click();
    setShowExportMenu(false);
  }, [title]);

  const handleZoomIn = useCallback(() => {
    setZoom(Math.min(zoom + 0.25, 3));
  }, [zoom, setZoom]);

  const handleZoomOut = useCallback(() => {
    setZoom(Math.max(zoom - 0.25, 0.25));
  }, [zoom, setZoom]);

  const handleBack = useCallback(() => {
    if (hasUnsavedChanges) {
      if (window.confirm('You have unsaved changes. Are you sure you want to leave?')) {
        navigate('/teacher/whiteboard');
      }
    } else {
      navigate('/teacher/whiteboard');
    }
  }, [hasUnsavedChanges, navigate]);

  const formatLastSaved = (dateStr: string | null) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Handle recording stop
  const handleStopRecording = useCallback(async () => {
    const session = await stopRecording();
    setLastRecording(session);

    console.log('Recording stopped:', {
      id: session.id,
      duration: session.duration,
      events: session.events.length,
      hasAudio: !!session.audioBlob,
      hasWebcam: !!session.webcamBlob,
    });

    // Save recording to API
    try {
      // 1. Create recording metadata
      const { id: recordingId } = await recordingsService.create({
        title: title || 'Untitled Recording',
        description: '',
        duration: session.duration,
        canvasWidth: canvasSize.width,
        canvasHeight: canvasSize.height,
        initialCanvasJSON: canvasRef.current?.toJSON() || undefined,
      });

      console.log('Created recording:', recordingId);

      // 2. Upload canvas events
      const eventsBlob = new Blob(
        [JSON.stringify({ events: session.events })],
        { type: 'application/json' }
      );
      await recordingsService.uploadFile(recordingId, 'events', eventsBlob, 'application/json');
      console.log('Uploaded canvas events');

      // 3. Upload audio if available
      if (session.audioBlob) {
        await recordingsService.uploadFile(recordingId, 'audio', session.audioBlob, 'audio/webm');
        console.log('Uploaded audio');
      }

      // 4. Upload webcam if available
      if (session.webcamBlob) {
        await recordingsService.uploadFile(recordingId, 'webcam', session.webcamBlob, 'video/webm');
        console.log('Uploaded webcam video');
      }

      // 5. Generate and upload thumbnail
      if (canvasRef.current) {
        const thumbnailDataUrl = canvasRef.current.toDataURL({ format: 'png', quality: 0.5 });
        const thumbnailBlob = await fetch(thumbnailDataUrl).then(r => r.blob());
        await recordingsService.uploadFile(recordingId, 'thumbnail', thumbnailBlob, 'image/png');
        console.log('Uploaded thumbnail');
      }

      console.log('Recording saved successfully:', recordingId);

      // Show success notification or navigate to recording
      alert('Recording saved successfully!');
    } catch (error) {
      console.error('Failed to save recording:', error);
      alert('Failed to save recording. Please try again.');
    }
  }, [stopRecording, title, canvasSize]);

  // Handle webcam settings change
  const handleWebcamSettingsChange = useCallback((newSettings: Partial<WebcamSettings>) => {
    setWebcamSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  // Toggle webcam
  const toggleWebcam = useCallback(() => {
    setWebcamSettings(prev => ({ ...prev, enabled: !prev.enabled }));
  }, []);

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-neutral-200 px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Left: Back & Title */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleBack}
              className="p-2 text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div className="flex flex-col">
              <input
                type="text"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  markUnsavedChanges(true);
                }}
                className="text-lg font-semibold text-neutral-900 bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-teal-500/20 rounded px-2 -ml-2"
                placeholder="Untitled Whiteboard"
              />
              <div className="flex items-center gap-2 text-xs text-neutral-500 px-2">
                {hasUnsavedChanges ? (
                  <span className="text-amber-600">Unsaved changes</span>
                ) : lastSaved ? (
                  <span className="flex items-center gap-1">
                    <Check className="w-3 h-3 text-green-500" />
                    Saved at {formatLastSaved(lastSaved)}
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-3">
            {/* Recording Controls */}
            <RecordingControls
              recordingState={recordingState}
              duration={recordingDuration}
              audioLevel={audioLevel}
              hasAudioPermission={hasAudioPermission}
              hasWebcamPermission={hasWebcamPermission}
              error={recordingError}
              onStartRecording={startRecording}
              onPauseRecording={pauseRecording}
              onResumeRecording={resumeRecording}
              onStopRecording={handleStopRecording}
              onRequestPermissions={requestPermissions}
            />

            {/* Webcam Toggle */}
            <button
              onClick={toggleWebcam}
              className={`p-2 rounded-lg transition-colors ${
                webcamSettings.enabled
                  ? 'bg-teal-100 text-teal-700 hover:bg-teal-200'
                  : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200'
              }`}
              title={webcamSettings.enabled ? 'Disable webcam' : 'Enable webcam'}
            >
              {webcamSettings.enabled ? (
                <Video className="w-5 h-5" />
              ) : (
                <VideoOff className="w-5 h-5" />
              )}
            </button>

            <div className="w-px h-8 bg-neutral-200" />

            {/* Save Button */}
            <button
              onClick={handleSave}
              disabled={isSaving || recordingState === 'recording' || recordingState === 'paused'}
              className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span className="font-medium">Save</span>
            </button>

            {/* Export Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="flex items-center gap-1 px-3 py-2 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors"
              >
                <FileDown className="w-4 h-4 text-neutral-600" />
                <span className="text-sm font-medium text-neutral-700">Export</span>
                <ChevronDown className="w-4 h-4 text-neutral-400" />
              </button>

              {showExportMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowExportMenu(false)}
                  />
                  <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-neutral-200 py-1 z-50">
                    <button
                      onClick={handleExportPNG}
                      className="w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-neutral-50 transition-colors"
                    >
                      <ImageIcon className="w-4 h-4 text-neutral-500" />
                      <div>
                        <p className="text-sm font-medium text-neutral-900">PNG Image</p>
                        <p className="text-xs text-neutral-500">High quality, transparent</p>
                      </div>
                    </button>
                    <button
                      onClick={handleExportJPEG}
                      className="w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-neutral-50 transition-colors"
                    >
                      <ImageIcon className="w-4 h-4 text-neutral-500" />
                      <div>
                        <p className="text-sm font-medium text-neutral-900">JPEG Image</p>
                        <p className="text-xs text-neutral-500">Smaller file size</p>
                      </div>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Toolbar */}
      <WhiteboardToolbar
        onUndo={handleUndo}
        onRedo={handleRedo}
        onClear={handleClear}
        onExport={handleExportPNG}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        canUndo={canUndo()}
        canRedo={canRedo()}
      />

      {/* Canvas Area */}
      <main className="flex-1 overflow-auto p-6 flex items-center justify-center relative">
        <div
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: 'center center',
            transition: 'transform 0.2s ease-out',
          }}
        >
          <WhiteboardCanvas
            ref={canvasRef}
            width={canvasSize.width}
            height={canvasSize.height}
            onObjectModified={() => markUnsavedChanges(true)}
            onCanvasReady={setFabricCanvas}
            className="shadow-lg"
          />
        </div>

        {/* Webcam Preview Overlay */}
        {webcamStream && webcamSettings.enabled && (
          <WebcamPreview
            stream={webcamStream}
            settings={webcamSettings}
            onSettingsChange={handleWebcamSettingsChange}
            onClose={toggleWebcam}
            isRecording={recordingState === 'recording'}
          />
        )}
      </main>

      {/* Status Bar */}
      <footer className="bg-white border-t border-neutral-200 px-4 py-2">
        <div className="flex items-center justify-between text-xs text-neutral-500">
          <div className="flex items-center gap-4">
            <span>Canvas: {canvasSize.width} × {canvasSize.height}px</span>
            <span>Zoom: {Math.round(zoom * 100)}%</span>
          </div>
          <div className="flex items-center gap-4">
            <span>History: {historyIndex + 1} / {history.length}</span>
            {hasUnsavedChanges && (
              <span className="text-amber-600 font-medium">● Unsaved</span>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
