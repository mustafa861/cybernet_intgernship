"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { api } from "./api";

interface UserInfo {
  email: string;
  business_name: string;
  phone?: string;
  currency?: string;
}

interface AuthContextType {
  token: string | null;
  user: UserInfo | null;
  isAuthenticated: boolean;
  hydrated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, business_name: string, phone?: string, currency?: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  token: null,
  user: null,
  isAuthenticated: false,
  hydrated: false,
  login: async () => {},
  register: async () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const t = localStorage.getItem("access_token");
    if (t) {
      api.setToken(t);
      setToken(t);
    }
    const stored = localStorage.getItem("user_info");
    if (stored) {
      try { setUser(JSON.parse(stored)); } catch {}
    }
    setHydrated(true);
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.login(email, password);
    api.setToken(res.access_token);
    setToken(res.access_token);
    const info: UserInfo = { email: res.email, business_name: res.business_name, phone: res.phone, currency: res.currency };
    setUser(info);
    localStorage.setItem("user_info", JSON.stringify(info));
  };

  const register = async (email: string, password: string, business_name: string, phone?: string, currency?: string) => {
    await api.register(email, password, business_name, phone, currency);
    await login(email, password);
  };

  const logout = () => {
    api.setToken(null);
    setToken(null);
    setUser(null);
    localStorage.removeItem("access_token");
    localStorage.removeItem("user_info");
  };

  return (
    <AuthContext.Provider value={{ token, user, isAuthenticated: !!token, hydrated, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

export function useAuthGuard() {
  const { isAuthenticated, hydrated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (hydrated && !isAuthenticated) {
      router.replace("/login");
    }
  }, [hydrated, isAuthenticated, router]);

  return { isAuthenticated, hydrated, ready: hydrated && isAuthenticated };
}
