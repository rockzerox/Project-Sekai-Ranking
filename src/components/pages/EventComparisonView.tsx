
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { EventSummary, SimpleRankData, ComparisonResult, PastEventApiResponse, PastEventBorderApiResponse } from '../../types';
import ErrorMessage from '../../components/ui/ErrorMessage';
import { API_BASE_URL, CHARACTERS } from '../../config/constants';
import { calculatePreciseDuration } from '../../utils/timeUtils';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';
import EventFilterGroup, { EventFilterState } from '../../components/ui/EventFilterGroup';
import { useConfig } from '../../contexts/ConfigContext';
import { formatScoreForChart } from '../../utils/mathUtils';
import { fetchJsonWithBigInt } from '../../hooks/useRankings';
import { useEventList } from '../../hooks/useEventList';
import { UI_TEXT } from '../../config/uiText';
import { PortalTooltip, TooltipHandle } from '../../components/ui/PortalTooltip';

const EventComparisonView: React.FC = () => {
    const { eventDetails, getEventColor, isWorldLink, getWlDetail } = useConfig();
    const { events: allEvents, error: listError } = useEventList();

    const [compareMode, setCompareMode] = useState<'general' | 'world_link'>('general');

    const events = useMemo(() => {
        const now = new Date();
        return allEvents.filter(e => new Date(e.closed_at) < now && !isWorldLink(e.id));
    }, [allEvents, isWorldLink]);

    const wlEvents = useMemo(() => {
        const now = new Date();
        return allEvents.filter(e => new Date(e.closed_at) < now && isWorldLink(e.id));
    }, [allEvents, isWorldLink]);

    const [selectedId1, setSelectedId1] = useState<string>('');
    const [selectedId2, setSelectedId2] = useState<string>('');
    
    const [filters1, setFilters1] = useState<EventFilterState>({
        unit: 'all', banner: 'all', type: 'all', storyType: 'all', cardType: 'all', fourStar: 'all', theme: 'all'
    });
    const [filters2, setFilters2] = useState<EventFilterState>({
        unit: 'all', banner: 'all', type: 'all', storyType: 'all', cardType: 'all', fourStar: 'all', theme: 'all'
    });

    const [wlRound1, setWlRound1] = useState<string>('');
    const [wlChar1, setWlChar1] = useState<string>('');
    const [wlRound2, setWlRound2] = useState<string>('');
    const [wlChar2, setWlChar2] = useState<string>('');

    const availableRounds = useMemo(() => {
        const rounds = new Set<number>();
        wlEvents.forEach(e => {
            const info = getWlDetail(e.id);
            if (info) rounds.add(info.round);
        });
        return Array.from(rounds).sort((a, b) => a - b);
    }, [wlEvents, getWlDetail]);

    useEffect(() => {
        if (availableRounds.length > 0) {
            if (!wlRound1) setWlRound1(availableRounds[0].toString());
            if (!wlRound2) setWlRound2(availableRounds[0].toString());
        }
    }, [availableRounds, wlRound1, wlRound2]);

    const getAvailableCharsForRound = useCallback((roundStr: string) => {
        if (!roundStr) return [];
        const chars = new Set<string>();
        wlEvents.forEach(e => {
            const info = getWlDetail(e.id);
            if (info && info.round.toString() === roundStr) {
                info.chorder.forEach(charId => chars.add(charId));
            }
        });
        
        // Sort characters by their ID (which roughly corresponds to their unit order)
        return Array.from(chars).sort((a, b) => {
            const numA = parseInt(a.split('-')[0] || a, 10);
            const numB = parseInt(b.split('-')[0] || b, 10);
            return numA - numB;
        });
    }, [wlEvents, getWlDetail]);

    const chars1 = useMemo(() => getAvailableCharsForRound(wlRound1), [wlRound1, getAvailableCharsForRound]);
    const chars2 = useMemo(() => getAvailableCharsForRound(wlRound2), [wlRound2, getAvailableCharsForRound]);

    useEffect(() => {
        if (chars1.length > 0 && !chars1.includes(wlChar1)) setWlChar1(chars1[0]);
    }, [chars1, wlChar1]);

    useEffect(() => {
        if (chars2.length > 0 && !chars2.includes(wlChar2)) setWlChar2(chars2[0]);
    }, [chars2, wlChar2]);

    const resolveWlSelection = useCallback((roundStr: string, charId: string) => {
        if (!roundStr || !charId) return null;
        
        // Find the specific event in this round that contains this character
        const event = wlEvents.find(e => {
            const info = getWlDetail(e.id);
            return info && info.round.toString() === roundStr && info.chorder.includes(charId);
        });
        
        if (!event) return null;
        
        const charName = CHARACTERS[charId]?.name || charId;
        return {
            eventId: event.id,
            charId: charId,
            displayName: `#${event.id} (第${roundStr}輪) - ${charName}`
        };
    }, [wlEvents, getWlDetail]);

    const resolvedWl1 = useMemo(() => resolveWlSelection(wlRound1, wlChar1), [wlRound1, wlChar1, resolveWlSelection]);
    const resolvedWl2 = useMemo(() => resolveWlSelection(wlRound2, wlChar2), [wlRound2, wlChar2, resolveWlSelection]);
    
    const [comparisonData, setComparisonData] = useState<ComparisonResult>({ event1: null, event2: null });
    const [isComparing, setIsComparing] = useState(false);
    const [comparisonError, setComparisonError] = useState<string | null>(null);

    const [hoveredRank, setHoveredRank] = useState<number | null>(null);
    const [cursorPercent, setCursorPercent] = useState<number | null>(null);
    
    const [displayMode, setDisplayMode] = useState<'total' | 'daily'>('total');
    const [isMobile, setIsMobile] = useState(false);
    const plotAreaRef = useRef<HTMLDivElement>(null);
    const tooltipRef = useRef<TooltipHandle>(null);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 640);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const filterEvents = useCallback((eventList: EventSummary[], f: EventFilterState) => {
        let result = eventList;
        if (f.unit !== 'all') result = result.filter(e => eventDetails[e.id]?.unit === f.unit);
        if (f.banner !== 'all') result = result.filter(e => eventDetails[e.id]?.banner === f.banner);
        if (f.type !== 'all') result = result.filter(e => eventDetails[e.id]?.type === f.type);
        if (f.storyType !== 'all') result = result.filter(e => eventDetails[e.id]?.storyType === f.storyType);
        if (f.cardType !== 'all') result = result.filter(e => eventDetails[e.id]?.cardType === f.cardType);
        if (f.theme !== 'all') result = result.filter(e => eventDetails[e.id]?.tag === f.theme);
        if (f.fourStar !== 'all') {
            result = result.filter(e => {
                const cards = eventDetails[e.id]?.["4starcard"]?.split(',') || [];
                return cards.some(cardId => cardId.split('-')[0] === f.fourStar);
            });
        }
        return result;
    }, [eventDetails]);

    const filteredEventOptions1 = useMemo(() => filterEvents(events, filters1), [events, filters1, filterEvents]);
    const filteredEventOptions2 = useMemo(() => filterEvents(events, filters2), [events, filters2, filterEvents]);

    const getGeneralOptions = (filteredOptions: EventSummary[], currentSelected: string) => {
        const baseOptions = filteredOptions.map(e => ({
            value: e.id.toString(),
            label: `#${e.id} ${e.name}`,
            style: { color: getEventColor(e.id) }
        }));

        if (currentSelected && !baseOptions.find(o => o.value === currentSelected)) {
            const missingEvent = events.find(e => e.id.toString() === currentSelected);
            if (missingEvent) {
                baseOptions.push({
                    value: missingEvent.id.toString(),
                    label: `#${missingEvent.id} ${missingEvent.name}`,
                    style: { color: getEventColor(missingEvent.id) }
                });
                baseOptions.sort((a, b) => Number(b.value) - Number(a.value));
            }
        }
        return [{ value: '', label: '選擇活動...' }, ...baseOptions];
    };

    const options1 = getGeneralOptions(filteredEventOptions1, selectedId1);
    const options2 = getGeneralOptions(filteredEventOptions2, selectedId2);

    const canCompare = compareMode === 'general' 
        ? (selectedId1 && selectedId2) 
        : (resolvedWl1 && resolvedWl2);

    const handleCompare = async () => {
        if (!canCompare) return;
        
        if (compareMode === 'general' && selectedId1 === selectedId2) {
            setComparisonError(UI_TEXT.eventComparison.errorSameEvent);
            return;
        }
        if (compareMode === 'world_link' && resolvedWl1?.eventId === resolvedWl2?.eventId && resolvedWl1?.charId === resolvedWl2?.charId) {
            setComparisonError(UI_TEXT.eventComparison.errorSameEvent);
            return;
        }

        setIsComparing(true);
        setComparisonError(null);
        setComparisonData({ event1: null, event2: null });
        setHoveredRank(null);

        try {
            if (compareMode === 'general') {
                const [data1top, data1border, data2top, data2border] = await Promise.all([
                    fetchJsonWithBigInt(`${API_BASE_URL}/event/${selectedId1}/top100`),
                    fetchJsonWithBigInt(`${API_BASE_URL}/event/${selectedId1}/border`),
                    fetchJsonWithBigInt(`${API_BASE_URL}/event/${selectedId2}/top100`),
                    fetchJsonWithBigInt(`${API_BASE_URL}/event/${selectedId2}/border`)
                ]);

                const eventSummary1 = events.find(e => e.id.toString() === selectedId1);
                const eventSummary2 = events.find(e => e.id.toString() === selectedId2);

                const eventName1 = eventSummary1?.name || `Event ${selectedId1}`;
                const eventName2 = eventSummary2?.name || `Event ${selectedId2}`;

                const duration1 = eventSummary1 ? calculatePreciseDuration(eventSummary1.start_at, eventSummary1.aggregate_at) : 0;
                const duration2 = eventSummary2 ? calculatePreciseDuration(eventSummary2.start_at, eventSummary2.aggregate_at) : 0;

                const processRankings = (topData: PastEventApiResponse = {} as PastEventApiResponse, borderData: PastEventBorderApiResponse = {} as PastEventBorderApiResponse): SimpleRankData[] => {
                    const combined = [
                        ...(topData.top_100_player_rankings || []).map((r) => ({ rank: r.rank, score: r.score })),
                        ...(borderData.border_player_rankings || []).map((r) => ({ rank: r.rank, score: r.score }))
                    ];
                    const uniqueMap = new Map<number, SimpleRankData>();
                    combined.forEach(item => uniqueMap.set(item.rank, item));
                    return Array.from(uniqueMap.values()).sort((a, b) => a.rank - b.rank).filter(item => item.score > 0);
                };

                setComparisonData({
                    event1: { name: eventName1, data: processRankings(data1top as PastEventApiResponse, data1border as PastEventBorderApiResponse), duration: duration1, id: Number(selectedId1) },
                    event2: { name: eventName2, data: processRankings(data2top as PastEventApiResponse, data2border as PastEventBorderApiResponse), duration: duration2, id: Number(selectedId2) }
                });
            } else {
                const eId1 = resolvedWl1!.eventId.toString();
                const cId1 = resolvedWl1!.charId;
                const eId2 = resolvedWl2!.eventId.toString();
                const cId2 = resolvedWl2!.charId;

                const [data1top, data1border, data2top, data2border] = await Promise.all([
                    fetchJsonWithBigInt(`${API_BASE_URL}/event/${eId1}/top100`),
                    fetchJsonWithBigInt(`${API_BASE_URL}/event/${eId1}/border`),
                    fetchJsonWithBigInt(`${API_BASE_URL}/event/${eId2}/top100`),
                    fetchJsonWithBigInt(`${API_BASE_URL}/event/${eId2}/border`)
                ]);

                const processWlRankings = (topData: PastEventApiResponse, borderData: PastEventBorderApiResponse, charId: string): SimpleRankData[] => {
                    const topRanks = topData.userWorldBloomChapterRankings?.find((c) => c.gameCharacterId.toString() === charId)?.rankings || [];
                    const borderRanks = borderData.userWorldBloomChapterRankingBorders?.find((c) => c.gameCharacterId.toString() === charId)?.borderRankings || [];
                    
                    const combined = [
                        ...topRanks.map((r) => ({ rank: r.rank, score: r.score })),
                        ...borderRanks.map((r) => ({ rank: r.rank, score: r.score }))
                    ];
                    const uniqueMap = new Map<number, SimpleRankData>();
                    combined.forEach(item => uniqueMap.set(item.rank, item));
                    return Array.from(uniqueMap.values()).sort((a, b) => a.rank - b.rank).filter(item => item.score > 0);
                };

                const wlInfo1 = getWlDetail(Number(eId1));
                const wlInfo2 = getWlDetail(Number(eId2));
                
                const charName1 = CHARACTERS[cId1]?.name || cId1;
                const charName2 = CHARACTERS[cId2]?.name || cId2;

                const color1 = CHARACTERS[cId1]?.color || '#06b6d4';
                const color2 = CHARACTERS[cId2]?.color || '#ec4899';

                setComparisonData({
                    event1: { 
                        name: `#${eId1} ${charName1}`, 
                        data: processWlRankings(data1top, data1border, cId1), 
                        duration: wlInfo1?.chDavg || 3, 
                        id: Number(eId1),
                        color: color1
                    },
                    event2: { 
                        name: `#${eId2} ${charName2}`, 
                        data: processWlRankings(data2top, data2border, cId2), 
                        duration: wlInfo2?.chDavg || 3, 
                        id: Number(eId2),
                        color: color2
                    }
                });
            }

        } catch (err) {
            setComparisonError(UI_TEXT.eventComparison.errorLoad);
            console.error(err);
        } finally {
            setIsComparing(false);
        }
    };

    const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>, getXPercent: (rank: number) => number, maxRank: number, ranks: number[]) => {
        if (!plotAreaRef.current) return;
        const rect = plotAreaRef.current.getBoundingClientRect();
        const relX = e.clientX - rect.left;
        const mousePercent = (relX / rect.width) * 100;
        if (ranks.length > 0) {
            let bestRank = ranks[0];
            let minDiff = Infinity;
            let bestPercent = 0;
            for (const r of ranks) {
                const p = getXPercent(r);
                const diff = Math.abs(p - mousePercent);
                if (diff < minDiff) { bestRank = r; minDiff = diff; bestPercent = p; }
            }
            if (minDiff < 5) { 
                setHoveredRank(bestRank); 
                setCursorPercent(bestPercent);
                
                // Show Portal Tooltip
                const plotRect = plotAreaRef.current.getBoundingClientRect();
                const cursorX = plotRect.left + (plotRect.width * bestPercent / 100);
                
                const tooltipValues = {
                    s1: comparisonData.event1?.data.find(d => d.rank === bestRank)?.score,
                    s2: comparisonData.event2?.data.find(d => d.rank === bestRank)?.score
                };

                tooltipRef.current?.show(cursorX, plotRect.top, (
                    <div className="text-xs whitespace-nowrap">
                        <div className="font-bold text-center border-b border-slate-600 pb-1 mb-1 text-slate-300">Rank {bestRank}</div>
                        <div className="grid grid-cols-[auto_auto] gap-x-3 gap-y-1 items-center">
                            <div className="flex items-center gap-1.5 max-w-[120px]"><div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: comparisonData.event1?.color || '#06b6d4' }}></div><span className="text-slate-300 truncate text-[10px]">{comparisonData.event1?.name}</span></div>
                            <span className="font-mono font-bold text-right">{tooltipValues.s1 ? formatScoreForChart(tooltipValues.s1) : '—'}</span>
                            <div className="flex items-center gap-1.5 max-w-[120px]"><div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: comparisonData.event2?.color || '#ec4899' }}></div><span className="text-slate-300 truncate text-[10px]">{comparisonData.event2?.name}</span></div>
                            <span className="font-mono font-bold text-right">{tooltipValues.s2 ? formatScoreForChart(tooltipValues.s2) : '—'}</span>
                        </div>
                    </div>
                ));
            }
            else { 
                setHoveredRank(null); 
                setCursorPercent(null); 
                tooltipRef.current?.hide();
            }
        }
    }, [comparisonData]);

    const ChartDisplay = useMemo(() => {
        if (!comparisonData.event1 || !comparisonData.event2) return null;
        const color1 = comparisonData.event1.color || getEventColor(comparisonData.event1.id) || '#06b6d4';
        const color2 = comparisonData.event2.color || getEventColor(comparisonData.event2.id) || '#ec4899';
        const processData = (data: SimpleRankData[], duration: number) => data.map(d => ({ ...d, score: displayMode === 'daily' ? Math.ceil(d.score / Math.max(1, duration)) : d.score }));
        const d1 = processData(comparisonData.event1.data, comparisonData.event1.duration);
        const d2 = processData(comparisonData.event2.data, comparisonData.event2.duration);
        const allScores = [...d1.map(d => d.score), ...d2.map(d => d.score)];
        const allRanks = [...d1.map(d => d.rank), ...d2.map(d => d.rank)];
        const uniqueRanks = Array.from(new Set(allRanks)).sort((a,b) => a-b);
        const maxScore = Math.max(...allScores, 1) * 1.05;
        const maxRank = Math.max(...allRanks, 1000);
        const SPLIT_RATIO = 0.3; const SPLIT_RANK = 100;
        const getXPercent = (rank: number) => {
            let ratio = 0; if (rank <= 1) ratio = 0; else if (rank <= SPLIT_RANK) ratio = ((rank - 1) / (SPLIT_RANK - 1)) * SPLIT_RATIO;
            else { const logMin = Math.log(SPLIT_RANK); const logMax = Math.log(maxRank); const logVal = Math.log(rank); ratio = SPLIT_RATIO + ((logVal - logMin) / (logMax - logMin)) * (1 - SPLIT_RATIO); }
            return ratio * 100;
        };
        const getYPercent = (score: number) => (score / maxScore) * 100;
        const SCATTER_RANKS = [1, 10, 20, 30, 40, 50, 100, 200, 300, 400, 500, 1000, 2000, 5000, 10000];
        const calculatePoints = (data: SimpleRankData[]) => {
            if (data.length < 2) return { path: "", points: [] };
            const points = data.map(p => { const x = getXPercent(p.rank); const y = 100 - getYPercent(p.score); const showDot = SCATTER_RANKS.includes(p.rank); return { x, y, rank: p.rank, score: p.score, showDot }; });
            const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' ');
            return { path, points: points.filter(p => p.showDot) };
        };
        const result1 = calculatePoints(d1); const result2 = calculatePoints(d2);
        const xTicksList = isMobile ? [1, 100, 1000, 10000, 50000] : [1, 10, 50, 100, 500, 1000, 2000, 5000, 10000, 20000, 50000];
        const xTicks = xTicksList.filter(r => r <= maxRank).map(r => ({ label: r >= 1000 ? `${r/1000}k` : r.toString(), xPercent: getXPercent(r), rank: r }));
        const yTicks = [0, 0.25, 0.5, 0.75, 1].map(r => ({ label: formatScoreForChart(maxScore * r), yPercent: r * 100 }));
        const getTooltipData = () => { if (hoveredRank === null) return null; return { s1: d1.find(d => d.rank === hoveredRank)?.score, s2: d2.find(d => d.rank === hoveredRank)?.score }; };
        const getTrendAnalysis = () => {
             const ranges = [{ label: 'Top 1-10', min: 1, max: 10 }, { label: 'Top 10-100', min: 10, max: 100 }, { label: 'Top 100-1k', min: 100, max: 1000 }, { label: 'Top 1k-10k', min: 1000, max: 10001 }];
             const anaText = UI_TEXT.eventComparison.chart.analysis;
             return ranges.map(range => {
                const getMetrics = (data: SimpleRankData[]) => {
                    const inRange = data.filter(d => d.rank >= range.min && d.rank < range.max);
                    if (inRange.length < 2 && range.min > 100) return null;
                    const maxS = Math.max(...inRange.map(d => d.score), 0); const minS = Math.min(...inRange.map(d => d.score), maxS); const avgS = inRange.reduce((a, b) => a + b.score, 0) / (inRange.length || 1);
                    return { spread: avgS > 0 ? (maxS - minS) / avgS : 0, avgScore: avgS };
                };
                const metricsA = getMetrics(d1); const metricsB = getMetrics(d2); if (!metricsA || !metricsB) return null;
                let steepnessWinner = 'equal'; if (metricsA.spread > metricsB.spread * 1.1) steepnessWinner = 'A'; else if (metricsB.spread > metricsA.spread * 1.1) steepnessWinner = 'B';
                let scoreWinner = 'equal'; if (metricsA.avgScore > metricsB.avgScore * 1.05) scoreWinner = 'A'; else if (metricsB.avgScore > metricsA.avgScore * 1.05) scoreWinner = 'B';
                const name1 = `第${comparisonData.event1?.id}期`; const name2 = `第${comparisonData.event2?.id}期`;
                let evaluation: string = anaText.similar;
                if (steepnessWinner === 'A' && scoreWinner === 'A') evaluation = `${name1} ${anaText.leadA}`;
                else if (steepnessWinner === 'B' && scoreWinner === 'B') evaluation = `${name2} ${anaText.leadB}`;
                else if (scoreWinner === 'A') evaluation = `${name1} ${anaText.highA}`;
                else if (scoreWinner === 'B') evaluation = `${name2} ${anaText.highB}`;
                else if (steepnessWinner === 'A') evaluation = `${name1} ${anaText.gapA}`;
                else if (steepnessWinner === 'B') evaluation = `${name2} ${anaText.gapB}`;
                return { range: range.label, steepnessWinner, scoreWinner, evaluation };
            }).filter(res => res !== null);
        };
        return { color1, color2, path1: result1.path, path2: result2.path, points1: result1.points, points2: result2.points, xTicks, yTicks, splitLineX: getXPercent(SPLIT_RANK), tooltipValues: getTooltipData(), trendStats: getTrendAnalysis(), handleMouseMove: (e: React.MouseEvent<HTMLDivElement>) => handleMouseMove(e, getXPercent, maxRank, uniqueRanks), formatY: formatScoreForChart };
    }, [comparisonData, displayMode, hoveredRank, isMobile, getEventColor, handleMouseMove]);

    if (listError) return <ErrorMessage message={listError} />;

    return (
        <div className="w-full animate-fadeIn py-2">
            <PortalTooltip ref={tooltipRef} />
            <div className="mb-8">
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">{UI_TEXT.eventComparison.title}</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">{UI_TEXT.eventComparison.description}</p>
            </div>

            <div className="flex justify-between items-center mb-6">
                {/* Mode Switcher */}
                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg w-fit">
                    <button
                        onClick={() => {
                            setCompareMode('general');
                            setSelectedId1('');
                            setSelectedId2('');
                            setComparisonData({ event1: null, event2: null });
                        }}
                        className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${
                            compareMode === 'general'
                                ? 'bg-white dark:bg-slate-700 shadow text-cyan-600 dark:text-cyan-400'
                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                        }`}
                    >
                        一般活動比較
                    </button>
                    <button
                        onClick={() => {
                            setCompareMode('world_link');
                            setComparisonData({ event1: null, event2: null });
                        }}
                        className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${
                            compareMode === 'world_link'
                                ? 'bg-white dark:bg-slate-700 shadow text-pink-500'
                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                        }`}
                    >
                        World Link 比較
                    </button>
                </div>

                {/* Compare Button */}
                <Button 
                    variant="gradient" 
                    disabled={isComparing || !canCompare} 
                    onClick={handleCompare} 
                    isLoading={isComparing}
                    className="px-8 py-2"
                >
                    {isComparing ? UI_TEXT.eventComparison.btnAnalyzing : UI_TEXT.eventComparison.btnCompare}
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
                {/* Panel A */}
                <div className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg p-4 shadow-sm flex flex-col gap-3">
                    {compareMode === 'general' ? (
                        <>
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-2 mt-2">
                                    <div className="w-3 h-3 rounded-full bg-cyan-500"></div>
                                    <span className="font-bold text-slate-700 dark:text-slate-200">活動 A (Base)</span>
                                </div>
                                <EventFilterGroup filters={filters1} onFilterChange={setFilters1} mode="exclusive" compact={true} containerClassName="items-end" />
                            </div>
                            <Select value={selectedId1} onChange={setSelectedId1} options={options1} />
                        </>
                    ) : (
                        <>
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-cyan-500"></div>
                                    <span className="font-bold text-slate-700 dark:text-slate-200">World Link A (Base)</span>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <select 
                                    className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-700 dark:text-slate-200"
                                    value={wlRound1}
                                    onChange={(e) => setWlRound1(e.target.value)}
                                >
                                    {availableRounds.map(r => <option key={r} value={r}>第 {r} 輪</option>)}
                                </select>
                                <select 
                                    className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-700 dark:text-slate-200"
                                    value={wlChar1}
                                    onChange={(e) => setWlChar1(e.target.value)}
                                >
                                    {chars1.map(cId => (
                                        <option key={cId} value={cId}>{CHARACTERS[cId]?.name || cId}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="p-2 bg-slate-50 dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700 text-sm text-center text-slate-600 dark:text-slate-400 font-bold">
                                {resolvedWl1 ? resolvedWl1.displayName : '請選擇輪次與角色'}
                            </div>
                        </>
                    )}
                </div>

                {/* Panel B */}
                <div className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg p-4 shadow-sm flex flex-col gap-3">
                    {compareMode === 'general' ? (
                        <>
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-2 mt-2">
                                    <div className="w-3 h-3 rounded-full bg-pink-500"></div>
                                    <span className="font-bold text-slate-700 dark:text-slate-200">活動 B (Compare)</span>
                                </div>
                                <EventFilterGroup filters={filters2} onFilterChange={setFilters2} mode="exclusive" compact={true} containerClassName="items-end" />
                            </div>
                            <Select value={selectedId2} onChange={setSelectedId2} options={options2} />
                        </>
                    ) : (
                        <>
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-pink-500"></div>
                                    <span className="font-bold text-slate-700 dark:text-slate-200">World Link B (Compare)</span>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <select 
                                    className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-700 dark:text-slate-200"
                                    value={wlRound2}
                                    onChange={(e) => setWlRound2(e.target.value)}
                                >
                                    {availableRounds.map(r => <option key={r} value={r}>第 {r} 輪</option>)}
                                </select>
                                <select 
                                    className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-700 dark:text-slate-200"
                                    value={wlChar2}
                                    onChange={(e) => setWlChar2(e.target.value)}
                                >
                                    {chars2.map(cId => (
                                        <option key={cId} value={cId}>{CHARACTERS[cId]?.name || cId}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="p-2 bg-slate-50 dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700 text-sm text-center text-slate-600 dark:text-slate-400 font-bold">
                                {resolvedWl2 ? resolvedWl2.displayName : '請選擇輪次與角色'}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {comparisonError && <ErrorMessage message={comparisonError} />}
            {ChartDisplay && (
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white dark:bg-slate-800/50 p-2 rounded-lg border border-slate-200 dark:border-slate-700 gap-2">
                        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 px-2">
                            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: ChartDisplay.color1 }}></div><div className="flex items-baseline gap-2 overflow-hidden"><span className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate max-w-[150px]">{comparisonData.event1?.name}</span><span className="text-[10px] text-slate-500 font-mono whitespace-nowrap">({comparisonData.event1?.duration.toFixed(1)} 天)</span></div></div>
                            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: ChartDisplay.color2 }}></div><div className="flex items-baseline gap-2 overflow-hidden"><span className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate max-w-[150px]">{comparisonData.event2?.name}</span><span className="text-[10px] text-slate-500 font-mono whitespace-nowrap">({comparisonData.event2?.duration.toFixed(1)} 天)</span></div></div>
                        </div>
                        <div className="flex items-center gap-2"><div className="flex bg-slate-100 dark:bg-slate-700 rounded p-1"><button onClick={() => setDisplayMode('total')} className={`px-3 py-1 rounded text-xs font-bold transition-all ${displayMode === 'total' ? 'bg-white dark:bg-slate-600 shadow text-cyan-600 dark:text-cyan-400' : 'text-slate-500 dark:text-slate-400'}`}>總分</button><button onClick={() => setDisplayMode('daily')} className={`px-3 py-1 rounded text-xs font-bold transition-all ${displayMode === 'daily' ? 'bg-white dark:bg-slate-600 shadow text-pink-500' : 'text-slate-500 dark:text-slate-400'}`}>日均</button></div></div>
                    </div>
                    <div className="relative bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 sm:p-10 select-none h-[400px] sm:h-[500px] flex">
                        <div className="w-12 md:w-16 flex-shrink-0 relative h-full border-r border-slate-200 dark:border-slate-700 mr-2">
                            {ChartDisplay.yTicks.map((tick, i) => (
                                <div key={`y-${i}`} className="absolute right-2 transform translate-y-1/2 text-[10px] md:text-xs text-slate-400 font-mono text-right w-full font-medium" style={{ bottom: `${tick.yPercent}%` }}>{tick.label}</div>
                            ))}
                        </div>
                        <div className="flex-1 relative h-full flex flex-col mx-4">
                            <div ref={plotAreaRef} className="relative flex-1 border border-slate-300 dark:border-slate-600 bg-slate-50/50 dark:bg-slate-900/20 overflow-visible cursor-crosshair mb-10" onMouseMove={ChartDisplay.handleMouseMove} onMouseLeave={() => { setHoveredRank(null); setCursorPercent(null); tooltipRef.current?.hide(); }}>
                                <div className="absolute top-0 bottom-0 border-l border-slate-300 dark:border-slate-600 border-dashed" style={{ left: `${ChartDisplay.splitLineX}%` }}><div className="absolute top-1 left-1 text-[9px] text-slate-400 font-mono whitespace-nowrap bg-slate-100/80 dark:bg-slate-800/80 px-1 rounded pointer-events-none">Scale Change</div></div>
                                {ChartDisplay.yTicks.map((tick, i) => ( <div key={`yg-${i}`} className="absolute w-full border-b border-slate-200 dark:border-slate-700/50" style={{ bottom: `${tick.yPercent}%` }} /> ))}
                                <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
                                    <path d={ChartDisplay.path1} fill="none" stroke={ChartDisplay.color1} strokeWidth="3" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d={ChartDisplay.path2} fill="none" stroke={ChartDisplay.color2} strokeWidth="3" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                                {ChartDisplay.points1.map((p, i) => ( <div key={`p1-${i}`} className="absolute w-2.5 h-2.5 rounded-full -ml-[5px] -mt-[5px] pointer-events-none border border-white dark:border-slate-800" style={{ left: `${p.x}%`, top: `${p.y}%`, backgroundColor: ChartDisplay.color1, boxShadow: '0 0 2px rgba(0,0,0,0.3)' }} /> ))}
                                {ChartDisplay.points2.map((p, i) => ( <div key={`p2-${i}`} className="absolute w-2.5 h-2.5 rounded-full -ml-[5px] -mt-[5px] pointer-events-none border border-white dark:border-slate-800" style={{ left: `${p.x}%`, top: `${p.y}%`, backgroundColor: ChartDisplay.color2, boxShadow: '0 0 2px rgba(0,0,0,0.3)' }} /> ))}
                                {cursorPercent !== null && ( <div className="absolute top-0 bottom-0 border-l border-slate-500 border-dashed pointer-events-none" style={{ left: `${cursorPercent}%` }} /> )}
                            </div>
                            <div className="absolute bottom-0 left-0 right-0 h-10">
                                {ChartDisplay.xTicks.map((tick, i) => ( <div key={`x-${i}`} className="absolute transform -translate-x-1/2 text-[10px] md:text-xs font-bold text-slate-500 font-mono text-center top-3" style={{ left: `${tick.xPercent}%` }}>#{tick.label}</div> ))}
                            </div>
                            {hoveredRank !== null && cursorPercent !== null && ChartDisplay.tooltipValues && (
                                <div className="absolute top-0 bottom-0 border-l border-slate-500 border-dashed pointer-events-none" style={{ left: `${cursorPercent}%` }} />
                            )}
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        {ChartDisplay.trendStats.map((stat, idx) => (
                            <div key={idx} className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-center mb-2 border-b border-slate-100 dark:border-slate-700/50 pb-1"><span className="text-xs font-bold text-slate-500 dark:text-slate-400">{stat.range}</span></div>
                                <div className="space-y-2">
                                    <div className="flex flex-col text-xs"><span className="text-slate-400 mb-0.5">{UI_TEXT.eventComparison.chart.steepness}</span><div className="flex items-center gap-1">{stat.steepnessWinner !== 'equal' && (<div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: stat.steepnessWinner === 'A' ? ChartDisplay.color1 : ChartDisplay.color2 }}></div>)}<span className="font-bold truncate" style={{ color: stat.steepnessWinner === 'A' ? ChartDisplay.color1 : (stat.steepnessWinner === 'B' ? ChartDisplay.color2 : '#94a3b8') }}>{stat.steepnessWinner === 'A' ? comparisonData.event1?.name : (stat.steepnessWinner === 'B' ? comparisonData.event2?.name : '—')}</span></div></div>
                                    <div className="flex flex-col text-xs"><span className="text-slate-400 mb-0.5">{UI_TEXT.eventComparison.chart.avgScore}</span><div className="flex items-center gap-1">{stat.scoreWinner !== 'equal' && (<div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: stat.scoreWinner === 'A' ? ChartDisplay.color1 : ChartDisplay.color2 }}></div>)}<span className="font-bold truncate" style={{ color: stat.scoreWinner === 'A' ? ChartDisplay.color1 : (stat.scoreWinner === 'B' ? ChartDisplay.color2 : '#94a3b8') }}>{stat.scoreWinner === 'A' ? comparisonData.event1?.name : (stat.scoreWinner === 'B' ? comparisonData.event2?.name : '—')}</span></div></div>
                                    <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-700/30 text-[11px] leading-tight text-slate-600 dark:text-slate-300 font-medium">{stat.evaluation}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default EventComparisonView;
