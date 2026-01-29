import { useState, useEffect } from "react";
import { collection, query, where, orderBy, onSnapshot, updateDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";

export interface UserNotification {
  id: string;
  type: 'promotion' | 'purchase' | 'system';
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
          // Check if expired
          if (data.expiresAt && data.expiresAt.toDate() < new Date()) {
            return;
          }
          items.push({
            id: doc.id,
            type: 'promotion',
            title: data.title || '',
            message: data.message || '',
            imageUrl: data.imageUrl,
            linkUrl: data.linkUrl,
            linkText: data.linkText,
            read: false, // Promotions are always shown
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

  // Combine all notifications
  useEffect(() => {
    const allNotifications = [...promotions];
    setNotifications(allNotifications);
    setUnreadCount(allNotifications.filter(n => !n.read).length);
  }, [promotions]);

  const markAsRead = async (notificationId: string) => {
    // For promotions, we don't persist read state
    // For user-specific notifications, we would update Firestore
  };

  return {
    notifications,
    loading,
    unreadCount,
    markAsRead,
    hasNotifications: notifications.length > 0,
  };
}
