import {
  Users,
  MoreVertical,
  Edit,
  UserPlus,
  Trash2,
  BookOpen,
  GraduationCap,
} from 'lucide-react';
import type { StudentClass } from '@/types';
import { useState } from 'react';

interface ClassCardProps {
  classItem: StudentClass;
  onEdit: () => void;
  onViewMembers: () => void;
  onAddStudents: () => void;
  onDelete: () => void;
}

export function ClassCard({
  classItem,
  onEdit,
  onViewMembers,
  onAddStudents,
  onDelete,
}: ClassCardProps) {
  const [showMenu, setShowMenu] = useState(false);

  const getLevelBadge = () => {
    if (classItem.schoolLevel === 'jhs') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
          <BookOpen className="w-3 h-3" />
          JHS {classItem.yearGroup && `${classItem.yearGroup}`}
        </span>
      );
    }
    if (classItem.schoolLevel === 'shs') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
          <GraduationCap className="w-3 h-3" />
          SHS {classItem.yearGroup && `${classItem.yearGroup}`}
        </span>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden hover:shadow-md transition-shadow">
      {/* Color Bar */}
      <div
        className="h-2"
        style={{ backgroundColor: classItem.color || '#3B82F6' }}
      />

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-neutral-900 truncate">
              {classItem.name}
            </h3>
            {classItem.description && (
              <p className="text-sm text-neutral-500 mt-1 line-clamp-2">
                {classItem.description}
              </p>
            )}
          </div>

          {/* Menu */}
          <div className="relative ml-2">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1.5 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowMenu(false)}
                />
                <div className="absolute right-0 mt-1 w-44 bg-white rounded-lg shadow-lg border border-neutral-200 py-1 z-20">
                  <button
                    onClick={() => {
                      onEdit();
                      setShowMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
                  >
                    <Edit className="w-4 h-4" />
                    Edit Class
                  </button>
                  <button
                    onClick={() => {
                      onAddStudents();
                      setShowMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
                  >
                    <UserPlus className="w-4 h-4" />
                    Add Students
                  </button>
                  <hr className="my-1 border-neutral-200" />
                  <button
                    onClick={() => {
                      onDelete();
                      setShowMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Class
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-4">
          {getLevelBadge()}
          {!classItem.isActive && (
            <span className="px-2 py-0.5 bg-neutral-100 text-neutral-600 rounded-full text-xs font-medium">
              Inactive
            </span>
          )}
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between pt-4 border-t border-neutral-100">
          <button
            onClick={onViewMembers}
            className="flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral-900 transition-colors"
          >
            <div className="flex items-center gap-1.5">
              <Users className="w-4 h-4" />
              <span className="font-medium">{classItem.memberCount || 0}</span>
            </div>
            <span className="text-neutral-400">students</span>
          </button>

          <button
            onClick={onViewMembers}
            className="text-sm font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
          >
            View Members
          </button>
        </div>
      </div>
    </div>
  );
}
