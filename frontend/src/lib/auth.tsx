"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { api } from "./api";

interface AuthContextType {
  token: string | null;
  isAuthenticated: boolean;
  hydrated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, business_name: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  token: null,
  isAuthenticated: false,
  hydrated: false,
  login: async () => {},
  register: async () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const t = localStorage.getItem("access_token");
    if (t) {
      api.setToken(t);
      setToken(t);
    }
    setHydrated(true);
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.login(email, password);
    api.setToken(res.access_token);
    setToken(res.access_token);
  };

  const register = async (email: string, password: string, business_name: string) => {
    await api.register(email, password, business_name);
    await login(email, password);
  };

  const logout = () => {
    api.setToken(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ token, isAuthenticated: !!token, hydrated, login, register, logout }}>
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
