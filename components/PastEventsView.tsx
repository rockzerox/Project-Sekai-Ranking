
import React, { useState, useEffect, useMemo } from 'react';
import { EventSummary } from '../types';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';
import { EVENT_UNIT_MAP, UNIT_STYLES, WORLD_LINK_IDS } from '../constants';

interface PastEventsViewProps {
    onSelectEvent: (id: number, name: string) => void;
}

const PastEventsView: React.FC<PastEventsViewProps> = ({ onSelectEvent }) => {
  const [events, setEvents] = useState<EventSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  
  // Filters
  const [selectedUnitFilter, setSelectedUnitFilter] = useState<string>('all');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<'all' | 'world_link' | 'normal'>('all');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch('https://api.hisekai.org/event/list');
        if (!response.ok) {
          throw new Error('Failed to fetch event list');
        }
        const data: EventSummary[] = await response.json();
        
        // Sort by ID descending (newest first)
        const sortedData = data.sort((a, b) => b.id - a.id);
        setEvents(sortedData);
        
        // Logic to determine default year:
        if (sortedData.length > 0) {
          const currentSystemYear = new Date().getFullYear();
          const availableYears = new Set(data.map(e => new Date(e.start_at).getFullYear()));
          
          if (availableYears.has(currentSystemYear)) {
             setSelectedYear(currentSystemYear);
          } else {
             const newestYear = new Date(sortedData[0].start_at).getFullYear();
             setSelectedYear(newestYear);
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

  // Group events by year
  const eventsByYear = useMemo(() => {
    const groups: Record<number, EventSummary[]> = {};
    events.forEach(event => {
      const year = new Date(event.start_at).getFullYear();
      if (!groups[year]) {
        groups[year] = [];
      }
      groups[year].push(event);
    });
    return groups;
  }, [events]);

  // Get available years sorted descending
  const years = useMemo(() => {
    return Object.keys(eventsByYear).map(Number).sort((a, b) => b - a);
  }, [eventsByYear]);

  // Filter & Sort events based on all criteria
  const filteredEvents = useMemo(() => {
    if (!selectedYear) return [];
    
    let currentYearEvents = eventsByYear[selectedYear] || [];

    // 1. Search Filter
    if (searchTerm.trim() !== '') {
        const term = searchTerm.toLowerCase();
        currentYearEvents = currentYearEvents.filter(e => 
            e.name.toLowerCase().includes(term) || 
            e.id.toString().includes(term)
        );
    }

    // 2. Unit Filter
    if (selectedUnitFilter !== 'all') {
        currentYearEvents = currentYearEvents.filter(e => EVENT_UNIT_MAP[e.id] === selectedUnitFilter);
    }

    // 3. Type Filter
    if (selectedTypeFilter !== 'all') {
        if (selectedTypeFilter === 'world_link') {
            currentYearEvents = currentYearEvents.filter(e => WORLD_LINK_IDS.includes(e.id));
        } else if (selectedTypeFilter === 'normal') {
            currentYearEvents = currentYearEvents.filter(e => !WORLD_LINK_IDS.includes(e.id));
        }
    }

    // 4. Sort
    return currentYearEvents.sort((a, b) => {
        return sortOrder === 'desc' ? b.id - a.id : a.id - b.id;
    });
  }, [eventsByYear, selectedYear, searchTerm, selectedUnitFilter, selectedTypeFilter, sortOrder]);

  const getEventStatus = (startAt: string, closedAt: string) => {
      const now = new Date();
      const start = new Date(startAt);
      const closed = new Date(closedAt);

      if (now < start) return 'future';
      if (now >= start && now <= closed) return 'active';
      return 'past';
  };

  const calculateEventDays = (startAt: string, closedAt: string): number => {
    const start = new Date(startAt);
    const end = new Date(closedAt);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    // Deduct 1 rest day as requested
    return Math.max(0, diffDays - 1);
  };

  const toggleSortOrder = () => {
      setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc');
  };

  const uniqueUnits = useMemo(() => {
      return Array.from(new Set(Object.values(EVENT_UNIT_MAP)));
  }, []);

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div className="w-full animate-fadeIn">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">歷代活動 (Past Events)</h2>
        <p className="text-slate-400">Project Sekai 台服活動存檔</p>
      </div>

      {/* Year Tabs */}
      <div className="flex flex-wrap gap-2 mb-6 border-b border-slate-700 pb-1">
        {years.map(year => (
          <button
            key={year}
            onClick={() => {
                setSelectedYear(year);
                setSearchTerm(''); // Clear search when switching years
            }}
            className={`px-5 py-2 rounded-t-lg font-bold text-sm transition-all duration-200 border-b-2 ${
              selectedYear === year
                ? 'bg-slate-800 text-cyan-400 border-cyan-500'
                : 'text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            {year}
          </button>
        ))}
      </div>

      {/* Controls Bar: Search, Sort, Filters */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-4 mb-6">
          {/* Left: Search */}
          <div className="relative w-full xl:max-w-md">
            <input
            type="text"
            placeholder={`搜尋 ${selectedYear} 活動... (期數/名稱)`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:ring-2 focus:ring-cyan-500 outline-none transition-all"
            />
            <svg
                className="absolute left-3 top-3 w-5 h-5 text-slate-500"
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
            >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Right: Filters & Sort */}
          <div className="flex flex-wrap gap-3 w-full xl:w-auto">
             {/* Sort Button */}
             <button
                onClick={toggleSortOrder}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-300 hover:text-white hover:border-slate-500 transition-all min-w-[100px]"
                title={sortOrder === 'desc' ? "由新到舊 (Newest First)" : "由舊到新 (Oldest First)"}
             >
                {sortOrder === 'desc' ? (
                    <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4 4m0 0l4 4m-4-4v12" /></svg>
                        <span>降冪</span>
                    </>
                ) : (
                    <>
                         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4 4m0 0l4 4m-4-4v12" transform="scale(1, -1) translate(0, -24)" /></svg>
                         <span>升冪</span>
                    </>
                )}
             </button>

             {/* Unit Filter */}
             <select
                value={selectedUnitFilter}
                onChange={(e) => setSelectedUnitFilter(e.target.value)}
                className="bg-slate-800 border border-slate-700 text-slate-300 text-sm rounded-lg focus:ring-cyan-500 focus:border-cyan-500 block p-2.5 outline-none min-w-[140px]"
             >
                <option value="all">所有團體 (All Units)</option>
                {uniqueUnits.map(unit => (
                    <option key={unit} value={unit}>{unit}</option>
                ))}
             </select>

             {/* Type Filter */}
             <select
                value={selectedTypeFilter}
                onChange={(e) => setSelectedTypeFilter(e.target.value as any)}
                className="bg-slate-800 border border-slate-700 text-slate-300 text-sm rounded-lg focus:ring-cyan-500 focus:border-cyan-500 block p-2.5 outline-none min-w-[140px]"
             >
                <option value="all">所有類型 (All Types)</option>
                <option value="normal">一般活動 (Normal)</option>
                <option value="world_link">World Link</option>
             </select>
          </div>
      </div>

      {/* Event List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
        {filteredEvents.length > 0 ? (
            filteredEvents.map(event => {
                const status = getEventStatus(event.start_at, event.closed_at);
                const isClickable = status === 'past';
                const duration = calculateEventDays(event.start_at, event.closed_at);
                const isWorldLink = WORLD_LINK_IDS.includes(event.id);
                const unitLabel = EVENT_UNIT_MAP[event.id] || "Unknown";
                const unitStyle = UNIT_STYLES[unitLabel] || "bg-slate-700 text-slate-400 border-slate-600";
                
                return (
                    <button 
                        key={event.id} 
                        disabled={!isClickable}
                        onClick={() => isClickable && onSelectEvent(event.id, event.name)}
                        className={`
                            text-left bg-slate-800/50 border border-slate-700 rounded-lg p-4 transition-all duration-200 w-full relative overflow-hidden flex flex-col justify-between h-full
                            ${isClickable 
                                ? 'hover:border-cyan-500/50 hover:bg-slate-800 group cursor-pointer hover:-translate-y-1' 
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
                            {status === 'future' && (
                                <div className="absolute top-0 right-0 bg-amber-600 text-white text-[10px] px-2 py-1 rounded-bl-lg font-bold z-10">
                                    活動尚未開始
                                </div>
                            )}

                            <div className="flex items-start justify-between mb-3">
                                <div className="flex flex-col gap-1.5 items-start">
                                    <span className={`text-xs font-mono py-0.5 px-1.5 rounded transition-colors ${isClickable ? 'bg-slate-700 text-slate-300 group-hover:bg-cyan-900/50 group-hover:text-cyan-300' : 'bg-slate-700 text-slate-400'}`}>
                                        #{event.id}
                                    </span>
                                    {isWorldLink && (
                                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40">
                                            WorldLink
                                        </span>
                                    )}
                                </div>
                                <div className="text-right">
                                    <div className="text-xs text-slate-500">
                                        {new Date(event.start_at).toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' })} 
                                        {' - '}
                                        {new Date(event.closed_at).toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' })}
                                    </div>
                                    <div className="text-[10px] text-slate-400 font-medium mt-0.5">
                                        {duration} 天
                                    </div>
                                </div>
                            </div>
                            
                            <h3 className={`text-lg font-bold transition-colors mb-3 line-clamp-2 leading-snug ${isClickable ? 'text-white group-hover:text-cyan-400' : 'text-slate-300'}`}>
                                {event.name}
                            </h3>
                        </div>

                        <div className="mt-auto pt-3 border-t border-slate-700/50">
                            <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded border ${unitStyle}`}>
                                {unitLabel}
                            </span>
                        </div>
                    </button>
                );
            })
        ) : (
            <div className="col-span-full text-center py-16 text-slate-500 bg-slate-800/30 rounded-lg border border-slate-700 border-dashed">
                <p className="text-lg mb-1">找不到符合條件的活動</p>
                <p className="text-sm">請嘗試變更搜尋關鍵字或篩選條件</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default PastEventsView;
