const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  setToken(token: string | null) {
    this.token = token;
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

    if (this.token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${this.token}`;
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
