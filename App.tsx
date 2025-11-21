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

const API_URL = 'https://api.hisekai.org/event/live/top100';
const BORDER_API_URL = 'https://api.hisekai.org/event/live/border';
const ITEMS_PER_PAGE = 20;

// Regex to catch large integers (15+ digits) associated with keys ending in Id or id, and wrap them in quotes.
const BIGINT_REGEX = /"(\w*Id|id)"\s*:\s*(\d{15,})/g;

const App: React.FC = () => {
  // --- Navigation State ---
  const [currentView, setCurrentView] = useState<'live' | 'past' | 'comparison' | 'analysis'>('live');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // For Mobile (Off-canvas)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false); // For Desktop (Mini-width)
  const [selectedEvent, setSelectedEvent] = useState<{ id: number, name: string } | null>(null);

  // --- Rankings Data State ---
  const [rankings, setRankings] = useState<RankEntry[]>([]);
  const [cachedLiveRankings, setCachedLiveRankings] = useState<RankEntry[]>([]); // Cache for live rankings
  const [cachedPastRankings, setCachedPastRankings] = useState<RankEntry[]>([]); // Cache for past rankings
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>('score');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [eventName, setEventName] = useState('Hisekai Live TW Rankings');
  
  // --- UI Toggle State ---
  const [isRankingsOpen, setIsRankingsOpen] = useState(true);
  const [isChartsOpen, setIsChartsOpen] = useState(true);
  const [currentPage, setCurrentPage] = useState<number | 'highlights'>(1);

  // Function to fetch LIVE rankings
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
                    speed: item.last_1h_stats?.speed ?? 0,
                    average: item.last_1h_stats?.average ?? 0,
                },
                last3h: {
                    count: item.last_3h_stats?.count ?? 0,
                    speed: item.last_3h_stats?.speed ?? 0,
                    average: item.last_3h_stats?.average ?? 0,
                },
                last24h: {
                    count: item.last_24h_stats?.count ?? 0,
                    speed: item.last_24h_stats?.speed ?? 0,
                    average: item.last_24h_stats?.average ?? 0,
                },
            },
            user: {
              id: String(item.last_player_info.profile.id),
              username: item.name,
              display_name: item.name,
              avatar: `https://storage.sekai.best/sekai-assets/thumbnail/chara_card_cutout/card_cutout_${item.last_player_info.card.id}_normal.png`,
              supporter_tier: 0, 
            }
          }));
          
          setRankings(transformedRankings);
          setCachedLiveRankings(transformedRankings); // Update cache
          setEventName(responseData.name);
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

  // Function to fetch BORDER rankings (Highlights)
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
              const zeroStat = { count: 0, speed: 0, average: 0 };
              const transformedRankings: RankEntry[] = responseData.border_player_rankings.map(item => ({
                  rank: item.rank,
                  score: item.score,
                  lastPlayedAt: '', // Border data doesn't include timestamps
                  stats: { last1h: zeroStat, last3h: zeroStat, last24h: zeroStat },
                  user: {
                      id: String(item.last_player_info.profile.id),
                      username: item.name,
                      display_name: item.name,
                      avatar: `https://storage.sekai.best/sekai-assets/thumbnail/chara_card_cutout/card_cutout_${item.last_player_info.card.id}_normal.png`,
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

  // Function to fetch PAST rankings
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
            const zeroStat = { count: 0, speed: 0, average: 0 };
            const transformedRankings: RankEntry[] = responseData.rankings.map(item => ({
                rank: item.rank,
                score: item.score,
                lastPlayedAt: '',
                stats: { last1h: zeroStat, last3h: zeroStat, last24h: zeroStat },
                user: {
                    id: String(item.userId),
                    username: item.name,
                    display_name: item.name,
                    avatar: `https://storage.sekai.best/sekai-assets/thumbnail/chara_card_cutout/card_cutout_${item.userCard.cardId}_normal.png`,
                    supporter_tier: 0
                }
            }));

            setRankings(transformedRankings);
            setCachedPastRankings(transformedRankings); // Update cache
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

  // Function to fetch PAST BORDER rankings (Highlights)
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
            const zeroStat = { count: 0, speed: 0, average: 0 };
            const transformedRankings: RankEntry[] = responseData.borderRankings.map(item => ({
                rank: item.rank,
                score: item.score,
                lastPlayedAt: '',
                stats: { last1h: zeroStat, last3h: zeroStat, last24h: zeroStat },
                user: {
                    id: String(item.userId),
                    username: item.name,
                    display_name: item.name,
                    avatar: `https://storage.sekai.best/sekai-assets/thumbnail/chara_card_cutout/card_cutout_${item.userCard.cardId}_normal.png`,
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

  // Data fetching effect
  useEffect(() => {
    if (currentView === 'live') {
        // If switching to live from elsewhere, or initial load
        fetchLiveRankings();
        setCurrentPage(1);
    } else if (currentView === 'past' && selectedEvent) {
        fetchPastRankings(selectedEvent.id);
        setEventName(selectedEvent.name);
        setCurrentPage(1);
    }
  }, [currentView, selectedEvent]);

  // Handle Page Change
  const handlePageChange = (page: number | 'highlights') => {
      setCurrentPage(page);
      
      if (currentView === 'live') {
          if (page === 'highlights') {
              fetchBorderRankings();
          } else {
              // If we were in highlights, restore cached live rankings
              if (currentPage === 'highlights') {
                   setRankings(cachedLiveRankings);
              }
              // Optimization: If cached rankings are empty (e.g. refresh), fetch again
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

  // Reset pagination when filters change (except when entering highlights mode intentionally)
  useEffect(() => {
    if (currentPage !== 'highlights') {
        setCurrentPage(1);
    }
  }, [searchTerm, sortOption, currentView, selectedEvent]);

  // Sort logic
  const sortedAndFilteredRankings = useMemo(() => {
    const filtered = rankings.filter(entry =>
      entry.user.display_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Skip sorting if in Highlights mode (usually pre-sorted by specific ranks, or strictly score)
    // But applying score sort doesn't hurt.
    const sorted = [...filtered].sort((a, b) => {
        switch (sortOption) {
            case 'lastPlayedAt':
                if(!a.lastPlayedAt) return 1;
                if(!b.lastPlayedAt) return -1;
                return new Date(b.lastPlayedAt).getTime() - new Date(a.lastPlayedAt).getTime();
            case 'last1h_count': return b.stats.last1h.count - a.stats.last1h.count;
            case 'last1h_speed': return b.stats.last1h.speed - a.stats.last1h.speed;
            case 'last1h_average': return b.stats.last1h.average - a.stats.last1h.average;
            case 'last3h_count': return b.stats.last3h.count - a.stats.last3h.count;
            case 'last3h_speed': return b.stats.last3h.speed - a.stats.last3h.speed;
            case 'last3h_average': return b.stats.last3h.average - a.stats.last3h.average;
            case 'last24h_count': return b.stats.last24h.count - a.stats.last24h.count;
            case 'last24h_speed': return b.stats.last24h.speed - a.stats.last24h.speed;
            case 'last24h_average': return b.stats.last24h.average - a.stats.last24h.average;
            case 'score':
            default:
                return b.score - a.score;
        }
    });
    
    // In Highlights mode, ranks are fixed (e.g. 100, 200...), don't overwrite them with index+1
    if (currentPage === 'highlights') {
        return sorted;
    }

    return sorted.map((entry, index) => ({
        ...entry,
        rank: index + 1,
    }));

  }, [searchTerm, rankings, sortOption, currentPage]);
  
  // Pagination Logic
  const paginatedRankings = useMemo(() => {
    if (currentPage === 'highlights') {
        return sortedAndFilteredRankings; // Show all for highlights
    }
    // Safe check for number type
    const pageNum = typeof currentPage === 'number' ? currentPage : 1;
    const startIndex = (pageNum - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return sortedAndFilteredRankings.slice(startIndex, endIndex);
  }, [sortedAndFilteredRankings, currentPage]);

  
  // Render Content
  const renderContent = () => {
      const isPastMode = currentView === 'past' && selectedEvent !== null;
      const isHighlights = currentPage === 'highlights';
      
      // Stats are hidden for Past Events OR Highlights
      const shouldHideStats = isPastMode || isHighlights;
      
      if (isLoading) return <LoadingSpinner />;
      if (error) return <ErrorMessage message={error} />;

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
            />
            </CollapsibleSection>
            
            <CollapsibleSection
            title={isPastMode ? `前百排行榜 (Top 100 Rankings) - ${selectedEvent?.name}` : (isHighlights ? "精彩片段 (Highlights)" : "前百排行榜 (Top 100 Rankings)")}
            isOpen={isRankingsOpen}
            onToggle={() => setIsRankingsOpen(!isRankingsOpen)}
            >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
                <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
                
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    {/* Pagination with Highlights support */}
                    <Pagination
                        totalItems={100} // Fixed to 100 for Live mode main pages, and Past Mode Top 100
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
            />
            </CollapsibleSection>
        </div>
      );
  };

  return (
    <div className="flex bg-slate-900 min-h-screen text-slate-200 font-sans">
        <Sidebar 
            currentView={currentView}
            setCurrentView={setCurrentView}
            isOpen={isSidebarOpen}
            toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
            isCollapsed={isSidebarCollapsed}
            toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />

        <div className={`flex-1 transition-all duration-300 ${isSidebarCollapsed ? 'ml-0 md:ml-20' : 'ml-0 md:ml-64'}`}>
            {/* Mobile Header */}
            <div className="md:hidden flex items-center justify-between p-4 bg-slate-800 border-b border-slate-700 sticky top-0 z-10">
                <div className="flex items-center">
                    <div className="bg-cyan-500/20 p-2 rounded-lg mr-3">
                        <TrophyIcon className="w-6 h-6 text-cyan-400" />
                    </div>
                    <h1 className="text-lg font-bold text-white">Hisekai TW</h1>
                </div>
                <button 
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className="p-2 text-slate-400 hover:text-white focus:outline-none"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                </button>
            </div>

            <main className="p-4 md:p-6 mx-auto w-full">
                {/* View Switcher Logic */}
                {currentView === 'live' && (
                    <>
                        <div className="flex flex-col sm:flex-row justify-between items-end mb-6 gap-4">
                            <div>
                                <h2 className="text-2xl font-bold text-white mb-1">{eventName}</h2>
                                <p className="text-slate-400 text-sm">
                                    最後更新: {lastUpdated ? lastUpdated.toLocaleTimeString() : '更新中...'}
                                </p>
                            </div>
                        </div>
                        {renderContent()}
                    </>
                )}

                {currentView === 'past' && !selectedEvent && (
                    <PastEventsView onSelectEvent={(id, name) => setSelectedEvent({ id, name })} />
                )}

                {currentView === 'past' && selectedEvent && (
                    <>
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                             <button 
                                onClick={() => setSelectedEvent(null)}
                                className="flex items-center text-cyan-400 hover:text-cyan-300 transition-colors"
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
            </main>
        </div>
    </div>
  );
};

export default App;