import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Calendar,
  Clock,
  Filter,
  ChevronDown,
  BookOpen,
  Play,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { Button, Card } from '@/components/common';
import { useExamStore } from '@/stores/examStore';
import type { PastPaper } from '@/types';

export function PastPapers() {
  const navigate = useNavigate();
  const { currentExamType, subjects, paperTypes, fetchSubjects, fetchPaperTypes } = useExamStore();

  const [papers, setPapers] = useState<PastPaper[]>([]);
  const [years, setYears] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [selectedPaperType, setSelectedPaperType] = useState<string>('');

  useEffect(() => {
    fetchSubjects(currentExamType);
    fetchPaperTypes(currentExamType);
    fetchYears();
    fetchPapers();
  }, [currentExamType]);

  useEffect(() => {
    fetchPapers();
  }, [selectedSubject, selectedYear, selectedPaperType]);

  const fetchYears = async () => {
    try {
      const params = new URLSearchParams();
      params.append('exam_type', currentExamType);
      if (selectedSubject) params.append('subject', selectedSubject);

      const response = await fetch(`/api/papers/years?${params}`);
      const data = await response.json();

      if (data.success) {
        setYears(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch years:', error);
    }
  };

  const fetchPapers = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('exam_type', currentExamType);
      if (selectedSubject) params.append('subject', selectedSubject);
      if (selectedYear) params.append('year', selectedYear);
      if (selectedPaperType) params.append('paper_type', selectedPaperType);

      const response = await fetch(`/api/papers?${params}`);
      const data = await response.json();

      if (data.success) {
        setPapers(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch papers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const clearFilters = () => {
    setSelectedSubject('');
    setSelectedYear('');
    setSelectedPaperType('');
  };

  const hasFilters = selectedSubject || selectedYear || selectedPaperType;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-neutral-900 mb-2">
          {currentExamType.toUpperCase()} Past Papers
        </h1>
        <p className="text-neutral-600">
          Practice with real exam papers from previous years
        </p>
      </div>

      {/* Filters */}
      <Card className="mb-6 p-4">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-neutral-500" />
          <span className="font-medium text-neutral-700">Filters</span>
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="ml-auto text-sm text-primary hover:underline"
            >
              Clear all
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Subject filter */}
          <div className="relative">
            <label className="block text-xs font-medium text-neutral-500 mb-1">
              Subject
            </label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full px-3 py-2 pr-8 rounded-lg border border-neutral-200 bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 appearance-none"
            >
              <option value="">All Subjects</option>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.slug}>
                  {subject.name}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-8 w-4 h-4 text-neutral-400 pointer-events-none" />
          </div>

          {/* Year filter */}
          <div className="relative">
            <label className="block text-xs font-medium text-neutral-500 mb-1">
              Year
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full px-3 py-2 pr-8 rounded-lg border border-neutral-200 bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 appearance-none"
            >
              <option value="">All Years</option>
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-8 w-4 h-4 text-neutral-400 pointer-events-none" />
          </div>

          {/* Paper type filter */}
          <div className="relative">
            <label className="block text-xs font-medium text-neutral-500 mb-1">
              Paper Type
            </label>
            <select
              value={selectedPaperType}
              onChange={(e) => setSelectedPaperType(e.target.value)}
              className="w-full px-3 py-2 pr-8 rounded-lg border border-neutral-200 bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 appearance-none"
            >
              <option value="">All Types</option>
              {paperTypes.map((type) => (
                <option key={type.id} value={type.slug}>
                  {type.name}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-8 w-4 h-4 text-neutral-400 pointer-events-none" />
          </div>
        </div>
      </Card>

      {/* Papers grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : papers.length === 0 ? (
        <div className="text-center py-16">
          <FileText className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-neutral-700 mb-2">
            No past papers found
          </h3>
          <p className="text-neutral-500">
            {hasFilters
              ? 'Try adjusting your filters'
              : 'Past papers will be available soon'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {papers.map((paper) => (
            <PaperCard
              key={paper.id}
              paper={paper}
              onStart={() => navigate(`/past-papers/${paper.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface PaperCardProps {
  paper: PastPaper & {
    subject_name?: string;
    subject_color?: string;
    paper_type_name?: string;
    question_format?: string;
  };
  onStart: () => void;
}

function PaperCard({ paper, onStart }: PaperCardProps) {
  const formatDuration = (minutes?: number) => {
    if (!minutes) return 'Untimed';
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
    return `${minutes}m`;
  };

  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${paper.subject_color}20` }}
        >
          <BookOpen
            className="w-5 h-5"
            style={{ color: paper.subject_color }}
          />
        </div>
        {paper.isComplete && (
          <span className="flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
            <CheckCircle2 className="w-3 h-3" />
            Complete
          </span>
        )}
      </div>

      <h3 className="font-semibold text-neutral-900 mb-1">
        {paper.subject_name || paper.title}
      </h3>

      <p className="text-sm text-neutral-600 mb-3">
        {paper.paper_type_name} - {paper.year}
      </p>

      <div className="flex items-center gap-4 text-xs text-neutral-500 mb-4">
        <span className="flex items-center gap-1">
          <FileText className="w-3.5 h-3.5" />
          {paper.totalQuestions} questions
        </span>
        <span className="flex items-center gap-1">
          <Clock className="w-3.5 h-3.5" />
          {formatDuration(paper.timeAllowed)}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <Button onClick={onStart} size="sm" className="flex-1">
          <Play className="w-4 h-4 mr-1" />
          Start
        </Button>
        <Button variant="outline" size="sm">
          <Calendar className="w-4 h-4" />
        </Button>
      </div>
    </Card>
  );
}
