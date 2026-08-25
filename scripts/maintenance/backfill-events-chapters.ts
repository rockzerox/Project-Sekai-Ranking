import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("❌ 缺少 SUPABASE_URL 或 SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function runPhase25Backfill() {
  console.log('🚀 [Phase 2.5] 開始執行 chapters 資料庫回填與快照...');

  // 1. 讀取現有 events
  const { data: existingEvents, error: fetchErr } = await supabase.from('events').select('id, name, extra_data');
  if (fetchErr) throw fetchErr;

  // 2. 抓取 Hisekai /event/list 取得完整 chapters
  const res = await fetch('https://api.hisekai.org/tw/event/list');
  if (!res.ok) throw new Error(`[Hisekai] /event/list 失敗: ${res.status}`);
  const apiEvents = await res.json() as any[];

  const wlEvents = apiEvents.filter((e: any) => Array.isArray(e.chapters) && e.chapters.length > 0);
  console.log(`🔍 取得 ${wlEvents.length} 檔含 chapters 的 WL 活動。`);

  const existingMap = new Map(existingEvents.map(e => [e.id, e]));
  const upsertPayload: any[] = [];

  for (const wl of wlEvents) {
    const ex = existingMap.get(wl.id);
    const currentExtra = (ex?.extra_data && typeof ex.extra_data === 'object') ? ex.extra_data : {};
    
    // 合併寫入 extra_data.chapters，不覆蓋既有其他欄位
    const updatedExtra = {
      ...currentExtra,
      chapters: wl.chapters
    };

    upsertPayload.push({
      id: wl.id,
      event_type: 'world_link',
      extra_data: updatedExtra
    });
  }

  // 3. 執行合併 upsert
  const { error: upErr } = await supabase.from('events').upsert(upsertPayload);
  if (upErr) throw upErr;
  console.log(`✅ 成功回填 ${upsertPayload.length} 檔活動的 extra_data.chapters！`);

  // 4. 驗收查詢 (#163, #180)
  const { data: verifyData, error: vErr } = await supabase
    .from('events')
    .select('id, name, event_type, extra_data')
    .in('id', [163, 180])
    .order('id', { ascending: true });

  if (vErr) throw vErr;

  console.log('\n=== DB 落地驗收結果 ===');
  verifyData?.forEach(row => {
    console.log(`活動 #${row.id} (${row.name}):`, {
      event_type: row.event_type,
      chapterCount: row.extra_data?.chapters?.length,
      chapters: row.extra_data?.chapters
    });
  });

  // 斷言檢查
  const e180 = verifyData?.find(r => r.id === 180);
  const is180Ok = e180?.extra_data?.chapters?.length === 1 && e180?.extra_data?.chapters[0]?.character === 0;
  console.log(`\n斷言檢查: #180 帶有單一 character:0 章節:`, is180Ok ? '✅ PASS' : '❌ FAIL');
}

runPhase25Backfill().catch(console.error);
