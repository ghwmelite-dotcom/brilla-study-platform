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

// Demo data for development
const DEMO_LINKED_STUDENTS: StudentParentLink[] = [
  {
    id: 'link_1',
    studentId: 'student_1',
    parentId: 'parent_1',
    studentName: 'Kwame Asante',
    studentAvatar: undefined,
    studentSchoolLevel: 'shs',
    studentYearGroup: 2,
    relationship: 'parent',
    isPrimary: true,
    notificationPreferences: { email: true, inApp: true, reports: true },
    isVerified: true,
    verifiedAt: '2024-01-15T10:00:00Z',
    createdAt: '2024-01-01T00:00:00Z',
  },
];

const DEMO_REPORTS: CounselorReport[] = [
  {
    id: 'report_1',
    studentId: 'student_1',
    studentName: 'Kwame Asante',
    generatedBy: 'system',
    reportType: 'weekly',
    reportPeriodStart: '2024-12-09',
    reportPeriodEnd: '2024-12-15',
    summary: 'Kwame has shown consistent engagement with the platform this week. His academic performance remains strong in Mathematics and Science, with notable improvement in problem-solving speed. He has been proactive in seeking help through the AI counselor for exam preparation strategies.',
    keyInsights: [
      'Strong performance in Mathematics with 85% accuracy',
      'Increased study time by 20% compared to last week',
      'Regularly uses the AI counselor for academic support',
      'Mood has been generally positive with minor stress around upcoming exams',
    ],
    academicSummary: 'Kwame continues to excel in STEM subjects. His practice session completion rate is 92%, and he consistently attempts challenging questions.',
    academicStrengths: ['Mathematical reasoning', 'Scientific concepts', 'Problem-solving'],
    academicChallenges: ['Time management during timed quizzes', 'Essay writing structure'],
    studyPatterns: {
      averageStudyHoursPerDay: 2.5,
      peakStudyHours: ['16:00-18:00', '20:00-21:00'],
      consistency: 'high',
      preferredSubjects: ['Mathematics', 'Physics'],
      studyStreak: 12,
      weeklyTrend: 'increasing',
    },
    subjectPerformance: [
      {
        subjectId: 'math',
        subjectName: 'Mathematics',
        averageScore: 85,
        trend: 'improving',
        questionsAttempted: 150,
        accuracy: 85,
        timeSpentMinutes: 420,
        strengths: ['Algebra', 'Geometry'],
        areasForImprovement: ['Trigonometry'],
      },
      {
        subjectId: 'physics',
        subjectName: 'Physics',
        averageScore: 78,
        trend: 'stable',
        questionsAttempted: 100,
        accuracy: 78,
        timeSpentMinutes: 280,
        strengths: ['Mechanics'],
        areasForImprovement: ['Electromagnetism'],
      },
    ],
    wellbeingSummary: 'Kwame appears to be managing his academic workload well. He has expressed some concern about upcoming WASSCE exams but maintains a positive outlook.',
    moodTrend: 'stable',
    stressIndicators: ['Pre-exam anxiety', 'Occasional late-night study sessions'],
    wellbeingScore: 75,
    engagementSummary: 'High engagement with regular daily logins and consistent practice session completion.',
    platformUsageHours: 17.5,
    counselorSessionsCount: 4,
    topicsDiscussed: ['Exam preparation', 'Study techniques', 'Time management', 'Career guidance'],
    goalsSet: [
      { id: 'g1', title: 'Score 90% in Math mock exam', progress: 70, status: 'in_progress', category: 'academic' },
      { id: 'g2', title: 'Complete Physics revision', progress: 45, status: 'in_progress', category: 'academic' },
    ],
    goalsAchieved: [
      { id: 'g3', title: 'Maintain 7-day study streak', progress: 100, status: 'achieved', category: 'habit' },
    ],
    goalsInProgress: [
      { id: 'g1', title: 'Score 90% in Math mock exam', progress: 70, status: 'in_progress', category: 'academic' },
    ],
    recommendations: [
      {
        id: 'r1',
        category: 'academic',
        priority: 'high',
        title: 'Focus on Trigonometry',
        description: 'Dedicate 30 minutes daily to trigonometry practice to strengthen this area before exams.',
        actionSteps: ['Complete trigonometry topic drill', 'Review formula sheet', 'Practice past WASSCE questions'],
        targetAudience: 'both',
      },
      {
        id: 'r2',
        category: 'wellbeing',
        priority: 'medium',
        title: 'Manage Exam Stress',
        description: 'Consider incorporating short breaks and relaxation techniques during study sessions.',
        actionSteps: ['Take 5-minute breaks every 45 minutes', 'Practice deep breathing exercises', 'Ensure adequate sleep'],
        targetAudience: 'student',
      },
    ],
    parentActionItems: [
      'Encourage regular breaks during study sessions',
      'Discuss career aspirations and exam goals',
      'Monitor sleep schedule during exam preparation',
    ],
    followUpNeeded: false,
    concernLevel: 'low',
    concernAreas: [],
    professionalReferralSuggested: false,
    status: 'published',
    isReadByParent: false,
    createdAt: '2024-12-16T08:00:00Z',
    updatedAt: '2024-12-16T08:00:00Z',
  },
];

