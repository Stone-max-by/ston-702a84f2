import { useState, useEffect } from "react";
import { collection, query, where, orderBy, onSnapshot, updateDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";

export interface UserNotification {
  id: string;
  type: 'promotion' | 'purchase' | 'system' | 'admin_credit';
  title: string;
  message: string;
  imageUrl?: string;
  linkUrl?: string;
  linkText?: string;
  read: boolean;
  createdAt: Date;
}

export function useUserNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [promotions, setPromotions] = useState<UserNotification[]>([]);
  const [userNotifs, setUserNotifs] = useState<UserNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch active promotions
  useEffect(() => {
    const q = query(
      collection(db, "promotions"),
      where("isActive", "==", true),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items: UserNotification[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          if (data.expiresAt && data.expiresAt.toDate() < new Date()) return;
          items.push({
            id: doc.id,
            type: 'promotion',
            title: data.title || '',
            message: data.message || '',
            imageUrl: data.imageUrl,
            linkUrl: data.linkUrl,
            linkText: data.linkText,
            read: false,
            createdAt: data.createdAt?.toDate?.() || new Date(),
          });
        });
        setPromotions(items);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching promotions:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Fetch user-specific notifications (admin credits, etc.)
  useEffect(() => {
    if (!user?.id) {
      setUserNotifs([]);
      return;
    }

    const q = query(
      collection(db, "user_notifications"),
      where("userId", "==", user.id),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items: UserNotification[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          items.push({
            id: docSnap.id,
            type: data.type || 'system',
            title: data.title || '',
            message: data.message || '',
            read: data.read || false,
            createdAt: data.createdAt?.toDate?.() || new Date(),
          });
        });
        setUserNotifs(items);
      },
      (error) => {
        console.error("Error fetching user notifications:", error);
      }
    );

    return () => unsubscribe();
  }, [user?.id]);

  // Combine all notifications sorted by date
  useEffect(() => {
    const allNotifications = [...promotions, ...userNotifs].sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );
    setNotifications(allNotifications);
    setUnreadCount(allNotifications.filter(n => !n.read).length);
  }, [promotions, userNotifs]);

  const markAsRead = async (notificationId: string) => {
    try {
      const notifRef = doc(db, "user_notifications", notificationId);
      await updateDoc(notifRef, { read: true });
    } catch (e) {
      // Promotions don't have read state persisted
    }
  };

  return {
    notifications,
    loading,
    unreadCount,
    markAsRead,
    hasNotifications: notifications.length > 0,
  };
}
