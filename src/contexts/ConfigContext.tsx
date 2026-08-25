
import React, { createContext, useContext, ReactNode, useCallback, useMemo, useState, useEffect } from 'react';
import { EventDetail, WorldLinkInfo } from '../types';
import { UNIT_MASTER, API_BASE_URL } from '../config/constants';
import { getChar } from '../utils/gameUtils';
import { getWlRound } from '../utils/timeUtils';
import eventDataRaw from '../data/eventDetail.json';

const eventData = eventDataRaw as Record<string, EventDetail>;

export interface PrevRoundScore {
    top1: number;
    top10: number;
    top100: number;
    top200: number;
    top300: number;
    top400: number;
    top500: number;
    top1000: number;
}

interface ConfigContextType {
    eventDetails: Record<number, EventDetail>;
    wlDetails: Record<number, WorldLinkInfo>;
    getEventColor: (eventId: number) => string | undefined;
    isWorldLink: (eventId: number) => boolean;
    getWlDetail: (eventId: number) => WorldLinkInfo | undefined;
    getWlIdsByRound: (round: number) => number[];
    getPrevRoundWlChapterScore: (eventId: number, charId: string) => PrevRoundScore | null;
    isLoading: boolean;
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

export const ConfigProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [eventList, setEventList] = useState<any[]>([]);
    const [isEventsLoading, setIsEventsLoading] = useState(true);
    const [wlStats, setWlStats] = useState<any[]>([]);
    const [isStatsLoading, setIsStatsLoading] = useState(true);

    const eventDetails = useMemo(() => {
        const details: Record<number, EventDetail> = {};
        for (const key in eventData) {
            details[Number(key)] = eventData[key];
        }
        return details;
    }, []);

    useEffect(() => {
        fetch(`${API_BASE_URL}/event/list`)
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setEventList(data);
                setIsEventsLoading(false);
            })
            .catch(err => {
                console.error("ConfigContext: Failed to fetch event list", err);
                setIsEventsLoading(false);
            });
    }, []);

    const wlDetails = useMemo(() => {
        const details: Record<number, WorldLinkInfo> = {};
        eventList.forEach(event => {
            if (!event.chapters || !Array.isArray(event.chapters) || event.chapters.length === 0) return;

            // 1. 依 chapter 順序排列
            const sortedChapters = [...event.chapters].sort((a, b) => (a.chapter || 0) - (b.chapter || 0));
            const chorder = sortedChapters.map(c => String(c.character));
            const isfinal = sortedChapters.some(c => c.character === 0);
            const round = getWlRound(event.start_at);

            // 2. 計算平均章節天數 chDavg
            let chDavg = 3;
            if (sortedChapters.length === 1) {
                const ch = sortedChapters[0];
                const s = new Date(ch.start_at).getTime();
                const e = new Date(ch.aggregate_at || ch.closed_at).getTime();
                chDavg = Math.max(1, Math.round((e - s) / (1000 * 60 * 60 * 24)));
            } else if (sortedChapters.length > 1) {
                const intervals: number[] = [];
                for (let i = 0; i < sortedChapters.length - 1; i++) {
                    const s1 = new Date(sortedChapters[i].start_at).getTime();
                    const s2 = new Date(sortedChapters[i + 1].start_at).getTime();
                    intervals.push((s2 - s1) / (1000 * 60 * 60 * 24));
                }
                const avg = intervals.reduce((acc, v) => acc + v, 0) / intervals.length;
                chDavg = Math.max(1, Math.round(avg));
            }

            details[event.id] = {
                round,
                chorder,
                chDavg,
                isfinal,
                chapters: sortedChapters
            };
        });
        return details;
    }, [eventList]);

    const getEventColor = useCallback((eventId: number): string | undefined => {
        const details = eventDetails[eventId];
        if (!details) return undefined;
        const char = getChar(details.banner);
        if (char) return char.color;
        const unit = UNIT_MASTER[details.unit];
        if (unit) return unit.color;
        if (details.type === 'world_link') return '#33CCBB'; 
        return undefined;
    }, [eventDetails]);

    const isWorldLink = useCallback((eventId: number): boolean => {
        return !!wlDetails[eventId] || eventDetails[eventId]?.type === 'world_link';
    }, [eventDetails, wlDetails]);

    const getWlDetail = useCallback((eventId: number): WorldLinkInfo | undefined => {
        return wlDetails[eventId];
    }, [wlDetails]);

    const getWlIdsByRound = useCallback((round: number): number[] => {
        return (Object.entries(wlDetails) as [string, WorldLinkInfo][])
            .filter(([, info]) => info.round === round)
            .map(([id]) => Number(id))
            .sort((a, b) => a - b);
    }, [wlDetails]);

    useEffect(() => {
        fetch('/api/stats/border-stats')
            .then(res => res.json())
            .then(data => {
                const stats = data.wlStats || data.data?.wlStats || [];
                setWlStats(stats);
                setIsStatsLoading(false);
            })
            .catch(err => {
                console.error("Failed to fetch wlStats for ConfigContext", err);
                setIsStatsLoading(false);
            });
    }, []);

    const getPrevRoundWlChapterScore = useCallback((eventId: number, charId: string): PrevRoundScore | null => {
        const currentDetail = wlDetails[eventId];
        // D6: character: 0 (全體) 無跨輪同角色，直接回傳 null
        if (!currentDetail || !charId || charId === 'all' || charId === '0') return null;
        
        const round = currentDetail.round;
        let prevEventId = 0;
        
        if (round === 1) {
            // Time Travel Mock logic: pretend it's referencing itself for UI verification
            prevEventId = eventId;
        } else if (round > 1) {
            // Find an event ID from (round - 1) that has the same charId
            const prevIds = getWlIdsByRound(round - 1);
            prevEventId = prevIds.find(id => wlDetails[id]?.chorder.includes(charId)) || 0;
        }

        if (!prevEventId) return null;

        const stat = wlStats.find((s: any) => s.eventId === prevEventId && s.chapterCharId === Number(charId));
        if (!stat) return null;

        return {
            top1: stat.top1 || 0,
            top10: stat.top10 || 0,
            top100: stat.top100 || 0,
            top200: stat.borders?.['200'] || 0,
            top300: stat.borders?.['300'] || 0,
            top400: stat.borders?.['400'] || 0,
            top500: stat.borders?.['500'] || 0,
            top1000: stat.borders?.['1000'] || 0,
        };
    }, [wlDetails, wlStats, getWlIdsByRound]);

    const value = useMemo(() => ({
        eventDetails,
        wlDetails,
        getEventColor,
        isWorldLink,
        getWlDetail,
        getWlIdsByRound,
        getPrevRoundWlChapterScore,
        isLoading: isEventsLoading || isStatsLoading
    }), [eventDetails, wlDetails, getEventColor, isWorldLink, getWlDetail, getWlIdsByRound, getPrevRoundWlChapterScore, isEventsLoading, isStatsLoading]);

    return (
        <ConfigContext.Provider value={value}>
            {children}
        </ConfigContext.Provider>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useConfig = (): ConfigContextType => {
    const context = useContext(ConfigContext);
    if (context === undefined) throw new Error('useConfig must be used within a ConfigProvider');
    return context;
};
