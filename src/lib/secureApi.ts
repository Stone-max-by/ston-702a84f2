import { supabase } from "@/integrations/supabase/client";

function getTelegramInitData(): string | null {
  return window.Telegram?.WebApp?.initData || null;
}

export async function secureApiCall<T = any>(action: string, params: Record<string, any> = {}): Promise<T> {
  const initData = getTelegramInitData();
  if (!initData) throw new Error("Telegram authentication required");

  const { data, error } = await supabase.functions.invoke('secure-api', {
    body: { action, ...params },
    headers: { 'x-telegram-init-data': initData },
  });

  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data as T;
}
