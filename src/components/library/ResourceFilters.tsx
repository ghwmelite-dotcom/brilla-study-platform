import { useState } from 'react';
import {
  Search,
  Filter,
  X,
  Grid3X3,
  List,
  FileText,
  Video,
  Headphones,
  File,
  Gamepad2,
  ExternalLink,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/utils';
import { useLibraryStore } from '@/stores';
import type { ResourceType } from '@/types';

interface ResourceFiltersProps {
  className?: string;
  subjects?: { id: string; name: string; color?: string }[];
}

const resourceTypes: { type: ResourceType | 'all'; label: string; icon: React.ElementType }[] = [
  { type: 'all', label: 'All Types', icon: Grid3X3 },
  { type: 'pdf', label: 'PDFs', icon: FileText },
  { type: 'video', label: 'Videos', icon: Video },
  { type: 'audio', label: 'Audio', icon: Headphones },
  { type: 'document', label: 'Documents', icon: File },
  { type: 'interactive', label: 'Interactive', icon: Gamepad2 },
  { type: 'link', label: 'Links', icon: ExternalLink },
];

const sortOptions = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'popular', label: 'Most Popular' },
  { value: 'rating', label: 'Highest Rated' },
  { value: 'title', label: 'Alphabetical' },
];

const schoolLevels = [
  { value: 'all', label: 'All Levels' },
  { value: 'jhs', label: 'JHS' },
  { value: 'shs', label: 'SHS' },
];

export function ResourceFilters({ className, subjects = [] }: ResourceFiltersProps) {
  const {
    filters,
    searchQuery,
    viewMode,
    setFilters,
    searchResources,
    clearFilters,
    setViewMode,
  } = useLibraryStore();

  const [showFilters, setShowFilters] = useState(false);
  const [localSearch, setLocalSearch] = useState(searchQuery);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    searchResources(localSearch);
  };

  const handleTypeChange = (type: ResourceType | 'all') => {
    setFilters({ resourceType: type });
  };

  const hasActiveFilters =
    filters.resourceType !== 'all' ||
    filters.subjectId ||
    filters.schoolLevel !== 'all' ||
    filters.accessLevel !== 'all';

  return (
    <div className={cn('space-y-4', className)}>
      {/* Search and View Toggle */}
      <div className="flex items-center gap-4">
        <form onSubmit={handleSearch} className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
            <input
              type="text"
              placeholder="Search resources..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-neutral-200 focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            {localSearch && (
              <button
                type="button"
                onClick={() => {
                  setLocalSearch('');
                  searchResources('');
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </form>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-colors',
            showFilters || hasActiveFilters
              ? 'bg-primary text-white border-primary'
              : 'bg-white text-neutral-700 border-neutral-200 hover:border-primary'
          )}
        >
          <Filter className="w-4 h-4" />
          <span>Filters</span>
          {hasActiveFilters && (
            <span className="w-5 h-5 rounded-full bg-white text-primary text-xs font-bold flex items-center justify-center">
              !
            </span>
          )}
        </button>

        <div className="flex items-center border border-neutral-200 rounded-lg overflow-hidden">
          <button
            onClick={() => setViewMode('grid')}
            aria-label="Grid view"
            className={cn(
              'p-2.5 transition-colors',
              viewMode === 'grid'
                ? 'bg-primary text-white'
                : 'bg-white text-neutral-600 hover:bg-neutral-50'
            )}
          >
            <Grid3X3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            aria-label="List view"
            className={cn(
              'p-2.5 transition-colors',
              viewMode === 'list'
                ? 'bg-primary text-white'
                : 'bg-white text-neutral-600 hover:bg-neutral-50'
            )}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Type Quick Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {resourceTypes.map((type) => {
          const Icon = type.icon;
          const isActive = filters.resourceType === type.type;

          return (
            <button
              key={type.type}
              onClick={() => handleTypeChange(type.type)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-colors',
                isActive
                  ? 'bg-primary text-white'
                  : 'bg-white text-neutral-700 border border-neutral-200 hover:border-primary hover:text-primary'
              )}
            >
              <Icon className="w-4 h-4" />
              <span className="text-sm font-medium">{type.label}</span>
            </button>
          );
        })}
      </div>

      {/* Expanded Filters */}
      {showFilters && (
        <div className="bg-white rounded-xl border border-neutral-200 p-4 space-y-4 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Subject Filter */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Subject</label>
              <div className="relative">
                <select
                  value={filters.subjectId || ''}
                  onChange={(e) => setFilters({ subjectId: e.target.value || undefined })}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-200 appearance-none bg-white focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="">All Subjects</option>
                  {subjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
              </div>
            </div>

            {/* School Level Filter */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">School Level</label>
              <div className="relative">
                <select
                  value={filters.schoolLevel || 'all'}
                  onChange={(e) =>
                    setFilters({ schoolLevel: e.target.value as 'jhs' | 'shs' | 'both' | 'all' })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-neutral-200 appearance-none bg-white focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  {schoolLevels.map((level) => (
                    <option key={level.value} value={level.value}>
                      {level.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
              </div>
            </div>

            {/* Access Level Filter */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Access</label>
              <div className="relative">
                <select
                  value={filters.accessLevel || 'all'}
                  onChange={(e) =>
                    setFilters({ accessLevel: e.target.value as 'free' | 'basic' | 'premium' | 'all' })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-neutral-200 appearance-none bg-white focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="all">All Access Levels</option>
                  <option value="free">Free</option>
                  <option value="basic">Basic</option>
                  <option value="premium">Premium</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
              </div>
            </div>

            {/* Sort By */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Sort By</label>
              <div className="relative">
                <select
                  value={filters.sortBy || 'newest'}
                  onChange={(e) =>
                    setFilters({
                      sortBy: e.target.value as 'newest' | 'oldest' | 'popular' | 'rating' | 'title',
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-neutral-200 appearance-none bg-white focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  {sortOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <div className="flex justify-end">
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 text-sm text-primary hover:text-primary-dark"
              >
                <X className="w-4 h-4" />
                Clear All Filters
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