const DEMO_ALERTS: WellbeingAlert[] = [
  {
    id: 'alert_1',
    studentId: 'student_1',
    studentName: 'Kwame Asante',
    alertType: 'stress',
    severity: 'low',
    description: 'Student mentioned feeling stressed about upcoming exams during a counselor session.',
    triggeredBy: 'conversation_analysis',
    parentNotified: true,
    notifiedAt: '2024-12-15T14:00:00Z',
    notificationMethod: 'in_app',
    isResolved: false,
    createdAt: '2024-12-15T13:45:00Z',
  },
];

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
        } catch (error) {
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
        } catch (error) {
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
        } catch (error) {
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
        } catch (error) {
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
        } catch (error) {
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
        } catch (error) {
          console.error('Failed to mark report as read:', error);
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
        } catch (error) {
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
        } catch (error) {
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
        } catch (error) {
          console.error('Failed to acknowledge alert:', error);
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
        } catch (error) {
          set({ error: 'Failed to resolve alert' });
        }
      },

      // Message Actions
      loadMessages: async (studentId) => {
        set({ isLoading: true, error: null });
        try {
          const params = studentId ? `?studentId=${studentId}` : '';
          const response = await api.get(`/counselor/parent-messages${params}`);
          if (response.success) {
            const messages = response.data.map((m: any) => ({
              id: m.id,
              reportId: m.reportId,
              parentId: m.parentId,
              studentId: m.studentId,
              senderRole: m.senderRole,
              senderName: m.senderName,
              message: m.content,
              isRead: m.isRead,
              readAt: m.readAt,
              createdAt: m.createdAt,
            }));
            const unreadCount = messages.filter((m: ParentCounselorMessage) => !m.isRead).length;
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
        } catch (error) {
          console.error('Failed to load messages:', error);
          set({
            messages: [],
            unreadMessagesCount: 0,
            isLoading: false,
          });
        }
      },

      sendMessage: async (studentId, message, reportId) => {
        try {
          const response = await api.post('/counselor/parent-messages', {
            studentId,
            content: message,
            reportId,
          });
          if (response.success) {
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
        } catch (error) {
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
        } catch (error) {
          console.error('Failed to mark message as read:', error);
        }
      },

      // Schedule Actions
      loadSchedules: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.get('/counselor/schedules');
          if (response.success) {
            const schedules = response.data.map((s: any) => ({
              id: s.id,
              studentId: s.studentId,
              studentName: s.studentName,
              parentId: s.parentId,
              reportType: s.reportType,
              frequency: s.frequency,
              nextScheduledAt: s.nextScheduledAt,
              isActive: s.isActive,
              createdAt: s.createdAt,
            }));
            set({ reportSchedules: schedules, isLoading: false });
          } else {
            set({ reportSchedules: [], isLoading: false });
          }
        } catch (error) {
          console.error('Failed to load schedules:', error);
          set({ reportSchedules: [], isLoading: false });
        }
      },

      createSchedule: async (studentId, reportType) => {
        try {
          const response = await api.post('/counselor/schedules', {
            studentId,
            reportType,
            frequency: reportType === 'weekly' ? 'weekly' : reportType === 'monthly' ? 'monthly' : 'weekly',
          });
          if (response.success) {
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
        } catch (error) {
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
        } catch (error) {
          set({ error: 'Failed to update schedule' });
        }
      },

      deleteSchedule: async (scheduleId) => {
        try {
          await api.delete(`/counselor/schedules/${scheduleId}`);
          set({
            reportSchedules: get().reportSchedules.filter(s => s.id !== scheduleId),
          });
        } catch (error) {
          set({ error: 'Failed to delete schedule' });
        }
      },

      // Session Actions
      loadSessionSummaries: async (studentId) => {
        set({ isLoading: true, error: null });
        try {
          const params = studentId ? `?studentId=${studentId}` : '';
          const response = await api.get(`/counselor/session-summaries${params}`);
          if (response.success) {
            const summaries = response.data.map((s: any) => ({
              id: s.id,
              counselorType: s.counselorType,
              title: s.title,
              messageCount: s.messageCount,
              status: s.status,
              lastMessage: s.lastMessage,
              lastSentiment: s.lastSentiment,
              createdAt: s.createdAt,
              lastMessageAt: s.lastMessageAt,
            }));
            set({ sessionSummaries: summaries, isLoading: false });
          } else {
            set({ sessionSummaries: [], isLoading: false });
          }
        } catch (error) {
          console.error('Failed to load session summaries:', error);
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
