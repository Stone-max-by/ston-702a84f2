import React, { createContext, useContext, useEffect, useState } from 'react';
import { isTelegramWebApp, getTelegramUser, initTelegramWebApp } from '@/lib/telegram';

interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
}

export interface AuthUser {
  id: string;
  displayName: string;
  photoURL?: string;
  isTelegram: boolean;
  telegramId?: number;
  username?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  isTelegram: boolean;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isTelegram, setIsTelegram] = useState(false);

  useEffect(() => {
    let attempts = 0;
    const maxAttempts = 20;
    const intervalMs = 150;

    const tryInit = () => {
      attempts += 1;

      const telegramCheck = isTelegramWebApp();
      console.log('Auth: Telegram check result:', telegramCheck);

      if (telegramCheck) {
        setIsTelegram(true);

        // Initialize Telegram WebApp and auto-login
        initTelegramWebApp();
        const telegramUser = getTelegramUser();
        console.log('Auth: Telegram user:', telegramUser);

        if (telegramUser) {
          const authUser: AuthUser = {
            id: `tg_${telegramUser.id}`,
            displayName: [telegramUser.first_name, telegramUser.last_name].filter(Boolean).join(' '),
            photoURL: telegramUser.photo_url,
            isTelegram: true,
            telegramId: telegramUser.id,
            username: telegramUser.username,
          };
          console.log('Auth: Setting Telegram user:', authUser);
          setUser(authUser);
          setLoading(false);
          return true;
        }
      }

      if (attempts >= maxAttempts) {
        setLoading(false);
        return true;
      }

      return false;
    };

    // Try immediately, then retry for a moment (Telegram WebApp may become ready a bit later)
    if (tryInit()) return;

    const intervalId = window.setInterval(() => {
      if (tryInit()) window.clearInterval(intervalId);
    }, intervalMs);

    return () => window.clearInterval(intervalId);
  }, []);

  const signOut = () => {
    // In Telegram, we can close the app
    if (isTelegram && window.Telegram?.WebApp) {
      window.Telegram.WebApp.close();
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      isTelegram,
      signOut
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
