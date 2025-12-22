import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Target,
  Flame,
  Clock,
  Award,
  BookOpen,
  BarChart3,
} from 'lucide-react';
import { useAuthStore } from '@/stores';
import {
  PerformanceChart,
  SubjectRadar,
  StudyHeatmap,
  StatsCard,
  StrengthsWeaknesses,
  PredictedScore,
  GoalProgress,
  StudyRecommendations,
} from '@/components/analytics';
import type {
  DailyProgress,
  SubjectPerformance,
  TopicStrength,
  StudyHeatmapData,
} from '@/utils/analyticsUtils';
import {
  generateEmptyHeatmap,
  calculateAccuracy,
} from '@/utils/analyticsUtils';

export function AnalyticsPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);

  // Demo data - in production, this would come from the API
  const [weeklyProgress, setWeeklyProgress] = useState<DailyProgress[]>([]);
  const [subjectPerformance, setSubjectPerformance] = useState<SubjectPerformance[]>([]);
  const [strengths, setStrengths] = useState<TopicStrength[]>([]);
  const [weaknesses, setWeaknesses] = useState<TopicStrength[]>([]);
  const [heatmapData, setHeatmapData] = useState<StudyHeatmapData[]>([]);
  const [predictedScore, setPredictedScore] = useState(0);

  useEffect(() => {
    // Load analytics data from API
    const loadAnalytics = async () => {
      setIsLoading(true);

      // TODO: Replace with actual API call to fetch user analytics
      // For now, initialize with empty data - will be populated when user has real activity
      setWeeklyProgress([]);
      setSubjectPerformance([]);
      setStrengths([]);
      setWeaknesses([]);

      // Generate empty heatmap (last 90 days) - will show user's actual activity
      const heatmap = generateEmptyHeatmap(90);
      setHeatmapData(heatmap);

      // Predicted score starts at 0 until user has enough data
      setPredictedScore(0);

      setIsLoading(false);
    };

    loadAnalytics();
  }, []);

  const handleTopicClick = (topicId: string) => {
    navigate(`/topics?focus=${topicId}`);
  };

  // Calculate overall stats
  const totalQuestions = subjectPerformance.reduce((sum, s) => sum + s.totalQuestions, 0);
  const totalCorrect = subjectPerformance.reduce((sum, s) => sum + s.correctAnswers, 0);
  const overallAccuracy = calculateAccuracy(totalCorrect, totalQuestions);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-neutral-200 rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-neutral-100 rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="h-64 bg-neutral-100 rounded-xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-display font-bold text-neutral-900">Performance Analytics</h1>
        <p className="text-neutral-500">Track your progress and identify areas for improvement</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Questions"
          value={totalQuestions}
          subtitle={`${totalCorrect} correct`}
          icon={<BookOpen className="w-6 h-6" />}
          color="blue"
          trend={{ value: 15, direction: 'up', label: 'vs last week' }}
        />
        <StatsCard
          title="Overall Accuracy"
          value={`${overallAccuracy}%`}
          subtitle="Across all subjects"
          icon={<Target className="w-6 h-6" />}
          color="green"
          trend={{ value: 5, direction: 'up', label: 'improvement' }}
        />
        <StatsCard
          title="Current Streak"
          value={`${user?.streakDays || 0} days`}
          subtitle="Keep it going!"
          icon={<Flame className="w-6 h-6" />}
          color="yellow"
        />
        <StatsCard
          title="Avg. Answer Time"
          value="18s"
          subtitle="Target: 15s"
          icon={<Clock className="w-6 h-6" />}
          color="purple"
          trend={{ value: 10, direction: 'down', label: 'faster' }}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <PerformanceChart data={weeklyProgress} />
        </div>
        <div>
          <PredictedScore
            score={predictedScore}
            breakdown={{
              accuracy: Math.round(overallAccuracy * 0.5),
              speed: 15,
              coverage: 14,
              experience: 8,
            }}
          />
        </div>
      </div>

      {/* Subject Radar and Heatmap */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SubjectRadar data={subjectPerformance} />
        <StudyHeatmap data={heatmapData} />
      </div>

      {/* Strengths and Weaknesses */}
      <StrengthsWeaknesses
        strengths={strengths}
        weaknesses={weaknesses}
        onTopicClick={handleTopicClick}
      />

      {/* Goals and Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GoalProgress />
        <StudyRecommendations
          onActionClick={(rec) => {
            if (rec.topicId) {
              navigate(`/topics?focus=${rec.topicId}`);
            } else if (rec.type === 'challenge') {
              navigate('/practice');
            } else {
              navigate('/practice');
            }
          }}
        />
      </div>

      {/* Subject Performance Table */}
      <div className="bg-white rounded-xl shadow-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-5 h-5 text-neutral-600" />
          <h3 className="text-lg font-semibold text-neutral-900">Subject Breakdown</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-200">
                <th className="text-left py-3 px-4 font-medium text-neutral-600">Subject</th>
                <th className="text-center py-3 px-4 font-medium text-neutral-600">Questions</th>
                <th className="text-center py-3 px-4 font-medium text-neutral-600">Correct</th>
                <th className="text-center py-3 px-4 font-medium text-neutral-600">Accuracy</th>
                <th className="text-left py-3 px-4 font-medium text-neutral-600">Mastery</th>
              </tr>
            </thead>
            <tbody>
              {subjectPerformance.map((subject) => (
                <tr key={subject.subjectId} className="border-b border-neutral-100">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: subject.color }}
                      />
                      <span className="font-medium text-neutral-900">{subject.subject}</span>
                    </div>
                  </td>
                  <td className="text-center py-3 px-4 text-neutral-700">
                    {subject.totalQuestions}
                  </td>
                  <td className="text-center py-3 px-4 text-green-600 font-medium">
                    {subject.correctAnswers}
                  </td>
                  <td className="text-center py-3 px-4">
                    <span className={`font-medium ${subject.accuracy >= 70 ? 'text-green-600' : subject.accuracy >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {subject.accuracy}%
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-neutral-200 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${subject.masteryLevel}%`,
                            backgroundColor: subject.color,
                          }}
                        />
                      </div>
                      <span className="text-sm font-medium text-neutral-600 w-10">
                        {subject.masteryLevel}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Achievements Section */}
      <div className="bg-white rounded-xl shadow-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Award className="w-5 h-5 text-yellow-500" />
          <h3 className="text-lg font-semibold text-neutral-900">Recent Achievements</h3>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { name: 'First Steps', icon: '1', desc: 'Answer 10 questions', unlocked: true },
            { name: 'Math Wizard', icon: 'calc', desc: '80% accuracy in Math', unlocked: true },
            { name: 'Streak Master', icon: 'fire', desc: '7-day streak', unlocked: true },
            { name: 'Speed Demon', icon: 'zap', desc: 'Average under 15s', unlocked: false },
          ].map((achievement, i) => (
            <div
              key={i}
              className={`
                p-4 rounded-lg text-center
                ${achievement.unlocked ? 'bg-yellow-50 border border-yellow-200' : 'bg-neutral-50 opacity-50'}
              `}
            >
              <div className={`
                w-12 h-12 mx-auto mb-2 rounded-full flex items-center justify-center
                ${achievement.unlocked ? 'bg-yellow-400' : 'bg-neutral-300'}
              `}>
                <span className={`text-xl ${achievement.unlocked ? 'text-white' : 'text-neutral-500'}`}>
                  {achievement.icon === 'fire' ? '🔥' : achievement.icon === 'zap' ? '⚡' : achievement.icon === 'calc' ? '🔢' : '🏆'}
                </span>
              </div>
              <p className="font-medium text-neutral-900 text-sm">{achievement.name}</p>
              <p className="text-xs text-neutral-500">{achievement.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
