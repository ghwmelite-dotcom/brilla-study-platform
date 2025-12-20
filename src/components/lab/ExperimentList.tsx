import { ExperimentCard } from './ExperimentCard';
import type { Experiment } from '@/types';

interface ExperimentListProps {
  experiments: Experiment[];
  onStartExperiment: (experiment: Experiment) => void;
}

export function ExperimentList({ experiments, onStartExperiment }: ExperimentListProps) {
  if (experiments.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-neutral-500">No experiments found matching your criteria.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {experiments.map((experiment) => (
        <ExperimentCard
          key={experiment.id}
          experiment={experiment}
          onStart={onStartExperiment}
        />
      ))}
    </div>
  );
}
