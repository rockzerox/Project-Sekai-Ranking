import { createClient } from '@supabase/supabase-js';

const HISEKAI_API_BASE = process.env.HISEKAI_API_BASE || 'https://api.hisekai.org/tw';

// 初始化 Supabase 客戶端 (後端專用)
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
// 嚴格檢查：伺服器端必須使用 SERVICE_ROLE_KEY，不應 fallback 到 anon key
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase configuration in rankingsService');
}

const supabase = createClient(supabaseUrl, supabaseKey || '');

export const getLiveRankings = async () => {
  try {
    const response = await fetch(`${HISEKAI_API_BASE}/event/live/top100`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.text();
  } catch (error) {
    console.error('Error fetching live rankings:', error);
    throw error;
  }
};

export const getPastRankings = async (id: string) => {
  try {
    const { data, error } = await supabase
      .from('event_rankings')
      .select('*, players!inner(user_id, user_name)')
      .eq('event_id', parseInt(id))
      .lte('rank', 100)
      .order('rank', { ascending: true });

    if (error) {
      throw error;
    }

    const overallRankings: any[] = [];
    const chapterRankingsMap: Record<number, any[]> = {};

    data.forEach((row: any) => {
      const mappedRow = {
        userId: row.user_id,
        name: row.players?.user_name || 'Unknown',
        rank: row.rank,
        score: row.score,
        last_played_at: row.last_played_at,
        userCard: row.raw_user_card,
        chapter_char_id: row.chapter_char_id
      };

      if (row.chapter_char_id === -1) {
        overallRankings.push(mappedRow);
      } else {
        if (!chapterRankingsMap[row.chapter_char_id]) {
          chapterRankingsMap[row.chapter_char_id] = [];
        }
        chapterRankingsMap[row.chapter_char_id].push(mappedRow);
      }
    });

    const userWorldBloomChapterRankings = Object.keys(chapterRankingsMap).map(charId => ({
      gameCharacterId: parseInt(charId),
      rankings: chapterRankingsMap[parseInt(charId)]
    }));

    return JSON.stringify({
      id: parseInt(id),
      top_100_player_rankings: overallRankings,
      userWorldBloomChapterRankings
    });
  } catch (error) {
    console.error(`Error fetching past rankings for event ${id}:`, error);
    throw error;
  }
};

export const getBorderRankings = async (id: string, isLive: boolean) => {
  try {
    if (isLive) {
      const response = await fetch(`${HISEKAI_API_BASE}/event/live/border`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return await response.text();
    } else {
      const { data, error } = await supabase
        .from('event_rankings')
        .select('*, players!inner(user_id, user_name)')
        .eq('event_id', parseInt(id))
        .gt('rank', 100)
        .order('rank', { ascending: true });

      if (error) throw error;

      const overallRankings: any[] = [];
      const chapterRankingsMap: Record<number, any[]> = {};

      data.forEach((row: any) => {
        const mappedRow = {
          userId: row.user_id,
          name: row.players?.user_name || 'Unknown',
          rank: row.rank,
          score: row.score,
          last_played_at: row.last_played_at,
          userCard: row.raw_user_card,
          chapter_char_id: row.chapter_char_id
        };

        if (row.chapter_char_id === -1) {
          overallRankings.push(mappedRow);
        } else {
          if (!chapterRankingsMap[row.chapter_char_id]) {
            chapterRankingsMap[row.chapter_char_id] = [];
          }
          chapterRankingsMap[row.chapter_char_id].push(mappedRow);
        }
      });

      const userWorldBloomChapterRankingBorders = Object.keys(chapterRankingsMap).map(charId => ({
        gameCharacterId: parseInt(charId),
        borderRankings: chapterRankingsMap[parseInt(charId)]
      }));

      return JSON.stringify({
        id: parseInt(id),
        border_player_rankings: overallRankings,
        userWorldBloomChapterRankingBorders
      });
    }
  } catch (error) {
    console.error(`Error fetching border rankings for event ${id}:`, error);
    throw error;
  }
};
