import { supabase } from './supabase';

export interface PlayerActivityStats {
  user_id: string;
  unit_id: number;
  top100_count: number;
  specific_rank_counts: Record<string, number>;
  last_computed_at: string;
}

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

/**
 * 重新計算所有玩家的統計數據並更新 player_activity_stats 表 (五大維度版本)
 */
export const recomputeAllPlayerStats = async () => {
  console.log('🔄 開始重新結算所有活躍玩家榜 (5-Dim Engine)...');

  // 先清空資料庫表避免舊的 ghost records
  console.log("🧹 正在清空 player_activity_stats 表的舊有資料...");
  const { error: truncateErr } = await supabase.rpc('execute_sql', { query: 'TRUNCATE TABLE player_activity_stats;' });
  if (truncateErr) {
      console.warn("⚠️ 警告: TRUNCATE TABLE 失敗，嘗試使用 DELETE FROM...", truncateErr.message);
      await supabase.rpc('execute_sql', { query: 'DELETE FROM player_activity_stats;' });
  }

  // 1. 取得所有 events 中已知的 metadata
  const { data: eventsList, error: eventsError } = await supabase
    .from('events')
    .select('id, unit_id, story_type, banner, four_star_cards');

  if (eventsError || !eventsList) {
    throw new Error(`獲取 events 失敗: ${eventsError.message}`);
  }

  type DimensionRecord = {
    top100_count: number;
    specific_rank_counts: Record<string, number>;
  };
  type UserStatsMap = Record<string, Record<string, Record<number, DimensionRecord>>>;
  const globalStats: UserStatsMap = {};

  const addPoint = (userId: string, dimType: string, dimId: number, rank: number) => {
    if (!globalStats[userId]) globalStats[userId] = {};
    if (!globalStats[userId][dimType]) globalStats[userId][dimType] = {};
    if (!globalStats[userId][dimType][dimId]) {
      globalStats[userId][dimType][dimId] = { top100_count: 0, specific_rank_counts: {} };
    }

    const record = globalStats[userId][dimType][dimId];
    record.top100_count += 1;
    const rKey = rank.toString();
    record.specific_rank_counts[rKey] = (record.specific_rank_counts[rKey] || 0) + 1;
  };

  for (const ev of eventsList) {
    const eventId = ev.id;
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

      if (rankError || !rankings) break;

      for (const row of rankings) {
        const uid = row.user_id;
        const rank = row.rank;

        // 1. ALL
        addPoint(uid, 'all', 0, rank);

        // 2. UNIT
        if (ev.unit_id !== null && ev.unit_id !== undefined) addPoint(uid, 'unit_id', ev.unit_id, rank);

        // 3. STORY_TYPE
        const sTypeInt = getStoryTypeId(ev.story_type);
        addPoint(uid, 'story_type', sTypeInt, rank);

        // 4. BANNER
        const bId = parseCardId(ev.banner);
        if (bId !== null) addPoint(uid, 'banner', bId, rank);

        // 5. FOUR_STAR_CARDS
        if (Array.isArray(ev.four_star_cards)) {
          for (const card of ev.four_star_cards) {
            const cId = parseCardId(card);
            if (cId !== null) addPoint(uid, 'four_star_cards', cId, rank);
          }
        }
      }

      if (rankings.length < pageSize) hasMore = false;
      else page++;
    }
  }

  const upsertData: any[] = [];
  const now = new Date().toISOString();
  for (const uid of Object.keys(globalStats)) {
    for (const dType of Object.keys(globalStats[uid])) {
      for (const dIdStr of Object.keys(globalStats[uid][dType])) {
        const dId = parseInt(dIdStr, 10);
        const st = globalStats[uid][dType][dId];
        upsertData.push({
          user_id: uid,
          dimension_type: dType,
          dimension_id: dId,
          top100_count: st.top100_count,
          specific_rank_counts: st.specific_rank_counts,
          last_computed_at: now
        });
      }
    }
  }

  const batchSize = 1000;
  for (let i = 0; i < upsertData.length; i += batchSize) {
    const chunk = upsertData.slice(i, i + batchSize);
    const { error: upsertErr } = await supabase
      .from('player_activity_stats')
      .upsert(chunk, { onConflict: 'user_id, dimension_type, dimension_id' });
    if (upsertErr) console.error(`批次寫入失敗:`, upsertErr.message);
  }

  console.log(`✅ 成功結算五大維度活躍玩家榜！共寫入 ${upsertData.length} 筆資料。\n`);
};

