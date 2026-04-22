import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Platform } from 'react-native';
import { api } from './api';

// Web-safe storage wrapper
const storage = {
  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      return localStorage.getItem(key);
    }
    const SecureStore = await import('expo-secure-store');
    return SecureStore.getItem(key);
  },
  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      localStorage.setItem(key, value);
      return;
    }
    const SecureStore = await import('expo-secure-store');
    await SecureStore.setItemAsync(key, value);
  },
  async deleteItem(key: string): Promise<void> {
    if (Platform.OS === 'web') {
      localStorage.removeItem(key);
      return;
    }
    const SecureStore = await import('expo-secure-store');
    await SecureStore.deleteItemAsync(key);
  },
};

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
        const saved = await storage.getItem('ekonaryn_token');
        if (saved) {
          setToken(saved);
          const res = await api.get<{ data: User }>('/auth/me', saved);
          setUser(res.data);
        }
      } catch {
        await storage.deleteItem('ekonaryn_token');
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
    await storage.setItem('ekonaryn_token', accessToken);
    return u;
  };

  const register = async (name: string, phone: string, password: string, address?: string) => {
    const res = await api.post<{ data: { user: User; accessToken: string } }>('/auth/register', { name, phone, password, address });
    const { user: u, accessToken } = res.data;
    setUser(u);
    setToken(accessToken);
    await storage.setItem('ekonaryn_token', accessToken);
    return u;
  };

  const logout = async () => {
    setUser(null);
    setToken(null);
    try {
      await storage.deleteItem('ekonaryn_token');
    } catch {
      // ignore storage errors on logout
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
