
import React, { useState, useEffect, useMemo } from 'react';
import { EventSummary } from '../types';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';

interface PastEventsViewProps {
    onSelectEvent: (id: number, name: string) => void;
}

const PastEventsView: React.FC<PastEventsViewProps> = ({ onSelectEvent }) => {
  const [events, setEvents] = useState<EventSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState<number | null>(null);

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
        
        // Set default year to the most recent event's year
        if (sortedData.length > 0) {
          const newestYear = new Date(sortedData[0].start_at).getFullYear();
          setSelectedYear(newestYear);
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

  // Filter events based on search term and selected year
  const filteredEvents = useMemo(() => {
    if (!selectedYear) return [];
    
    let currentYearEvents = eventsByYear[selectedYear] || [];

    if (searchTerm.trim() !== '') {
        const term = searchTerm.toLowerCase();
        return currentYearEvents.filter(e => 
            e.name.toLowerCase().includes(term) || 
            e.id.toString().includes(term)
        );
    }

    return currentYearEvents;
  }, [eventsByYear, selectedYear, searchTerm]);

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

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div className="container mx-auto px-4 py-6 animate-fadeIn">
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

      {/* Search Filter */}
      <div className="mb-6 relative max-w-md">
        <input
          type="text"
          placeholder={`在 ${selectedYear} 年搜尋... (期數或名稱)`}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition-all"
        />
        <svg
            className="absolute left-3 top-3.5 w-5 h-5 text-slate-500"
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
        >
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>

      {/* Event List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredEvents.length > 0 ? (
            filteredEvents.map(event => {
                const status = getEventStatus(event.start_at, event.closed_at);
                const isClickable = status === 'past';
                const duration = calculateEventDays(event.start_at, event.closed_at);
                
                return (
                    <button 
                        key={event.id} 
                        disabled={!isClickable}
                        onClick={() => isClickable && onSelectEvent(event.id, event.name)}
                        className={`
                            text-left bg-slate-800/50 border border-slate-700 rounded-lg p-4 transition-all duration-200 w-full relative overflow-hidden
                            ${isClickable 
                                ? 'hover:border-cyan-500/50 hover:bg-slate-800 group cursor-pointer' 
                                : 'opacity-60 cursor-not-allowed grayscale-[0.5]'
                            }
                        `}
                    >
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

                        <div className="flex items-start justify-between mb-2">
                            <span className={`text-xs font-mono py-1 px-2 rounded transition-colors ${isClickable ? 'bg-slate-700 text-slate-300 group-hover:bg-cyan-900/50 group-hover:text-cyan-300' : 'bg-slate-700 text-slate-400'}`}>
                                #{event.id}
                            </span>
                            <div className="text-right">
                                <div className="text-xs text-slate-500">
                                    {new Date(event.start_at).toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' })} 
                                    {' - '}
                                    {new Date(event.closed_at).toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' })}
                                </div>
                                <div className="text-[10px] text-slate-400 font-medium mt-0.5">
                                    {duration} 天 (Days)
                                </div>
                            </div>
                        </div>
                        <h3 className={`text-lg font-bold transition-colors ${isClickable ? 'text-white group-hover:text-cyan-400' : 'text-slate-300'}`}>
                            {event.name}
                        </h3>
                    </button>
                );
            })
        ) : (
            <div className="col-span-full text-center py-12 text-slate-500">
                在 {selectedYear} 年找不到符合 "{searchTerm}" 的活動。
            </div>
        )}
      </div>
    </div>
  );
};

export default PastEventsView;
