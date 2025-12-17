
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
    unitColor: string;
    charColor: string;
}

// --- Constants: Unit Member Mapping ---
// Manually mapping members to units for the dashboard display
const UNIT_MEMBERS_MAP: Record<string, string[]> = {
    "Leo/need": ["星乃一歌", "天馬咲希", "望月穗波", "日野森志步"],
    "MORE MORE JUMP!": ["花里實乃理", "桐谷遙", "桃井愛莉", "日野森雫"],
    "Vivid BAD SQUAD": ["小豆澤心羽", "白石杏", "東雲彰人", "青柳冬彌"],
    "Wonderlands × Showtime": ["天馬司", "鳳笑夢", "草薙寧寧", "神代類"],
    "25點，Nightcord見。": ["宵崎奏", "朝比奈真冬", "東雲繪名", "曉山瑞希"],
    "Virtual Singer": ["初音未來", "鏡音鈴", "鏡音連", "巡音流歌", "MEIKO", "KAITO"],
    "Mix": []
};

// Helper to find which unit a character belongs to
const getUnitByChar = (charName: string): string => {
    for (const [unit, members] of Object.entries(UNIT_MEMBERS_MAP)) {
        if (members.includes(charName)) return unit;
    }
    return "Mix";
};

const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();

// --- Tooltip Component ---
const HoverTooltip: React.FC<{ 
    event: ProcessedEvent | null; 
    position: { x: number, y: number } | null; 
}> = ({ event, position }) => {
    if (!event || !position) return null;

    const logoUrl = getAssetUrl(event.id.toString(), 'event');

    // Calculate position to keep it on screen (simplified)
    const style: React.CSSProperties = {
        top: position.y + 20,
        left: Math.min(window.innerWidth - 220, position.x + 10), // Prevent overflow right
    };

    return (
        <div 
            className="fixed z-50 bg-slate-900/95 text-white p-3 rounded-xl shadow-xl border border-slate-700 pointer-events-none backdrop-blur-sm animate-fadeIn w-56 flex flex-col gap-2"
            style={style}
        >
            <div className="flex justify-between items-start border-b border-slate-700/50 pb-2 mb-1">
                <span className="text-xs font-mono text-cyan-400 font-bold">#{event.id}</span>
                <span className="text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                    {event.startDate.toLocaleDateString(undefined, {month:'numeric', day:'numeric'})}
                </span>
            </div>
            
            {logoUrl ? (
                <div className="w-full bg-white/5 rounded p-1 flex justify-center">
                    <img 
                        src={logoUrl} 
                        alt="logo" 
                        className="h-12 w-auto object-contain" 
                        onError={(e) => e.currentTarget.style.display = 'none'} 
                    />
                </div>
            ) : null}

            <div className="font-bold text-sm leading-tight text-slate-200">
                {event.name}
            </div>
            
            <div className="flex items-center gap-2 mt-1">
                <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: event.unitColor }}></div>
                <span className="text-[10px] text-slate-400">{event.unit}</span>
            </div>
        </div>
    );
};

// --- Main Component ---

