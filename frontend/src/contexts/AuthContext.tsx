import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { API_URL } from "@/lib/utils";
import { logInfo } from "@/lib/logger";
import Keycloak from "keycloak-js";
import { keycloak, isKeycloakConfigured } from "@/lib/keycloak";

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
  isKeycloak: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const KEYCLOAK_TOKEN_KEY = "keycloak_token";
export const ACCESS_TOKEN_KEY = "access_token";

function syncKeycloakTokenToStorage(token: string | undefined) {
  if (token) {
    localStorage.setItem(KEYCLOAK_TOKEN_KEY, token);
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
  } else {
    localStorage.removeItem(KEYCLOAK_TOKEN_KEY);
    localStorage.removeItem(ACCESS_TOKEN_KEY);
  }
}

async function exchangeKeycloakToken(keycloakAccessToken: string): Promise<{ token: string; user: User } | null> {
  const url = `${API_URL.replace(/\/$/, "")}/auth/keycloak-token`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${keycloakAccessToken}` },
  });
  const data = await res.json().catch(() => ({}));
  if (res.ok && data.success && data.token) {
    return { token: data.token as string, user: data.user as User };
  }
  return null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("token"));
  const [loading, setLoading] = useState(true);
  const isKeycloak = isKeycloakConfigured();

  const fetchUserBackend = useCallback(async () => {
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    const res = await api<{ user: User }>("/auth/me");
    if (res.success && res.user) {
      setUser(res.user as User);
    } else {
      setToken(null);
      localStorage.removeItem("token");
      if (isKeycloak) localStorage.removeItem(KEYCLOAK_TOKEN_KEY);
    }
    setLoading(false);
  }, [token, isKeycloak]);

  useEffect(() => {
    if (isKeycloak) {
      keycloak
        .init({
          onLoad: "check-sso",
          silentCheckSsoFallback: true,
          checkLoginIframe: false,
        })
        .then(async (authenticated) => {
          if (authenticated && keycloak.token) {
            const exchanged = await exchangeKeycloakToken(keycloak.token);
            if (exchanged) {
              syncKeycloakTokenToStorage(keycloak.token);
              localStorage.setItem("token", exchanged.token);
              setToken(exchanged.token);
              setUser(exchanged.user);
            } else {
              setToken(null);
              setUser(null);
              syncKeycloakTokenToStorage(undefined);
            }
            setLoading(false);
          } else {
            if (!token) {
              setToken(null);
              setUser(null);
              syncKeycloakTokenToStorage(undefined);
              setLoading(false);
            } else {
              fetchUserBackend();
            }
          }
        })
        .catch(() => {
          setToken(null);
          setUser(null);
          setLoading(false);
        });

      (keycloak as Keycloak & { onTokenRefresh?: () => void }).onTokenRefresh = async () => {
        if (keycloak.token) {
          syncKeycloakTokenToStorage(keycloak.token);
          const exchanged = await exchangeKeycloakToken(keycloak.token);
          if (exchanged) {
            localStorage.setItem("token", exchanged.token);
            setToken(exchanged.token);
            setUser(exchanged.user);
          }
        }
      };
    } else {
      fetchUserBackend();
    }
  }, [isKeycloak]);

  useEffect(() => {
    if (token) fetchUserBackend();
  }, [token, fetchUserBackend]);

  const login = async (email: string, password: string) => {
    if (isKeycloak) {
      const redirectUri: string = `${window.location.origin}/dashboard`;
      keycloak.login({ redirectUri });
      return { success: true };
    }
    const res = await api<{ token: string; user: User }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    if (res.success && res.token) {
      const token = res.token as string;
      const user = (res as { user?: User }).user ?? null;
      localStorage.setItem("token", token);
      setToken(token);
      setUser(user);
      return { success: true };
    }
    return { success: false, msg: res.msg || "Login failed" };
  };

  const register = async (email: string, password: string, name?: string) => {
    if (isKeycloak) {
      const redirectUri: string = `${window.location.origin}/dashboard`;
      keycloak.register({ redirectUri });
      return { success: true };
    }
    const res = await api<{ token: string; user: User }>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password, name }),
    });
    if (res.success && res.token) {
      const token = res.token as string;
      const user = (res as { user?: User }).user ?? null;
      localStorage.setItem("token", token);
      setToken(token);
      setUser(user);
      return { success: true };
    }
    return { success: false, msg: res.msg || "Registration failed" };
  };

  const logout = () => {
    logInfo("auth_logout", "User logged out");
    setToken(null);
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(KEYCLOAK_TOKEN_KEY);
    if (isKeycloak) {
      keycloak.logout({ redirectUri: `${window.location.origin}/login` });
      return;
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, setUser, isKeycloak }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
