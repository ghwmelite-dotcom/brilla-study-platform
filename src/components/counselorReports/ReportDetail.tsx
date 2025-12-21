import { useState, useEffect } from 'react';
import {
  ArrowLeft,
  FileText,
  Calendar,
  BookOpen,
  Heart,
  Target,
  Lightbulb,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Minus,
  Activity,
  Clock,
  MessageSquare,
  Download,
  Printer,
} from 'lucide-react';
import { cn } from '@/utils';
import type { CounselorReport, SubjectPerformance, StudentGoal, Recommendation } from '@/types';
import {
  CONCERN_LEVEL_CONFIG,
  REPORT_TYPE_CONFIG,
  MOOD_TREND_CONFIG,
} from '@/types/counselorReports';

interface ReportDetailProps {
  report: CounselorReport;
  onBack: () => void;
  onMarkAsRead?: () => void;
  onSubmitFeedback?: (feedback: string) => void;
  onDownload?: () => void;
  onPrint?: () => void;
}

export function ReportDetail({
  report,
  onBack,
  onMarkAsRead,
  onSubmitFeedback,
  onDownload,
  onPrint,
}: ReportDetailProps) {
  const [activeSection, setActiveSection] = useState<string>('overview');
  const [feedback, setFeedback] = useState(report.parentFeedback || '');
  const [showFeedbackInput, setShowFeedbackInput] = useState(false);

  const reportConfig = REPORT_TYPE_CONFIG[report.reportType];
  const concernConfig = CONCERN_LEVEL_CONFIG[report.concernLevel];
  const moodConfig = report.moodTrend ? MOOD_TREND_CONFIG[report.moodTrend] : null;

  useEffect(() => {
    if (!report.isReadByParent && onMarkAsRead) {
      onMarkAsRead();
    }
  }, [report.isReadByParent, onMarkAsRead]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const sections = [
    { id: 'overview', label: 'Overview', icon: FileText },
    { id: 'academic', label: 'Academic', icon: BookOpen },
    { id: 'wellbeing', label: 'Wellbeing', icon: Heart },
    { id: 'goals', label: 'Goals', icon: Target },
    { id: 'recommendations', label: 'Actions', icon: Lightbulb },
  ];

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-neutral-600 hover:text-neutral-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Reports</span>
            </button>
            <div className="flex items-center gap-2">
              {onPrint && (
                <button
                  onClick={onPrint}
                  className="p-2 rounded-lg hover:bg-neutral-100 text-neutral-500"
                >
                  <Printer className="w-5 h-5" />
                </button>
              )}
              {onDownload && (
                <button
                  onClick={onDownload}
                  className="p-2 rounded-lg hover:bg-neutral-100 text-neutral-500"
                >
                  <Download className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Report Header */}
        <div className="bg-white rounded-xl border border-neutral-200 p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-4">
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: reportConfig.color }}
              >
                <FileText className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-neutral-900">{reportConfig.label}</h1>
                <p className="text-neutral-500">{report.studentName}</p>
              </div>
            </div>
            <div
              className="flex items-center gap-1 px-3 py-1.5 rounded-full text-sm"
              style={{ backgroundColor: concernConfig.bgColor, color: concernConfig.color }}
            >
              {report.concernLevel === 'none' ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <AlertTriangle className="w-4 h-4" />
              )}
              {concernConfig.label}
            </div>
          </div>

          <div className="flex items-center gap-4 text-sm text-neutral-500 mb-4">
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {formatDate(report.reportPeriodStart)} - {formatDate(report.reportPeriodEnd)}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              Generated {formatDate(report.createdAt)}
            </span>
          </div>

          <p className="text-neutral-700 leading-relaxed">{report.summary}</p>

          {/* Key Insights */}
          {report.keyInsights.length > 0 && (
            <div className="mt-4 p-4 bg-primary/5 rounded-lg">
              <h3 className="font-semibold text-neutral-900 mb-2 flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-primary" />
                Key Insights
              </h3>
              <ul className="space-y-2">
                {report.keyInsights.map((insight, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-neutral-700">
                    <span className="text-primary font-bold">•</span>
                    {insight}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Section Navigation */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors',
                  activeSection === section.id
                    ? 'bg-primary text-white'
                    : 'bg-white text-neutral-600 hover:bg-neutral-100 border border-neutral-200'
                )}
              >
                <Icon className="w-4 h-4" />
                {section.label}
              </button>
            );
          })}
        </div>

        {/* Section Content */}
        <div className="space-y-6">
          {/* Overview Section */}
          {activeSection === 'overview' && (
            <>
              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard
                  label="Wellbeing Score"
                  value={`${report.wellbeingScore || 0}%`}
                  icon={Heart}
                  color="#10B981"
                />
                <StatCard
                  label="Study Hours"
                  value={`${report.platformUsageHours.toFixed(1)}h`}
                  icon={Clock}
                  color="#3B82F6"
                />
                <StatCard
                  label="Counselor Sessions"
                  value={report.counselorSessionsCount.toString()}
                  icon={MessageSquare}
                  color="#8B5CF6"
                />
                <StatCard
                  label="Goals In Progress"
                  value={report.goalsInProgress.length.toString()}
                  icon={Target}
                  color="#F59E0B"
                />
              </div>

              {/* Topics Discussed */}
              {report.topicsDiscussed.length > 0 && (
                <div className="bg-white rounded-xl border border-neutral-200 p-6">
                  <h3 className="font-semibold text-neutral-900 mb-4">Topics Discussed with Counselor</h3>
                  <div className="flex flex-wrap gap-2">
                    {report.topicsDiscussed.map((topic, i) => (
                      <span
                        key={i}
                        className="px-3 py-1.5 bg-neutral-100 text-neutral-700 rounded-full text-sm"
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Study Patterns */}
              {report.studyPatterns && (
                <div className="bg-white rounded-xl border border-neutral-200 p-6">
                  <h3 className="font-semibold text-neutral-900 mb-4">Study Patterns</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="p-3 bg-neutral-50 rounded-lg">
                      <p className="text-2xl font-bold text-neutral-900">
                        {report.studyPatterns.averageStudyHoursPerDay.toFixed(1)}h
                      </p>
                      <p className="text-sm text-neutral-500">Avg. Daily Study</p>
                    </div>
                    <div className="p-3 bg-neutral-50 rounded-lg">
                      <p className="text-2xl font-bold text-neutral-900">
                        {report.studyPatterns.studyStreak} days
                      </p>
                      <p className="text-sm text-neutral-500">Current Streak</p>
                    </div>
                    <div className="p-3 bg-neutral-50 rounded-lg">
                      <p className="text-2xl font-bold text-neutral-900 capitalize">
                        {report.studyPatterns.consistency}
                      </p>
                      <p className="text-sm text-neutral-500">Consistency</p>
                    </div>
                  </div>
                  {report.studyPatterns.peakStudyHours.length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm text-neutral-600">
                        <strong>Peak Study Hours:</strong> {report.studyPatterns.peakStudyHours.join(', ')}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* Academic Section */}
          {activeSection === 'academic' && (
            <>
              {report.academicSummary && (
                <div className="bg-white rounded-xl border border-neutral-200 p-6">
                  <h3 className="font-semibold text-neutral-900 mb-3">Academic Summary</h3>
                  <p className="text-neutral-700">{report.academicSummary}</p>
                </div>
              )}

              {/* Strengths & Challenges */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-white rounded-xl border border-neutral-200 p-6">
                  <h3 className="font-semibold text-green-700 mb-3 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    Strengths
                  </h3>
                  <ul className="space-y-2">
                    {report.academicStrengths.map((strength, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-neutral-700">
                        <span className="text-green-500">✓</span>
                        {strength}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-white rounded-xl border border-neutral-200 p-6">
                  <h3 className="font-semibold text-orange-700 mb-3 flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    Areas for Growth
                  </h3>
                  <ul className="space-y-2">
                    {report.academicChallenges.map((challenge, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-neutral-700">
                        <span className="text-orange-500">→</span>
                        {challenge}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Subject Performance */}
              {report.subjectPerformance.length > 0 && (
                <div className="bg-white rounded-xl border border-neutral-200 p-6">
                  <h3 className="font-semibold text-neutral-900 mb-4">Subject Performance</h3>
                  <div className="space-y-4">
                    {report.subjectPerformance.map((subject) => (
                      <SubjectPerformanceCard key={subject.subjectId} subject={subject} />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Wellbeing Section */}
          {activeSection === 'wellbeing' && (
            <>
              <div className="grid md:grid-cols-2 gap-4">
                {/* Wellbeing Score */}
                <div className="bg-white rounded-xl border border-neutral-200 p-6">
                  <h3 className="font-semibold text-neutral-900 mb-4">Wellbeing Score</h3>
                  <div className="flex items-center gap-4">
                    <div
                      className="w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold"
                      style={{
                        backgroundColor: `${report.wellbeingScore && report.wellbeingScore >= 70 ? '#10B981' : report.wellbeingScore && report.wellbeingScore >= 50 ? '#F59E0B' : '#EF4444'}20`,
                        color: report.wellbeingScore && report.wellbeingScore >= 70 ? '#10B981' : report.wellbeingScore && report.wellbeingScore >= 50 ? '#F59E0B' : '#EF4444',
                      }}
                    >
                      {report.wellbeingScore || 0}%
                    </div>
                    <div>
                      {moodConfig && (
                        <div className="flex items-center gap-2 mb-2">
                          <Activity className="w-4 h-4" style={{ color: moodConfig.color }} />
                          <span className="font-medium" style={{ color: moodConfig.color }}>
                            {moodConfig.label} Trend
                          </span>
                        </div>
                      )}
                      <p className="text-sm text-neutral-500">Based on counselor interactions and activity patterns</p>
                    </div>
                  </div>
                </div>

                {/* Stress Indicators */}
                {report.stressIndicators.length > 0 && (
                  <div className="bg-white rounded-xl border border-neutral-200 p-6">
                    <h3 className="font-semibold text-neutral-900 mb-4">Stress Indicators</h3>
                    <ul className="space-y-2">
                      {report.stressIndicators.map((indicator, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-neutral-700">
                          <AlertTriangle className="w-4 h-4 text-orange-500 mt-0.5" />
                          {indicator}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {report.wellbeingSummary && (
                <div className="bg-white rounded-xl border border-neutral-200 p-6">
                  <h3 className="font-semibold text-neutral-900 mb-3">Wellbeing Summary</h3>
                  <p className="text-neutral-700">{report.wellbeingSummary}</p>
                </div>
              )}

              {/* Concern Areas */}
              {report.concernAreas.length > 0 && (
                <div
                  className="rounded-xl border p-6"
                  style={{ backgroundColor: concernConfig.bgColor, borderColor: concernConfig.color }}
                >
                  <h3 className="font-semibold mb-3 flex items-center gap-2" style={{ color: concernConfig.color }}>
                    <AlertTriangle className="w-5 h-5" />
                    Areas of Concern
                  </h3>
                  <ul className="space-y-2">
                    {report.concernAreas.map((concern, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm" style={{ color: concernConfig.color }}>
                        <span>•</span>
                        {concern}
                      </li>
                    ))}
                  </ul>
                  {report.professionalReferralSuggested && (
                    <div className="mt-4 p-3 bg-white/50 rounded-lg">
                      <p className="text-sm font-medium" style={{ color: concernConfig.color }}>
                        Professional support may be beneficial. Consider consulting with a school counselor or mental health professional.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* Goals Section */}
          {activeSection === 'goals' && (
            <>
              {/* Goals In Progress */}
              {report.goalsInProgress.length > 0 && (
                <div className="bg-white rounded-xl border border-neutral-200 p-6">
                  <h3 className="font-semibold text-neutral-900 mb-4 flex items-center gap-2">
                    <Target className="w-5 h-5 text-blue-500" />
                    Goals In Progress
                  </h3>
                  <div className="space-y-3">
                    {report.goalsInProgress.map((goal) => (
                      <GoalCard key={goal.id} goal={goal} />
                    ))}
                  </div>
                </div>
              )}

              {/* Achieved Goals */}
              {report.goalsAchieved.length > 0 && (
                <div className="bg-white rounded-xl border border-neutral-200 p-6">
                  <h3 className="font-semibold text-green-700 mb-4 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    Goals Achieved
                  </h3>
                  <div className="space-y-3">
                    {report.goalsAchieved.map((goal) => (
                      <GoalCard key={goal.id} goal={goal} />
                    ))}
                  </div>
                </div>
              )}

              {/* All Goals Set */}
              {report.goalsSet.length > 0 && (
                <div className="bg-white rounded-xl border border-neutral-200 p-6">
                  <h3 className="font-semibold text-neutral-900 mb-4">All Goals This Period</h3>
                  <div className="space-y-3">
                    {report.goalsSet.map((goal) => (
                      <GoalCard key={goal.id} goal={goal} />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Recommendations Section */}
          {activeSection === 'recommendations' && (
            <>
              {/* AI Recommendations */}
              {report.recommendations.length > 0 && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-neutral-900 flex items-center gap-2">
                    <Lightbulb className="w-5 h-5 text-primary" />
                    Personalized Recommendations
                  </h3>
                  {report.recommendations.map((rec) => (
                    <RecommendationCard key={rec.id} recommendation={rec} />
                  ))}
                </div>
              )}

              {/* Parent Action Items */}
              {report.parentActionItems.length > 0 && (
                <div className="bg-primary/5 rounded-xl border border-primary/20 p-6">
                  <h3 className="font-semibold text-primary mb-4 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    Suggested Actions for Parents
                  </h3>
                  <ul className="space-y-3">
                    {report.parentActionItems.map((item, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <span className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-sm font-medium flex-shrink-0">
                          {i + 1}
                        </span>
                        <span className="text-neutral-700">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Follow-up Notice */}
              {report.followUpNeeded && (
                <div className="bg-orange-50 rounded-xl border border-orange-200 p-6">
                  <h3 className="font-semibold text-orange-700 mb-2 flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Follow-up Recommended
                  </h3>
                  <p className="text-orange-700">{report.followUpReason}</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Feedback Section */}
        <div className="mt-8 bg-white rounded-xl border border-neutral-200 p-6">
          <h3 className="font-semibold text-neutral-900 mb-4">Your Feedback</h3>
          {report.parentFeedback && !showFeedbackInput ? (
            <div>
              <p className="text-neutral-700 bg-neutral-50 p-4 rounded-lg mb-3">{report.parentFeedback}</p>
              <button
                onClick={() => setShowFeedbackInput(true)}
                className="text-sm text-primary hover:underline"
              >
                Edit feedback
              </button>
            </div>
          ) : (
            <div>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Share your thoughts on this report or any concerns you'd like to discuss..."
                className="w-full p-3 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                rows={4}
              />
              <div className="flex justify-end gap-2 mt-3">
                {showFeedbackInput && (
                  <button
                    onClick={() => setShowFeedbackInput(false)}
                    className="px-4 py-2 text-neutral-600 hover:bg-neutral-100 rounded-lg"
                  >
                    Cancel
                  </button>
                )}
                <button
                  onClick={() => {
                    if (onSubmitFeedback && feedback.trim()) {
                      onSubmitFeedback(feedback);
                      setShowFeedbackInput(false);
                    }
                  }}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark"
                >
                  Submit Feedback
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Sub-components
function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-neutral-200 p-4">
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${color}15` }}
        >
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        <div>
          <p className="text-2xl font-bold text-neutral-900">{value}</p>
          <p className="text-sm text-neutral-500">{label}</p>
        </div>
      </div>
    </div>
  );
}

function SubjectPerformanceCard({ subject }: { subject: SubjectPerformance }) {
  const getTrendIcon = () => {
    switch (subject.trend) {
      case 'improving':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'declining':
        return <TrendingDown className="w-4 h-4 text-red-500" />;
      default:
        return <Minus className="w-4 h-4 text-neutral-400" />;
    }
  };

  return (
    <div className="border border-neutral-100 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-medium text-neutral-900">{subject.subjectName}</h4>
        <div className="flex items-center gap-2">
          {getTrendIcon()}
          <span className="text-lg font-bold text-neutral-900">{subject.averageScore}%</span>
        </div>
      </div>
      <div className="w-full bg-neutral-100 rounded-full h-2 mb-3">
        <div
          className="h-2 rounded-full bg-primary"
          style={{ width: `${subject.accuracy}%` }}
        />
      </div>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-neutral-500">Questions</p>
          <p className="font-medium">{subject.questionsAttempted}</p>
        </div>
        <div>
          <p className="text-neutral-500">Time Spent</p>
          <p className="font-medium">{Math.round(subject.timeSpentMinutes / 60)}h {subject.timeSpentMinutes % 60}m</p>
        </div>
      </div>
      {subject.strengths.length > 0 && (
        <div className="mt-3 pt-3 border-t border-neutral-100">
          <p className="text-xs text-neutral-500 mb-1">Strengths: {subject.strengths.join(', ')}</p>
          {subject.areasForImprovement.length > 0 && (
            <p className="text-xs text-neutral-500">Focus areas: {subject.areasForImprovement.join(', ')}</p>
          )}
        </div>
      )}
    </div>
  );
}

function GoalCard({ goal }: { goal: StudentGoal }) {
  const statusColors = {
    not_started: { bg: 'bg-neutral-100', text: 'text-neutral-600' },
    in_progress: { bg: 'bg-blue-100', text: 'text-blue-700' },
    achieved: { bg: 'bg-green-100', text: 'text-green-700' },
    missed: { bg: 'bg-red-100', text: 'text-red-700' },
  };

  const colors = statusColors[goal.status];

  return (
    <div className="border border-neutral-100 rounded-lg p-4">
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-medium text-neutral-900">{goal.title}</h4>
        <span className={cn('text-xs px-2 py-1 rounded-full capitalize', colors.bg, colors.text)}>
          {goal.status.replace('_', ' ')}
        </span>
      </div>
      {goal.description && <p className="text-sm text-neutral-500 mb-3">{goal.description}</p>}
      <div className="flex items-center gap-3">
        <div className="flex-1 bg-neutral-100 rounded-full h-2">
          <div
            className={cn('h-2 rounded-full', goal.status === 'achieved' ? 'bg-green-500' : 'bg-primary')}
            style={{ width: `${goal.progress}%` }}
          />
        </div>
        <span className="text-sm font-medium text-neutral-600">{goal.progress}%</span>
      </div>
    </div>
  );
}

function RecommendationCard({ recommendation }: { recommendation: Recommendation }) {
  const priorityColors = {
    high: { bg: 'bg-red-50', border: 'border-red-200', badge: 'bg-red-100 text-red-700' },
    medium: { bg: 'bg-orange-50', border: 'border-orange-200', badge: 'bg-orange-100 text-orange-700' },
    low: { bg: 'bg-blue-50', border: 'border-blue-200', badge: 'bg-blue-100 text-blue-700' },
  };

  const colors = priorityColors[recommendation.priority];

  return (
    <div className={cn('rounded-xl border p-5', colors.bg, colors.border)}>
      <div className="flex items-start justify-between mb-3">
        <h4 className="font-semibold text-neutral-900">{recommendation.title}</h4>
        <span className={cn('text-xs px-2 py-1 rounded-full capitalize', colors.badge)}>
          {recommendation.priority} priority
        </span>
      </div>
      <p className="text-neutral-700 text-sm mb-4">{recommendation.description}</p>
      {recommendation.actionSteps.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-neutral-600 uppercase">Action Steps:</p>
          <ul className="space-y-1">
            {recommendation.actionSteps.map((step, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-neutral-700">
                <span className="w-5 h-5 rounded-full bg-white flex items-center justify-center text-xs font-medium flex-shrink-0">
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ul>
        </div>
      )}
      {recommendation.targetAudience !== 'student' && (
        <div className="mt-3 pt-3 border-t border-neutral-200/50">
          <span className="text-xs text-neutral-500">
            For: {recommendation.targetAudience === 'both' ? 'Student & Parent' : 'Parent'}
          </span>
        </div>
      )}
    </div>
  );
}
