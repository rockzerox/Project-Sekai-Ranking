
import React, { useState, useEffect, useMemo } from 'react';
import { EventSummary } from '../types';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';
import { EVENT_DETAILS, UNIT_STYLES, getEventColor, UNIT_ORDER, BANNER_ORDER, getAssetUrl, calculateDisplayDuration, calculatePreciseDuration } from '../constants';

interface PastEventsViewProps {
    onSelectEvent: (id: number, name: string) => void;
}

const PastEventsView: React.FC<PastEventsViewProps> = ({ onSelectEvent }) => {
  const [events, setEvents] = useState<EventSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Default year will be set after data load
  const [selectedYear, setSelectedYear] = useState<number | 'all'>('all');
  
  const [selectedUnitFilter, setSelectedUnitFilter] = useState<string>('all');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<'all' | 'marathon' | 'cheerful_carnival' | 'world_link'>('all');
  const [selectedBannerFilter, setSelectedBannerFilter] = useState<string>('all');
  const [selectedStoryFilter, setSelectedStoryFilter] = useState<'all' | 'unit_event' | 'mixed_event' | 'world_link'>('all');
  const [selectedCardFilter, setSelectedCardFilter] = useState<'all' | 'permanent' | 'limited' | 'special_limited'>('all');
  
  const [sortType, setSortType] = useState<'id' | 'duration'>('id');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch('https://api.hisekai.org/event/list');
        if (!response.ok) {
          throw new Error('Failed to fetch event list');
        }
        const data: EventSummary[] = await response.json();
        
        const sortedData = data.sort((a, b) => b.id - a.id);
        setEvents(sortedData);
        
        // Prioritize setting the default year to the current year if exists
        const currentYear = new Date().getFullYear();
        const hasCurrentYear = sortedData.some(e => new Date(e.start_at).getFullYear() === currentYear);

        if (hasCurrentYear) {
            setSelectedYear(currentYear);
        } else if (sortedData.length > 0) {
            // Fallback to the latest available year
            const latestYear = new Date(sortedData[0].start_at).getFullYear();
            if (!isNaN(latestYear)) {
                setSelectedYear(latestYear);
            }
        }
        
      } catch (err) {
        setError('無法載入過往活動。');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvents();
  }, []);

  const years = useMemo(() => {
    const uniqueYears = new Set<number>();
    events.forEach(e => {
        const year = new Date(e.start_at).getFullYear();
        if (!isNaN(year)) {
            uniqueYears.add(year);
        }
    });
    return Array.from(uniqueYears).sort((a: number, b: number) => b - a);
  }, [events]);

  const filteredEvents = useMemo(() => {
    // 1. Global Filter (Applies to ALL events first)
    let currentEvents = events;

    // Search Filter
    if (searchTerm.trim() !== '') {
        const term = searchTerm.toLowerCase();
        currentEvents = currentEvents.filter(e => 
            e.name.toLowerCase().includes(term) || 
            e.id.toString().includes(term)
        );
    }

    // Unit Filter
    if (selectedUnitFilter !== 'all') {
        currentEvents = currentEvents.filter(e => EVENT_DETAILS[e.id]?.unit === selectedUnitFilter);
    }

    // Type Filter
    if (selectedTypeFilter !== 'all') {
        currentEvents = currentEvents.filter(e => EVENT_DETAILS[e.id]?.type === selectedTypeFilter);
    }

    // Banner Filter
    if (selectedBannerFilter !== 'all') {
        currentEvents = currentEvents.filter(e => EVENT_DETAILS[e.id]?.banner === selectedBannerFilter);
    }

    // Story Filter
    if (selectedStoryFilter !== 'all') {
        currentEvents = currentEvents.filter(e => EVENT_DETAILS[e.id]?.storyType === selectedStoryFilter);
    }

    // Card Filter
    if (selectedCardFilter !== 'all') {
        currentEvents = currentEvents.filter(e => EVENT_DETAILS[e.id]?.cardType === selectedCardFilter);
    }

    // 2. Year Filter (Only if a specific year is selected)
    if (selectedYear !== 'all') {
        currentEvents = currentEvents.filter(e => new Date(e.start_at).getFullYear() === selectedYear);
    }

    // 3. Sort
    return currentEvents.sort((a, b) => {
        if (sortType === 'duration') {
            const durA = calculatePreciseDuration(a.start_at, a.aggregate_at);
            const durB = calculatePreciseDuration(b.start_at, b.aggregate_at);
            // desc: Longest to Shortest
            // asc: Shortest to Longest
            if (durA !== durB) {
                return sortOrder === 'desc' ? durA - durB : durB - durA;
            }
            // Secondary sort by ID desc always
            return b.id - a.id;
        }
        
        // Default ID sort
        return sortOrder === 'desc' ? b.id - a.id : a.id - b.id;
    });
  }, [events, selectedYear, searchTerm, selectedUnitFilter, selectedTypeFilter, selectedBannerFilter, selectedStoryFilter, selectedCardFilter, sortOrder, sortType]);

  const getEventStatus = (startAt: string, aggregateAt: string, closedAt: string) => {
      const now = new Date();
      const start = new Date(startAt);
      const agg = new Date(aggregateAt);
      const closed = new Date(closedAt);

      if (now < start) return 'future';
      if (now >= start && now <= agg) return 'active';
      if (now > agg && now <= closed) return 'ended';
      return 'past';
  };

  const toggleSortOrder = () => {
      setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc');
  };

  const getTypeLabel = (type: string) => {
      switch(type) {
          case 'marathon': return '馬拉松';
          case 'cheerful_carnival': return '歡樂嘉年華';
          case 'world_link': return 'World Link';
          default: return type;
      }
  };

  const getStoryTypeLabel = (type: string) => {
      switch(type) {
          case 'unit_event': return '箱活';
          case 'mixed_event': return '混活';
          case 'world_link': return 'World Link';
          default: return '';
      }
  };

  const getCardTypeLabel = (type: string) => {
      switch(type) {
          case 'permanent': return '常駐';
          case 'limited': return '限定';
          case 'special_limited': return '特殊限定';
          default: return '';
      }
  };

  const getCardTypeStyle = (type: string) => {
      switch(type) {
          case 'permanent': return 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300';
          case 'limited': return 'bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-700';
          case 'special_limited': return 'bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-700';
          default: return 'bg-slate-100 dark:bg-slate-700 text-slate-500';
      }
  };

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div className="w-full animate-fadeIn">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">歷代活動 (Past Events)</h2>
        <p className="text-slate-500 dark:text-slate-400">Project Sekai 台服活動存檔</p>
      </div>

      <div className="flex flex-wrap gap-2 mb-6 border-b border-slate-200 dark:border-slate-700 pb-1">
        <button
            onClick={() => {
                setSelectedYear('all');
            }}
            className={`px-5 py-2 rounded-t-lg font-bold text-sm transition-all duration-200 border-b-2 ${
                selectedYear === 'all'
                ? 'bg-white dark:bg-slate-800 text-cyan-600 dark:text-cyan-400 border-cyan-500'
                : 'text-slate-500 dark:text-slate-400 border-transparent hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/50'
            }`}
        >
            全部 (All)
        </button>
        {years.map(year => (
          <button
            key={year}
            onClick={() => {
                setSelectedYear(year);
            }}
            className={`px-5 py-2 rounded-t-lg font-bold text-sm transition-all duration-200 border-b-2 ${
              selectedYear === year
                ? 'bg-white dark:bg-slate-800 text-cyan-600 dark:text-cyan-400 border-cyan-500'
                : 'text-slate-500 dark:text-slate-400 border-transparent hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/50'
            }`}
          >
            {year}
          </button>
        ))}
      </div>

      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-4 mb-6">
          <div className="relative w-full xl:w-64">
            <input
            type="text"
            placeholder={`搜尋活動... (期數/名稱)`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-200 focus:ring-2 focus:ring-cyan-500 outline-none transition-all"
            />
            <svg
                className="absolute left-3 top-3 w-5 h-5 text-slate-400"
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
            >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          <div className="flex flex-wrap gap-3 w-full xl:w-auto">
             <div className="flex rounded-lg border border-slate-300 dark:border-slate-700 overflow-hidden bg-white dark:bg-slate-800">
                 <select
                    value={sortType}
                    onChange={(e) => setSortType(e.target.value as 'id' | 'duration')}
                    className="bg-transparent text-slate-700 dark:text-slate-300 text-sm font-bold p-2.5 outline-none border-r border-slate-300 dark:border-slate-700 cursor-pointer"
                 >
                     <option value="id">依照期數</option>
                     <option value="duration">依照天數</option>
                 </select>
                 
                 <button
                    onClick={toggleSortOrder}
                    className="px-3 py-2.5 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    title={sortOrder === 'desc' ? "降冪 (由大到小 / 由新到舊)" : "升冪 (由小到大 / 由舊到新)"}
                 >
                    {sortOrder === 'desc' ? (
                        <svg className="w-5 h-5 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
                    ) : (
                        <svg className="w-5 h-5 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                    )}
                 </button>
             </div>

             <select
                value={selectedUnitFilter}
                onChange={(e) => setSelectedUnitFilter(e.target.value)}
                className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm rounded-lg focus:ring-cyan-500 focus:border-cyan-500 block p-2.5 outline-none min-w-[140px]"
             >
                <option value="all">所有團體 (All Units)</option>
                {UNIT_ORDER.map(unit => (
                    <option key={unit} value={unit}>{unit}</option>
                ))}
             </select>

             <select
                value={selectedTypeFilter}
                onChange={(e) => setSelectedTypeFilter(e.target.value as any)}
                className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm rounded-lg focus:ring-cyan-500 focus:border-cyan-500 block p-2.5 outline-none min-w-[140px]"
             >
                <option value="all">所有類型 (All Types)</option>
                <option value="marathon">馬拉松</option>
                <option value="cheerful_carnival">歡樂嘉年華</option>
                <option value="world_link">World Link</option>
             </select>

             <select
                value={selectedBannerFilter}
                onChange={(e) => setSelectedBannerFilter(e.target.value)}
                className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm rounded-lg focus:ring-cyan-500 focus:border-cyan-500 block p-2.5 outline-none min-w-[140px]"
             >
                <option value="all">所有 Banner</option>
                {BANNER_ORDER.map(banner => (
                    <option key={banner} value={banner}>{banner}</option>
                ))}
             </select>

             <select
                value={selectedStoryFilter}
                onChange={(e) => setSelectedStoryFilter(e.target.value as any)}
                className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm rounded-lg focus:ring-cyan-500 focus:border-cyan-500 block p-2.5 outline-none min-w-[120px]"
             >
                <option value="all">所有劇情 (All Stories)</option>
                <option value="unit_event">箱活</option>
                <option value="mixed_event">混活</option>
                <option value="world_link">World Link</option>
             </select>

             <select
                value={selectedCardFilter}
                onChange={(e) => setSelectedCardFilter(e.target.value as any)}
                className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm rounded-lg focus:ring-cyan-500 focus:border-cyan-500 block p-2.5 outline-none min-w-[120px]"
             >
                <option value="all">所有卡面 (All Cards)</option>
                <option value="permanent">常駐</option>
                <option value="limited">限定</option>
                <option value="special_limited">特殊限定</option>
             </select>
          </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
        {filteredEvents.length > 0 ? (
            filteredEvents.map(event => {
                const status = getEventStatus(event.start_at, event.aggregate_at, event.closed_at);
                const isClickable = status === 'past' || status === 'ended';
                const duration = calculateDisplayDuration(event.start_at, event.aggregate_at);
                
                const details = EVENT_DETAILS[event.id] || { unit: "Unknown", type: "marathon", banner: "", storyType: "unit_event", cardType: "permanent" };
                const unitLabel = details.unit;
                const typeLabel = getTypeLabel(details.type);
                const storyLabel = getStoryTypeLabel(details.storyType);
                const cardLabel = getCardTypeLabel(details.cardType);
                
                const unitStyle = UNIT_STYLES[unitLabel] || "bg-slate-500 text-white";
                const cardStyle = getCardTypeStyle(details.cardType);
                const eventColor = getEventColor(event.id);
                
                const unitImg = getAssetUrl(unitLabel, 'unit');
                const bannerImg = getAssetUrl(details.banner, 'character');
                const eventLogoUrl = getAssetUrl(event.id.toString(), 'event');

                return (
                    <button 
                        key={event.id} 
                        disabled={!isClickable}
                        onClick={() => isClickable && onSelectEvent(event.id, event.name)}
                        className={`
                            text-left bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg p-4 transition-all duration-200 w-full relative overflow-hidden flex flex-col justify-between h-full
                            ${isClickable 
                                ? 'hover:border-cyan-500/50 hover:bg-slate-50 dark:hover:bg-slate-800 group cursor-pointer hover:-translate-y-1 shadow-sm hover:shadow-md' 
                                : 'opacity-60 cursor-not-allowed grayscale-[0.5]'
                            }
                        `}
                    >
                        <div>
                            {status === 'active' && (
                                <div className="absolute top-0 right-0 bg-cyan-600 text-white text-[10px] px-2 py-1 rounded-bl-lg font-bold z-10">
                                    活動進行中
                                </div>
                            )}
                            {status === 'ended' && (
                                <div className="absolute top-0 right-0 bg-slate-500 text-white text-[10px] px-2 py-1 rounded-bl-lg font-bold z-10">
                                    活動已結束
                                </div>
                            )}
                            {status === 'future' && (
                                <div className="absolute top-0 right-0 bg-amber-600 text-white text-[10px] px-2 py-1 rounded-bl-lg font-bold z-10">
                                    活動尚未開始
                                </div>
                            )}

                            <div className="flex items-start justify-between mb-3">
                                <div className="flex flex-col gap-1.5 items-start">
                                    <div className="flex items-center gap-1">
                                        <span className={`text-xs font-mono py-0.5 px-1.5 rounded transition-colors ${isClickable ? 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 group-hover:bg-cyan-100 dark:group-hover:bg-cyan-900/50 group-hover:text-cyan-700 dark:group-hover:text-cyan-300' : 'bg-slate-100 dark:bg-slate-700 text-slate-400'}`}>
                                            #{event.id}
                                        </span>
                                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-600">
                                            {typeLabel}
                                        </span>
                                    </div>
                                    <div className="flex gap-1 mt-0.5">
                                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-600">
                                            {storyLabel}
                                        </span>
                                        <span className={`text-[9px] px-1.5 py-0.5 rounded ${cardStyle}`}>
                                            {cardLabel}
                                        </span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-xs text-slate-500">
                                        {new Date(event.start_at).toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' })} 
                                        {' - '}
                                        {new Date(event.aggregate_at).toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' })}
                                    </div>
                                    <div className="text-[10px] text-slate-400 font-medium mt-0.5">
                                        {duration} 日
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex flex-col mb-1">
                                {eventLogoUrl && (
                                    <img 
                                        src={eventLogoUrl} 
                                        alt="Event Logo" 
                                        className="h-auto object-contain my-2 rounded-md max-h-24 self-start max-w-full"
                                        onError={(e) => e.currentTarget.style.display = 'none'}
                                    />
                                )}
                                <h3 
                                    className={`text-lg font-bold transition-colors line-clamp-2 leading-snug`}
                                    style={{ color: isClickable && eventColor ? eventColor : undefined }}
                                >
                                    {event.name}
                                </h3>
                            </div>
                            
                            {details.banner && (
                                <div className="flex items-center gap-2 mb-3 mt-1">
                                    <span className="text-xs text-slate-400">Banner: {details.banner}</span>
                                    {bannerImg && (
                                        <img 
                                            src={bannerImg} 
                                            alt={details.banner} 
                                            className="w-6 h-6 rounded-full border border-slate-200 dark:border-slate-600 object-cover"
                                        />
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="mt-auto pt-3 border-t border-slate-200 dark:border-slate-700/50 flex justify-end">
                            <span 
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${unitStyle} flex items-center gap-1`}
                            >
                                {unitImg && details.unit !== 'Mix' && (
                                    <img src={unitImg} alt={unitLabel} className="w-3 h-3 object-contain" />
                                )}
                                {unitLabel}
                            </span>
                        </div>
                    </button>
                );
            })
        ) : (
            <div className="col-span-full text-center py-16 text-slate-500 bg-slate-100 dark:bg-slate-800/30 rounded-lg border border-slate-200 dark:border-slate-700 border-dashed">
                <p className="text-lg mb-1">找不到符合條件的活動</p>
                <p className="text-sm">請嘗試變更搜尋關鍵字或篩選條件</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default PastEventsView;
