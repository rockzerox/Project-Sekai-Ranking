
import React, { useState, useEffect, useMemo } from 'react';
import { EventSummary } from '../types';
import { UNIT_MASTER, UNIT_ORDER, CHARACTER_MASTER, API_BASE_URL, getAssetUrl, getChar, getUnit } from '../constants';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';
import { useConfig } from '../contexts/ConfigContext';

// --- Types ---

type FilterType = 'all' | 'character' | 'unit';
type StoryType = 'all' | 'unit_event' | 'mixed_event' | 'world_link';

interface FilterState {
    type: FilterType;
    value: string; // 儲存 ID (例如 "1") 或 Unit Name
    storyType: StoryType;
}

interface ProcessedEvent extends EventSummary {
    startDate: Date;
    endDate: Date;
    bannerCharId: string;
    bannerCharName: string;
    unit: string;
    storyType: string;
    cardType: string;
    unitColor: string;
    charColor: string;
}

interface MonthSegment {
    event: ProcessedEvent;
    left: number; // 基於 31 天網格的百分比
    width: number; // 基於 31 天網格的百分比
}

const getCardTypeInfo = (type: string) => {
    switch(type) {
        case 'permanent': return { label: '常駐', className: 'bg-slate-600 text-white' };
        case 'limited': return { label: '限定', className: 'bg-rose-500 text-white' };
        case 'special_limited': return { label: '特殊限定', className: 'bg-purple-500 text-white' };
        default: return { label: '一般', className: 'bg-slate-500 text-white' };
    }
};

const HoverTooltip: React.FC<{ 
    event: ProcessedEvent | null; 
    position: { x: number, y: number } | null;
    filterType: FilterType;
}> = ({ event, position, filterType }) => {
    if (!event || !position) return null;

    const logoUrl = getAssetUrl(event.id.toString(), 'event');
    const cardTypeInfo = getCardTypeInfo(event.cardType);
    const formatDate = (date: Date) => date.toLocaleDateString(undefined, {month:'numeric', day:'numeric', hour:'2-digit', minute:'2-digit'});
    const dateRange = `${formatDate(event.startDate)} - ${formatDate(event.endDate)}`;

    let nameColor = (filterType === 'unit') ? event.unitColor : event.charColor;
    if (filterType === 'all' && event.storyType === 'world_link') nameColor = event.unitColor;

    const TOOLTIP_WIDTH = 256;
    const TOOLTIP_HEIGHT = 200; 
    const OFFSET = 15;

    let left = position.x + OFFSET;
    let top = position.y + OFFSET;

    if (left + TOOLTIP_WIDTH > window.innerWidth) {
        left = position.x - TOOLTIP_WIDTH - OFFSET;
    }
    if (top + TOOLTIP_HEIGHT > window.innerHeight) {
        top = position.y - TOOLTIP_HEIGHT - OFFSET;
    }
    
    left = Math.max(10, left);
    top = Math.max(10, top);

    return (
        <div 
            className="fixed z-50 bg-slate-900/95 text-white p-3 rounded-xl shadow-2xl border border-slate-700 pointer-events-none backdrop-blur-md animate-fadeIn w-64 flex flex-col gap-2"
            style={{ top, left }}
        >
            <div className="flex justify-between items-center border-b border-slate-700/50 pb-2 mb-1">
                <span className="text-xs font-mono text-cyan-400 font-bold">#{event.id}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${cardTypeInfo.className}`}>
                    {cardTypeInfo.label}
                </span>
            </div>
            
            {logoUrl && (
                <div className="w-full bg-white/5 rounded p-1 flex justify-center">
                    <img src={logoUrl} alt="logo" className="h-14 w-auto object-contain" onError={(e) => e.currentTarget.style.display = 'none'} />
                </div>
            )}

            <div className="font-bold text-sm leading-tight" style={{ color: nameColor }}>{event.name}</div>
            
            <div className="flex flex-col gap-1 mt-1">
                <div className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: event.unitColor }}></div>
                    <span className="text-[10px] text-slate-400">{event.unit} • {event.bannerCharName}</span>
                </div>
                <span className="text-[10px] font-mono text-cyan-500/80 bg-slate-800/50 px-2 py-1 rounded border border-slate-700/50">
                    {dateRange}
                </span>
            </div>
        </div>
    );
};

