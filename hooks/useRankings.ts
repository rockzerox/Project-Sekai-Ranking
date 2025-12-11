
import React, { useState, useCallback } from 'react';
import { RankEntry, HisekaiApiResponse, HisekaiBorderApiResponse, PastEventApiResponse, PastEventBorderApiResponse } from '../types';

const API_URL = 'https://api.hisekai.org/event/live/top100';
const BORDER_API_URL = 'https://api.hisekai.org/event/live/border';
const BIGINT_REGEX = /"(\w*Id|id)"\s*:\s*(\d{15,})/g;

interface UseRankingsReturn {
    rankings: RankEntry[];
    setRankings: React.Dispatch<React.SetStateAction<RankEntry[]>>;
    isLoading: boolean;
    error: string | null;
    eventName: string;
    liveEventId: number | null;
    liveEventTiming: { aggregateAt: string, rankingAnnounceAt: string } | null;
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
    
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    
    const [eventName, setEventName] = useState('Hisekai Live TW Rankings');
    const [liveEventId, setLiveEventId] = useState<number | null>(null);
    const [liveEventTiming, setLiveEventTiming] = useState<{ aggregateAt: string, rankingAnnounceAt: string } | null>(null);

    const transformRankings = (data: any[], isBorder: boolean = false): RankEntry[] => {
        const zeroStat = { count: 0, score: 0, speed: 0, average: 0 };
        
        return data.map(item => {
            // Determine structure based on Live vs Past and Border vs Top100
            // Live Top 100 has nested stats. Past/Border usually simpler.
            
            const stats = item.last_1h_stats ? {
                last1h: {
                    count: item.last_1h_stats?.count ?? 0,
                    score: item.last_1h_stats?.score ?? 0,
                    speed: item.last_1h_stats?.speed ?? 0,
                    average: item.last_1h_stats?.average ?? 0,
                },
                last3h: {
                    count: item.last_3h_stats?.count ?? 0,
                    score: item.last_3h_stats?.score ?? 0,
                    speed: item.last_3h_stats?.speed ?? 0,
                    average: item.last_3h_stats?.average ?? 0,
                },
                last24h: {
                    count: item.last_24h_stats?.count ?? 0,
                    score: item.last_24h_stats?.score ?? 0,
                    speed: item.last_24h_stats?.speed ?? 0,
                    average: item.last_24h_stats?.average ?? 0,
                },
            } : { last1h: zeroStat, last3h: zeroStat, last24h: zeroStat };

            // Handle ID location (Live structure vs Past structure)
            // Live: item.last_player_info.profile.id
            // Past: item.userId
            // Border: item.last_player_info?.profile?.id OR item.userId
            
            let userId = "";
            if (item.last_player_info?.profile?.id) userId = String(item.last_player_info.profile.id);
            else if (item.userId) userId = String(item.userId);

            return {
                rank: item.rank,
                score: item.score,
                lastPlayedAt: item.last_played_at || '',
                stats: stats,
                user: {
                    id: userId,
                    username: item.name,
                    display_name: item.name,
                    avatar: '',
                    supporter_tier: 0,
                }
            };
        });
    };

    const fetchLiveRankings = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch(API_URL);
            if (!response.ok) throw new Error(`API request failed with status: ${response.status}`);

            const textData = await response.text();
            const sanitizedData = textData.replace(BIGINT_REGEX, '"$1": "$2"');
            const responseData: HisekaiApiResponse = JSON.parse(sanitizedData);

            if (responseData && Array.isArray(responseData.top_100_player_rankings)) {
                const transformed = transformRankings(responseData.top_100_player_rankings);
                
                setRankings(transformed);
                setCachedLiveRankings(transformed);
                setEventName(responseData.name);
                if (responseData.id) setLiveEventId(responseData.id);
                if (responseData.aggregate_at && responseData.ranking_announce_at) {
                    setLiveEventTiming({
                        aggregateAt: responseData.aggregate_at,
                        rankingAnnounceAt: responseData.ranking_announce_at
                    });
                }
                setLastUpdated(new Date());
            } else {
                throw new Error('Unexpected API response format.');
            }
        } catch (e) {
            setError(e instanceof Error ? `取得排名失敗: ${e.message}` : '發生未知錯誤');
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const fetchBorderRankings = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch(BORDER_API_URL);
            if (!response.ok) throw new Error(`API request failed with status: ${response.status}`);

            const textData = await response.text();
            const sanitizedData = textData.replace(BIGINT_REGEX, '"$1": "$2"');
            const responseData: HisekaiBorderApiResponse = JSON.parse(sanitizedData);

            if (responseData && Array.isArray(responseData.border_player_rankings)) {
                const transformed = transformRankings(responseData.border_player_rankings, true);
                setRankings(transformed);
            }
        } catch (e) {
            setError(e instanceof Error ? `取得精彩片段失敗: ${e.message}` : '發生未知錯誤');
        } finally {
            setIsLoading(false);
        }
    }, []);

    const fetchPastRankings = useCallback(async (eventId: number) => {
        setIsLoading(true);
        setError(null);
        setRankings([]); 
        
        try {
            const response = await fetch(`https://api.hisekai.org/event/${eventId}/top100`);
            if (!response.ok) throw new Error('Failed to fetch past event rankings');

            const textData = await response.text();
            const sanitizedData = textData.replace(BIGINT_REGEX, '"$1": "$2"');
            const responseData: PastEventApiResponse = JSON.parse(sanitizedData);

            if (responseData && Array.isArray(responseData.rankings)) {
                const transformed = transformRankings(responseData.rankings, false);
                setRankings(transformed);
                setCachedPastRankings(transformed);
                setLastUpdated(null);
            } else {
                throw new Error('Unexpected API response format.');
            }
        } catch (e) {
            setError(e instanceof Error ? `讀取活動失敗: ${e.message}` : '發生未知錯誤');
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const fetchPastBorderRankings = useCallback(async (eventId: number) => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch(`https://api.hisekai.org/event/${eventId}/border`);
            if (!response.ok) throw new Error('Failed to fetch past event highlights');

            const textData = await response.text();
            const sanitizedData = textData.replace(BIGINT_REGEX, '"$1": "$2"');
            const responseData: PastEventBorderApiResponse = JSON.parse(sanitizedData);

            if (responseData && Array.isArray(responseData.borderRankings)) {
                const transformed = transformRankings(responseData.borderRankings, true);
                setRankings(transformed);
            }
        } catch (e) {
            setError(e instanceof Error ? `取得精彩片段失敗: ${e.message}` : '發生未知錯誤');
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    }, []);

    return {
        rankings,
        setRankings,
        isLoading,
        error,
        eventName,
        liveEventId,
        liveEventTiming,
        lastUpdated,
        cachedLiveRankings,
        cachedPastRankings,
        fetchLiveRankings,
        fetchBorderRankings,
        fetchPastRankings,
        fetchPastBorderRankings,
        setEventName
    };
};
