import { supabase } from './supabase';

export interface PlayerActivityStats {
  user_id: string;
  unit_id: number;
  top100_count: number;
  specific_rank_counts: Record<string, number>;
  last_computed_at: string;
}

/**
 * 重新計算所有玩家的統計數據並更新 player_activity_stats 表
 */
export const recomputeAllPlayerStats = async () => {
  console.log('Starting recomputation of player stats...');

  // 1. 取得所有排名資料與對應的活動單元 ID
  const { data: rankings, error: rankingsError } = await supabase
    .from('event_rankings')
    .select(`
      user_id,
      rank,
      events (
        unit_id
      )
    `)
    .eq('chapter_char_id', -1); // 排除 WL 章節資料

  if (rankingsError) {
    throw new Error(`Failed to fetch rankings: ${rankingsError.message}`);
  }

  if (!rankings || rankings.length === 0) {
    console.log('No rankings found to compute.');
    return;
  }

  // 2. 進行記憶體內聚合
  // 結構: statsMap[user_id][unit_id] = { top100: number, ranks: { [rank]: count } }
  const statsMap: Record<string, Record<number, { top100: number; ranks: Record<string, number> }>> = {};

  rankings.forEach((row: any) => {
    const userId = row.user_id;
    const unitId = row.events?.unit_id || 0;
    const rank = row.rank;

    // 初始化使用者與單元
    const initStats = (uid: number) => {
      if (!statsMap[userId]) statsMap[userId] = {};
      if (!statsMap[userId][uid]) {
        statsMap[userId][uid] = { top100: 0, ranks: {} };
      }
    };

    // 更新特定單元統計
    initStats(unitId);
    if (rank <= 100) statsMap[userId][unitId].top100++;
    statsMap[userId][unitId].ranks[rank] = (statsMap[userId][unitId].ranks[rank] || 0) + 1;

    // 更新總計統計 (unit_id = 0)
    initStats(0);
    if (rank <= 100) statsMap[userId][0].top100++;
    statsMap[userId][0].ranks[rank] = (statsMap[userId][0].ranks[rank] || 0) + 1;
  });

  // 3. 準備寫入資料庫
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

  // 4. 批次寫入 Supabase (使用 upsert)
  // 注意: 這裡假設 player_activity_stats 有 (user_id, unit_id) 的唯一約束或主鍵
  const batchSize = 500;
  for (let i = 0; i < upsertData.length; i += batchSize) {
    const batch = upsertData.slice(i, i + batchSize);
    const { error: upsertError } = await supabase
      .from('player_activity_stats')
      .upsert(batch, { onConflict: 'user_id,unit_id' });

    if (upsertError) {
      console.error(`Error upserting batch ${i / batchSize}:`, upsertError.message);
    }
  }

  console.log(`Successfully recomputed stats for ${upsertData.length} user-unit combinations.`);
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
  // ① 主要來源：預先計算好的 event_border_stats 表 (極速)
  const { data, error } = await supabase
    .from('event_border_stats')
    .select('*')
    .order('event_id', { ascending: false });

  if (error) {
    console.error('Failed to fetch from event_border_stats:', error);
    throw error;
  }

  if (data && data.length > 0) {
    // 將資料庫格式轉換為前端預期的格式
    const formattedStats = data.map((row) => ({
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
    return { stats: formattedStats };
  }

  // ② 降級來源：從 event_rankings 即時聚合 (較慢，但能保證有資料)
  console.log('Fallback: Aggregating from event_rankings...');
  const targetRanks = [1, 10, 50, 100, 200, 300, 400, 500, 1000, 2000, 5000, 10000];
  
  const { data: fallbackData, error: fallbackError } = await supabase
    .from('event_rankings')
    .select('event_id, rank, score')
    .eq('chapter_char_id', -1)
    .in('rank', targetRanks);

  if (fallbackError) {
    console.error('Fallback aggregation failed:', fallbackError);
    throw fallbackError;
  }

  if (!fallbackData || fallbackData.length === 0) {
    return { stats: [] };
  }

  // 在記憶體中進行 Group By
  const statsMap: Record<number, any> = {};
  
  fallbackData.forEach((row) => {
    const { event_id, rank, score } = row;
    if (!statsMap[event_id]) {
      statsMap[event_id] = {
        eventId: event_id,
        top1: 0, top10: 0, top50: 0, top100: 0,
        borders: {}
      };
    }

    if (rank === 1) statsMap[event_id].top1 = score;
    else if (rank === 10) statsMap[event_id].top10 = score;
    else if (rank === 50) statsMap[event_id].top50 = score;
    else if (rank === 100) statsMap[event_id].top100 = score;
    else statsMap[event_id].borders[rank] = score;
  });

  // 轉換為陣列並排序 (由新到舊)
  const formattedStats = Object.values(statsMap).sort((a, b) => b.eventId - a.eventId);

  return { stats: formattedStats };
};
