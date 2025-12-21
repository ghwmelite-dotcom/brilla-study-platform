import {
  AlertTriangle,
  AlertCircle,
  AlertOctagon,
  Info,
  Clock,
  CheckCircle,
  MessageSquare,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/utils';
import type { WellbeingAlert } from '@/types';
import { ALERT_SEVERITY_CONFIG } from '@/types/counselorReports';

interface AlertCardProps {
  alert: WellbeingAlert;
  onAcknowledge?: (alertId: string) => void;
  onResolve?: (alertId: string) => void;
  onViewDetails?: (alert: WellbeingAlert) => void;
  compact?: boolean;
  className?: string;
}

const alertTypeLabels: Record<string, { label: string; icon: React.ElementType }> = {
  stress: { label: 'Stress Detected', icon: AlertTriangle },
  mood_decline: { label: 'Mood Decline', icon: AlertCircle },
  inactivity: { label: 'Low Activity', icon: Clock },
  concerning_content: { label: 'Concerning Content', icon: AlertOctagon },
  academic_struggle: { label: 'Academic Struggle', icon: Info },
};

export function AlertCard({
  alert,
  onAcknowledge,
  onResolve,
  onViewDetails,
  compact = false,
  className,
}: AlertCardProps) {
  const severityConfig = ALERT_SEVERITY_CONFIG[alert.severity];
  const typeConfig = alertTypeLabels[alert.alertType] || { label: alert.alertType, icon: AlertTriangle };
  const TypeIcon = typeConfig.icon;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (compact) {
    return (
      <div
        className={cn(
          'flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-neutral-50 transition-colors',
          !alert.isResolved && 'bg-white border',
          alert.isResolved && 'bg-neutral-50',
          className
        )}
        style={{
          borderColor: !alert.isResolved ? severityConfig.color : undefined,
        }}
        onClick={() => onViewDetails?.(alert)}
      >
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: severityConfig.bgColor }}
        >
          <TypeIcon className="w-4 h-4" style={{ color: severityConfig.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm text-neutral-900 truncate">{alert.studentName}</span>
            <span
              className="text-xs px-1.5 py-0.5 rounded"
              style={{ backgroundColor: severityConfig.bgColor, color: severityConfig.color }}
            >
              {severityConfig.label}
            </span>
          </div>
          <p className="text-xs text-neutral-500 truncate">{typeConfig.label}</p>
        </div>
        <span className="text-xs text-neutral-400">{formatDate(alert.createdAt)}</span>
        <ChevronRight className="w-4 h-4 text-neutral-400" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        'bg-white rounded-xl border overflow-hidden',
        alert.isResolved ? 'opacity-75' : '',
        className
      )}
      style={{
        borderColor: !alert.isResolved ? severityConfig.color : '#E5E7EB',
      }}
    >
      {/* Header */}
      <div
        className="px-4 py-3 flex items-center gap-3"
        style={{ backgroundColor: severityConfig.bgColor }}
      >
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{ backgroundColor: 'white' }}
        >
          <TypeIcon className="w-5 h-5" style={{ color: severityConfig.color }} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-neutral-900">{typeConfig.label}</span>
            <span
              className="text-xs px-2 py-0.5 rounded-full"
              style={{ backgroundColor: severityConfig.color, color: 'white' }}
            >
              {severityConfig.label}
            </span>
          </div>
          <p className="text-sm text-neutral-600">{alert.studentName}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-neutral-500">{formatDate(alert.createdAt)}</p>
          {alert.isResolved && (
            <span className="text-xs text-green-600 flex items-center gap-1 justify-end mt-1">
              <CheckCircle className="w-3 h-3" />
              Resolved
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <p className="text-neutral-700 mb-4">{alert.description}</p>

        {/* Triggered By */}
        {alert.triggeredBy && (
          <p className="text-xs text-neutral-500 mb-4">
            Detected via: <span className="font-medium">{alert.triggeredBy.replace('_', ' ')}</span>
          </p>
        )}

        {/* Resolution Notes */}
        {alert.isResolved && alert.resolutionNotes && (
          <div className="bg-green-50 rounded-lg p-3 mb-4">
            <p className="text-sm text-green-700">
              <span className="font-medium">Resolution:</span> {alert.resolutionNotes}
            </p>
            {alert.resolvedAt && (
              <p className="text-xs text-green-600 mt-1">
                Resolved on {new Date(alert.resolvedAt).toLocaleDateString()}
              </p>
            )}
          </div>
        )}

        {/* Notification Status */}
        {alert.parentNotified && !alert.isResolved && (
          <div className="flex items-center gap-2 text-xs text-neutral-500 mb-4">
            <MessageSquare className="w-3 h-3" />
            Notified via {alert.notificationMethod} on{' '}
            {alert.notifiedAt && new Date(alert.notifiedAt).toLocaleDateString()}
          </div>
        )}

        {/* Actions */}
        {!alert.isResolved && (
          <div className="flex items-center gap-2 pt-3 border-t border-neutral-100">
            {!alert.parentNotified && onAcknowledge && (
              <button
                onClick={() => onAcknowledge(alert.id)}
                className="flex-1 py-2 px-4 bg-neutral-100 text-neutral-700 rounded-lg text-sm font-medium hover:bg-neutral-200 transition-colors"
              >
                Acknowledge
              </button>
            )}
            {onResolve && (
              <button
                onClick={() => onResolve(alert.id)}
                className="flex-1 py-2 px-4 bg-green-100 text-green-700 rounded-lg text-sm font-medium hover:bg-green-200 transition-colors"
              >
                Mark Resolved
              </button>
            )}
            {onViewDetails && (
              <button
                onClick={() => onViewDetails(alert)}
                className="py-2 px-4 border border-neutral-200 text-neutral-700 rounded-lg text-sm font-medium hover:bg-neutral-50 transition-colors"
              >
                View Details
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
