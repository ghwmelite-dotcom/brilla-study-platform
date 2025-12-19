import { Trophy, Target, Zap, Clock } from 'lucide-react';

interface PredictedScoreProps {
  score: number; // 0-100
  breakdown?: {
    accuracy: number;
    speed: number;
    coverage: number;
    experience: number;
  };
}

export function PredictedScore({ score, breakdown }: PredictedScoreProps) {
  // Determine readiness level
  const getReadinessLevel = (score: number) => {
    if (score >= 80) return { label: 'Excellent', color: 'text-green-600', bg: 'bg-green-500' };
    if (score >= 60) return { label: 'Good', color: 'text-blue-600', bg: 'bg-blue-500' };
    if (score >= 40) return { label: 'Developing', color: 'text-yellow-600', bg: 'bg-yellow-500' };
    return { label: 'Needs Work', color: 'text-red-600', bg: 'bg-red-500' };
  };

  const readiness = getReadinessLevel(score);

  // Calculate circumference for circular progress
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="bg-white rounded-xl shadow-card p-6">
      <h3 className="text-lg font-semibold text-neutral-900 mb-6">NSMQ Readiness</h3>

      <div className="flex flex-col items-center">
        {/* Circular progress indicator */}
        <div className="relative w-48 h-48">
          <svg className="w-full h-full transform -rotate-90">
            {/* Background circle */}
            <circle
              cx="96"
              cy="96"
              r={radius}
              fill="none"
              stroke="#E5E7EB"
              strokeWidth="12"
            />
            {/* Progress circle */}
            <circle
              cx="96"
              cy="96"
              r={radius}
              fill="none"
              stroke={readiness.bg.replace('bg-', 'rgb(var(--color-))')}
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className={`transition-all duration-1000 ease-out ${readiness.bg.replace('bg-', 'stroke-')}`}
              style={{
                stroke: score >= 80 ? '#22C55E' : score >= 60 ? '#3B82F6' : score >= 40 ? '#EAB308' : '#EF4444',
              }}
            />
          </svg>

          {/* Center content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-bold text-neutral-900">{score}%</span>
            <span className={`text-sm font-medium ${readiness.color}`}>
              {readiness.label}
            </span>
          </div>
        </div>

        {/* Trophy icon */}
        <div className="mt-4 flex items-center gap-2 text-neutral-500">
          <Trophy className="w-5 h-5" />
          <span className="text-sm">Predicted Competition Readiness</span>
        </div>
      </div>

      {/* Breakdown */}
      {breakdown && (
        <div className="mt-6 pt-6 border-t border-neutral-100">
          <p className="text-sm font-medium text-neutral-700 mb-3">Score Breakdown</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2 p-2 bg-neutral-50 rounded-lg">
              <Target className="w-4 h-4 text-blue-500" />
              <div>
                <p className="text-xs text-neutral-500">Accuracy</p>
                <p className="font-semibold text-neutral-900">{breakdown.accuracy}%</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-2 bg-neutral-50 rounded-lg">
              <Clock className="w-4 h-4 text-green-500" />
              <div>
                <p className="text-xs text-neutral-500">Speed</p>
                <p className="font-semibold text-neutral-900">{breakdown.speed}%</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-2 bg-neutral-50 rounded-lg">
              <svg className="w-4 h-4 text-purple-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14h-2V9h2v8zm-4 0H8v-6h2v6zm8 0h-2V7h2v10z" />
              </svg>
              <div>
                <p className="text-xs text-neutral-500">Coverage</p>
                <p className="font-semibold text-neutral-900">{breakdown.coverage}%</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-2 bg-neutral-50 rounded-lg">
              <Zap className="w-4 h-4 text-yellow-500" />
              <div>
                <p className="text-xs text-neutral-500">Experience</p>
                <p className="font-semibold text-neutral-900">{breakdown.experience}%</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tips */}
      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>Tip:</strong> {
            score < 40 ? 'Focus on practicing more questions across all subjects.' :
            score < 60 ? 'Great progress! Work on improving your weak areas.' :
            score < 80 ? 'You\'re doing well! Try timed practice to boost speed.' :
            'Excellent! You\'re well prepared for the competition!'
          }
        </p>
      </div>
    </div>
  );
}
