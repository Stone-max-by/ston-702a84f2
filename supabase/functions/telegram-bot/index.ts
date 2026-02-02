import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');

// Firebase configuration
const FIREBASE_CONFIG = {
  projectId: "gtwy-bf375",
};
const FIREBASE_API_KEY = "AIzaSyAPuV5P65P76t1XdFqyjbTgdxEUqG5aviY";

interface TelegramFile {
  file_id: string;
  file_unique_id: string;
  file_size?: number;
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
  };
  photo?: TelegramFile[];
  text?: string;
}

async function sendMessage(chatId: number, text: string) {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: text,
      parse_mode: 'HTML',
    }),
  });
  console.log('sendMessage response:', await res.text());
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

// Firestore helpers
function convertToFirestoreFormat(data: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};
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
    }
  }
  return result;
}

function convertFromFirestoreFormat(fields: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(fields)) {
    if ('stringValue' in value) {
      result[key] = value.stringValue;
    } else if ('integerValue' in value) {
      result[key] = parseInt(value.integerValue);
    } else if ('doubleValue' in value) {
      result[key] = value.doubleValue;
    } else if ('booleanValue' in value) {
      result[key] = value.booleanValue;
    } else if ('nullValue' in value) {
      result[key] = null;
    }
  }
  return result;
}

async function createDocument(collection: string, data: Record<string, any>): Promise<string> {
  const url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_CONFIG.projectId}/databases/(default)/documents/${collection}?key=${FIREBASE_API_KEY}`;
  console.log('Creating document in:', collection);
  
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields: convertToFirestoreFormat(data) }),
  });
  
  const responseText = await response.text();
  console.log('Firestore create response:', responseText);
  
  if (!response.ok) {
    throw new Error(`Firestore create error: ${responseText}`);
  }
  
  const result = JSON.parse(responseText);
  const docPath = result.name.split('/');
  return docPath[docPath.length - 1];
}

async function updateDocument(collection: string, docId: string, data: Record<string, any>): Promise<void> {
  const fieldPaths = Object.keys(data).map(k => `updateMask.fieldPaths=${k}`).join('&');
  const url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_CONFIG.projectId}/databases/(default)/documents/${collection}/${docId}?${fieldPaths}&key=${FIREBASE_API_KEY}`;
  console.log('Updating document:', docId);
  
  const response = await fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields: convertToFirestoreFormat(data) }),
  });
  
  const responseText = await response.text();
  console.log('Firestore update response:', responseText);
  
  if (!response.ok) {
    throw new Error(`Firestore update error: ${responseText}`);
  }
}