const EventDistributionView: React.FC = () => {
    const [events, setEvents] = useState<ProcessedEvent[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    // Time Window State
    const [scrollIndex, setScrollIndex] = useState(0); // 0 = Oldest Month
    const VIEWPORT_MONTHS = 12;

    // Tooltip State
    const [hoveredEvent, setHoveredEvent] = useState<ProcessedEvent | null>(null);
    const [tooltipPos, setTooltipPos] = useState<{x: number, y: number} | null>(null);

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
                        const start = new Date(e.start_at);
                        return start <= now;
                    })
                    .map(e => {
                        const details = EVENT_DETAILS[e.id];
                        const bannerChar = details?.banner || 'Unknown';
                        const unitName = details?.unit || 'Mix';
                        
                        const unitColor = UNITS[unitName]?.color || '#94a3b8';
                        const charColor = CHARACTERS[bannerChar]?.color || '#94a3b8';

                        return {
                            ...e,
                            startDate: new Date(e.start_at),
                            endDate: new Date(e.aggregate_at),
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

    // --- 2. Grid & Time Window Logic ---
    const { allMonths, gridData } = useMemo(() => {
        if (events.length === 0) return { allMonths: [], gridData: {} };

        // Calculate Full Range
        const firstEventDate = events[0].startDate;
        const lastEventDate = events[events.length - 1].startDate; // Latest event start date

        const monthsList: string[] = [];
        
        const current = new Date(firstEventDate.getFullYear(), firstEventDate.getMonth(), 1);
        const end = new Date(lastEventDate.getFullYear(), lastEventDate.getMonth(), 1);
        
        // Add one more month buffer at end
        end.setMonth(end.getMonth() + 1);

        while (current <= end) {
            const yearStr = current.getFullYear();
            const monthStr = String(current.getMonth() + 1).padStart(2, '0');
            monthsList.push(`${yearStr}/${monthStr}`);
            current.setMonth(current.getMonth() + 1);
        }

        const grid: Record<string, ProcessedEvent> = {};
        events.forEach(event => {
            const s = new Date(event.startDate);
            const e = new Date(event.endDate);
            for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
                const key = `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
                grid[key] = event;
            }
        });

        return { allMonths: monthsList, gridData: grid };
    }, [events]);

    // Initialize scroll to the bottom (latest months) when data loads
    useEffect(() => {
        if (allMonths.length > VIEWPORT_MONTHS) {
            setScrollIndex(allMonths.length - VIEWPORT_MONTHS);
        }
    }, [allMonths.length]);

    // Derived Visible Months
    const visibleMonths = useMemo(() => {
        return allMonths.slice(scrollIndex, scrollIndex + VIEWPORT_MONTHS);
    }, [allMonths, scrollIndex]);

    const handleWheel = (e: React.WheelEvent) => {
        const maxIndex = Math.max(0, allMonths.length - VIEWPORT_MONTHS);
        if (maxIndex === 0) return;

        // Scroll direction
        const direction = e.deltaY > 0 ? 1 : -1;
        
        setScrollIndex(prev => {
            const next = prev + direction;
            return Math.max(0, Math.min(next, maxIndex));
        });
    };

    const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseInt(e.target.value);
        setScrollIndex(val);
    };

    // --- 3. Filtering Logic ---
    const isMatch = (event: ProcessedEvent) => {
        if (filter.storyType !== 'all' && event.storyType !== filter.storyType) return false;
        if (filter.type === 'character') return event.bannerChar === filter.value;
        if (filter.type === 'unit') return event.unit === filter.value;
        return true;
    };

    // --- 4. Statistics Calculation ---
    const stats = useMemo(() => {
        const filteredEvents = events.filter(isMatch);
        
        const totalCount = filteredEvents.length;
        const unitCount = filteredEvents.filter(e => e.storyType === 'unit_event').length;
        const mixedCount = filteredEvents.filter(e => e.storyType === 'mixed_event').length;
        const wlCount = filteredEvents.filter(e => e.storyType === 'world_link').length;

        let maxInterval = 0;
        let minInterval = Infinity;
        let charUnitCount = 0;
        let charMixedCount = 0;

        // Only calculate intervals if Character is selected
        if (filter.type === 'character') {
            const charName = filter.value;
            const charEvents = events.filter(e => e.bannerChar === charName);
            
            charUnitCount = charEvents.filter(e => e.storyType === 'unit_event').length;
            charMixedCount = charEvents.filter(e => e.storyType === 'mixed_event').length;

            const unitEvents = charEvents
                .filter(e => e.storyType === 'unit_event')
                .sort((a, b) => a.startDate.getTime() - b.startDate.getTime());

            if (unitEvents.length >= 2) {
                for (let i = 0; i < unitEvents.length - 1; i++) {
                    const currentStart = unitEvents[i].startDate.getTime();
                    const nextStart = unitEvents[i+1].startDate.getTime();
                    const diffDays = Math.round((nextStart - currentStart) / (1000 * 60 * 60 * 24));
                    
                    if (diffDays > maxInterval) maxInterval = diffDays;
                    if (diffDays < minInterval) minInterval = diffDays;
                }
            } else {
                minInterval = 0;
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

    const handleCellEnter = (event: ProcessedEvent | undefined, e: React.MouseEvent) => {
        if (event) {
            setHoveredEvent(event);
            setTooltipPos({ x: e.clientX, y: e.clientY });
        }
    };

    const handleCellLeave = () => {
        setHoveredEvent(null);
        setTooltipPos(null);
    };

    if (isLoading) return <LoadingSpinner />;
    if (error) return <ErrorMessage message={error} />;

    return (
        <div className="w-full animate-fadeIn pb-4">
            <HoverTooltip event={hoveredEvent} position={tooltipPos} />

            <div className="mb-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-2 mb-2">
                    <div className="flex items-baseline gap-4">
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">活動分布概況</h2>
                        <span className="text-sm font-bold text-slate-500 dark:text-slate-400">
                            總計: <span className="font-mono text-cyan-600 dark:text-cyan-400 text-lg">{events.length}</span> 期
                        </span>
                    </div>
                    <div className="flex items-center gap-2 bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400 px-2 py-1 rounded text-xs">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        <span className="font-bold">手機版建議橫向觀看體驗最佳</span>
                    </div>
                </div>
            </div>

            {/* --- Filter Controls --- */}
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-3 mb-4 shadow-sm space-y-3">
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

            {/* --- Heatmap Visualization with Custom Scroller --- */}
            <div className="flex gap-2 h-[450px] mb-4 select-none">
                {/* 1. The Grid (Fixed Height, No Native Scroll) */}
                <div 
                    className="flex-1 bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm overflow-hidden flex flex-col"
                    onWheel={handleWheel}
                >
                    {/* Header */}
                    <div className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                        <div className="grid grid-cols-[40px_repeat(31,_1fr)] sm:grid-cols-[80px_repeat(31,_minmax(0,_1fr))] gap-0.5 sm:gap-1 py-1">
                            <div className="text-[9px] sm:text-xs font-bold text-slate-400 flex items-end justify-end pb-1 pr-1 sm:pr-2">Date</div>
                            {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                                <div key={day} className={`text-[8px] sm:text-[10px] text-center text-slate-400 font-mono ${day % 5 !== 0 && day !== 1 && day !== 31 ? 'hidden sm:block' : ''}`}>
                                    {String(day).padStart(2, '0')}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Body (12 Rows Fixed) */}
                    <div className="flex-1 p-1 sm:p-2 flex flex-col justify-between">
                        {visibleMonths.map(month => {
                            const [yearStr, monthStr] = month.split('/');
                            const year = parseInt(yearStr);
                            const m = parseInt(monthStr); 
                            const daysInMonth = getDaysInMonth(year, m - 1);
                            
                            return (
                                <div key={month} className="grid grid-cols-[40px_repeat(31,_1fr)] sm:grid-cols-[80px_repeat(31,_minmax(0,_1fr))] gap-0.5 sm:gap-1 items-center hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors rounded p-0.5 h-full">
                                    {/* Label */}
                                    <div className="text-[9px] sm:text-xs font-bold text-slate-600 dark:text-slate-300 text-right pr-1 sm:pr-2 font-mono leading-tight">
                                        <span className="sm:hidden">{month.substring(2)}</span>
                                        <span className="hidden sm:inline">{month}</span>
                                    </div>

                                    {/* Cells */}
                                    {Array.from({ length: 31 }, (_, i) => i + 1).map(day => {
                                        if (day > daysInMonth) return <div key={day} className="h-full bg-transparent" />;

                                        const dateKey = `${year}/${monthStr}/${String(day).padStart(2, '0')}`;
                                        const event = gridData[dateKey];
                                        
                                        let cellClass = "bg-slate-100 dark:bg-slate-700/50";
                                        let style: React.CSSProperties = {};

                                        if (event) {
                                            const matches = isMatch(event);
                                            let displayColor = event.charColor; 

                                            if (filter.type === 'unit') displayColor = event.unitColor;
                                            else if (filter.type === 'character') displayColor = event.charColor;
                                            else {
                                                if (event.storyType === 'world_link') displayColor = event.unitColor;
                                                else displayColor = event.charColor;
                                            }

                                            if (matches) {
                                                style = { backgroundColor: displayColor };
                                                cellClass = "opacity-100 shadow-sm rounded-[1px] sm:rounded-sm hover:ring-2 hover:ring-white z-10";
                                            } else {
                                                style = { backgroundColor: displayColor };
                                                cellClass = "opacity-20 grayscale brightness-50";
                                            }
                                        }

                                        return (
                                            <div 
                                                key={day}
                                                className={`h-full w-full rounded-[1px] sm:rounded-[2px] transition-all duration-100 cursor-default ${cellClass}`}
                                                style={style}
                                                onMouseEnter={(e) => handleCellEnter(event, e)}
                                                onMouseLeave={handleCellLeave}
                                            />
                                        );
                                    })}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* 2. Custom Scrollbar Control */}
                <div className="w-6 bg-slate-100 dark:bg-slate-800 rounded-full relative flex items-center justify-center border border-slate-200 dark:border-slate-700">
                    <input
                        type="range"
                        min="0"
                        max={Math.max(0, allMonths.length - VIEWPORT_MONTHS)}
                        step="1"
                        value={scrollIndex}
                        onChange={handleSliderChange}
                        className="w-[420px] h-6 origin-center -rotate-90 bg-transparent appearance-none cursor-pointer absolute"
                        style={{
                            WebkitAppearance: 'none',
                        }}
                    />
                    {/* Simple indicator arrows */}
                    <div className="absolute top-2 text-slate-400 pointer-events-none">▲</div>
                    <div className="absolute bottom-2 text-slate-400 pointer-events-none">▼</div>
                </div>
            </div>

            {/* --- Contextual Statistics Dashboard --- */}
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4 shadow-sm min-h-[80px] flex items-center">
                
                {/* Scenario A: General / All / Mixed / WL */}
                {(filter.type === 'all' || filter.value === 'all') && (
                    <div className="flex flex-col sm:flex-row gap-6 w-full items-center justify-center sm:justify-start">
                        <div className="flex items-center gap-2 border-r border-slate-200 dark:border-slate-700 pr-6">
                            <span className="text-xs text-slate-500 font-bold uppercase">目前顯示</span>
                            <span className="font-bold text-slate-700 dark:text-white">整體概況 (All)</span>
                        </div>
                        <div className="flex gap-6 text-sm">
                            <div className="flex flex-col items-center">
                                <span className="text-[10px] text-cyan-600 dark:text-cyan-400 font-bold">箱活 (Unit)</span>
                                <span className="font-mono font-bold text-2xl text-slate-700 dark:text-white leading-none">{stats.unitCount}</span>
                            </div>
                            <div className="flex flex-col items-center">
                                <span className="text-[10px] text-pink-500 font-bold">混活 (Mixed)</span>
                                <span className="font-mono font-bold text-2xl text-slate-700 dark:text-white leading-none">{stats.mixedCount}</span>
                            </div>
                            <div className="flex flex-col items-center">
                                <span className="text-[10px] text-emerald-500 font-bold">WL</span>
                                <span className="font-mono font-bold text-2xl text-slate-700 dark:text-white leading-none">{stats.wlCount}</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Scenario B: Unit or Character Selected */}
                {(filter.type === 'unit' || filter.type === 'character') && (
                    <div className="flex flex-col xl:flex-row gap-4 w-full items-start xl:items-center">
                        
                        {/* 1. Identity Section */}
                        <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-900/50 p-2 pr-4 rounded-lg border border-slate-100 dark:border-slate-700 w-full xl:w-auto">
                            {(() => {
                                // Determine current "Context Unit"
                                const contextUnitName = filter.type === 'unit' ? filter.value : getUnitByChar(filter.value);
                                const contextUnitConfig = UNITS[contextUnitName];
                                const members = UNIT_MEMBERS_MAP[contextUnitName] || [];
                                
                                // Unit Highlight Logic
                                const isUnitHighlit = filter.type === 'unit';
                                
                                return (
                                    <>
                                        {/* Unit Logo/Icon */}
                                        <div 
                                            className={`p-1.5 rounded transition-all ${isUnitHighlit ? 'bg-white dark:bg-slate-700 shadow-md ring-1 ring-slate-200 dark:ring-slate-600' : 'opacity-70 grayscale'}`}
                                        >
                                            <img 
                                                src={getAssetUrl(contextUnitName, 'unit')} 
                                                alt={contextUnitName} 
                                                className="h-8 w-auto object-contain"
                                            />
                                        </div>

                                        {/* Members List */}
                                        <div className="flex flex-wrap gap-1.5 pl-2 border-l border-slate-200 dark:border-slate-700">
                                            {members.map(memberName => {
                                                const isCharHighlit = filter.type === 'character' && filter.value === memberName;
                                                const charColor = CHARACTERS[memberName]?.color || '#999';
                                                
                                                return (
                                                    <div 
                                                        key={memberName}
                                                        className={`relative rounded-full transition-all duration-300 ${isCharHighlit ? 'ring-2 ring-offset-1 dark:ring-offset-slate-800 z-10 scale-110 shadow-lg' : 'opacity-60 grayscale hover:opacity-100 hover:grayscale-0'}`}
                                                        style={{ borderColor: isCharHighlit ? charColor : 'transparent', boxShadow: isCharHighlit ? `0 0 10px ${charColor}40` : 'none' }}
                                                    >
                                                        <img 
                                                            src={getAssetUrl(memberName, 'character')} 
                                                            alt={memberName} 
                                                            className="w-8 h-8 rounded-full border border-slate-100 dark:border-slate-700 bg-slate-200 object-cover"
                                                            title={memberName}
                                                        />
                                                        {isCharHighlit && (
                                                            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center shadow-sm">
                                                                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: charColor }}></div>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </>
                                );
                            })()}
                        </div>

                        {/* 2. Stats Section */}
                        <div className="flex-1 flex flex-col sm:flex-row gap-4 sm:gap-8 items-start sm:items-center w-full px-2">
                            {/* Counts */}
                            <div className="flex gap-6 text-sm">
                                <div className="flex flex-col">
                                    <span className="text-[10px] text-slate-400 font-bold uppercase">總期數</span>
                                    <span className="font-mono font-bold text-xl dark:text-white">{stats.totalCount}</span>
                                </div>
                                <div className="h-8 w-px bg-slate-200 dark:bg-slate-700"></div>
                                {filter.type === 'unit' ? (
                                    <>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] text-cyan-600 dark:text-cyan-400 font-bold">箱活總數</span>
                                            <span className="font-mono font-bold text-xl dark:text-white">{stats.unitCount}</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] text-emerald-500 font-bold">WL</span>
                                            <span className="font-mono font-bold text-xl dark:text-white">{stats.wlCount}</span>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] text-cyan-600 dark:text-cyan-400 font-bold">個人箱活</span>
                                            <span className="font-mono font-bold text-xl dark:text-white">{stats.charUnitCount}</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] text-pink-500 font-bold">個人混活</span>
                                            <span className="font-mono font-bold text-xl dark:text-white">{stats.charMixedCount}</span>
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Interval Stats (Only for Character) */}
                            {filter.type === 'character' && (
                                <div className="flex-1 w-full bg-slate-50 dark:bg-slate-900/50 rounded-lg p-2 border border-slate-100 dark:border-slate-700 flex items-center justify-between sm:justify-around">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-2">箱活間隔</span>
                                    <div className="flex gap-4">
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-xs text-emerald-500 font-bold">Min</span>
                                            <span className="font-mono font-bold text-lg dark:text-white">{stats.minInterval}</span>
                                            <span className="text-[10px] text-slate-400">天</span>
                                        </div>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-xs text-rose-500 font-bold">Max</span>
                                            <span className="font-mono font-bold text-lg dark:text-white">{stats.maxInterval}</span>
                                            <span className="text-[10px] text-slate-400">天</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default EventDistributionView;
