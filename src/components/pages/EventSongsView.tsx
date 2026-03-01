import React, { useState, useMemo } from 'react';
import { EventSummary } from '../../types';
import { useConfig } from '../../contexts/ConfigContext';
import { UI_TEXT } from '../../config/uiText';
import songDataRaw from '../../data/song.json';
import EventFilterGroup, { EventFilterState } from '../ui/EventFilterGroup';
import SongCarousel from '../ui/SongCarousel';
import { ArrowUpDown } from 'lucide-react';

interface SongData {
    eventId: number;
    title: string;
    lyricist: string;
    composer: string;
    arranger: string;
    mv2d: string | null;
    mv3d: string | null;
}

const songData = songDataRaw as Record<string, SongData>;

interface EventSongsViewProps {
    allEvents: EventSummary[];
}

const EventSongsView: React.FC<EventSongsViewProps> = ({ allEvents }) => {
    const { eventDetails } = useConfig();
    
    const [filters, setFilters] = useState<EventFilterState>({
        unit: 'all',
        banner: 'all',
        type: 'all',
        storyType: 'all',
        cardType: 'all',
        fourStar: 'all',
        theme: 'all'
    });

    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc'); // Default to oldest first for carousel

    const t = UI_TEXT.eventSongs;

    const mergedData = useMemo(() => {
        const data = Object.entries(songData).map(([songId, song]) => {
            const eventInfo = allEvents.find(e => e.id === song.eventId);
            const detail = eventDetails[song.eventId];
            return {
                ...song,
                songId,
                eventName: eventInfo?.name || `第 ${song.eventId} 期活動`,
                unit: detail?.unit || '99',
                banner: detail?.banner || '-',
            };
        });
        return data.sort((a, b) => sortOrder === 'asc' ? a.eventId - b.eventId : b.eventId - a.eventId);
    }, [allEvents, eventDetails, sortOrder]);

    const filteredData = useMemo(() => {
        return mergedData.filter(item => {
            if (filters.unit !== 'all' && item.unit !== filters.unit) return false;
            if (filters.banner !== 'all' && item.banner !== filters.banner) return false;
            return true;
        });
    }, [mergedData, filters]);

    return (
        <div className="animate-fadeIn w-full max-w-[1400px] mx-auto">
            <div className="mb-6">
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">{t.title}</h2>
                <p className="text-slate-500 dark:text-slate-400">{t.description}</p>
            </div>

            {/* Filters & Controls */}
            <div className="mb-8 flex flex-wrap gap-4 items-center justify-between">
                <EventFilterGroup 
                    filters={filters} 
                    onFilterChange={(newFilters) => setFilters(newFilters)}
                    showUnit={true}
                    showBanner={true}
                    showEventType={false}
                    showStoryType={false}
                    showCardType={false}
                    showFourStar={false}
                    showTheme={false}
                    mode="multi"
                    containerClassName="flex flex-wrap gap-3 items-center"
                    itemClassName="w-auto"
                />
                
                <button 
                    onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                    className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm whitespace-nowrap ml-auto sm:ml-0"
                >
                    <ArrowUpDown className="w-4 h-4" />
                    {sortOrder === 'asc' ? '活動順序 (舊→新)' : '活動順序 (新→舊)'}
                </button>
            </div>

            {/* Carousel */}
            <div className="w-full">
                <SongCarousel songs={filteredData} />
            </div>
            
            <div className="mt-8 text-center text-slate-400 text-sm">
                共 {filteredData.length} 首曲目
            </div>
        </div>
    );
};

export default EventSongsView;
