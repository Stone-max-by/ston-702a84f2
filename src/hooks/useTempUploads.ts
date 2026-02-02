import { useState, useEffect } from "react";
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  serverTimestamp,
  getDocs,
  getDoc,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface TempUpload {
  id: string;
  fileUniqueId: string; // Telegram's file_unique_id - consistent identifier
  telegramUserId: number;
  telegramUsername?: string;
  
  // File data
  fileId?: string;
  fileName?: string;
  fileSize?: number;
  fileSizeFormatted?: string;
  mimeType?: string;
  
  // Thumbnail data
  thumbnailFileId?: string;
  thumbnailUniqueId?: string;
  thumbnailUrl?: string; // ImageKit URL after upload
  
  // Extracted title from filename
  title?: string;
  
  // Status: pending -> file_uploaded -> complete
  status: 'pending' | 'file_uploaded' | 'complete';
  
  // Usage count - how many times this file was used
  usageCount: number;
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
}

export function useTempUploads() {
  const [uploads, setUploads] = useState<TempUpload[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen to all temp uploads ordered by creation date
    const q = query(
      collection(db, "temp_uploads"),
      orderBy("createdAt", "desc")
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const uploadList: TempUpload[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        uploadList.push({
          id: doc.id,
          ...data,
          usageCount: data.usageCount || 0,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt || new Date().toISOString(),
          updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt || new Date().toISOString(),
        } as TempUpload);
      });
      setUploads(uploadList);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching temp uploads:", error);
      setUploads([]);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Fetch a single upload by file unique ID
  const fetchByFileUniqueId = async (fileUniqueId: string): Promise<TempUpload | null> => {
    try {
      const q = query(
        collection(db, "temp_uploads"),
        where("fileUniqueId", "==", fileUniqueId.trim())
      );
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        return null;
      }
      
      const docSnap = snapshot.docs[0];
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        usageCount: data.usageCount || 0,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt || new Date().toISOString(),
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt || new Date().toISOString(),
      } as TempUpload;
    } catch (error) {
      console.error("Error fetching temp upload:", error);
      return null;
    }
  };

  // Increment usage count when file is used in a product
  const incrementUsageCount = async (id: string) => {
    try {
      const docRef = doc(db, "temp_uploads", id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const currentCount = docSnap.data().usageCount || 0;
        await updateDoc(docRef, {
          usageCount: currentCount + 1,
          updatedAt: serverTimestamp(),
        });
      }
    } catch (error) {
      console.error("Error incrementing usage count:", error);
      throw error;
    }
  };

  // Update thumbnail URL after ImageKit upload
  const updateThumbnailUrl = async (id: string, thumbnailUrl: string) => {
    try {
      const docRef = doc(db, "temp_uploads", id);
      await updateDoc(docRef, {
        thumbnailUrl,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error updating thumbnail URL:", error);
      throw error;
    }
  };

  // Delete a temp upload
  const deleteUpload = async (id: string) => {
    try {
      await deleteDoc(doc(db, "temp_uploads", id));
    } catch (error) {
      console.error("Error deleting temp upload:", error);
      throw error;
    }
  };

  return {
    uploads,
    loading,
    fetchByFileUniqueId,
    incrementUsageCount,
    updateThumbnailUrl,
    deleteUpload,
    formatFileSize,
  };
}
