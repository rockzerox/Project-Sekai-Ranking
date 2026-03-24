
import React, { useState, useEffect } from 'react';
import { EventSummary, ViewType } from './types';
import Sidebar from './components/layout/Sidebar';
import MobileHeader from './components/layout/MobileHeader';
import MobileTabBar from './components/layout/MobileTabBar';
import MobileHomeView from './components/pages/MobileHomeView';
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
import MaintenanceView from './components/pages/MaintenanceView';
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
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
          // On mobile, 'home' view renders MobileHomeView (handled in JSX)
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
          case 'unitAnalysis': return <MaintenanceView titleKey="unitAnalysis" />;
          case 'characterAnalysis': return <MaintenanceView titleKey="characterAnalysis" />;
          case 'playerAnalysis': return <PlayerAnalysisView />;
          case 'playerStructure': return <MaintenanceView titleKey="playerStructure" />;
          case 'resourceEstimator': return <ResourceEstimatorView />;
          case 'playerProfile': return <PlayerProfileView />;
          case 'mySekaiMining': return <MySekaiMiningView />;
          case 'eventSongs': return <EventSongsView allEvents={allEvents} />;
          default: return <HomeView setCurrentView={setCurrentView} />;
      }
  };

  return (
    <div className="flex bg-slate-50 dark:bg-slate-950 min-h-screen text-slate-900 dark:text-slate-200 font-sans transition-colors duration-300">
        {/* Desktop Sidebar — hidden on mobile */}
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

        <div className="flex-1 transition-all duration-300 w-full flex flex-col">
            {/* Mobile Header — desktop hidden */}
            <MobileHeader
              theme={theme}
              toggleTheme={toggleTheme}
              setCurrentView={(view) => { setCurrentView(view); setSelectedEvent(null); }}
            />

            <main className="p-4 md:p-6 w-full custom-scrollbar pb-24 md:pb-6">
                <ErrorBoundary>
                    {/* Mobile home: show live event widget */}
                    {currentView === 'home' && isMobile ? (
                        <MobileHomeView />
                    ) : (
                        viewContent()
                    )}
                </ErrorBoundary>
            </main>
        </div>

        {/* Mobile Tab Bar — desktop hidden */}
        <MobileTabBar
          currentView={currentView}
          setCurrentView={(view) => { setCurrentView(view); setSelectedEvent(null); }}
        />

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
