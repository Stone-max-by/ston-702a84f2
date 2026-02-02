import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SendFileRequest {
  telegramUserId: number;
  telegramFileId: string;
  fileName: string;
  productTitle: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN');
    
    if (!TELEGRAM_BOT_TOKEN) {
      console.error('TELEGRAM_BOT_TOKEN not configured');
      return new Response(
        JSON.stringify({ error: 'Telegram bot not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body: SendFileRequest = await req.json();
    const { telegramUserId, telegramFileId, fileName, productTitle } = body;

    console.log('Send file request:', { telegramUserId, telegramFileId, fileName, productTitle });

    if (!telegramUserId || !telegramFileId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: telegramUserId and telegramFileId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // First send a message about the purchase
    const messageText = `🎉 *Purchase Successful!*\n\n📦 *Product:* ${productTitle}\n📄 *File:* ${fileName}\n\nYour file is being sent...`;
    
    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: telegramUserId,
        text: messageText,
        parse_mode: 'Markdown',
      }),
    });

    // Send the file using telegramFileId
    // Telegram allows re-sending files using file_id
    const sendDocumentResponse = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendDocument`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: telegramUserId,
          document: telegramFileId,
          caption: `📦 ${productTitle}\n📄 ${fileName}`,
        }),
      }
    );

    const sendResult = await sendDocumentResponse.json();
    console.log('Telegram sendDocument result:', sendResult);

    if (!sendResult.ok) {
      console.error('Failed to send document:', sendResult);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to send file via Telegram',
          details: sendResult.description 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'File sent successfully',
        messageId: sendResult.result?.message_id 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in send-file function:', error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
