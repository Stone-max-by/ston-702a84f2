import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export function useRequireAuth() {
  const { user, isTelegram } = useAuth();
  const navigate = useNavigate();

  const requireAuth = (action: string = 'continue'): boolean => {
    // If user is logged in (via Telegram), allow action
    if (user && isTelegram) {
      return true;
    }

    // If not in Telegram, show message and redirect
    if (!isTelegram) {
      toast({
        title: "Telegram Required",
        description: `Please open this app in Telegram to ${action}`,
        variant: "destructive"
      });
      navigate('/auth');
      return false;
    }

    // In Telegram but no user (shouldn't happen normally)
    if (isTelegram && !user) {
      toast({
        title: "Login Error",
        description: "Please restart the app in Telegram",
        variant: "destructive"
      });
      return false;
    }
    
    return false;
  };

  // User is authenticated only if in Telegram AND has user
  const isAuthenticated = isTelegram && !!user;

  return { requireAuth, isAuthenticated, isTelegram };
}
