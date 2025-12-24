import { useState } from 'react';
import { doc, updateDoc, getDoc, increment } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from 'sonner';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

interface UseReferralChannelReturn {
  verifying: boolean;
  verifyAndClaimReward: (
    telegramId: number,
    userId: string,
    channelId: string,
    referredBy: string | undefined,
    referralBonus: number
  ) => Promise<boolean>;
}

export function useReferralChannel(): UseReferralChannelReturn {
  const [verifying, setVerifying] = useState(false);

  const verifyAndClaimReward = async (
    telegramId: number,
    userId: string,
    channelId: string,
    referredBy: string | undefined,
    referralBonus: number
  ): Promise<boolean> => {
    if (!channelId) {
      toast.error('Channel not configured');
      return false;
    }

    setVerifying(true);
    try {
      // Call edge function to verify channel membership
      const response = await fetch(`${SUPABASE_URL}/functions/v1/verify-channel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          telegramId,
          channelId,
        }),
      });

      const data = await response.json();
      console.log('Channel verification result:', data);

      if (data.error) {
        toast.error(data.error);
        setVerifying(false);
        return false;
      }

      if (!data.isMember) {
        toast.error('Please join the channel first');
        setVerifying(false);
        return false;
      }

      // User is a member, update their status
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        'referral.channelJoined': true,
        updatedAt: new Date().toISOString(),
      });

      // If user was referred, give reward to referrer
      if (referredBy) {
        const referrerRef = doc(db, 'users', referredBy);
        const referrerSnap = await getDoc(referrerRef);
        
        if (referrerSnap.exists()) {
          // Add balance to referrer
          await updateDoc(referrerRef, {
            balance: increment(referralBonus),
            'referral.referralEarnings': increment(referralBonus),
            updatedAt: new Date().toISOString(),
          });

          // Mark as reward claimed for this user
          await updateDoc(userRef, {
            'referral.rewardClaimed': true,
            updatedAt: new Date().toISOString(),
          });

          toast.success('Channel joined! Your referrer received the reward.');
        }
      } else {
        toast.success('Channel joined successfully!');
      }

      setVerifying(false);
      return true;
    } catch (error) {
      console.error('Error verifying channel:', error);
      toast.error('Failed to verify channel membership');
      setVerifying(false);
      return false;
    }
  };

  return {
    verifying,
    verifyAndClaimReward,
  };
}
