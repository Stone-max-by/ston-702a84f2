import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AdminAuthContextType {
  isAdminAuthenticated: boolean;
  adminLoading: boolean;
  adminLogin: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  adminLogout: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

const ADMIN_TOKEN_KEY = 'admin_session_token';

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [adminLoading, setAdminLoading] = useState(true);

  useEffect(() => {
    // Verify existing token on mount
    const token = sessionStorage.getItem(ADMIN_TOKEN_KEY);
    if (!token) {
      setAdminLoading(false);
      return;
    }

    supabase.functions.invoke('admin-auth', {
      body: { action: 'verify', token },
    }).then(({ data, error }) => {
      if (!error && data?.valid) {
        setIsAdminAuthenticated(true);
      } else {
        sessionStorage.removeItem(ADMIN_TOKEN_KEY);
      }
      setAdminLoading(false);
    }).catch(() => {
      sessionStorage.removeItem(ADMIN_TOKEN_KEY);
      setAdminLoading(false);
    });
  }, []);

  const adminLogin = async (username: string, password: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('admin-auth', {
        body: { action: 'login', username, password },
      });

      if (error) return { success: false, error: 'Server error' };
      if (data?.error) return { success: false, error: data.error };
      if (data?.token) {
        sessionStorage.setItem(ADMIN_TOKEN_KEY, data.token);
        setIsAdminAuthenticated(true);
        return { success: true };
      }
      return { success: false, error: 'Unknown error' };
    } catch {
      return { success: false, error: 'Network error' };
    }
  };

  const adminLogout = () => {
    sessionStorage.removeItem(ADMIN_TOKEN_KEY);
    setIsAdminAuthenticated(false);
  };

  return (
    <AdminAuthContext.Provider value={{ isAdminAuthenticated, adminLoading, adminLogin, adminLogout }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuthContext() {
  const context = useContext(AdminAuthContext);
  if (!context) throw new Error('useAdminAuthContext must be used within AdminAuthProvider');
  return context;
}
