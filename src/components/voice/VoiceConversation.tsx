import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Loader2,
  AudioWaveform,
  Phone,
  PhoneOff,
  Settings,
} from 'lucide-react';
import { cn } from '@/utils';

// Types for Web Speech API
interface CustomSpeechRecognitionEvent {
  results: CustomSpeechRecognitionResultList;
  resultIndex: number;
}

interface CustomSpeechRecognitionResultList {
  length: number;
  item(index: number): CustomSpeechRecognitionResult;
  [index: number]: CustomSpeechRecognitionResult;
}

interface CustomSpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): CustomSpeechRecognitionAlternative;
  [index: number]: CustomSpeechRecognitionAlternative;
}

interface CustomSpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface CustomSpeechRecognition {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: CustomSpeechRecognitionEvent) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}

// Use any for the window speech recognition to avoid type conflicts
type SpeechRecognitionConstructor = new () => CustomSpeechRecognition;

interface VoiceConversationProps {
  onTranscript: (text: string, isFinal: boolean) => void;
  onSendMessage: (text: string) => Promise<string>;
  isProcessing?: boolean;
  disabled?: boolean;
  className?: string;
  mode?: 'floating' | 'inline' | 'minimal';
  autoSpeak?: boolean;
  voiceSettings?: {
    rate?: number;
    pitch?: number;
    volume?: number;
    voiceIndex?: number;
  };
}

