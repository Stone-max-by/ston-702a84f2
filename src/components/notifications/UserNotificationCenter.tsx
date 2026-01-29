import { useState } from "react";
import { Bell, Megaphone, ExternalLink, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useUserNotifications } from "@/hooks/useUserNotifications";
import { formatDistanceToNow } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";

export function UserNotificationCenter() {
  const [open, setOpen] = useState(false);
  const { notifications, unreadCount, loading, hasNotifications } = useUserNotifications();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center animate-pulse">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md p-0">
        <SheetHeader className="p-4 border-b border-border/50">
          <SheetTitle className="flex items-center gap-2 text-base">
            <Bell className="w-4 h-4 text-primary" />
            Notifications
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-80px)]">
          {loading ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              Loading...
            </div>
          ) : !hasNotifications ? (
            <div className="p-8 text-center">
              <Bell className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">No notifications yet</p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                Stay tuned for updates and offers!
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className="p-4 hover:bg-muted/30 transition-colors"
                >
                  {/* Promotion Image */}
                  {notification.imageUrl && (
                    <img
                      src={notification.imageUrl}
                      alt=""
                      className="w-full h-40 object-cover rounded-lg mb-3"
                      onError={(e) => e.currentTarget.style.display = 'none'}
                    />
                  )}
                  
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Megaphone className="w-4 h-4 text-primary" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm">{notification.title}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {notification.message}
                      </p>
                      
                      {notification.linkUrl && (
                        <a
                          href={notification.linkUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
                        >
                          {notification.linkText || 'Learn More'}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                      
                      <p className="text-[10px] text-muted-foreground/70 mt-2">
                        {formatDistanceToNow(notification.createdAt, { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
