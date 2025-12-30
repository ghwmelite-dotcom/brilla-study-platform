import { useState, useRef, useEffect, useMemo } from 'react';
import { X, Send, Sparkles, BookOpen, Lightbulb, GraduationCap, FileText, PenTool, Calculator, Heart, Paperclip, XCircle } from 'lucide-react';
import { useAiTutorStore, useAuthStore, useExamStore } from '@/stores';
import { AiMessage } from './AiMessage';
import { ThinkingIndicator } from './ThinkingIndicator';

// Allowed file types
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const ALLOWED_DOC_TYPES = ['application/pdf'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// Exam-specific configurations
const examConfigs = {
  nsmq: {
    name: 'NSMQ',
    subtitle: 'Science & Maths Quiz prep',
    welcomeMessage: "I'm here to help you prepare for NSMQ. Ask me anything about Maths, Physics, Chemistry, or Biology!",
    quickActions: [
      { label: 'Explain a concept', icon: BookOpen, prompt: 'Can you explain ' },
      { label: 'Speed problem tips', icon: Lightbulb, prompt: 'How can I solve faster: ' },
      { label: 'Formula help', icon: GraduationCap, prompt: 'Help me understand the formula for ' },
      { label: 'Mental math tricks', icon: Calculator, prompt: 'What are mental math tricks for ' },
    ],
  },
  wassce: {
    name: 'WASSCE',
    subtitle: 'West African SSS exam prep',
    welcomeMessage: "I'm here to help you excel in WASSCE. Ask me about any subject - Core Maths, English, Sciences, Business, Arts, and more!",
    quickActions: [
      { label: 'Explain a topic', icon: BookOpen, prompt: 'Can you explain ' },
      { label: 'Essay writing help', icon: PenTool, prompt: 'Help me write an essay on ' },
      { label: 'Past paper question', icon: FileText, prompt: 'How do I answer this WASSCE question: ' },
      { label: 'Study tips', icon: Lightbulb, prompt: 'What are tips for studying ' },
    ],
  },
  bece: {
    name: 'BECE',
    subtitle: 'Basic Education exam prep',
    welcomeMessage: "I'm here to help you prepare for BECE. Ask me about Maths, English, Integrated Science, Social Studies, and more!",
    quickActions: [
      { label: 'Explain a concept', icon: BookOpen, prompt: 'Can you explain in simple terms ' },
      { label: 'Help with homework', icon: GraduationCap, prompt: 'Can you help me understand ' },
      { label: 'Practice questions', icon: FileText, prompt: 'Give me practice questions on ' },
      { label: 'Study tips', icon: Lightbulb, prompt: 'How should I study for ' },
    ],
  },
};

export function AiTutor() {
  const { user } = useAuthStore();
  const { currentExamType } = useExamStore();
  const {
    isOpen,
    messages,
    isLoading,
    thinkingStage,
    error,
    closeChat,
    sendMessage,
    clearMessages,
    clearError,
    setUserPersonalization,
    markMessageAsOld,
  } = useAiTutorStore();

  const [inputMessage, setInputMessage] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get exam-specific config
  const examConfig = useMemo(() => {
    return examConfigs[currentExamType] || examConfigs.nsmq;
  }, [currentExamType]);

  // Initialize user personalization when component mounts or user changes
  useEffect(() => {
    if (user?.name) {
      setUserPersonalization({
        name: user.name,
        preferredName: user.name.split(' ')[0], // Use first name
      });
    }
  }, [user?.name, setUserPersonalization]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, thinkingStage]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  const handleSend = async () => {
    if ((!inputMessage.trim() && selectedFiles.length === 0) || !user || isLoading) return;

    const message = inputMessage.trim() || (selectedFiles.length > 0 ? 'Please analyze this file and help me understand it.' : '');
    setInputMessage('');
    const filesToSend = [...selectedFiles];
    setSelectedFiles([]);
    setFileError(null);

    // Include exam context and user name in the message
    await sendMessage(`[${examConfig.name} Mode] ${message}`, user.id, user.name, filesToSend.length > 0 ? filesToSend : undefined);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleQuickAction = (prompt: string) => {
    setInputMessage(prompt);
    inputRef.current?.focus();
  };

  const handleTypingComplete = (messageId: string) => {
    markMessageAsOld(messageId);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setFileError(null);
    const newFiles: File[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Validate file type
      if (!ALLOWED_IMAGE_TYPES.includes(file.type) && !ALLOWED_DOC_TYPES.includes(file.type)) {
        setFileError(`"${file.name}" is not supported. Please upload images (JPG, PNG, GIF) or PDF files.`);
        continue;
      }

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        setFileError(`"${file.name}" is too large. Maximum file size is 10MB.`);
        continue;
      }

      newFiles.push(file);
    }

    // Limit to 3 files
    const totalFiles = [...selectedFiles, ...newFiles].slice(0, 3);
    setSelectedFiles(totalFiles);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setFileError(null);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Get user's first name for personalized greeting
  const firstName = user?.name?.split(' ')[0] || 'there';

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 z-[55] lg:hidden"
        onClick={closeChat}
      />

      {/* Chat panel */}
      <div className="fixed inset-x-0 bottom-0 top-0 sm:top-auto sm:inset-x-auto sm:bottom-4 sm:right-4 sm:left-auto w-full sm:w-96 sm:h-[min(600px,calc(100vh-2rem))] bg-white sm:rounded-xl shadow-2xl z-[60] flex flex-col max-h-[100dvh] sm:max-h-none overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-3 sm:p-4 border-b border-neutral-200 bg-gradient-to-r from-primary to-accent sm:rounded-t-xl shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-white/20 rounded-full flex items-center justify-center">
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              {/* Online indicator */}
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-white" />
            </div>
            <div className="text-white">
              <h3 className="font-semibold text-sm sm:text-base">Brilla AI</h3>
              <p className="text-xs text-white/80 flex items-center gap-1">
                <Heart className="w-3 h-3 fill-current" />
                Your personal tutor
              </p>
            </div>
          </div>
          <button
            onClick={closeChat}
            className="p-2 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center pt-6">
              {/* Personalized greeting */}
              <div className="relative inline-block mb-4">
                <Sparkles className="w-14 h-14 mx-auto text-primary/30" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl">👋</span>
                </div>
              </div>
              <h4 className="font-semibold text-neutral-900 mb-1 text-lg">
                Hey {firstName}!
              </h4>
              <p className="text-sm text-neutral-600 mb-2">
                I'm Brilla AI, your personal study companion.
              </p>
              <p className="text-sm text-neutral-500 mb-6">
                {examConfig.welcomeMessage}
              </p>

              {/* Quick actions */}
              <div className="space-y-2">
                <p className="text-xs text-neutral-400 uppercase tracking-wide mb-2">
                  Quick actions
                </p>
                {examConfig.quickActions.map((action, i) => (
                  <button
                    key={i}
                    onClick={() => handleQuickAction(action.prompt)}
                    className="flex items-center gap-3 w-full p-3 bg-gradient-to-r from-neutral-50 to-neutral-100/50 hover:from-primary/5 hover:to-accent/5 rounded-xl transition-all duration-200 text-left group border border-transparent hover:border-primary/10"
                  >
                    <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
                      <action.icon className="w-4 h-4 text-primary" />
                    </div>
                    <span className="text-sm text-neutral-700 group-hover:text-neutral-900">{action.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <AiMessage
                  key={message.id}
                  message={message}
                  isNew={message.isNew}
                  onTypingComplete={() => handleTypingComplete(message.id)}
                />
              ))}

              {/* Thinking indicator */}
              {isLoading && thinkingStage !== 'idle' && thinkingStage !== 'typing' && (
                <ThinkingIndicator stage={thinkingStage} />
              )}

              <div ref={messagesEndRef} />
            </>
          )}

          {/* Error message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg animate-fadeIn">
              <p className="text-sm text-red-600">{error}</p>
              <button
                onClick={clearError}
                className="text-xs text-red-500 underline mt-1"
              >
                Dismiss
              </button>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="p-4 border-t border-neutral-200 bg-neutral-50/50">
          {/* File preview */}
          {selectedFiles.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {selectedFiles.map((file, index) => (
                <div
                  key={`${file.name}-${index}`}
                  className="relative group flex items-center gap-2 px-3 py-2 bg-white border border-neutral-200 rounded-lg"
                >
                  {file.type.startsWith('image/') ? (
                    <div className="w-8 h-8 rounded overflow-hidden bg-neutral-100 flex-shrink-0">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={file.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded bg-red-50 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-4 h-4 text-red-500" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-neutral-700 truncate max-w-[100px]">
                      {file.name}
                    </p>
                    <p className="text-xs text-neutral-400">{formatFileSize(file.size)}</p>
                  </div>
                  <button
                    onClick={() => removeFile(index)}
                    className="p-1 hover:bg-neutral-100 rounded-full transition-colors"
                    title="Remove file"
                  >
                    <XCircle className="w-4 h-4 text-neutral-400 hover:text-red-500" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* File error */}
          {fileError && (
            <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-xs text-red-600">{fileError}</p>
            </div>
          )}

          <div className="flex gap-2">
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp,application/pdf"
              onChange={handleFileSelect}
              multiple
              className="hidden"
            />

            {/* File upload button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading || selectedFiles.length >= 3}
              className="p-3 bg-white border border-neutral-200 text-neutral-600 rounded-xl hover:bg-neutral-50 hover:border-neutral-300 transition-all duration-200 disabled:opacity-50 disabled:hover:bg-white disabled:hover:border-neutral-200"
              title="Upload image or PDF (max 3 files, 10MB each)"
            >
              <Paperclip className="w-5 h-5" />
            </button>

            <input
              ref={inputRef}
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={selectedFiles.length > 0 ? 'Add a message or send file...' : `Ask me anything, ${firstName}...`}
              disabled={isLoading}
              className="flex-1 px-4 py-3 bg-white border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 disabled:opacity-50 transition-all duration-200"
            />
            <button
              onClick={handleSend}
              disabled={(!inputMessage.trim() && selectedFiles.length === 0) || isLoading}
              className="p-3 bg-gradient-to-r from-primary to-accent text-white rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:hover:scale-100 disabled:hover:shadow-none"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>

          {/* Helper text */}
          <div className="flex items-center justify-between mt-2">
            <p className="text-xs text-neutral-400">
              📎 Upload photos of homework, diagrams, or PDFs
            </p>
            {messages.length > 0 && (
              <button
                onClick={clearMessages}
                className="text-xs text-neutral-400 hover:text-neutral-600 transition-colors"
              >
                Start fresh
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Global styles for animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </>
  );
}
