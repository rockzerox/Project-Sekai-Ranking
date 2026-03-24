import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error("❌ 找不到 Supabase 憑證！");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false },
});

type DimensionRecord = {
  top100_count: number;
  specific_rank_counts: Record<string, number>;
};

// Map: user_id -> dimension_type -> dimension_id -> DimensionRecord
type UserStatsMap = Record<string, Record<string, Record<number, DimensionRecord>>>;

// 故事類型對映字典 (Story Type -> Integer)
const STORY_TYPE_MAP: Record<string, number> = {
  'unit_event': 1,
  'mixed_event': 2,
  'world_link': 3,
};

function getStoryTypeId(storyType: string | null): number {
  if (!storyType) return 99; // 預設未知
  return STORY_TYPE_MAP[storyType] || 99;
}

function parseCardId(cardStr: string | null): number | null {
  if (!cardStr || cardStr === '-') return null;
  const parsed = parseInt(cardStr.split('-')[0], 10);
  return isNaN(parsed) ? null : parsed;
}

async function runMigration() {
  console.log("🚀 開始歷史資料一次性清洗 (Historic Migration)...");

  // 0. 清空原本錯誤的資料庫表 (透過 RPC)
  console.log("🧹 正在清空 player_activity_stats 表的舊有資料 (以免留下因 Bug 產生的幽靈資料)...");
  const { error: truncateErr } = await supabase.rpc('execute_sql', { query: 'TRUNCATE TABLE player_activity_stats;' });
  if (truncateErr) {
      console.warn("⚠️ 警告: TRUNCATE TABLE 失敗，嘗試使用 DELETE FROM...", truncateErr.message);
      await supabase.rpc('execute_sql', { query: 'DELETE FROM player_activity_stats;' });
  } else {
      console.log("✅ 成功清空 player_activity_stats。");
  }

  // 1. 先撈出所有 events 中已知的 metadata
  const { data: eventsList, error: eventsError } = await supabase
    .from('events')
    .select('id, unit_id, story_type, banner, four_star_cards');

  if (eventsError || !eventsList) {
    console.error("獲取 events 失敗:", eventsError);
    return;
  }

  const eventsMap = new Map();
  for (const ev of eventsList) {
    eventsMap.set(ev.id, ev);
  }
  console.log(`✅ 成功載入 ${eventsList.length} 期活動元資料。`);

  const globalStats: UserStatsMap = {};

  // 幫助函數：給玩家塞點數
  const addPoint = (userId: string, dimType: string, dimId: number, rank: number) => {
    if (!globalStats[userId]) globalStats[userId] = {};
    if (!globalStats[userId][dimType]) globalStats[userId][dimType] = {};
    if (!globalStats[userId][dimType][dimId]) {
      globalStats[userId][dimType][dimId] = { top100_count: 0, specific_rank_counts: {} };
    }

    const record = globalStats[userId][dimType][dimId];
    record.top100_count += 1;
    
    // 名次分佈
    const rKey = rank.toString();
    record.specific_rank_counts[rKey] = (record.specific_rank_counts[rKey] || 0) + 1;
  };

  // 2. 逐一撈取各期前百大榜單 (限制 rank <= 100)
  for (const ev of eventsList) {
    const eventId = ev.id;
    console.log(`正在讀取 Event ${eventId} 的排行榜...`);

    let page = 0;
    const pageSize = 1000;
    let hasMore = true;

    while (hasMore) {
      const { data: rankings, error: rankError } = await supabase
        .from('event_rankings')
        .select('user_id, rank')
        .eq('event_id', eventId)
        .eq('chapter_char_id', -1)
        .lte('rank', 100)
        .range(page * pageSize, (page + 1) * pageSize - 1);

      if (rankError || !rankings) {
        console.error(`獲取 Event ${eventId} 排名失敗:`, rankError);
        break;
      }

      for (const row of rankings) {
        const uid = row.user_id;
        const rank = row.rank;

        // 五大維度發配
        // 1. ALL
        addPoint(uid, 'all', 0, rank);

        // 2. UNIT
        if (ev.unit_id !== null && ev.unit_id !== undefined) {
          addPoint(uid, 'unit_id', ev.unit_id, rank);
        }

        // 3. STORY_TYPE
        const sTypeInt = getStoryTypeId(ev.story_type);
        addPoint(uid, 'story_type', sTypeInt, rank);

        // 4. BANNER (剝離尾碼)
        const bId = parseCardId(ev.banner);
        if (bId !== null) {
          addPoint(uid, 'banner', bId, rank);
        }

        // 5. FOUR_STAR_CARDS (陣列，逐一剝離尾碼)
        if (Array.isArray(ev.four_star_cards)) {
          for (const card of ev.four_star_cards) {
            const cId = parseCardId(card);
            if (cId !== null) {
              addPoint(uid, 'four_star_cards', cId, rank);
            }
          }
        }
      }

      if (rankings.length < pageSize) {
        hasMore = false;
      } else {
        page++;
      }
    }
  }

  // 3. 將巢狀字典展平為 Database Rows
  console.log("計算完畢，準備攤平資料寫回 Supabase...");
  const pushData: any[] = [];
  
  for (const uid of Object.keys(globalStats)) {
    for (const dType of Object.keys(globalStats[uid])) {
      for (const dIdStr of Object.keys(globalStats[uid][dType])) {
        const dId = parseInt(dIdStr, 10);
        const st = globalStats[uid][dType][dId];

        pushData.push({
          user_id: uid,
          dimension_type: dType,
          dimension_id: dId,
          top100_count: st.top100_count,
          specific_rank_counts: st.specific_rank_counts,
          last_computed_at: new Date().toISOString()
        });
      }
    }
  }

  console.log(`總計生成 ${pushData.length} 筆五維度統計資料 (Rows)，開始分批 Upsert...`);

  // 4. Batch Upsert
  const batchSize = 1000;
  let successCount = 0;
  for (let i = 0; i < pushData.length; i += batchSize) {
    const chunk = pushData.slice(i, i + batchSize);
    const { error: upsertErr } = await supabase
      .from('player_activity_stats')
      .upsert(chunk, {
        onConflict: 'user_id, dimension_type, dimension_id'
      });

    if (upsertErr) {
      console.error(`批次寫入失敗 (${i} ~ ${i + batchSize}):`, upsertErr);
    } else {
      successCount += chunk.length;
      console.log(`✅ 已成功寫入 ${successCount} / ${pushData.length} 筆資料...`);
    }
  }

  console.log("🎉 所有歷史資料遷移作業圓滿完成！");
}

runMigration().catch(err => console.error("發生錯誤:", err));
