import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN');

// Firebase configuration - same as frontend
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyAPuV5P65P76t1XdFqyjbTgdxEUqG5aviY",
  projectId: "gtwy-bf375",
};

interface TelegramFile {
  file_id: string;
  file_unique_id: string;
  file_size?: number;
  file_path?: string;
}

interface TelegramMessage {
  message_id: number;
  from: {
    id: number;
    username?: string;
    first_name?: string;
  };
  chat: {
    id: number;
  };
  document?: {
    file_id: string;
    file_unique_id: string;
    file_name?: string;
    mime_type?: string;
    file_size?: number;
    thumbnail?: TelegramFile;
  };
  photo?: TelegramFile[];
  caption?: string;
  text?: string;
  reply_to_message?: TelegramMessage;
}

// User session states
const userSessions: Map<number, { 
  sessionId: string; 
  step: 'awaiting_file' | 'awaiting_thumbnail' | 'complete';
  fileData?: any;
}> = new Map();

async function sendMessage(chatId: number, text: string, replyMarkup?: any) {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
  const body: any = {
    chat_id: chatId,
    text: text,
    parse_mode: 'HTML',
  };
  if (replyMarkup) {
    body.reply_markup = replyMarkup;
  }
  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
}

function generateSessionId(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Save to Firestore via REST API
async function saveToFirestore(collection: string, data: any, docId?: string): Promise<string> {
  const projectId = FIREBASE_CONFIG.projectId;
  const baseUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`;
  
  // Convert data to Firestore format
  const firestoreData = convertToFirestoreFormat(data);
  
  if (docId) {
    // Update existing document
    const url = `${baseUrl}/${collection}/${docId}?updateMask.fieldPaths=${Object.keys(data).join('&updateMask.fieldPaths=')}`;
    const response = await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: firestoreData }),
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.error('Firestore update error:', error);
      throw new Error(`Firestore error: ${error}`);
    }
    return docId;
  } else {
    // Create new document
    const url = `${baseUrl}/${collection}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: firestoreData }),
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.error('Firestore create error:', error);
      throw new Error(`Firestore error: ${error}`);
    }
    
    const result = await response.json();
    // Extract document ID from name: "projects/.../documents/collection/docId"
    const docPath = result.name.split('/');
    return docPath[docPath.length - 1];
  }
}

