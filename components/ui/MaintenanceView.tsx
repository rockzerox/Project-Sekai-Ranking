import React from 'react';
import TrophyIcon from '../icons/TrophyIcon';

interface MaintenanceViewProps {
    title?: string;
    description?: string;
}

const MaintenanceView: React.FC<MaintenanceViewProps> = ({ 
    title = "功能優化中", 
    description = "為了提供更精準的數據分析，此頁面目前正在進行系統升級與最後測試，敬請期待。" 
}) => {
    return (
        <div className="w-full min-h-[60vh] flex flex-col items-center justify-center animate-fadeIn text-center px-4">
            <div className="relative mb-8">
                {/* 裝飾背景 */}
                <div className="absolute inset-0 bg-cyan-500/10 blur-3xl rounded-full scale-150"></div>
                
                {/* 動態圖標 */}
                <div className="relative bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-2xl group overflow-hidden">
                    <div className="absolute -right-4 -top-4 opacity-10 group-hover:rotate-12 transition-transform duration-700">
                         <TrophyIcon className="w-24 h-24 text-cyan-600 dark:text-cyan-400" />
                    </div>
                    <div className="relative z-10 flex flex-col items-center">
                        <svg className="w-20 h-20 text-cyan-600 dark:text-cyan-400 mb-2 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
                        </svg>
                    </div>
                </div>
            </div>

            <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-3 tracking-tight">
                {title}
            </h3>
            <p className="text-slate-500 dark:text-slate-400 max-w-md font-bold leading-relaxed">
                {description}
            </p>

            <div className="mt-10 flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800/50 rounded-full border border-slate-200 dark:border-slate-700">
                <div className="w-2 h-2 bg-cyan-500 rounded-full animate-ping"></div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">System Tuning in Progress</span>
            </div>
        </div>
    );
};

export default MaintenanceView;