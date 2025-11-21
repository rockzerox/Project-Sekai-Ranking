
import React from 'react';
import TrophyIcon from './icons/TrophyIcon';

interface SidebarProps {
  currentView: 'live' | 'past' | 'comparison' | 'analysis';
  setCurrentView: (view: 'live' | 'past' | 'comparison' | 'analysis') => void;
  isOpen: boolean;
  toggleSidebar: () => void;
  isCollapsed: boolean;
  toggleCollapse: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  currentView, 
  setCurrentView, 
  isOpen, 
  toggleSidebar,
  isCollapsed,
  toggleCollapse
}) => {
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
          fixed md:sticky top-0 h-screen z-30 bg-slate-800 border-r border-slate-700 
          transform transition-all duration-300 ease-in-out flex flex-col
          ${isOpen ? 'translate-x-0' : '-translate-x-full'} 
          md:translate-x-0
          ${isCollapsed ? 'w-20' : 'w-64'}
        `}
      >
        <div className={`p-4 border-b border-slate-700 flex items-center gap-3 h-20 ${isCollapsed ? 'justify-center' : ''}`}>
           <div className="bg-cyan-500/20 p-2 rounded-lg flex-shrink-0">
              <TrophyIcon className="w-6 h-6 text-cyan-400" />
           </div>
           {!isCollapsed && (
             <h1 className="font-bold text-xl text-white tracking-tight whitespace-nowrap overflow-hidden animate-fadeIn">
               Hisekai TW
             </h1>
           )}
        </div>

        <nav className="p-4 space-y-2 flex-1">
          <button
            onClick={() => {
              setCurrentView('live');
              if (window.innerWidth < 768) toggleSidebar();
            }}
            title="現時活動"
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-left font-medium group ${
              currentView === 'live'
                ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/20'
                : 'text-slate-400 hover:bg-slate-700 hover:text-slate-200'
            } ${isCollapsed ? 'justify-center px-2' : ''}`}
          >
            <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            {!isCollapsed && <span className="whitespace-nowrap overflow-hidden">現時活動</span>}
          </button>

          <button
            onClick={() => {
              setCurrentView('past');
              if (window.innerWidth < 768) toggleSidebar();
            }}
            title="歷代活動"
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-left font-medium group ${
              currentView === 'past'
                ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/20'
                : 'text-slate-400 hover:bg-slate-700 hover:text-slate-200'
            } ${isCollapsed ? 'justify-center px-2' : ''}`}
          >
            <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {!isCollapsed && <span className="whitespace-nowrap overflow-hidden">歷代活動</span>}
          </button>

          <button
            onClick={() => {
              setCurrentView('comparison');
              if (window.innerWidth < 768) toggleSidebar();
            }}
            title="活動比較分析"
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-left font-medium group ${
              currentView === 'comparison'
                ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/20'
                : 'text-slate-400 hover:bg-slate-700 hover:text-slate-200'
            } ${isCollapsed ? 'justify-center px-2' : ''}`}
          >
            <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
            </svg>
            {!isCollapsed && <span className="whitespace-nowrap overflow-hidden">活動比較分析</span>}
          </button>

          <button
            onClick={() => {
              setCurrentView('analysis');
              if (window.innerWidth < 768) toggleSidebar();
            }}
            title="排名分析"
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-left font-medium group ${
              currentView === 'analysis'
                ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/20'
                : 'text-slate-400 hover:bg-slate-700 hover:text-slate-200'
            } ${isCollapsed ? 'justify-center px-2' : ''}`}
          >
            <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            {!isCollapsed && <span className="whitespace-nowrap overflow-hidden">排名分析</span>}
          </button>
        </nav>

        {/* Collapse Toggle (Desktop Only) */}
        <div className="hidden md:flex p-4 border-t border-slate-700 justify-end">
            <button 
                onClick={toggleCollapse}
                className="p-2 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors w-full flex justify-center"
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
            <div className="p-4 border-t border-slate-700 md:border-t-0">
            <p className="text-xs text-slate-500 text-center whitespace-nowrap overflow-hidden">
                Unofficial Viewer<br/>Data from Hisekai
            </p>
            </div>
        )}
      </aside>
    </>
  );
};

export default Sidebar;
