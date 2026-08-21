import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { ChevronDown, ChevronRight, Loader2 } from 'lucide-react';
import { useExamStore } from '@/stores/examStore';
import { getSubjectIcon } from '@/lib/subjectIcons';
import { cn } from '@/utils';
import type { Subject, SubjectCategory } from '@/types';

interface SubjectNavigationProps {
  onItemClick?: () => void;
}

interface CategoryGroupProps {
  category: SubjectCategory;
  subjects: Subject[];
  onItemClick?: () => void;
}

function CategoryGroup({ category, subjects, onItemClick }: CategoryGroupProps) {
  const [isExpanded, setIsExpanded] = useState(category.isCore);

  if (subjects.length === 0) return null;

  return (
    <div className="mb-2">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-neutral-500 uppercase tracking-wider hover:bg-neutral-50 rounded-lg transition-colors"
      >
        <span className="flex items-center gap-2">
          {category.isCore && (
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
          )}
          {category.name}
        </span>
        {isExpanded ? (
          <ChevronDown className="w-4 h-4" />
        ) : (
          <ChevronRight className="w-4 h-4" />
        )}
      </button>

      {isExpanded && (
        <ul className="space-y-0.5 mt-1 animate-in slide-in-from-top-2 duration-200">
          {subjects.map((subject) => {
            const IconComponent = getSubjectIcon(subject.icon);

            return (
              <li key={subject.id}>
                <NavLink
                  to={`/topics/${subject.slug}`}
                  onClick={onItemClick}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors',
                      isActive
                        ? 'bg-primary text-white'
                        : 'text-neutral-700 hover:bg-neutral-100'
                    )
                  }
                >
                  <IconComponent
                    className="w-4 h-4 flex-shrink-0"
                    style={{ color: subject.color }}
                  />
                  <span className="truncate">{subject.name}</span>
                </NavLink>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export function SubjectNavigation({ onItemClick }: SubjectNavigationProps) {
  const {
    currentExamType,
    subjects,
    categories,
    isLoadingSubjects,
    fetchSubjects,
    fetchCategories,
  } = useExamStore();

  useEffect(() => {
    fetchSubjects(currentExamType);
    fetchCategories(currentExamType);
  }, [currentExamType, fetchSubjects, fetchCategories]);

  if (isLoadingSubjects) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 text-primary animate-spin" />
      </div>
    );
  }

  // For NSMQ (few subjects), show flat list
  if (currentExamType === 'nsmq') {
    return (
      <div>
        <h3 className="px-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">
          Subjects
        </h3>
        <ul className="space-y-1">
          {subjects.map((subject) => {
            const IconComponent = getSubjectIcon(subject.icon);

            return (
              <li key={subject.id}>
                <NavLink
                  to={`/topics/${subject.slug}`}
                  onClick={onItemClick}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-colors',
                      isActive
                        ? 'bg-primary text-white'
                        : 'text-neutral-700 hover:bg-neutral-100'
                    )
                  }
                >
                  <IconComponent
                    className="w-5 h-5"
                    style={{ color: subject.color }}
                  />
                  {subject.name}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </div>
    );
  }

  // For WASSCE/BECE, show categories with collapsible groups
  const subjectsByCategory = categories.map((cat) => ({
    category: cat,
    subjects: subjects.filter((s) => s.categoryId === cat.id),
  }));

  // Also include subjects without categories
  const uncategorizedSubjects = subjects.filter(
    (s) => !s.categoryId || !categories.find((c) => c.id === s.categoryId)
  );

  return (
    <div>
      <div className="flex items-center justify-between px-3 mb-2">
        <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
          Subjects
        </h3>
        <span className="text-xs text-neutral-400">{subjects.length} total</span>
      </div>

      <div className="max-h-[50vh] overflow-y-auto pr-1">
        {subjectsByCategory.map(({ category, subjects: catSubjects }) => (
          <CategoryGroup
            key={category.id}
            category={category}
            subjects={catSubjects}
            onItemClick={onItemClick}
          />
        ))}

        {uncategorizedSubjects.length > 0 && (
          <CategoryGroup
            category={{
              id: 'other',
              examTypeId: '',
              name: 'Other',
              slug: 'other',
              isCore: false,
              displayOrder: 999,
            }}
            subjects={uncategorizedSubjects}
            onItemClick={onItemClick}
          />
        )}
      </div>
    </div>
  );
}
