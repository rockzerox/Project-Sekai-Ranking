
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { EventDetail } from '../types';
import { CHARACTER_MASTER, UNIT_MASTER, getChar } from '../constants';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

interface ConfigContextType {
    eventDetails: Record<number, EventDetail>;
    getEventColor: (eventId: number) => string | undefined;
    isLoading: boolean;
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

export const ConfigProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [eventDetails, setEventDetails] = useState<Record<number, EventDetail>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const response = await fetch('/eventDetail.json');
                if (!response.ok) throw new Error(`Failed to load: ${response.statusText}`);
                const data = await response.json();
                setEventDetails(data);
            } catch (err) {
                console.error("Config Load Error:", err);
                setError("無法載入活動設定檔。");
            } finally {
                setIsLoading(false);
            }
        };
        fetchConfig();
    }, []);

    const getEventColor = (eventId: number): string | undefined => {
        const details = eventDetails[eventId];
        if (!details) return undefined;

        // 1. Banner Character Color (Handles both ID and Name)
        const char = getChar(details.banner);
        if (char) return char.color;

        // 2. Unit Color
        const unit = UNIT_MASTER[details.unit];
        if (unit) return unit.color;
        
        // 3. World Link Fallback
        if (details.type === 'world_link') return '#33CCBB'; 
        
        return undefined;
    };

    if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900"><LoadingSpinner /></div>;
    if (error) return <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-4"><ErrorMessage message={error} /></div>;

    return (
        <ConfigContext.Provider value={{ eventDetails, getEventColor, isLoading }}>
            {children}
        </ConfigContext.Provider>
    );
};

export const useConfig = (): ConfigContextType => {
    const context = useContext(ConfigContext);
    if (context === undefined) throw new Error('useConfig must be used within a ConfigProvider');
    return context;
};
