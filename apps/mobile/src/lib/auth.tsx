import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import { api } from './api';

interface User {
  id: string;
  name: string;
  phone: string;
  role: 'ADMIN' | 'WORKER' | 'RESIDENT';
  address?: string;
  points: number;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (phone: string, password: string) => Promise<User>;
  register: (name: string, phone: string, password: string, address?: string) => Promise<User>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const saved = await SecureStore.getItemAsync('ekonaryn_token');
        if (saved) {
          setToken(saved);
          const res = await api.get<{ data: User }>('/auth/me', saved);
          setUser(res.data);
        }
      } catch {
        await SecureStore.deleteItemAsync('ekonaryn_token');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = async (phone: string, password: string) => {
    const res = await api.post<{ data: { user: User; accessToken: string } }>('/auth/login', { phone, password });
    const { user: u, accessToken } = res.data;
    setUser(u);
    setToken(accessToken);
    await SecureStore.setItemAsync('ekonaryn_token', accessToken);
    return u;
  };

  const register = async (name: string, phone: string, password: string, address?: string) => {
    const res = await api.post<{ data: { user: User; accessToken: string } }>('/auth/register', { name, phone, password, address });
    const { user: u, accessToken } = res.data;
    setUser(u);
    setToken(accessToken);
    await SecureStore.setItemAsync('ekonaryn_token', accessToken);
    return u;
  };

  const logout = async () => {
    setUser(null);
    setToken(null);
    await SecureStore.deleteItemAsync('ekonaryn_token');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
