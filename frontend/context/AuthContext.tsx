"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { UserProfile } from "@/lib/types";
import {
  getStoredToken,
  setStoredToken,
  getStoredGroqKey,
  setStoredGroqKey,
} from "@/lib/api/client";
import {
  loginUser,
  registerUser,
  getMe,
  saveGroqKey,
  deleteGroqKey,
  validateGroqKey,
} from "@/lib/api/auth";

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  groqKey: string | null;
  loading: boolean;
  isAuthModalOpen: boolean;
  isByokModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  openByokModal: () => void;
  closeByokModal: () => void;
  login: (email: string, pass: string) => Promise<void>;
  register: (email: string, pass: string, name?: string) => Promise<void>;
  logout: () => void;
  setGroqApiKey: (key: string, saveToAccount?: boolean) => Promise<void>;
  clearGroqApiKey: () => Promise<void>;
  checkGroqKeyValid: (key: string) => Promise<{ valid: boolean; message: string }>;
  /** True if a Groq key is available (localStorage or saved account key) */
  hasGroqKey: boolean;
  /** Call before any LLM action. Returns true if key exists, otherwise opens BYOK modal and returns false. */
  requireGroqKey: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [groqKey, setGroqKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isByokModalOpen, setIsByokModalOpen] = useState(false);

  // Initialize from localStorage
  useEffect(() => {
    const storedToken = getStoredToken();
    const storedKey = getStoredGroqKey();
    if (storedToken) {
      setToken(storedToken);
      getMe()
        .then((profile) => setUser(profile))
        .catch(() => {
          // Token expired or invalid
          setStoredToken(null);
          setToken(null);
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }

    if (storedKey) {
      setGroqKey(storedKey);
    }
  }, []);

  const login = async (email: string, pass: string) => {
    const res = await loginUser({ email, password: pass });
    setStoredToken(res.access_token);
    setToken(res.access_token);
    setUser({
      id: res.user_id,
      email: res.email,
      name: res.name,
      has_groq_key: res.has_groq_key,
    });
    setIsAuthModalOpen(false);
  };

  const register = async (email: string, pass: string, name?: string) => {
    const res = await registerUser({ email, password: pass, name });
    setStoredToken(res.access_token);
    setToken(res.access_token);
    setUser({
      id: res.user_id,
      email: res.email,
      name: res.name,
      has_groq_key: res.has_groq_key,
    });
    setIsAuthModalOpen(false);
  };

  const logout = () => {
    setStoredToken(null);
    setToken(null);
    setUser(null);
  };

  const setGroqApiKey = async (key: string, saveToAccount: boolean = false) => {
    setStoredGroqKey(key);
    setGroqKey(key);
    if (saveToAccount && token) {
      try {
        const updated = await saveGroqKey(key);
        setUser(updated);
      } catch (err) {
        console.warn("Failed to persist Groq key to account:", err);
      }
    }
  };

  const clearGroqApiKey = async () => {
    setStoredGroqKey(null);
    setGroqKey(null);
    if (token && user?.has_groq_key) {
      try {
        await deleteGroqKey();
        setUser((prev) => (prev ? { ...prev, has_groq_key: false, masked_key: undefined } : null));
      } catch (err) {
        console.warn("Failed to delete Groq key from account:", err);
      }
    }
  };

  const checkGroqKeyValid = async (key: string) => {
    return await validateGroqKey(key);
  };

  /** True when a key is available from localStorage or the user's saved account key */
  const hasGroqKey = !!(groqKey || user?.has_groq_key);

  /** Guard for LLM actions — opens BYOK modal and returns false if no key */
  const requireGroqKey = (): boolean => {
    if (hasGroqKey) return true;
    setIsByokModalOpen(true);
    return false;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        groqKey,
        loading,
        isAuthModalOpen,
        isByokModalOpen,
        openAuthModal: () => setIsAuthModalOpen(true),
        closeAuthModal: () => setIsAuthModalOpen(false),
        openByokModal: () => setIsByokModalOpen(true),
        closeByokModal: () => setIsByokModalOpen(false),
        login,
        register,
        logout,
        setGroqApiKey,
        clearGroqApiKey,
        checkGroqKeyValid,
        hasGroqKey,
        requireGroqKey,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
