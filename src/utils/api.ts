// API utility for making authenticated requests to the backend

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

interface ApiOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

// Get auth token from localStorage
function getAuthToken(): string | null {
  try {
    const authStore = localStorage.getItem('brilla-auth-v1');
    if (authStore) {
      const parsed = JSON.parse(authStore);
      return parsed.state?.token || null;
    }
  } catch {
    // Ignore errors
  }
  return null;
}

// Get user info for headers
function getUserInfo(): { userId?: string; role?: string } {
  try {
    const authStore = localStorage.getItem('brilla-auth-v1');
    if (authStore) {
      const parsed = JSON.parse(authStore);
      const user = parsed.state?.user;
      return {
        userId: user?.id,
        role: user?.role,
      };
    }
  } catch {
    // Ignore errors
  }
  return {};
}

// Build URL with query parameters
function buildUrl(endpoint: string, params?: Record<string, string | number | boolean | undefined>): string {
  const url = new URL(endpoint, window.location.origin);

  if (!endpoint.startsWith('http')) {
    url.pathname = `${API_BASE_URL}${endpoint}`;
  }

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.append(key, String(value));
      }
    });
  }

  return url.toString();
}

// Main API request function
async function request<T>(endpoint: string, options: ApiOptions = {}): Promise<ApiResponse<T>> {
  const { params, ...fetchOptions } = options;

  const token = getAuthToken();
  const userInfo = getUserInfo();

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  // Add user info headers for protected routes
  if (userInfo.userId) {
    (headers as Record<string, string>)['x-user-id'] = userInfo.userId;
  }
  if (userInfo.role) {
    (headers as Record<string, string>)['x-user-role'] = userInfo.role;
  }

  const url = buildUrl(endpoint, params);

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new ApiError(data.error || 'Request failed', response.status);
    }

    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    // Network or parsing error
    console.error('API request error:', error);
    throw new ApiError('Network error. Please check your connection.', 0);
  }
}

// Convenience methods
export const api = {
  get: <T>(endpoint: string, params?: Record<string, string | number | boolean | undefined>) =>
    request<T>(endpoint, { method: 'GET', params }),

  post: <T>(endpoint: string, body?: unknown, params?: Record<string, string | number | boolean | undefined>) =>
    request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
      params,
    }),

  put: <T>(endpoint: string, body?: unknown) =>
    request<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    }),

  delete: <T>(endpoint: string) =>
    request<T>(endpoint, { method: 'DELETE' }),

  upload: async <T>(endpoint: string, formData: FormData): Promise<ApiResponse<T>> => {
    const token = getAuthToken();
    const userInfo = getUserInfo();

    const headers: HeadersInit = {};

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    if (userInfo.userId) {
      headers['x-user-id'] = userInfo.userId;
    }
    if (userInfo.role) {
      headers['x-user-role'] = userInfo.role;
    }

    const url = buildUrl(endpoint);

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new ApiError(data.error || 'Upload failed', response.status);
    }

    return data;
  },
};

export { ApiError };
export type { ApiResponse };
