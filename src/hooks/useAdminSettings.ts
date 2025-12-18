import { useState, useEffect, useCallback } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";

export interface AppSettings {
  // Coin Economy
  coinsPerAd: number;
  maxAdsPerDay: number;
  dailyBonusAmount: number;
  
  // Conversion
  coinsToInrRate: number; // coins per ₹1
  conversionFee: number; // percentage
  
  // Bonuses
  firstDepositBonus: number; // percentage
  firstPurchaseBonus: number; // coins
  referralBonus: number; // coins
  welcomeBonus: number; // balance
  
  // Features
  enableAdUnlock: boolean;
  enableCoinPayments: boolean;
  maintenanceMode: boolean;
  
  // Admin
  adminTelegramIds: number[];
  
  // API
  apiBaseUrl: string;
}

// Default admin ID - first user to access
const INITIAL_ADMIN_ID = 1095232231;

const DEFAULT_SETTINGS: AppSettings = {
  coinsPerAd: 5,
  maxAdsPerDay: 10,
  dailyBonusAmount: 10,
  coinsToInrRate: 100,
  conversionFee: 2,
  firstDepositBonus: 10,
  firstPurchaseBonus: 50,
  referralBonus: 50,
  welcomeBonus: 500,
  enableAdUnlock: true,
  enableCoinPayments: true,
  maintenanceMode: false,
  adminTelegramIds: [INITIAL_ADMIN_ID],
  apiBaseUrl: "https://api.example.com/v1",
};

export function useAdminSettings() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const settingsRef = doc(db, "config", "settings");
    
    const unsubscribe = onSnapshot(settingsRef, (docSnap) => {
      if (docSnap.exists()) {
        setSettings({ ...DEFAULT_SETTINGS, ...docSnap.data() } as AppSettings);
      } else {
        // Initialize with defaults
        setDoc(settingsRef, DEFAULT_SETTINGS);
        setSettings(DEFAULT_SETTINGS);
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching settings:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const saveSettings = useCallback(async (newSettings: AppSettings) => {
    setSaving(true);
    try {
      const settingsRef = doc(db, "config", "settings");
      await setDoc(settingsRef, newSettings);
      
      // Also update admin config for admin IDs
      const adminRef = doc(db, "config", "admin");
      await setDoc(adminRef, {
        adminTelegramIds: newSettings.adminTelegramIds,
        maintenanceMode: newSettings.maintenanceMode,
      });
      
      return true;
    } catch (error) {
      console.error("Error saving settings:", error);
      return false;
    } finally {
      setSaving(false);
    }
  }, []);

  const updateSetting = useCallback(<K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }, []);

  return {
    settings,
    loading,
    saving,
    saveSettings,
    updateSetting,
  };
}
