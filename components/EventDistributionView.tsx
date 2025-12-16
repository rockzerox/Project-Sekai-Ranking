
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { EventSummary } from '../types';
import { EVENT_DETAILS, UNITS, UNIT_ORDER, CHARACTERS, BANNER_ORDER, API_BASE_URL, getAssetUrl } from '../constants';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';

// --- Types ---

type FilterType = 'all' | 'character' | 'unit';
type StoryType = 'all' | 'unit_event' | 'mixed_event' | 'world_link';

interface FilterState {
    type: FilterType;
    value: string; // Character Name or Unit Name or 'all'
    storyType: StoryType;
}

interface ProcessedEvent extends EventSummary {
    startDate: Date;
    endDate: Date;
    bannerChar: string;
    unit: string;
    storyType: string;
    unitColor: string; // Color when viewing by Unit
    charColor: string; // Color when viewing by Character (Default)
}

// --- Helper Functions ---

const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();

// --- Component ---

const EventDistributionView: React.FC = () => {
    const [events, setEvents] = useState<ProcessedEvent[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // Filters
    const [filter, setFilter] = useState<FilterState>({
        type: 'all',
        value: 'all',
        storyType: 'all'
    });

    // --- 1. Data Fetching & Processing ---
    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/event/list`);
                if (!res.ok) throw new Error('Failed to fetch event list');
                const rawEvents: EventSummary[] = await res.json();

                const now = new Date();
                
                const processed = rawEvents
                    .filter(e => {
                        // Exclude future events
                        const start = new Date(e.start_at);
                        return start <= now;
                    })
                    .map(e => {
                        const details = EVENT_DETAILS[e.id];
                        const bannerChar = details?.banner || 'Unknown';
                        const unitName = details?.unit || 'Mix';
                        
                        // Calculate Both Colors
                        const unitColor = UNITS[unitName]?.color || '#94a3b8';
                        const charColor = CHARACTERS[bannerChar]?.color || '#94a3b8';

                        return {
                            ...e,
                            startDate: new Date(e.start_at),
                            endDate: new Date(e.aggregate_at), // Use aggregate_at as visual end for active play
                            bannerChar,
                            unit: unitName,
                            storyType: details?.storyType || 'mixed_event',
                            unitColor,
                            charColor
                        };
                    })
                    .sort((a, b) => a.id - b.id); // Sort by ID Ascending (Oldest First)

                setEvents(processed);
                setIsLoading(false);
            } catch (err) {
                console.error(err);
                setError('無法載入活動資料');
                setIsLoading(false);
            }
        };

        fetchEvents();
    }, []);

    // Scroll to bottom on load (to see latest events)
    useEffect(() => {
        if (!isLoading && scrollContainerRef.current) {
            scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
        }
    }, [isLoading, events]); // Runs when events are loaded

    // --- 2. Grid Generation Logic (Oldest Top -> Newest Bottom) ---
    const { months, gridData } = useMemo(() => {
        if (events.length === 0) return { months: [], gridData: {} };

        // Determine Range based on ALL events (to keep grid stable even if filtered)
        const firstEventDate = events[0].startDate; // Oldest (index 0 because we sorted ASC)
        const lastEventDate = events[events.length - 1].startDate; // Newest

        const monthsList: string[] = [];
        
        // Start from Oldest Year/Month
        const current = new Date(firstEventDate.getFullYear(), firstEventDate.getMonth(), 1);
        // End at Newest Year/Month
        const end = new Date(lastEventDate.getFullYear(), lastEventDate.getMonth(), 1);

        while (current <= end) {
            const yearStr = current.getFullYear();
            const monthStr = String(current.getMonth() + 1).padStart(2, '0');
            monthsList.push(`${yearStr}/${monthStr}`);
            current.setMonth(current.getMonth() + 1);
        }

        // Create Grid Lookup: Map "YYYY/MM/DD" -> Event
        const grid: Record<string, ProcessedEvent> = {};
        
        events.forEach(event => {
            const s = new Date(event.startDate);
            const e = new Date(event.endDate);
            
            // Loop through event days
            for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
                const key = `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
                grid[key] = event;
            }
        });

        return { months: monthsList, gridData: grid };
    }, [events]);

    // --- 3. Filtering Logic ---
    const isMatch = (event: ProcessedEvent) => {
        // 1. Story Type Check
        if (filter.storyType !== 'all' && event.storyType !== filter.storyType) {
            return false;
        }

        // 2. Character / Unit Check
        if (filter.type === 'character') {
            return event.bannerChar === filter.value;
        }
        if (filter.type === 'unit') {
            return event.unit === filter.value;
        }

        return true;
    };

    // --- 4. Statistics Calculation ---
    const stats = useMemo(() => {
        const filteredEvents = events.filter(isMatch);
        
        // 1. General Stats
        const totalCount = filteredEvents.length;
        const unitCount = filteredEvents.filter(e => e.storyType === 'unit_event').length;
        const mixedCount = filteredEvents.filter(e => e.storyType === 'mixed_event').length;
        const wlCount = filteredEvents.filter(e => e.storyType === 'world_link').length;

        // 2. Advanced Stats (Only if Character selected)
        let maxInterval = 0;
        let minInterval = Infinity; // Initialize with Infinity
        let charUnitCount = 0;
        let charMixedCount = 0;

        if (filter.type === 'character') {
            const charName = filter.value;
            const charEvents = events.filter(e => e.bannerChar === charName);
            
            charUnitCount = charEvents.filter(e => e.storyType === 'unit_event').length;
            charMixedCount = charEvents.filter(e => e.storyType === 'mixed_event').length;

            // Calculate Intervals between UNIT events
            const unitEvents = charEvents
                .filter(e => e.storyType === 'unit_event')
                .sort((a, b) => a.startDate.getTime() - b.startDate.getTime());

            if (unitEvents.length >= 2) {
                for (let i = 0; i < unitEvents.length - 1; i++) {
                    const currentStart = unitEvents[i].startDate.getTime();
                    const nextStart = unitEvents[i+1].startDate.getTime();
                    // Difference in Days
                    const diffDays = Math.round((nextStart - currentStart) / (1000 * 60 * 60 * 24));
                    
                    if (diffDays > maxInterval) maxInterval = diffDays;
                    if (diffDays < minInterval) minInterval = diffDays;
                }
            } else {
                minInterval = 0; // No intervals if less than 2 events
            }
        }

        if (minInterval === Infinity) minInterval = 0;

        return {
            totalCount,
            unitCount,
            mixedCount,
            wlCount,
            charUnitCount,
            charMixedCount,
            maxInterval,
            minInterval
        };
    }, [events, filter]);


    // --- Handlers ---
    const handleCharSelect = (char: string) => {
        if (filter.type === 'character' && filter.value === char) {
            setFilter(prev => ({ ...prev, type: 'all', value: 'all' }));
        } else {
            setFilter(prev => ({ ...prev, type: 'character', value: char }));
        }
    };

    const handleUnitSelect = (unit: string) => {
        if (filter.type === 'unit' && filter.value === unit) {
            setFilter(prev => ({ ...prev, type: 'all', value: 'all' }));
        } else {
            setFilter(prev => ({ ...prev, type: 'unit', value: unit }));
        }
    };

    const handleStorySelect = (type: StoryType) => {
        setFilter(prev => ({ ...prev, storyType: type }));
    };

    if (isLoading) return <LoadingSpinner />;
    if (error) return <ErrorMessage message={error} />;

    return (
        <div className="w-full animate-fadeIn pb-4">
            <div className="mb-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-2 mb-2">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">活動分布概況</h2>
                    <div className="flex items-center gap-2 bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400 px-2 py-1 rounded text-xs">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        <span className="font-bold">手機版建議橫向觀看體驗最佳</span>
                    </div>
                </div>
            </div>

            {/* --- Filter Controls --- */}
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-3 mb-4 shadow-sm space-y-3">
                {/* 1. Character Filter */}
                <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">角色 (Character)</span>
                    <div className="flex flex-wrap gap-1.5">
                        {BANNER_ORDER.map(char => {
                            const isSelected = filter.type === 'character' && filter.value === char;
                            const isDimmed = filter.type === 'unit';
                            
                            return (
                                <button
                                    key={char}
                                    onClick={() => handleCharSelect(char)}
                                    disabled={isDimmed}
                                    title={char}
                                    className={`
                                        w-8 h-8 rounded-full border-2 transition-all duration-200 relative overflow-hidden group
                                        ${isSelected ? 'ring-2 ring-cyan-500 ring-offset-1 dark:ring-offset-slate-800 scale-110 z-10' : 'border-transparent opacity-80 hover:opacity-100 hover:scale-105'}
                                        ${isDimmed ? 'opacity-20 grayscale cursor-not-allowed' : ''}
                                    `}
                                    style={{ borderColor: isSelected ? CHARACTERS[char].color : 'transparent' }}
                                >
                                    <img 
                                        src={getAssetUrl(char, 'character')} 
                                        alt={char} 
                                        className="w-full h-full object-cover"
                                        loading="lazy"
                                    />
                                    {isSelected && (
                                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="w-full h-px bg-slate-100 dark:bg-slate-700/50"></div>

                {/* 2. Unit & Story Type Filter (Grouped for compactness) */}
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex flex-col gap-1.5 flex-1">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">團體 (Unit)</span>
                        <div className="flex flex-wrap gap-2">
                             {UNIT_ORDER.map(unit => {
                                 if (unit === 'Mix') return null;
                                 const isSelected = filter.type === 'unit' && filter.value === unit;
                                 const isDimmed = filter.type === 'character';

                                 return (
                                    <button
                                        key={unit}
                                        onClick={() => handleUnitSelect(unit)}
                                        disabled={isDimmed}
                                        className={`
                                            h-6 px-1 rounded transition-all duration-200 flex items-center justify-center border
                                            ${isSelected ? 'bg-slate-100 dark:bg-slate-700 border-cyan-500 shadow-sm' : 'border-transparent hover:bg-slate-50 dark:hover:bg-slate-700/50'}
                                            ${isDimmed ? 'opacity-30 grayscale cursor-not-allowed' : ''}
                                        `}
                                    >
                                        <img 
                                            src={getAssetUrl(unit, 'unit')} 
                                            alt={unit} 
                                            className="h-full w-auto object-contain"
                                        />
                                        {isSelected && <div className="ml-1 w-1.5 h-1.5 rounded-full bg-cyan-500"></div>}
                                    </button>
                                 );
                             })}
                        </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">類型 (Type)</span>
                        <div className="flex flex-wrap gap-1.5">
                            {[
                                { id: 'all', label: 'All' },
                                { id: 'unit_event', label: '箱' },
                                { id: 'mixed_event', label: '混' },
                                { id: 'world_link', label: 'WL' }
                            ].map(type => (
                                <button
                                    key={type.id}
                                    onClick={() => handleStorySelect(type.id as StoryType)}
                                    className={`
                                        px-2 py-1 rounded text-[10px] font-bold border transition-all flex items-center gap-1
                                        ${filter.storyType === type.id 
                                            ? 'bg-slate-700 text-white dark:bg-white dark:text-slate-900 border-transparent' 
                                            : 'bg-transparent text-slate-500 dark:text-slate-400 border-slate-300 dark:border-slate-600 hover:border-slate-500'
                                        }
                                    `}
                                >
                                    {type.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* --- Main Visualization (Grid) --- */}
            {/* Wrapper for Fixed Height Scroll */}
            <div 
                className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm overflow-hidden mb-4 flex flex-col"
                style={{ height: '60vh', minHeight: '400px' }}
            >
                {/* Fixed Header */}
                <div className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 pr-2"> {/* pr-2 for scrollbar offset */}
                    <div className="grid grid-cols-[40px_repeat(31,_1fr)] sm:grid-cols-[80px_repeat(31,_minmax(0,_1fr))] gap-0.5 sm:gap-1 py-1">
                        <div className="text-[9px] sm:text-xs font-bold text-slate-400 flex items-end justify-end pb-1 pr-1 sm:pr-2">Date</div>
                        {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                            <div key={day} className={`text-[8px] sm:text-[10px] text-center text-slate-400 font-mono ${day % 5 !== 0 && day !== 1 && day !== 31 ? 'hidden sm:block' : ''}`}>
                                {String(day).padStart(2, '0')}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Scrollable Body */}
                <div 
                    ref={scrollContainerRef}
                    className="overflow-y-auto custom-scrollbar flex-1 p-1 sm:p-2"
                >
                    <div className="space-y-0.5 sm:space-y-1">
                        {months.map(month => {
                            const [yearStr, monthStr] = month.split('/');
                            const year = parseInt(yearStr);
                            const m = parseInt(monthStr); // 1-12
                            const daysInMonth = getDaysInMonth(year, m - 1);
                            
                            return (
                                <div key={month} className="grid grid-cols-[40px_repeat(31,_1fr)] sm:grid-cols-[80px_repeat(31,_minmax(0,_1fr))] gap-0.5 sm:gap-1 items-center hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors rounded p-0.5">
                                    {/* Y-Axis Label */}
                                    <div className="text-[9px] sm:text-xs font-bold text-slate-600 dark:text-slate-300 text-right pr-1 sm:pr-2 font-mono leading-tight">
                                        <span className="sm:hidden">{month.substring(2)}</span> {/* Mobile: 23/01 */}
                                        <span className="hidden sm:inline">{month}</span> {/* Desktop: 2023/01 */}
                                    </div>

                                    {/* Day Cells */}
                                    {Array.from({ length: 31 }, (_, i) => i + 1).map(day => {
                                        if (day > daysInMonth) {
                                            return <div key={day} className="h-4 sm:h-6 bg-transparent" />; // Invalid Date
                                        }

                                        const dateKey = `${year}/${monthStr}/${String(day).padStart(2, '0')}`;
                                        const event = gridData[dateKey];
                                        
                                        // Render Logic
                                        let cellClass = "bg-slate-100 dark:bg-slate-700/50";
                                        let style: React.CSSProperties = {};
                                        let title = "";

                                        if (event) {
                                            const matches = isMatch(event);
                                            title = `${event.name} (${event.unit !== 'Mix' ? event.unit : event.bannerChar})`;
                                            
                                            // Determine Display Color based on Filter Mode
                                            let displayColor = event.charColor; // Default to Character Color

                                            if (filter.type === 'unit') {
                                                displayColor = event.unitColor;
                                            } else if (filter.type === 'character') {
                                                displayColor = event.charColor;
                                            } else {
                                                // Default (All)
                                                // If World Link, force Unit Color. Otherwise Character Color.
                                                if (event.storyType === 'world_link') {
                                                    displayColor = event.unitColor;
                                                } else {
                                                    displayColor = event.charColor;
                                                }
                                            }

                                            if (matches) {
                                                // Active & Match
                                                style = { backgroundColor: displayColor };
                                                cellClass = "opacity-100 shadow-sm scale-105 z-10 rounded-[1px] sm:rounded-sm";
                                            } else {
                                                // Active but No Match (Dimmed)
                                                style = { backgroundColor: displayColor };
                                                cellClass = "opacity-20 grayscale brightness-50";
                                            }
                                        }

                                        return (
                                            <div 
                                                key={day}
                                                title={title}
                                                className={`h-4 sm:h-6 w-full rounded-[1px] sm:rounded-[2px] transition-all duration-200 cursor-default ${cellClass}`}
                                                style={style}
                                            />
                                        );
                                    })}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* --- Compact Statistics Footer --- */}
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
                
                {/* Left: General Stats */}
                <div className="flex gap-4 items-center text-xs">
                    <div className="flex flex-col">
                        <span className="text-[10px] text-slate-400 font-bold uppercase">總期數</span>
                        <span className="text-lg font-mono font-bold text-slate-700 dark:text-slate-200">{stats.totalCount}</span>
                    </div>
                    <div className="h-6 w-px bg-slate-200 dark:bg-slate-700"></div>
                    <div className="flex gap-3">
                        <div className="flex flex-col items-center">
                            <span className="text-[9px] text-cyan-600 dark:text-cyan-400 font-bold">箱活</span>
                            <span className="font-mono font-bold text-slate-600 dark:text-slate-300">{stats.unitCount}</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <span className="text-[9px] text-pink-500 font-bold">混活</span>
                            <span className="font-mono font-bold text-slate-600 dark:text-slate-300">{stats.mixedCount}</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <span className="text-[9px] text-emerald-500 font-bold">WL</span>
                            <span className="font-mono font-bold text-slate-600 dark:text-slate-300">{stats.wlCount}</span>
                        </div>
                    </div>
                </div>

                {/* Right: Character Specific Stats (Only if Char selected) */}
                {filter.type === 'character' && (
                    <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-900/50 px-3 py-1.5 rounded-lg border border-slate-100 dark:border-slate-700 w-full sm:w-auto overflow-hidden relative">
                        <div className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: CHARACTERS[filter.value]?.color }}></div>
                        
                        <div className="flex flex-col">
                            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">
                                {filter.value} 統計
                            </span>
                            <div className="flex items-baseline gap-3 text-xs">
                                <div>
                                    <span className="text-slate-500 mr-1">箱:</span>
                                    <span className="font-bold">{stats.charUnitCount}</span>
                                </div>
                                <div>
                                    <span className="text-slate-500 mr-1">混:</span>
                                    <span className="font-bold">{stats.charMixedCount}</span>
                                </div>
                            </div>
                        </div>

                        <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>

                        <div className="flex flex-col flex-1">
                            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">箱活間隔 (天)</span>
                            <div className="flex items-center gap-3 text-xs font-mono">
                                <div title="最小間隔">
                                    <span className="text-emerald-500 font-bold mr-1">Min:</span>
                                    <span className="font-bold">{stats.minInterval}</span>
                                </div>
                                <div title="最大間隔">
                                    <span className="text-rose-500 font-bold mr-1">Max:</span>
                                    <span className="font-bold">{stats.maxInterval}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default EventDistributionView;
