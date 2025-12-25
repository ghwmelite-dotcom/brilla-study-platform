const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    // Load token from localStorage on init (sync with @/lib/api)
    this.token = localStorage.getItem('brilla_token');
  }

  setToken(token: string | null) {
    this.token = token;
    // Also sync to localStorage (like @/lib/api does)
    if (token) {
      localStorage.setItem('brilla_token', token);
    } else {
      localStorage.removeItem('brilla_token');
    }
  }

  // Get token - check localStorage if not set (for page refreshes)
  private getToken(): string | null {
    if (!this.token) {
      this.token = localStorage.getItem('brilla_token');
    }
    return this.token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const token = this.getToken();
    if (token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || data.message || 'Request failed');
    }

    return data.data !== undefined ? data.data : data;
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, body?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async put<T>(endpoint: string, body?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async patch<T>(endpoint: string, body?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const api = new ApiClient(API_BASE_URL);

// Auth service functions
export const authService = {
  async login(email: string, password: string) {
    return api.post<{ user: unknown; token: string }>('/auth/login', {
      email,
      password,
    });
  },

  async register(data: {
    email: string;
    password: string;
    name: string;
    house?: string;
    yearGroup?: number;
    schoolLevel?: string;
    schoolName?: string;
    role?: string;
    teacherLicenseNumber?: string;
    subjectsTaught?: string[];
    yearsExperience?: string;
    qualifications?: string;
    examTypeIds?: string[];
    primaryExamTypeId?: string;
  }) {
    return api.post<{ user: unknown; token: string }>('/auth/register', data);
  },

  async logout() {
    return api.post('/auth/logout');
  },

  async getCurrentUser() {
    return api.get('/auth/me');
  },
};

// Exam types service functions
export const examService = {
  async getExamTypes() {
    return api.get<Array<{
      id: string;
      name: string;
      slug: string;
      description?: string;
      icon?: string;
      color?: string;
      display_order: number;
    }>>('/exam-types');
  },

  async getMyExamPreferences() {
    const response = await api.get<{
      preferences: Array<{
        id: string;
        examTypeId: string;
        isPrimary: boolean;
        targetYear?: number;
        name: string;
        slug: string;
        description?: string;
        icon?: string;
        color?: string;
      }>;
      primaryExamTypeId: string | null;
    }>('/users/me/exam-preferences');

    // Return unwrapped data - api.get already returns the data object
    return response;
  },

  async setMyExamPreferences(data: {
    examTypeIds: string[];
    primaryExamTypeId: string;
  }) {
    return api.post<{ message: string }>('/users/me/exam-preferences', data);
  },

  // Admin endpoints
  async getUserExamPreferences(userId: string) {
    return api.get<{
      preferences: Array<{
        id: string;
        examTypeId: string;
        isPrimary: boolean;
        targetYear?: number;
        name: string;
        slug: string;
        description?: string;
        icon?: string;
        color?: string;
      }>;
      primaryExamTypeId: string | null;
    }>(`/admin/users/${userId}/exam-preferences`);
  },

  async setUserExamPreferences(userId: string, data: {
    examTypeIds: string[];
    primaryExamTypeId: string;
  }) {
    return api.post<{ message: string }>(`/admin/users/${userId}/exam-preferences`, data);
  },
};

// Questions service functions
export const questionsService = {
  async getQuestions(params?: {
    subject?: string;
    topic?: string;
    difficulty?: string;
    round?: string;
    limit?: number;
    offset?: number;
  }) {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, String(value));
        }
      });
    }
    const query = searchParams.toString();
    return api.get(`/questions${query ? `?${query}` : ''}`);
  },

  async getQuestion(id: string) {
    return api.get(`/questions/${id}`);
  },

  async submitAnswer(questionId: string, answer: string) {
    return api.post(`/questions/${questionId}/attempt`, { answer });
  },

  async getRiddles(subjectId?: string) {
    const query = subjectId ? `?subject=${subjectId}` : '';
    return api.get(`/riddles${query}`);
  },
};

