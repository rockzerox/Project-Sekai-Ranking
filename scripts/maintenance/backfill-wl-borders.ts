import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// 讀取 World Link 詳細資訊以獲取各章節天數 (chDavg)
const wlDetailPath = path.resolve(__dirname, '../../src/data/WorldLinkDetail.json');
const wlDetails = JSON.parse(fs.readFileSync(wlDetailPath, 'utf8'));

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("❌ 缺少 SUPABASE_URL 或 SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function backfillWorldLinkBorders() {
  console.log('🚀 開始回填 World Link 歷史章節紅線 (Backfill WL Borders)...');

  // 1. 找出所有活動類別為 World Link 的活動
  const { data: wlEvents, error: evErr } = await supabase
    .from('events')
    .select('id, name')
    .eq('event_type', 'world_link');

  if (evErr || !wlEvents) {
    throw new Error(`獲取 WL 活動清單失敗: ${evErr?.message}`);
  }

  if (wlEvents.length === 0) {
    console.log('找不到任何 World Link 活動。');
    return;
  }

  console.log(`🔍 找到 ${wlEvents.length} 檔 World Link 活動準備回填。`);

  let totalInserted = 0;

  for (const ev of wlEvents) {
    console.log(`\n處理活動: [${ev.id}] ${ev.name}`);

    // 2. 獲取該活動的原始榜單 (排除總榜 chapter_char_id = -1)
    const { data: rankings, error: rankErr } = await supabase
      .from('event_rankings')
      .select('chapter_char_id, rank, score')
      .eq('event_id', ev.id)
      .neq('chapter_char_id', -1);

    if (rankErr || !rankings || rankings.length === 0) {
      console.log(`⚠️ 活動 ${ev.id} 沒有章節排行榜資料，跳過。`);
      continue;
    }

    // 3. 依照章節角色 (chapter_char_id) 進行分組
    const chapterMap: Record<number, any[]> = {};
    rankings.forEach(r => {
      const charId = r.chapter_char_id;
      if (!chapterMap[charId]) chapterMap[charId] = [];
      chapterMap[charId].push(r);
    });

    const upsertData: any[] = [];

    // 4. 計算每個角色的紅線分數
    for (const charIdStr in chapterMap) {
      const charId = parseInt(charIdStr);
      const list = chapterMap[charId];
      
      const getS = (r: number) => list.find(x => x.rank === r)?.score || 0;

      upsertData.push({
        event_id: ev.id,
        chapter_char_id: charId,
        duration_days: wlDetails[ev.id]?.chDavg || 3,
        top1: getS(1),
        top10: getS(10),
        top50: getS(50),
        top100: getS(100),
        border_200: getS(200),
        border_300: getS(300),
        border_400: getS(400),
        border_500: getS(500),
        border_1000: getS(1000),
        border_2000: getS(2000),
        border_5000: getS(5000),
        border_10000: getS(10000),
        computed_at: new Date().toISOString()
      });
    }

    // 5. 寫入資料庫
    if (upsertData.length > 0) {
      const { error: upsertErr } = await supabase
        .from('wl_chapter_border_stats')
        .upsert(upsertData, { onConflict: 'event_id, chapter_char_id' });

      if (upsertErr) {
        console.error(`❌ 寫入活動 ${ev.id} 統計失敗:`, upsertErr);
      } else {
        console.log(`✅ 成功回填活動 ${ev.id} 裡的 ${upsertData.length} 筆章節紀錄。`);
        totalInserted += upsertData.length;
      }
    }
  }

  console.log(`\n🎉 回填作業大功告成！總計寫入或更新了 ${totalInserted} 筆章節成績。`);
}

backfillWorldLinkBorders().catch(console.error);
