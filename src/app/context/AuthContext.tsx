import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { setAuthToken, getAuthToken } from "../services/api";
import { loginRequest, registerRequest, type AuthUser, type RegisterPayload } from "../services/authService";

type StoredUser = Omit<AuthUser, "token">;
const USER_KEY = "talaga_auth_user";

type AuthContextValue = {
  user: StoredUser | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<AuthUser>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function loadStoredUser(): StoredUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredUser;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<StoredUser | null>(() => (getAuthToken() ? loadStoredUser() : null));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    try {
      if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
      else localStorage.removeItem(USER_KEY);
    } catch {
      // ignore
    }
  }, [user]);

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    try {
      const res = await loginRequest(email, password);
      setAuthToken(res.token);
      const { token: _t, ...stored } = res;
      setUser(stored);
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (payload: RegisterPayload) => {
    setLoading(true);
    try {
      return await registerRequest(payload);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setAuthToken(null);
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    isAuthenticated: user !== null,
    loading,
    login,
    register,
    logout,
  }), [user, loading, login, register, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
