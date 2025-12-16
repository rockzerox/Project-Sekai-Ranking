
import React from 'react';
import TrophyIcon from './icons/TrophyIcon';

interface SidebarProps {
  currentView: 'home' | 'live' | 'past' | 'distribution' | 'comparison' | 'analysis' | 'trend' | 'worldLink' | 'playerAnalysis' | 'resourceEstimator' | 'playerProfile';
  setCurrentView: (view: 'home' | 'live' | 'past' | 'distribution' | 'comparison' | 'analysis' | 'trend' | 'worldLink' | 'playerAnalysis' | 'resourceEstimator' | 'playerProfile') => void;
  isOpen: boolean;
  toggleSidebar: () => void;
  isCollapsed: boolean;
  toggleCollapse: () => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  currentView, 
  setCurrentView, 
  isOpen, 
  toggleSidebar,
  isCollapsed,
  toggleCollapse,
  theme,
  toggleTheme
}) => {
  
  const itemClass = (viewName: string) => `
    w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-left font-medium group 
    ${currentView === viewName
      ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/20'
      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-slate-200'
    } 
    ${isCollapsed ? 'justify-center px-2' : ''}
  `;

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar Container */}
      <aside 
        className={`
          fixed md:sticky top-0 h-screen z-30 
          bg-white dark:bg-slate-800 
          border-r border-slate-200 dark:border-slate-700
          transform transition-all duration-300 ease-in-out flex flex-col
          ${isOpen ? 'translate-x-0' : '-translate-x-full'} 
          md:translate-x-0
          ${isCollapsed ? 'w-20' : 'w-64'}
        `}
      >
        <div className={`p-4 border-b border-slate-200 dark:border-slate-700 flex items-center gap-3 h-20 ${isCollapsed ? 'justify-center' : ''}`}>
           <div className="bg-cyan-500/10 dark:bg-cyan-500/20 p-2 rounded-lg flex-shrink-0">
              <TrophyIcon className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
           </div>
           {!isCollapsed && (
             <h1 className="font-bold text-xl text-slate-900 dark:text-white tracking-tight whitespace-nowrap overflow-hidden animate-fadeIn">
               Hi Sekai TW
             </h1>
           )}
        </div>

        <nav className="p-4 space-y-2 flex-1 custom-scrollbar overflow-y-auto">
          {/* Home */}
          <button onClick={() => { setCurrentView('home'); if (window.innerWidth < 768) toggleSidebar(); }} title="首頁" className={itemClass('home')}>
            <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            {!isCollapsed && <span className="whitespace-nowrap overflow-hidden">首頁</span>}
          </button>

          {/* 1. Live Events */}
          <button onClick={() => { setCurrentView('live'); if (window.innerWidth < 768) toggleSidebar(); }} title="現時活動" className={itemClass('live')}>
            <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            {!isCollapsed && <span className="whitespace-nowrap overflow-hidden">現時活動</span>}
          </button>

          {/* 2. Past Events */}
          <button onClick={() => { setCurrentView('past'); if (window.innerWidth < 768) toggleSidebar(); }} title="歷代活動" className={itemClass('past')}>
            <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {!isCollapsed && <span className="whitespace-nowrap overflow-hidden">歷代活動</span>}
          </button>

          {/* New: Event Distribution */}
          <button onClick={() => { setCurrentView('distribution'); if (window.innerWidth < 768) toggleSidebar(); }} title="活動分布概況" className={itemClass('distribution')}>
            <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
            {!isCollapsed && <span className="whitespace-nowrap overflow-hidden">活動分布概況</span>}
          </button>

          {/* 3. Event Comparison */}
          <button onClick={() => { setCurrentView('comparison'); if (window.innerWidth < 768) toggleSidebar(); }} title="活動比較分析" className={itemClass('comparison')}>
            <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
            </svg>
            {!isCollapsed && <span className="whitespace-nowrap overflow-hidden">活動比較分析</span>}
          </button>

          {/* 4. Rank Ranking */}
          <button onClick={() => { setCurrentView('analysis'); if (window.innerWidth < 768) toggleSidebar(); }} title="活動榜線排名" className={itemClass('analysis')}>
            <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            {!isCollapsed && <span className="whitespace-nowrap overflow-hidden">活動榜線排名</span>}
          </button>

          {/* New: Rank Trend */}
          <button onClick={() => { setCurrentView('trend'); if (window.innerWidth < 768) toggleSidebar(); }} title="活動榜線趨勢" className={itemClass('trend')}>
            <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            {!isCollapsed && <span className="whitespace-nowrap overflow-hidden">活動榜線趨勢</span>}
          </button>

          {/* 5. World Link */}
          <button onClick={() => { setCurrentView('worldLink'); if (window.innerWidth < 768) toggleSidebar(); }} title="World Link 分析" className={itemClass('worldLink')}>
            <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {!isCollapsed && <span className="whitespace-nowrap overflow-hidden">World Link 分析</span>}
          </button>

          {/* 6. Player Analysis */}
          <button onClick={() => { setCurrentView('playerAnalysis'); if (window.innerWidth < 768) toggleSidebar(); }} title="活躍玩家分析" className={itemClass('playerAnalysis')}>
             <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            {!isCollapsed && <span className="whitespace-nowrap overflow-hidden">活躍玩家分析</span>}
          </button>

          {/* 7. Resource Estimator */}
          <button onClick={() => { setCurrentView('resourceEstimator'); if (window.innerWidth < 768) toggleSidebar(); }} title="預估資源計算機" className={itemClass('resourceEstimator')}>
             <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            {!isCollapsed && <span className="whitespace-nowrap overflow-hidden">預估資源計算機</span>}
          </button>

          {/* 8. Player Profile */}
          <button onClick={() => { setCurrentView('playerProfile'); if (window.innerWidth < 768) toggleSidebar(); }} title="玩家狀態查詢" className={itemClass('playerProfile')}>
             <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
            </svg>
            {!isCollapsed && <span className="whitespace-nowrap overflow-hidden">玩家狀態查詢</span>}
          </button>
        </nav>

        {/* Toggle Theme Button (Desktop) */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex justify-center">
             <button
                onClick={toggleTheme}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors w-full flex justify-center items-center gap-2"
                title={theme === 'dark' ? "切換至亮色模式" : "切換至暗色模式"}
             >
                {theme === 'dark' ? (
                    <>
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                        {!isCollapsed && <span>Light Mode</span>}
                    </>
                ) : (
                    <>
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
                        {!isCollapsed && <span>Dark Mode</span>}
                    </>
                )}
            </button>
        </div>

        {/* Collapse Toggle (Desktop Only) */}
        <div className="hidden md:flex p-4 border-t border-slate-200 dark:border-slate-700 justify-end">
            <button 
                onClick={toggleCollapse}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors w-full flex justify-center"
                title={isCollapsed ? "展開選單" : "收合選單"}
            >
                <svg 
                    className={`w-6 h-6 transform transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                </svg>
            </button>
        </div>

        {/* Footer info (Hidden when collapsed) */}
        {!isCollapsed && (
            <div className="p-4 border-t border-slate-200 dark:border-slate-700 md:border-t-0 bg-slate-50 dark:bg-slate-900/30">
                <div className="text-xs text-slate-500 dark:text-slate-500 text-center space-y-1">
                    <p>非官方粉絲製作網站</p>
                    <p>
                        Data provided by{' '}
                        <a 
                            href="https://hisekai.org" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-cyan-600 dark:text-cyan-400 hover:underline transition-colors"
                        >
                            Hi Sekai API
                        </a>
                    </p>
                </div>
            </div>
        )}
      </aside>
    </>
  );
};

export default Sidebar;
