import { useState } from 'react';
import { Loader2, Palette } from 'lucide-react';
import type { StudentClass } from '@/types';
import { cn } from '@/utils';

interface ClassFormProps {
  initialData?: Partial<StudentClass>;
  onSubmit: (data: Partial<StudentClass>) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

const COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Emerald
  '#8B5CF6', // Purple
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#84CC16', // Lime
];

export function ClassForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
}: ClassFormProps) {
  const [name, setName] = useState(initialData?.name || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [schoolLevel, setSchoolLevel] = useState<'jhs' | 'shs' | ''>(
    initialData?.schoolLevel || ''
  );
  const [yearGroup, setYearGroup] = useState<number | ''>(
    initialData?.yearGroup || ''
  );
  const [color, setColor] = useState(initialData?.color || COLORS[0]);
  const [isActive, setIsActive] = useState(initialData?.isActive ?? true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = 'Class name is required';
    } else if (name.length < 2) {
      newErrors.name = 'Class name must be at least 2 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    await onSubmit({
      name: name.trim(),
      description: description.trim() || undefined,
      schoolLevel: schoolLevel || undefined,
      yearGroup: yearGroup || undefined,
      color,
      isActive,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Class Name */}
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-1.5">
          Class Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Form 1 Science, JHS 2B"
          className={cn(
            'w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500',
            errors.name ? 'border-red-300' : 'border-neutral-300'
          )}
          disabled={isLoading}
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-500">{errors.name}</p>
        )}
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-1.5">
          Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional description for this class"
          rows={3}
          className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none"
          disabled={isLoading}
        />
      </div>

      {/* School Level & Year */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1.5">
            School Level
          </label>
          <select
            value={schoolLevel}
            onChange={(e) => setSchoolLevel(e.target.value as 'jhs' | 'shs' | '')}
            className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 appearance-none bg-white"
            disabled={isLoading}
          >
            <option value="">Select level</option>
            <option value="jhs">Junior High School (JHS)</option>
            <option value="shs">Senior High School (SHS)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1.5">
            Year/Form
          </label>
          <select
            value={yearGroup}
            onChange={(e) =>
              setYearGroup(e.target.value ? parseInt(e.target.value) : '')
            }
            className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 appearance-none bg-white"
            disabled={isLoading}
          >
            <option value="">Select year</option>
            <option value="1">Year 1 / Form 1</option>
            <option value="2">Year 2 / Form 2</option>
            <option value="3">Year 3 / Form 3</option>
          </select>
        </div>
      </div>

      {/* Color Picker */}
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-1.5">
          <span className="flex items-center gap-1.5">
            <Palette className="w-4 h-4" />
            Class Color
          </span>
        </label>
        <div className="flex gap-2 flex-wrap">
          {COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className={cn(
                'w-8 h-8 rounded-lg transition-all',
                color === c
                  ? 'ring-2 ring-offset-2 ring-neutral-400 scale-110'
                  : 'hover:scale-105'
              )}
              style={{ backgroundColor: c }}
              disabled={isLoading}
            />
          ))}
        </div>
      </div>

      {/* Active Toggle */}
      <div className="flex items-center justify-between">
        <div>
          <label className="text-sm font-medium text-neutral-700">
            Active Class
          </label>
          <p className="text-xs text-neutral-500">
            Inactive classes won't be shown in assignments
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsActive(!isActive)}
          className={cn(
            'relative w-11 h-6 rounded-full transition-colors',
            isActive ? 'bg-emerald-500' : 'bg-neutral-300'
          )}
          disabled={isLoading}
        >
          <span
            className={cn(
              'absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform',
              isActive ? 'left-[22px]' : 'left-0.5'
            )}
          />
        </button>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-100">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="px-4 py-2.5 text-neutral-700 bg-neutral-100 rounded-lg hover:bg-neutral-200 transition-colors font-medium disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>{initialData?.id ? 'Update Class' : 'Create Class'}</>
          )}
        </button>
      </div>
    </form>
  );
}
