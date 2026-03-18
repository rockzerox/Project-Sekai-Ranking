import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("❌ 缺少 SUPABASE_URL 或 SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const HISEKAI_API_BASE = 'https://api.hisekai.org/tw';

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

async function syncEvents() {
  console.log('⏳ 開始同步活動清單 (syncEvents)...');
  const res = await fetch(`${HISEKAI_API_BASE}/event/list`);
  if (!res.ok) throw new Error(`[Hisekai] /event/list 失敗: ${res.status}`);
  const apiEvents = await res.json() as any[];

  const { data: existingEvents, error: fetchErr } = await supabase.from('events').select('*');
  if (fetchErr) throw fetchErr;
  
  const existingEventsMap = new Map((existingEvents || []).map(e => [String(e.id), e]));
  const upsertData = apiEvents.map(apiEvent => {
    const id = String(apiEvent.id);
    const ex = existingEventsMap.get(id);
    return {
      id: Number(id),
      name: apiEvent.name ?? ex?.name ?? null,
      start_at: apiEvent.start_at ?? ex?.start_at ?? null,
      aggregate_at: apiEvent.aggregate_at ?? ex?.aggregate_at ?? null,
      closed_at: apiEvent.closed_at ?? ex?.closed_at ?? null,
      ranking_announce_at: apiEvent.ranking_announce_at ?? ex?.ranking_announce_at ?? null,
      unit_id: ex?.unit_id ?? null,
      banner: ex?.banner ?? null,
      event_type: ex?.event_type ?? null,
      story_type: ex?.story_type ?? null
    };
  });

  const { error } = await supabase.from('events').upsert(upsertData);
  if (error) throw new Error(`[Supabase] events upsert 失敗: ${error.message}`);
  
  console.log(`✅ 成功同步 ${upsertData.length} 筆活動資料。\n`);
  return upsertData;
}

async function ingestEventRankings(ev: any) {
  const eventId = ev.id;
  console.log(`⏳ 開始抓取活動 ${eventId} 的排行榜資料...`);

  const t100Res = await fetch(`${HISEKAI_API_BASE}/event/${eventId}/top100`);
  if (!t100Res.ok) throw new Error(`[Hisekai] top100 失敗: ${t100Res.status}`);
  const t100Data = await t100Res.text();
  const parsedT100 = JSON.parse(t100Data.replace(/"([^"]+)"\s*:\s*(-?\d{15,})(?=[,}\s])/g, '"$1": "$2"'));

  await delay(1000);

  const borderRes = await fetch(`${HISEKAI_API_BASE}/event/${eventId}/border`);
  if (!borderRes.ok) throw new Error(`[Hisekai] border 失敗: ${borderRes.status}`);
  const borderData = await borderRes.text();
  const parsedBorder = JSON.parse(borderData.replace(/"([^"]+)"\s*:\s*(-?\d{15,})(?=[,}\s])/g, '"$1": "$2"'));

  let allPlayersMap = new Map<string, { user_id: string, user_name: string, last_seen_at: string }>();
  let allRankings: any[] = [];
  const nowStr = new Date().toISOString();

  const addRanking = (r: any, chapter_char_id: number) => {
    const userId = r.userId ? String(r.userId) : String(r.user?.id || '');
    const userName = r.name || r.user?.display_name || 'Unknown';
    if (!userId) return;

    allPlayersMap.set(userId, { user_id: userId, user_name: userName, last_seen_at: nowStr });
    
    allRankings.push({
      event_id: eventId,
      chapter_char_id,
      rank: r.rank,
      score: r.score,
      user_id: userId,
      last_played_at: r.last_played_at || null,
      raw_user_card: r.userCard || r.last_player_info || null
    });
  };

  const rawT100 = parsedT100.rankings || parsedT100.top_100_player_rankings || [];
  rawT100.forEach((r: any) => addRanking(r, -1));

  const rawBorder = parsedBorder.border_player_rankings || [];
  rawBorder.forEach((r: any) => {
    if (!allRankings.find(x => x.rank === r.rank && x.chapter_char_id === -1)) {
      addRanking(r, -1);
    }
  });

  if (parsedT100.userWorldBloomChapterRankings) {
    parsedT100.userWorldBloomChapterRankings.forEach((ch: any) => {
      ch.rankings.forEach((r: any) => {
         addRanking(r, ch.gameCharacterId);
      });
    });
  }

  // 先寫入 Players 表，避免外鍵衝突 (event_rankings_user_id_fkey)
  console.log(`🧑‍🤝‍🧑 更新 ${allPlayersMap.size} 位玩家資訊到 players 表...`);
  const playersChunk = Array.from(allPlayersMap.values());
  for (let i = 0; i < playersChunk.length; i += 500) {
    const chunk = playersChunk.slice(i, i + 500);
    const { error: pErr } = await supabase.from('players').upsert(chunk, { onConflict: 'user_id' });
    if (pErr) {
      console.error(`[Supabase] 寫入 players 失敗:`, pErr);
      throw pErr;
    }
  }

  console.log(`🧹 清除資料庫中已存在的活動 ${eventId} 資料 (避免污染/重複)...`);
  await supabase.from('event_rankings').delete().eq('event_id', eventId);
  await supabase.from('event_border_stats').delete().eq('event_id', eventId);

  console.log(`💾 寫入 ${allRankings.length} 筆 rankings 資料...`);
  for (let i = 0; i < allRankings.length; i += 500) {
    const chunk = allRankings.slice(i, i + 500);
    const { error } = await supabase.from('event_rankings').insert(chunk);
    if (error) {
      console.error(`[Supabase] 寫入 event_rankings 失敗:`, error);
      throw error;
    }
  }

  console.log(`💾 計算並寫入 event_border_stats...`);
  const getS = (rankList: any[], rank: number) => rankList.find((r: any) => r.rank === rank)?.score || 0;
  
  let duration_days = 0;
  if (ev.start_at && ev.closed_at) {
    duration_days = Math.round((new Date(ev.closed_at).getTime() - new Date(ev.start_at).getTime()) / (1000 * 60 * 60 * 24));
  }

  const borderStats = {
    event_id: eventId,
    duration_days,
    top1: getS(rawT100, 1),
    top10: getS(rawT100, 10),
    top50: getS(rawT100, 50),
    top100: getS(rawT100, 100),
    border_200: getS(rawBorder, 200),
    border_300: getS(rawBorder, 300),
    border_400: getS(rawBorder, 400),
    border_500: getS(rawBorder, 500),
    border_1000: getS(rawBorder, 1000),
    border_2000: getS(rawBorder, 2000),
    border_5000: getS(rawBorder, 5000),
    border_10000: getS(rawBorder, 10000),
    computed_at: new Date().toISOString()
  };

  const { error: bsErr } = await supabase.from('event_border_stats').insert(borderStats);
  if (bsErr) throw new Error(`[Supabase] 寫入 border_stats 失敗: ${bsErr.message}`);

  console.log(`✅ 活動 ${eventId} 資料歸檔完成。\n`);
}

async function recomputeStats() {
  console.log('⏳ 開始重新結算活躍玩家榜 (recomputeAllPlayerStats)...');
  const { data: rankings, error } = await supabase
    .from('event_rankings')
    .select(`user_id, rank, events (unit_id)`)
    .eq('chapter_char_id', -1);
  if (error || !rankings) throw new Error(`[Supabase] 讀取 rankings 失敗`);

  const statsMap: Record<string, Record<number, { top100: number; ranks: Record<string, number> }>> = {};

  rankings.forEach((row: any) => {
    const userId = row.user_id;
    const unitId = row.events?.unit_id || 0;
    const rank = row.rank;

    const initStats = (uid: number) => {
      if (!statsMap[userId]) statsMap[userId] = {};
      if (!statsMap[userId][uid]) {
        statsMap[userId][uid] = { top100: 0, ranks: {} };
      }
    };

    initStats(unitId);
    if (rank <= 100) statsMap[userId][unitId].top100++;
    statsMap[userId][unitId].ranks[rank] = (statsMap[userId][unitId].ranks[rank] || 0) + 1;

    initStats(0);
    if (rank <= 100) statsMap[userId][0].top100++;
    statsMap[userId][0].ranks[rank] = (statsMap[userId][0].ranks[rank] || 0) + 1;
  });

  const upsertData: any[] = [];
  const now = new Date().toISOString();
  for (const userId in statsMap) {
    for (const unitIdStr in statsMap[userId]) {
      const unitId = parseInt(unitIdStr);
      const stats = statsMap[userId][unitId];
      upsertData.push({
        user_id: userId,
        unit_id: unitId,
        top100_count: stats.top100,
        specific_rank_counts: stats.ranks,
        last_computed_at: now
      });
    }
  }

  console.log(`💾 寫入 ${upsertData.length} 筆活躍玩家統計...`);
  for (let i = 0; i < upsertData.length; i += 500) {
    const chunk = upsertData.slice(i, i + 500);
    const { error: upsertErr } = await supabase
      .from('player_activity_stats')
      .upsert(chunk, { onConflict: 'user_id,unit_id' });
    if (upsertErr) throw new Error(`[Supabase] 寫入 player_activity_stats 失敗: ${upsertErr.message}`);
  }
  console.log(`✅ 成功結算活躍玩家榜！\n`);
}

async function main() {
  try {
    console.log("=== 🚀 Hi Sekai TW 自動歸檔腳本啟動 ===\n");
    const allEvents = await syncEvents();

    const now = new Date();
    const recentClosedEvents = allEvents
      .filter((e: any) => e.ranking_announce_at && new Date(e.ranking_announce_at) <= now)
      .sort((a: any, b: any) => b.id - a.id)
      .slice(0, 2);

    for (const ev of recentClosedEvents) {
      console.log(`📌 檢查活動 ${ev.id}: ${ev.name} (結算時間: ${ev.ranking_announce_at})`);
      await ingestEventRankings(ev);
    }

    await recomputeStats();
    console.log("=== 🎉 全流程執行完畢！ ===");

  } catch (error) {
    console.error("❌ 執行過程中發生錯誤:", error);
    process.exit(1);
  }
}

main();
