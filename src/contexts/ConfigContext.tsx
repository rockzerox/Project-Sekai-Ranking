
import React, { createContext, useContext, ReactNode, useCallback, useMemo, useState, useEffect } from 'react';
import { EventDetail, WorldLinkInfo } from '../types';
import { UNIT_MASTER } from '../config/constants';
import { getChar } from '../utils/gameUtils';
import eventDataRaw from '../data/eventDetail.json';
import wlDataRaw from '../data/WorldLinkDetail.json';

const eventData = eventDataRaw as Record<string, EventDetail>;
const wlData = wlDataRaw as Record<string, WorldLinkInfo>;

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
    const eventDetails = useMemo(() => {
        const details: Record<number, EventDetail> = {};
        for (const key in eventData) {
            details[Number(key)] = eventData[key];
        }
        return details;
    }, []);

    const wlDetails = useMemo(() => {
        const details: Record<number, WorldLinkInfo> = {};
        for (const key in wlData) {
            details[Number(key)] = wlData[key];
        }
        return details;
    }, []);

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

    const [wlStats, setWlStats] = useState<any[]>([]);

    useEffect(() => {
        fetch('/api/stats/border-stats')
            .then(res => res.json())
            .then(data => {
                const stats = data.wlStats || data.data?.wlStats || [];
                setWlStats(stats);
            })
            .catch(err => console.error("Failed to fetch wlStats for ConfigContext", err));
    }, []);

    const getPrevRoundWlChapterScore = useCallback((eventId: number, charId: string): PrevRoundScore | null => {
        const currentDetail = wlDetails[eventId];
        if (!currentDetail || !charId || charId === 'all') return null;
        
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

        const stat = wlStats.find((s: any) => s.eventId === prevEventId);
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
        isLoading: false
    }), [eventDetails, wlDetails, getEventColor, isWorldLink, getWlDetail, getWlIdsByRound, getPrevRoundWlChapterScore]);

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
