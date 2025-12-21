import { useEffect, useState } from 'react';
import {
  Users,
  UserMinus,
  UserPlus,
  Search,
  Loader2,
  Mail,
  GraduationCap,
  X,
} from 'lucide-react';
import { api } from '@/lib/api';
import type { ClassMember } from '@/types';
import { cn } from '@/utils';

interface ClassMemberListProps {
  classId: string;
  onRemoveMember: (memberId: string) => Promise<void>;
  onAddStudents: () => void;
}

export function ClassMemberList({
  classId,
  onRemoveMember,
  onAddStudents,
}: ClassMemberListProps) {
  const [members, setMembers] = useState<ClassMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    const loadMembers = async () => {
      setIsLoading(true);
      try {
        const response = await api.get<{ members: ClassMember[] }>(
          `/classes/${classId}/members`
        );
        if (response.success && response.data) {
          setMembers(response.data.members);
        }
      } catch (error) {
        console.error('Failed to load members:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadMembers();
  }, [classId]);

  const handleRemove = async (memberId: string) => {
    setRemovingId(memberId);
    try {
      await onRemoveMember(memberId);
      setMembers(members.filter((m) => m.id !== memberId));
    } catch (error) {
      console.error('Failed to remove member:', error);
    } finally {
      setRemovingId(null);
    }
  };

  const filteredMembers = members.filter((m) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      m.student?.name.toLowerCase().includes(query) ||
      m.student?.email.toLowerCase().includes(query)
    );
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 text-emerald-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search & Add */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            placeholder="Search students..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <button
          onClick={onAddStudents}
          className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium"
        >
          <UserPlus className="w-4 h-4" />
          Add
        </button>
      </div>

      {/* Members List */}
      {filteredMembers.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Users className="w-6 h-6 text-neutral-400" />
          </div>
          <p className="text-neutral-500 text-sm">
            {searchQuery
              ? 'No students match your search'
              : 'No students in this class yet'}
          </p>
          {!searchQuery && (
            <button
              onClick={onAddStudents}
              className="mt-3 text-sm text-emerald-600 hover:text-emerald-700 font-medium"
            >
              Add students now
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {filteredMembers.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg hover:bg-neutral-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center">
                  <GraduationCap className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-neutral-900 text-sm">
                    {member.student?.name || 'Unknown Student'}
                  </p>
                  <p className="text-xs text-neutral-500 flex items-center gap-1">
                    <Mail className="w-3 h-3" />
                    {member.student?.email || 'No email'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => handleRemove(member.id)}
                disabled={removingId === member.id}
                className="p-1.5 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                title="Remove from class"
              >
                {removingId === member.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <UserMinus className="w-4 h-4" />
                )}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Count */}
      {filteredMembers.length > 0 && (
        <p className="text-xs text-neutral-500 text-center pt-2">
          {filteredMembers.length} student{filteredMembers.length !== 1 ? 's' : ''} in class
        </p>
      )}
    </div>
  );
}