/**
 * 取得特定玩家的統計數據
 */
export const getPlayerStats = async (userId: string) => {
  const { data, error } = await supabase
    .from('player_activity_stats')
    .select('*')
    .eq('user_id', userId);

  if (error) {
    throw new Error(`Failed to fetch player stats: ${error.message}`);
  }

  return data;
};

/**
 * 取得所有活動的榜線統計資料
 */
export const getBorderStats = async () => {
  // ① 主要來源：預先計算好的統計表 (極速)
  const [generalRes, wlRes] = await Promise.all([
    supabase
      .from('event_border_stats')
      .select('*')
      .order('event_id', { ascending: false }),
    supabase
      .from('wl_chapter_border_stats')
      .select('*')
      .order('event_id', { ascending: false })
  ]);

  if (generalRes.error) throw generalRes.error;
  if (wlRes.error) throw wlRes.error;

  // 格式化資料
  const formattedStats = (generalRes.data || []).map((row) => ({
    eventId: row.event_id,
    top1: row.top1 || 0,
    top10: row.top10 || 0,
    top50: row.top50 || 0,
    top100: row.top100 || 0,
    borders: {
      200: row.border_200 || 0,
      300: row.border_300 || 0,
      400: row.border_400 || 0,
      500: row.border_500 || 0,
      1000: row.border_1000 || 0,
      2000: row.border_2000 || 0,
      5000: row.border_5000 || 0,
      10000: row.border_10000 || 0,
    }
  }));

  const formattedWlStats = (wlRes.data || []).map((row) => ({
    eventId: row.event_id,
    chapterCharId: row.chapter_char_id,
    durationDays: row.duration_days,
    top1: row.top1 || 0,
    top10: row.top10 || 0,
    top50: row.top50 || 0,
    top100: row.top100 || 0,
    borders: {
      200: row.border_200 || 0,
      300: row.border_300 || 0,
      400: row.border_400 || 0,
      500: row.border_500 || 0,
      1000: row.border_1000 || 0,
      2000: row.border_2000 || 0,
      5000: row.border_5000 || 0,
      10000: row.border_10000 || 0,
    }
  }));

  if (formattedStats.length > 0 || formattedWlStats.length > 0) {
    return { 
      stats: formattedStats,
      wlStats: formattedWlStats
    };
  }

  // ② 降級來源：從 event_rankings 即時聚合
  console.log('Fallback: Aggregating from event_rankings...');
  const targetRanks = [1, 10, 50, 100, 200, 300, 400, 500, 1000, 2000, 5000, 10000];
  
  const { data: fallbackData, error: fallbackError } = await supabase
    .from('event_rankings')
    .select('event_id, rank, score, chapter_char_id')
    .in('rank', targetRanks);

  if (fallbackError) throw fallbackError;
  if (!fallbackData || fallbackData.length === 0) return { stats: [], wlStats: [] };

  const statsMap: Record<number, any> = {};
  const wlStatsMap: Record<string, any> = {};
  
  fallbackData.forEach((row) => {
    const { event_id, rank, score, chapter_char_id } = row;
    
    if (chapter_char_id === -1) {
      if (!statsMap[event_id]) {
        statsMap[event_id] = { eventId: event_id, top1: 0, top10: 0, top50: 0, top100: 0, borders: {} };
      }
      if (rank === 1) statsMap[event_id].top1 = score;
      else if (rank === 10) statsMap[event_id].top10 = score;
      else if (rank === 50) statsMap[event_id].top50 = score;
      else if (rank === 100) statsMap[event_id].top100 = score;
      else statsMap[event_id].borders[rank] = score;
    } else {
      const key = `${event_id}-${chapter_char_id}`;
      if (!wlStatsMap[key]) {
        wlStatsMap[key] = { eventId: event_id, chapterCharId: chapter_char_id, top1: 0, top10: 0, top50: 0, top100: 0, borders: {} };
      }
      if (rank === 1) wlStatsMap[key].top1 = score;
      else if (rank === 10) wlStatsMap[key].top10 = score;
      else if (rank === 50) wlStatsMap[key].top50 = score;
      else if (rank === 100) wlStatsMap[key].top100 = score;
      else wlStatsMap[key].borders[rank] = score;
    }
  });

  return { 
    stats: Object.values(statsMap).sort((a: any, b: any) => b.eventId - a.eventId),
    wlStats: Object.values(wlStatsMap).sort((a: any, b: any) => b.eventId - a.eventId)
  };
};
