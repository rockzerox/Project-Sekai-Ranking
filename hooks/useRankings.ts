
import React, { useState, useCallback } from 'react';
import { RankEntry, HisekaiApiResponse, HisekaiBorderApiResponse, PastEventApiResponse, PastEventBorderApiResponse } from '../types';
import { API_BASE_URL } from '../constants';

const API_URL = `${API_BASE_URL}/event/live/top100`;
const BORDER_API_URL = `${API_BASE_URL}/event/live/border`;
const BIGINT_REGEX = /"(\w*Id|id)"\s*:\s*(\d{15,})/g;

export const fetchJsonWithBigInt = async (url: string, signal?: AbortSignal) => {
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
        return JSON.parse(sanitized);
    } catch (e) {
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

    const transformRankings = (data: any[]): RankEntry[] => {
        const zeroStat = { count: 0, score: 0, speed: 0, average: 0 };
        return data.map(item => {
            const stats = item.last_1h_stats ? {
                last1h: { count: item.last_1h_stats?.count ?? 0, score: item.last_1h_stats?.score ?? 0, speed: item.last_1h_stats?.speed ?? 0, average: item.last_1h_stats?.average ?? 0 },
                last3h: { count: item.last_3h_stats?.count ?? 0, score: item.last_3h_stats?.score ?? 0, speed: item.last_3h_stats?.speed ?? 0, average: item.last_3h_stats?.average ?? 0 },
                last24h: { count: item.last_24h_stats?.count ?? 0, score: item.last_24h_stats?.score ?? 0, speed: item.last_24h_stats?.speed ?? 0, average: item.last_24h_stats?.average ?? 0 }
            } : { last1h: zeroStat, last3h: zeroStat, last24h: zeroStat };
            
            let userId = item.userId ? String(item.userId) : (item.last_player_info?.profile?.id ? String(item.last_player_info.profile.id) : "");
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
                } 
            };
        });
    };

    const fetchLiveRankings = useCallback(async () => {
        setIsLoading(true); setError(null);
        try {
            const responseData: HisekaiApiResponse = await fetchJsonWithBigInt(API_URL);
            if (responseData && Array.isArray(responseData.top_100_player_rankings)) {
                const transformed = transformRankings(responseData.top_100_player_rankings);
                setRankings(transformed); setCachedLiveRankings(transformed); setEventName(responseData.name);
                if (responseData.id) setLiveEventId(responseData.id);
                if (responseData.start_at && responseData.aggregate_at && responseData.ranking_announce_at) {
                    setLiveEventTiming({ startAt: responseData.start_at, aggregateAt: responseData.aggregate_at, rankingAnnounceAt: responseData.ranking_announce_at });
                }
                setLastUpdated(new Date());
            } else throw new Error('無法取得即時活動數據。');
        } catch (e) { setError(e instanceof Error ? e.message : '取得排名失敗'); } finally { setIsLoading(false); }
    }, []);

    const fetchBorderRankings = useCallback(async () => {
        setIsLoading(true); setError(null);
        try {
            const responseData: HisekaiBorderApiResponse = await fetchJsonWithBigInt(BORDER_API_URL);
            if (responseData && Array.isArray(responseData.border_player_rankings)) {
                setRankings(transformRankings(responseData.border_player_rankings));
            }
        } catch (e) { setError(e instanceof Error ? e.message : '取得精彩片段失敗'); } finally { setIsLoading(false); }
    }, []);

    const fetchPastRankings = useCallback(async (eventId: number) => {
        setIsLoading(true); setError(null); setRankings([]); setWorldLinkChapters({});
        try {
            const responseData: PastEventApiResponse = await fetchJsonWithBigInt(`${API_BASE_URL}/event/${eventId}/top100`);
            if (responseData && Array.isArray(responseData.rankings)) {
                const transformed = transformRankings(responseData.rankings);
                setRankings(transformed); setCachedPastRankings(transformed);
                if (responseData.userWorldBloomChapterRankings) {
                    const chapterMap: Record<string, RankEntry[]> = {};
                    responseData.userWorldBloomChapterRankings.forEach(chapter => {
                        chapterMap[String(chapter.gameCharacterId)] = transformRankings(chapter.rankings);
                    });
                    setWorldLinkChapters(chapterMap);
                }
            } else throw new Error('無法讀取過往活動數據。');
        } catch (e) { setError(e instanceof Error ? e.message : '讀取過往活動失敗'); } finally { setIsLoading(false); }
    }, []);

    const fetchPastBorderRankings = useCallback(async (eventId: number) => {
        setIsLoading(true); setError(null); setWorldLinkChapters({});
        try {
            const responseData: PastEventBorderApiResponse = await fetchJsonWithBigInt(`${API_BASE_URL}/event/${eventId}/border`);
            if (responseData && Array.isArray(responseData.borderRankings)) {
                setRankings(transformRankings(responseData.borderRankings));
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

    return {
        rankings, setRankings, worldLinkChapters, isLoading, error, eventName, liveEventId, liveEventTiming, lastUpdated,
        cachedLiveRankings, cachedPastRankings, fetchLiveRankings, fetchBorderRankings, fetchPastRankings, fetchPastBorderRankings, setEventName
    };
};
