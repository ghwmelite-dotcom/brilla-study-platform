import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FlaskConical,
  Beaker,
  Microscope,
  Search,
  ArrowLeft,
  LayoutGrid,
  List,
} from 'lucide-react';
import { Card, Button, Badge, Input, Select } from '@/components/common';
import { ExperimentList } from './ExperimentList';
import { LabWorkspace } from './LabWorkspace';
import { allExperiments, getExperimentBySlug } from '@/data/experiments';
import { useLabStore } from '@/stores';
import { cn } from '@/utils';
import type { Experiment } from '@/types';

// Subject filter options
const subjectFilters = [
  { value: 'all', label: 'All Subjects', icon: FlaskConical },
  { value: 'subj_wassce_physics', label: 'Physics', icon: Beaker },
  { value: 'subj_wassce_chemistry', label: 'Chemistry', icon: FlaskConical },
  { value: 'subj_wassce_biology', label: 'Biology', icon: Microscope },
];

// Difficulty options
const difficultyOptions = [
  { value: 'all', label: 'All Difficulties' },
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
];

// Simulation type options
const simTypeOptions = [
  { value: 'all', label: 'All Types' },
  { value: 'phet', label: 'PhET Simulations' },
  { value: 'custom', label: 'Custom Labs' },
];

export function VirtualLabPage() {
  const { experimentSlug } = useParams<{ experimentSlug: string }>();
  const navigate = useNavigate();

  const { currentSession, currentExperiment, startSession, endSession } = useLabStore();

  // Filter states
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const [simTypeFilter, setSimTypeFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Mode selection for starting
  const [selectedExperiment, setSelectedExperiment] = useState<Experiment | null>(null);
  const [showModeSelection, setShowModeSelection] = useState(false);

  // If there's an experiment slug in the URL, load that experiment
  const urlExperiment = experimentSlug ? getExperimentBySlug(experimentSlug) : null;

  // Filter experiments
  const filteredExperiments = useMemo(() => {
    return allExperiments.filter((exp) => {
      // Subject filter
      if (subjectFilter !== 'all' && exp.subjectId !== subjectFilter) return false;

      // Difficulty filter
      if (difficultyFilter !== 'all' && exp.difficulty !== difficultyFilter) return false;

      // Simulation type filter
      if (simTypeFilter !== 'all' && exp.simulationType !== simTypeFilter) return false;

      // Search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          exp.name.toLowerCase().includes(query) ||
          exp.description.toLowerCase().includes(query) ||
          exp.objectives.some((obj) => obj.toLowerCase().includes(query))
        );
      }

      return true;
    });
  }, [subjectFilter, difficultyFilter, simTypeFilter, searchQuery]);

  // Group experiments by subject for stats
  const experimentStats = useMemo(() => {
    const stats = {
      total: allExperiments.length,
      physics: allExperiments.filter((e) => e.subjectId === 'subj_wassce_physics').length,
      chemistry: allExperiments.filter((e) => e.subjectId === 'subj_wassce_chemistry').length,
      biology: allExperiments.filter((e) => e.subjectId === 'subj_wassce_biology').length,
    };
    return stats;
  }, []);

  // Handle experiment start
  const handleStartExperiment = (experiment: Experiment) => {
    setSelectedExperiment(experiment);
    setShowModeSelection(true);
  };

  // Handle session end
  const handleEndSession = () => {
    endSession();
    navigate('/virtual-lab');
  };

  // If there's an active session or URL experiment, show the workspace
  if (currentSession && currentExperiment) {
    return <LabWorkspace onExit={handleEndSession} />;
  }

  // If URL has experiment but no session, show mode selection modal
  // Using a derived state approach instead of setting state during render
  const shouldShowModeSelectionFromUrl = urlExperiment && !currentSession && !showModeSelection && !selectedExperiment;
  const experimentForModal = selectedExperiment || (shouldShowModeSelectionFromUrl ? urlExperiment : null);
  const isModalOpen = showModeSelection || shouldShowModeSelectionFromUrl;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-neutral-900">
            Virtual Laboratory
          </h1>
          <p className="text-neutral-500">
            Practice WASSCE practical experiments with interactive simulations
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'grid' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            <LayoutGrid className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <List className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Experiments', value: experimentStats.total, color: 'bg-primary' },
          { label: 'Physics', value: experimentStats.physics, color: 'bg-purple-500' },
          { label: 'Chemistry', value: experimentStats.chemistry, color: 'bg-green-500' },
          { label: 'Biology', value: experimentStats.biology, color: 'bg-amber-500' },
        ].map((stat, idx) => (
          <Card key={idx} className="p-4">
            <div className="flex items-center gap-3">
              <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center text-white', stat.color)}>
                <FlaskConical className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-neutral-900">{stat.value}</p>
                <p className="text-xs text-neutral-500">{stat.label}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Subject Quick Filters */}
      <div className="flex flex-wrap gap-2">
        {subjectFilters.map((filter) => (
          <Button
            key={filter.value}
            variant={subjectFilter === filter.value ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setSubjectFilter(filter.value)}
            className="gap-2"
          >
            <filter.icon className="w-4 h-4" />
            {filter.label}
          </Button>
        ))}
      </div>

      {/* Search and Filters */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <Input
              placeholder="Search experiments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Select
              options={difficultyOptions}
              value={difficultyFilter}
              onChange={(e) => setDifficultyFilter(e.target.value)}
              className="w-40"
            />
            <Select
              options={simTypeOptions}
              value={simTypeFilter}
              onChange={(e) => setSimTypeFilter(e.target.value)}
              className="w-44"
            />
          </div>
        </div>
      </Card>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-neutral-500">
          Showing {filteredExperiments.length} of {allExperiments.length} experiments
        </p>
        {(subjectFilter !== 'all' || difficultyFilter !== 'all' || simTypeFilter !== 'all' || searchQuery) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSubjectFilter('all');
              setDifficultyFilter('all');
              setSimTypeFilter('all');
              setSearchQuery('');
            }}
          >
            Clear Filters
          </Button>
        )}
      </div>

      {/* Experiment Grid */}
      <ExperimentList
        experiments={filteredExperiments}
        onStartExperiment={handleStartExperiment}
      />

      {/* Mode Selection Modal */}
      {isModalOpen && experimentForModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-neutral-900">Select Lab Mode</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowModeSelection(false);
                  setSelectedExperiment(null);
                  navigate('/virtual-lab');
                }}
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back
              </Button>
            </div>

            <p className="text-neutral-600 mb-6">
              <strong>{experimentForModal.name}</strong>
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Guided Mode */}
              <Card
                hoverable
                className="p-4 cursor-pointer border-2 border-transparent hover:border-primary"
                onClick={() => {
                  if (experimentForModal) {
                    startSession(experimentForModal, 'guided');
                    setShowModeSelection(false);
                    navigate(`/virtual-lab/${experimentForModal.slug}`);
                  }
                }}
              >
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center mb-3">
                  <FlaskConical className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="font-semibold text-neutral-900 mb-1">Guided Mode</h3>
                <p className="text-sm text-neutral-500 mb-3">
                  Follow step-by-step instructions with hints and feedback
                </p>
                <ul className="text-xs text-neutral-400 space-y-1">
                  <li>- Step-by-step guidance</li>
                  <li>- Hints available</li>
                  <li>- Progress tracking</li>
                  <li>- Assessment at end</li>
                </ul>
                <Badge variant="primary" className="mt-3">Recommended</Badge>
              </Card>

              {/* Sandbox Mode */}
              <Card
                hoverable
                className="p-4 cursor-pointer border-2 border-transparent hover:border-primary"
                onClick={() => {
                  if (experimentForModal) {
                    startSession(experimentForModal, 'sandbox');
                    setShowModeSelection(false);
                    navigate(`/virtual-lab/${experimentForModal.slug}`);
                  }
                }}
              >
                <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center mb-3">
                  <Beaker className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="font-semibold text-neutral-900 mb-1">Sandbox Mode</h3>
                <p className="text-sm text-neutral-500 mb-3">
                  Free exploration without guidance - experiment freely
                </p>
                <ul className="text-xs text-neutral-400 space-y-1">
                  <li>- Free exploration</li>
                  <li>- No step restrictions</li>
                  <li>- Practice at your pace</li>
                  <li>- Optional assessment</li>
                </ul>
              </Card>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
