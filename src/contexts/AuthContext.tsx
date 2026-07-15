import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { authAPI, type User } from '@/lib/api/auth';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  checkSession: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkSession = async () => {
    try {
      setIsLoading(true);
      
      // Check if token exists in localStorage (fallback)
      const token = authAPI.getToken();
      if (!token) {
        setUser(null);
        setIsLoading(false);
        return;
      }

      // Verify token with backend
      const userData = await authAPI.verifyToken();
      if (userData) {
        setUser(userData);
      } else {
        setUser(null);
        authAPI.logout();
      }
    } catch (error) {
      console.error('Session check error:', error);
      setUser(null);
      authAPI.logout();
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    await authAPI.logout();
    setUser(null);
  };

  useEffect(() => {
    checkSession();
  }, []);

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    checkSession,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

