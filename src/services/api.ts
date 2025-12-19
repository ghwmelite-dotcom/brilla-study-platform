import type { ApiResponse } from '@/types';

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
