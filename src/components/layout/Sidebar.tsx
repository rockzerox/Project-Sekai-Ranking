
import React, { useState, useEffect } from 'react';
import TrophyIcon from '../../components/icons/TrophyIcon';
import { UI_TEXT } from '../../config/uiText';
import { ViewType } from '../../types';
import { NAV_GROUPS } from '../../config/navConfig';

interface SidebarProps {
  currentView: ViewType;
  setCurrentView: (view: ViewType) => void;
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
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set([UI_TEXT.sidebar.categories.ranking]));

  // 當 currentView 改變時，自動展開該功能所屬的分組
  useEffect(() => {
    const parentGroup = NAV_GROUPS.find(group => 
      group.items.some(item => item.id === currentView)
    );
    if (parentGroup) {
      setTimeout(() => {
        setExpandedGroups(prev => {
          if (prev.has(parentGroup.category)) return prev;
          return new Set(prev).add(parentGroup.category);
        });
      }, 0);
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

  const itemClass = (viewId: string) => `
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
      <aside className={`hidden md:flex fixed md:sticky top-0 h-screen z-30 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 transform transition-all duration-300 ease-in-out flex-col ${isCollapsed ? 'w-20' : 'w-60'}`}>
        
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
                        className={itemClass(item.id)}
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
