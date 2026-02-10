import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { logInfo } from "@/lib/logger";

interface User {
  id: string;
  email: string;
  name?: string;
}

interface AuthContextValue {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; msg?: string }>;
  register: (email: string, password: string, name?: string) => Promise<{ success: boolean; msg?: string }>;
  logout: () => void;
  setUser: (u: User | null) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("token"));
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    const res = await api<{ user: User }>("/auth/me");
    if (res.success && res.user) {
      setUser(res.user);
    } else {
      setToken(null);
      localStorage.removeItem("token");
    }
    setLoading(false);
  }, [token]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const login = async (email: string, password: string) => {
    const res = await api<{ token: string; user: User }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    if (res.success && res.token) {
      localStorage.setItem("token", res.token);
      setToken(res.token);
      setUser(res.user || null);
      return { success: true };
    }
    return { success: false, msg: res.msg || "Login failed" };
  };

  const register = async (email: string, password: string, name?: string) => {
    const res = await api<{ token: string; user: User }>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password, name }),
    });
    if (res.success && res.token) {
      localStorage.setItem("token", res.token);
      setToken(res.token);
      setUser(res.user || null);
      return { success: true };
    }
    return { success: false, msg: res.msg || "Registration failed" };
  };

  const logout = () => {
    logInfo("auth_logout", "User logged out");
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
