
import React from 'react';
import TrophyIcon from './icons/TrophyIcon';
import { CHARACTERS } from '../constants';

interface SidebarProps {
  currentView: 'home' | 'live' | 'past' | 'distribution' | 'comparison' | 'analysis' | 'trend' | 'worldLink' | 'unitAnalysis' | 'characterAnalysis' | 'playerAnalysis' | 'playerStructure' | 'resourceEstimator' | 'playerProfile';
  setCurrentView: (view: any) => void;
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
  
  const navItems = [
    { id: 'home', label: "首頁看板", groupColor: "#06b6d4", charColor: "#fff", icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1" /></svg> },
    { id: 'live', label: "現時活動", groupColor: "#4455DD", charColor: CHARACTERS['星乃一歌'].color, icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg> },
    { id: 'past', label: "歷代活動", groupColor: "#4455DD", charColor: CHARACTERS['天馬咲希'].color, icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
    { id: 'distribution', label: "活動分布概況", groupColor: "#4455DD", charColor: CHARACTERS['望月穗波'].color, icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4h7v7H4z M13 4h7v7h-7z M4 13h7v7H4z M13 13h7v7h-7z" /></svg> },
    { id: 'comparison', label: "活動比較分析", groupColor: "#88DD44", charColor: CHARACTERS['花里實乃理'].color, icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 18l4-6 4 4 10-10 M3 14l4-6 4 4 10-10" /></svg> },
    { id: 'analysis', label: "活動榜線排名", groupColor: "#88DD44", charColor: CHARACTERS['桐谷遙'].color, icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 20h16M6 20v-4h3v4M11 20v-8h3v8M16 20v-13h3v13" /></svg> },
    { id: 'trend', label: "活動榜線趨勢", groupColor: "#88DD44", charColor: CHARACTERS['桃井愛莉'].color, icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg> },
    { id: 'worldLink', label: "World Link 分析", groupColor: "#EE1166", charColor: CHARACTERS['小豆澤心羽'].color, icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
    { id: 'unitAnalysis', label: "團推分析", groupColor: "#EE1166", charColor: CHARACTERS['白石杏'].color, icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg> },
    { id: 'characterAnalysis', label: "推角分析", groupColor: "#FF7722", charColor: "#fff", icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg> },
    { id: 'playerAnalysis', label: "活躍玩家分析", groupColor: "#FF9900", charColor: CHARACTERS['天馬司'].color, icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1m0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg> },
    { id: 'playerStructure', label: "玩家排名結構", groupColor: "#FF9900", charColor: CHARACTERS['鳳笑夢'].color, icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg> },
    { id: 'playerProfile', label: "玩家狀態查詢", groupColor: "#FF9900", charColor: CHARACTERS['草薙寧寧'].color, icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7z M7 10h2 M7 14h6" /></svg> },
    { id: 'resourceEstimator', label: "預估資源計算機", groupColor: "#884499", charColor: CHARACTERS['宵崎奏'].color, icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg> }
  ];

  const itemClass = (viewId: string) => `
    w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 text-left font-black group 
    ${currentView === viewId
      ? 'shadow-xl scale-[1.02]'
      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50 hover:text-slate-900 dark:hover:text-slate-200'
    } 
    ${isCollapsed ? 'justify-center px-2' : ''}
  `;

  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/50 z-20 md:hidden" onClick={toggleSidebar} />}
      <aside className={`fixed md:sticky top-0 h-screen z-30 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 transform transition-all duration-300 ease-in-out flex flex-col ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 ${isCollapsed ? 'w-20' : 'w-72'}`}>
        <div className={`p-4 border-b border-slate-200 dark:border-slate-700 flex items-center gap-3 h-20 ${isCollapsed ? 'justify-center' : ''}`}>
           <div className="bg-cyan-500/10 dark:bg-cyan-500/20 p-2 rounded-lg flex-shrink-0"><TrophyIcon className="w-6 h-6 text-cyan-600 dark:text-cyan-400" /></div>
           {!isCollapsed && <h1 className="font-bold text-xl text-slate-900 dark:text-white tracking-tight">Hi Sekai TW</h1>}
        </div>
        <nav className="p-4 space-y-2 flex-1 custom-scrollbar overflow-y-auto">
          {navItems.map((item) => (
            <button 
                key={item.id} 
                onClick={() => { setCurrentView(item.id); if (window.innerWidth < 768) toggleSidebar(); }} 
                className={itemClass(item.id)} 
                style={currentView === item.id ? { backgroundColor: item.groupColor, color: item.charColor } : {}} 
                title={item.label}
            >
                <div className="flex-shrink-0" style={{ color: currentView === item.id ? item.charColor : 'inherit' }}>{item.icon}</div>
                {!isCollapsed && <span className="whitespace-nowrap overflow-hidden text-sm font-black">{item.label}</span>}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex flex-col gap-2">
            <button onClick={toggleTheme} className="p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors w-full flex justify-center items-center gap-2">
                {theme === 'dark' ? <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg> : <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>}
                {!isCollapsed && <span className="text-xs font-bold">切換主題</span>}
            </button>
            <button onClick={toggleCollapse} className="hidden md:flex p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors w-full justify-center">
                <svg className={`w-5 h-5 transform transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" /></svg>
            </button>
        </div>
        {!isCollapsed && (
            <div className="p-4 bg-slate-50 dark:bg-slate-900/30 text-[10px] text-center text-slate-400 font-bold border-t border-slate-200 dark:border-slate-700">
                非官方粉絲製作網站<br/>Data by <a href="https://hisekai.org" target="_blank" rel="noopener noreferrer" className="text-cyan-500 hover:underline">Hi Sekai API</a>
            </div>
        )}
      </aside>
    </>
  );
};

export default Sidebar;
