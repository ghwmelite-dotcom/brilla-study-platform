// API Client for Brilla Study Platform

import type { GradingResult, LabEventInput, LabMode } from '../../shared/lab-grading';

// In development, use relative /api path to go through Vite proxy
// In production, use the configured VITE_API_URL
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}

// Clear the session and bounce to /login on a 401.
// Guard: don't redirect if already on an auth page (prevents loop).
function handleUnauthorized() {
  localStorage.removeItem('brilla_token');
  localStorage.removeItem('brilla-auth');
  const path = window.location.pathname;
  if (path !== '/login' && path !== '/register' && !path.startsWith('/oauth')) {
    window.location.href = '/login';
  }
}

function hasBearerAuthorization(headers: Record<string, string>): boolean {
  return typeof headers.Authorization === 'string' && headers.Authorization.startsWith('Bearer ');
}

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    // Load token from localStorage on init
    this.token = localStorage.getItem('brilla_token');
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('brilla_token', token);
    } else {
      localStorage.removeItem('brilla_token');
    }
  }

  getToken(): string | null {
    return this.token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers,
      });

      // A public or startup request can legitimately receive 401 while auth is
      // still restoring. Only destroy the session when this request actually
      // presented a bearer token that the server rejected.
      if (response.status === 401 && hasBearerAuthorization(headers)) {
        handleUnauthorized();
        return { success: false, error: 'Your session has expired. Please sign in again.' };
      }

      if (response.status === 401) {
        return { success: false, error: 'Authentication is required.' };
      }

      // Guard: non-JSON or empty bodies must not crash the caller
      const text = await response.text();
      let data: ApiResponse<T>;
      try {
        data = text ? JSON.parse(text) : { success: false, error: 'Empty response from server' };
      } catch {
        data = { success: false, error: 'Invalid response from server' };
      }

      if (!response.ok && data.success !== false) {
        return { success: false, error: data.error || `Request failed (${response.status})` };
      }
      return data;
    } catch (error) {
      console.error('API request failed:', error);
      return {
        success: false,
        error: 'Network error. Please check your connection.',
      };
    }
  }

  // Upload multipart form data (browser sets the Content-Type boundary)
  async upload<T>(endpoint: string, formData: FormData): Promise<ApiResponse<T>> {
    const headers: Record<string, string> = {};

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers,
        body: formData,
      });

      if (response.status === 401 && hasBearerAuthorization(headers)) {
        handleUnauthorized();
        return { success: false, error: 'Your session has expired. Please sign in again.' };
      }

      if (response.status === 401) {
        return { success: false, error: 'Authentication is required.' };
      }

      const text = await response.text();
      let data: ApiResponse<T>;
      try {
        data = text ? JSON.parse(text) : { success: false, error: 'Empty response from server' };
      } catch {
        data = { success: false, error: 'Invalid response from server' };
      }

      if (!response.ok && data.success !== false) {
        return { success: false, error: data.error || `Upload failed (${response.status})` };
      }
      return data;
    } catch (error) {
      console.error('API upload failed:', error);
      return { success: false, error: 'Network error. Please check your connection.' };
    }
  }

  // Upload a raw blob with an explicit content type (e.g. recording assets)
  async uploadBlob<T>(endpoint: string, blob: Blob, contentType: string): Promise<ApiResponse<T>> {
    const headers: Record<string, string> = {
      'Content-Type': contentType,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'PUT',
        headers,
        body: blob,
      });

      if (response.status === 401 && hasBearerAuthorization(headers)) {
        handleUnauthorized();
        return { success: false, error: 'Your session has expired. Please sign in again.' };
      }

      if (response.status === 401) {
        return { success: false, error: 'Authentication is required.' };
      }

      const text = await response.text();
      let data: ApiResponse<T>;
      try {
        data = text ? JSON.parse(text) : { success: false, error: 'Empty response from server' };
      } catch {
        data = { success: false, error: 'Invalid response from server' };
      }

      if (!response.ok && data.success !== false) {
        return { success: false, error: data.error || `Upload failed (${response.status})` };
      }
      return data;
    } catch (error) {
      console.error('API blob upload failed:', error);
      return { success: false, error: 'Network error. Please check your connection.' };
    }
  }

  // GET request
  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  // POST request
  async post<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  // PUT request
  async put<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  // PATCH request
  async patch<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  // DELETE request
  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  // =============================================
  // AUTH ENDPOINTS
  // =============================================

  async login(email: string, password: string, turnstileToken?: string) {
    return this.post<{ user: User; token: string }>('/auth/login', { email, password, turnstileToken });
  }

  async register(data: RegisterData & { turnstileToken?: string }) {
    return this.post<{ status: string; message: string }>('/auth/register', data);
  }

  async verifyToken(token: string) {
    return this.get<{ name: string; email: string }>(`/auth/verify-token?token=${token}`);
  }

  async setPassword(token: string, password: string, turnstileToken?: string) {
    return this.post<{ message: string; xpAwarded: number }>('/auth/set-password', { token, password, turnstileToken });
  }

  async verifyEmail(token: string, turnstileToken?: string) {
    return this.post<{ message: string; xpAwarded: number }>('/auth/verify-email', { token, turnstileToken });
  }

  async forgotPassword(email: string, turnstileToken?: string) {
    return this.post<{ message: string }>('/auth/forgot-password', { email, turnstileToken });
  }

  async resetPassword(token: string, password: string, turnstileToken?: string) {
    return this.post<{ message: string }>('/auth/reset-password', { token, password, turnstileToken });
  }

  // =============================================
  // ADMIN ENDPOINTS
  // =============================================

  async getUsers(page = 1, limit = 50) {
    return this.get<{ users: ManagedUser[]; total: number; page: number; limit: number }>(
      `/admin/users?page=${page}&limit=${limit}`
    );
  }

  async getUserStats() {
    return this.get<UserStats>('/admin/users/stats');
  }

  async getPendingUsers() {
    return this.get<PendingUser[]>('/admin/users/pending');
  }

  async approveUser(userId: string) {
    return this.post<{ message: string }>(`/admin/users/${userId}/approve`);
  }

  async rejectUser(userId: string, reason?: string) {
    return this.post<{ message: string }>(`/admin/users/${userId}/reject`, { reason });
  }

  async createUser(data: CreateUserData) {
    return this.post<{ id: string; email: string; name: string; role: string; message: string }>(
      '/admin/users',
      data
    );
  }

  async updateUser(userId: string, data: Partial<ManagedUser>) {
    return this.put<{ message: string }>(`/admin/users/${userId}`, data);
  }

  async deactivateUser(userId: string) {
    return this.post<{ message: string }>(`/admin/users/${userId}/deactivate`);
  }

  async reactivateUser(userId: string) {
    return this.post<{ message: string }>(`/admin/users/${userId}/reactivate`);
  }

  async deleteUser(userId: string) {
    return this.delete<{ message: string }>(`/admin/users/${userId}`);
  }

  async resendVerificationEmail(userId: string) {
    return this.post<{ message: string }>(`/admin/users/${userId}/resend-verification`);
  }

  // =============================================
  // VIRTUAL LAB ENDPOINTS
  // =============================================

  async startLabSession(experimentSlug: string, mode: LabMode) {
    return this.post<{ sessionId: string; graded: 0 | 1; experimentSlug: string; mode: LabMode }>(
      '/lab/sessions',
      { experimentSlug, mode },
    );
  }

  async appendLabEvents(sessionId: string, events: LabEventInput[]) {
    return this.post<{ accepted: number; duplicates: number }>(
      `/lab/sessions/${sessionId}/events`,
      { events },
    );
  }

  async submitLabSession(sessionId: string) {
    return this.post<
      | { graded: true; grading: GradingResult }
      | { graded: false; reason: 'practice' }
    >(`/lab/sessions/${sessionId}/submit`);
  }

  async getLabSessions(limit = 20) {
    return this.get<{ sessions: LabSessionSummary[] }>(`/lab/sessions?limit=${limit}`);
  }

  async getLabSession(sessionId: string) {
    return this.get<{ session: LabSessionSummary; events: unknown[]; grading: GradingResult | null }>(
      `/lab/sessions/${sessionId}`,
    );
  }
}

