import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, MessageCircle, Smartphone } from 'lucide-react';

export default function Auth() {
  const navigate = useNavigate();
  const { user, isTelegram } = useAuth();

  // Redirect if already logged in via Telegram
  React.useEffect(() => {
    if (user && isTelegram) {
      navigate('/', { replace: true });
    }
  }, [user, isTelegram, navigate]);

  const handleOpenTelegram = () => {
    // Replace with your actual Telegram bot username
    window.open('https://t.me/your_bot_username', '_blank');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Button
          variant="ghost"
          className="mb-6"
          onClick={() => navigate('/')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Explore
        </Button>

        <Card className="border-border/50 bg-card/50 backdrop-blur">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <MessageCircle className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold">Open in Telegram</CardTitle>
            <CardDescription className="text-base">
              To buy, download, or add money, please open this app in Telegram.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted/30 rounded-lg p-4 space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-primary">1</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Open Telegram on your phone
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-primary">2</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Search for our bot and open the mini app
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-primary">3</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  You'll be automatically logged in!
                </p>
              </div>
            </div>

            <Button 
              onClick={handleOpenTelegram} 
              className="w-full gap-2"
              size="lg"
            >
              <Smartphone className="w-5 h-5" />
              Open in Telegram
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              You can still browse and explore products here in your browser.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
