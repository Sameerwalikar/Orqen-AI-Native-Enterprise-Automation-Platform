const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export interface SignUpData {
  firstName: string;
  gmail: string;
  password: string;
}

export interface SignInData {
  gmail: string;
  password: string;
  rememberMe?: boolean;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data?: {
    user: {
      id: number;
      firstName: string;
      gmail: string;
      avatarUrl?: string | null;
      createdAt: string;
    };
    token: string;
  };
}

export interface GoogleSignInResponse extends AuthResponse {}

export interface User {
  id: number;
  firstName: string;
  gmail: string;
  avatarUrl?: string | null;
  createdAt: string;
}

export interface UpdateProfileData {
  firstName: string;
}

export interface UpdateProfileResponse {
  success: boolean;
  message: string;
  data?: {
    user: {
      id: number;
      firstName: string;
      gmail: string;
      avatarUrl?: string | null;
      createdAt: string;
    };
  };
}

class AuthAPI {
  async signUp(data: SignUpData): Promise<AuthResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/sign-up`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      const result: AuthResponse = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Sign up failed');
      }

      // Store token in localStorage as fallback
      if (result.data?.token) {
        localStorage.setItem('auth_token', result.data.token);
        localStorage.setItem('user', JSON.stringify(result.data.user));
      }

      return result;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('An unexpected error occurred');
    }
  }

  async signIn(data: SignInData): Promise<AuthResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/sign-in`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          gmail: data.gmail,
          password: data.password,
          rememberMe: data.rememberMe || false
        }),
      });

      const result: AuthResponse = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Sign in failed');
      }

      // Store token in localStorage as fallback
      if (result.data?.token) {
        localStorage.setItem('auth_token', result.data.token);
        localStorage.setItem('user', JSON.stringify(result.data.user));
      }

      return result;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('An unexpected error occurred');
    }
  }

  async signInWithGoogle(idToken: string): Promise<GoogleSignInResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/google`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ idToken }),
      });

      const result: GoogleSignInResponse = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Google sign-in failed');
      }

      if (result.data?.token) {
        localStorage.setItem('auth_token', result.data.token);
        localStorage.setItem('user', JSON.stringify(result.data.user));
      }

      return result;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('An unexpected error occurred during Google sign-in');
    }
  }

  async logout(): Promise<void> {
    try {
      const token = this.getToken();
      if (token) {
        await fetch(`${API_BASE_URL}/api/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          credentials: 'include'
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
    }
  }

  getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  async verifyToken(): Promise<User | null> {
    try {
      const token = this.getToken();
      if (!token) return null;

      const response = await fetch(`${API_BASE_URL}/api/auth/verify`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include'
      });

      if (!response.ok) {
        this.logout();
        return null;
      }

      const result = await response.json();
      if (result.success && result.data?.user) {
        localStorage.setItem('user', JSON.stringify(result.data.user));
        return result.data.user;
      }

      return null;
    } catch (error) {
      console.error('Verify token error:', error);
      return null;
    }
  }

  getUser(): User | null {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  async updateProfile(data: UpdateProfileData): Promise<UpdateProfileResponse> {
    try {
      const token = this.getToken();
      
      if (!token) {
        throw new Error('You must be logged in to update your profile');
      }

      const response = await fetch(`${API_BASE_URL}/api/auth/update-profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      const result: UpdateProfileResponse = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to update profile');
      }

      // Update user in localStorage
      if (result.data?.user) {
        localStorage.setItem('user', JSON.stringify(result.data.user));
      }

      return result;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('An unexpected error occurred while updating your profile');
    }
  }
}

export const authAPI = new AuthAPI();
