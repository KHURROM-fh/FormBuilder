const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://16.171.253.148:8000';

export interface User {
  id: number;
  email: string;
  name: string;
  is_admin: boolean;
  created_at?: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface AuthResponse {
  message: string;
  user: User;
  tokens: AuthTokens;
}

// Helper to extract a friendly error message from DRF responses
export function parseApiError(errorData: unknown): string {
  if (!errorData) return 'An unexpected error occurred. Please try again.';

  if (typeof errorData === 'string') return errorData;

  if (typeof errorData === 'object' && errorData !== null) {
    const errObj = errorData as Record<string, unknown>;

    if (errObj.detail && typeof errObj.detail === 'string') {
      return errObj.detail;
    }

    if (errObj.message && typeof errObj.message === 'string') {
      return errObj.message;
    }

    if (errObj.errors) {
      return parseApiError(errObj.errors);
    }

    // Collect first field error or non_field_errors
    const values = Object.values(errObj);
    if (values.length > 0) {
      const firstVal = values[0];
      if (Array.isArray(firstVal) && firstVal.length > 0) {
        return String(firstVal[0]);
      }
      if (typeof firstVal === 'string') {
        return firstVal;
      }
    }
  }

  return 'Request failed. Please check your input.';
}

export const api = {
  async register(data: { name: string; email: string; password: string; password2: string }): Promise<AuthResponse> {
    const res = await fetch(`${API_BASE_URL}/api/auth/register/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const body = await res.json();
    if (!res.ok) {
      throw new Error(parseApiError(body));
    }
    return body;
  },

  async login(data: { email: string; password: string }): Promise<AuthResponse> {
    const res = await fetch(`${API_BASE_URL}/api/auth/login/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const body = await res.json();
    if (!res.ok) {
      throw new Error(parseApiError(body));
    }
    return body;
  },

  async getProfile(accessToken: string): Promise<User> {
    const res = await fetch(`${API_BASE_URL}/api/auth/profile/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const body = await res.json();
    if (!res.ok) {
      throw new Error(parseApiError(body));
    }
    return body;
  },

  async logout(refreshToken: string, accessToken?: string): Promise<void> {
    try {
      await fetch(`${API_BASE_URL}/api/auth/logout/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({ refresh: refreshToken }),
      });
    } catch {
      // Even if the network call fails, we still clean local storage
    }
  },

  async refreshToken(refresh: string): Promise<{ access: string }> {
    const res = await fetch(`${API_BASE_URL}/api/auth/token/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh }),
    });

    const body = await res.json();
    if (!res.ok) {
      throw new Error('Session expired');
    }
    return body;
  },
};
