
import React, { useState, useEffect, useMemo } from 'react';
import { RankEntry, HisekaiApiResponse, SortOption } from './types';
import SearchBar from './components/SearchBar';
import RankingList from './components/RankingList';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorMessage from './components/ErrorMessage';
import TrophyIcon from './components/icons/TrophyIcon';
import SortSelector from './components/SortSelector';
import CollapsibleSection from './components/CollapsibleSection';
import ChartAnalysis from './components/ChartAnalysis';

const API_URL = 'https://api.hisekai.org/event/live/tw';

const App: React.FC = () => {
  const [rankings, setRankings] = useState<RankEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>('score');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [eventName, setEventName] = useState('Hisekai Live TW Rankings');
  const [isRankingsOpen, setIsRankingsOpen] = useState(true);
  const [isChartsOpen, setIsChartsOpen] = useState(true);

  useEffect(() => {
    const fetchRankings = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(API_URL);
        if (!response.ok) {
          throw new Error(`API request failed with status: ${response.status}`);
        }
        const responseData: HisekaiApiResponse = await response.json();
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
          setEventName(responseData.name);

        } else {
          throw new Error('Unexpected API response format.');
        }
        setLastUpdated(new Date());
      } catch (e) {
        if (e instanceof Error) {
          setError(`Failed to fetch rankings: ${e.message}`);
        } else {
          setError('An unknown error occurred while fetching data.');
        }
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRankings();
  }, []);

  const sortedAndFilteredRankings = useMemo(() => {
    const filtered = rankings.filter(entry =>
      entry.user.display_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const sorted = [...filtered].sort((a, b) => {
        switch (sortOption) {
            case 'lastPlayedAt':
                return new Date(b.lastPlayedAt).getTime() - new Date(a.lastPlayedAt).getTime();
            case 'last1h_count':
                return b.stats.last1h.count - a.stats.last1h.count;
            case 'last1h_speed':
                return b.stats.last1h.speed - a.stats.last1h.speed;
            case 'last1h_average':
                return b.stats.last1h.average - a.stats.last1h.average;
            case 'last3h_count':
                return b.stats.last3h.count - a.stats.last3h.count;
            case 'last3h_speed':
                return b.stats.last3h.speed - a.stats.last3h.speed;
            case 'last3h_average':
                return b.stats.last3h.average - a.stats.last3h.average;
            case 'last24h_count':
                return b.stats.last24h.count - a.stats.last24h.count;
            case 'last24h_speed':
                return b.stats.last24h.speed - a.stats.last24h.speed;
            case 'last24h_average':
                return b.stats.last24h.average - a.stats.last24h.average;
            case 'score':
            default:
                return b.score - a.score;
        }
    });
    
    // Re-assign ranks based on the new sort order
    return sorted.map((entry, index) => ({
        ...entry,
        rank: index + 1,
    }));

  }, [searchTerm, rankings, sortOption]);

  const renderContent = () => {
    if (isLoading) {
      return <LoadingSpinner />;
    }
    if (error) {
      return <ErrorMessage message={error} />;
    }
    return (
      <>
        <CollapsibleSection
          title="Chart Analysis"
          isOpen={isChartsOpen}
          onToggle={() => setIsChartsOpen(!isChartsOpen)}
        >
          <ChartAnalysis rankings={sortedAndFilteredRankings} sortOption={sortOption} />
        </CollapsibleSection>
        
        <CollapsibleSection
          title="Ranking Details"
          isOpen={isRankingsOpen}
          onToggle={() => setIsRankingsOpen(!isRankingsOpen)}
        >
          <RankingList rankings={sortedAndFilteredRankings} sortOption={sortOption} />
        </CollapsibleSection>
      </>
    );
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 font-sans">
      <header className="sticky top-0 z-10 bg-slate-900/80 backdrop-blur-md shadow-lg shadow-cyan-500/10">
        <div className="container mx-auto px-4 py-4 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <TrophyIcon className="w-8 h-8 text-cyan-400" />
              <h1 className="text-2xl font-bold text-white tracking-tight text-center sm:text-left">
                {eventName}
              </h1>
            </div>
            <div className="w-full sm:w-auto">
              <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
            </div>
          </div>
          <SortSelector activeSort={sortOption} onSortChange={setSortOption} />
          {lastUpdated && (
             <p className="text-center sm:text-right text-xs text-slate-400 pt-2 border-t border-slate-800">
                Last updated: {lastUpdated.toLocaleTimeString()}
             </p>
          )}
        </div>
      </header>
      
      <main className="container mx-auto p-4">
        {renderContent()}
      </main>

      <footer className="text-center p-4 text-xs text-slate-500">
        <p>Built for Hisekai Community. Data from an unofficial public API.</p>
      </footer>
    </div>
  );
};

export default App;