
import React, { useState, useEffect, useMemo } from 'react';
import { SortOption, EventSummary } from './types';
import SearchBar from './components/SearchBar';
import RankingList from './components/RankingList';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorMessage from './components/ErrorMessage';
import TrophyIcon from './components/icons/TrophyIcon';
import SortSelector from './components/SortSelector';
import CollapsibleSection from './components/CollapsibleSection';
import ChartAnalysis from './components/ChartAnalysis';
import Pagination from './components/Pagination';
import Sidebar from './components/Sidebar';
import PastEventsView from './components/PastEventsView';
import EventComparisonView from './components/EventComparisonView';
import RankAnalysisView from './components/RankAnalysisView';
import RankTrendView from './components/RankTrendView';
import PlayerAnalysisView from './components/PlayerAnalysisView';
import WorldLinkView from './components/WorldLinkView';
import UnitAnalysisView from './components/UnitAnalysisView';
import CharacterAnalysisView from './components/CharacterAnalysisView';
import ResourceEstimatorView from './components/ResourceEstimatorView';
import PlayerProfileView from './components/PlayerProfileView';
import PlayerStructureView from './components/PlayerStructureView';
import EventDistributionView from './components/EventDistributionView';
import MySekaiMiningView from './components/MySekaiMiningView';
import HomeView from './components/HomeView';
import ErrorBoundary from './components/ErrorBoundary';
import ScrollToTop from './components/ui/ScrollToTop';
import { UNITS, getAssetUrl, CHARACTERS, API_BASE_URL, calculatePreciseDuration, UNIT_MASTER, getChar, MS_PER_DAY } from './constants';
import { useRankings, fetchJsonWithBigInt } from './hooks/useRankings';
import { ConfigProvider, useConfig } from './contexts/ConfigContext';
import { calculateCV, formatScoreForChart } from './utils/mathUtils';

const ITEMS_PER_PAGE = 20;

const CountdownTimer: React.FC<{ targetDate: string }> = ({ targetDate }) => {
    const [timeLeft, setTimeLeft] = useState('');
    useEffect(() => {
        const interval = setInterval(() => {
            const now = new Date().getTime();
            const target = new Date(targetDate).getTime();
            const distance = target - now;
            if (distance < 0) {
                setTimeLeft('即將公佈');
                clearInterval(interval);
                return;
            }
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);
            setTimeLeft(`${hours}小時 ${minutes}分 ${seconds}秒`);
        }, 1000);
        return () => clearInterval(interval);
    }, [targetDate]);
    return <span className="font-mono text-xl sm:text-2xl font-bold text-cyan-600 dark:text-cyan-400">{timeLeft}</span>;
};

const EventHeaderCountdown: React.FC<{ targetDate: string }> = ({ targetDate }) => {
    const [timeLeft, setTimeLeft] = useState('00日:00時:00分:00秒');
    useEffect(() => {
        const calculateTime = () => {
            const now = new Date().getTime();
            const target = new Date(targetDate).getTime();
            const distance = target - now;
            if (distance <= 0) {
                setTimeLeft('00日:00時:00分:00秒');
                return;
            }
            const days = Math.floor(distance / (1000 * 60 * 60 * 24));
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);
            setTimeLeft(`${String(days).padStart(2, '0')}日:${String(hours).padStart(2, '0')}時:${String(minutes).padStart(2, '0')}分:${String(seconds).padStart(2, '0')}秒`);
        };
        calculateTime();
        const interval = setInterval(calculateTime, 1000);
        return () => clearInterval(interval);
    }, [targetDate]);
    return (
        <span className="font-mono text-sm sm:text-base font-bold text-slate-500 dark:text-slate-400 ml-2 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded border border-slate-300 dark:border-slate-600">
            {timeLeft}
        </span>
    );
};

