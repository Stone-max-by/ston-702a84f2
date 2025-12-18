import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { doc, onSnapshot, setDoc } from "firebase/firestore";

interface AdminConfig {
  adminTelegramIds: number[];
  maintenanceMode: boolean;
}

// Default admin ID
const INITIAL_ADMIN_ID = 1095232231;

export function useAdminAuth() {
  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminConfig, setAdminConfig] = useState<AdminConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen to admin config in real-time
    const configRef = doc(db, "config", "admin");
    
    const unsubscribe = onSnapshot(configRef, async (docSnap) => {
      if (docSnap.exists()) {
        const config = docSnap.data() as AdminConfig;
        setAdminConfig(config);
        
        // Check if current user is admin
        if (user?.telegramId) {
          setIsAdmin(config.adminTelegramIds.includes(user.telegramId));
        } else {
          setIsAdmin(false);
        }
      } else {
        // Initialize with default admin ID
        const defaultConfig: AdminConfig = {
          adminTelegramIds: [INITIAL_ADMIN_ID],
          maintenanceMode: false,
        };
        
        // Create the config document
        try {
          await setDoc(configRef, defaultConfig);
          setAdminConfig(defaultConfig);
          
          if (user?.telegramId) {
            setIsAdmin(defaultConfig.adminTelegramIds.includes(user.telegramId));
          }
        } catch (error) {
          console.error("Error creating admin config:", error);
          setAdminConfig(defaultConfig);
          // Still check admin status even if write fails
          if (user?.telegramId) {
            setIsAdmin(defaultConfig.adminTelegramIds.includes(user.telegramId));
          }
        }
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching admin config:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  return {
    isAdmin,
    adminConfig,
    loading: loading || authLoading,
    user,
  };
}
