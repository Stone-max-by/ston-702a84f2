// Telegram WebApp types
declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        initData: string;
        initDataUnsafe: {
          user?: {
            id: number;
            first_name: string;
            last_name?: string;
            username?: string;
            photo_url?: string;
            language_code?: string;
          };
          start_param?: string; // Referral code from deep link
          auth_date?: number;
          hash?: string;
        };
        ready: () => void;
        expand: () => void;
        close: () => void;
        isExpanded: boolean;
        viewportHeight: number;
        viewportStableHeight: number;
        headerColor: string;
        backgroundColor: string;
        setHeaderColor: (color: string) => void;
        setBackgroundColor: (color: string) => void;
        enableClosingConfirmation: () => void;
        disableClosingConfirmation: () => void;
        MainButton: {
          text: string;
          color: string;
          textColor: string;
          isVisible: boolean;
          isActive: boolean;
          show: () => void;
          hide: () => void;
          enable: () => void;
          disable: () => void;
          setText: (text: string) => void;
          onClick: (callback: () => void) => void;
          offClick: (callback: () => void) => void;
        };
        BackButton: {
          isVisible: boolean;
          show: () => void;
          hide: () => void;
          onClick: (callback: () => void) => void;
          offClick: (callback: () => void) => void;
        };
        HapticFeedback: {
          impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
          notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
          selectionChanged: () => void;
        };
      };
    };
  }
}

export const isTelegramWebApp = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  const webApp = window.Telegram?.WebApp;
  if (!webApp) return false;
  
  // Check if user data exists (more reliable than initData)
  const hasUser = webApp.initDataUnsafe?.user?.id !== undefined;
  const hasInitData = webApp.initData !== undefined && webApp.initData !== '';
  
  console.log('Telegram WebApp check:', { hasUser, hasInitData, user: webApp.initDataUnsafe?.user });
  
  return hasUser || hasInitData;
};

export const getTelegramUser = () => {
  if (typeof window === 'undefined') return null;
  const user = window.Telegram?.WebApp?.initDataUnsafe?.user;
  console.log('Getting Telegram user:', user);
  return user || null;
};

export const getTelegramStartParam = (): string | null => {
  if (typeof window === 'undefined') return null;
  const startParam = window.Telegram?.WebApp?.initDataUnsafe?.start_param;
  console.log('Telegram start_param (referral code):', startParam);
  return startParam || null;
};

export const getTelegramWebApp = () => {
  if (typeof window === 'undefined') return null;
  return window.Telegram?.WebApp || null;
};

export const initTelegramWebApp = () => {
  const webApp = getTelegramWebApp();
  if (webApp) {
    console.log('Initializing Telegram WebApp');
    webApp.ready();
    webApp.expand();
    // Set theme colors to match app
    webApp.setHeaderColor('#000000');
    webApp.setBackgroundColor('#000000');
  }
};
