import { supabase } from './supabase';

const HISEKAI_API_BASE = process.env.HISEKAI_API_BASE || 'https://api.hisekai.org/tw';

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

export const getUnifiedRankings = async (id: string, isLive: boolean) => {
  try {
    if (isLive) {
      // Live: Fetch both from Hisekai and merge
      const [topRes, borderRes] = await Promise.all([
        fetch(`${HISEKAI_API_BASE}/event/live/top100`),
        fetch(`${HISEKAI_API_BASE}/event/live/border`)
      ]);
      
      const topData = await topRes.json();
      const borderData = await borderRes.json();
      
      return JSON.stringify({
        id: topData.id,
        name: topData.name,
        aggregate_at: topData.aggregate_at,
        start_at: topData.start_at,
        closed_at: topData.closed_at,
        ranking_announce_at: topData.ranking_announce_at,
        rankings: topData.top_100_player_rankings || [],
        borders: borderData.border_player_rankings || [],
        userWorldBloomChapterRankings: topData.userWorldBloomChapterRankings || [],
        userWorldBloomChapterRankingBorders: borderData.userWorldBloomChapterRankingBorders || []
      });
    } else {
      // Past: Fetch from Supabase with sparse list + top 100
      const { data, error } = await supabase
        .from('event_rankings')
        .select('*, players(user_id, user_name)')
        .eq('event_id', parseInt(id))
        .or('rank.lte.100,rank.in.(200,300,400,500,600,700,800,900,1000,2000,3000,4000,5000,10000,20000,30000,40000,50000,60000,70000,80000,90000,100000)')
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

      const chapters = Object.keys(chapterRankingsMap).map(charId => ({
        gameCharacterId: parseInt(charId),
        rankings: chapterRankingsMap[parseInt(charId)]
      }));

      // Fetch event basic info for metadata
      const { data: eventInfo } = await supabase
        .from('events')
        .select('name, aggregate_at')
        .eq('id', parseInt(id))
        .single();

      return JSON.stringify({
        id: parseInt(id),
        name: eventInfo?.name || "Unknown Event",
        aggregate_at: eventInfo?.aggregate_at || null,
        rankings: overallRankings,
        chapters
      });
    }
  } catch (error) {
    console.error(`Error fetching unified rankings for event ${id}:`, error);
    throw error;
  }
};

export const getPastRankings = async (id: string) => {
  try {
    const { data, error } = await supabase
      .from('event_rankings')
      .select('*, players(user_id, user_name)')
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
        .select('*, players(user_id, user_name)')
        .eq('event_id', parseInt(id))
        .in('rank', [1, 2, 3, 10, 20, 30, 40, 50, 100, 200, 300, 400, 500, 1000, 2000, 5000, 10000, 20000, 30000, 50000])
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
