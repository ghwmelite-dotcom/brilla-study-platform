import { Clock, Users, Target, Lightbulb, CheckCircle } from 'lucide-react';
import { cn } from '@/utils';

interface RoundInfo {
  number: 1 | 2 | 3 | 4 | 5;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

const ROUNDS: RoundInfo[] = [
  {
    number: 1,
    name: 'Fundamentals',
    description: '16 questions per school (4 per subject). Schools take turns. Bonus for opponents\' wrong answers.',
    icon: <Target className="w-6 h-6" />,
    color: 'bg-blue-500',
  },
  {
    number: 2,
    name: 'Speed Race',
    description: 'Same question to all schools. First correct answer wins! Wrong answers lose points.',
    icon: <Clock className="w-6 h-6" />,
    color: 'bg-yellow-500',
  },
  {
    number: 3,
    name: 'Problem of the Day',
    description: 'One complex problem with multiple parts. 4 minutes to solve. Partial credit available.',
    icon: <Users className="w-6 h-6" />,
    color: 'bg-purple-500',
  },
  {
    number: 4,
    name: 'True or False',
    description: 'Judge statements as true or false. Can pass to opponents. Wrong answers lose points.',
    icon: <CheckCircle className="w-6 h-6" />,
    color: 'bg-green-500',
  },
  {
    number: 5,
    name: 'Riddles',
    description: 'Progressive clues. More points for early guesses. One riddle per subject.',
    icon: <Lightbulb className="w-6 h-6" />,
    color: 'bg-orange-500',
  },
];

interface RoundDisplayProps {
  currentRound: 1 | 2 | 3 | 4 | 5;
  className?: string;
}

export function RoundDisplay({ currentRound, className }: RoundDisplayProps) {
  const round = ROUNDS.find((r) => r.number === currentRound)!;

  return (
    <div className={cn('bg-white rounded-xl shadow-card overflow-hidden', className)}>
      <div className={cn('p-4 text-white', round.color)}>
        <div className="flex items-center gap-3">
          {round.icon}
          <div>
            <p className="text-sm opacity-90">Round {round.number}</p>
            <h3 className="text-xl font-bold">{round.name}</h3>
          </div>
        </div>
      </div>
      <div className="p-4">
        <p className="text-neutral-600 text-sm">{round.description}</p>
      </div>
    </div>
  );
}

// Round selector for practice mode
interface RoundSelectorProps {
  selectedRound: 1 | 2 | 3 | 4 | 5 | null;
  onSelect: (round: 1 | 2 | 3 | 4 | 5) => void;
  className?: string;
}

export function RoundSelector({ selectedRound, onSelect, className }: RoundSelectorProps) {
  return (
    <div className={cn('grid grid-cols-1 md:grid-cols-5 gap-4', className)}>
      {ROUNDS.map((round) => (
        <button
          key={round.number}
          onClick={() => onSelect(round.number)}
          className={cn(
            'p-4 rounded-xl border-2 transition-all text-left',
            selectedRound === round.number
              ? 'border-primary bg-primary-50'
              : 'border-neutral-200 hover:border-primary hover:bg-neutral-50'
          )}
        >
          <div className={cn(
            'w-10 h-10 rounded-lg flex items-center justify-center text-white mb-3',
            round.color
          )}>
            {round.icon}
          </div>
          <h4 className="font-semibold text-neutral-900">Round {round.number}</h4>
          <p className="text-sm text-neutral-600">{round.name}</p>
        </button>
      ))}
    </div>
  );
}

// Round progress indicator
interface RoundProgressProps {
  currentRound: number;
  totalRounds?: number;
  className?: string;
}

export function RoundProgress({ currentRound, totalRounds = 5, className }: RoundProgressProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      {Array.from({ length: totalRounds }, (_, i) => i + 1).map((round) => (
        <div
          key={round}
          className={cn(
            'flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold transition-all',
            round < currentRound && 'bg-green-500 text-white',
            round === currentRound && 'bg-primary text-white ring-2 ring-primary ring-offset-2',
            round > currentRound && 'bg-neutral-200 text-neutral-500'
          )}
        >
          {round < currentRound ? (
            <CheckCircle className="w-4 h-4" />
          ) : (
            round
          )}
        </div>
      ))}
    </div>
  );
}
