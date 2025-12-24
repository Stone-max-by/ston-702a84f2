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
        isFullscreen: boolean;
        viewportHeight: number;
        viewportStableHeight: number;
        headerColor: string;
        backgroundColor: string;
        setHeaderColor: (color: string) => void;
        setBackgroundColor: (color: string) => void;
        enableClosingConfirmation: () => void;
        disableClosingConfirmation: () => void;
        requestFullscreen: () => void;
        exitFullscreen: () => void;
        lockOrientation: () => void;
        unlockOrientation: () => void;
        disableVerticalSwipes: () => void;
        enableVerticalSwipes: () => void;
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
    
    // Request fullscreen mode (hides Telegram header)
    try {
      if (typeof webApp.requestFullscreen === 'function') {
        webApp.requestFullscreen();
      }
    } catch (e) {
      console.log('Fullscreen not supported:', e);
    }
    
    // Disable vertical swipes to prevent accidental close
    try {
      if (typeof webApp.disableVerticalSwipes === 'function') {
        webApp.disableVerticalSwipes();
      }
    } catch (e) {
      console.log('Disable vertical swipes not supported:', e);
    }
  }
};

export const requestTelegramFullscreen = () => {
  const webApp = getTelegramWebApp();
  if (webApp) {
    try {
      if (typeof webApp.requestFullscreen === 'function') {
        webApp.requestFullscreen();
      }
    } catch (e) {
      console.log('Fullscreen not supported:', e);
    }
  }
};

export const exitTelegramFullscreen = () => {
  const webApp = getTelegramWebApp();
  if (webApp) {
    try {
      if (typeof webApp.exitFullscreen === 'function') {
        webApp.exitFullscreen();
      }
    } catch (e) {
      console.log('Exit fullscreen not supported:', e);
    }
  }
};
