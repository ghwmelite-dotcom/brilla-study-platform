import { useEffect, useState } from 'react';
import {
  Search,
  Loader2,
  Check,
  Users,
  GraduationCap,
  Mail,
  X,
} from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/utils';

interface Student {
  id: string;
  name: string;
  email: string;
  schoolLevel?: string;
  yearGroup?: number;
}

interface AddStudentsModalProps {
  classId: string;
  onAdd: (studentIds: string[]) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function AddStudentsModal({
  classId,
  onAdd,
  onCancel,
  isLoading = false,
}: AddStudentsModalProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [isFetching, setIsFetching] = useState(true);

  useEffect(() => {
    const loadStudents = async () => {
      setIsFetching(true);
      try {
        // Load students not in this class
        const response = await api.get<{ students: Student[] }>(
          `/students/search?excludeClass=${classId}`
        );
        if (response.success && response.data) {
          setStudents(response.data.students);
        }
      } catch (error) {
        console.error('Failed to load students:', error);
      } finally {
        setIsFetching(false);
      }
    };

    loadStudents();
  }, [classId]);

  const filteredStudents = students.filter((s) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      s.name.toLowerCase().includes(query) ||
      s.email.toLowerCase().includes(query)
    );
  });

  const toggleStudent = (studentId: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(studentId)) {
      newSelected.delete(studentId);
    } else {
      newSelected.add(studentId);
    }
    setSelectedIds(newSelected);
  };

  const selectAll = () => {
    const allIds = new Set(filteredStudents.map((s) => s.id));
    setSelectedIds(allIds);
  };

  const deselectAll = () => {
    setSelectedIds(new Set());
  };

  const handleSubmit = async () => {
    if (selectedIds.size === 0) return;
    await onAdd(Array.from(selectedIds));
  };

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
        <input
          type="text"
          placeholder="Search students by name or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          disabled={isLoading}
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

      {/* Selection Actions */}
      {filteredStudents.length > 0 && (
        <div className="flex items-center justify-between text-sm">
          <p className="text-neutral-600">
            {selectedIds.size} of {filteredStudents.length} selected
          </p>
          <div className="flex gap-2">
            <button
              onClick={selectAll}
              className="text-emerald-600 hover:text-emerald-700 font-medium"
              disabled={isLoading}
            >
              Select All
            </button>
            {selectedIds.size > 0 && (
              <button
                onClick={deselectAll}
                className="text-neutral-500 hover:text-neutral-700"
                disabled={isLoading}
              >
                Clear
              </button>
            )}
          </div>
        </div>
      )}

      {/* Students List */}
      {isFetching ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 text-emerald-600 animate-spin" />
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Users className="w-6 h-6 text-neutral-400" />
          </div>
          <p className="text-neutral-500 text-sm">
            {searchQuery
              ? 'No students match your search'
              : 'All students are already in this class'}
          </p>
        </div>
      ) : (
        <div className="space-y-2 max-h-[300px] overflow-y-auto">
          {filteredStudents.map((student) => {
            const isSelected = selectedIds.has(student.id);
            return (
              <button
                key={student.id}
                onClick={() => toggleStudent(student.id)}
                disabled={isLoading}
                className={cn(
                  'w-full flex items-center justify-between p-3 rounded-lg border transition-colors text-left',
                  isSelected
                    ? 'bg-emerald-50 border-emerald-200'
                    : 'bg-white border-neutral-200 hover:border-neutral-300'
                )}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'w-9 h-9 rounded-full flex items-center justify-center',
                      isSelected ? 'bg-emerald-100' : 'bg-blue-100'
                    )}
                  >
                    <GraduationCap
                      className={cn(
                        'w-4 h-4',
                        isSelected ? 'text-emerald-600' : 'text-blue-600'
                      )}
                    />
                  </div>
                  <div>
                    <p className="font-medium text-neutral-900 text-sm">
                      {student.name}
                    </p>
                    <p className="text-xs text-neutral-500 flex items-center gap-1">
                      <Mail className="w-3 h-3" />
                      {student.email}
                    </p>
                  </div>
                </div>

                <div
                  className={cn(
                    'w-5 h-5 rounded border-2 flex items-center justify-center transition-colors',
                    isSelected
                      ? 'bg-emerald-500 border-emerald-500'
                      : 'border-neutral-300'
                  )}
                >
                  {isSelected && <Check className="w-3 h-3 text-white" />}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-100">
        <button
          onClick={onCancel}
          disabled={isLoading}
          className="px-4 py-2.5 text-neutral-700 bg-neutral-100 rounded-lg hover:bg-neutral-200 transition-colors font-medium disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={isLoading || selectedIds.size === 0}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Adding...
            </>
          ) : (
            <>
              Add {selectedIds.size > 0 ? `${selectedIds.size} ` : ''}Student
              {selectedIds.size !== 1 ? 's' : ''}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
