
import React, { useState, useCallback } from 'react';
import { RankEntry, RankingEntry } from '../types';
import { API_BASE_URL } from '../config/constants';
import { transformUserCardToPlayerInfo } from '../utils/transform';

const BIGINT_REGEX = /"([^"]+)"\s*:\s*(-?\d{15,})(?=[,}\s])/g;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const fetchJsonWithBigInt = async <T = any>(url: string, signal?: AbortSignal): Promise<T | null> => {
    const response = await fetch(url, { signal });
    if (!response.ok) throw new Error(`API 請求失敗: ${response.status} (路徑: ${url})`);
    const contentType = response.headers.get('content-type');
    const text = await response.text();
    if (text.trim().startsWith('<!DOCTYPE') || (contentType && contentType.includes('text/html'))) {
        throw new Error("伺服器回傳了錯誤的格式 (404 Not Found)。");
    }
    if (!text || text.trim() === "") return null;
    const sanitized = text.replace(BIGINT_REGEX, '"$1": "$2"');
    try {
        const parsed = JSON.parse(sanitized);
        if (parsed && typeof parsed === 'object' && 'source' in parsed && 'data' in parsed) {
            return parsed.data as T;
        }
        return parsed as T;
    } catch (e) {
        console.error("JSON parse error on URL:", url);
        throw new Error("解析 JSON 失敗，數據格式不正確。");
    }
};

interface UseRankingsReturn {
    rankings: RankEntry[];
    setRankings: React.Dispatch<React.SetStateAction<RankEntry[]>>;
    worldLinkChapters: Record<string, RankEntry[]>;
    isLoading: boolean;
    error: string | null;
    eventName: string;
    liveEventId: number | null;
    liveEventTiming: { startAt: string, aggregateAt: string, rankingAnnounceAt: string } | null;
    lastUpdated: Date | null;
    cachedLiveRankings: RankEntry[];
    cachedPastRankings: RankEntry[];
    fetchRankings: (eventId: number | 'live') => Promise<void>;
    setEventName: (name: string) => void;
}

// 穩定轉化函數 (移出 Hook 以避免身份變動引發循環)
const transformRankingsData = (data: any[]): RankEntry[] => {
    const zeroStat = { count: 0, score: 0, speed: 0, average: 0 };
    return (data || []).map(item => {
        const stats = item.last_1h_stats ? {
            last1h: { count: item.last_1h_stats?.count ?? 0, score: item.last_1h_stats?.score ?? 0, speed: item.last_1h_stats?.speed ?? 0, average: item.last_1h_stats?.average ?? 0 },
            last3h: { count: item.last_3h_stats?.count ?? 0, score: item.last_3h_stats?.score ?? 0, speed: item.last_3h_stats?.speed ?? 0, average: item.last_3h_stats?.average ?? 0 },
            last24h: { count: item.last_24h_stats?.count ?? 0, score: item.last_24h_stats?.score ?? 0, speed: item.last_24h_stats?.speed ?? 0, average: item.last_24h_stats?.average ?? 0 }
        } : { last1h: zeroStat, last3h: zeroStat, last24h: zeroStat };
        
        let lastPlayerInfo = item.last_player_info;
        if (!lastPlayerInfo && item.userCard) {
            lastPlayerInfo = transformUserCardToPlayerInfo(item as unknown as RankingEntry);
        }

        const userId = item.userId ? String(item.userId) : (item.user_id ? String(item.user_id) : "");
        const name = item.name || item.display_name || item.user_name || "Unknown";
        
        return { 
            rank: item.rank, 
            score: item.score, 
            lastPlayedAt: item.last_played_at || '', 
            stats, 
            user: { 
                id: userId, 
                username: name, 
                display_name: name, 
                avatar: '', 
                supporter_tier: 0 
            },
            last_player_info: lastPlayerInfo
        };
    });
};