// Subjects service functions
export const subjectsService = {
  async getSubjects() {
    return api.get('/subjects');
  },

  async getSubject(slug: string) {
    return api.get(`/subjects/${slug}`);
  },
};

// Topics service functions
export const topicsService = {
  async getTopics(subjectId?: string) {
    const query = subjectId ? `?subject=${subjectId}` : '';
    return api.get(`/topics${query}`);
  },

  async getTopic(id: string) {
    return api.get(`/topics/${id}`);
  },
};

// Progress service functions
export const progressService = {
  async getProgress() {
    return api.get('/progress');
  },

  async getTopicProgress(topicId: string) {
    return api.get(`/progress/topics/${topicId}`);
  },

  async updateProgress(topicId: string, data: { correct: boolean }) {
    return api.post(`/progress/topics/${topicId}`, data);
  },
};

// Leaderboard service functions
export const leaderboardService = {
  async getLeaderboard(period: 'daily' | 'weekly' | 'monthly' | 'all_time') {
    return api.get(`/leaderboard?period=${period}`);
  },
};

// Achievements service functions
export const achievementsService = {
  async getAchievements() {
    return api.get('/achievements');
  },

  async getUserAchievements() {
    return api.get('/achievements/me');
  },
};

// Competition service functions
export const competitionService = {
  async createCompetition(data: { name: string; schools: string[] }) {
    return api.post('/competition/create', data);
  },

  async getCompetition(id: string) {
    return api.get(`/competition/${id}`);
  },

  async submitAnswer(competitionId: string, data: {
    round: number;
    questionId: string;
    schoolId: string;
    answer: string;
  }) {
    return api.post(`/competition/${competitionId}/answer`, data);
  },
};

