
import React, { useState, useEffect, useMemo } from 'react';
import { EventSummary, PastEventApiResponse, PastEventBorderApiResponse } from '../types';
import LineChart from './LineChart';
import { calculatePreciseDuration, API_BASE_URL } from '../constants';
import Select from './ui/Select';
import Button from './ui/Button';
import Input from './ui/Input';
import EventFilterGroup, { EventFilterState } from './ui/EventFilterGroup';
import { useConfig } from '../contexts/ConfigContext';
import { formatScoreForChart } from '../utils/mathUtils';
import LoadingSpinner from './LoadingSpinner';
import { fetchJsonWithBigInt } from '../hooks/useRankings';
import { UI_TEXT } from '../constants/uiText';

interface TrendDataPoint {
    eventId: number;
    eventName: string;
    duration: number;
    score: number;
    year: number;
}

const RANK_OPTIONS = [1, 10, 100, 200, 300, 400, 500, 1000, 2000, 5000, 10000];

const RankTrendView: React.FC = () => {
    const { eventDetails, getEventColor } = useConfig();
    const [allEvents, setAllEvents] = useState<EventSummary[]>([]);
    const [trendData, setTrendData] = useState<TrendDataPoint[]>([]);
    const [availableYears, setAvailableYears] = useState<number[]>([]);
    const [isLoadingList, setIsLoadingList] = useState(true);
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [fallbackNotice, setFallbackNotice] = useState<string | null>(null);
    const [selectedRank, setSelectedRank] = useState<number>(100);
    const [displayMode, setDisplayMode] = useState<'total' | 'daily'>('total');
    const [rangeMode, setRangeMode] = useState<'all' | 'year' | 'id'>('id');
    const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
    const [idRange, setIdRange] = useState<{start: string, end: string}>({start: '', end: ''});
    const [showStatLines, setShowStatLines] = useState(false);

    const [filters, setFilters] = useState<EventFilterState>({
        unit: 'all', banner: 'all', type: 'all', storyType: 'all', cardType: 'all', fourStar: 'all'
    });

    useEffect(() => {
        const fetchList = async () => {
            try {
                const listData: EventSummary[] = await fetchJsonWithBigInt(`${API_BASE_URL}/event/list`);
                if (listData) {
                    const sortedEvents = listData.sort((a, b) => a.id - b.id);
                    setAllEvents(sortedEvents);
                    const years = Array.from(new Set(sortedEvents.map(e => new Date(e.start_at).getFullYear()))).sort((a, b) => b - a); 
                    setAvailableYears(years);
                    if (years.length > 0 && !years.includes(selectedYear)) setSelectedYear(years[0]);
                    const now = new Date();
                    const pastEvents = sortedEvents.filter(e => new Date(e.closed_at) < now);
                    if (pastEvents.length > 0) {
                        const latest = pastEvents[pastEvents.length - 1].id;
                        setIdRange({ start: String(Math.max(1, latest - 19)), end: String(latest) });
                    }
                }
                setIsLoadingList(false);
            } catch (e) {
                console.error(e);
                setFetchError(UI_TEXT.rankTrend.fetchError);
                setIsLoadingList(false);
            }
        };
        fetchList();
    }, []);

    useEffect(() => {
        if (isLoadingList || allEvents.length === 0) return;
        let alive = true;
        const controller = new AbortController();

        const fetchTrendData = async () => {
            setFetchError(null); setFallbackNotice(null);
            const now = new Date();
            let allPastEvents = allEvents.filter(e => new Date(e.closed_at) < now);
            let targetEvents: EventSummary[] = [];

            if (rangeMode === 'all') targetEvents = allPastEvents;
            else if (rangeMode === 'year') {
                let yearEvents = allPastEvents.filter(e => new Date(e.start_at).getFullYear() === selectedYear);
                if (yearEvents.length < 9) {
                    const latest = allPastEvents[allPastEvents.length - 1].id;
                    targetEvents = allPastEvents.filter(evt => evt.id >= (latest - 19) && evt.id <= latest);
                    setFallbackNotice(`${selectedYear} ${UI_TEXT.rankTrend.fallbackNotice}`);
                } else targetEvents = yearEvents;
            } else {
                const s = parseInt(idRange.start); const e = parseInt(idRange.end);
                if (isNaN(s) || isNaN(e)) { setTrendData([]); return; }
                targetEvents = allPastEvents.filter(evt => evt.id >= s && evt.id <= e);
            }

            if (targetEvents.length === 0) { setTrendData([]); return; }
            setIsAnalyzing(true); setLoadingProgress(0); setTrendData([]); 

            const total = targetEvents.length; const BATCH_SIZE = 5;
            for (let i = 0; i < total; i += BATCH_SIZE) {
                if (!alive) break;
                if (isPaused) { await new Promise(r => setTimeout(r, 500)); i -= BATCH_SIZE; continue; }
                const batch = targetEvents.slice(i, i + BATCH_SIZE);
                const batchResults = await Promise.all(batch.map(async (event) => {
                    try {
                        let score = 0;
                        const isTop100 = selectedRank <= 100;
                        const url = isTop100 ? `${API_BASE_URL}/event/${event.id}/top100` : `${API_BASE_URL}/event/${event.id}/border`;
                        const json = await fetchJsonWithBigInt(url, controller.signal);
                        if (json) {
                            if (isTop100) {
                                if (selectedRank === 1) score = json.rankings?.[0]?.score || 0;
                                else if (selectedRank === 10) score = json.rankings?.[9]?.score || 0;
                                else if (selectedRank === 100) score = json.rankings?.[99]?.score || 0;
                                else score = json.rankings?.find((r:any) => r.rank === selectedRank)?.score || 0;
                            } else {
                                score = json.borderRankings?.find((r:any) => r.rank === selectedRank)?.score || 0;
                            }
                        }
                        return { eventId: event.id, eventName: event.name, duration: calculatePreciseDuration(event.start_at, event.aggregate_at), score, year: new Date(event.start_at).getFullYear() };
                    } catch (e) { return null; }
                }));
                const validPoints = batchResults.filter((r): r is TrendDataPoint => r !== null && r.score > 0);
                if (alive) { setTrendData(prev => [...prev, ...validPoints].sort((a, b) => a.eventId - b.eventId)); setLoadingProgress(Math.round(((i + batch.length) / total) * 100)); }
            }
            if (alive) setIsAnalyzing(false);
        };
        const timeoutId = setTimeout(fetchTrendData, 300);
        return () => { alive = false; controller.abort(); clearTimeout(timeoutId); };
    }, [allEvents, isLoadingList, rangeMode, selectedYear, idRange, selectedRank, isPaused]);

    const { chartData, meanValue, medianValue, hasMatchingData } = useMemo(() => {
        const hasActiveFilters = filters.unit !== 'all' || filters.type !== 'all' || filters.banner !== 'all' || filters.storyType !== 'all' || filters.cardType !== 'all' || filters.fourStar !== 'all';
        let visibleCount = 0;
        const mappedData = trendData.map(d => {
            const details = eventDetails[d.eventId]; let isMatch = true;
            if (filters.unit !== 'all' && details?.unit !== filters.unit) isMatch = false;
            if (filters.type !== 'all' && details?.type !== filters.type) isMatch = false;
            if (filters.banner !== 'all' && details?.banner !== filters.banner) isMatch = false;
            if (filters.storyType !== 'all' && details?.storyType !== filters.storyType) isMatch = false;
            if (filters.cardType !== 'all' && details?.cardType !== filters.cardType) isMatch = false;
            if (filters.fourStar !== 'all') { const cards = details?.["4starcard"]?.split(',') || []; if (!cards.some(cardId => cardId.split('-')[0] === filters.fourStar)) isMatch = false; }
            if (isMatch) visibleCount++;
            return { label: `${d.eventName}`, value: displayMode === 'daily' ? Math.ceil(d.score / Math.max(1, d.duration)) : d.score, rank: d.eventId, isHighlighted: !hasActiveFilters || isMatch, pointColor: getEventColor(d.eventId), year: d.year };
        });
        const activeValues = mappedData.filter(d => d.isHighlighted).map(d => d.value).sort((a, b) => a - b);
        let mean = 0, median = 0;
        if (activeValues.length > 0) { mean = activeValues.reduce((a, b) => a + b, 0) / activeValues.length; const mid = Math.floor(activeValues.length / 2); median = activeValues.length % 2 !== 0 ? activeValues[mid] : (activeValues[mid - 1] + activeValues[mid]) / 2; }
        return { chartData: mappedData, meanValue: mean, medianValue: median, hasMatchingData: visibleCount > 0 };
    }, [trendData, displayMode, filters, eventDetails, getEventColor]);

    return (
        <div className="w-full py-4 animate-fadeIn">
            <div className="mb-6"><h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">{UI_TEXT.rankTrend.title}</h2><p className="text-slate-500 dark:text-slate-400">{UI_TEXT.rankTrend.description}</p></div>
            <div className="bg-slate-100 dark:bg-slate-800/80 rounded-lg p-4 mb-4 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row gap-4 items-center">
                <div className="flex bg-white dark:bg-slate-700 rounded-lg p-1 border border-slate-200 dark:border-slate-600 flex-shrink-0">
                    <button onClick={() => setRangeMode('all')} className={`px-3 py-1.5 text-xs sm:text-sm font-bold rounded transition-all ${rangeMode === 'all' ? 'bg-cyan-500 text-white shadow' : 'text-slate-500 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'}`}>{UI_TEXT.rankTrend.rangeMode.all}</button>
                    <button onClick={() => setRangeMode('year')} className={`px-3 py-1.5 text-xs sm:text-sm font-bold rounded transition-all ${rangeMode === 'year' ? 'bg-cyan-500 text-white shadow' : 'text-slate-500 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'}`}>{UI_TEXT.rankTrend.rangeMode.year}</button>
                    <button onClick={() => setRangeMode('id')} className={`px-3 py-1.5 text-xs sm:text-sm font-bold rounded transition-all ${rangeMode === 'id' ? 'bg-cyan-500 text-white shadow' : 'text-slate-500 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'}`}>{UI_TEXT.rankTrend.rangeMode.id}</button>
                </div>
                <div className="flex-1 w-full md:w-auto">
                    {rangeMode === 'all' ? (<div className="text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-200 dark:bg-slate-700/50 px-4 py-2.5 rounded-lg border border-dashed border-slate-300 dark:border-slate-600">{UI_TEXT.rankTrend.allDataWarning}</div>) 
                    : rangeMode === 'year' ? (<Select className="w-full md:max-w-xs" value={selectedYear} onChange={(val) => setSelectedYear(Number(val))} options={availableYears.map(y => ({ value: y, label: `${y} 年` }))} />) 
                    : (<div className="flex items-center gap-2 w-full md:max-w-sm"><Input placeholder="Start ID" type="number" value={idRange.start} onChange={(val) => setIdRange(prev => ({ ...prev, start: val }))} className="text-center font-mono font-bold" /><span className="text-slate-400 font-bold">~</span><Input placeholder="End ID" type="number" value={idRange.end} onChange={(val) => setIdRange(prev => ({ ...prev, end: val }))} className="text-center font-mono font-bold" /></div>)}
                </div>
                <div className="flex items-center gap-2 bg-white dark:bg-slate-700 rounded-lg p-1 border border-slate-200 dark:border-slate-700 ml-auto flex-shrink-0"><Button size="sm" variant={displayMode === 'total' ? 'primary' : 'ghost'} onClick={() => setDisplayMode('total')}>總分</Button><Button size="sm" variant={displayMode === 'daily' ? 'danger' : 'ghost'} className={displayMode === 'daily' ? 'bg-pink-500 hover:bg-pink-600 focus:ring-pink-500' : ''} onClick={() => setDisplayMode('daily')}>日均</Button></div>
            </div>
            {fallbackNotice && (<div className="mb-4 p-2 px-4 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 text-xs rounded-lg border border-amber-200 dark:border-amber-800 flex items-center animate-fadeIn"><svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>{fallbackNotice}</div>)}
            {fetchError && (<div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm rounded-lg border border-red-200 dark:border-red-800 flex items-center"><svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>{fetchError}</div>)}
            <div className="bg-white dark:bg-slate-800/50 p-3 rounded-lg border border-slate-200 dark:border-slate-700 mb-6 flex flex-col xl:flex-row gap-4 items-center">
                 <div className="flex flex-wrap gap-2 items-center flex-1">
                     <span className="text-xs font-bold text-slate-500 dark:text-slate-400 mr-1">{UI_TEXT.rankTrend.rankBase}</span><Select className="py-1.5 text-xs w-32" value={selectedRank} onChange={(val) => setSelectedRank(Number(val))} options={RANK_OPTIONS.map(rank => ({ value: rank, label: `Top ${rank}` }))} />
                     <div className="w-px h-6 bg-slate-200 dark:bg-slate-600 mx-2 hidden sm:block"></div>
                     <span className="text-xs font-bold text-slate-500 dark:text-slate-400 mr-1">{UI_TEXT.rankTrend.filterLabel}</span><EventFilterGroup filters={filters} onFilterChange={setFilters} mode="exclusive" compact={true} containerClassName="flex flex-wrap gap-2 items-center" itemClassName="w-24 sm:w-auto" />
                 </div>
                 {hasMatchingData && (<div className="flex gap-3 w-full xl:w-auto border-t xl:border-t-0 border-slate-100 dark:border-slate-700/50 pt-2 xl:pt-0 items-center justify-end"><label className="flex items-center gap-1.5 cursor-pointer select-none group"><input type="checkbox" checked={showStatLines} onChange={(e) => setShowStatLines(e.target.checked)} className="w-4 h-4 text-cyan-500 rounded border-slate-300 dark:border-slate-600 focus:ring-cyan-500 dark:bg-slate-700" /><span className="text-xs text-slate-500 dark:text-slate-400 font-bold group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors">{UI_TEXT.rankTrend.showAuxLine}</span></label><div className="flex items-center gap-2 px-3 py-1.5 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-md border border-purple-200 dark:border-purple-800/50"><span className="text-[10px] font-bold uppercase tracking-wider">{UI_TEXT.rankTrend.stats.avg}</span><span className="text-sm font-mono font-bold">{meanValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span></div><div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 rounded-md border border-amber-200 dark:border-amber-800/50"><span className="text-[10px] font-bold uppercase tracking-wider">{UI_TEXT.rankTrend.stats.median}</span><span className="text-sm font-mono font-bold">{medianValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span></div></div>)}
            </div>
            <div className="relative">
                {isAnalyzing && (<div className="absolute inset-x-0 top-0 z-10 mx-4 mt-4 animate-fadeIn"><div className="bg-white dark:bg-slate-800 rounded-lg p-3 border border-slate-200 dark:border-slate-700 shadow-lg flex items-center justify-between"><div className="flex items-center gap-3 w-full"><span className="text-cyan-600 dark:text-cyan-400 font-bold text-sm animate-pulse whitespace-nowrap">{UI_TEXT.rankTrend.loading} ({loadingProgress}%)</span><div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden"><div className="bg-cyan-500 h-full rounded-full transition-all duration-300 ease-out" style={{ width: `${loadingProgress}%` }}></div></div></div><Button size="sm" variant="secondary" onClick={() => setIsPaused(!isPaused)} className="ml-3 h-7 text-xs font-bold">{isPaused ? "▶ 繼續" : "⏸ 暫停"}</Button></div></div>)}
                <div className={`bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg p-4 shadow-lg transition-opacity duration-300 ${isAnalyzing && trendData.length === 0 ? 'opacity-60 pointer-events-none' : 'opacity-100'}`}>
                    {trendData.length > 0 ? (hasMatchingData ? (<LineChart data={chartData} variant="trend" lineColor="teal" xAxisLabel="Event ID" yAxisLabel={displayMode === 'total' ? "Score" : "Daily Avg"} valueFormatter={formatScoreForChart} yAxisFormatter={formatScoreForChart} meanValue={showStatLines ? meanValue : undefined} medianValue={showStatLines ? medianValue : undefined} />) 
                    : (<div className="h-64 flex flex-col items-center justify-center text-slate-400 bg-slate-50 dark:bg-slate-900/20 rounded-lg border border-dashed border-slate-300 dark:border-slate-700"><p className="font-bold mb-1">{UI_TEXT.rankTrend.noData.title}</p><p className="text-sm">{UI_TEXT.rankTrend.noData.desc}</p></div>)) 
                    : (<div className="h-64 flex flex-col items-center justify-center text-slate-400">{fetchError ? (<p className="text-sm">{fetchError}</p>) : isLoadingList ? (<LoadingSpinner />) : (<><p className="font-bold mb-1">{UI_TEXT.rankTrend.ready.title}</p><p className="text-sm">{UI_TEXT.rankTrend.ready.desc}</p></>)}</div>)}
                </div>
            </div>
        </div>
    );
};

export default RankTrendView;
