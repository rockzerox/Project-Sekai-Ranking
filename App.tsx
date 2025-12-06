
import React, { useState, useEffect, useMemo } from 'react';
import { RankEntry, HisekaiApiResponse, SortOption, PastEventApiResponse, HisekaiBorderApiResponse, PastEventBorderApiResponse } from './types';
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
import ResourceEstimatorView from './components/ResourceEstimatorView';
import PlayerProfileView from './components/PlayerProfileView';
import HomeView from './components/HomeView';
import { getEventColor, EVENT_DETAILS, UNIT_STYLES, getAssetUrl } from './constants';

const API_URL = 'https://api.hisekai.org/event/live/top100';
const BORDER_API_URL = 'https://api.hisekai.org/event/live/border';
const ITEMS_PER_PAGE = 20;

const BIGINT_REGEX = /"(\w*Id|id)"\s*:\s*(\d{15,})/g;

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

            setTimeLeft(
                `${String(days).padStart(2, '0')}日:${String(hours).padStart(2, '0')}時:${String(minutes).padStart(2, '0')}分:${String(seconds).padStart(2, '0')}秒`
            );
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

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<'home' | 'live' | 'past' | 'comparison' | 'analysis' | 'trend' | 'worldLink' | 'playerAnalysis' | 'resourceEstimator' | 'playerProfile'>('home');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<{ id: number, name: string } | null>(null);
  
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
      if (theme === 'dark') {
          document.documentElement.classList.add('dark');
      } else {
          document.documentElement.classList.remove('dark');
      }
  }, [theme]);

  const toggleTheme = () => {
      setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const [rankings, setRankings] = useState<RankEntry[]>([]);
  const [cachedLiveRankings, setCachedLiveRankings] = useState<RankEntry[]>([]);
  const [cachedPastRankings, setCachedPastRankings] = useState<RankEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>('score');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [eventName, setEventName] = useState('Hisekai Live TW Rankings');
  const [liveEventId, setLiveEventId] = useState<number | null>(null);
  const [liveEventTiming, setLiveEventTiming] = useState<{ aggregateAt: string, rankingAnnounceAt: string } | null>(null);
  
  const [isRankingsOpen, setIsRankingsOpen] = useState(true);
  const [isChartsOpen, setIsChartsOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState<number | 'highlights'>(1);

  // Manage Chart Collapse State based on View
  useEffect(() => {
      if (currentView === 'live') {
          setIsChartsOpen(false); // Default collapsed for live events
      } else if (currentView === 'past' && selectedEvent) {
          setIsChartsOpen(false); // Default collapsed for past events
      }
  }, [currentView, selectedEvent]);

  const fetchLiveRankings = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(API_URL);
        if (!response.ok) {
          throw new Error(`API request failed with status: ${response.status}`);
        }
        
        const textData = await response.text();
        const sanitizedData = textData.replace(BIGINT_REGEX, '"$1": "$2"');
        
        const responseData: HisekaiApiResponse = JSON.parse(sanitizedData);

        if (responseData && Array.isArray(responseData.top_100_player_rankings)) {
          const transformedRankings: RankEntry[] = responseData.top_100_player_rankings.map(item => ({
            rank: item.rank,
            score: item.score,
            lastPlayedAt: item.last_played_at,
            stats: {
                last1h: {
                    count: item.last_1h_stats?.count ?? 0,
                    score: item.last_1h_stats?.score ?? 0,
                    speed: item.last_1h_stats?.speed ?? 0,
                    average: item.last_1h_stats?.average ?? 0,
                },
                last3h: {
                    count: item.last_3h_stats?.count ?? 0,
                    score: item.last_3h_stats?.score ?? 0,
                    speed: item.last_3h_stats?.speed ?? 0,
                    average: item.last_3h_stats?.average ?? 0,
                },
                last24h: {
                    count: item.last_24h_stats?.count ?? 0,
                    score: item.last_24h_stats?.score ?? 0,
                    speed: item.last_24h_stats?.speed ?? 0,
                    average: item.last_24h_stats?.average ?? 0,
                },
            },
            user: {
              id: String(item.last_player_info.profile.id),
              username: item.name,
              display_name: item.name,
              avatar: '',
              supporter_tier: 0, 
            }
          }));
          
          setRankings(transformedRankings);
          setCachedLiveRankings(transformedRankings);
          setEventName(responseData.name);
          if (responseData.id) {
              setLiveEventId(responseData.id);
          }
          if (responseData.aggregate_at && responseData.ranking_announce_at) {
              setLiveEventTiming({
                  aggregateAt: responseData.aggregate_at,
                  rankingAnnounceAt: responseData.ranking_announce_at
              });
          }
          setLastUpdated(new Date());

        } else {
          throw new Error('Unexpected API response format.');
        }
      } catch (e) {
        setError(e instanceof Error ? `取得排名失敗: ${e.message}` : '發生未知錯誤');
        console.error(e);
      } finally {
        setIsLoading(false);
      }
  };

  const fetchBorderRankings = async () => {
      setIsLoading(true);
      setError(null);
      try {
          const response = await fetch(BORDER_API_URL);
          if (!response.ok) throw new Error(`API request failed with status: ${response.status}`);

          const textData = await response.text();
          const sanitizedData = textData.replace(BIGINT_REGEX, '"$1": "$2"');
          const responseData: HisekaiBorderApiResponse = JSON.parse(sanitizedData);

          if (responseData && Array.isArray(responseData.border_player_rankings)) {
              const zeroStat = { count: 0, score: 0, speed: 0, average: 0 };
              const transformedRankings: RankEntry[] = responseData.border_player_rankings.map(item => ({
                  rank: item.rank,
                  score: item.score,
                  lastPlayedAt: '',
                  stats: { last1h: zeroStat, last3h: zeroStat, last24h: zeroStat },
                  user: {
                      id: String(item.last_player_info.profile.id),
                      username: item.name,
                      display_name: item.name,
                      avatar: '',
                      supporter_tier: 0,
                  }
              }));
              setRankings(transformedRankings);
          }
      } catch (e) {
          setError(e instanceof Error ? `取得精彩片段失敗: ${e.message}` : '發生未知錯誤');
      } finally {
          setIsLoading(false);
      }
  }

  const fetchPastRankings = async (eventId: number) => {
    setIsLoading(true);
    setError(null);
    setRankings([]); 
    setSortOption('score'); 
    
    try {
        const response = await fetch(`https://api.hisekai.org/event/${eventId}/top100`);
        if (!response.ok) throw new Error('Failed to fetch past event rankings');

        const textData = await response.text();
        const sanitizedData = textData.replace(BIGINT_REGEX, '"$1": "$2"');
        
        const responseData: PastEventApiResponse = JSON.parse(sanitizedData);

        if (responseData && Array.isArray(responseData.rankings)) {
            const zeroStat = { count: 0, score: 0, speed: 0, average: 0 };
            const transformedRankings: RankEntry[] = responseData.rankings.map(item => ({
                rank: item.rank,
                score: item.score,
                lastPlayedAt: '',
                stats: { last1h: zeroStat, last3h: zeroStat, last24h: zeroStat },
                user: {
                    id: String(item.userId),
                    username: item.name,
                    display_name: item.name,
                    avatar: '',
                    supporter_tier: 0
                }
            }));

            setRankings(transformedRankings);
            setCachedPastRankings(transformedRankings);
            setLastUpdated(null);
        } else {
            throw new Error('Unexpected API response format.');
        }
    } catch (e) {
        setError(e instanceof Error ? `讀取活動失敗: ${e.message}` : '發生未知錯誤');
        console.error(e);
    } finally {
        setIsLoading(false);
    }
  };

  const fetchPastBorderRankings = async (eventId: number) => {
    setIsLoading(true);
    setError(null);
    try {
        const response = await fetch(`https://api.hisekai.org/event/${eventId}/border`);
        if (!response.ok) throw new Error('Failed to fetch past event highlights');

        const textData = await response.text();
        const sanitizedData = textData.replace(BIGINT_REGEX, '"$1": "$2"');
        const responseData: PastEventBorderApiResponse = JSON.parse(sanitizedData);

        if (responseData && Array.isArray(responseData.borderRankings)) {
            const zeroStat = { count: 0, score: 0, speed: 0, average: 0 };
            const transformedRankings: RankEntry[] = responseData.borderRankings.map(item => ({
                rank: item.rank,
                score: item.score,
                lastPlayedAt: '',
                stats: { last1h: zeroStat, last3h: zeroStat, last24h: zeroStat },
                user: {
                    id: String(item.userId),
                    username: item.name,
                    display_name: item.name,
                    avatar: '',
                    supporter_tier: 0
                }
            }));
            setRankings(transformedRankings);
        }
    } catch (e) {
        setError(e instanceof Error ? `取得精彩片段失敗: ${e.message}` : '發生未知錯誤');
        console.error(e);
    } finally {
        setIsLoading(false);
    }
  };

  useEffect(() => {
    if (currentView === 'live') {
        fetchLiveRankings();
        setCurrentPage(1);
    } else if (currentView === 'past' && selectedEvent) {
        fetchPastRankings(selectedEvent.id);
        setEventName(selectedEvent.name);
        setCurrentPage(1);
    }
  }, [currentView, selectedEvent]);

  const handlePageChange = (page: number | 'highlights') => {
      setCurrentPage(page);
      
      if (currentView === 'live') {
          if (page === 'highlights') {
              fetchBorderRankings();
          } else {
              if (currentPage === 'highlights') {
                   setRankings(cachedLiveRankings);
              }
              if (cachedLiveRankings.length === 0) {
                  fetchLiveRankings();
              }
          }
      } else if (currentView === 'past' && selectedEvent) {
          if (page === 'highlights') {
              fetchPastBorderRankings(selectedEvent.id);
          } else {
              if (currentPage === 'highlights') {
                  setRankings(cachedPastRankings);
              }
              if (cachedPastRankings.length === 0) {
                   fetchPastRankings(selectedEvent.id);
              }
          }
      }
  };

  useEffect(() => {
    if (currentPage !== 'highlights') {
        setCurrentPage(1);
    }
  }, [searchTerm, sortOption, currentView, selectedEvent]);

  const sortedAndFilteredRankings = useMemo(() => {
    const filtered = rankings.filter(entry =>
      entry.user.display_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const sorted = [...filtered].sort((a, b) => {
        switch (sortOption) {
            case 'lastPlayedAt':
                if(!a.lastPlayedAt) return 1;
                if(!b.lastPlayedAt) return -1;
                return new Date(b.lastPlayedAt).getTime() - new Date(a.lastPlayedAt).getTime();
            case 'last1h_count': return b.stats.last1h.count - a.stats.last1h.count;
            case 'last1h_score': return b.stats.last1h.score - a.stats.last1h.score;
            case 'last1h_speed': return b.stats.last1h.speed - a.stats.last1h.speed;
            case 'last1h_average': return b.stats.last1h.average - a.stats.last1h.average;
            case 'last3h_count': return b.stats.last3h.count - a.stats.last3h.count;
            case 'last3h_score': return b.stats.last3h.score - a.stats.last3h.score;
            case 'last3h_speed': return b.stats.last3h.speed - a.stats.last3h.speed;
            case 'last3h_average': return b.stats.last3h.average - a.stats.last3h.average;
            case 'last24h_count': return b.stats.last24h.count - a.stats.last24h.count;
            case 'last24h_score': return b.stats.last24h.score - a.stats.last24h.score;
            case 'last24h_speed': return b.stats.last24h.speed - a.stats.last24h.speed;
            case 'last24h_average': return b.stats.last24h.average - a.stats.last24h.average;
            case 'score':
            default:
                return b.score - a.score;
        }
    });
    
    if (currentPage === 'highlights') {
        return sorted;
    }

    return sorted.map((entry, index) => ({
        ...entry,
        rank: index + 1,
    }));

  }, [searchTerm, rankings, sortOption, currentPage]);
  
  const paginatedRankings = useMemo(() => {
    if (currentPage === 'highlights') {
        return sortedAndFilteredRankings;
    }
    const pageNum = typeof currentPage === 'number' ? currentPage : 1;
    const startIndex = (pageNum - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return sortedAndFilteredRankings.slice(startIndex, endIndex);
  }, [sortedAndFilteredRankings, currentPage]);

  // Check calculation status for Live Event
  const isCalculating = useMemo(() => {
      if (currentView !== 'live' || !liveEventTiming) return false;
      const now = new Date();
      const agg = new Date(liveEventTiming.aggregateAt);
      const announce = new Date(liveEventTiming.rankingAnnounceAt);
      return now >= agg && now < announce;
  }, [currentView, liveEventTiming]);

  const renderContent = () => {
      const isPastMode = currentView === 'past' && selectedEvent !== null;
      const isHighlights = currentPage === 'highlights';
      const shouldHideStats = isPastMode || isHighlights;
      
      if (isLoading) return <LoadingSpinner />;
      if (error) return <ErrorMessage message={error} />;

      // Special View for Calculating Phase in Live Mode
      if (currentView === 'live' && isCalculating && liveEventTiming) {
          return (
              <div className="flex flex-col items-center justify-center py-20 animate-fadeIn text-center">
                  <div className="bg-amber-100 dark:bg-amber-900/30 p-8 rounded-2xl border border-amber-200 dark:border-amber-700 shadow-lg max-w-lg w-full mx-4">
                      <div className="mb-6 flex justify-center">
                          <div className="p-4 bg-amber-500/20 rounded-full">
                              <svg className="w-16 h-16 text-amber-500 dark:text-amber-400 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
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

      // Construct the Rich Title for Past Events
      let rankingsTitle: React.ReactNode = "前百排行榜 (Top 100 Rankings)";
      
      if (isPastMode && selectedEvent) {
          const details = EVENT_DETAILS[selectedEvent.id];
          const color = getEventColor(selectedEvent.id);
          const unitLogo = getAssetUrl(details?.unit, 'unit');
          const bannerImg = getAssetUrl(details?.banner, 'character');
          const eventLogoUrl = getAssetUrl(selectedEvent.id.toString(), 'event');
          const unitStyle = UNIT_STYLES[details?.unit] || "bg-slate-500 text-white";

          rankingsTitle = (
              <div className="flex flex-wrap items-center gap-2 text-lg sm:text-xl">
                  <span>前百排行榜 (Top 100) - </span>
                  {eventLogoUrl && (
                      <img 
                          src={eventLogoUrl} 
                          alt="Logo" 
                          className="h-8 w-auto object-contain mr-1"
                          onError={(e) => e.currentTarget.style.display = 'none'}
                      />
                  )}
                  <span style={{ color: color || 'inherit' }} className="mr-2">{selectedEvent.name}</span>
                  
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${unitStyle}`}>
                      {unitLogo && details.unit !== 'Mix' && (
                          <img src={unitLogo} alt={details.unit} className="w-4 h-4 object-contain" />
                      )}
                      {details?.unit}
                  </span>

                  {bannerImg && (
                      <img 
                          src={bannerImg} 
                          alt={details?.banner} 
                          className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-600 object-cover ml-1"
                          title={`Banner: ${details?.banner}`}
                      />
                  )}
              </div>
          );
      } else if (isHighlights) {
          rankingsTitle = "精彩片段 (Highlights)";
      }

      return (
        <div className="animate-fadeIn">
            <CollapsibleSection
                title="圖表分析 (Chart Analysis)"
                isOpen={isChartsOpen}
                onToggle={() => setIsChartsOpen(!isChartsOpen)}
            >
            <ChartAnalysis 
                rankings={sortedAndFilteredRankings} 
                sortOption={sortOption}
                isHighlights={isHighlights} 
                eventId={isPastMode ? selectedEvent?.id : undefined}
            />
            </CollapsibleSection>
            
            <CollapsibleSection
                title={rankingsTitle}
                isOpen={isRankingsOpen}
                onToggle={() => setIsRankingsOpen(!isRankingsOpen)}
            >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
                <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
                
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <Pagination
                        totalItems={100}
                        itemsPerPage={ITEMS_PER_PAGE}
                        currentPage={currentPage}
                        onPageChange={handlePageChange}
                        activeSort={sortOption}
                    />
                    
                    <SortSelector 
                        activeSort={sortOption} 
                        onSortChange={setSortOption} 
                        limitToScore={shouldHideStats}
                    />
                </div>
            </div>
            <RankingList 
                rankings={paginatedRankings} 
                sortOption={sortOption} 
                hideStats={shouldHideStats}
                aggregateAt={currentView === 'live' ? liveEventTiming?.aggregateAt : undefined}
            />
            </CollapsibleSection>
        </div>
      );
  };

  return (
    <div className="flex bg-slate-50 dark:bg-slate-900 min-h-screen text-slate-900 dark:text-slate-200 font-sans transition-colors duration-300">
        <Sidebar 
            currentView={currentView}
            setCurrentView={setCurrentView}
            isOpen={isSidebarOpen}
            toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
            isCollapsed={isSidebarCollapsed}
            toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            theme={theme}
            toggleTheme={toggleTheme}
        />

        <div className="flex-1 transition-all duration-300 w-full">
            <div className="md:hidden flex items-center justify-between p-4 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10">
                <div className="flex items-center">
                    <div className="bg-cyan-500/20 p-2 rounded-lg mr-3">
                        <TrophyIcon className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
                    </div>
                    <h1 className="text-lg font-bold text-slate-900 dark:text-white">Hisekai TW</h1>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={toggleTheme} className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">
                        {theme === 'dark' ? (
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                        ) : (
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
                        )}
                    </button>
                    <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white focus:outline-none">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>
                </div>
            </div>

            <main className="p-4 w-full">
                {currentView === 'home' && (
                    <HomeView setCurrentView={setCurrentView} />
                )}

                {currentView === 'live' && (
                    <div className="animate-fadeIn">
                        <div className="mb-6">
                            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">現時活動 (Live Event)</h2>
                            <div className="flex flex-col sm:flex-row justify-between items-end gap-4">
                                <div className="flex items-center gap-3">
                                    {liveEventId && (
                                        <img 
                                            src={getAssetUrl(liveEventId.toString(), 'event') || ''} 
                                            alt="Logo" 
                                            className="h-12 w-auto object-contain rounded-md"
                                            onError={(e) => e.currentTarget.style.display = 'none'}
                                        />
                                    )}
                                    <div>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h2 
                                                className="text-xl sm:text-2xl font-bold mb-1"
                                                style={{ color: liveEventId ? getEventColor(liveEventId) : undefined }}
                                            >
                                                {eventName}
                                            </h2>
                                            {liveEventTiming && (
                                                <EventHeaderCountdown targetDate={liveEventTiming.aggregateAt} />
                                            )}
                                        </div>
                                        <p className="text-slate-500 dark:text-slate-400 text-sm">
                                            最後更新: {lastUpdated ? lastUpdated.toLocaleTimeString() : '更新中...'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        {renderContent()}
                    </div>
                )}

                {currentView === 'past' && !selectedEvent && (
                    <PastEventsView onSelectEvent={(id, name) => setSelectedEvent({ id, name })} />
                )}

                {currentView === 'past' && selectedEvent && (
                    <>
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                             <button 
                                onClick={() => setSelectedEvent(null)}
                                className="flex items-center text-cyan-600 dark:text-cyan-400 hover:text-cyan-500 dark:hover:text-cyan-300 transition-colors"
                             >
                                <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                                返回列表 (Back)
                             </button>
                        </div>
                         {renderContent()}
                    </>
                )}

                {currentView === 'comparison' && (
                    <EventComparisonView />
                )}
                
                {currentView === 'analysis' && (
                    <RankAnalysisView />
                )}

                {currentView === 'trend' && (
                    <RankTrendView />
                )}

                {currentView === 'worldLink' && (
                    <WorldLinkView />
                )}

                {currentView === 'playerAnalysis' && (
                    <PlayerAnalysisView />
                )}

                {currentView === 'resourceEstimator' && (
                    <ResourceEstimatorView />
                )}

                {currentView === 'playerProfile' && (
                    <PlayerProfileView />
                )}
            </main>
        </div>
    </div>
  );
};

export default App;
