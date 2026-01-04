
import React, { useState, useEffect, useMemo } from 'react';
import TrophyIcon from './icons/TrophyIcon';
import { CHARACTERS } from '../constants';
import { UI_TEXT } from '../constants/uiText';

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  charColor: string;
}

interface NavGroup {
  category: string;
  color: string;
  items: NavItem[];
}

interface SidebarProps {
  currentView: string;
  setCurrentView: (view: any) => void;
  isOpen: boolean;
  toggleSidebar: () => void;
  isCollapsed: boolean;
  toggleCollapse: () => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

const NAV_GROUPS: NavGroup[] = [
  {
    category: UI_TEXT.sidebar.categories.ranking,
    color: "#4455DD", // Leo/need Blue
    items: [
      { id: 'live', label: UI_TEXT.sidebar.items.live, charColor: CHARACTERS['1'].color, icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg> },
      { id: 'past', label: UI_TEXT.sidebar.items.past, charColor: CHARACTERS['2'].color, icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
      { id: 'distribution', label: UI_TEXT.sidebar.items.distribution, charColor: CHARACTERS['3'].color, icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4h7v7H4z M13 4h7v7h-7z M4 13h7v7H4z M13 13h7v7h-7z" /></svg> },
    ]
  },
  {
    category: UI_TEXT.sidebar.categories.analysis,
    color: "#88DD44", // MORE MORE JUMP! Green
    items: [
      { id: 'comparison', label: UI_TEXT.sidebar.items.comparison, charColor: CHARACTERS['5'].color, icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 18l4-6 4 4 10-10 M3 14l4-6 4 4 10-10" /></svg> },
      { id: 'analysis', label: UI_TEXT.sidebar.items.analysis, charColor: CHARACTERS['6'].color, icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 20h16M6 20v-4h3v4M11 20v-8h3v8M16 20v-13h3v13" /></svg> },
      { id: 'trend', label: UI_TEXT.sidebar.items.trend, charColor: CHARACTERS['7'].color, icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg> },
    ]
  },
  {
    category: UI_TEXT.sidebar.categories.character,
    color: "#EE1166", // Vivid BAD SQUAD Pink
    items: [
      { id: 'worldLink', label: UI_TEXT.sidebar.items.worldLink, charColor: CHARACTERS['9'].color, icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
      { id: 'unitAnalysis', label: UI_TEXT.sidebar.items.unitAnalysis, charColor: "#00BBDD", icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg> },
      { id: 'characterAnalysis', label: UI_TEXT.sidebar.items.characterAnalysis, charColor: "#FF7722", icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg> },
    ]
  },
  {
    category: UI_TEXT.sidebar.categories.player,
    color: "#FF9900", // Wonderlands × Showtime Orange
    items: [
      { id: 'playerAnalysis', label: UI_TEXT.sidebar.items.playerAnalysis, charColor: CHARACTERS['13'].color, icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1m0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg> },
      { id: 'playerStructure', label: UI_TEXT.sidebar.items.playerStructure, charColor: CHARACTERS['14'].color, icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg> },
      { id: 'playerProfile', label: UI_TEXT.sidebar.items.playerProfile, charColor: CHARACTERS['15'].color, icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7z M7 10h2 M7 14h6" /></svg> },
    ]
  },
  {
    category: UI_TEXT.sidebar.categories.tools,
    color: "#884499", // 25點，Nightcord見。 Purple
    items: [
      { id: 'resourceEstimator', label: UI_TEXT.sidebar.items.resourceEstimator, charColor: CHARACTERS['17'].color, icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg> },
      { 
        id: 'mySekaiMining', 
        label: UI_TEXT.sidebar.items.mySekaiMining, 
        charColor: '#8888CC', 
        icon: <svg className="w-5 h-5" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="2" fill="none"/><circle cx="9" cy="10" r="1.5" fill="currentColor"/><circle cx="15" cy="10" r="1.5" fill="currentColor"/><path d="M10 15h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg> 
      },
    ]
  }
];

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
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set([UI_TEXT.sidebar.categories.ranking]));

  // 當 currentView 改變時，自動展開該功能所屬的分組
  useEffect(() => {
    const parentGroup = NAV_GROUPS.find(group => 
      group.items.some(item => item.id === currentView)
    );
    if (parentGroup && !expandedGroups.has(parentGroup.category)) {
      setExpandedGroups(prev => new Set(prev).add(parentGroup.category));
    }
  }, [currentView]);

  const toggleGroup = (category: string) => {
    if (isCollapsed) return; 
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return next;
    });
  };

  const itemClass = (viewId: string, charColor: string) => `
    w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 text-left font-bold group relative
    ${currentView === viewId
      ? 'bg-slate-100 dark:bg-slate-700/50 shadow-sm translate-x-1'
      : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/30 hover:text-slate-900 dark:hover:text-slate-200'
    } 
    ${isCollapsed ? 'justify-center px-0' : ''}
  `;

  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/50 z-20 md:hidden" onClick={toggleSidebar} />}
      <aside className={`fixed md:sticky top-0 h-screen z-30 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 transform transition-all duration-300 ease-in-out flex flex-col ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 ${isCollapsed ? 'w-20' : 'w-60'}`}>
        
        {/* Header Section */}
        <div className={`p-4 border-b border-slate-200 dark:border-slate-700 flex items-center gap-3 h-20 overflow-hidden ${isCollapsed ? 'justify-center' : ''}`}>
           <button 
             onClick={() => setCurrentView('home')}
             className="bg-cyan-500/10 dark:bg-cyan-500/20 p-2 rounded-lg flex-shrink-0 hover:scale-110 transition-transform active:scale-95"
           >
             <TrophyIcon className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
           </button>
           {!isCollapsed && (
             <div className="flex flex-col min-w-0">
               <h1 className="font-black text-lg text-slate-900 dark:text-white tracking-tighter truncate">{UI_TEXT.common.siteName}</h1>
               <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">{UI_TEXT.common.subTitle}</span>
             </div>
           )}
        </div>

        {/* Navigation Groups */}
        <nav className="p-3 space-y-3 flex-1 custom-scrollbar overflow-y-auto select-none">
          {NAV_GROUPS.map((group) => {
            const isExpanded = expandedGroups.has(group.category) || isCollapsed;
            const isGroupActive = group.items.some(item => item.id === currentView);

            return (
              <div key={group.category} className="space-y-1">
                {/* Group Header */}
                {!isCollapsed && (
                  <button 
                    onClick={() => toggleGroup(group.category)}
                    className="w-full flex items-center justify-between px-2 py-1 group/header"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-1 h-3 rounded-full" style={{ backgroundColor: group.color }}></div>
                      <span className={`text-[10px] font-black uppercase tracking-[0.1em] transition-colors ${isGroupActive ? 'text-slate-900 dark:text-white' : 'text-slate-400 group-hover/header:text-slate-600 dark:group-hover/header:text-slate-300'}`}>
                        {group.category}
                      </span>
                    </div>
                    <svg 
                      className={`w-3 h-3 text-slate-300 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} 
                      fill="none" stroke="currentColor" viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                )}

                {/* Group Items */}
                <div className={`grid transition-all duration-300 ease-in-out ${isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0 pointer-events-none'}`}>
                  <div className="overflow-hidden space-y-1">
                    {group.items.map((item) => (
                      <button 
                        key={item.id} 
                        onClick={() => { setCurrentView(item.id); if (window.innerWidth < 768) toggleSidebar(); }} 
                        className={itemClass(item.id, item.charColor)}
                        title={isCollapsed ? item.label : undefined}
                      >
                        <div 
                          className="flex-shrink-0 transition-transform group-hover:scale-110" 
                          style={{ color: currentView === item.id ? item.charColor : 'inherit' }}
                        >
                          {item.icon}
                        </div>
                        {!isCollapsed && (
                          <span className={`whitespace-nowrap overflow-hidden text-sm font-black transition-colors ${currentView === item.id ? 'text-slate-900 dark:text-white' : ''}`}>
                            {item.label}
                          </span>
                        )}
                        {/* Active Indicator Dot */}
                        {currentView === item.id && !isCollapsed && (
                          <div className="absolute left-0 w-1 h-4 rounded-r-full" style={{ backgroundColor: item.charColor }}></div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </nav>

        {/* Footer Actions */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-700 flex flex-col gap-1.5">
            <button 
              onClick={toggleTheme} 
              className={`p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors flex items-center gap-3 ${isCollapsed ? 'justify-center' : ''}`}
            >
                {theme === 'dark' 
                  ? <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg> 
                  : <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
                }
                {!isCollapsed && <span className="text-[10px] font-black uppercase tracking-wider">{UI_TEXT.sidebar.actions.toggleTheme}</span>}
            </button>
            
            <button 
              onClick={toggleCollapse} 
              className={`hidden md:flex p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors items-center gap-3 ${isCollapsed ? 'justify-center' : ''}`}
            >
                <svg className={`w-5 h-5 transform transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                </svg>
                {!isCollapsed && <span className="text-[10px] font-black uppercase tracking-wider">{UI_TEXT.sidebar.actions.collapseMenu}</span>}
            </button>
        </div>

        {!isCollapsed && (
            <div className="px-4 py-3 bg-slate-50 dark:bg-slate-900/30 text-[8px] text-center text-slate-400 font-bold border-t border-slate-200 dark:border-slate-700">
                {UI_TEXT.common.unofficialLabel}<br/>
                {UI_TEXT.common.dataBy} <a href="https://hisekai.org" target="_blank" rel="noopener noreferrer" className="text-cyan-500 hover:underline">Hi Sekai API</a>
            </div>
        )}
      </aside>
    </>
  );
};

export default Sidebar;