// Recording service types
export interface RecordingData {
  id: string;
  title: string;
  description: string | null;
  duration: number;
  teacherId: string;
  teacherName?: string;
  thumbnailUrl: string | null;
  canvasEventsUrl: string;
  audioUrl: string | null;
  webcamUrl: string | null;
  canvasWidth: number;
  canvasHeight: number;
  initialCanvasJSON?: string;
  subjectId: string | null;
  topicId: string | null;
  isPublic: boolean;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface RecordingUploadInfo {
  type: 'events' | 'audio' | 'webcam' | 'thumbnail';
  uploadUrl: string;
  publicUrl: string;
  path: string;
}

// Recordings service functions
export const recordingsService = {
  // List recordings for current teacher
  async list(params?: { status?: string; search?: string; limit?: number; offset?: number }) {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.set('status', params.status);
    if (params?.search) queryParams.set('search', params.search);
    if (params?.limit) queryParams.set('limit', params.limit.toString());
    if (params?.offset) queryParams.set('offset', params.offset.toString());

    const query = queryParams.toString();
    return api.get<{
      recordings: RecordingData[];
      total: number;
      limit: number;
      offset: number;
    }>(`/recordings${query ? `?${query}` : ''}`);
  },

  // Get a specific recording
  async get(id: string) {
    return api.get<RecordingData>(`/recordings/${id}`);
  },

  // Get a public recording via share token
  async getPublic(shareToken: string) {
    return api.get<RecordingData>(`/recordings/public/${shareToken}`);
  },

  // Create a new recording
  async create(data: {
    title: string;
    description?: string;
    duration: number;
    canvasWidth?: number;
    canvasHeight?: number;
    initialCanvasJSON?: string;
    subjectId?: string;
    topicId?: string;
  }) {
    return api.post<{ id: string; canvasEventsUrl: string }>('/recordings', data);
  },

  // Get upload URLs for recording assets
  async getUploadUrls(recordingId: string, files: Array<{ type: 'events' | 'audio' | 'webcam' | 'thumbnail'; contentType: string }>) {
    return api.post<{ uploads: RecordingUploadInfo[] }>(`/recordings/${recordingId}/upload-urls`, { files });
  },

  // Upload a file to the recording
  async uploadFile(recordingId: string, fileType: 'events' | 'audio' | 'webcam' | 'thumbnail', file: Blob, contentType: string) {
    const response = await fetch(`/api/recordings/upload/${recordingId}/${fileType}`, {
      method: 'PUT',
      headers: {
        'Content-Type': contentType,
        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
      },
      body: file,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Upload failed');
    }

    return response.json();
  },

  // Update recording metadata
  async update(id: string, data: {
    title?: string;
    description?: string;
    subjectId?: string;
    topicId?: string;
    isPublic?: boolean;
  }) {
    return api.put<{ id: string }>(`/recordings/${id}`, data);
  },

  // Delete a recording
  async delete(id: string) {
    return api.delete<{ id: string }>(`/recordings/${id}`);
  },

  // Create a share link
  async createShareLink(recordingId: string, options?: { expiresInDays?: number; maxViews?: number }) {
    return api.post<{
      id: string;
      shareToken: string;
      shareUrl: string;
      expiresAt: string | null;
      maxViews: number | null;
    }>(`/recordings/${recordingId}/share`, options || {});
  },

  // List share links for a recording
  async listShareLinks(recordingId: string) {
    return api.get<{
      shares: Array<{
        id: string;
        shareToken: string;
        shareUrl: string;
        expiresAt: string | null;
        maxViews: number | null;
        currentViews: number;
        isActive: boolean;
        createdAt: string;
      }>;
    }>(`/recordings/${recordingId}/shares`);
  },

  // Revoke a share link
  async revokeShareLink(shareId: string) {
    return api.delete<{ id: string }>(`/recordings/shares/${shareId}`);
  },

  // Get recording analytics
  async getAnalytics(recordingId: string) {
    return api.get<{
      totalViews: number;
      uniqueViewers: number;
      completions: number;
      avgWatchDuration: number;
      recentViews: Array<{
        viewerName: string;
        viewedAt: string;
        watchDuration: number;
        completed: boolean;
      }>;
    }>(`/recordings/${recordingId}/analytics`);
  },
};

// Whiteboard types
export interface WhiteboardData {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  canvasJSON: string;
  thumbnail: string | null;
  canvasWidth: number;
  canvasHeight: number;
  subjectId: string | null;
  topicId: string | null;
  isTemplate: boolean;
  isPublic: boolean;
  status: 'active' | 'archived' | 'deleted';
  createdAt: string;
  updatedAt: string;
}

// Whiteboards service functions
export const whiteboardsService = {
  // List user's whiteboards
  async list(params?: { status?: string; search?: string; limit?: number; offset?: number }) {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.set('status', params.status);
    if (params?.search) queryParams.set('search', params.search);
    if (params?.limit) queryParams.set('limit', params.limit.toString());
    if (params?.offset) queryParams.set('offset', params.offset.toString());

    const query = queryParams.toString();
    return api.get<{
      whiteboards: WhiteboardData[];
      total: number;
      limit: number;
      offset: number;
    }>(`/whiteboards${query ? `?${query}` : ''}`);
  },

  // Get a specific whiteboard
  async get(id: string) {
    return api.get<WhiteboardData>(`/whiteboards/${id}`);
  },

  // Get a public whiteboard
  async getPublic(id: string) {
    return api.get<WhiteboardData>(`/whiteboards/public/${id}`);
  },

  // Create a new whiteboard
  async create(data: {
    id?: string;
    title: string;
    description?: string;
    canvasJSON: string;
    thumbnail?: string;
    canvasWidth?: number;
    canvasHeight?: number;
    subjectId?: string;
    topicId?: string;
  }) {
    return api.post<WhiteboardData>('/whiteboards', data);
  },

  // Update a whiteboard
  async update(id: string, data: {
    title?: string;
    description?: string;
    canvasJSON?: string;
    thumbnail?: string;
    canvasWidth?: number;
    canvasHeight?: number;
    subjectId?: string;
    topicId?: string;
    isPublic?: boolean;
  }) {
    return api.put<WhiteboardData>(`/whiteboards/${id}`, data);
  },

  // Delete a whiteboard
  async delete(id: string) {
    return api.delete<{ id: string }>(`/whiteboards/${id}`);
  },

  // Duplicate a whiteboard
  async duplicate(id: string) {
    return api.post<WhiteboardData>(`/whiteboards/${id}/duplicate`);
  },
};

// Tutoring Marketplace service
export const tutoringService = {
  // Directory - Public
  async getDirectory(params?: {
    search?: string;
    subjectId?: string;
    sessionType?: string;
    minRating?: number;
    minRate?: number;
    maxRate?: number;
    sortBy?: string;
    page?: number;
    pageSize?: number;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.set('search', params.search);
    if (params?.subjectId) queryParams.set('subjectId', params.subjectId);
    if (params?.sessionType) queryParams.set('sessionType', params.sessionType);
    if (params?.minRating) queryParams.set('minRating', params.minRating.toString());
    if (params?.minRate) queryParams.set('minRate', params.minRate.toString());
    if (params?.maxRate) queryParams.set('maxRate', params.maxRate.toString());
    if (params?.sortBy) queryParams.set('sortBy', params.sortBy);
    if (params?.page) queryParams.set('page', params.page.toString());
    if (params?.pageSize) queryParams.set('pageSize', params.pageSize.toString());
    const query = queryParams.toString();
    return api.get(`/tutoring/directory${query ? `?${query}` : ''}`);
  },

  async getTeacherProfile(id: string) {
    return api.get(`/tutoring/directory/${id}`);
  },

  async getTeacherReviews(id: string, page = 1) {
    return api.get(`/tutoring/directory/${id}/reviews?page=${page}`);
  },

  // Student requests
  async createRequest(data: {
    teacherProfileId: string;
    subjectId: string;
    topicDescription?: string;
    sessionType: string;
    proposedDatetime: string;
    proposedDuration?: number;
    alternativeDatetime?: string;
    message?: string;
  }) {
    return api.post('/tutoring/requests', data);
  },

  async getMyRequests(status?: string) {
    const query = status ? `?status=${status}` : '';
    return api.get(`/tutoring/requests${query}`);
  },

  async cancelRequest(requestId: string) {
    return api.post(`/tutoring/requests/${requestId}/cancel`);
  },

  // Sessions
  async getMySessions(upcoming = false) {
    const query = upcoming ? '?upcoming=true' : '';
    return api.get(`/tutoring/sessions${query}`);
  },

  async submitReview(sessionId: string, data: {
    rating: number;
    title?: string;
    reviewText?: string;
    knowledgeRating?: number;
    communicationRating?: number;
    punctualityRating?: number;
    patienceRating?: number;
  }) {
    return api.post(`/tutoring/sessions/${sessionId}/review`, data);
  },

  // Teacher profile
  async getMyTeacherProfile() {
    return api.get('/tutoring/teacher/profile');
  },

  async saveTeacherProfile(data: {
    displayName: string;
    bio?: string;
    profilePhotoUrl?: string;
    bannerImageUrl?: string;
    tagline?: string;
    teachingStyle?: string;
    educationBackground?: string[];
    subjects: Array<{ subjectId: string; subjectName: string; level: string; description?: string }>;
    sessionTypes: string[];
    hourlyRate: number;
    availability?: Record<string, Array<{ start: string; end: string }>>;
    timezone?: string;
  }) {
    return api.post('/tutoring/teacher/profile', data);
  },

  async submitProfileForApproval() {
    return api.post('/tutoring/teacher/profile/submit');
  },

  // Teacher request management
  async acceptRequest(requestId: string, data?: { response?: string; confirmedDatetime?: string; confirmedDuration?: number }) {
    return api.post(`/tutoring/teacher/requests/${requestId}/accept`, data || {});
  },

  async declineRequest(requestId: string, reason?: string) {
    return api.post(`/tutoring/teacher/requests/${requestId}/decline`, { reason });
  },

  // Teacher earnings
  async getTeacherEarnings() {
    return api.get('/tutoring/teacher/earnings');
  },

  async updatePayoutDetails(data: {
    mobileMoneyNumber?: string;
    mobileMoneyProvider?: string;
    bankAccountNumber?: string;
    bankName?: string;
    bankAccountName?: string;
    preferredPayoutMethod?: string;
  }) {
    return api.put('/tutoring/teacher/payout-details', data);
  },

  async respondToReview(reviewId: string, response: string) {
    return api.post(`/tutoring/teacher/reviews/${reviewId}/respond`, { response });
  },

  // Payment methods
  async initializePayment(sessionId: string) {
    return api.post<{
      paymentId: string;
      reference: string;
      authorizationUrl?: string;
      amount: number;
    }>(`/tutoring/sessions/${sessionId}/pay/initialize`);
  },

  async verifyPayment(reference: string) {
    return api.post<{
      status: string;
      sessionId?: string;
      amount?: number;
      message?: string;
    }>('/tutoring/sessions/pay/verify', { reference });
  },

  async getPaymentStatus(sessionId: string) {
    return api.get<{
      paymentId?: string;
      status: string;
      amount?: number;
      reference?: string;
      paidAt?: string;
    }>(`/tutoring/sessions/${sessionId}/payment`);
  },

  // Admin methods
  async getPendingProfiles(page = 1, pageSize = 20) {
    return api.get(`/tutoring/admin/pending-profiles?page=${page}&pageSize=${pageSize}`);
  },

  async approveProfile(profileId: string) {
    return api.post(`/tutoring/admin/profiles/${profileId}/approve`);
  },

  async rejectProfile(profileId: string, reason: string) {
    return api.post(`/tutoring/admin/profiles/${profileId}/reject`, { reason });
  },

  async getAdminStats() {
    return api.get('/tutoring/admin/stats');
  },
};

// Teacher Bonus service
export const teacherBonusService = {
  async getMyBonusStatus() {
    return api.get('/teacher-bonuses/my-status');
  },

  async getMyReferredStudents(year: number) {
    return api.get(`/teacher-bonuses/my-students/${year}`);
  },

  async getBonusConfig() {
    return api.get('/teacher-bonuses/config');
  },

  // Admin endpoints
  async listBonuses(params?: { year?: number; status?: string; page?: number; pageSize?: number }) {
    const queryParams = new URLSearchParams();
    if (params?.year) queryParams.set('year', params.year.toString());
    if (params?.status) queryParams.set('status', params.status);
    if (params?.page) queryParams.set('page', params.page.toString());
    if (params?.pageSize) queryParams.set('pageSize', params.pageSize.toString());
    const query = queryParams.toString();
    return api.get(`/teacher-bonuses/admin/list${query ? `?${query}` : ''}`);
  },

  async calculateBonuses(year?: number) {
    return api.post('/teacher-bonuses/admin/calculate', { year });
  },

  async approveBonus(bonusId: string, notes?: string) {
    return api.post(`/teacher-bonuses/admin/${bonusId}/approve`, { notes });
  },

  async rejectBonus(bonusId: string, reason: string) {
    return api.post(`/teacher-bonuses/admin/${bonusId}/reject`, { reason });
  },

  async processPayout(bonusId: string) {
    return api.post(`/teacher-bonuses/admin/${bonusId}/payout`);
  },

  async getBonusStats(year?: number) {
    const query = year ? `?year=${year}` : '';
    return api.get(`/teacher-bonuses/admin/stats${query}`);
  },
};
