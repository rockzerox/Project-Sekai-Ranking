import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("❌ 缺少 SUPABASE_URL 或 SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function fixDurations() {
  console.log('⏳ 開始標準化歷史活動天數 (2 位小數)...');

  // 1. 抓取所有活動的時間資訊
  const { data: events, error: eErr } = await supabase.from('events').select('id, start_at, aggregate_at, closed_at');
  if (eErr) throw eErr;

  // 2. 抓取所有的統計資料
  const { data: stats, error: sErr } = await supabase.from('event_border_stats').select('event_id, duration_days');
  if (sErr) throw sErr;

  console.log(`查找到 ${stats.length} 筆統計資料待檢查。`);

  const eventMap = new Map(events.map(e => [e.id, e]));

  for (const row of stats) {
    const ev = eventMap.get(row.event_id);
    if (!ev) continue;

    const endTimestamp = ev.aggregate_at || ev.closed_at;
    if (!ev.start_at || !endTimestamp) continue;

    // 計算精確天數
    const diffDays = (new Date(endTimestamp).getTime() - new Date(ev.start_at).getTime()) / (1000 * 60 * 60 * 24);
    // 標準化為 2 位小數 (有效位數規範)
    const standardized = parseFloat(diffDays.toFixed(2));

    if (standardized !== row.duration_days) {
      console.log(`修正活動 ${row.event_id}: ${row.duration_days} -> ${standardized}`);
      const { error: uErr } = await supabase
        .from('event_border_stats')
        .update({ duration_days: standardized })
        .eq('event_id', row.event_id);

      if (uErr) {
        console.error(`❌ 活動 ${row.event_id} 更新失敗:`, uErr.message);
      }
    }
  }

  console.log('✨ 歷史數據標準化完成！');
}

fixDurations().catch(err => {
  console.error('💥 發生致命錯誤:', err);
  process.exit(1);
});