// Types
export interface LabSessionSummary {
  id: string;
  experiment_slug: string;
  experimentName?: string;
  mode: 'guided' | 'sandbox';
  status: 'in_progress' | 'submitted' | 'graded';
  graded: 0 | 1;
  score: number | null;
  max_score: number | null;
  started_at: string;
  submitted_at: string | null;
  created_at: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'student' | 'teacher' | 'admin';
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  house?: string;
  yearGroup?: number;
  schoolLevel?: 'jhs' | 'shs';
  schoolName?: string;
  xpPoints: number;
  level: number;
  streakDays: number;
  aiGradingCredits?: number;
  primaryExamTypeId?: string | null;
}

export interface ManagedUser extends User {
  emailVerified: boolean;
  isActive: boolean;
  teacherLicenseNumber?: string;
  subjectsTaught?: string[];
  yearsExperience?: string;
  qualifications?: string;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface PendingUser {
  id: string;
  email: string;
  name: string;
  role: 'student' | 'teacher' | 'admin';
  schoolLevel?: 'jhs' | 'shs';
  yearGroup?: number;
  schoolName?: string;
  house?: string;
  teacherLicenseNumber?: string;
  subjectsTaught?: string[];
  yearsExperience?: string;
  qualifications?: string;
  createdAt: string;
}

export interface UserStats {
  total: number;
  students: number;
  teachers: number;
  admins: number;
  pending: number;
  activeToday: number;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  role?: 'student' | 'teacher';
  schoolLevel?: 'jhs' | 'shs';
  yearGroup?: number;
  schoolName?: string;
  house?: string;
  teacherLicenseNumber?: string;
  subjectsTaught?: string[];
  yearsExperience?: string;
  qualifications?: string;
  // Affiliate referral/invite code (required when backend runs in invite mode)
  referralCode?: string;
}

export interface CreateUserData {
  email: string;
  name: string;
  role: 'student' | 'teacher' | 'admin';
  schoolLevel?: 'jhs' | 'shs';
  yearGroup?: number;
  schoolName?: string;
  house?: string;
  teacherLicenseNumber?: string;
  subjectsTaught?: string[];
  yearsExperience?: string;
  qualifications?: string;
}

// Export singleton instance
export const api = new ApiClient(API_BASE_URL);

// Token-only auth headers (Bearer only; no legacy identity headers)
export function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('brilla_token');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
}

// Raw fetch with auth headers attached and the same 401 handling as the
// envelope client: on 401 the session is cleared and the user is bounced to
// /login (see handleUnauthorized). Returns the response otherwise.
export async function fetchWithAuth(input: string, init: RequestInit = {}): Promise<Response> {
  const headers: Record<string, string> = {
    ...getAuthHeaders(),
    ...(init.headers as Record<string, string> | undefined),
  };
  // Let the browser set the multipart boundary itself for FormData bodies
  if (init.body instanceof FormData) {
    delete headers['Content-Type'];
  }
  const response = await fetch(input, { ...init, headers });
  if (response.status === 401 && hasBearerAuthorization(headers)) {
    handleUnauthorized();
  }
  return response;
}

export function getApiUrl(path?: string): string {
  if (path) {
    // Strip only a leading /api prefix, not an occurrence deeper in the path
    const normalizedPath = path.startsWith('/api') ? path.slice('/api'.length) : path;
    if (API_BASE_URL.startsWith('http')) {
      return `${API_BASE_URL}${normalizedPath}`;
    }
    return `${window.location.origin}${API_BASE_URL}${normalizedPath}`;
  }
  return API_BASE_URL;
}
