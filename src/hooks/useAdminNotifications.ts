import { useState, useEffect } from "react";
import { collection, query, orderBy, limit, onSnapshot, updateDoc, doc, where, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface AdminNotification {
  id: string;
  type: 'bot_purchase' | 'product_purchase' | 'new_user' | 'redeem_code';
  title: string;
  message: string;
  userId?: string;
  userName?: string;
  amount?: number;
  read: boolean;
  createdAt: Date;
}

export function useAdminNotifications() {
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const q = query(
      collection(db, "admin_notifications"),
      orderBy("createdAt", "desc"),
      limit(50)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const notifs: AdminNotification[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          notifs.push({
            id: doc.id,
            type: data.type || 'bot_purchase',
            title: data.title || data.botName || 'Notification',
            message: data.message || `Purchase by ${data.userName}`,
            userId: data.userId,
            userName: data.userName,
            amount: data.amount,
            read: data.read || false,
            createdAt: data.createdAt?.toDate?.() || new Date(),
          });
        });
        setNotifications(notifs);
        setUnreadCount(notifs.filter(n => !n.read).length);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching admin notifications:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const markAsRead = async (notificationId: string) => {
    try {
      await updateDoc(doc(db, "admin_notifications", notificationId), {
        read: true
      });
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadNotifs = notifications.filter(n => !n.read);
      await Promise.all(
        unreadNotifs.map(n => 
          updateDoc(doc(db, "admin_notifications", n.id), { read: true })
        )
      );
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  return {
    notifications,
    loading,
    unreadCount,
    markAsRead,
    markAllAsRead,
  };
}
