// scripts/_client.ts
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.migration' });

export const sb = createClient(
    process.env.SUPABASE_URL! || process.env.VITE_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const HISEKAI = process.env.HISEKAI_API_BASE!;
export const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));