"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";

export interface User {
  name: string;
  email: string;
  phone?: string;
}

interface AuthContextValue {
  user: User | null;
  authModalMode: "login" | "signup" | null;
  setAuthModalMode: (mode: "login" | "signup" | null) => void;
  signup: (name: string, email: string, phone: string) => void;
  login: (email: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authModalMode, setAuthModalMode] = useState<"login" | "signup" | null>(null);

  useEffect(() => {
    try {
      const savedUser = localStorage.getItem("ustaadpro_user");
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
    } catch {}
  }, []);

  const signup = useCallback((name: string, email: string, phone: string) => {
    const newUser: User = { name, email, phone };
    setUser(newUser);
    try {
      localStorage.setItem("ustaadpro_user", JSON.stringify(newUser));
    } catch {}
    setAuthModalMode(null);
  }, []);

  const login = useCallback((email: string) => {
    // Simulating login
    const mockUser: User = {
      name: email.split("@")[0].charAt(0).toUpperCase() + email.split("@")[0].slice(1),
      email,
      phone: "+92 300 1234567",
    };
    setUser(mockUser);
    try {
      localStorage.setItem("ustaadpro_user", JSON.stringify(mockUser));
    } catch {}
    setAuthModalMode(null);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    try {
      localStorage.removeItem("ustaadpro_user");
    } catch {}
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        authModalMode,
        setAuthModalMode,
        signup,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
