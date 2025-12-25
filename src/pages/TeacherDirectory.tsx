import { useState, useEffect } from 'react';
import { GraduationCap, Users, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { TeacherCard } from '@/components/tutoring/TeacherCard';
import { DirectoryFilters, FilterValues } from '@/components/tutoring/DirectoryFilters';
import { useTutoringStore } from '@/stores/tutoringStore';

export default function TeacherDirectory() {
  const { teachers, totalTeachers, isLoadingDirectory, error, loadDirectory } = useTutoringStore();
  const isLoading = isLoadingDirectory;
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<FilterValues>({
    search: '',
    subjectId: '',
    sessionType: '',
    minRating: 0,
    maxRate: 0,
    sortBy: 'rating',
  });

  const pageSize = 12;
  const totalPages = Math.ceil(totalTeachers / pageSize);

  // Mock subjects for filter - in production, fetch from API
  const subjects = [
    { id: 'math', name: 'Mathematics' },
    { id: 'english', name: 'English Language' },
    { id: 'science', name: 'Integrated Science' },
    { id: 'social', name: 'Social Studies' },
    { id: 'physics', name: 'Physics' },
    { id: 'chemistry', name: 'Chemistry' },
    { id: 'biology', name: 'Biology' },
    { id: 'elective-math', name: 'Elective Mathematics' },
  ];

  useEffect(() => {
    // Map filter sort values to API expected values
    const sortByMap: Record<string, string> = {
      'rating': 'rating',
      'rate_low': 'price_low',
      'rate_high': 'price_high',
      'sessions': 'sessions',
      'response': 'newest',
    };

    loadDirectory({
      page,
      pageSize,
      search: filters.search || undefined,
      subjectId: filters.subjectId || undefined,
      sessionTypes: filters.sessionType ? [filters.sessionType] : undefined,
      minRating: filters.minRating || undefined,
      maxHourlyRate: filters.maxRate || undefined,
      sortBy: sortByMap[filters.sortBy] as 'newest' | 'rating' | 'price_low' | 'price_high' | 'sessions' || 'rating',
    });
  }, [page, filters, loadDirectory]);

  const handleFilterChange = (newFilters: FilterValues) => {
    setFilters(newFilters);
    setPage(1); // Reset to first page on filter change
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-purple-700 text-white">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-3xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-white/20 rounded-lg">
                <GraduationCap className="w-8 h-8" />
              </div>
              <h1 className="text-3xl font-bold">Find Your Perfect Tutor</h1>
            </div>
            <p className="text-lg text-blue-100 mb-6">
              Connect with experienced teachers for personalized tutoring sessions.
              Choose from video calls, chat, or interactive whiteboard sessions.
            </p>
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-300" />
                <span>{totalTeachers} Verified Tutors</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Filters */}
        <DirectoryFilters
          subjects={subjects}
          onFilterChange={handleFilterChange}
          initialFilters={filters}
        />

        {/* Results */}
        <div className="mt-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : error ? (
            <div className="text-center py-20">
              <p className="text-red-600">{error}</p>
              <button
                onClick={() => loadDirectory({ page, pageSize })}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Try Again
              </button>
            </div>
          ) : teachers.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-xl border border-neutral-200">
              <GraduationCap className="w-16 h-16 mx-auto text-neutral-300 mb-4" />
              <h3 className="text-xl font-semibold text-neutral-900 mb-2">No Tutors Found</h3>
              <p className="text-neutral-500 max-w-md mx-auto">
                {filters.search || filters.subjectId || filters.sessionType
                  ? 'Try adjusting your filters to see more results.'
                  : 'No tutors are available at the moment. Check back soon!'}
              </p>
            </div>
          ) : (
            <>
              {/* Results count */}
              <div className="flex items-center justify-between mb-4">
                <p className="text-neutral-600">
                  Showing {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, totalTeachers)} of {totalTeachers} tutors
                </p>
              </div>

              {/* Teacher grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {teachers.map((teacher) => (
                  <TeacherCard key={teacher.id} teacher={teacher} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-8 flex items-center justify-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-2 border border-neutral-300 rounded-lg hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>

                  {/* Page numbers */}
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum: number;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (page <= 3) {
                        pageNum = i + 1;
                      } else if (page >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = page - 2 + i;
                      }

                      return (
                        <button
                          key={pageNum}
                          onClick={() => setPage(pageNum)}
                          className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                            page === pageNum
                              ? 'bg-blue-600 text-white'
                              : 'border border-neutral-300 hover:bg-neutral-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="p-2 border border-neutral-300 rounded-lg hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
