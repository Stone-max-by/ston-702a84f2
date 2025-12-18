import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN');

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
}

async function sendMessage(chatId: number, text: string) {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: text,
      parse_mode: 'HTML',
    }),
  });
}

async function getFileInfo(fileId: string): Promise<TelegramFile | null> {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getFile`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ file_id: fileId }),
  });
  const data = await response.json();
  return data.ok ? data.result : null;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
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

    // Handle /start command
    if (message.text === '/start') {
      await sendMessage(chatId, 
        `🤖 <b>Welcome to Product Upload Bot!</b>\n\n` +
        `Send me a file and I'll extract:\n` +
        `• File ID (for Telegram delivery)\n` +
        `• File name\n` +
        `• File size\n` +
        `• MIME type\n\n` +
        `You can also send a photo as thumbnail!\n\n` +
        `<i>Use caption to add product title</i>`
      );
      return new Response('OK', { status: 200 });
    }

    // Handle document upload
    if (message.document) {
      const doc = message.document;
      const fileInfo = await getFileInfo(doc.file_id);
      
      const productData = {
        title: message.caption || doc.file_name || 'Untitled Product',
        file_id: doc.file_id,
        file_unique_id: doc.file_unique_id,
        file_name: doc.file_name || 'unknown',
        file_size: doc.file_size || 0,
        file_size_formatted: formatFileSize(doc.file_size || 0),
        mime_type: doc.mime_type || 'application/octet-stream',
        thumbnail_file_id: doc.thumbnail?.file_id || null,
        uploaded_by: message.from.username || message.from.id.toString(),
        uploaded_at: new Date().toISOString(),
      };

      console.log('Product data extracted:', productData);

      // Send response with file details
      await sendMessage(chatId,
        `✅ <b>File Received!</b>\n\n` +
        `📁 <b>File Name:</b> ${productData.file_name}\n` +
        `📊 <b>Size:</b> ${productData.file_size_formatted}\n` +
        `📝 <b>Type:</b> ${productData.mime_type}\n\n` +
        `🔑 <b>File ID:</b>\n<code>${productData.file_id}</code>\n\n` +
        `${productData.thumbnail_file_id ? `🖼️ <b>Thumbnail ID:</b>\n<code>${productData.thumbnail_file_id}</code>\n\n` : ''}` +
        `<i>Copy the File ID to use in your product listing!</i>\n\n` +
        `📋 <b>Full JSON Data:</b>\n<pre>${JSON.stringify(productData, null, 2)}</pre>`
      );

      return new Response('OK', { status: 200 });
    }

    // Handle photo upload (for thumbnails)
    if (message.photo && message.photo.length > 0) {
      // Get the highest resolution photo
      const photo = message.photo[message.photo.length - 1];
      const fileInfo = await getFileInfo(photo.file_id);

      await sendMessage(chatId,
        `🖼️ <b>Photo Received!</b>\n\n` +
        `📊 <b>Size:</b> ${formatFileSize(photo.file_size || 0)}\n\n` +
        `🔑 <b>Thumbnail File ID:</b>\n<code>${photo.file_id}</code>\n\n` +
        `<i>Use this ID as thumbnail for your products!</i>`
      );

      return new Response('OK', { status: 200 });
    }

    // Default response
    await sendMessage(chatId,
      `❓ Send me a file or photo to get started!\n\n` +
      `Type /start for help.`
    );

    return new Response('OK', { status: 200 });

  } catch (error) {
    console.error('Error processing webhook:', error);
    return new Response('Error', { status: 500 });
  }
});
