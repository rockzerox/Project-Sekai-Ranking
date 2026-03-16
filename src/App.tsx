
import React, { useState, useEffect } from 'react';
import { EventSummary, ViewType } from './types';
import TrophyIcon from './components/icons/TrophyIcon';
import Sidebar from './components/layout/Sidebar';
import PastEventsView from './components/pages/PastEventsView';
import EventComparisonView from './components/pages/EventComparisonView';
import RankAnalysisView from './components/pages/RankAnalysisView';
import RankTrendView from './components/pages/RankTrendView';
import PlayerAnalysisView from './components/pages/PlayerAnalysisView';
import WorldLinkView from './components/pages/WorldLinkView';
import UnitAnalysisView from './components/pages/UnitAnalysisView';
import CharacterAnalysisView from './components/pages/CharacterAnalysisView';
import ResourceEstimatorView from './components/pages/ResourceEstimatorView';
import PlayerProfileView from './components/pages/PlayerProfileView';
import PlayerStructureView from './components/pages/PlayerStructureView';
import EventDistributionView from './components/pages/EventDistributionView';
import MySekaiMiningView from './components/pages/MySekaiMiningView';
import EventSongsView from './components/pages/EventSongsView';
import HomeView from './components/pages/HomeView';
import LiveEventView from './components/pages/LiveEventView';
import PastEventDetailView from './components/pages/PastEventDetailView';
import ErrorBoundary from './components/ui/ErrorBoundary';
import ScrollToTop from './components/layout/ScrollToTop';
import { API_BASE_URL } from './config/constants';
import { fetchJsonWithBigInt } from './hooks/useRankings';
import { ConfigProvider } from './contexts/ConfigContext';
import { FeatureFlagProvider } from './contexts/FeatureFlagContext';

const MainContent: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewType>('home');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<{ id: number, name: string } | null>(null);
  const [allEvents, setAllEvents] = useState<EventSummary[]>([]);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

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

  const viewContent = () => {
      switch (currentView) {
          case 'home': return <HomeView setCurrentView={setCurrentView} />;
          case 'live': return <LiveEventView />;
          case 'past':
              if (selectedEvent) {
                  return (
                      <PastEventDetailView 
                          key={selectedEvent.id}
                          event={selectedEvent} 
                          onBack={() => setSelectedEvent(null)} 
                          allEvents={allEvents}
                      />
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
          case 'eventSongs': return <EventSongsView allEvents={allEvents} />;
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
        <FeatureFlagProvider>
            <MainContent />
        </FeatureFlagProvider>
    </ConfigProvider>
);

export default App;