// Find document by field value
async function findInFirestore(collection: string, field: string, value: string): Promise<{ id: string; data: any } | null> {
  const projectId = FIREBASE_CONFIG.projectId;
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:runQuery`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      structuredQuery: {
        from: [{ collectionId: collection }],
        where: {
          fieldFilter: {
            field: { fieldPath: field },
            op: 'EQUAL',
            value: { stringValue: value }
          }
        },
        limit: 1
      }
    }),
  });
  
  if (!response.ok) {
    const error = await response.text();
    console.error('Firestore query error:', error);
    return null;
  }
  
  const results = await response.json();
  if (results && results.length > 0 && results[0].document) {
    const doc = results[0].document;
    const docPath = doc.name.split('/');
    const docId = docPath[docPath.length - 1];
    return { id: docId, data: convertFromFirestoreFormat(doc.fields) };
  }
  
  return null;
}

function convertToFirestoreFormat(data: any): any {
  const result: any = {};
  for (const [key, value] of Object.entries(data)) {
    if (value === null || value === undefined) {
      result[key] = { nullValue: null };
    } else if (typeof value === 'string') {
      result[key] = { stringValue: value };
    } else if (typeof value === 'number') {
      if (Number.isInteger(value)) {
        result[key] = { integerValue: value.toString() };
      } else {
        result[key] = { doubleValue: value };
      }
    } else if (typeof value === 'boolean') {
      result[key] = { booleanValue: value };
    } else if (value instanceof Date) {
      result[key] = { timestampValue: value.toISOString() };
    } else if (Array.isArray(value)) {
      result[key] = { arrayValue: { values: value.map(v => ({ stringValue: v.toString() })) } };
    } else if (typeof value === 'object') {
      result[key] = { mapValue: { fields: convertToFirestoreFormat(value) } };
    }
  }
  return result;
}

function convertFromFirestoreFormat(fields: any): any {
  const result: any = {};
  for (const [key, value] of Object.entries(fields as Record<string, any>)) {
    if ('stringValue' in value) {
      result[key] = value.stringValue;
    } else if ('integerValue' in value) {
      result[key] = parseInt(value.integerValue);
    } else if ('doubleValue' in value) {
      result[key] = value.doubleValue;
    } else if ('booleanValue' in value) {
      result[key] = value.booleanValue;
    } else if ('timestampValue' in value) {
      result[key] = value.timestampValue;
    } else if ('arrayValue' in value) {
      result[key] = value.arrayValue.values?.map((v: any) => v.stringValue || v.integerValue) || [];
    } else if ('mapValue' in value) {
      result[key] = convertFromFirestoreFormat(value.mapValue.fields);
    } else if ('nullValue' in value) {
      result[key] = null;
    }
  }
  return result;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const update = await req.json();
    console.log('Received Telegram update:', JSON.stringify(update));

    const message: TelegramMessage = update.message;
    if (!message) {
      return new Response('OK', { status: 200 });
    }

    const chatId = message.chat.id;
    const userId = message.from.id;
    const username = message.from.username;

    // Handle /start command
    if (message.text === '/start') {
      userSessions.delete(userId);
      await sendMessage(chatId, 
        `🤖 <b>Product Upload Bot!</b>\n\n` +
        `<b>Commands:</b>\n` +
        `📤 /upload - Start product upload session\n` +
        `❓ /help - Show this help\n\n` +
        `<i>Use /upload to add products to your store!</i>`
      );
      return new Response('OK', { status: 200 });
    }

    // Handle /help command
    if (message.text === '/help') {
      await sendMessage(chatId,
        `📖 <b>How to Upload Products</b>\n\n` +
        `1️⃣ Type /upload to start\n` +
        `2️⃣ Send your product file (with optional title in caption)\n` +
        `3️⃣ Send a thumbnail image OR type /skip\n` +
        `4️⃣ Copy the Session ID and paste it in the webapp\n\n` +
        `<i>Session IDs expire after 24 hours</i>`
      );
      return new Response('OK', { status: 200 });
    }

    // Handle /upload command - Start new session
    if (message.text === '/upload') {
      const sessionId = generateSessionId();
      
      // Save initial session to Firestore
      await saveToFirestore('temp_uploads', {
        sessionId: sessionId,
        telegramUserId: userId,
        telegramUsername: username || '',
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      });
      
      // Store in memory for quick access
      userSessions.set(userId, { 
        sessionId, 
        step: 'awaiting_file' 
      });
      
      await sendMessage(chatId,
        `📤 <b>Upload Session Started!</b>\n\n` +
        `🔑 <b>Session ID:</b> <code>${sessionId}</code>\n\n` +
        `Now send me your <b>product file</b>.\n` +
        `<i>You can add a title in the caption!</i>`
      );
      return new Response('OK', { status: 200 });
    }

    // Handle /skip command - Skip thumbnail
    if (message.text === '/skip') {
      const session = userSessions.get(userId);
      if (!session || session.step !== 'awaiting_thumbnail') {
        await sendMessage(chatId, `❌ No active upload session. Use /upload to start.`);
        return new Response('OK', { status: 200 });
      }
      
      // Find and update Firestore document
      const doc = await findInFirestore('temp_uploads', 'sessionId', session.sessionId);
      if (doc) {
        await saveToFirestore('temp_uploads', {
          status: 'complete',
          updatedAt: new Date().toISOString(),
        }, doc.id);
      }
      
      userSessions.delete(userId);
      
      await sendMessage(chatId,
        `✅ <b>Upload Complete!</b>\n\n` +
        `🔑 <b>Session ID:</b> <code>${session.sessionId}</code>\n\n` +
        `📋 Go to the webapp and paste this Session ID to fetch your product data!`
      );
      return new Response('OK', { status: 200 });
    }

    // Handle document upload
    if (message.document) {
      const session = userSessions.get(userId);
      
      if (!session || session.step !== 'awaiting_file') {
        // No active session, create one on the fly
        const sessionId = generateSessionId();
        const doc = message.document;
        
        await saveToFirestore('temp_uploads', {
          sessionId: sessionId,
          telegramUserId: userId,
          telegramUsername: username || '',
          fileId: doc.file_id,
          fileName: doc.file_name || 'unknown',
          fileSize: doc.file_size || 0,
          fileSizeFormatted: formatFileSize(doc.file_size || 0),
          mimeType: doc.mime_type || 'application/octet-stream',
          title: doc.file_name || 'Untitled',
          status: 'file_uploaded',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        });
        
        userSessions.set(userId, { 
          sessionId, 
          step: 'awaiting_thumbnail',
          fileData: { fileName: doc.file_name, fileSize: doc.file_size }
        });
        
        await sendMessage(chatId,
          `📁 <b>File Received!</b>\n\n` +
          `📄 <b>Name:</b> ${doc.file_name || 'unknown'}\n` +
          `📊 <b>Size:</b> ${formatFileSize(doc.file_size || 0)}\n` +
          `🔑 <b>Session ID:</b> <code>${sessionId}</code>\n\n` +
          `Now send me a <b>thumbnail image</b> or type /skip`
        );
        return new Response('OK', { status: 200 });
      }
      
      // Active session exists
      const doc = message.document;
      
      // Find and update Firestore
      const firestoreDoc = await findInFirestore('temp_uploads', 'sessionId', session.sessionId);
      if (firestoreDoc) {
        await saveToFirestore('temp_uploads', {
          fileId: doc.file_id,
          fileName: doc.file_name || 'unknown',
          fileSize: doc.file_size || 0,
          fileSizeFormatted: formatFileSize(doc.file_size || 0),
          mimeType: doc.mime_type || 'application/octet-stream',
          title: doc.file_name || 'Untitled',
          status: 'file_uploaded',
          updatedAt: new Date().toISOString(),
        }, firestoreDoc.id);
      }
      
      session.step = 'awaiting_thumbnail';
      session.fileData = { fileName: doc.file_name, fileSize: doc.file_size };
      userSessions.set(userId, session);
      
      await sendMessage(chatId,
        `📁 <b>File Received!</b>\n\n` +
        `📄 <b>Name:</b> ${doc.file_name || 'unknown'}\n` +
        `📊 <b>Size:</b> ${formatFileSize(doc.file_size || 0)}\n\n` +
        `Now send me a <b>thumbnail image</b> or type /skip`
      );
      return new Response('OK', { status: 200 });
    }

    // Handle photo upload (thumbnail)
    if (message.photo && message.photo.length > 0) {
      const session = userSessions.get(userId);
      
      if (!session) {
        await sendMessage(chatId, 
          `ℹ️ <b>Photo Received!</b>\n\n` +
          `🔑 <b>File ID:</b>\n<code>${message.photo[message.photo.length - 1].file_id}</code>\n\n` +
          `<i>Use /upload to start a product upload session.</i>`
        );
        return new Response('OK', { status: 200 });
      }
      
      // Get highest resolution photo
      const photo = message.photo[message.photo.length - 1];
      
      // Find and update Firestore
      const firestoreDoc = await findInFirestore('temp_uploads', 'sessionId', session.sessionId);
      if (firestoreDoc) {
        await saveToFirestore('temp_uploads', {
          thumbnailFileId: photo.file_id,
          status: 'complete',
          updatedAt: new Date().toISOString(),
        }, firestoreDoc.id);
      }
      
      userSessions.delete(userId);
      
      await sendMessage(chatId,
        `✅ <b>Upload Complete!</b>\n\n` +
        `🔑 <b>Session ID:</b> <code>${session.sessionId}</code>\n\n` +
        `📋 Go to the webapp and paste this Session ID to fetch your product data!\n\n` +
        `<i>Data saved:</i>\n` +
        `• File: ${session.fileData?.fileName || 'Yes'}\n` +
        `• Thumbnail: Yes`
      );
      return new Response('OK', { status: 200 });
    }

    // Default response for unknown input
    if (!userSessions.has(userId)) {
      await sendMessage(chatId,
        `❓ Send /upload to start uploading a product.\n\n` +
        `Type /help for instructions.`
      );
    } else {
      const session = userSessions.get(userId);
      if (session?.step === 'awaiting_file') {
        await sendMessage(chatId, `📤 Please send your <b>product file</b>.`);
      } else if (session?.step === 'awaiting_thumbnail') {
        await sendMessage(chatId, `🖼️ Please send a <b>thumbnail image</b> or type /skip`);
      }
    }

    return new Response('OK', { status: 200 });

  } catch (error) {
    console.error('Error processing webhook:', error);
    return new Response('Error', { status: 500 });
  }
});
