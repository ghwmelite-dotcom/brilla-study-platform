import { Eye, EyeOff, Shuffle, RefreshCw, Award, CheckCircle } from 'lucide-react';
import type { AssessmentDraft } from '@/types';
import { cn } from '@/utils';

interface SettingsStepProps {
  draft: AssessmentDraft;
  onUpdate: (updates: Partial<AssessmentDraft>) => void;
}

interface SettingToggleProps {
  icon: typeof Eye;
  title: string;
  description: string;
  enabled: boolean;
  onChange: (enabled: boolean) => void;
}

function SettingToggle({
  icon: Icon,
  title,
  description,
  enabled,
  onChange,
}: SettingToggleProps) {
  return (
    <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-xl">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-neutral-200">
          <Icon className="w-5 h-5 text-neutral-600" />
        </div>
        <div>
          <p className="font-medium text-neutral-900">{title}</p>
          <p className="text-sm text-neutral-500">{description}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={() => onChange(!enabled)}
        className={cn(
          'relative w-11 h-6 rounded-full transition-colors',
          enabled ? 'bg-indigo-500' : 'bg-neutral-300'
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform',
            enabled ? 'left-[22px]' : 'left-0.5'
          )}
        />
      </button>
    </div>
  );
}

export function SettingsStep({ draft, onUpdate }: SettingsStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-neutral-900 mb-1">
          Assessment Settings
        </h2>
        <p className="text-neutral-500">
          Configure how the assessment behaves
        </p>
      </div>

      {/* Display Settings */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-neutral-700 uppercase tracking-wide">
          Display Options
        </h3>

        <SettingToggle
          icon={Eye}
          title="Show Correct Answers"
          description="Students can see correct answers after submission"
          enabled={draft.showCorrectAnswers ?? true}
          onChange={(enabled) => onUpdate({ showCorrectAnswers: enabled })}
        />

        <SettingToggle
          icon={CheckCircle}
          title="Show Score Immediately"
          description="Students see their score right after submitting"
          enabled={draft.showScoreImmediately ?? true}
          onChange={(enabled) => onUpdate({ showScoreImmediately: enabled })}
        />
      </div>

      {/* Randomization Settings */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-neutral-700 uppercase tracking-wide">
          Randomization
        </h3>

        <SettingToggle
          icon={Shuffle}
          title="Shuffle Questions"
          description="Questions appear in random order for each student"
          enabled={draft.shuffleQuestions ?? false}
          onChange={(enabled) => onUpdate({ shuffleQuestions: enabled })}
        />

        <SettingToggle
          icon={Shuffle}
          title="Shuffle Options"
          description="Multiple choice options appear in random order"
          enabled={draft.shuffleOptions ?? false}
          onChange={(enabled) => onUpdate({ shuffleOptions: enabled })}
        />
      </div>

      {/* Attempts */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-neutral-700 uppercase tracking-wide">
          Attempts
        </h3>

        <div className="p-4 bg-neutral-50 rounded-xl">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-neutral-200">
              <RefreshCw className="w-5 h-5 text-neutral-600" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-neutral-900">Maximum Attempts</p>
              <p className="text-sm text-neutral-500">
                How many times can a student attempt this assessment?
              </p>
              <div className="flex items-center gap-3 mt-3">
                {[1, 2, 3].map((num) => (
                  <button
                    key={num}
                    onClick={() => onUpdate({ maxAttempts: num })}
                    className={cn(
                      'w-12 h-10 rounded-lg font-medium transition-colors',
                      draft.maxAttempts === num
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white border border-neutral-300 text-neutral-700 hover:bg-neutral-50'
                    )}
                  >
                    {num}
                  </button>
                ))}
                <button
                  onClick={() => onUpdate({ maxAttempts: undefined })}
                  className={cn(
                    'px-4 h-10 rounded-lg font-medium transition-colors',
                    !draft.maxAttempts
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white border border-neutral-300 text-neutral-700 hover:bg-neutral-50'
                  )}
                >
                  Unlimited
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Passing Score */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-neutral-700 uppercase tracking-wide">
          Grading
        </h3>

        <div className="p-4 bg-neutral-50 rounded-xl">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-neutral-200">
              <Award className="w-5 h-5 text-neutral-600" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-neutral-900">Passing Score</p>
              <p className="text-sm text-neutral-500 mb-3">
                Minimum percentage required to pass (optional)
              </p>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={draft.passingScore || ''}
                  onChange={(e) =>
                    onUpdate({
                      passingScore: parseInt(e.target.value) || undefined,
                    })
                  }
                  placeholder="e.g., 50"
                  className="w-24 px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-center"
                />
                <span className="text-neutral-500">%</span>
              </div>
              <div className="flex gap-2 mt-3">
                {[40, 50, 60, 70].map((score) => (
                  <button
                    key={score}
                    onClick={() => onUpdate({ passingScore: score })}
                    className={cn(
                      'px-3 py-1.5 rounded text-sm font-medium transition-colors',
                      draft.passingScore === score
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                    )}
                  >
                    {score}%
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Setup Presets */}
      <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-200">
        <h3 className="font-medium text-indigo-900 mb-2">Quick Setup</h3>
        <p className="text-sm text-indigo-700 mb-3">
          Apply recommended settings based on assessment type
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() =>
              onUpdate({
                showCorrectAnswers: true,
                showScoreImmediately: true,
                shuffleQuestions: false,
                shuffleOptions: false,
                maxAttempts: undefined,
              })
            }
            className="px-3 py-1.5 bg-white text-indigo-700 rounded-lg text-sm font-medium hover:bg-indigo-100 transition-colors"
          >
            Practice Mode
          </button>
          <button
            onClick={() =>
              onUpdate({
                showCorrectAnswers: false,
                showScoreImmediately: false,
                shuffleQuestions: true,
                shuffleOptions: true,
                maxAttempts: 1,
              })
            }
            className="px-3 py-1.5 bg-white text-indigo-700 rounded-lg text-sm font-medium hover:bg-indigo-100 transition-colors"
          >
            Exam Mode
          </button>
          <button
            onClick={() =>
              onUpdate({
                showCorrectAnswers: true,
                showScoreImmediately: true,
                shuffleQuestions: false,
                shuffleOptions: false,
                maxAttempts: 3,
              })
            }
            className="px-3 py-1.5 bg-white text-indigo-700 rounded-lg text-sm font-medium hover:bg-indigo-100 transition-colors"
          >
            Homework Mode
          </button>
        </div>
      </div>
    </div>
  );
}