export const useRankings = (): UseRankingsReturn => {
    const [rankings, setRankings] = useState<RankEntry[]>([]);
    const [cachedLiveRankings, setCachedLiveRankings] = useState<RankEntry[]>([]);
    const [cachedPastRankings, setCachedPastRankings] = useState<RankEntry[]>([]);
    const [worldLinkChapters, setWorldLinkChapters] = useState<Record<string, RankEntry[]>>({});
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const [eventName, setEventName] = useState('載入中...');
    const [liveEventId, setLiveEventId] = useState<number | null>(null);
    const [liveEventTiming, setLiveEventTiming] = useState<{ startAt: string, aggregateAt: string, rankingAnnounceAt: string } | null>(null);

    const fetchRankings = useCallback(async (eventId: number | 'live') => {
        setIsLoading(true); 
        setError(null);
        try {
            const url = `${API_BASE_URL}/event/${eventId}/rankings`;
            const data: any = await fetchJsonWithBigInt(url);

            if (!data) throw new Error('API 無回應');

            const chapterMap: Record<string, RankEntry[]> = {};
            
            // 同步元數據 (Metadata)
            if (data.name) setEventName(data.name);
            if (data.id) setLiveEventId(Number(data.id));
            
            // 最後更新時間：以使用者刷新收到資料的當下時間為準（即時反映拉取動作）
            setLastUpdated(new Date());

            if (data.start_at && data.closed_at) {
                setLiveEventTiming({
                    startAt: data.start_at,
                    aggregateAt: data.aggregate_at || data.closed_at,
                    rankingAnnounceAt: data.ranking_announce_at || data.closed_at
                });
            }

            if (eventId === 'live') {
                const mainRankings = transformRankingsData([...(data.rankings || []), ...(data.borders || [])]);
                const uniqueMain = Array.from(new Map(mainRankings.map(r => [r.rank, r])).values()).sort((a,b) => a.rank - b.rank);
                
                setRankings(uniqueMain);
                setCachedLiveRankings(uniqueMain);
                
                // Chapter 處理
                if (data.userWorldBloomChapterRankings || data.userWorldBloomChapterRankingBorders) {
                    const rawChapters = data.userWorldBloomChapterRankings || [];
                    const rawBorders = data.userWorldBloomChapterRankingBorders || [];
                    const chapterIds = new Set([
                        ...rawChapters.map((c: any) => String(c.gameCharacterId)),
                        ...rawBorders.map((c: any) => String(c.gameCharacterId))
                    ]);

                    chapterIds.forEach(id => {
                        const top = rawChapters.find((c: any) => String(c.gameCharacterId) === id)?.rankings || [];
                        const bdr = rawBorders.find((c: any) => String(c.gameCharacterId) === id)?.borderRankings || [];
                        const merged = transformRankingsData([...top, ...bdr]);
                        chapterMap[id] = Array.from(new Map(merged.map(r => [r.rank, r])).values()).sort((a,b) => a.rank - b.rank);
                    });
                }
            } else {
                const transformedMain = transformRankingsData(data.rankings || []);
                setRankings(transformedMain);
                setCachedPastRankings(transformedMain);

                if (data.chapters && Array.isArray(data.chapters)) {
                    data.chapters.forEach((ch: any) => {
                        chapterMap[String(ch.gameCharacterId)] = transformRankingsData(ch.rankings);
                    });
                }
            }

            setWorldLinkChapters(chapterMap);
        } catch (e) {
            setError(e instanceof Error ? e.message : '載入排名失敗');
        } finally {
            setIsLoading(false);
        }
    }, [setRankings, setWorldLinkChapters, setCachedLiveRankings, setCachedPastRankings, setIsLoading, setError, setEventName, setLiveEventId, setLastUpdated, setLiveEventTiming]);

    return {
        rankings, setRankings, worldLinkChapters, isLoading, error, eventName, liveEventId, liveEventTiming, lastUpdated,
        cachedLiveRankings, cachedPastRankings, fetchRankings, setEventName
    };
};