async function findActiveSession(telegramUserId: number): Promise<{ id: string; data: Record<string, any> } | null> {
  const url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_CONFIG.projectId}/databases/(default)/documents:runQuery?key=${FIREBASE_API_KEY}`;
  console.log('Finding session for user:', telegramUserId);
  
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      structuredQuery: {
        from: [{ collectionId: 'temp_uploads' }],
        where: {
          compositeFilter: {
            op: 'AND',
            filters: [
              {
                fieldFilter: {
                  field: { fieldPath: 'telegramUserId' },
                  op: 'EQUAL',
                  value: { integerValue: telegramUserId.toString() }
                }
              },
              {
                fieldFilter: {
                  field: { fieldPath: 'status' },
                  op: 'IN',
                  value: { 
                    arrayValue: { 
                      values: [
                        { stringValue: 'pending' },
                        { stringValue: 'file_uploaded' }
                      ]
                    }
                  }
                }
              }
            ]
          }
        },
        limit: 1
      }
    }),
  });
  
  const responseText = await response.text();
  console.log('Firestore query response:', responseText);
  
  if (!response.ok) {
    return null;
  }
  
  const results = JSON.parse(responseText);
  if (results && results.length > 0 && results[0].document) {
    const doc = results[0].document;
    const docPath = doc.name.split('/');
    return { id: docPath[docPath.length - 1], data: convertFromFirestoreFormat(doc.fields) };
  }
  
  return null;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  
  // === SET WEBHOOK ENDPOINT ===
  // Call this once to set up the webhook: GET /telegram-bot?action=setwebhook
  if (url.searchParams.get('action') === 'setwebhook') {
    const webhookUrl = `${SUPABASE_URL}/functions/v1/telegram-bot`;
    const setWebhookUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook?url=${encodeURIComponent(webhookUrl)}`;
    
    const response = await fetch(setWebhookUrl);
    const result = await response.text();
    
    console.log('Set webhook result:', result);
    
    return new Response(JSON.stringify({ 
      success: true, 
      webhookUrl,
      telegramResponse: JSON.parse(result)
    }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
  
  // === GET WEBHOOK INFO ===
  if (url.searchParams.get('action') === 'webhookinfo') {
    const infoUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getWebhookInfo`;
    const response = await fetch(infoUrl);
    const result = await response.text();
    
    return new Response(result, { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }

  try {
    const body = await req.text();
    console.log('Received request body:', body);
    
    if (!body) {
      return new Response('No body', { status: 200, headers: corsHeaders });
    }
    
    const update = JSON.parse(body);
    console.log('Telegram update:', JSON.stringify(update));

    const message: TelegramMessage = update.message;
    if (!message) {
      console.log('No message in update');
      return new Response('OK', { status: 200, headers: corsHeaders });
    }

    const chatId = message.chat.id;
    const userId = message.from.id;
    const username = message.from.username || '';

    console.log(`Processing message from user ${userId} (${username}): ${message.text || 'file/photo'}`);

    // === /start command ===
    if (message.text === '/start') {
      await sendMessage(chatId, 
        `🤖 <b>Product Upload Bot</b>\n\n` +
        `Commands:\n` +
        `📤 /upload - Start upload session\n` +
        `❓ /help - Help\n\n` +
        `<i>Use /upload to add products!</i>`
      );
      return new Response('OK', { status: 200, headers: corsHeaders });
    }

    // === /help command ===
    if (message.text === '/help') {
      await sendMessage(chatId,
        `📖 <b>How to Upload</b>\n\n` +
        `1️⃣ /upload - Start session\n` +
        `2️⃣ Send your file\n` +
        `3️⃣ Send thumbnail OR /skip\n` +
        `4️⃣ Copy Session ID to webapp`
      );
      return new Response('OK', { status: 200, headers: corsHeaders });
    }

    // === /upload command ===
    if (message.text === '/upload') {
      const sessionId = generateSessionId();
      console.log('Creating new session:', sessionId);
      
      try {
        await createDocument('temp_uploads', {
          sessionId: sessionId,
          telegramUserId: userId,
          telegramUsername: username,
          status: 'pending',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        
        await sendMessage(chatId,
          `📤 <b>Session Started!</b>\n\n` +
          `🔑 Session ID: <code>${sessionId}</code>\n\n` +
          `Now send your <b>product file</b>.`
        );
      } catch (error) {
        console.error('Error creating session:', error);
        await sendMessage(chatId, `❌ Error creating session. Please try again.`);
      }
      return new Response('OK', { status: 200, headers: corsHeaders });
    }

    // === /skip command ===
    if (message.text === '/skip') {
      const session = await findActiveSession(userId);
      
      if (!session || session.data.status !== 'file_uploaded') {
        await sendMessage(chatId, `❌ No file uploaded yet. Use /upload first, then send a file.`);
        return new Response('OK', { status: 200, headers: corsHeaders });
      }
      
      await updateDocument('temp_uploads', session.id, {
        status: 'complete',
        updatedAt: new Date().toISOString(),
      });
      
      await sendMessage(chatId,
        `✅ <b>Upload Complete!</b>\n\n` +
        `🔑 Session ID: <code>${session.data.sessionId}</code>\n\n` +
        `Paste this in webapp to fetch data!`
      );
      return new Response('OK', { status: 200, headers: corsHeaders });
    }

    // === File upload ===
    if (message.document) {
      const doc = message.document;
      console.log('Received document:', doc.file_name);
      
      let session = await findActiveSession(userId);
      
      if (!session || session.data.status !== 'pending') {
        // Create new session on the fly
        const sessionId = generateSessionId();
        console.log('Creating new session with file:', sessionId);
        
        try {
          await createDocument('temp_uploads', {
            sessionId: sessionId,
            telegramUserId: userId,
            telegramUsername: username,
            fileId: doc.file_id,
            fileName: doc.file_name || 'unknown',
            fileSize: doc.file_size || 0,
            fileSizeFormatted: formatFileSize(doc.file_size || 0),
            mimeType: doc.mime_type || 'application/octet-stream',
            title: doc.file_name || 'Untitled',
            status: 'file_uploaded',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
          
          await sendMessage(chatId,
            `📁 <b>File Received!</b>\n\n` +
            `📄 ${doc.file_name || 'unknown'}\n` +
            `📊 ${formatFileSize(doc.file_size || 0)}\n` +
            `🔑 <code>${sessionId}</code>\n\n` +
            `Now send <b>thumbnail</b> or /skip`
          );
        } catch (error) {
          console.error('Error saving file:', error);
          await sendMessage(chatId, `❌ Error saving file. Please try again.`);
        }
        return new Response('OK', { status: 200, headers: corsHeaders });
      }
      
      // Update existing pending session
      console.log('Updating existing session with file:', session.id);
      try {
        await updateDocument('temp_uploads', session.id, {
          fileId: doc.file_id,
          fileName: doc.file_name || 'unknown',
          fileSize: doc.file_size || 0,
          fileSizeFormatted: formatFileSize(doc.file_size || 0),
          mimeType: doc.mime_type || 'application/octet-stream',
          title: doc.file_name || 'Untitled',
          status: 'file_uploaded',
          updatedAt: new Date().toISOString(),
        });
        
        await sendMessage(chatId,
          `📁 <b>File Received!</b>\n\n` +
          `📄 ${doc.file_name || 'unknown'}\n` +
          `📊 ${formatFileSize(doc.file_size || 0)}\n` +
          `🔑 <code>${session.data.sessionId}</code>\n\n` +
          `Now send <b>thumbnail</b> or /skip`
        );
      } catch (error) {
        console.error('Error updating session:', error);
        await sendMessage(chatId, `❌ Error saving file. Please try again.`);
      }
      return new Response('OK', { status: 200, headers: corsHeaders });
    }

    // === Photo upload (thumbnail) ===
    if (message.photo && message.photo.length > 0) {
      console.log('Received photo for thumbnail');
      const session = await findActiveSession(userId);
      
      if (!session || session.data.status !== 'file_uploaded') {
        await sendMessage(chatId, `❌ Send a file first!\n\nUse /upload to start.`);
        return new Response('OK', { status: 200, headers: corsHeaders });
      }
      
      const photo = message.photo[message.photo.length - 1];
      
      try {
        await updateDocument('temp_uploads', session.id, {
          thumbnailFileId: photo.file_id,
          status: 'complete',
          updatedAt: new Date().toISOString(),
        });
        
        await sendMessage(chatId,
          `✅ <b>Upload Complete!</b>\n\n` +
          `📄 File: ${session.data.fileName}\n` +
          `🖼️ Thumbnail: Added\n` +
          `🔑 Session: <code>${session.data.sessionId}</code>\n\n` +
          `Paste Session ID in webapp!`
        );
      } catch (error) {
        console.error('Error saving thumbnail:', error);
        await sendMessage(chatId, `❌ Error saving thumbnail. Please try again.`);
      }
      return new Response('OK', { status: 200, headers: corsHeaders });
    }

    // === Default response ===
    const session = await findActiveSession(userId);
    if (session) {
      if (session.data.status === 'pending') {
        await sendMessage(chatId, `📤 Send your <b>product file</b>.`);
      } else if (session.data.status === 'file_uploaded') {
        await sendMessage(chatId, `🖼️ Send <b>thumbnail</b> or /skip`);
      }
    } else {
      await sendMessage(chatId, `Use /upload to start.`);
    }

    return new Response('OK', { status: 200, headers: corsHeaders });

  } catch (error) {
    console.error('Error processing request:', error);
    return new Response(JSON.stringify({ error: String(error) }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});
