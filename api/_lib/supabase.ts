import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase configuration in api/_lib/supabase.ts');
}

/**
 * 伺服器端專用的 Supabase Admin Client
 * 使用 service_role key 繞過 RLS，僅限於 Vercel API Routes 使用。
 */
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// 提供別名以相容於不同檔案的命名習慣
export const supabase = supabaseAdmin;
