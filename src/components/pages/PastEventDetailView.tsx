import React, { useState, useEffect, useMemo } from 'react';
import { useRankings } from '../../hooks/useRankings';
import { useConfig } from '../../contexts/ConfigContext';
import { SortOption, EventSummary } from '../../types';
import { getAssetUrl, getChar } from '../../utils/gameUtils';
import { calculatePreciseDuration } from '../../utils/timeUtils';
import { calculateCV } from '../../utils/mathUtils';
import { UNIT_MASTER, CHARACTERS } from '../../config/constants';
import LoadingSpinner from '../ui/LoadingSpinner';
import ErrorMessage from '../ui/ErrorMessage';
import StatsDisplay from '../shared/StatsDisplay';
import CollapsibleSection from '../ui/CollapsibleSection';
import ChartAnalysis from '../charts/ChartAnalysis';
import Pagination from '../ui/Pagination';
import SortSelector from '../ui/SortSelector';
import RankingList from '../shared/RankingList';
import { useCardData } from '../../services/cardService';

const ITEMS_PER_PAGE = 20;

interface PastEventDetailViewProps {
    event: { id: number, name: string };
    onBack: () => void;
    allEvents: EventSummary[];
}

const PastEventDetailView: React.FC<PastEventDetailViewProps> = ({ event, onBack, allEvents }) => {
    const {
        rankings, setRankings, worldLinkChapters, isLoading, error,
        cachedPastRankings, fetchPastRankings, fetchPastBorderRankings, setEventName
    } = useRankings();

    const { eventDetails, getEventColor, isWorldLink, getWlDetail } = useConfig();
    const { cards } = useCardData();
    
    const [activeChapter, setActiveChapter] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [sortOption, setSortOption] = useState<SortOption>('score');
    const [isRankingsOpen, setIsRankingsOpen] = useState(true);
    const [isChartsOpen, setIsChartsOpen] = useState(true);
    const [currentPage, setCurrentPage] = useState<number | 'highlights'>(1);

    // Initial fetch
    useEffect(() => {
        fetchPastRankings(event.id);
        setEventName(event.name);
        setCurrentPage(1);
        setActiveChapter('all');
    }, [event, fetchPastRankings, setEventName]);

    // Handle World Link chapter changes or cache updates
    useEffect(() => {
        if (currentPage === 'highlights') return;

        if (activeChapter === 'all') {
            if (cachedPastRankings.length > 0) setRankings(cachedPastRankings);
        } else {
            if (worldLinkChapters[activeChapter]) setRankings(worldLinkChapters[activeChapter]);
            else setRankings([]);
        }
    }, [activeChapter, worldLinkChapters, cachedPastRankings, setRankings, currentPage]);

    // Reset page on search/sort change
    useEffect(() => { 
        if (currentPage !== 'highlights') setCurrentPage(1); 
    }, [searchTerm, sortOption]);

    const handlePageChange = (page: number | 'highlights') => {
        setCurrentPage(page);
        setActiveChapter('all');
        if (page === 'highlights') {
            fetchPastBorderRankings(event.id);
        } else {
            if (cachedPastRankings.length === 0) fetchPastRankings(event.id);
            else setRankings(cachedPastRankings);
        }
    };

    const currentEventDuration = useMemo(() => {
        if (isWorldLink(event.id) && activeChapter !== 'all') {
            const wlInfo = getWlDetail(event.id);
            return wlInfo?.chDavg || 3;
        }
        const evt = allEvents.find(e => e.id === event.id);
        if (evt) return calculatePreciseDuration(evt.start_at, evt.aggregate_at);
        return 1;
    }, [event, allEvents, activeChapter, isWorldLink, getWlDetail]);

    const sortedAndFilteredRankings = useMemo(() => {
        const filtered = rankings.filter(entry => entry.user.display_name.toLowerCase().includes(searchTerm.toLowerCase()));
        const sorted = [...filtered].sort((a, b) => {
            if (sortOption === 'score') return b.score - a.score;
            if (sortOption === 'dailyAvg') {
                return (b.score / currentEventDuration) - (a.score / currentEventDuration);
            }
            if (sortOption === 'lastPlayedAt') {
                if(!a.lastPlayedAt) return 1; if(!b.lastPlayedAt) return -1;
                return new Date(b.lastPlayedAt).getTime() - new Date(a.lastPlayedAt).getTime();
            }
            const [period, metric] = sortOption.split('_') as [any, any];
            if (a.stats[period as keyof typeof a.stats] && b.stats[period as keyof typeof b.stats]) {
                return (b.stats[period as keyof typeof b.stats][metric as 'count' | 'score' | 'speed' | 'average'] || 0) - (a.stats[period as keyof typeof a.stats][metric as 'count' | 'score' | 'speed' | 'average'] || 0);
            }
            return 0;
        });
        if (currentPage === 'highlights') return sorted;
        return sorted.map((entry, index) => ({ ...entry, rank: index + 1 }));
    }, [searchTerm, rankings, sortOption, currentPage, currentEventDuration]);

    const paginatedRankings = useMemo(() => {
        if (currentPage === 'highlights') return sortedAndFilteredRankings;
        const pageNum = typeof currentPage === 'number' ? currentPage : 1;
        return sortedAndFilteredRankings.slice((pageNum - 1) * ITEMS_PER_PAGE, pageNum * ITEMS_PER_PAGE);
    }, [sortedAndFilteredRankings, currentPage]);

    const competitiveStats = useMemo(() => {
        const isHighlights = currentPage === 'highlights';
        const getS = (rank: number) => rankings.find(r => r.rank === rank)?.score || 0;

        if (!isHighlights) {
            if (rankings.length < 100) return null;
            const s1 = getS(1); const s10 = getS(10); const s50 = getS(50); const s100 = getS(100);
            const range50_100 = rankings.filter(r => r.rank >= 50 && r.rank <= 100).map(r => r.score);
            
            return {
                type: 'top100' as const,
                stats: [
                    { label: 'T1/T10', diff: s1 - s10, ratio: s10 > 0 ? (s1 / s10).toFixed(1) : '0', color: 'text-yellow-500' },
                    { label: 'T10/T50', diff: s10 - s50, ratio: s50 > 0 ? (s10 / s50).toFixed(1) : '0', color: 'text-purple-400' },
                    { label: 'T50/T100', diff: s50 - s100, ratio: s100 > 0 ? (s50 / s100).toFixed(1) : '0', color: 'text-cyan-400' },
                    { label: 'T50-100 CV', cv: calculateCV(range50_100), color: 'text-emerald-400' }
                ]
            };
        } else {
            const s100 = getS(100); const s200 = getS(200); const s300 = getS(300);
            const s400 = getS(400); const s500 = getS(500); const s1000 = getS(1000);
            
            const calcStat = (label: string, high: number, low: number, color: string) => ({
                label,
                diff: high - low,
                ratio: low > 0 ? (high / low).toFixed(1) : '—',
                color: (high > 0 && low > 0) ? color : 'text-slate-600'
            });

            return {
                type: 'highlights' as const,
                stats: [
                    calcStat('T100/T200', s100, s200, 'text-yellow-500'),
                    calcStat('T200/T300', s200, s300, 'text-purple-400'),
                    calcStat('T300/T400', s300, s400, 'text-cyan-400'),
                    calcStat('T400/T500', s400, s500, 'text-emerald-400'),
                    calcStat('T500/T1000', s500, s1000, 'text-pink-400')
                ]
            };
        }
    }, [currentPage, rankings]);

    const isHighlights = currentPage === 'highlights';
    const shouldHideStats = true; // Always hide stats for past events as per original logic

    // Header Info
    const details = eventDetails[event.id];
    const color = getEventColor(event.id);
    const unitLabel = UNIT_MASTER[details?.unit]?.name || "Unknown";
    const unitLogo = getAssetUrl(details?.unit, 'unit');
    const bannerChar = getChar(details?.banner || "");
    const bannerImg = (details?.banner !== '-') ? getAssetUrl(details?.banner, 'character') : null;
    const eventLogo = getAssetUrl(event.id.toString(), 'event');
    const unitStyle = UNIT_MASTER[details?.unit]?.style || "bg-slate-500 text-white";
    const evtInfo = allEvents.find(e => e.id === event.id);
    const dateRangeStr = evtInfo ? (() => {
        const start = new Date(evtInfo.start_at);
        const end = new Date(evtInfo.aggregate_at);
        const f = (d: Date) => d.toLocaleString(undefined, { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false });
        return `${f(start)} ~ ${f(end)}`;
    })() : '';

    // World Link Logic
    const isWl = isWorldLink(event.id);
    let WorldLinkTabs = null;

    if (isWl) {
        const wlInfo = getWlDetail(event.id);
        const chapters = wlInfo?.chorder || [];
        WorldLinkTabs = (
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                <button onClick={(e) => { e.stopPropagation(); setActiveChapter('all'); }} className={`px-3 py-1 text-xs font-bold rounded-full transition-all whitespace-nowrap border ${activeChapter === 'all' ? 'bg-slate-700 text-white border-transparent shadow-md' : 'bg-transparent text-slate-50 dark:text-slate-400 border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700'}`}>總榜 (Total)</button>
                {chapters.map(charId => {
                    const isActive = activeChapter === charId;
                    const char = CHARACTERS[charId];
                    const charName = char?.name || charId;
                    const charColor = char?.color || '#999';
                    const charImg = getAssetUrl(charId, 'character');
                    return (
                        <button key={charId} onClick={(e) => { e.stopPropagation(); setActiveChapter(charId); }} className={`flex items-center gap-1.5 px-2 py-1 text-xs font-bold rounded-full transition-all whitespace-nowrap border ${isActive ? 'text-white border-transparent shadow-md' : 'bg-transparent text-slate-50 dark:text-slate-400 border-slate-300 dark:border-slate-600 hover:opacity-80'}`} style={{ backgroundColor: isActive ? charColor : 'transparent', borderColor: isActive ? 'transparent' : undefined }}>
                            {charImg && <img src={charImg} alt={charName} className="w-4 h-4 rounded-full border border-white/30" />}
                            {charName}
                        </button>
                    );
                })}
            </div>
        );
    }

    let rankingsTitle: React.ReactNode = "前百排行榜 (Top 100 Rankings)";
    if (isWl) {
        rankingsTitle = (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full gap-3">
                <div className="flex items-center gap-3">
                    <span className="font-black whitespace-nowrap">{isHighlights ? "精彩片段" : "前百排行榜"}</span>
                </div>
                {WorldLinkTabs}
            </div>
        );
    } else if (isHighlights) {
        rankingsTitle = "精彩片段 (Highlights)";
    }

    return (
        <div className="animate-fadeIn">
            <div className="mb-6">
                <button onClick={onBack} className="flex items-center text-cyan-600 dark:text-cyan-400 hover:text-cyan-500 font-bold mb-4 transition-colors">
                    <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    返回列表 (Back)
                </button>
                <div className="flex flex-col lg:flex-row justify-between items-center gap-4 bg-white dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                    <div className="flex items-center gap-3 flex-1 overflow-hidden min-w-0">
                        {eventLogo && <img src={eventLogo} alt="Logo" className="h-10 sm:h-12 w-auto object-contain rounded flex-shrink-0" />}
                        <div className="flex flex-col min-w-0">
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                <span className="text-slate-400 font-mono text-xs sm:text-sm whitespace-nowrap">第{event.id}期</span>
                                <span style={{ color: color || 'inherit' }} className="font-black text-lg sm:text-xl truncate">{event.name}</span>
                                <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full ${unitStyle} text-[10px] font-bold flex-shrink-0`}>
                                    {unitLogo && <img src={unitLogo} alt="Unit" className="h-3 w-auto" />}
                                    <span>{unitLabel}</span>
                                </div>
                                {details?.banner !== '-' && (
                                    <div className="flex items-center gap-1.5 ml-1">
                                        <span className="text-xs font-black" style={{ color: bannerChar?.color || 'inherit' }}>{bannerChar?.name}</span>
                                        {bannerImg && <img src={bannerImg} alt="Banner" className="w-7 h-7 rounded-full border border-slate-200 dark:border-slate-700 object-cover shadow-sm flex-shrink-0" />}
                                    </div>
                                )}
                            </div>
                            {dateRangeStr && <span className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">{dateRangeStr}</span>}
                        </div>
                    </div>
                    <div className="flex-shrink-0 w-full lg:w-auto">
                        <StatsDisplay stats={competitiveStats} />
                    </div>
                </div>
            </div>

            {isLoading ? <LoadingSpinner /> : error ? <ErrorMessage message={error} /> : (
                <>
                    <CollapsibleSection title="圖表分析 (Chart Analysis)" isOpen={isChartsOpen} onToggle={() => setIsChartsOpen(!isChartsOpen)}>
                        <ChartAnalysis rankings={sortedAndFilteredRankings} sortOption={sortOption} isHighlights={isHighlights} eventId={event.id} />
                    </CollapsibleSection>
                    <CollapsibleSection title={rankingsTitle} isOpen={isRankingsOpen} onToggle={() => setIsRankingsOpen(!isRankingsOpen)}>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                            <Pagination totalItems={100} itemsPerPage={ITEMS_PER_PAGE} currentPage={currentPage} onPageChange={handlePageChange} activeSort={sortOption} />
                            <SortSelector activeSort={sortOption} onSortChange={setSortOption} limitToScore={shouldHideStats} />
                        </div>
                        <RankingList rankings={paginatedRankings} sortOption={sortOption} hideStats={shouldHideStats} eventDuration={currentEventDuration} cardsMap={cards || undefined} />
                    </CollapsibleSection>
                </>
            )}
        </div>
    );
};

export default PastEventDetailView;
