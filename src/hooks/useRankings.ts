
import React, { useState, useCallback } from 'react';
import { RankEntry, RankingEntry, HisekaiApiResponse, HisekaiBorderApiResponse, PastEventApiResponse, PastEventBorderApiResponse } from '../types';
import { API_BASE_URL } from '../config/constants';
import { transformUserCardToPlayerInfo } from '../utils/transform';
import { supabase } from '../lib/supabase';

const API_URL = `${API_BASE_URL}/event/live/top100`;
const BORDER_API_URL = `${API_BASE_URL}/event/live/border`;
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
        
        // 檢查是否為 API Routes 的統一包裝格式 { source, data }
        if (parsed && typeof parsed === 'object' && 'source' in parsed && 'data' in parsed) {
            return parsed.data as T;
        }
        
        // 舊格式直接回傳
        return parsed as T;
    } catch (e) {
        console.error("JSON parse error on URL:", url);
        console.error("Response text preview:", text.substring(0, 200));
        console.error("Sanitized text preview:", sanitized.substring(0, 200));
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
    fetchLiveRankings: () => Promise<void>;
    fetchBorderRankings: () => Promise<void>;
    fetchPastRankings: (eventId: number) => Promise<void>;
    fetchPastBorderRankings: (eventId: number) => Promise<void>;
    setEventName: (name: string) => void;
}

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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const transformRankings = (data: Record<string, any>[]): RankEntry[] => {
        const zeroStat = { count: 0, score: 0, speed: 0, average: 0 };
        return data.map(item => {
            const stats = item.last_1h_stats ? {
                last1h: { count: item.last_1h_stats?.count ?? 0, score: item.last_1h_stats?.score ?? 0, speed: item.last_1h_stats?.speed ?? 0, average: item.last_1h_stats?.average ?? 0 },
                last3h: { count: item.last_3h_stats?.count ?? 0, score: item.last_3h_stats?.score ?? 0, speed: item.last_3h_stats?.speed ?? 0, average: item.last_3h_stats?.average ?? 0 },
                last24h: { count: item.last_24h_stats?.count ?? 0, score: item.last_24h_stats?.score ?? 0, speed: item.last_24h_stats?.speed ?? 0, average: item.last_24h_stats?.average ?? 0 }
            } : { last1h: zeroStat, last3h: zeroStat, last24h: zeroStat };
            
            let lastPlayerInfo = item.last_player_info;
            if (!lastPlayerInfo && item.userCard) {
                lastPlayerInfo = transformUserCardToPlayerInfo(item as unknown as RankingEntry);
            }

            const userId = item.userId ? String(item.userId) : (lastPlayerInfo?.profile?.id ? String(lastPlayerInfo.profile.id) : "");
            const name = item.name || item.display_name || "Unknown";
            
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

    const fetchLiveRankings = useCallback(async () => {
        setIsLoading(true); setError(null); setWorldLinkChapters({});
        try {
            const responseData: HisekaiApiResponse = await fetchJsonWithBigInt(API_URL);
            if (responseData && Array.isArray(responseData.top_100_player_rankings)) {
                const transformed = transformRankings(responseData.top_100_player_rankings);
                setRankings(transformed); setCachedLiveRankings(transformed); setEventName(responseData.name);
                if (responseData.id) setLiveEventId(responseData.id);
                if (responseData.start_at && responseData.aggregate_at && responseData.ranking_announce_at) {
                    setLiveEventTiming({ startAt: responseData.start_at, aggregateAt: responseData.aggregate_at, rankingAnnounceAt: responseData.ranking_announce_at });
                }
                if (responseData.userWorldBloomChapterRankings) {
                    const chapterMap: Record<string, RankEntry[]> = {};
                    responseData.userWorldBloomChapterRankings.forEach(chapter => {
                        chapterMap[String(chapter.gameCharacterId)] = transformRankings(chapter.rankings);
                    });
                    setWorldLinkChapters(chapterMap);
                }
                setLastUpdated(new Date());
            } else throw new Error('無法取得即時活動數據。');
        } catch (e) { setError(e instanceof Error ? e.message : '取得排名失敗'); } finally { setIsLoading(false); }
    }, []);

    const fetchBorderRankings = useCallback(async () => {
        setIsLoading(true); setError(null); setWorldLinkChapters({});
        try {
            const responseData: HisekaiBorderApiResponse = await fetchJsonWithBigInt(BORDER_API_URL);
            if (responseData && Array.isArray(responseData.border_player_rankings)) {
                setRankings(transformRankings(responseData.border_player_rankings));
                if (responseData.userWorldBloomChapterRankingBorders) {
                    const chapterMap: Record<string, RankEntry[]> = {};
                    responseData.userWorldBloomChapterRankingBorders.forEach(chapter => {
                        chapterMap[String(chapter.gameCharacterId)] = transformRankings(chapter.borderRankings);
                    });
                    setWorldLinkChapters(chapterMap);
                }
            }
        } catch (e) { setError(e instanceof Error ? e.message : '取得精彩片段失敗'); } finally { setIsLoading(false); }
    }, []);

    const fetchPastRankings = useCallback(async (eventId: number) => {
        setIsLoading(true); setError(null); setRankings([]); setWorldLinkChapters({});
        try {
            const url = `${API_BASE_URL}/event/${eventId}/top100`;
            const responseData: PastEventApiResponse = await fetchJsonWithBigInt(url);
            
            // 支援新 API 格式 (rankings) 與舊 API 格式 (top_100_player_rankings)
            const rawRankings = responseData.rankings || responseData.top_100_player_rankings;

            if (rawRankings && Array.isArray(rawRankings)) {
                const transformedMain = transformRankings(rawRankings);
                setRankings(transformedMain); 
                setCachedPastRankings(transformedMain);

                if (responseData.userWorldBloomChapterRankings && responseData.userWorldBloomChapterRankings.length > 0) {
                    const finalChapterMap: Record<string, RankEntry[]> = {};
                    responseData.userWorldBloomChapterRankings.forEach(chapter => {
                        finalChapterMap[String(chapter.gameCharacterId)] = transformRankings(chapter.rankings);
                    });
                    setWorldLinkChapters(finalChapterMap);
                }
            } else {
                throw new Error('無法讀取過往活動數據。');
            }
        } catch (e) { setError(e instanceof Error ? e.message : '讀取過往活動失敗'); } finally { setIsLoading(false); }
    }, []);

    const fetchPastBorderRankings = useCallback(async (eventId: number) => {
        setIsLoading(true); setError(null); setWorldLinkChapters({});
        try {
            const url = `${API_BASE_URL}/event/${eventId}/border`;
            const responseData: PastEventBorderApiResponse = await fetchJsonWithBigInt(url);

            if (responseData && Array.isArray(responseData.border_player_rankings)) {
                setRankings(transformRankings(responseData.border_player_rankings));

                if (responseData.userWorldBloomChapterRankingBorders && responseData.userWorldBloomChapterRankingBorders.length > 0) {
                    const finalChapterMap: Record<string, RankEntry[]> = {};
                    responseData.userWorldBloomChapterRankingBorders.forEach(chapter => {
                        finalChapterMap[String(chapter.gameCharacterId)] = transformRankings(chapter.borderRankings);
                    });
                    setWorldLinkChapters(finalChapterMap);
                }
            }
        } catch (e) { setError(e instanceof Error ? e.message : '取得精彩片段失敗'); } finally { setIsLoading(false); }
    }, []);

    return {
        rankings, setRankings, worldLinkChapters, isLoading, error, eventName, liveEventId, liveEventTiming, lastUpdated,
        cachedLiveRankings, cachedPastRankings, fetchLiveRankings, fetchBorderRankings, fetchPastRankings, fetchPastBorderRankings, setEventName
    };
};
