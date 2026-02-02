import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";
import { Image } from "https://deno.land/x/imagescript@1.3.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN');
const IMAGEKIT_PRIVATE_KEY = Deno.env.get('IMAGEKIT_PRIVATE_KEY');

// Settings for image optimization
const MAX_WIDTH = 800; // Max width for thumbnails
const MAX_HEIGHT = 800; // Max height for thumbnails
const PNG_COMPRESSION = 9; // 0-9, higher = smaller file

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

    const originalBuffer = await fileRes.arrayBuffer();
    const originalSize = originalBuffer.byteLength;
    console.log('Original file size:', originalSize);

    // Step 3: Resize and optimize image using imagescript
    let optimizedBuffer: Uint8Array;
    let mimeType = 'image/png';
    
    try {
      const image = await Image.decode(new Uint8Array(originalBuffer));
      
      // Resize if larger than max dimensions while maintaining aspect ratio
      let resizedImage = image;
      if (image.width > MAX_WIDTH || image.height > MAX_HEIGHT) {
        const ratio = Math.min(MAX_WIDTH / image.width, MAX_HEIGHT / image.height);
        const newWidth = Math.round(image.width * ratio);
        const newHeight = Math.round(image.height * ratio);
        resizedImage = image.resize(newWidth, newHeight);
        console.log(`Resized from ${image.width}x${image.height} to ${newWidth}x${newHeight}`);
      }
      
      // Encode as PNG with compression (imagescript doesn't support WebP natively)
      // ImageKit will auto-convert to WebP when served with ?f=auto or tr:f-webp
      optimizedBuffer = await resizedImage.encode(PNG_COMPRESSION);
      console.log('Optimized size:', optimizedBuffer.byteLength, `(${Math.round((1 - optimizedBuffer.byteLength / originalSize) * 100)}% smaller)`);
    } catch (imageError) {
      console.error('Image processing error, using original:', imageError);
      // If image processing fails, use original
      optimizedBuffer = new Uint8Array(originalBuffer);
    }

    // Step 4: Upload to ImageKit
    const baseFileName = fileName?.replace(/\.[^.]+$/, '') || `thumbnail_${Date.now()}`;
    const uploadFileName = `${baseFileName}.png`;
    
    // Convert Uint8Array to base64 properly
    const base64File = base64Encode(new Uint8Array(optimizedBuffer) as unknown as ArrayBuffer);
    
    const formData = new FormData();
    formData.append('file', `data:${mimeType};base64,${base64File}`);
    formData.append('fileName', uploadFileName);
    formData.append('folder', '/thumbnails');

    // ImageKit uses Basic Auth with private key
    const authString = `${IMAGEKIT_PRIVATE_KEY}:`;
    const authBytes = new TextEncoder().encode(authString);
    const authHeader = base64Encode(authBytes as unknown as ArrayBuffer);

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

    // Return URL with WebP transformation parameter for optimized delivery
    // ImageKit will auto-convert to WebP when client supports it
    const webpUrl = uploadResult.url ? uploadResult.url.replace('/thumbnails/', '/thumbnails/tr:f-webp,q-80/') : uploadResult.url;

    return new Response(
      JSON.stringify({
        success: true,
        url: webpUrl, // WebP optimized URL
        originalUrl: uploadResult.url, // Original URL
        thumbnailUrl: uploadResult.thumbnailUrl,
        fileId: uploadResult.fileId,
        name: uploadResult.name,
        optimization: {
          originalSize,
          uploadedSize: optimizedBuffer.byteLength,
          savedPercent: Math.round((1 - optimizedBuffer.byteLength / originalSize) * 100),
          format: 'webp (via ImageKit transform)',
        },
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
