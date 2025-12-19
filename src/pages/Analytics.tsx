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
} from '@/components/analytics';
import type {
  DailyProgress,
  SubjectPerformance,
  TopicStrength,
  StudyHeatmapData,
} from '@/utils/analyticsUtils';
import {
  generateEmptyHeatmap,
  getHeatmapLevel,
  calculateAccuracy,
  calculatePredictedNsmqScore,
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
    // Simulate loading analytics data
    const loadAnalytics = async () => {
      setIsLoading(true);

      // Generate demo weekly progress
      const demoProgress: DailyProgress[] = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const questions = Math.floor(Math.random() * 30) + 5;
        const correct = Math.floor(questions * (0.6 + Math.random() * 0.3));
        demoProgress.push({
          date: date.toISOString().split('T')[0],
          questionsAttempted: questions,
          questionsCorrect: correct,
          accuracy: calculateAccuracy(correct, questions),
          xpEarned: correct * 10 + Math.floor(Math.random() * 50),
        });
      }
      setWeeklyProgress(demoProgress);

      // Generate demo subject performance
      setSubjectPerformance([
        { subject: 'Mathematics', subjectId: 'sub_math', totalQuestions: 150, correctAnswers: 120, accuracy: 80, masteryLevel: 75, color: '#3B82F6' },
        { subject: 'Physics', subjectId: 'sub_physics', totalQuestions: 100, correctAnswers: 70, accuracy: 70, masteryLevel: 65, color: '#8B5CF6' },
        { subject: 'Chemistry', subjectId: 'sub_chem', totalQuestions: 80, correctAnswers: 60, accuracy: 75, masteryLevel: 60, color: '#22C55E' },
        { subject: 'Biology', subjectId: 'sub_bio', totalQuestions: 60, correctAnswers: 50, accuracy: 83, masteryLevel: 55, color: '#F59E0B' },
      ]);

      // Generate demo strengths
      setStrengths([
        { topicId: 'top_alg', topicName: 'Algebra', subjectName: 'Mathematics', masteryLevel: 92, questionsAttempted: 45, accuracy: 90, isStrength: true },
        { topicId: 'top_mech', topicName: 'Mechanics', subjectName: 'Physics', masteryLevel: 85, questionsAttempted: 30, accuracy: 87, isStrength: true },
        { topicId: 'top_org', topicName: 'Organic Chemistry', subjectName: 'Chemistry', masteryLevel: 80, questionsAttempted: 25, accuracy: 82, isStrength: true },
      ]);

      // Generate demo weaknesses
      setWeaknesses([
        { topicId: 'top_calc', topicName: 'Calculus', subjectName: 'Mathematics', masteryLevel: 35, questionsAttempted: 20, accuracy: 45, isStrength: false },
        { topicId: 'top_thermo', topicName: 'Thermodynamics', subjectName: 'Physics', masteryLevel: 40, questionsAttempted: 15, accuracy: 50, isStrength: false },
        { topicId: 'top_genetics', topicName: 'Genetics', subjectName: 'Biology', masteryLevel: 45, questionsAttempted: 18, accuracy: 52, isStrength: false },
      ]);

      // Generate heatmap data (last 90 days)
      const heatmap = generateEmptyHeatmap(90);
      heatmap.forEach((day) => {
        const count = Math.floor(Math.random() * 40);
        day.count = count;
        day.level = getHeatmapLevel(count);
      });
      setHeatmapData(heatmap);

      // Calculate predicted score
      const score = calculatePredictedNsmqScore({
        accuracy: 75,
        averageTime: 18,
        subjectCoverage: 70,
        questionCount: 390,
      });
      setPredictedScore(score);

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
