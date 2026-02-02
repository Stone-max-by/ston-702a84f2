import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN');
const IMAGEKIT_PRIVATE_KEY = Deno.env.get('IMAGEKIT_PRIVATE_KEY');

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { telegramFileId, fileName } = await req.json();

    if (!telegramFileId) {
      return new Response(
        JSON.stringify({ error: 'telegramFileId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Processing file:', telegramFileId);

    // Step 1: Get file path from Telegram
    const getFileUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getFile?file_id=${telegramFileId}`;
    const fileInfoRes = await fetch(getFileUrl);
    const fileInfo = await fileInfoRes.json();

    if (!fileInfo.ok || !fileInfo.result?.file_path) {
      console.error('Telegram getFile error:', fileInfo);
      return new Response(
        JSON.stringify({ error: 'Failed to get file from Telegram', details: fileInfo }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const filePath = fileInfo.result.file_path;
    console.log('Telegram file path:', filePath);

    // Step 2: Download file from Telegram
    const downloadUrl = `https://api.telegram.org/file/bot${TELEGRAM_BOT_TOKEN}/${filePath}`;
    const fileRes = await fetch(downloadUrl);
    
    if (!fileRes.ok) {
      return new Response(
        JSON.stringify({ error: 'Failed to download file from Telegram' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const fileBuffer = await fileRes.arrayBuffer();
    // Use Deno's base64 encoder - pass ArrayBuffer directly
    const base64File = base64Encode(fileBuffer);
    
    console.log('File downloaded, size:', fileBuffer.byteLength);

    // Step 3: Upload to ImageKit
    const uploadFileName = fileName || `thumbnail_${Date.now()}.jpg`;
    
    const formData = new FormData();
    formData.append('file', `data:image/jpeg;base64,${base64File}`);
    formData.append('fileName', uploadFileName);
    formData.append('folder', '/thumbnails');

    // ImageKit uses Basic Auth with private key
    const authString = `${IMAGEKIT_PRIVATE_KEY}:`;
    const authHeader = base64Encode(new TextEncoder().encode(authString).buffer);

    const uploadRes = await fetch('https://upload.imagekit.io/api/v1/files/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authHeader}`,
      },
      body: formData,
    });

    const uploadResult = await uploadRes.json();
    console.log('ImageKit upload result:', uploadResult);

    if (!uploadRes.ok) {
      return new Response(
        JSON.stringify({ error: 'Failed to upload to ImageKit', details: uploadResult }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        url: uploadResult.url,
        thumbnailUrl: uploadResult.thumbnailUrl,
        fileId: uploadResult.fileId,
        name: uploadResult.name,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
