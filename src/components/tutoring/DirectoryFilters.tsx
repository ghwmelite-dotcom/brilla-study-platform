import { useState } from 'react';
import { Search, Filter, X, ChevronDown } from 'lucide-react';
import type { SessionType } from '@/types/tutoring';

interface DirectoryFiltersProps {
  subjects: { id: string; name: string }[];
  onFilterChange: (filters: FilterValues) => void;
  initialFilters?: FilterValues;
}

export interface FilterValues {
  search: string;
  subjectId: string;
  sessionType: SessionType | '';
  minRating: number;
  maxRate: number;
  sortBy: 'rating' | 'rate_low' | 'rate_high' | 'sessions' | 'response';
}

const defaultFilters: FilterValues = {
  search: '',
  subjectId: '',
  sessionType: '',
  minRating: 0,
  maxRate: 0,
  sortBy: 'rating',
};

export function DirectoryFilters({ subjects, onFilterChange, initialFilters }: DirectoryFiltersProps) {
  const [filters, setFilters] = useState<FilterValues>({ ...defaultFilters, ...initialFilters });
  const [showAdvanced, setShowAdvanced] = useState(false);

  const updateFilter = <K extends keyof FilterValues>(key: K, value: FilterValues[K]) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const clearFilters = () => {
    setFilters(defaultFilters);
    onFilterChange(defaultFilters);
  };

  const hasActiveFilters =
    filters.subjectId ||
    filters.sessionType ||
    filters.minRating > 0 ||
    filters.maxRate > 0;

  return (
    <div className="bg-white rounded-xl border border-neutral-200 p-4">
      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
        <input
          type="text"
          placeholder="Search by name or subject..."
          value={filters.search}
          onChange={(e) => updateFilter('search', e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Quick filters */}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        {/* Subject dropdown */}
        <div className="relative">
          <select
            value={filters.subjectId}
            onChange={(e) => updateFilter('subjectId', e.target.value)}
            className="appearance-none pl-3 pr-8 py-2 border border-neutral-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          >
            <option value="">All Subjects</option>
            {subjects.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.name}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
        </div>

        {/* Session type */}
        <div className="relative">
          <select
            value={filters.sessionType}
            onChange={(e) => updateFilter('sessionType', e.target.value as SessionType | '')}
            className="appearance-none pl-3 pr-8 py-2 border border-neutral-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          >
            <option value="">All Session Types</option>
            <option value="video">Video Call</option>
            <option value="chat">Chat</option>
            <option value="whiteboard">Whiteboard</option>
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
        </div>

        {/* Sort by */}
        <div className="relative">
          <select
            value={filters.sortBy}
            onChange={(e) => updateFilter('sortBy', e.target.value as FilterValues['sortBy'])}
            className="appearance-none pl-3 pr-8 py-2 border border-neutral-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          >
            <option value="rating">Highest Rated</option>
            <option value="rate_low">Lowest Price</option>
            <option value="rate_high">Highest Price</option>
            <option value="sessions">Most Sessions</option>
            <option value="response">Best Response Rate</option>
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
        </div>

        {/* Advanced filter toggle */}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={`flex items-center gap-1 px-3 py-2 border rounded-lg text-sm transition-colors ${
            showAdvanced || hasActiveFilters
              ? 'border-blue-500 bg-blue-50 text-blue-700'
              : 'border-neutral-300 text-neutral-600 hover:border-neutral-400'
          }`}
        >
          <Filter className="w-4 h-4" />
          Filters
          {hasActiveFilters && (
            <span className="ml-1 w-5 h-5 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center">
              {[filters.subjectId, filters.sessionType, filters.minRating > 0, filters.maxRate > 0].filter(Boolean).length}
            </span>
          )}
        </button>

        {/* Clear filters */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 px-3 py-2 text-sm text-neutral-600 hover:text-neutral-900"
          >
            <X className="w-4 h-4" />
            Clear
          </button>
        )}
      </div>

      {/* Advanced filters panel */}
      {showAdvanced && (
        <div className="mt-4 pt-4 border-t border-neutral-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Minimum rating */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Minimum Rating
            </label>
            <select
              value={filters.minRating}
              onChange={(e) => updateFilter('minRating', Number(e.target.value))}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value={0}>Any Rating</option>
              <option value={3}>3+ Stars</option>
              <option value={4}>4+ Stars</option>
              <option value={4.5}>4.5+ Stars</option>
            </select>
          </div>

          {/* Maximum hourly rate */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Maximum Hourly Rate
            </label>
            <select
              value={filters.maxRate}
              onChange={(e) => updateFilter('maxRate', Number(e.target.value))}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value={0}>Any Price</option>
              <option value={20}>Up to GH₵20/hr</option>
              <option value={50}>Up to GH₵50/hr</option>
              <option value={100}>Up to GH₵100/hr</option>
              <option value={200}>Up to GH₵200/hr</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
}