export function VoiceConversation({
  onTranscript,
  onSendMessage,
  isProcessing = false,
  disabled = false,
  className,
  mode = 'floating',
  autoSpeak = true,
  voiceSettings = {},
}: VoiceConversationProps) {
  // State
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  // Refs
  const recognitionRef = useRef<CustomSpeechRecognition | null>(null);
  const synthRef = useRef<SpeechSynthesisUtterance | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Default voice settings
  const { rate = 1, pitch = 1, volume = 1 } = voiceSettings;

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
      setError('Speech recognition is not supported in this browser');
      return;
    }

    const recognition = new (SpeechRecognitionAPI as SpeechRecognitionConstructor)();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: CustomSpeechRecognitionEvent) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          final += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }

      if (final) {
        setTranscript(prev => prev + final);
        onTranscript(final, true);
      }
      setInterimTranscript(interim);
      if (interim) {
        onTranscript(interim, false);
      }
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      if (event.error !== 'no-speech' && event.error !== 'aborted') {
        setError(`Speech recognition error: ${event.error}`);
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      // Auto-restart if still in voice mode
      if (isVoiceMode && !isSpeaking) {
        try {
          recognition.start();
          setIsListening(true);
        } catch {
          // Ignore if already started
        }
      }
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.abort();
    };
  }, [isVoiceMode, isSpeaking, onTranscript]);

  // Load available voices
  useEffect(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      // Prefer English voices
      const englishVoices = voices.filter(v => v.lang.startsWith('en'));
      setAvailableVoices(englishVoices.length > 0 ? englishVoices : voices);

      // Select default voice
      if (voices.length > 0) {
        const defaultVoice = englishVoices.find(v => v.default) || englishVoices[0] || voices[0];
        setSelectedVoice(defaultVoice);
      }
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  // Audio level visualization
  const startAudioVisualization = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      analyserRef.current.fftSize = 256;

      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);

      const updateLevel = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
        setAudioLevel(average / 255);
        animationFrameRef.current = requestAnimationFrame(updateLevel);
      };

      updateLevel();
    } catch (err) {
      console.error('Failed to get audio stream:', err);
    }
  }, []);

  const stopAudioVisualization = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    setAudioLevel(0);
  }, []);

  // Start listening
  const startListening = useCallback(() => {
    if (!recognitionRef.current || disabled) return;

    setError(null);
    setTranscript('');
    setInterimTranscript('');

    try {
      recognitionRef.current.start();
      setIsListening(true);
      startAudioVisualization();
    } catch (err) {
      console.error('Failed to start recognition:', err);
    }
  }, [disabled, startAudioVisualization]);

  // Stop listening
  const stopListening = useCallback(() => {
    if (!recognitionRef.current) return;

    recognitionRef.current.stop();
    setIsListening(false);
    stopAudioVisualization();
  }, [stopAudioVisualization]);

  // Speak text using TTS
  const speak = useCallback((text: string) => {
    if (isMuted || !text || typeof window === 'undefined' || !window.speechSynthesis) return;

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.volume = volume;

    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    utterance.onstart = () => {
      setIsSpeaking(true);
      // Pause listening while speaking to avoid feedback
      if (recognitionRef.current && isListening) {
        recognitionRef.current.stop();
      }
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      // Resume listening if in voice mode
      if (isVoiceMode && recognitionRef.current) {
        try {
          recognitionRef.current.start();
          setIsListening(true);
        } catch {
          // Ignore
        }
      }
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
    };

    synthRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [isMuted, rate, pitch, volume, selectedVoice, isListening, isVoiceMode]);

  // Stop speaking
  const stopSpeaking = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, []);

  // Toggle voice mode (continuous conversation)
  const toggleVoiceMode = useCallback(() => {
    if (isVoiceMode) {
      setIsVoiceMode(false);
      stopListening();
      stopSpeaking();
    } else {
      setIsVoiceMode(true);
      startListening();
    }
  }, [isVoiceMode, startListening, stopListening, stopSpeaking]);

  // Send the current transcript
  const sendTranscript = useCallback(async () => {
    const textToSend = transcript.trim();
    if (!textToSend) return;

    stopListening();
    setTranscript('');
    setInterimTranscript('');

    try {
      const response = await onSendMessage(textToSend);
      if (autoSpeak && response) {
        speak(response);
      }
    } catch (err) {
      console.error('Failed to send message:', err);
      setError('Failed to send message');
    }
  }, [transcript, stopListening, onSendMessage, autoSpeak, speak]);

  // Toggle mute
  const toggleMute = useCallback(() => {
    setIsMuted(prev => !prev);
    if (!isMuted) {
      stopSpeaking();
    }
  }, [isMuted, stopSpeaking]);

  // Render based on mode
  if (mode === 'minimal') {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <button
          onClick={isListening ? stopListening : startListening}
          disabled={disabled || isProcessing}
          className={cn(
            "p-2 rounded-full transition-all",
            isListening
              ? "bg-red-500 text-white animate-pulse"
              : "bg-violet-500/20 text-violet-400 hover:bg-violet-500/30"
          )}
        >
          {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>

        <button
          onClick={toggleMute}
          className={cn(
            "p-2 rounded-full transition-all",
            isMuted
              ? "bg-slate-700 text-slate-400"
              : "bg-violet-500/20 text-violet-400 hover:bg-violet-500/30"
          )}
        >
          {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </button>
      </div>
    );
  }

  if (mode === 'inline') {
    return (
      <div className={cn("flex items-center gap-3 p-3 glass rounded-xl border border-white/10", className)}>
        {/* Voice Mode Toggle */}
        <button
          onClick={toggleVoiceMode}
          disabled={disabled}
          className={cn(
            "p-3 rounded-full transition-all",
            isVoiceMode
              ? "bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-500/30"
              : "bg-slate-800 text-slate-400 hover:bg-slate-700"
          )}
        >
          {isVoiceMode ? <PhoneOff className="w-5 h-5" /> : <Phone className="w-5 h-5" />}
        </button>

        {/* Status & Transcript */}
        <div className="flex-1 min-w-0">
          {isVoiceMode ? (
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                {isListening && (
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className="w-1 bg-violet-500 rounded-full animate-pulse"
                        style={{
                          height: `${Math.max(8, audioLevel * 24 + Math.random() * 8)}px`,
                          animationDelay: `${i * 100}ms`
                        }}
                      />
                    ))}
                  </div>
                )}
                <span className="text-xs text-violet-400">
                  {isSpeaking ? 'AI is speaking...' : isListening ? 'Listening...' : 'Voice mode active'}
                </span>
              </div>
              {(transcript || interimTranscript) && (
                <p className="text-sm text-white/80 truncate">
                  {transcript}
                  <span className="text-white/40">{interimTranscript}</span>
                </p>
              )}
            </div>
          ) : (
            <span className="text-sm text-slate-400">Click to start voice conversation</span>
          )}
        </div>

        {/* Mute Toggle */}
        <button
          onClick={toggleMute}
          className={cn(
            "p-2 rounded-lg transition-all",
            isMuted ? "bg-red-500/20 text-red-400" : "bg-slate-800 text-slate-400 hover:bg-slate-700"
          )}
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>
      </div>
    );
  }

  // Floating mode (default)
  return (
    <div className={cn(
      "fixed bottom-24 right-6 z-50",
      className
    )}>
      {/* Settings Panel */}
      {showSettings && (
        <div className="absolute bottom-full right-0 mb-2 p-4 glass rounded-xl border border-white/10 w-72 shadow-2xl">
          <h4 className="font-medium text-white mb-3">Voice Settings</h4>

          {/* Voice Selection */}
          <div className="space-y-2 mb-3">
            <label className="text-xs text-white/60">Voice</label>
            <select
              value={availableVoices.indexOf(selectedVoice!)}
              onChange={(e) => setSelectedVoice(availableVoices[parseInt(e.target.value)])}
              className="w-full px-3 py-2 bg-slate-800 rounded-lg text-white text-sm border border-white/10"
            >
              {availableVoices.map((voice, i) => (
                <option key={i} value={i}>{voice.name}</option>
              ))}
            </select>
          </div>

          {/* Auto-speak toggle */}
          <label className="flex items-center justify-between">
            <span className="text-sm text-white/80">Auto-speak responses</span>
            <input
              type="checkbox"
              checked={autoSpeak}
              readOnly
              className="w-4 h-4 rounded accent-violet-500"
            />
          </label>
        </div>
      )}

      {/* Expanded view when in voice mode */}
      {isVoiceMode && (
        <div className="absolute bottom-full right-0 mb-2 p-4 glass rounded-2xl border border-violet-400/30 w-80 shadow-2xl">
          {/* Visualizer */}
          <div className="flex items-center justify-center h-16 mb-3">
            {isListening ? (
              <div className="flex items-end gap-1 h-full">
                {[...Array(12)].map((_, i) => (
                  <div
                    key={i}
                    className="w-2 bg-gradient-to-t from-violet-500 to-purple-400 rounded-full transition-all duration-75"
                    style={{
                      height: `${Math.max(12, audioLevel * 64 + Math.sin(Date.now() / 200 + i) * 12)}px`
                    }}
                  />
                ))}
              </div>
            ) : isSpeaking ? (
              <div className="flex items-center gap-2">
                <AudioWaveform className="w-8 h-8 text-violet-400 animate-pulse" />
                <span className="text-violet-300">AI is speaking...</span>
              </div>
            ) : isProcessing ? (
              <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
            ) : (
              <div className="text-center text-white/60">
                <Mic className="w-8 h-8 mx-auto mb-1 text-violet-400" />
                <span className="text-sm">Ready to listen</span>
              </div>
            )}
          </div>

          {/* Transcript */}
          <div className="min-h-[60px] max-h-32 overflow-y-auto mb-3 p-3 bg-slate-900/50 rounded-lg">
            {transcript || interimTranscript ? (
              <p className="text-sm text-white">
                {transcript}
                <span className="text-white/50">{interimTranscript}</span>
              </p>
            ) : (
              <p className="text-sm text-white/40 italic">
                {isListening ? 'Speak now...' : 'Your words will appear here'}
              </p>
            )}
          </div>

          {/* Send button */}
          {transcript && (
            <button
              onClick={sendTranscript}
              disabled={isProcessing}
              className="w-full py-2 bg-violet-500 hover:bg-violet-400 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {isProcessing ? 'Sending...' : 'Send Message'}
            </button>
          )}

          {/* Error message */}
          {error && (
            <p className="text-xs text-red-400 mt-2">{error}</p>
          )}
        </div>
      )}

      {/* Main floating button */}
      <div className="flex items-center gap-2">
        {/* Settings */}
        <button
          onClick={() => setShowSettings(!showSettings)}
          className={cn(
            "p-2 rounded-full transition-all",
            showSettings
              ? "bg-violet-500 text-white"
              : "bg-slate-800/80 text-slate-400 hover:bg-slate-700"
          )}
        >
          <Settings className="w-4 h-4" />
        </button>

        {/* Mute */}
        <button
          onClick={toggleMute}
          className={cn(
            "p-2 rounded-full transition-all",
            isMuted
              ? "bg-red-500/20 text-red-400"
              : "bg-slate-800/80 text-slate-400 hover:bg-slate-700"
          )}
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>

        {/* Main voice button */}
        <button
          onClick={toggleVoiceMode}
          disabled={disabled}
          className={cn(
            "p-4 rounded-full transition-all shadow-lg",
            isVoiceMode
              ? "bg-gradient-to-r from-red-500 to-pink-600 text-white shadow-red-500/30 hover:shadow-red-500/50"
              : "bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-violet-500/30 hover:shadow-violet-500/50 hover:scale-105"
          )}
        >
          {isVoiceMode ? (
            <PhoneOff className="w-6 h-6" />
          ) : (
            <Mic className="w-6 h-6" />
          )}
        </button>
      </div>

      {/* Status indicator */}
      {isVoiceMode && (
        <div className="absolute -top-1 -right-1">
          <div className={cn(
            "w-3 h-3 rounded-full",
            isListening ? "bg-green-500 animate-pulse" :
            isSpeaking ? "bg-violet-500 animate-pulse" :
            "bg-amber-500"
          )} />
        </div>
      )}
    </div>
  );
}

export default VoiceConversation;
