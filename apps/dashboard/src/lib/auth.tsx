'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from './api';

interface User {
  id: string;
  name: string;
  phone: string;
  role: string;
  points: number;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (phone: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  login: async () => {},
  logout: () => {},
  loading: true,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('ekonaryn_token');
    if (saved) {
      setToken(saved);
      api
        .get<{ data: User }>('/auth/me', saved)
        .then((res) => setUser(res.data))
        .catch(() => {
          localStorage.removeItem('ekonaryn_token');
          setToken(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (phone: string, password: string) => {
    const res = await api.post<{ data: { user: User; accessToken: string; refreshToken: string } }>(
      '/auth/login',
      { phone, password },
    );
    const { user: u, accessToken } = res.data;
    if (u.role !== 'ADMIN') throw new Error('Access denied. Admin only.');
    setUser(u);
    setToken(accessToken);
    localStorage.setItem('ekonaryn_token', accessToken);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('ekonaryn_token');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
