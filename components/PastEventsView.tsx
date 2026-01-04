
import React, { useState, useEffect, useMemo } from 'react';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';
import { UNIT_MASTER, CHARACTER_MASTER, getAssetUrl, calculateDisplayDuration, calculatePreciseDuration, getEventStatus, getChar } from '../constants';
import { useEventList } from '../hooks/useEventList';
import SearchBar from './SearchBar';
import EventFilterGroup, { EventFilterState } from './ui/EventFilterGroup';
import { useConfig } from '../contexts/ConfigContext';
import { UI_TEXT } from '../constants/uiText';

interface PastEventsViewProps {
    onSelectEvent: (id: number, name: string) => void;
}

const PastEventsView: React.FC<PastEventsViewProps> = ({ onSelectEvent }) => {
  const { eventDetails, getEventColor } = useConfig();
  const { events, isLoading, error } = useEventList();
  const [searchTerm, setSearchTerm] = useState('');
  
  const [selectedYear, setSelectedYear] = useState<number | 'all'>('all');
  
  const [filters, setFilters] = useState<EventFilterState>({
    unit: 'all',
    type: 'all',
    banner: 'all',
    storyType: 'all',
    cardType: 'all',
    fourStar: 'all'
  });
  
  const [sortType, setSortType] = useState<'id' | 'duration'>('id');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  const pastEventsTotalCount = useMemo(() => {
    const now = new Date().getTime();
    return events.filter(e => new Date(e.closed_at).getTime() < now).length;
  }, [events]);

  useEffect(() => {
      if (events.length > 0 && selectedYear === 'all') {
        const currentYear = new Date().getFullYear();
        const hasCurrentYear = events.some(e => new Date(e.start_at).getFullYear() === currentYear);
        if (hasCurrentYear) {
            setSelectedYear(currentYear);
        } else {
            const latestYear = new Date(events[0].start_at).getFullYear();
            if (!isNaN(latestYear)) setSelectedYear(latestYear);
        }
      }
  }, [events]);

  const years = useMemo(() => {
    const uniqueYears = new Set<number>();
    events.forEach(e => {
        const year = new Date(e.start_at).getFullYear();
        if (!isNaN(year)) uniqueYears.add(year);
    });
    return Array.from(uniqueYears).sort((a, b) => b - a);
  }, [events]);

  const filteredEvents = useMemo(() => {
    let currentEvents = [...events];

    if (searchTerm.trim() !== '') {
        const term = searchTerm.toLowerCase();
        currentEvents = currentEvents.filter(e => 
            e.name.toLowerCase().includes(term) || 
            e.id.toString().includes(term)
        );
    }

    if (filters.unit !== 'all') currentEvents = currentEvents.filter(e => eventDetails[e.id]?.unit === filters.unit);
    if (filters.type !== 'all') currentEvents = currentEvents.filter(e => eventDetails[e.id]?.type === filters.type);
    if (filters.banner !== 'all') currentEvents = currentEvents.filter(e => eventDetails[e.id]?.banner === filters.banner);
    if (filters.storyType !== 'all') currentEvents = currentEvents.filter(e => eventDetails[e.id]?.storyType === filters.storyType);
    if (filters.cardType !== 'all') currentEvents = currentEvents.filter(e => eventDetails[e.id]?.cardType === filters.cardType);
    
    if (filters.fourStar !== 'all') {
        currentEvents = currentEvents.filter(e => {
            const cards = eventDetails[e.id]?.["4starcard"]?.split(',') || [];
            return cards.some(cardId => cardId.split('-')[0] === filters.fourStar);
        });
    }

    if (selectedYear !== 'all') currentEvents = currentEvents.filter(e => new Date(e.start_at).getFullYear() === selectedYear);

    return currentEvents.sort((a, b) => {
        if (sortType === 'duration') {
            const durA = calculatePreciseDuration(a.start_at, a.aggregate_at);
            const durB = calculatePreciseDuration(b.start_at, b.aggregate_at);
            if (durA !== durB) return sortOrder === 'desc' ? durA - durB : durB - durA;
            return b.id - a.id;
        }
        return sortOrder === 'desc' ? b.id - a.id : a.id - b.id;
    });
  }, [events, selectedYear, searchTerm, filters, sortOrder, sortType, eventDetails]);

  const toggleSortOrder = () => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc');

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

  const getCardTypeStyle = (type: string) => {
      switch(type) {
          case 'permanent': return 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300';
          case 'limited': return 'bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-700';
          case 'special_limited': return 'bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-700';
          default: return 'bg-slate-100 dark:bg-slate-700 text-slate-500';
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

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div className="w-full animate-fadeIn">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">{UI_TEXT.pastEvents.title}</h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-bold">{UI_TEXT.pastEvents.totalCountPrefix} {pastEventsTotalCount} {UI_TEXT.pastEvents.totalCountSuffix}</p>
          </div>
          <div className="w-full sm:w-auto">
              <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} placeholder={UI_TEXT.pastEvents.searchPlaceholder} />
          </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-6 border-b border-slate-200 dark:border-slate-700 pb-1">
        <button onClick={() => setSelectedYear('all')} className={`px-5 py-2 rounded-t-lg font-bold text-sm transition-all duration-200 border-b-2 ${selectedYear === 'all' ? 'bg-white dark:bg-slate-800 text-cyan-600 dark:text-cyan-400 border-cyan-500' : 'text-slate-500 dark:text-slate-400 border-transparent hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/50'}`}>{UI_TEXT.pastEvents.filterAll}</button>
        {years.map(year => (
          <button key={year} onClick={() => setSelectedYear(year)} className={`px-5 py-2 rounded-t-lg font-bold text-sm transition-all duration-200 border-b-2 ${selectedYear === year ? 'bg-white dark:bg-slate-800 text-cyan-600 dark:text-cyan-400 border-cyan-500' : 'text-slate-500 dark:text-slate-400 border-transparent hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/50'}`}>{year}</button>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-6">
          <div className="flex flex-wrap gap-3 items-center w-full">
             <div className="flex rounded-lg border border-slate-300 dark:border-slate-700 overflow-hidden bg-white dark:bg-slate-800 shadow-sm h-[34px]">
                 <select value={sortType} onChange={(e) => setSortType(e.target.value as 'id' | 'duration')} className="bg-transparent text-slate-700 dark:text-slate-300 text-xs font-bold p-1.5 px-3 outline-none border-r border-slate-300 dark:border-slate-700 cursor-pointer">
                     <option value="id">{UI_TEXT.pastEvents.sortLabel.id}</option>
                     <option value="duration">{UI_TEXT.pastEvents.sortLabel.duration}</option>
                 </select>
                 <button onClick={toggleSortOrder} className="px-3 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center justify-center">
                    {sortOrder === 'desc' ? (
                        <svg className="w-4 h-4 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
                    ) : (
                        <svg className="w-4 h-4 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                    )}
                 </button>
             </div>
             <EventFilterGroup filters={filters} onFilterChange={setFilters} mode="multi" containerClassName="flex flex-wrap gap-3 items-center" itemClassName="min-w-[110px]" />
          </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
        {filteredEvents.length > 0 ? (
            filteredEvents.map(event => {
                const status = getEventStatus(event.start_at, event.aggregate_at, event.closed_at, event.ranking_announce_at);
                const isClickable = status === 'past';
                const duration = calculateDisplayDuration(event.start_at, event.aggregate_at);
                
                const details = eventDetails[event.id] || { unit: "99", type: "marathon", banner: "", storyType: "unit_event", cardType: "permanent" };
                const unitInfo = UNIT_MASTER[details.unit];
                const unitLabel = unitInfo?.name || "Unknown";
                const eventColor = getEventColor(event.id);
                
                const bannerChar = getChar(details.banner);
                const bannerName = bannerChar ? bannerChar.name : details.banner;
                const bannerImg = (details.banner !== '-') ? getAssetUrl(details.banner, 'character') : null;
                const eventLogoUrl = getAssetUrl(event.id.toString(), 'event');

                const starCards = details["4starcard"]?.split(',').map(id => id.trim()) || [];

                return (
                    <button key={event.id} disabled={!isClickable} onClick={() => isClickable && onSelectEvent(event.id, event.name)} className={`text-left bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg p-4 transition-all duration-200 w-full relative overflow-hidden flex flex-col justify-between h-full ${isClickable ? 'hover:border-cyan-500/50 hover:bg-slate-50 dark:hover:bg-slate-800 group cursor-pointer hover:-translate-y-1 shadow-sm hover:shadow-md' : 'opacity-60 cursor-not-allowed grayscale-[0.5]'}`}>
                        
                        {/* 右上角狀態標籤 - 絕對定位覆蓋日期區 */}
                        {status !== 'past' && (
                            <div className="absolute top-0 right-0 z-20">
                                <div className={`px-3 py-1.5 rounded-bl-xl font-black text-[11px] text-white shadow-lg flex items-center gap-1.5 transition-all ${
                                    status === 'live' ? 'bg-cyan-500 animate-pulse' : 
                                    status === 'aggregating' ? 'bg-amber-500' : 'bg-slate-500'
                                }`}>
                                    {status === 'live' && (
                                        <span className="relative flex h-2 w-2">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                                        </span>
                                    )}
                                    {status === 'live' ? UI_TEXT.pastEvents.status.live : status === 'aggregating' ? UI_TEXT.pastEvents.status.aggregating : UI_TEXT.pastEvents.status.upcoming}
                                </div>
                            </div>
                        )}

                        <div>
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex flex-col gap-1.5 items-start">
                                    <div className="flex items-center gap-1">
                                        <span className={`text-xs font-mono py-0.5 px-1.5 rounded transition-colors ${isClickable ? 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 group-hover:bg-cyan-100 dark:group-hover:bg-cyan-900/50 group-hover:text-cyan-700 dark:group-hover:text-cyan-300' : 'bg-slate-100 dark:bg-slate-700 text-slate-400'}`}>#{event.id}</span>
                                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-600">{getTypeLabel(details.type)}</span>
                                    </div>
                                    <div className="flex gap-1 mt-0.5">
                                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-600">{getStoryTypeLabel(details.storyType)}</span>
                                        <span className={`text-[9px] px-1.5 py-0.5 rounded ${getCardTypeStyle(details.cardType)}`}>{getCardTypeLabel(details.cardType)}</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-xs text-slate-500">{new Date(event.start_at).toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' })} {' - '} {new Date(event.aggregate_at).toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' })}</div>
                                    <div className="text-[10px] text-slate-400 font-medium mt-0.5">{duration} 日</div>
                                </div>
                            </div>
                            
                            <div className="flex flex-col mb-1">
                                {eventLogoUrl && <img src={eventLogoUrl} alt="Logo" className="h-auto object-contain my-2 rounded-md max-h-24 self-start max-w-full" onError={(e) => e.currentTarget.style.display = 'none'} />}
                                <h3 className={`text-lg font-bold transition-colors line-clamp-2 leading-snug`} style={{ color: isClickable && eventColor ? eventColor : undefined }}>{event.name}</h3>
                            </div>
                            
                            {/* Banner 區塊：World Link 時直接隱藏，並改為 [角色名][角色頭像] 順序 */}
                            {details.banner !== '-' && (
                                <div className="flex items-center gap-2 mb-3 mt-2 h-7">
                                    <span className="text-xs text-slate-400 font-bold whitespace-nowrap">{UI_TEXT.pastEvents.labels.banner}</span>
                                    <div className="flex items-center gap-1.5 overflow-hidden">
                                        <span className="text-xs font-black truncate" style={{ color: bannerChar?.color || 'inherit' }}>
                                            {bannerName}
                                        </span>
                                        {bannerImg && (
                                            <img 
                                                src={bannerImg} 
                                                alt={bannerName} 
                                                className="w-7 h-7 rounded-full border border-slate-200 dark:border-slate-600 object-cover flex-shrink-0" 
                                            />
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* 底部：團體置左，四星置右 */}
                        <div className="mt-auto pt-3 border-t border-slate-200 dark:border-slate-700/50 flex items-center justify-between gap-2">
                            {/* 團體標籤 (置左) */}
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${unitInfo?.style || "bg-slate-500 text-white"} flex items-center gap-1 flex-shrink-0`}>
                                {details.unit !== '99' && getAssetUrl(details.unit, 'unit') && <img src={getAssetUrl(details.unit, 'unit')} alt={unitLabel} className="w-3 h-3 object-contain" />}
                                {unitLabel}
                            </span>

                            {/* 四星卡頭像 (置右) */}
                            {starCards.length > 0 && (
                                <div className="flex flex-wrap justify-end gap-1 overflow-hidden">
                                    {starCards.map((cId, idx) => {
                                        const img = getAssetUrl(cId, 'character');
                                        const charName = getChar(cId.split('-')[0])?.name || cId;
                                        return img ? (
                                            <img key={`${cId}-${idx}`} src={img} alt={charName} title={charName} className="w-6 h-6 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-100 object-cover shadow-sm" />
                                        ) : null;
                                    })}
                                </div>
                            )}
                        </div>
                    </button>
                );
            })
        ) : (
            <div className="col-span-full text-center py-16 text-slate-500 bg-slate-100 dark:bg-slate-800/30 rounded-lg border border-slate-200 dark:border-slate-700 border-dashed">
                <p className="text-lg mb-1">{UI_TEXT.pastEvents.noData.title}</p>
                <p className="text-sm">{UI_TEXT.pastEvents.noData.desc}</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default PastEventsView;
