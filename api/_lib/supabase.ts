import { createClient } from '@supabase/supabase-js';

/**
 * 伺服器端專用的 Supabase Admin Client
 * 使用 service_role key 繞過 RLS，僅限於 Vercel API Routes 使用。
 */
export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