const EventDistributionView: React.FC = () => {
    const { eventDetails } = useConfig();
    const [events, setEvents] = useState<ProcessedEvent[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    const [scrollIndex, setScrollIndex] = useState(0); 
    const VIEWPORT_MONTHS = 12;

    const [hoveredEvent, setHoveredEvent] = useState<ProcessedEvent | null>(null);
    const [tooltipPos, setTooltipPos] = useState<{x: number, y: number} | null>(null);

    const [filter, setFilter] = useState<FilterState>({
        type: 'all', value: 'all', storyType: 'all'
    });

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/event/list`);
                if (!res.ok) throw new Error('Failed');
                const rawEvents: EventSummary[] = await res.json();
                const now = new Date();
                
                const processed = rawEvents
                    .filter(e => new Date(e.start_at) <= now)
                    .map(e => {
                        const details = eventDetails[e.id];
                        const char = getChar(details?.banner || "");
                        const unit = getUnit(details?.unit || "Mix");

                        return {
                            ...e,
                            startDate: new Date(e.start_at),
                            endDate: new Date(e.aggregate_at),
                            bannerCharId: char?.id || "",
                            bannerCharName: char?.name || "Unknown",
                            unit: unit?.name || "Mix",
                            storyType: details?.storyType || 'mixed_event',
                            cardType: details?.cardType || 'permanent',
                            unitColor: unit?.color || '#94a3b8',
                            charColor: char?.color || '#94a3b8'
                        };
                    })
                    .sort((a, b) => a.id - b.id);

                setEvents(processed);
                setIsLoading(false);
            } catch (err) {
                setError('無法載入活動資料');
                setIsLoading(false);
            }
        };
        if (Object.keys(eventDetails).length > 0) fetchEvents();
    }, [eventDetails]);

    const { allMonths, monthlySegments } = useMemo(() => {
        if (events.length === 0) return { allMonths: [], monthlySegments: {} };

        const firstDate = events[0].startDate;
        const lastDate = events[events.length - 1].startDate;
        const monthsList: string[] = [];
        
        let current = new Date(firstDate.getFullYear(), firstDate.getMonth(), 1);
        const end = new Date(lastDate.getFullYear(), lastDate.getMonth() + 1, 1);

        while (current <= end) {
            monthsList.push(`${current.getFullYear()}/${String(current.getMonth() + 1).padStart(2, '0')}`);
            current.setMonth(current.getMonth() + 1);
        }

        const segments: Record<string, MonthSegment[]> = {};
        monthsList.forEach(mKey => segments[mKey] = []);

        const MS_PER_DAY = 24 * 60 * 60 * 1000;

        events.forEach(event => {
            const eStart = event.startDate.getTime();
            const eEnd = event.endDate.getTime();

            monthsList.forEach(mKey => {
                const [y, m] = mKey.split('/').map(Number);
                const monthStart = new Date(y, m - 1, 1).getTime();
                const monthEnd = new Date(y, m, 1).getTime(); 

                const overlapStart = Math.max(eStart, monthStart);
                const overlapEnd = Math.min(eEnd, monthEnd);

                if (overlapStart < overlapEnd) {
                    const dayStartOffset = (overlapStart - monthStart) / MS_PER_DAY;
                    const dayDuration = (overlapEnd - overlapStart) / MS_PER_DAY;

                    segments[mKey].push({
                        event,
                        left: (dayStartOffset / 31) * 100,
                        width: (dayDuration / 31) * 100
                    });
                }
            });
        });

        return { allMonths: monthsList, monthlySegments: segments };
    }, [events]);

    const availableYears = useMemo(() => Array.from(new Set(allMonths.map(m => m.split('/')[0]))), [allMonths]);

    useEffect(() => {
        if (allMonths.length > VIEWPORT_MONTHS) setScrollIndex(allMonths.length - VIEWPORT_MONTHS);
    }, [allMonths.length]);

    const isMatch = (event: ProcessedEvent) => {
        if (filter.storyType !== 'all' && event.storyType !== filter.storyType) return false;
        if (filter.type === 'character') return event.bannerCharId === filter.value;
        if (filter.type === 'unit') return event.unit === filter.value;
        return true;
    };

    const stats = useMemo(() => {
        const filtered = events.filter(isMatch);
        const totalCount = filtered.length;
        const unitCount = filtered.filter(e => e.storyType === 'unit_event').length;
        const mixedCount = filtered.filter(e => e.storyType === 'mixed_event').length;
        const wlCount = filtered.filter(e => e.storyType === 'world_link').length;
        
        let maxInterval = 0, minInterval = Infinity, charUnitCount = 0, charMixedCount = 0;
        if (filter.type === 'character') {
            const charId = filter.value;
            const charEvents = events.filter(e => e.bannerCharId === charId);
            charUnitCount = charEvents.filter(e => e.storyType === 'unit_event').length;
            charMixedCount = charEvents.filter(e => e.storyType === 'mixed_event').length;
            const uEvents = charEvents.filter(e => e.storyType === 'unit_event').sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
            if (uEvents.length >= 2) {
                for (let i = 0; i < uEvents.length - 1; i++) {
                    const diff = Math.round((uEvents[i+1].startDate.getTime() - uEvents[i].startDate.getTime()) / 86400000);
                    if (diff > maxInterval) maxInterval = diff;
                    if (diff < minInterval) minInterval = diff;
                }
            } else minInterval = 0;
        }
        return { totalCount, unitCount, mixedCount, wlCount, charUnitCount, charMixedCount, maxInterval, minInterval: minInterval === Infinity ? 0 : minInterval };
    }, [events, filter]);

    const handleWheel = (e: React.WheelEvent) => {
        const max = Math.max(0, allMonths.length - VIEWPORT_MONTHS);
        if (max === 0) return;
        setScrollIndex(prev => {
            const step = e.deltaY > 0 ? 1 : -1;
            return Math.max(0, Math.min(prev + step, max));
        });
    };

    const jumpToYear = (year: string) => {
        let idx = allMonths.findIndex(m => m === `${year}/01`);
        if (idx === -1) idx = allMonths.findIndex(m => m.startsWith(year));
        if (idx !== -1) setScrollIndex(Math.min(idx, Math.max(0, allMonths.length - VIEWPORT_MONTHS)));
    };

    if (isLoading) return <LoadingSpinner />;
    if (error) return <ErrorMessage message={error} />;

    return (
        <div className="w-full animate-fadeIn pb-4">
            <HoverTooltip event={hoveredEvent} position={tooltipPos} filterType={filter.type} />

            <div className="mb-4 px-2 flex flex-col md:flex-row justify-between md:items-end gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-1">活動分布概況</h2>
                    <p className="text-slate-500 dark:text-slate-400">分析角色與團體的活動密集度與空窗期。</p>
                </div>
                <div className="flex flex-col items-start md:items-end">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">類型篩選</span>
                    <div className="flex gap-1.5">
                        {[{ id: 'all', label: 'ALL' }, { id: 'unit_event', label: '箱活' }, { id: 'mixed_event', label: '混活' }, { id: 'world_link', label: 'WL' }].map(t => (
                            <button key={t.id} onClick={() => setFilter(p => ({ ...p, storyType: t.id as any }))} className={`px-4 py-1.5 rounded-full text-[11px] font-black border transition-all ${filter.storyType === t.id ? 'bg-cyan-600 text-white dark:bg-cyan-500 border-transparent shadow-lg scale-105' : 'bg-transparent text-slate-50 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-400'}`}>{t.label}</button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-2 sm:p-3 mb-4 shadow-sm">
                <div className="flex flex-col xl:flex-row gap-4 xl:items-center">
                    <div className="flex-1 flex flex-col gap-2">
                        <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">角色 (按 ID 篩選)</span>
                        <div className="flex flex-wrap gap-1.5">
                            {Object.values(CHARACTER_MASTER).map(char => {
                                const isS = filter.type === 'character' && filter.value === char.id;
                                return (
                                    <button 
                                        key={char.id} 
                                        onClick={() => setFilter(prev => (prev.type==='character'&&prev.value===char.id) ? { ...prev, type:'all', value:'all'} : { ...prev, type:'character', value:char.id })} 
                                        disabled={filter.type==='unit'} 
                                        className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 transition-all duration-300 relative overflow-hidden ${isS ? 'ring-2 ring-cyan-500 ring-offset-2 dark:ring-offset-slate-800 scale-110 z-10' : 'border-transparent opacity-80 hover:opacity-100 hover:scale-110'} ${filter.type==='unit' ? 'opacity-20 grayscale cursor-not-allowed' : 'cursor-pointer'}`} 
                                        style={{ borderColor: isS ? char.color : 'transparent' }}
                                    >
                                        <img src={getAssetUrl(char.id, 'character')} alt={char.name} className="w-full h-full object-cover" />
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="hidden xl:block w-px h-12 bg-slate-200 dark:bg-slate-700 opacity-60"></div>
                    <div className="xl:hidden w-full h-px bg-slate-200 dark:bg-slate-700 opacity-40"></div>

                    <div className="xl:w-auto flex flex-col gap-2">
                        <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">團體 (Unit)</span>
                        <div className="flex flex-wrap xl:flex-nowrap gap-2 justify-start xl:pr-2">
                            {UNIT_ORDER.filter(u => u !== 'Mix').map(unit => (
                                <button key={unit} onClick={() => setFilter(prev => (prev.type==='unit'&&prev.value===unit) ? { ...prev, type:'all', value:'all'} : { ...prev, type:'unit', value:unit })} disabled={filter.type==='character'} className={`h-8 px-1.5 sm:px-2 rounded-xl transition-all flex items-center border flex-shrink-0 ${filter.type==='unit'&&filter.value===unit ? 'bg-slate-100 dark:bg-slate-700 border-cyan-500 shadow-md scale-105' : 'border-transparent hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:scale-105'} ${filter.type==='character' ? 'opacity-30 grayscale cursor-not-allowed' : 'cursor-pointer'}`}>
                                    <img src={getAssetUrl(unit, 'unit')} alt={unit} className="h-full w-auto object-contain max-w-[80px]" />
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex flex-col gap-1 mb-2 select-none">
                <div className="flex flex-wrap items-center gap-2 justify-end px-1 mb-2">
                    <span className="text-[10px] font-black text-slate-400 mr-1 uppercase">Jump to:</span>
                    {availableYears.map(year => (
                        <button key={year} onClick={() => jumpToYear(year)} className="px-3 py-1 bg-slate-200 dark:bg-slate-700 hover:bg-cyan-600 hover:text-white dark:hover:bg-cyan-500 text-slate-700 dark:text-white text-[10px] font-black rounded-lg transition-all shadow-sm">{year}</button>
                    ))}
                </div>

                <div className="flex gap-2 h-[550px]">
                    <div className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl overflow-hidden flex flex-col" onWheel={handleWheel}>
                        <div className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                            <div className="grid grid-cols-[50px_1fr] sm:grid-cols-[90px_1fr] gap-0 py-2">
                                <div className="text-[10px] font-black text-slate-900 dark:text-white text-right pr-4 uppercase">Date</div>
                                <div className="relative h-4 flex items-center">
                                    {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                                        <div key={day} className="absolute text-[10px] text-center text-slate-900 dark:text-white font-mono font-black -translate-x-1/2" style={{ left: `${((day - 0.5) / 31) * 100}%` }}>
                                            {day % 5 === 0 || day === 1 || day === 31 ? String(day).padStart(2, '0') : ''}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 flex flex-col justify-between py-1 relative">
                            {allMonths.slice(scrollIndex, scrollIndex + VIEWPORT_MONTHS).map(mKey => {
                                const [y, m] = mKey.split('/').map(Number);
                                const daysInActualMonth = new Date(y, m, 0).getDate();

                                return (
                                    <div key={mKey} className="grid grid-cols-[50px_1fr] sm:grid-cols-[90px_1fr] items-stretch h-full border-b border-slate-100 dark:border-slate-800 last:border-0 group/row">
                                        <div className="text-[11px] sm:text-xs font-black text-slate-900 dark:text-white text-right pr-4 font-mono flex items-center justify-end bg-slate-50/30 dark:bg-white/5 border-r border-slate-100 dark:border-slate-800 transition-colors group-hover/row:bg-slate-100/50 dark:group-hover/row:bg-white/10">
                                            <span className="sm:hidden">{mKey.substring(2)}</span>
                                            <span className="hidden sm:inline">{mKey}</span>
                                        </div>

                                        <div className="relative h-full overflow-hidden">
                                            <div className="absolute inset-0 flex pointer-events-none">
                                                {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                                                    <div 
                                                        key={d} 
                                                        className={`h-full border-r transition-colors ${d > daysInActualMonth ? 'bg-slate-200/40 dark:bg-black/60 border-transparent' : 'border-slate-200/30 dark:border-white/5 group-hover/row:border-slate-300 dark:group-hover/row:border-white/10'}`}
                                                        style={{ width: `${100 / 31}%` }}
                                                    />
                                                ))}
                                            </div>
                                            
                                            {monthlySegments[mKey].map((seg, sIdx) => {
                                                const match = isMatch(seg.event);
                                                let color = (filter.type==='unit') ? seg.event.unitColor : seg.event.charColor;
                                                if (filter.type==='all' && seg.event.storyType==='world_link') color = seg.event.unitColor;

                                                return (
                                                    <div 
                                                        key={`${seg.event.id}-${sIdx}`}
                                                        className={`absolute top-[4px] bottom-[4px] transition-all duration-300 cursor-pointer shadow-sm ${match ? 'z-10 opacity-100 scale-y-100' : 'opacity-10 grayscale brightness-50 z-0 scale-y-75'}`}
                                                        style={{ 
                                                            left: `${seg.left}%`, 
                                                            width: `calc(${seg.width}% - 1px)`, 
                                                            backgroundColor: color,
                                                            borderRadius: '3px',
                                                            border: '1px solid rgba(255,255,255,0.1)'
                                                        }}
                                                        onMouseEnter={(e) => { setHoveredEvent(seg.event); setTooltipPos({ x: e.clientX, y: e.clientY }); }}
                                                        onMouseMove={(e) => { setTooltipPos({ x: e.clientX, y: e.clientY }); }}
                                                        onMouseLeave={() => { setHoveredEvent(null); setTooltipPos(null); }}
                                                    />
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="w-8 bg-slate-100 dark:bg-slate-800 rounded-2xl relative flex items-center justify-center border border-slate-200 dark:border-slate-700 shadow-inner">
                        <input type="range" min="0" max={Math.max(0, allMonths.length - VIEWPORT_MONTHS)} step="1" value={scrollIndex} onChange={(e)=>setScrollIndex(parseInt(e.target.value))} className="w-[500px] h-6 origin-center -rotate-90 bg-transparent appearance-none cursor-pointer absolute z-20" style={{ WebkitAppearance: 'none' }} />
                        <div className="absolute top-4 text-[12px] text-slate-400 font-black animate-bounce">▲</div>
                        <div className="absolute bottom-4 text-[12px] text-slate-400 font-black animate-bounce">▼</div>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 sm:p-6 shadow-lg flex items-center">
                {(filter.type === 'all' || filter.value === 'all') ? (
                    <div className="flex flex-col sm:flex-row gap-8 w-full items-center">
                        <div className="flex items-center gap-3 border-r border-slate-200 dark:border-slate-700 pr-8">
                            <span className="text-xs text-slate-400 font-black uppercase tracking-widest">View Mode</span>
                            <span className="font-black text-xl text-slate-900 dark:text-white">整體概況 (All)</span>
                        </div>
                        <div className="flex gap-10 text-sm">
                            <div className="flex flex-col items-center">
                                <span className="text-[10px] text-cyan-500 font-black uppercase mb-1">箱活</span>
                                <span className="font-mono font-black text-3xl text-slate-900 dark:text-white">{stats.unitCount}</span>
                            </div>
                            <div className="flex flex-col items-center">
                                <span className="text-[10px] text-pink-500 font-black uppercase mb-1">混活</span>
                                <span className="font-mono font-black text-3xl text-slate-900 dark:text-white">{stats.mixedCount}</span>
                            </div>
                            <div className="flex flex-col items-center">
                                <span className="text-[10px] text-emerald-500 font-black uppercase mb-1">WL</span>
                                <span className="font-mono font-black text-3xl text-slate-900 dark:text-white">{stats.wlCount}</span>
                            </div>
                        </div>
                        <div className="flex-1 text-right">
                             <span className="text-sm font-bold text-slate-600 dark:text-slate-300">總計: <span className="font-mono text-cyan-600 dark:text-cyan-400 text-2xl">{events.length}</span> 期</span>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col xl:flex-row gap-6 w-full items-start xl:items-center">
                        <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-900/50 p-3 pr-6 rounded-2xl border border-slate-100 dark:border-slate-700 w-full xl:w-auto shadow-inner">
                            {(() => {
                                const char = getChar(filter.value);
                                const cUnit = filter.type === 'unit' ? filter.value : (char ? "Leo/need" : "Mix"); // Simplification for display
                                const members = ["星乃一歌", "天馬咲希", "望月穗波", "日野森志步"]; // Placeholder for actual unit logic
                                return (
                                    <>
                                        <div className={`p-2 rounded-xl ${filter.type==='unit' ? 'bg-white dark:bg-slate-700 shadow-lg ring-2 ring-cyan-500/20' : 'opacity-70 grayscale'}`}>
                                            <img src={getAssetUrl(cUnit, 'unit')} alt={cUnit} className="h-10 w-auto object-contain" />
                                        </div>
                                        <div className="flex flex-wrap gap-2 pl-4 border-l-2 border-slate-200 dark:border-slate-700">
                                            {/* 此處僅作示例，實際應讀取單元成員 */}
                                            {Object.values(CHARACTER_MASTER).slice(0, 4).map(m => {
                                                const isM = filter.type==='character'&&filter.value===m.id;
                                                return (
                                                    <div key={m.id} className={`relative rounded-full transition-all duration-300 ${isM ? 'ring-2 ring-cyan-500 ring-offset-2 z-10 scale-110 shadow-lg' : 'opacity-40 grayscale hover:opacity-100 hover:grayscale-0 hover:scale-105'}`} style={{ borderColor: isM ? m.color : 'transparent' }}>
                                                        <img src={getAssetUrl(m.id, 'character')} alt={m.name} className="w-10 h-10 rounded-full border-2 border-white dark:border-slate-800 bg-slate-200 object-cover shadow-sm" />
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </>
                                );
                            })()}
                        </div>
                        <div className="flex-1 flex flex-col sm:flex-row gap-8 sm:gap-12 items-center w-full px-4">
                            <div className="flex gap-10 text-sm">
                                <div className="flex flex-col"><span className="text-[10px] text-slate-400 font-black uppercase mb-1">總期數</span><span className="font-mono font-black text-3xl dark:text-white">{stats.totalCount}</span></div>
                                <div className="w-px h-12 bg-slate-200 dark:bg-slate-700"></div>
                                {filter.type === 'unit' ? (
                                    <><div className="flex flex-col"><span className="text-[10px] text-cyan-500 font-black uppercase mb-1">箱活</span><span className="font-mono font-black text-3xl dark:text-white">{stats.unitCount}</span></div><div className="flex flex-col"><span className="text-[10px] text-emerald-500 font-black uppercase mb-1">WL</span><span className="font-mono font-black text-3xl dark:text-white">{stats.wlCount}</span></div></>
                                ) : (
                                    <><div className="flex flex-col"><span className="text-[10px] text-cyan-500 font-black uppercase mb-1">個人箱</span><span className="font-mono font-black text-3xl dark:text-white">{stats.charUnitCount}</span></div><div className="flex flex-col"><span className="text-[10px] text-pink-500 font-black uppercase mb-1">個人混</span><span className="font-mono font-black text-3xl dark:text-white">{stats.charMixedCount}</span></div></>
                                )}
                            </div>
                            {filter.type === 'character' && (
                                <div className="flex-1 w-full bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 flex items-center justify-around shadow-inner">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">箱活間隔分析</span>
                                    <div className="flex gap-8">
                                        <div className="flex items-baseline gap-2"><span className="text-xs text-emerald-500 font-black uppercase">Min</span><span className="font-mono font-black text-2xl dark:text-white">{stats.minInterval}</span><span className="text-[10px] text-slate-400 font-bold">天</span></div>
                                        <div className="flex items-baseline gap-2"><span className="text-xs text-rose-500 font-black uppercase">Max</span><span className="font-mono font-black text-2xl dark:text-white">{stats.maxInterval}</span><span className="text-[10px] text-slate-400 font-bold">天</span></div>
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
