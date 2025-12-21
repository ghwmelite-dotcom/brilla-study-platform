import { useState, useEffect } from 'react';
import {
  Users,
  User,
  GraduationCap,
  BookOpen,
  Search,
  Check,
  X,
  Loader2,
  ChevronDown,
} from 'lucide-react';
import type { AssessmentDraft, AssessmentAssignmentDraft, StudentClass } from '@/types';
import { useAssessmentStore } from '@/stores/assessmentStore';
import { api } from '@/lib/api';
import { cn } from '@/utils';

interface AssignStepProps {
  draft: AssessmentDraft;
  onUpdate: (updates: Partial<AssessmentDraft>) => void;
}

type AssignmentMode = 'class' | 'individual' | 'level';

interface Student {
  id: string;
  name: string;
  email: string;
}

export function AssignStep({ draft, onUpdate }: AssignStepProps) {
  const { classes, fetchClasses } = useAssessmentStore();
  const [mode, setMode] = useState<AssignmentMode>('class');
  const [selectedClasses, setSelectedClasses] = useState<Set<string>>(new Set());
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [selectedLevel, setSelectedLevel] = useState<{
    level: 'jhs' | 'shs';
    yearGroup?: number;
  } | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);

  // Load classes on mount
  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  // Initialize from existing assignments
  useEffect(() => {
    if (draft.assignments.length > 0) {
      const classIds = new Set<string>();
      const studentIds = new Set<string>();

      draft.assignments.forEach((a) => {
        if (a.assignmentType === 'class' && a.classId) {
          classIds.add(a.classId);
        } else if (a.assignmentType === 'individual' && a.studentId) {
          studentIds.add(a.studentId);
        } else if (a.assignmentType === 'school_level') {
          setSelectedLevel({
            level: a.schoolLevel as 'jhs' | 'shs',
            yearGroup: a.yearGroup,
          });
          setMode('level');
        }
      });

      if (classIds.size > 0) {
        setSelectedClasses(classIds);
        setMode('class');
      }
      if (studentIds.size > 0) {
        setSelectedStudents(studentIds);
        setMode('individual');
      }
    }
  }, []);

  // Load students when in individual mode
  useEffect(() => {
    if (mode === 'individual') {
      loadStudents();
    }
  }, [mode]);

  const loadStudents = async () => {
    setIsLoadingStudents(true);
    try {
      const response = await api.get<{ students: Student[] }>('/students/search');
      if (response.success && response.data) {
        setStudents(response.data.students);
      }
    } catch (error) {
      console.error('Failed to load students:', error);
    } finally {
      setIsLoadingStudents(false);
    }
  };

  // Update draft assignments when selection changes
  useEffect(() => {
    const assignments: AssessmentAssignmentDraft[] = [];

    if (mode === 'class') {
      selectedClasses.forEach((classId) => {
        assignments.push({
          assignmentType: 'class',
          classId,
        });
      });
    } else if (mode === 'individual') {
      selectedStudents.forEach((studentId) => {
        assignments.push({
          assignmentType: 'individual',
          studentId,
        });
      });
    } else if (mode === 'level' && selectedLevel) {
      assignments.push({
        assignmentType: 'school_level',
        schoolLevel: selectedLevel.level,
        yearGroup: selectedLevel.yearGroup,
      });
    }

    onUpdate({ assignments });
  }, [mode, selectedClasses, selectedStudents, selectedLevel]);

  const toggleClass = (classId: string) => {
    const newSelected = new Set(selectedClasses);
    if (newSelected.has(classId)) {
      newSelected.delete(classId);
    } else {
      newSelected.add(classId);
    }
    setSelectedClasses(newSelected);
  };

  const toggleStudent = (studentId: string) => {
    const newSelected = new Set(selectedStudents);
    if (newSelected.has(studentId)) {
      newSelected.delete(studentId);
    } else {
      newSelected.add(studentId);
    }
    setSelectedStudents(newSelected);
  };

  const filteredStudents = students.filter((s) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      s.name.toLowerCase().includes(query) ||
      s.email.toLowerCase().includes(query)
    );
  });

  const getAssignmentSummary = () => {
    if (mode === 'class' && selectedClasses.size > 0) {
      const totalStudents = classes
        .filter((c) => selectedClasses.has(c.id))
        .reduce((sum, c) => sum + (c.memberCount || 0), 0);
      return `${selectedClasses.size} class${selectedClasses.size !== 1 ? 'es' : ''} (${totalStudents} students)`;
    }
    if (mode === 'individual' && selectedStudents.size > 0) {
      return `${selectedStudents.size} student${selectedStudents.size !== 1 ? 's' : ''}`;
    }
    if (mode === 'level' && selectedLevel) {
      return `All ${selectedLevel.level.toUpperCase()}${selectedLevel.yearGroup ? ` Year ${selectedLevel.yearGroup}` : ''} students`;
    }
    return 'No students assigned';
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-neutral-900 mb-1">
          Assign Students
        </h2>
        <p className="text-neutral-500">
          Choose who will take this assessment
        </p>
      </div>

      {/* Assignment Mode Tabs */}
      <div className="flex border-b border-neutral-200">
        <button
          onClick={() => setMode('class')}
          className={cn(
            'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors',
            mode === 'class'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-neutral-500 hover:text-neutral-700'
          )}
        >
          <Users className="w-4 h-4" />
          By Class
        </button>
        <button
          onClick={() => setMode('individual')}
          className={cn(
            'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors',
            mode === 'individual'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-neutral-500 hover:text-neutral-700'
          )}
        >
          <User className="w-4 h-4" />
          Individual Students
        </button>
        <button
          onClick={() => setMode('level')}
          className={cn(
            'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors',
            mode === 'level'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-neutral-500 hover:text-neutral-700'
          )}
        >
          <GraduationCap className="w-4 h-4" />
          School Level
        </button>
      </div>

      {/* Class Selection */}
      {mode === 'class' && (
        <div className="space-y-3">
          {classes.length === 0 ? (
            <div className="text-center py-8 bg-neutral-50 rounded-xl">
              <Users className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
              <p className="text-neutral-500">No classes created yet</p>
              <p className="text-sm text-neutral-400 mt-1">
                Create classes in Class Management first
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {classes.map((cls) => (
                <button
                  key={cls.id}
                  onClick={() => toggleClass(cls.id)}
                  className={cn(
                    'flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all',
                    selectedClasses.has(cls.id)
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-neutral-200 hover:border-neutral-300'
                  )}
                >
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: cls.color + '20' }}
                  >
                    <Users
                      className="w-5 h-5"
                      style={{ color: cls.color }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-neutral-900">{cls.name}</p>
                    <p className="text-sm text-neutral-500">
                      {cls.memberCount || 0} students
                    </p>
                  </div>
                  <div
                    className={cn(
                      'w-5 h-5 rounded border-2 flex items-center justify-center',
                      selectedClasses.has(cls.id)
                        ? 'bg-indigo-500 border-indigo-500'
                        : 'border-neutral-300'
                    )}
                  >
                    {selectedClasses.has(cls.id) && (
                      <Check className="w-3 h-3 text-white" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Individual Student Selection */}
      {mode === 'individual' && (
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Search students..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          {isLoadingStudents ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="text-center py-8 bg-neutral-50 rounded-xl">
              <User className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
              <p className="text-neutral-500">
                {searchQuery ? 'No students match your search' : 'No students found'}
              </p>
            </div>
          ) : (
            <div className="max-h-[300px] overflow-y-auto space-y-2">
              {filteredStudents.map((student) => (
                <button
                  key={student.id}
                  onClick={() => toggleStudent(student.id)}
                  className={cn(
                    'w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-all',
                    selectedStudents.has(student.id)
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-neutral-200 hover:border-neutral-300'
                  )}
                >
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <GraduationCap className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-neutral-900 text-sm">
                      {student.name}
                    </p>
                    <p className="text-xs text-neutral-500">{student.email}</p>
                  </div>
                  <div
                    className={cn(
                      'w-5 h-5 rounded border-2 flex items-center justify-center',
                      selectedStudents.has(student.id)
                        ? 'bg-indigo-500 border-indigo-500'
                        : 'border-neutral-300'
                    )}
                  >
                    {selectedStudents.has(student.id) && (
                      <Check className="w-3 h-3 text-white" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* School Level Selection */}
      {mode === 'level' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setSelectedLevel({ level: 'jhs' })}
              className={cn(
                'p-6 rounded-xl border-2 text-center transition-all',
                selectedLevel?.level === 'jhs'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-neutral-200 hover:border-neutral-300'
              )}
            >
              <BookOpen
                className={cn(
                  'w-8 h-8 mx-auto mb-2',
                  selectedLevel?.level === 'jhs' ? 'text-blue-600' : 'text-neutral-400'
                )}
              />
              <p className="font-medium text-neutral-900">JHS</p>
              <p className="text-sm text-neutral-500">Junior High School</p>
            </button>

            <button
              onClick={() => setSelectedLevel({ level: 'shs' })}
              className={cn(
                'p-6 rounded-xl border-2 text-center transition-all',
                selectedLevel?.level === 'shs'
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-neutral-200 hover:border-neutral-300'
              )}
            >
              <GraduationCap
                className={cn(
                  'w-8 h-8 mx-auto mb-2',
                  selectedLevel?.level === 'shs' ? 'text-purple-600' : 'text-neutral-400'
                )}
              />
              <p className="font-medium text-neutral-900">SHS</p>
              <p className="text-sm text-neutral-500">Senior High School</p>
            </button>
          </div>

          {selectedLevel && (
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Specific Year (Optional)
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() =>
                    setSelectedLevel({ ...selectedLevel, yearGroup: undefined })
                  }
                  className={cn(
                    'px-4 py-2 rounded-lg font-medium transition-colors',
                    !selectedLevel.yearGroup
                      ? 'bg-indigo-600 text-white'
                      : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                  )}
                >
                  All Years
                </button>
                {[1, 2, 3].map((year) => (
                  <button
                    key={year}
                    onClick={() =>
                      setSelectedLevel({ ...selectedLevel, yearGroup: year })
                    }
                    className={cn(
                      'px-4 py-2 rounded-lg font-medium transition-colors',
                      selectedLevel.yearGroup === year
                        ? 'bg-indigo-600 text-white'
                        : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                    )}
                  >
                    Year {year}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Summary */}
      <div className="p-4 bg-indigo-50 rounded-xl flex items-center justify-between">
        <div>
          <p className="text-sm text-indigo-600">Assignment Summary</p>
          <p className="font-medium text-indigo-900">{getAssignmentSummary()}</p>
        </div>
        {draft.assignments.length > 0 && (
          <Check className="w-5 h-5 text-indigo-600" />
        )}
      </div>
    </div>
  );
}
