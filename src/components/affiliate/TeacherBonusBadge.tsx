import { GraduationCap, Sparkles } from 'lucide-react';

interface TeacherBonusBadgeProps {
  variant?: 'inline' | 'card';
}

export function TeacherBonusBadge({ variant = 'inline' }: TeacherBonusBadgeProps) {
  if (variant === 'card') {
    return (
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h4 className="font-semibold text-amber-900">Teacher Bonus Active</h4>
            <p className="text-sm text-amber-700">1.5x tier progression speed</p>
          </div>
        </div>
        <p className="text-sm text-amber-800">
          As a teacher, your referrals count 1.5x towards tier progression.
          Reach higher tiers faster and earn more!
        </p>
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-1.5 bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-sm font-medium">
      <Sparkles className="w-3.5 h-3.5" />
      <span>1.5x Teacher Bonus</span>
    </div>
  );
}

export default TeacherBonusBadge;
