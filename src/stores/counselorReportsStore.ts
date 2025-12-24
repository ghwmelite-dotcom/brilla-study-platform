import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '@/utils/api';
import type {
  CounselorReport,
  WellbeingAlert,
  StudentParentLink,
  ParentCounselorMessage,
  ReportSchedule,
  ReportFilters,
  ReportRequest,
  CounselorSessionSummary,
  ParentDashboardData,
} from '@/types';

interface CounselorReportsState {
  // Parent Dashboard
  linkedStudents: StudentParentLink[];
  selectedStudentId: string | null;
  dashboardData: ParentDashboardData | null;

  // Reports
  reports: CounselorReport[];
  currentReport: CounselorReport | null;
  reportFilters: ReportFilters;
  isLoadingReports: boolean;

  // Alerts
  alerts: WellbeingAlert[];
  unresolvedAlertsCount: number;

  // Messages
  messages: ParentCounselorMessage[];
  unreadMessagesCount: number;

  // Schedules
  reportSchedules: ReportSchedule[];

  // Session Summaries
  sessionSummaries: CounselorSessionSummary[];

  // UI State
  isLoading: boolean;
  error: string | null;
  showReportModal: boolean;
  showMessageModal: boolean;

  // Actions - Dashboard
  loadDashboardData: () => Promise<void>;
  loadLinkedStudents: () => Promise<void>;
  selectStudent: (studentId: string | null) => void;

  // Actions - Reports
  loadReports: (filters?: ReportFilters) => Promise<void>;
  loadReport: (reportId: string) => Promise<void>;
  requestReport: (request: ReportRequest) => Promise<void>;
  markReportAsRead: (reportId: string) => Promise<void>;
  submitReportFeedback: (reportId: string, feedback: string) => Promise<void>;
  setReportFilters: (filters: Partial<ReportFilters>) => void;

  // Actions - Alerts
  loadAlerts: (studentId?: string) => Promise<void>;
  acknowledgeAlert: (alertId: string) => Promise<void>;
  resolveAlert: (alertId: string, notes: string) => Promise<void>;

  // Actions - Messages
  loadMessages: (studentId?: string) => Promise<void>;
  sendMessage: (studentId: string, message: string, reportId?: string) => Promise<void>;
  markMessageAsRead: (messageId: string) => Promise<void>;

  // Actions - Schedules
  loadSchedules: () => Promise<void>;
  createSchedule: (studentId: string, reportType: 'weekly' | 'monthly' | 'semester') => Promise<void>;
  updateSchedule: (scheduleId: string, isActive: boolean) => Promise<void>;
  deleteSchedule: (scheduleId: string) => Promise<void>;

  // Actions - Sessions
  loadSessionSummaries: (studentId: string) => Promise<void>;

  // UI Actions
  openReportModal: () => void;
  closeReportModal: () => void;
  openMessageModal: () => void;
  closeMessageModal: () => void;
  clearError: () => void;
  reset: () => void;
}

// Empty fallback data - will be populated from API with real data
const DEMO_LINKED_STUDENTS: StudentParentLink[] = [];

const DEMO_REPORTS: CounselorReport[] = [];

const DEMO_ALERTS: WellbeingAlert[] = [];

const initialState = {
  linkedStudents: [],
  selectedStudentId: null,
  dashboardData: null,
  reports: [],
  currentReport: null,
  reportFilters: {},
  isLoadingReports: false,
  alerts: [],
  unresolvedAlertsCount: 0,
  messages: [],
  unreadMessagesCount: 0,
  reportSchedules: [],
  sessionSummaries: [],
  isLoading: false,
  error: null,
  showReportModal: false,
  showMessageModal: false,
};

