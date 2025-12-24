import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, addDoc, updateDoc, deleteDoc, doc, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { RedeemCode, RedeemCodeFormData } from '@/types/redeemCode';
import { toast } from 'sonner';

const COLLECTION_NAME = 'redeemCodes';

export function useRedeemCodes() {
  const [codes, setCodes] = useState<RedeemCode[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, COLLECTION_NAME));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const codesData: RedeemCode[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        codesData.push({
          id: doc.id,
          code: data.code,
          rewardType: data.rewardType,
          rewardAmount: data.rewardAmount,
          maxUses: data.maxUses,
          currentUses: data.currentUses || 0,
          usedBy: data.usedBy || [],
          isActive: data.isActive,
          expiresAt: data.expiresAt?.toDate() || null,
          createdAt: data.createdAt?.toDate() || new Date(),
          createdBy: data.createdBy,
        });
      });
      setCodes(codesData.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()));
      setLoading(false);
    }, (error) => {
      console.error('Error fetching redeem codes:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const createCode = async (data: RedeemCodeFormData, createdBy: string) => {
    try {
      await addDoc(collection(db, COLLECTION_NAME), {
        ...data,
        code: data.code.toUpperCase(),
        currentUses: 0,
        usedBy: [],
        isActive: true,
        createdAt: new Date(),
        createdBy,
      });
      toast.success('Redeem code created!');
      return true;
    } catch (error) {
      console.error('Error creating code:', error);
      toast.error('Failed to create code');
      return false;
    }
  };

  const updateCode = async (id: string, data: Partial<RedeemCode>) => {
    try {
      await updateDoc(doc(db, COLLECTION_NAME, id), data);
      toast.success('Code updated!');
      return true;
    } catch (error) {
      console.error('Error updating code:', error);
      toast.error('Failed to update code');
      return false;
    }
  };

  const deleteCode = async (id: string) => {
    try {
      await deleteDoc(doc(db, COLLECTION_NAME, id));
      toast.success('Code deleted!');
      return true;
    } catch (error) {
      console.error('Error deleting code:', error);
      toast.error('Failed to delete code');
      return false;
    }
  };

  const toggleCodeStatus = async (id: string, isActive: boolean) => {
    return updateCode(id, { isActive });
  };

  return {
    codes,
    loading,
    createCode,
    updateCode,
    deleteCode,
    toggleCodeStatus,
  };
}

// Hook for redeeming codes (user side)
export function useRedeemCode() {
  const [redeeming, setRedeeming] = useState(false);

  const redeemCode = async (
    codeString: string, 
    userId: string,
    onSuccess: (rewardType: 'coins' | 'balance', amount: number) => Promise<void>
  ) => {
    if (!codeString.trim()) {
      toast.error('Enter a code');
      return false;
    }

    setRedeeming(true);
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where('code', '==', codeString.toUpperCase()),
        where('isActive', '==', true)
      );
      
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        toast.error('Invalid code');
        setRedeeming(false);
        return false;
      }

      const codeDoc = snapshot.docs[0];
      const codeData = codeDoc.data() as RedeemCode;

      // Check if user already used this code
      if (codeData.usedBy?.includes(userId)) {
        toast.error('Already used this code');
        setRedeeming(false);
        return false;
      }

      // Check max uses
      if (codeData.currentUses >= codeData.maxUses) {
        toast.error('Code limit reached');
        setRedeeming(false);
        return false;
      }

      // Check expiry
      if (codeData.expiresAt && new Date(codeData.expiresAt) < new Date()) {
        toast.error('Code expired');
        setRedeeming(false);
        return false;
      }

      // Apply reward
      await onSuccess(codeData.rewardType, codeData.rewardAmount);

      // Update code usage
      await updateDoc(doc(db, COLLECTION_NAME, codeDoc.id), {
        currentUses: (codeData.currentUses || 0) + 1,
        usedBy: [...(codeData.usedBy || []), userId],
      });

      toast.success(`+${codeData.rewardAmount} ${codeData.rewardType === 'coins' ? 'coins' : '₹'} added!`);
      setRedeeming(false);
      return true;
    } catch (error) {
      console.error('Error redeeming code:', error);
      toast.error('Failed to redeem');
      setRedeeming(false);
      return false;
    }
  };

  return { redeemCode, redeeming };
}
