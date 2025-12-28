import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { EventDetail, WorldLinkInfo } from '../types';
import { UNIT_MASTER, getChar } from '../constants';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

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
    const [eventDetails, setEventDetails] = useState<Record<number, EventDetail>>({});
    const [wlDetails, setWlDetails] = useState<Record<number, WorldLinkInfo>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchConfigs = async () => {
            try {
                const [eventRes, wlRes] = await Promise.all([
                    fetch('eventDetail.json'),
                    fetch('WorldLinkDetail.json')
                ]);
                
                if (!eventRes.ok || !wlRes.ok) throw new Error("無法讀取設定檔");
                
                const eventData = await eventRes.json();
                const wlData = await wlRes.json();
                
                setEventDetails(eventData);
                setWlDetails(wlData);
            } catch (err) {
                console.error("Config Load Error:", err);
                setError("無法載入活動或 World Link 設定檔。");
            } finally {
                setIsLoading(false);
            }
        };
        fetchConfigs();
    }, []);

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
        return Object.entries(wlDetails)
            .filter(([, info]) => info.round === round)
            .map(([id]) => Number(id))
            .sort((a, b) => a - b);
    };

    if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900"><LoadingSpinner /></div>;
    if (error) return <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-4"><ErrorMessage message={error} /></div>;

    return (
        <ConfigContext.Provider value={{ eventDetails, wlDetails, getEventColor, isWorldLink, getWlDetail, getWlIdsByRound, isLoading }}>
            {children}
        </ConfigContext.Provider>
    );
};

export const useConfig = (): ConfigContextType => {
    const context = useContext(ConfigContext);
    if (context === undefined) throw new Error('useConfig must be used within a ConfigProvider');
    return context;
};