import {
  FileText,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  ChevronRight,
  Eye,
  Download,
} from 'lucide-react';
import { cn } from '@/utils';
import type { CounselorReport } from '@/types';
import { CONCERN_LEVEL_CONFIG, REPORT_TYPE_CONFIG, MOOD_TREND_CONFIG } from '@/types/counselorReports';

interface ReportCardProps {
  report: CounselorReport;
  onView: (report: CounselorReport) => void;
  onDownload?: (report: CounselorReport) => void;
  className?: string;
}

export function ReportCard({ report, onView, onDownload, className }: ReportCardProps) {
  const reportConfig = REPORT_TYPE_CONFIG[report.reportType];
  const concernConfig = CONCERN_LEVEL_CONFIG[report.concernLevel];
  const moodConfig = report.moodTrend ? MOOD_TREND_CONFIG[report.moodTrend] : null;

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div
      className={cn(
        'bg-white rounded-xl border border-neutral-200 overflow-hidden hover:shadow-lg transition-all cursor-pointer',
        !report.isReadByParent && 'ring-2 ring-primary ring-offset-2',
        className
      )}
      onClick={() => onView(report)}
    >
      {/* Header */}
      <div
        className="px-4 py-3 flex items-center justify-between"
        style={{ backgroundColor: `${reportConfig.color}10` }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: reportConfig.color }}
          >
            <FileText className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="text-sm font-medium text-neutral-900">{reportConfig.label}</span>
            {!report.isReadByParent && (
              <span className="ml-2 text-xs bg-primary text-white px-2 py-0.5 rounded-full">New</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 text-xs text-neutral-500">
          <Calendar className="w-3 h-3" />
          {formatDate(report.createdAt)}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Student & Period */}
        <div className="mb-3">
          <h3 className="font-semibold text-neutral-900">{report.studentName}</h3>
          <p className="text-sm text-neutral-500">
            {formatDate(report.reportPeriodStart)} - {formatDate(report.reportPeriodEnd)}
          </p>
        </div>

        {/* Summary */}
        <p className="text-sm text-neutral-600 line-clamp-2 mb-4">{report.summary}</p>

        {/* Key Metrics */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {/* Wellbeing Score */}
          {report.wellbeingScore && (
            <div className="text-center p-2 bg-neutral-50 rounded-lg">
              <div className="text-lg font-bold text-neutral-900">{report.wellbeingScore}%</div>
              <div className="text-xs text-neutral-500">Wellbeing</div>
            </div>
          )}

          {/* Sessions */}
          <div className="text-center p-2 bg-neutral-50 rounded-lg">
            <div className="text-lg font-bold text-neutral-900">{report.counselorSessionsCount}</div>
            <div className="text-xs text-neutral-500">Sessions</div>
          </div>

          {/* Study Hours */}
          <div className="text-center p-2 bg-neutral-50 rounded-lg">
            <div className="text-lg font-bold text-neutral-900">{report.platformUsageHours.toFixed(1)}h</div>
            <div className="text-xs text-neutral-500">Study Time</div>
          </div>
        </div>

        {/* Status Badges */}
        <div className="flex items-center gap-2 flex-wrap mb-4">
          {/* Concern Level */}
          <div
            className="flex items-center gap-1 text-xs px-2 py-1 rounded-full"
            style={{ backgroundColor: concernConfig.bgColor, color: concernConfig.color }}
          >
            {report.concernLevel === 'none' ? (
              <CheckCircle className="w-3 h-3" />
            ) : (
              <AlertTriangle className="w-3 h-3" />
            )}
            {concernConfig.label}
          </div>

          {/* Mood Trend */}
          {moodConfig && (
            <div
              className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-neutral-100"
              style={{ color: moodConfig.color }}
            >
              <span>{moodConfig.label}</span>
            </div>
          )}

          {/* Follow-up Needed */}
          {report.followUpNeeded && (
            <div className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-orange-100 text-orange-700">
              <Clock className="w-3 h-3" />
              Follow-up Needed
            </div>
          )}
        </div>

        {/* Key Insights Preview */}
        {report.keyInsights.length > 0 && (
          <div className="border-t border-neutral-100 pt-3">
            <p className="text-xs font-medium text-neutral-700 mb-2">Key Insights:</p>
            <ul className="text-xs text-neutral-600 space-y-1">
              {report.keyInsights.slice(0, 2).map((insight, i) => (
                <li key={i} className="flex items-start gap-1">
                  <span className="text-primary">•</span>
                  <span className="line-clamp-1">{insight}</span>
                </li>
              ))}
              {report.keyInsights.length > 2 && (
                <li className="text-primary text-xs">+{report.keyInsights.length - 2} more insights</li>
              )}
            </ul>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-neutral-100 flex items-center justify-between bg-neutral-50">
        <div className="flex items-center gap-2">
          {report.isReadByParent ? (
            <span className="flex items-center gap-1 text-xs text-neutral-500">
              <Eye className="w-3 h-3" />
              Viewed {report.readAt ? formatDate(report.readAt) : ''}
            </span>
          ) : (
            <span className="text-xs text-primary font-medium">Tap to view report</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {onDownload && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDownload(report);
              }}
              className="p-1.5 rounded-lg hover:bg-neutral-200 text-neutral-500 hover:text-neutral-700 transition-colors"
            >
              <Download className="w-4 h-4" />
            </button>
          )}
          <ChevronRight className="w-5 h-5 text-neutral-400" />
        </div>
      </div>
    </div>
  );
}
