import { useState } from 'react';
import { X, Hash, Lock, BookOpen } from 'lucide-react';
import { useChatStore, useExamStore } from '@/stores';
import { cn } from '@/utils';
import type { ChatRoomType } from '@/types';

interface ChatCreateRoomProps {
  onClose: () => void;
}

export function ChatCreateRoom({ onClose }: ChatCreateRoomProps) {
  const { createRoom, setActiveRoom } = useChatStore();
  const { subjects, currentExamType } = useExamStore();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<ChatRoomType>('public');
  const [subjectId, setSubjectId] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const filteredSubjects = subjects.filter(
    (s) => s.examTypeId === `exam_${currentExamType}`
  );

  const handleCreate = async () => {
    if (!name.trim()) return;

    setIsCreating(true);
    try {
      const room = await createRoom({
        name: name.trim(),
        description: description.trim() || undefined,
        type,
        subjectId: type === 'subject' ? subjectId : undefined,
        examTypeId: `exam_${currentExamType}`,
      });
      setActiveRoom(room.id);
      onClose();
    } catch (error) {
      console.error('Failed to create room:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const roomTypes: { id: ChatRoomType; label: string; description: string; icon: React.ReactNode }[] = [
    {
      id: 'public',
      label: 'Public',
      description: 'Anyone can join and see messages',
      icon: <Hash className="w-5 h-5" />,
    },
    {
      id: 'private',
      label: 'Private',
      description: 'Invite-only, hidden from search',
      icon: <Lock className="w-5 h-5" />,
    },
    {
      id: 'subject',
      label: 'Subject Room',
      description: 'Focused on a specific subject',
      icon: <BookOpen className="w-5 h-5" />,
    },
  ];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-white rounded-xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-200">
          <h3 className="text-lg font-semibold text-neutral-900">Create Room</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-neutral-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Room name */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Room Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., WASSCE Physics Study Group"
              className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Description (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's this room about?"
              rows={2}
              className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>

          {/* Room type */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Room Type
            </label>
            <div className="space-y-2">
              {roomTypes.map((roomType) => (
                <button
                  key={roomType.id}
                  onClick={() => setType(roomType.id)}
                  className={cn(
                    'w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-colors text-left',
                    type === roomType.id
                      ? 'border-primary bg-primary/5'
                      : 'border-neutral-200 hover:border-neutral-300'
                  )}
                >
                  <div
                    className={cn(
                      'w-10 h-10 rounded-lg flex items-center justify-center',
                      type === roomType.id ? 'bg-primary text-white' : 'bg-neutral-100 text-neutral-500'
                    )}
                  >
                    {roomType.icon}
                  </div>
                  <div>
                    <p className="font-medium text-neutral-900">{roomType.label}</p>
                    <p className="text-xs text-neutral-500">{roomType.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Subject selector (for subject rooms) */}
          {type === 'subject' && (
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Subject
              </label>
              <select
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                <option value="">Select a subject</option>
                {filteredSubjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-4 border-t border-neutral-200">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 text-neutral-700 font-medium rounded-lg border border-neutral-300 hover:bg-neutral-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!name.trim() || isCreating || (type === 'subject' && !subjectId)}
            className="flex-1 py-2.5 bg-primary text-white font-medium rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCreating ? 'Creating...' : 'Create Room'}
          </button>
        </div>
      </div>
    </div>
  );
}
