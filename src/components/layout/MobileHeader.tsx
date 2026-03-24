import React from 'react';
import TrophyIcon from '../icons/TrophyIcon';
import { UI_TEXT } from '../../config/uiText';
import { ViewType } from '../../types';

interface MobileHeaderProps {
    theme: 'light' | 'dark';
    toggleTheme: () => void;
    setCurrentView: (view: ViewType) => void;
}

const MobileHeader: React.FC<MobileHeaderProps> = ({ theme, toggleTheme, setCurrentView }) => {
    return (
        <header className="md:hidden sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
            {/* Main row: Logo + Theme Toggle */}
            <div className="flex items-center justify-between px-4 h-14">
                {/* Logo + Site Name + Subtitle */}
                <button
                    onClick={() => setCurrentView('home')}
                    className="flex items-center gap-2.5 active:opacity-70 transition-opacity min-w-0"
                    aria-label="首頁"
                >
                    <div className="bg-cyan-500/15 dark:bg-cyan-500/20 p-1.5 rounded-lg flex-shrink-0">
                        <TrophyIcon className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                    </div>
                    <div className="flex flex-col min-w-0 text-left">
                        <div className="flex items-center gap-1.5">
                            <span className="font-black text-sm text-slate-900 dark:text-white tracking-tight leading-none">
                                {UI_TEXT.home.title}
                            </span>
                            {/* Music note decorations */}
                            <span className="text-cyan-500 dark:text-cyan-400 text-xs leading-none select-none">♪</span>
                        </div>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium leading-snug truncate max-w-[220px]">
                            {UI_TEXT.home.description}
                        </span>
                    </div>
                </button>

                {/* Theme Toggle */}
                <button
                    onClick={toggleTheme}
                    className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex-shrink-0"
                    aria-label="切換主題"
                >
                    {theme === 'dark' ? (
                        <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                    ) : (
                        <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                        </svg>
                    )}
                </button>
            </div>
        </header>
    );
};

export default MobileHeader;
