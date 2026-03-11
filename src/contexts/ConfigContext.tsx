
import React, { createContext, useContext, ReactNode } from 'react';
import { EventDetail, WorldLinkInfo } from '../types';
import { UNIT_MASTER } from '../config/constants';
import { getChar } from '../utils/gameUtils';
import eventDataRaw from '../data/eventDetail.json';
import wlDataRaw from '../data/WorldLinkDetail.json';

const eventData = eventDataRaw as Record<string, EventDetail>;
const wlData = wlDataRaw as Record<string, WorldLinkInfo>;

interface ConfigContextType {
    eventDetails: Record<number, EventDetail>;
    wlDetails: Record<number, WorldLinkInfo>;
    getEventColor: (eventId: number) => string | undefined;
    isWorldLink: (eventId: number) => boolean;
    getWlDetail: (eventId: number) => WorldLinkInfo | undefined;
    getWlIdsByRound: (round: number) => number[];
    isLoading: boolean;
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

export const ConfigProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const eventDetails: Record<number, EventDetail> = {};
    for (const key in eventData) {
        eventDetails[Number(key)] = eventData[key];
    }

    const wlDetails: Record<number, WorldLinkInfo> = {};
    for (const key in wlData) {
        wlDetails[Number(key)] = wlData[key];
    }

    const getEventColor = (eventId: number): string | undefined => {
        const details = eventDetails[eventId];
        if (!details) return undefined;
        const char = getChar(details.banner);
        if (char) return char.color;
        const unit = UNIT_MASTER[details.unit];
        if (unit) return unit.color;
        if (details.type === 'world_link') return '#33CCBB'; 
        return undefined;
    };

    const isWorldLink = (eventId: number): boolean => {
        return !!wlDetails[eventId] || eventDetails[eventId]?.type === 'world_link';
    };

    const getWlDetail = (eventId: number): WorldLinkInfo | undefined => {
        return wlDetails[eventId];
    };

    const getWlIdsByRound = (round: number): number[] => {
        return (Object.entries(wlDetails) as [string, WorldLinkInfo][])
            .filter(([, info]) => info.round === round)
            .map(([id]) => Number(id))
            .sort((a, b) => a - b);
    };

    return (
        <ConfigContext.Provider value={{ eventDetails, wlDetails, getEventColor, isWorldLink, getWlDetail, getWlIdsByRound, isLoading: false }}>
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
