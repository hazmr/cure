'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export interface User {
  id: string;
  email: string;
  role: 'admin' | 'nurse' | 'patient';
  firstName: string;
  lastName: string;
  phone?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<any>;
  register: (firstName: string, lastName: string, email: string, password: string) => Promise<any>;
  logout: () => Promise<void>;
  apiFetch: (path: string, options?: RequestInit) => Promise<Response>;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const router = useRouter();
  const pathname = usePathname();

  // Load theme and session on mount
  useEffect(() => {
    // 1. Theme initialization
    const storedTheme = localStorage.getItem('cure_theme') as 'light' | 'dark' | null;
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = storedTheme || (systemPrefersDark ? 'dark' : 'light');
    setTheme(initialTheme);
    if (initialTheme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.removeAttribute('data-theme');
    }

    // 2. Auth session initialization
    const storedUser = localStorage.getItem('cure_user');
    const storedAccess = localStorage.getItem('cure_access_token');
    if (storedUser && storedAccess) {
      setUser(JSON.parse(storedUser));
      setAccessToken(storedAccess);
    }
    setIsLoading(false);
  }, []);

  // Sync theme to DOM
  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    localStorage.setItem('cure_theme', nextTheme);
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.removeAttribute('data-theme');
    }
  };

  const logoutLocally = () => {
    localStorage.removeItem('cure_user');
    localStorage.removeItem('cure_access_token');
    localStorage.removeItem('cure_refresh_token');
    setUser(null);
    setAccessToken(null);
    router.push('/login');
  };

  // Reusable fetch wrapper with automatic JWT refresh interception
  const apiFetch = async (path: string, options: RequestInit = {}): Promise<Response> => {
    let token = accessToken;
    if (!token) {
      token = localStorage.getItem('cure_access_token');
    }

    const headers = new Headers(options.headers || {});
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    const response = await fetch(path, { ...options, headers });

    // Handle session expiration
    if (response.status === 401 && !path.includes('/auth/login') && !path.includes('/auth/refresh')) {
      const rToken = localStorage.getItem('cure_refresh_token');
      if (rToken) {
        try {
          const refreshRes = await fetch('/api/auth/refresh', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken: rToken }),
          });

          if (refreshRes.ok) {
            const result = await refreshRes.json();
            // NestJS response structure wraps payload in .data
            const newAccess = result.data.accessToken;
            const newRefresh = result.data.refreshToken;
            const newUser = result.data.user;

            localStorage.setItem('cure_access_token', newAccess);
            localStorage.setItem('cure_refresh_token', newRefresh);
            localStorage.setItem('cure_user', JSON.stringify(newUser));

            setAccessToken(newAccess);
            setUser(newUser);

            // Retry the original query
            const retryHeaders = new Headers(options.headers || {});
            retryHeaders.set('Authorization', `Bearer ${newAccess}`);
            if (!(options.body instanceof FormData) && !retryHeaders.has('Content-Type')) {
              retryHeaders.set('Content-Type', 'application/json');
            }
            return await fetch(path, { ...options, headers: retryHeaders });
          }
        } catch (err) {
          console.error('Token refresh execution failed:', err);
        }
      }
      logoutLocally();
    }

    return response;
  };

  const login = async (email: string, password: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const body = await res.json();
    if (!res.ok) {
      throw new Error(body.message || 'Login failed. Please check credentials.');
    }

    const { user: userProfile, accessToken: newAccess, refreshToken: newRefresh } = body.data;
    localStorage.setItem('cure_user', JSON.stringify(userProfile));
    localStorage.setItem('cure_access_token', newAccess);
    localStorage.setItem('cure_refresh_token', newRefresh);

    setUser(userProfile);
    setAccessToken(newAccess);
    return userProfile;
  };

  const register = async (firstName: string, lastName: string, email: string, password: string) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ firstName, lastName, email, password }),
    });

    const body = await res.json();
    if (!res.ok) {
      throw new Error(body.message || 'Registration failed. Try again.');
    }

    const { user: userProfile, accessToken: newAccess, refreshToken: newRefresh } = body.data;
    localStorage.setItem('cure_user', JSON.stringify(userProfile));
    localStorage.setItem('cure_access_token', newAccess);
    localStorage.setItem('cure_refresh_token', newRefresh);

    setUser(userProfile);
    setAccessToken(newAccess);
    return userProfile;
  };

  const logout = async () => {
    const rToken = localStorage.getItem('cure_refresh_token');
    try {
      await apiFetch('/api/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ refreshToken: rToken }),
      });
    } catch (e) {
      console.warn('Backend signout call failed:', e);
    } finally {
      logoutLocally();
    }
  };

  // Route protection rules
  useEffect(() => {
    if (isLoading) return;

    const isDashboardRoute = pathname.startsWith('/dashboard');
    const isAuthRoute = pathname === '/login' || pathname === '/register';

    if (isDashboardRoute && !user) {
      router.push('/login');
    } else if (isAuthRoute && user) {
      router.push(`/dashboard/${user.role}`);
    } else if (isDashboardRoute && user) {
      // Prevent role access bypass (e.g. patients viewing /dashboard/admin)
      const allowedRoles = ['admin', 'nurse', 'patient'];
      const targetRole = pathname.split('/')[2];
      if (allowedRoles.includes(targetRole) && user.role !== targetRole) {
        router.push(`/dashboard/${user.role}`);
      }
    }
  }, [user, pathname, isLoading, router]);

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        isLoading,
        login,
        register,
        logout,
        apiFetch,
        theme,
        toggleTheme,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be called inside an AuthProvider');
  }
  return context;
};

export const useTheme = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useTheme must be called inside an AuthProvider');
  }
  return { theme: context.theme, toggleTheme: context.toggleTheme };
};
