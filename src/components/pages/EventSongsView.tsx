import React, { useState, useMemo } from 'react';
import { EventSummary } from '../../types';
import { useConfig } from '../../contexts/ConfigContext';
import { UNIT_MASTER, UNIT_ORDER } from '../../config/constants';
import { UI_TEXT } from '../../config/uiText';
import songDataRaw from '../../data/song.json';
import Pagination from '../ui/Pagination';
import { getAssetUrl, getChar } from '../../utils/gameUtils';
import EventFilterGroup, { EventFilterState } from '../ui/EventFilterGroup';

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

const ITEMS_PER_PAGE = 20;

const EventSongsView: React.FC<EventSongsViewProps> = ({ allEvents }) => {
    const { eventDetails } = useConfig();
    const [currentPage, setCurrentPage] = useState<number | 'highlights'>(1);
    
    const [filters, setFilters] = useState<EventFilterState>({
        unit: 'all',
        banner: 'all',
        type: 'all',
        storyType: 'all',
        cardType: 'all',
        fourStar: 'all'
    });

    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

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

    const paginatedData = useMemo(() => {
        const pageNum = typeof currentPage === 'number' ? currentPage : 1;
        return filteredData.slice((pageNum - 1) * ITEMS_PER_PAGE, pageNum * ITEMS_PER_PAGE);
    }, [filteredData, currentPage]);

    const renderMVLink = (url: string | null) => {
        if (!url) return <span className="text-slate-400 dark:text-slate-600">{t.table.none}</span>;
        return (
            <a 
                href={url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center p-1.5 bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500 hover:text-white rounded transition-colors"
                title={t.table.watch}
            >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
                </svg>
            </a>
        );
    };

    return (
        <div className="animate-fadeIn">
            <div className="mb-6">
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">{t.title}</h2>
                <p className="text-slate-500 dark:text-slate-400">{t.description}</p>
            </div>

            {/* Filters */}
            <div className="mb-6">
                <EventFilterGroup 
                    filters={filters} 
                    onFilterChange={(newFilters) => {
                        setFilters(newFilters);
                        setCurrentPage(1);
                    }}
                    showUnit={true}
                    showBanner={true}
                    showEventType={false}
                    showStoryType={false}
                    showCardType={false}
                    showFourStar={false}
                    mode="multi"
                    containerClassName="flex flex-wrap gap-3 items-center"
                    itemClassName="w-full sm:w-auto"
                />
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-200 dark:border-slate-700 text-sm bg-slate-50 dark:bg-slate-800/80">
                                <th className="p-3 font-bold text-slate-700 dark:text-slate-200 whitespace-nowrap">
                                    <div className="flex items-center gap-1 cursor-pointer select-none" onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}>
                                        {t.table.eventId}
                                        <div className="flex flex-col">
                                            <svg className={`w-3 h-3 ${sortOrder === 'asc' ? 'text-slate-800 dark:text-slate-200' : 'text-slate-400 dark:text-slate-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
                                            <svg className={`w-3 h-3 -mt-1 ${sortOrder === 'desc' ? 'text-slate-800 dark:text-slate-200' : 'text-slate-400 dark:text-slate-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                        </div>
                                    </div>
                                </th>
                                <th className="p-3 font-bold text-slate-700 dark:text-slate-200 whitespace-nowrap">{t.table.eventName}</th>
                                <th className="p-3 font-bold text-slate-700 dark:text-slate-200 whitespace-nowrap">{t.table.unit}</th>
                                <th className="p-3 font-bold text-slate-700 dark:text-slate-200 whitespace-nowrap">{t.table.banner}</th>
                                <th className="p-3 font-bold text-slate-700 dark:text-slate-200 whitespace-nowrap">{t.table.songName}</th>
                                <th className="p-3 font-bold text-slate-700 dark:text-slate-200 whitespace-nowrap">{t.table.lyricist}</th>
                                <th className="p-3 font-bold text-slate-700 dark:text-slate-200 whitespace-nowrap">{t.table.composer}</th>
                                <th className="p-3 font-bold text-slate-700 dark:text-slate-200 whitespace-nowrap">{t.table.arranger}</th>
                                <th className="p-3 font-bold text-slate-700 dark:text-slate-200 whitespace-nowrap text-center">{t.table.mv2d}</th>
                                <th className="p-3 font-bold text-slate-700 dark:text-slate-200 whitespace-nowrap text-center">{t.table.mv3d}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedData.length > 0 ? (
                                paginatedData.map((item) => {
                                    const unitLabel = UNIT_MASTER[item.unit]?.name || "Unknown";
                                    const unitLogo = getAssetUrl(item.unit, 'unit');
                                    const bannerChar = getChar(item.banner);
                                    const bannerImg = (item.banner !== '-') ? getAssetUrl(item.banner, 'character') : null;

                                    return (
                                        <tr key={item.eventId} className="border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors text-sm">
                                            <td className="p-3 font-mono text-slate-500 dark:text-slate-400">{item.eventId}</td>
                                            <td className="p-3">
                                                <div className="flex flex-col items-start gap-2">
                                                    <span className="font-bold max-w-[200px] truncate" title={item.eventName}>{item.eventName}</span>
                                                    <img src={getAssetUrl(item.eventId.toString(), 'event')} alt="Event Logo" className="w-auto h-12 object-contain rounded" onError={(e) => e.currentTarget.style.display = 'none'} />
                                                </div>
                                            </td>
                                            <td className="p-3">
                                                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700" title={unitLabel}>
                                                    {unitLogo ? (
                                                        <img src={unitLogo} alt={unitLabel} className="w-5 h-5 object-contain" />
                                                    ) : (
                                                        <span className="text-xs font-bold text-slate-400">?</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-3">
                                                {item.banner !== '-' ? (
                                                    <div className="flex items-center justify-center" title={bannerChar?.name}>
                                                        {bannerImg ? (
                                                            <img src={bannerImg} alt={bannerChar?.name} className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 object-cover shadow-sm" />
                                                        ) : (
                                                            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-400">
                                                                {item.banner}
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-400 dark:text-slate-600">-</span>
                                                )}
                                            </td>
                                            <td className="p-3">
                                                <div className="flex flex-col gap-2">
                                                    <span className="font-bold text-slate-800 dark:text-slate-200 max-w-[200px] truncate" title={item.title}>{item.title}</span>
                                                    <img src={`https://raw.githubusercontent.com/rockzerox/Storage/refs/heads/main/Project-Sekai-Ranking/songs/${item.songId.padStart(3, '0')}.webp`} alt="Song Cover" className="w-16 h-16 object-cover rounded shadow-sm" onError={(e) => e.currentTarget.style.display = 'none'} />
                                                </div>
                                            </td>
                                            <td className="p-3 text-slate-600 dark:text-slate-400 max-w-[150px] truncate" title={item.lyricist}>{item.lyricist}</td>
                                            <td className="p-3 text-slate-600 dark:text-slate-400 max-w-[150px] truncate" title={item.composer}>{item.composer}</td>
                                            <td className="p-3 text-slate-600 dark:text-slate-400 max-w-[150px] truncate" title={item.arranger}>{item.arranger}</td>
                                            <td className="p-3 text-center">{renderMVLink(item.mv2d)}</td>
                                            <td className="p-3 text-center">{renderMVLink(item.mv3d)}</td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={10} className="p-8 text-center text-slate-500 dark:text-slate-400">
                                        {t.noData}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                {filteredData.length > 0 && (
                    <div className="p-4 border-t border-slate-200 dark:border-slate-700">
                        <Pagination 
                            totalItems={filteredData.length} 
                            itemsPerPage={ITEMS_PER_PAGE} 
                            currentPage={currentPage} 
                            onPageChange={setCurrentPage}
                            hideHighlights={true}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default EventSongsView;
