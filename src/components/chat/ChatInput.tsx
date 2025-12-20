import { useState, useRef, useEffect } from 'react';
import { Send, X, Smile, Paperclip, Image, FileText, Loader2 } from 'lucide-react';
import { useChatStore } from '@/stores';
import { cn } from '@/utils';

const EMOJI_LIST = ['😀', '😂', '❤️', '👍', '🙏', '🎉', '🔥', '💯', '✨', '🤔', '😊', '👏'];

interface AttachmentPreview {
  file: File;
  preview?: string;
  type: 'image' | 'document';
}

export function ChatInput() {
  const { sendMessage, replyingTo, setReplyingTo, isSendingMessage } = useChatStore();
  const [message, setMessage] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [attachments, setAttachments] = useState<AttachmentPreview[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (replyingTo) {
      inputRef.current?.focus();
    }
  }, [replyingTo]);

  const handleSend = async () => {
    if ((!message.trim() && attachments.length === 0) || isSendingMessage || isUploading) return;

    // If there are attachments, show uploading state
    if (attachments.length > 0) {
      setIsUploading(true);
      // Simulate upload delay
      await new Promise((resolve) => setTimeout(resolve, 500));
      setIsUploading(false);
    }

    // Send message with attachment info
    const attachmentText = attachments.length > 0
      ? `\n[${attachments.map(a => a.type === 'image' ? '📷 Image' : '📄 Document').join(', ')} attached]`
      : '';

    sendMessage((message.trim() + attachmentText).trim());
    setMessage('');
    setAttachments([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const insertEmoji = (emoji: string) => {
    setMessage((prev) => prev + emoji);
    setShowEmoji(false);
    inputRef.current?.focus();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'document') => {
    const files = e.target.files;
    if (!files) return;

    const newAttachments: AttachmentPreview[] = [];

    Array.from(files).forEach((file) => {
      const attachment: AttachmentPreview = { file, type };

      if (type === 'image' && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          attachment.preview = ev.target?.result as string;
          setAttachments((prev) => [...prev, attachment]);
        };
        reader.readAsDataURL(file);
      } else {
        newAttachments.push(attachment);
      }
    });

    if (newAttachments.length > 0) {
      setAttachments((prev) => [...prev, ...newAttachments]);
    }

    setShowAttachMenu(false);
    e.target.value = '';
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="p-3 border-t border-neutral-200 shrink-0">
      {/* Reply preview */}
      {replyingTo && (
        <div className="flex items-center justify-between gap-2 mb-2 p-2 bg-neutral-100 rounded-lg">
          <div className="min-w-0">
            <p className="text-xs text-primary font-medium">
              Replying to {replyingTo.sender?.name}
            </p>
            <p className="text-xs text-neutral-500 truncate">{replyingTo.content}</p>
          </div>
          <button
            onClick={() => setReplyingTo(null)}
            className="p-1 hover:bg-neutral-200 rounded-full transition-colors"
          >
            <X className="w-4 h-4 text-neutral-500" />
          </button>
        </div>
      )}

      {/* Attachment previews */}
      {attachments.length > 0 && (
        <div className="flex gap-2 mb-2 flex-wrap">
          {attachments.map((attachment, index) => (
            <div
              key={index}
              className="relative group"
            >
              {attachment.type === 'image' && attachment.preview ? (
                <div className="w-16 h-16 rounded-lg overflow-hidden border border-neutral-200">
                  <img
                    src={attachment.preview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-16 h-16 rounded-lg bg-neutral-100 flex items-center justify-center border border-neutral-200">
                  <FileText className="w-6 h-6 text-neutral-500" />
                </div>
              )}
              <button
                onClick={() => removeAttachment(index)}
                className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input area */}
      <div className="flex items-end gap-2">
        {/* Attachment button */}
        <div className="relative">
          <button
            onClick={() => setShowAttachMenu(!showAttachMenu)}
            className="p-2 hover:bg-neutral-100 rounded-full transition-colors"
          >
            <Paperclip className="w-5 h-5 text-neutral-500" />
          </button>

          {showAttachMenu && (
            <div className="absolute bottom-full left-0 mb-2 p-2 bg-white rounded-lg shadow-lg border border-neutral-200 min-w-[140px]">
              <button
                onClick={() => imageInputRef.current?.click()}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors"
              >
                <Image className="w-4 h-4 text-green-600" />
                Photo
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors"
              >
                <FileText className="w-4 h-4 text-blue-600" />
                Document
              </button>
            </div>
          )}

          {/* Hidden file inputs */}
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => handleFileSelect(e, 'image')}
          />
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx,.txt,.xls,.xlsx"
            multiple
            className="hidden"
            onChange={(e) => handleFileSelect(e, 'document')}
          />
        </div>

        {/* Emoji picker */}
        <div className="relative">
          <button
            onClick={() => setShowEmoji(!showEmoji)}
            className="p-2 hover:bg-neutral-100 rounded-full transition-colors"
          >
            <Smile className="w-5 h-5 text-neutral-500" />
          </button>

          {showEmoji && (
            <div className="absolute bottom-full left-0 mb-2 p-2 bg-white rounded-lg shadow-lg border border-neutral-200 grid grid-cols-6 gap-1">
              {EMOJI_LIST.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => insertEmoji(emoji)}
                  className="w-8 h-8 flex items-center justify-center hover:bg-neutral-100 rounded transition-colors text-lg"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Text input */}
        <div className="flex-1 relative">
          <textarea
            ref={inputRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            rows={1}
            className={cn(
              'w-full px-4 py-2.5 bg-neutral-100 rounded-2xl resize-none',
              'text-sm placeholder:text-neutral-400',
              'focus:outline-none focus:ring-2 focus:ring-primary/20',
              'max-h-32'
            )}
            style={{
              height: 'auto',
              minHeight: '40px',
            }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = 'auto';
              target.style.height = Math.min(target.scrollHeight, 128) + 'px';
            }}
          />
        </div>

        {/* Send button */}
        <button
          onClick={handleSend}
          disabled={(!message.trim() && attachments.length === 0) || isSendingMessage || isUploading}
          className={cn(
            'p-2.5 rounded-full transition-all',
            (message.trim() || attachments.length > 0)
              ? 'bg-primary text-white hover:bg-primary-dark'
              : 'bg-neutral-100 text-neutral-400'
          )}
        >
          {isUploading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </button>
      </div>
    </div>
  );
}
