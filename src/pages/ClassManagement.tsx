import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Plus,
  Search,
  Filter,
  ArrowLeft,
  RefreshCw,
  ChevronDown,
  X,
  Loader2,
  FolderOpen,
  GraduationCap,
  BookOpen,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useAssessmentStore } from '@/stores/assessmentStore';
import type { StudentClass } from '@/types';
import { ClassCard, ClassForm, ClassMemberList, AddStudentsModal } from '@/components/class';
import { Modal, ConfirmModal } from '@/components/common/Modal';
import { cn } from '@/utils';

type LevelFilter = 'all' | 'jhs' | 'shs';

export default function ClassManagement() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const {
    classes,
    isLoading,
    error,
    fetchClasses,
    createClass,
    updateClass,
    deleteClass,
    addClassMembers,
    removeClassMember,
    clearError,
  } = useAssessmentStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState<LevelFilter>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [showAddStudentsModal, setShowAddStudentsModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedClass, setSelectedClass] = useState<StudentClass | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isTeacher = user?.role === 'teacher' || user?.role === 'admin';

  // Redirect if not teacher
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
      return;
    }
    if (!isTeacher) {
      navigate('/dashboard');
      return;
    }
    fetchClasses();
  }, [isAuthenticated, isTeacher, navigate, fetchClasses]);

  // Filter classes
  const filteredClasses = classes.filter((c) => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        c.name.toLowerCase().includes(query) ||
        c.description?.toLowerCase().includes(query);
      if (!matchesSearch) return false;
    }

    // Level filter
    if (levelFilter !== 'all' && c.schoolLevel !== levelFilter) return false;

    return true;
  });

  // Stats
  const stats = {
    total: classes.length,
    jhs: classes.filter((c) => c.schoolLevel === 'jhs').length,
    shs: classes.filter((c) => c.schoolLevel === 'shs').length,
    totalStudents: classes.reduce((sum, c) => sum + (c.memberCount || 0), 0),
  };

  const handleCreateClass = async (data: Partial<StudentClass>) => {
    setIsSubmitting(true);
    try {
      await createClass(data);
      setShowCreateModal(false);
    } catch (error) {
      console.error('Failed to create class:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateClass = async (data: Partial<StudentClass>) => {
    if (!selectedClass) return;
    setIsSubmitting(true);
    try {
      await updateClass(selectedClass.id, data);
      setShowEditModal(false);
      setSelectedClass(null);
    } catch (error) {
      console.error('Failed to update class:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClass = async () => {
    if (!selectedClass) return;
    setIsSubmitting(true);
    try {
      await deleteClass(selectedClass.id);
      setShowDeleteConfirm(false);
      setSelectedClass(null);
    } catch (error) {
      console.error('Failed to delete class:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddStudents = async (studentIds: string[]) => {
    if (!selectedClass) return;
    setIsSubmitting(true);
    try {
      await addClassMembers(selectedClass.id, studentIds);
      setShowAddStudentsModal(false);
      // Refresh the class to get updated member count
      await fetchClasses();
    } catch (error) {
      console.error('Failed to add students:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!selectedClass) return;
    try {
      await removeClassMember(selectedClass.id, memberId);
      // Refresh the class to get updated members
      await fetchClasses();
    } catch (error) {
      console.error('Failed to remove member:', error);
    }
  };

  const openEditModal = (classItem: StudentClass) => {
    setSelectedClass(classItem);
    setShowEditModal(true);
  };

  const openMembersModal = (classItem: StudentClass) => {
    setSelectedClass(classItem);
    setShowMembersModal(true);
  };

  const openAddStudentsModal = (classItem: StudentClass) => {
    setSelectedClass(classItem);
    setShowAddStudentsModal(true);
  };

  const openDeleteConfirm = (classItem: StudentClass) => {
    setSelectedClass(classItem);
    setShowDeleteConfirm(true);
  };

  if (!isTeacher) {
    return null;
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-neutral-600 hover:text-neutral-900 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-emerald-100 rounded-xl flex items-center justify-center">
                <Users className="w-7 h-7 text-emerald-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-neutral-900">Class Management</h1>
                <p className="text-neutral-600">Organize your students into classes</p>
              </div>
            </div>

            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
            >
              <Plus className="w-5 h-5" />
              Create Class
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-4 border border-neutral-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-neutral-100 rounded-lg flex items-center justify-center">
                <FolderOpen className="w-5 h-5 text-neutral-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-neutral-900">{stats.total}</p>
                <p className="text-xs text-neutral-500">Total Classes</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 border border-neutral-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-neutral-900">{stats.jhs}</p>
                <p className="text-xs text-neutral-500">JHS Classes</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 border border-neutral-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-neutral-900">{stats.shs}</p>
                <p className="text-xs text-neutral-500">SHS Classes</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 border border-neutral-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-neutral-900">{stats.totalStudents}</p>
                <p className="text-xs text-neutral-500">Total Students</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="bg-white rounded-xl border border-neutral-200 mb-6">
          <div className="p-4 flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
              <input
                type="text"
                placeholder="Search classes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
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

            {/* Level Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <select
                value={levelFilter}
                onChange={(e) => setLevelFilter(e.target.value as LevelFilter)}
                className="pl-9 pr-8 py-2.5 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 appearance-none bg-white min-w-[140px]"
              >
                <option value="all">All Levels</option>
                <option value="jhs">JHS Only</option>
                <option value="shs">SHS Only</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
            </div>

            {/* Refresh */}
            <button
              onClick={() => fetchClasses()}
              disabled={isLoading}
              className="p-2.5 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors disabled:opacity-50"
              title="Refresh"
            >
              <RefreshCw className={cn('w-5 h-5', isLoading && 'animate-spin')} />
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between">
            <p className="text-red-700">{error}</p>
            <button
              onClick={clearError}
              className="text-red-500 hover:text-red-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Classes Grid */}
        {isLoading && classes.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
          </div>
        ) : filteredClasses.length === 0 ? (
          <div className="bg-white rounded-xl border border-neutral-200 p-12 text-center">
            <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FolderOpen className="w-8 h-8 text-neutral-400" />
            </div>
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">
              {searchQuery || levelFilter !== 'all' ? 'No classes found' : 'No classes yet'}
            </h3>
            <p className="text-neutral-500 mb-6">
              {searchQuery || levelFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Create your first class to start organizing students'}
            </p>
            {!searchQuery && levelFilter === 'all' && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
              >
                <Plus className="w-5 h-5" />
                Create First Class
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredClasses.map((classItem) => (
              <ClassCard
                key={classItem.id}
                classItem={classItem}
                onEdit={() => openEditModal(classItem)}
                onViewMembers={() => openMembersModal(classItem)}
                onAddStudents={() => openAddStudentsModal(classItem)}
                onDelete={() => openDeleteConfirm(classItem)}
              />
            ))}
          </div>
        )}

        {/* Results count */}
        {filteredClasses.length > 0 && (
          <div className="mt-6 text-sm text-neutral-600 text-center">
            Showing {filteredClasses.length} of {classes.length} classes
          </div>
        )}
      </div>

      {/* Create Class Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Class"
        description="Set up a new class for your students"
        size="lg"
      >
        <ClassForm
          onSubmit={handleCreateClass}
          onCancel={() => setShowCreateModal(false)}
          isLoading={isSubmitting}
        />
      </Modal>

      {/* Edit Class Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedClass(null);
        }}
        title="Edit Class"
        description="Update class details"
        size="lg"
      >
        {selectedClass && (
          <ClassForm
            initialData={selectedClass}
            onSubmit={handleUpdateClass}
            onCancel={() => {
              setShowEditModal(false);
              setSelectedClass(null);
            }}
            isLoading={isSubmitting}
          />
        )}
      </Modal>

      {/* View Members Modal */}
      <Modal
        isOpen={showMembersModal}
        onClose={() => {
          setShowMembersModal(false);
          setSelectedClass(null);
        }}
        title={`${selectedClass?.name || 'Class'} Members`}
        description={`${selectedClass?.memberCount || 0} students enrolled`}
        size="lg"
      >
        {selectedClass && (
          <ClassMemberList
            classId={selectedClass.id}
            onRemoveMember={handleRemoveMember}
            onAddStudents={() => {
              setShowMembersModal(false);
              setShowAddStudentsModal(true);
            }}
          />
        )}
      </Modal>

      {/* Add Students Modal */}
      <Modal
        isOpen={showAddStudentsModal}
        onClose={() => {
          setShowAddStudentsModal(false);
          setSelectedClass(null);
        }}
        title="Add Students"
        description={`Add students to ${selectedClass?.name || 'class'}`}
        size="lg"
      >
        {selectedClass && (
          <AddStudentsModal
            classId={selectedClass.id}
            onAdd={handleAddStudents}
            onCancel={() => {
              setShowAddStudentsModal(false);
              setSelectedClass(null);
            }}
            isLoading={isSubmitting}
          />
        )}
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setSelectedClass(null);
        }}
        onConfirm={handleDeleteClass}
        title="Delete Class"
        message={`Are you sure you want to delete "${selectedClass?.name}"? This will remove all student enrollments but won't delete the students themselves.`}
        confirmText="Delete"
        variant="danger"
        isLoading={isSubmitting}
      />
    </div>
  );
}
