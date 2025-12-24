import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { TelegramBot } from '@/types/bot';
import { dummyBots } from '@/data/dummyBots';

export function useBots() {
  const [bots, setBots] = useState<TelegramBot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBots = async () => {
      try {
        const botsRef = collection(db, 'telegram_bots');
        const q = query(botsRef, orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        
        if (snapshot.empty) {
          // Use dummy bots if no bots in Firebase
          setBots(dummyBots);
        } else {
          const botsData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate() || new Date()
          })) as TelegramBot[];
          
          setBots(botsData.filter(bot => bot.isActive));
        }
      } catch (err) {
        console.error('Error fetching bots:', err);
        // Fallback to dummy bots on error
        setBots(dummyBots);
      } finally {
        setLoading(false);
      }
    };

    fetchBots();
  }, []);

  return { bots, loading, error };
}

export function useBot(botId: string | undefined) {
  const [bot, setBot] = useState<TelegramBot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!botId) {
      setLoading(false);
      return;
    }

    const fetchBot = async () => {
      try {
        const botRef = doc(db, 'telegram_bots', botId);
        const snapshot = await getDoc(botRef);
        
        if (snapshot.exists()) {
          setBot({
            id: snapshot.id,
            ...snapshot.data(),
            createdAt: snapshot.data().createdAt?.toDate() || new Date()
          } as TelegramBot);
        } else {
          setError('Bot not found');
        }
      } catch (err) {
        console.error('Error fetching bot:', err);
        setError('Failed to load bot');
      } finally {
        setLoading(false);
      }
    };

    fetchBot();
  }, [botId]);

  return { bot, loading, error };
}
