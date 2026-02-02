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
  sessionId: string;
  telegramUserId: number;
  telegramUsername?: string;
  
  // File data (step 1)
  fileId?: string;
  fileName?: string;
  fileSize?: number;
  fileSizeFormatted?: string;
  mimeType?: string;
  
  // Thumbnail data (step 2)
  thumbnailFileId?: string;
  
  // Extracted title from caption
  title?: string;
  
  // Status: pending -> file_uploaded -> thumbnail_uploaded -> complete -> used
  status: 'pending' | 'file_uploaded' | 'thumbnail_uploaded' | 'complete' | 'used';
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
}

// Generate a short session ID
function generateSessionId(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export function useTempUploads() {
  const [uploads, setUploads] = useState<TempUpload[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen to all non-used temp uploads
    const q = query(
      collection(db, "temp_uploads"),
      where("status", "!=", "used"),
      orderBy("status"),
      orderBy("createdAt", "desc")
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const uploadList: TempUpload[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        uploadList.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
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

  // Fetch a single upload by session ID
  const fetchBySessionId = async (sessionId: string): Promise<TempUpload | null> => {
    try {
      const q = query(
        collection(db, "temp_uploads"),
        where("sessionId", "==", sessionId.toUpperCase())
      );
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        return null;
      }
      
      const doc = snapshot.docs[0];
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      } as TempUpload;
    } catch (error) {
      console.error("Error fetching temp upload:", error);
      return null;
    }
  };

  // Mark an upload as used
  const markAsUsed = async (id: string) => {
    try {
      const docRef = doc(db, "temp_uploads", id);
      await updateDoc(docRef, {
        status: "used",
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error marking upload as used:", error);
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

  // Create a new session (for manual creation if needed)
  const createSession = async (telegramUserId: number, telegramUsername?: string): Promise<string> => {
    const sessionId = generateSessionId();
    try {
      await addDoc(collection(db, "temp_uploads"), {
        sessionId,
        telegramUserId,
        telegramUsername,
        status: "pending",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
      });
      return sessionId;
    } catch (error) {
      console.error("Error creating session:", error);
      throw error;
    }
  };

  return {
    uploads,
    loading,
    fetchBySessionId,
    markAsUsed,
    deleteUpload,
    createSession,
    generateSessionId,
    formatFileSize,
  };
}