const MainContent: React.FC = () => {
  const [currentView, setCurrentView] = useState<'home' | 'live' | 'past' | 'distribution' | 'comparison' | 'analysis' | 'trend' | 'worldLink' | 'unitAnalysis' | 'characterAnalysis' | 'playerAnalysis' | 'playerStructure' | 'resourceEstimator' | 'playerProfile' | 'mySekaiMining'>('home');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<{ id: number, name: string } | null>(null);
  const [allEvents, setAllEvents] = useState<EventSummary[]>([]);
  const { eventDetails, getEventColor, isWorldLink, getWlDetail } = useConfig();
  const [activeChapter, setActiveChapter] = useState<string>('all');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  const {
      rankings, setRankings, worldLinkChapters, isLoading, error, eventName, liveEventId, liveEventTiming, lastUpdated,
      cachedLiveRankings, cachedPastRankings, fetchLiveRankings, fetchBorderRankings, fetchPastRankings, fetchPastBorderRankings, setEventName
  } = useRankings();

  useEffect(() => {
    const fetchAllEvents = async () => {
        try {
            const data = await fetchJsonWithBigInt(`${API_BASE_URL}/event/list`);
            if (data) setAllEvents(data);
        } catch (e) { console.error("App: Failed to fetch event list", e); }
    };
    fetchAllEvents();
  }, []);

  useEffect(() => {
      if (theme === 'dark') document.documentElement.classList.add('dark');
      else document.documentElement.classList.remove('dark');
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>('score');
  const [isRankingsOpen, setIsRankingsOpen] = useState(true);
  const [isChartsOpen, setIsChartsOpen] = useState(true);
  const [currentPage, setCurrentPage] = useState<number | 'highlights'>(1);

  useEffect(() => { setActiveChapter('all'); }, [selectedEvent]);

  // 核心修正：加入 currentPage 的判斷，避免精彩片段模式下被 Top 100 快取覆蓋
  useEffect(() => {
      if (currentPage === 'highlights') return;

      if (activeChapter === 'all') {
          const cache = currentView === 'live' ? cachedLiveRankings : cachedPastRankings;
          if (cache.length > 0) setRankings(cache);
      } else {
          if (worldLinkChapters[activeChapter]) setRankings(worldLinkChapters[activeChapter]);
          else setRankings([]);
      }
  }, [activeChapter, worldLinkChapters, cachedPastRankings, cachedLiveRankings, setRankings, currentPage, currentView]);

  useEffect(() => {
    if (currentView === 'live') { fetchLiveRankings(); setCurrentPage(1); } 
    else if (currentView === 'past' && selectedEvent) { fetchPastRankings(selectedEvent.id); setEventName(selectedEvent.name); setCurrentPage(1); }
  }, [currentView, selectedEvent, fetchLiveRankings, fetchPastRankings, setEventName]);

  const handlePageChange = (page: number | 'highlights') => {
      setCurrentPage(page);
      setActiveChapter('all'); 
      if (currentView === 'live') {
          if (page === 'highlights') fetchBorderRankings();
          else {
              if (cachedLiveRankings.length === 0) fetchLiveRankings();
              else setRankings(cachedLiveRankings);
          }
      } else if (currentView === 'past' && selectedEvent) {
          if (page === 'highlights') fetchPastBorderRankings(selectedEvent.id);
          else {
              if (cachedPastRankings.length === 0) fetchPastRankings(selectedEvent.id);
              else setRankings(cachedPastRankings);
          }
      }
  };

  useEffect(() => { if (currentPage !== 'highlights') setCurrentPage(1); }, [searchTerm, sortOption, currentView, selectedEvent]);

  const currentEventDuration = useMemo(() => {
      if (currentView === 'live' && liveEventTiming) {
          const now = Date.now();
          const start = new Date(liveEventTiming.startAt).getTime();
          const agg = new Date(liveEventTiming.aggregateAt).getTime();
          return Math.max(0.01, (Math.min(now, agg) - start) / MS_PER_DAY);
      } else if (currentView === 'past' && selectedEvent) {
          if (isWorldLink(selectedEvent.id) && activeChapter !== 'all') {
              const wlInfo = getWlDetail(selectedEvent.id);
              return wlInfo?.chDavg || 3;
          }
          const evt = allEvents.find(e => e.id === selectedEvent.id);
          if (evt) return calculatePreciseDuration(evt.start_at, evt.aggregate_at);
      }
      return 1;
  }, [currentView, liveEventTiming, selectedEvent, allEvents, activeChapter, isWorldLink, getWlDetail]);

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

  const isCalculating = useMemo(() => {
      if (currentView !== 'live' || !liveEventTiming) return false;
      const now = new Date();
      return now >= new Date(liveEventTiming.aggregateAt) && now < new Date(liveEventTiming.rankingAnnounceAt);
  }, [currentView, liveEventTiming]);

  const competitiveStats = useMemo(() => {
      const isPastMode = currentView === 'past' && selectedEvent !== null;
      const isLiveMode = currentView === 'live';
      if (!(isPastMode || isLiveMode)) return null;

      const isHighlights = currentPage === 'highlights';
      const getS = (rank: number) => rankings.find(r => r.rank === rank)?.score || 0;

      if (!isHighlights) {
          if (rankings.length < 100) return null;
          const s1 = getS(1); const s10 = getS(10); const s50 = getS(50); const s100 = getS(100);
          const range50_100 = rankings.filter(r => r.rank >= 50 && r.rank <= 100).map(r => r.score);
          
          return {
              type: 'top100',
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
              type: 'highlights',
              stats: [
                  calcStat('T100/T200', s100, s200, 'text-yellow-500'),
                  calcStat('T200/T300', s200, s300, 'text-purple-400'),
                  calcStat('T300/T400', s300, s400, 'text-cyan-400'),
                  calcStat('T400/T500', s400, s500, 'text-emerald-400'),
                  calcStat('T500/T1000', s500, s1000, 'text-pink-400')
              ]
          };
      }
  }, [currentView, selectedEvent, currentPage, rankings]);

  const StatsDisplay: React.FC<{ stats: any }> = ({ stats }) => {
      if (!stats) return null;
      return (
          <div className="flex flex-wrap items-center justify-end gap-x-6 gap-y-2">
              {stats.stats.map((s: any, i: number) => (
                  <div key={i} className="flex flex-col items-end">
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-black uppercase tracking-tighter">{s.label}</span>
                      <span className={`text-[12px] font-mono font-black ${s.color}`}>
                          {s.cv !== undefined ? (s.cv > 0 ? `${s.cv}%` : '—') : (s.diff > 0 ? `+${formatScoreForChart(s.diff)} (${s.ratio}x)` : '—')}
                      </span>
                  </div>
              ))}
          </div>
      );
  };

  const renderRankingUI = () => {
      const isPastMode = currentView === 'past' && selectedEvent !== null;
      const isHighlights = currentPage === 'highlights';
      const shouldHideStats = isPastMode || isHighlights;
      
      if (isLoading) return <LoadingSpinner />;
      if (error) return <ErrorMessage message={error} />;

      if (currentView === 'live' && isCalculating && liveEventTiming) {
          return (
              <div className="flex flex-col items-center justify-center py-20 animate-fadeIn text-center">
                  <div className="bg-amber-100 dark:bg-amber-900/30 p-8 rounded-2xl border border-amber-200 dark:border-amber-700 shadow-lg max-w-lg w-full mx-4">
                      <div className="mb-6 flex justify-center">
                          <div className="p-4 bg-amber-500/20 rounded-full">
                              <svg className="w-16 h-16 text-amber-500 dark:text-amber-400 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          </div>
                      </div>
                      <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">活動結算中請稍後...</h3>
                      <p className="text-slate-500 dark:text-slate-400 mb-6">正在統計最終排名數據，請耐心等待結果公佈。</p>
                      <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                          <p className="text-xs text-slate-400 uppercase tracking-widest mb-1">距離結果公佈 (Results in)</p>
                          <CountdownTimer targetDate={liveEventTiming.rankingAnnounceAt} />
                      </div>
                  </div>
              </div>
          );
      }

      let rankingsTitle: React.ReactNode = "前百排行榜 (Top 100 Rankings)";
      const isWl = isPastMode && selectedEvent && isWorldLink(selectedEvent.id);
      let WorldLinkTabs = null;

      if (isWl && selectedEvent) {
          const wlInfo = getWlDetail(selectedEvent.id);
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

      if (isPastMode && selectedEvent) {
          rankingsTitle = (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full gap-3">
                  <div className="flex items-center gap-3">
                      <span className="font-black whitespace-nowrap">{isHighlights ? "精彩片段" : "前百排行榜"}</span>
                  </div>
                  {WorldLinkTabs}
              </div>
          );
      } else if (isHighlights) rankingsTitle = "精彩片段 (Highlights)";

      return (
        <div className="animate-fadeIn">
            <CollapsibleSection title="圖表分析 (Chart Analysis)" isOpen={isChartsOpen} onToggle={() => setIsChartsOpen(!isChartsOpen)}>
                <ChartAnalysis rankings={sortedAndFilteredRankings} sortOption={sortOption} isHighlights={isHighlights} eventId={isPastMode ? selectedEvent?.id : undefined} />
            </CollapsibleSection>
            <CollapsibleSection title={rankingsTitle} isOpen={isRankingsOpen} onToggle={() => setIsRankingsOpen(!isRankingsOpen)}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <Pagination totalItems={100} itemsPerPage={ITEMS_PER_PAGE} currentPage={currentPage} onPageChange={handlePageChange} activeSort={sortOption} />
                    <SortSelector activeSort={sortOption} onSortChange={setSortOption} limitToScore={shouldHideStats} />
                </div>
                <RankingList rankings={paginatedRankings} sortOption={sortOption} hideStats={shouldHideStats} aggregateAt={currentView === 'live' ? liveEventTiming?.aggregateAt : undefined} eventDuration={currentEventDuration} />
            </CollapsibleSection>
        </div>
      );
  };

  const viewContent = () => {
      switch (currentView) {
          case 'home': return <HomeView setCurrentView={setCurrentView} />;
          case 'live':
              return (
                  <div className="animate-fadeIn">
                      <div className="mb-6">
                          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">現時活動 (Live Event)</h2>
                          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                              <div className="flex items-center gap-4 flex-1">
                                  {liveEventId && <img src={getAssetUrl(liveEventId.toString(), 'event') || ''} alt="Logo" className="h-14 w-auto object-contain rounded-md" onError={(e) => e.currentTarget.style.display = 'none'} />}
                                  <div>
                                      <div className="flex flex-wrap items-center gap-2">
                                          <h2 className="text-xl sm:text-2xl font-bold" style={{ color: getEventColor(liveEventId!) || '#06b6d4' }}>{eventName}</h2>
                                          {liveEventTiming && <EventHeaderCountdown targetDate={liveEventTiming.aggregateAt} />}
                                      </div>
                                      <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">最後更新: {lastUpdated ? lastUpdated.toLocaleTimeString() : '更新中...'}</p>
                                  </div>
                              </div>
                              <div className="flex-shrink-0 w-full lg:w-auto">
                                  <StatsDisplay stats={competitiveStats} />
                              </div>
                          </div>
                      </div>
                      {renderRankingUI()}
                  </div>
              );
          case 'past':
              if (selectedEvent) {
                  const details = eventDetails[selectedEvent.id];
                  const color = getEventColor(selectedEvent.id);
                  const unitLabel = UNIT_MASTER[details?.unit]?.name || "Unknown";
                  const unitLogo = getAssetUrl(details?.unit, 'unit');
                  const bannerChar = getChar(details?.banner || "");
                  const bannerImg = (details?.banner !== '-') ? getAssetUrl(details?.banner, 'character') : null;
                  const eventLogo = getAssetUrl(selectedEvent.id.toString(), 'event');
                  const unitStyle = UNIT_MASTER[details?.unit]?.style || "bg-slate-500 text-white";
                  const evtInfo = allEvents.find(e => e.id === selectedEvent.id);
                  const dateRangeStr = evtInfo ? (() => {
                      const start = new Date(evtInfo.start_at);
                      const end = new Date(evtInfo.aggregate_at);
                      const f = (d: Date) => d.toLocaleString(undefined, { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false });
                      return `${f(start)} ~ ${f(end)}`;
                  })() : '';

                  return (
                      <>
                          <div className="mb-6">
                              <button onClick={() => setSelectedEvent(null)} className="flex items-center text-cyan-600 dark:text-cyan-400 hover:text-cyan-500 font-bold mb-4 transition-colors">
                                  <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                                  返回列表 (Back)
                              </button>
                              <div className="flex flex-col lg:flex-row justify-between items-center gap-4 bg-white dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                                  <div className="flex items-center gap-3 flex-1 overflow-hidden min-w-0">
                                      {eventLogo && <img src={eventLogo} alt="Logo" className="h-10 sm:h-12 w-auto object-contain rounded flex-shrink-0" />}
                                      <div className="flex flex-col min-w-0">
                                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                              <span className="text-slate-400 font-mono text-xs sm:text-sm whitespace-nowrap">第{selectedEvent.id}期</span>
                                              <span style={{ color: color || 'inherit' }} className="font-black text-lg sm:text-xl truncate">{selectedEvent.name}</span>
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
                          {renderRankingUI()}
                      </>
                  );
              }
              return <PastEventsView onSelectEvent={(id, name) => setSelectedEvent({ id, name })} />;
          case 'distribution': return <EventDistributionView />;
          case 'comparison': return <EventComparisonView />;
          case 'analysis': return <RankAnalysisView />;
          case 'trend': return <RankTrendView />;
          case 'worldLink': return <WorldLinkView />;
          case 'unitAnalysis': return <UnitAnalysisView />;
          case 'characterAnalysis': return <CharacterAnalysisView />;
          case 'playerAnalysis': return <PlayerAnalysisView />;
          case 'playerStructure': return <PlayerStructureView />;
          case 'resourceEstimator': return <ResourceEstimatorView />;
          case 'playerProfile': return <PlayerProfileView />;
          case 'mySekaiMining': return <MySekaiMiningView />;
          default: return <HomeView setCurrentView={setCurrentView} />;
      }
  };

  return (
    <div className="flex bg-slate-50 dark:bg-slate-950 min-h-screen text-slate-900 dark:text-slate-200 font-sans transition-colors duration-300">
        <Sidebar currentView={currentView} setCurrentView={setCurrentView} isOpen={isSidebarOpen} toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} isCollapsed={isSidebarCollapsed} toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)} theme={theme} toggleTheme={toggleTheme} />
        <div className="flex-1 transition-all duration-300 w-full">
            <div className="md:hidden flex items-center justify-between p-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40">
                <div className="flex items-center">
                    <div className="bg-cyan-500/20 p-2 rounded-lg mr-3"><TrophyIcon className="w-6 h-6 text-cyan-600 dark:text-cyan-400" /></div>
                    <h1 className="text-lg font-black text-slate-900 dark:text-white">Hi Sekai TW</h1>
                </div>
                <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-slate-500 dark:text-slate-400"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg></button>
            </div>
            <main className="p-4 md:p-6 w-full custom-scrollbar">
                <ErrorBoundary>{viewContent()}</ErrorBoundary>
            </main>
        </div>
        <ScrollToTop />
    </div>
  );
};

const App: React.FC = () => (
    <ConfigProvider>
        <MainContent />
    </ConfigProvider>
);

export default App;
