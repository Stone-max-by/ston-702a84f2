import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { telegramId, channelId } = await req.json();
    
    console.log(`Verifying channel membership for user ${telegramId} in channel ${channelId}`);

    if (!telegramId || !channelId) {
      return new Response(
        JSON.stringify({ error: 'Missing telegramId or channelId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
    if (!botToken) {
      console.error('TELEGRAM_BOT_TOKEN not configured');
      return new Response(
        JSON.stringify({ error: 'Bot token not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Call Telegram API to check chat member status
    const url = `https://api.telegram.org/bot${botToken}/getChatMember?chat_id=${encodeURIComponent(channelId)}&user_id=${telegramId}`;
    
    console.log(`Calling Telegram API: getChatMember`);
    
    const response = await fetch(url);
    const data = await response.json();

    console.log('Telegram API response:', JSON.stringify(data));

    if (!data.ok) {
      // Check if bot is not admin in channel
      if (data.description?.includes('bot is not a member') || data.description?.includes("chat not found")) {
        return new Response(
          JSON.stringify({ 
            isMember: false, 
            error: 'Bot is not admin in the channel. Please add the bot as admin.' 
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ isMember: false, error: data.description }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check member status
    const status = data.result?.status;
    const validStatuses = ['member', 'administrator', 'creator'];
    const isMember = validStatuses.includes(status);

    console.log(`User ${telegramId} status in channel: ${status}, isMember: ${isMember}`);

    return new Response(
      JSON.stringify({ 
        isMember, 
        status,
        user: data.result?.user 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error verifying channel membership:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
