import dotenv from 'dotenv';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// 載入環境變數
dotenv.config({ path: path.resolve(process.cwd(), '.env.migration') });

async function main() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
        console.error('❌ 錯誤：找不到 SUPABASE_URL 或 SUPABASE_SERVICE_ROLE_KEY 環境變數。');
        process.exit(1);
    }

    const sb = createClient(supabaseUrl, supabaseServiceKey);

    const sql = `
    DELETE FROM player_activity_stats;
    
    INSERT INTO player_activity_stats (user_id, unit_id, top100_count, specific_rank_counts, last_computed_at)
    SELECT user_id, 0, COUNT(*),
      (SELECT jsonb_object_agg(rank::text, cnt)
       FROM (SELECT rank, COUNT(*) AS cnt FROM event_rankings er2
             WHERE er2.user_id = er.user_id
               AND er2.chapter_char_id = -1
               AND er2.rank <= 100
             GROUP BY rank) sub),
      now()
    FROM event_rankings er
    WHERE chapter_char_id = -1 AND rank <= 100
    GROUP BY user_id
    ON CONFLICT (user_id, unit_id) DO UPDATE SET
      top100_count = EXCLUDED.top100_count,
      specific_rank_counts = EXCLUDED.specific_rank_counts,
      last_computed_at = EXCLUDED.last_computed_at;
  `;

    try {
        const { error } = await sb.rpc('execute_sql', { query: sql });
        if (error) throw error;
        console.log('Stats computation completed successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Computation failed:', error);
        process.exit(1);
    }
}

main();
