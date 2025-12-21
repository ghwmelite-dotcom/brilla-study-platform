import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  FileText,
  Search,
  Calendar,
  AlertTriangle,
  Bell,
  RefreshCw,
} from 'lucide-react';
import { Card, Button, Badge } from '@/components/common';
import { useAuthStore, useCounselorReportsStore } from '@/stores';
import { ReportCard, ReportDetail, AlertCard } from '@/components/counselorReports';
import { cn } from '@/utils';
import type { ReportType } from '@/types';
import { REPORT_TYPE_CONFIG } from '@/types/counselorReports';

export function ParentReportsPage() {
  const { reportId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const {
    linkedStudents,
    reports,
    currentReport,
    alerts,
    isLoadingReports,
    loadLinkedStudents,
    loadReports,
    loadReport,
    loadAlerts,
    markReportAsRead,
    submitReportFeedback,
  } = useCounselorReportsStore();

  const [activeTab, setActiveTab] = useState<'reports' | 'alerts'>('reports');
  const [selectedStudent, setSelectedStudent] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<ReportType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Load data on mount
  useEffect(() => {
    loadLinkedStudents();
    loadReports();
    loadAlerts();
  }, []);

  // Load specific report if ID is in URL
  useEffect(() => {
    if (reportId) {
      loadReport(reportId);
    }
  }, [reportId]);

  // Filter reports
  const filteredReports = reports.filter((report) => {
    if (selectedStudent !== 'all' && report.studentId !== selectedStudent) return false;
    if (selectedType !== 'all' && report.reportType !== selectedType) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        report.summary.toLowerCase().includes(query) ||
        report.studentName?.toLowerCase().includes(query) ||
        report.keyInsights.some(i => i.toLowerCase().includes(query))
      );
    }
    return true;
  });

  // Filter alerts
  const filteredAlerts = alerts.filter((alert) => {
    if (selectedStudent !== 'all' && alert.studentId !== selectedStudent) return false;
    return true;
  });

  const unresolvedAlerts = filteredAlerts.filter(a => !a.isResolved);
  const unreadReports = filteredReports.filter(r => !r.isReadByParent);

  if (!user || user.role !== 'parent') {
    return (
      <div className="text-center py-12">
        <p className="text-neutral-500">Access denied. Parent account required.</p>
      </div>
    );
  }

  // Show detailed report view if a report is selected
  if (reportId && currentReport) {
    return (
      <ReportDetail
        report={currentReport}
        onBack={() => navigate('/parent/reports')}
        onMarkAsRead={() => markReportAsRead(currentReport.id)}
        onSubmitFeedback={(feedback) => submitReportFeedback(currentReport.id, feedback)}
        onDownload={() => {
          // TODO: Implement PDF download
          console.log('Download report:', currentReport.id);
        }}
        onPrint={() => window.print()}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/parent')}
            className="p-2 rounded-lg hover:bg-neutral-100 text-neutral-500"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-display font-bold text-neutral-900">
              Counselor Reports
            </h1>
            <p className="text-neutral-500">
              View detailed insights about your ward's wellbeing and academic progress
            </p>
          </div>
        </div>
        <Button
          variant="primary"
          leftIcon={<RefreshCw className="w-4 h-4" />}
          onClick={() => {
            loadReports();
            loadAlerts();
          }}
          disabled={isLoadingReports}
        >
          {isLoadingReports ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-100 rounded-lg">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-900">{reports.length}</p>
              <p className="text-xs text-neutral-500">Total Reports</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Bell className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-900">{unreadReports.length}</p>
              <p className="text-xs text-neutral-500">Unread Reports</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-900">{unresolvedAlerts.length}</p>
              <p className="text-xs text-neutral-500">Active Alerts</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Calendar className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-900">
                {reports.filter(r => {
                  const date = new Date(r.createdAt);
                  const now = new Date();
                  return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
                }).length}
              </p>
              <p className="text-xs text-neutral-500">This Month</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-neutral-200">
        <button
          onClick={() => setActiveTab('reports')}
          className={cn(
            'pb-3 text-sm font-medium transition-colors flex items-center gap-2',
            activeTab === 'reports'
              ? 'text-primary border-b-2 border-primary'
              : 'text-neutral-500 hover:text-neutral-700'
          )}
        >
          <FileText className="w-4 h-4" />
          Reports
          {unreadReports.length > 0 && (
            <Badge variant="primary" size="sm">{unreadReports.length}</Badge>
          )}
        </button>
        <button
          onClick={() => setActiveTab('alerts')}
          className={cn(
            'pb-3 text-sm font-medium transition-colors flex items-center gap-2',
            activeTab === 'alerts'
              ? 'text-primary border-b-2 border-primary'
              : 'text-neutral-500 hover:text-neutral-700'
          )}
        >
          <AlertTriangle className="w-4 h-4" />
          Alerts
          {unresolvedAlerts.length > 0 && (
            <Badge variant="warning" size="sm">{unresolvedAlerts.length}</Badge>
          )}
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            placeholder="Search reports..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>

        {/* Student Filter */}
        <select
          value={selectedStudent}
          onChange={(e) => setSelectedStudent(e.target.value)}
          className="px-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
        >
          <option value="all">All Students</option>
          {linkedStudents.map((link) => (
            <option key={link.studentId} value={link.studentId}>
              {link.studentName}
            </option>
          ))}
        </select>

        {/* Type Filter (only for reports tab) */}
        {activeTab === 'reports' && (
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value as ReportType | 'all')}
            className="px-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="all">All Types</option>
            {(Object.keys(REPORT_TYPE_CONFIG) as ReportType[]).map((type) => (
              <option key={type} value={type}>
                {REPORT_TYPE_CONFIG[type].label}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Content */}
      {activeTab === 'reports' ? (
        <div>
          {isLoadingReports ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-xl border border-neutral-200 p-6 animate-pulse">
                  <div className="h-6 bg-neutral-100 rounded w-2/3 mb-4" />
                  <div className="h-4 bg-neutral-100 rounded w-full mb-2" />
                  <div className="h-4 bg-neutral-100 rounded w-3/4" />
                </div>
              ))}
            </div>
          ) : filteredReports.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredReports.map((report) => (
                <ReportCard
                  key={report.id}
                  report={report}
                  onView={() => navigate(`/parent/reports/${report.id}`)}
                />
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center">
              <FileText className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-neutral-900 mb-2">No Reports Found</h3>
              <p className="text-neutral-500 mb-6">
                {searchQuery || selectedStudent !== 'all' || selectedType !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Reports will appear here as your ward uses the AI counselor'}
              </p>
              {(searchQuery || selectedStudent !== 'all' || selectedType !== 'all') && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedStudent('all');
                    setSelectedType('all');
                  }}
                >
                  Clear Filters
                </Button>
              )}
            </Card>
          )}
        </div>
      ) : (
        <div>
          {filteredAlerts.length > 0 ? (
            <div className="space-y-4">
              {/* Unresolved Alerts */}
              {unresolvedAlerts.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-neutral-900 mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-orange-500" />
                    Active Alerts
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {unresolvedAlerts.map((alert) => (
                      <AlertCard
                        key={alert.id}
                        alert={alert}
                        onViewDetails={() => {
                          // TODO: Show alert detail modal
                          console.log('View alert:', alert.id);
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Resolved Alerts */}
              {filteredAlerts.filter(a => a.isResolved).length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-neutral-900 mb-3 flex items-center gap-2">
                    Resolved Alerts
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredAlerts.filter(a => a.isResolved).map((alert) => (
                      <AlertCard key={alert.id} alert={alert} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Card className="p-12 text-center">
              <AlertTriangle className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-neutral-900 mb-2">No Alerts</h3>
              <p className="text-neutral-500">
                No wellbeing alerts have been triggered for your ward
              </p>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