export const useCounselorReportsStore = create<CounselorReportsState>()(
  persist(
    (set, get) => ({
      ...initialState,

      // Dashboard Actions
      loadDashboardData: async () => {
        set({ isLoading: true, error: null });
        try {
          // Load linked students, reports, and alerts in parallel
          const [studentsRes, reportsRes, alertsRes] = await Promise.all([
            api.get<StudentParentLink[]>('/counselor/linked-students').catch(() => ({ success: false, data: undefined })),
            api.get<CounselorReport[]>('/counselor/reports').catch(() => ({ success: false, data: undefined })),
            api.get<WellbeingAlert[]>('/counselor/alerts').catch(() => ({ success: false, data: undefined })),
          ]);

          const linkedStudents = studentsRes.success && studentsRes.data ? studentsRes.data : DEMO_LINKED_STUDENTS;
          const reports = reportsRes.success && reportsRes.data ? reportsRes.data : DEMO_REPORTS;
          const alerts = alertsRes.success && alertsRes.data ? alertsRes.data : DEMO_ALERTS;

          set({
            linkedStudents,
            reports,
            alerts,
            dashboardData: {
              linkedStudents,
              recentReports: reports.slice(0, 5),
              unresolvedAlerts: alerts.filter(a => !a.isResolved),
              unreadMessages: 0,
              upcomingReports: [],
            },
            isLoading: false,
          });
        } catch {
          // Fallback to demo data
          set({
            linkedStudents: DEMO_LINKED_STUDENTS,
            reports: DEMO_REPORTS,
            alerts: DEMO_ALERTS,
            dashboardData: {
              linkedStudents: DEMO_LINKED_STUDENTS,
              recentReports: DEMO_REPORTS.slice(0, 5),
              unresolvedAlerts: DEMO_ALERTS.filter(a => !a.isResolved),
              unreadMessages: 0,
              upcomingReports: [],
            },
            isLoading: false,
          });
        }
      },

      loadLinkedStudents: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.get<StudentParentLink[]>('/counselor/linked-students');
          if (response.success && response.data) {
            set({ linkedStudents: response.data, isLoading: false });
          } else {
            set({ linkedStudents: DEMO_LINKED_STUDENTS, isLoading: false });
          }
        } catch {
          set({ linkedStudents: DEMO_LINKED_STUDENTS, isLoading: false });
        }
      },

      selectStudent: (studentId) => {
        set({ selectedStudentId: studentId });
      },

      // Report Actions
      loadReports: async (filters) => {
        set({ isLoadingReports: true, error: null });
        try {
          const response = await api.get<CounselorReport[]>('/counselor/reports', {
            studentId: filters?.studentId,
            reportType: filters?.reportType,
            status: filters?.status,
          });

          if (response.success && response.data) {
            set({ reports: response.data, reportFilters: filters || {}, isLoadingReports: false });
          } else {
            // Fallback to demo data with filtering
            let filteredReports = [...DEMO_REPORTS];
            if (filters?.studentId) {
              filteredReports = filteredReports.filter(r => r.studentId === filters.studentId);
            }
            if (filters?.reportType) {
              filteredReports = filteredReports.filter(r => r.reportType === filters.reportType);
            }
            set({ reports: filteredReports, reportFilters: filters || {}, isLoadingReports: false });
          }
        } catch {
          set({ reports: DEMO_REPORTS, isLoadingReports: false });
        }
      },

      loadReport: async (reportId) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.get<CounselorReport>(`/counselor/reports/${reportId}`);
          if (response.success && response.data) {
            set({ currentReport: response.data, isLoading: false });
          } else {
            const report = DEMO_REPORTS.find(r => r.id === reportId);
            if (report) {
              set({ currentReport: report, isLoading: false });
            } else {
              set({ error: 'Report not found', isLoading: false });
            }
          }
        } catch {
          const report = DEMO_REPORTS.find(r => r.id === reportId);
          if (report) {
            set({ currentReport: report, isLoading: false });
          } else {
            set({ error: 'Failed to load report', isLoading: false });
          }
        }
      },

      requestReport: async (request) => {
        set({ isLoading: true, error: null });
        try {
          await api.post('/counselor/reports/generate', {
            studentId: request.studentId,
            reportType: request.reportType,
            dateRangeStart: request.periodStart,
            dateRangeEnd: request.periodEnd,
          });
          set({ isLoading: false });
          // Reload reports to include the new one
          await get().loadReports();
        } catch {
          set({ error: 'Failed to request report', isLoading: false });
        }
      },

      markReportAsRead: async (reportId) => {
        try {
          await api.post(`/counselor/reports/${reportId}/read`, {});
          set({
            reports: get().reports.map(r =>
              r.id === reportId ? { ...r, isReadByParent: true, readAt: new Date().toISOString() } : r
            ),
            currentReport: get().currentReport?.id === reportId
              ? { ...get().currentReport!, isReadByParent: true, readAt: new Date().toISOString() }
              : get().currentReport,
          });
        } catch {
          console.error('Failed to mark report as read');
        }
      },

      submitReportFeedback: async (reportId, feedback) => {
        try {
          await api.post(`/counselor/reports/${reportId}/feedback`, { feedback });
          set({
            reports: get().reports.map(r =>
              r.id === reportId ? { ...r, parentFeedback: feedback } : r
            ),
            currentReport: get().currentReport?.id === reportId
              ? { ...get().currentReport!, parentFeedback: feedback }
              : get().currentReport,
          });
        } catch {
          set({ error: 'Failed to submit feedback' });
        }
      },

      setReportFilters: (filters) => {
        set({ reportFilters: { ...get().reportFilters, ...filters } });
      },

      // Alert Actions
      loadAlerts: async (studentId) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.get<WellbeingAlert[]>('/counselor/alerts', { studentId });
          if (response.success && response.data) {
            set({
              alerts: response.data,
              unresolvedAlertsCount: response.data.filter(a => !a.isResolved).length,
              isLoading: false,
            });
          } else {
            let alerts = [...DEMO_ALERTS];
            if (studentId) {
              alerts = alerts.filter(a => a.studentId === studentId);
            }
            set({
              alerts,
              unresolvedAlertsCount: alerts.filter(a => !a.isResolved).length,
              isLoading: false,
            });
          }
        } catch {
          set({ alerts: DEMO_ALERTS, isLoading: false });
        }
      },

      acknowledgeAlert: async (alertId) => {
        try {
          set({
            alerts: get().alerts.map(a =>
              a.id === alertId ? { ...a, parentNotified: true, notifiedAt: new Date().toISOString() } : a
            ),
          });
        } catch {
          console.error('Failed to acknowledge alert');
        }
      },

      resolveAlert: async (alertId, notes) => {
        try {
          await api.post(`/counselor/alerts/${alertId}/resolve`, { resolutionNotes: notes });
          set({
            alerts: get().alerts.map(a =>
              a.id === alertId
                ? { ...a, isResolved: true, resolvedAt: new Date().toISOString(), resolutionNotes: notes }
                : a
            ),
            unresolvedAlertsCount: get().unresolvedAlertsCount - 1,
          });
        } catch {
          set({ error: 'Failed to resolve alert' });
        }
      },

      // Message Actions
      loadMessages: async (studentId) => {
        set({ isLoading: true, error: null });
        try {
          const params = studentId ? `?studentId=${studentId}` : '';
          const response = await api.get<Record<string, unknown>[]>(`/counselor/parent-messages${params}`);
          if (response.success && response.data) {
            const messages: ParentCounselorMessage[] = response.data.map((m) => ({
              id: m.id as string,
              reportId: m.reportId as string | undefined,
              parentId: m.parentId as string,
              studentId: m.studentId as string,
              senderRole: m.senderRole as ParentCounselorMessage['senderRole'],
              message: (m.content || m.message) as string,
              isRead: m.isRead as boolean,
              readAt: m.readAt as string | undefined,
              createdAt: m.createdAt as string,
            }));
            const unreadCount = messages.filter((m) => !m.isRead).length;
            set({
              messages,
              unreadMessagesCount: unreadCount,
              isLoading: false,
            });
          } else {
            // Fall back to empty if API fails
            set({
              messages: [],
              unreadMessagesCount: 0,
              isLoading: false,
            });
          }
        } catch {
          console.error('Failed to load messages');
          set({
            messages: [],
            unreadMessagesCount: 0,
            isLoading: false,
          });
        }
      },

      sendMessage: async (studentId, message, reportId) => {
        try {
          const response = await api.post<{ id: string; senderId: string; createdAt: string }>('/counselor/parent-messages', {
            studentId,
            content: message,
            reportId,
          });
          if (response.success && response.data) {
            const newMessage: ParentCounselorMessage = {
              id: response.data.id,
              reportId,
              parentId: response.data.senderId,
              studentId,
              senderRole: 'parent',
              message,
              isRead: false,
              createdAt: response.data.createdAt,
            };
            set({ messages: [...get().messages, newMessage] });
          }
        } catch {
          set({ error: 'Failed to send message' });
        }
      },

      markMessageAsRead: async (messageId) => {
        try {
          await api.post(`/counselor/parent-messages/${messageId}/read`, {});
          set({
            messages: get().messages.map(m =>
              m.id === messageId ? { ...m, isRead: true, readAt: new Date().toISOString() } : m
            ),
            unreadMessagesCount: Math.max(0, get().unreadMessagesCount - 1),
          });
        } catch {
          console.error('Failed to mark message as read');
        }
      },

      // Schedule Actions
      loadSchedules: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.get<Record<string, unknown>[]>('/counselor/schedules');
          if (response.success && response.data) {
            const schedules: ReportSchedule[] = response.data.map((s) => ({
              id: s.id as string,
              studentId: s.studentId as string,
              parentId: s.parentId as string,
              reportType: s.reportType as ReportSchedule['reportType'],
              isActive: s.isActive as boolean,
              lastGeneratedAt: s.lastGeneratedAt as string | undefined,
              nextGenerationAt: (s.nextGenerationAt || s.nextScheduledAt) as string | undefined,
              createdAt: s.createdAt as string,
            }));
            set({ reportSchedules: schedules, isLoading: false });
          } else {
            set({ reportSchedules: [], isLoading: false });
          }
        } catch {
          console.error('Failed to load schedules');
          set({ reportSchedules: [], isLoading: false });
        }
      },

      createSchedule: async (studentId, reportType) => {
        try {
          const response = await api.post<{ id: string }>('/counselor/schedules', {
            studentId,
            reportType,
            frequency: reportType === 'weekly' ? 'weekly' : reportType === 'monthly' ? 'monthly' : 'weekly',
          });
          if (response.success && response.data) {
            const newSchedule: ReportSchedule = {
              id: response.data.id,
              studentId,
              parentId: '',
              reportType,
              isActive: true,
              createdAt: new Date().toISOString(),
            };
            set({ reportSchedules: [...get().reportSchedules, newSchedule] });
          }
        } catch {
          set({ error: 'Failed to create schedule' });
        }
      },

      updateSchedule: async (scheduleId, isActive) => {
        try {
          await api.put(`/counselor/schedules/${scheduleId}`, { isActive });
          set({
            reportSchedules: get().reportSchedules.map(s =>
              s.id === scheduleId ? { ...s, isActive } : s
            ),
          });
        } catch {
          set({ error: 'Failed to update schedule' });
        }
      },

      deleteSchedule: async (scheduleId) => {
        try {
          await api.delete(`/counselor/schedules/${scheduleId}`);
          set({
            reportSchedules: get().reportSchedules.filter(s => s.id !== scheduleId),
          });
        } catch {
          set({ error: 'Failed to delete schedule' });
        }
      },

      // Session Actions
      loadSessionSummaries: async (studentId) => {
        set({ isLoading: true, error: null });
        try {
          const params = studentId ? `?studentId=${studentId}` : '';
          const response = await api.get<Record<string, unknown>[]>(`/counselor/session-summaries${params}`);
          if (response.success && response.data) {
            const summaries: CounselorSessionSummary[] = response.data.map((s) => ({
              id: s.id as string,
              conversationId: (s.conversationId || s.id) as string,
              studentId: (s.studentId || studentId || '') as string,
              sessionDate: (s.sessionDate || s.createdAt) as string,
              durationMinutes: s.durationMinutes as number | undefined,
              briefSummary: (s.briefSummary || s.lastMessage || '') as string,
              mainTopics: (s.mainTopics || []) as string[],
              emotionalState: s.emotionalState as CounselorSessionSummary['emotionalState'],
              keyConcerns: (s.keyConcerns || []) as string[],
              breakthroughs: (s.breakthroughs || []) as string[],
              studentActionItems: (s.studentActionItems || []) as string[],
              recommendedResources: (s.recommendedResources || []) as CounselorSessionSummary['recommendedResources'],
              requiresAttention: (s.requiresAttention || false) as boolean,
              attentionReason: s.attentionReason as string | undefined,
              createdAt: s.createdAt as string,
            }));
            set({ sessionSummaries: summaries, isLoading: false });
          } else {
            set({ sessionSummaries: [], isLoading: false });
          }
        } catch {
          console.error('Failed to load session summaries');
          set({ sessionSummaries: [], isLoading: false });
        }
      },

      // UI Actions
      openReportModal: () => set({ showReportModal: true }),
      closeReportModal: () => set({ showReportModal: false }),
      openMessageModal: () => set({ showMessageModal: true }),
      closeMessageModal: () => set({ showMessageModal: false }),
      clearError: () => set({ error: null }),
      reset: () => set(initialState),
    }),
    {
      name: 'counselor-reports-storage',
      partialize: (state) => ({
        selectedStudentId: state.selectedStudentId,
        reportFilters: state.reportFilters,
      }),
    }
  )
);
