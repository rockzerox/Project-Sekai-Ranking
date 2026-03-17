import React from 'react';
import { UI_TEXT } from '../../config/uiText';
import TrophyIcon from '../icons/TrophyIcon';

interface MaintenanceViewProps {
    titleKey: 'unitAnalysis' | 'characterAnalysis' | 'playerStructure';
}

const MaintenanceView: React.FC<MaintenanceViewProps> = ({ titleKey }) => {
    const pageTitle = UI_TEXT.sidebar.items[titleKey];
    const maintenanceText = UI_TEXT.maintenance;

    return (
        <div className="w-full min-h-[70vh] flex flex-col items-center justify-center p-6 animate-fadeIn">
            <div className="relative mb-12">
                {/* 裝飾背景 */}
                <div className="absolute inset-0 bg-cyan-500/20 blur-[100px] rounded-full scale-150 animate-pulse"></div>
                <div className="relative bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl flex items-center justify-center">
                    <TrophyIcon className="w-20 h-20 text-cyan-500 animate-bounce-slow" />
                </div>
                
                {/* 飄浮的小裝飾 */}
                <div className="absolute -top-4 -right-4 w-12 h-12 bg-yellow-400/20 rounded-full blur-xl animate-float"></div>
                <div className="absolute -bottom-8 -left-8 w-16 h-16 bg-purple-500/10 rounded-full blur-2xl animate-float-delayed"></div>
            </div>

            <div className="text-center max-w-2xl relative z-10">
                <div className="inline-block px-4 py-1.5 mb-6 rounded-full bg-cyan-500/10 border border-cyan-500/20">
                    <span className="text-xs font-black text-cyan-600 dark:text-cyan-400 uppercase tracking-[0.2em]">
                        {pageTitle} • UNDER REDESIGN
                    </span>
                </div>
                
                <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-6 tracking-tight leading-tight">
                    {maintenanceText.title}
                </h2>
                
                <p className="text-lg text-slate-500 dark:text-slate-400 font-bold mb-10 leading-relaxed px-4">
                    {maintenanceText.description}
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <div className="px-8 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black text-sm shadow-xl hover:scale-105 active:scale-95 transition-all">
                        {maintenanceText.comingSoon}
                    </div>
                </div>
            </div>

            {/* 底部裝飾線 */}
            <div className="mt-20 flex gap-2">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="w-2 h-2 rounded-full bg-slate-200 dark:bg-slate-800"></div>
                ))}
            </div>
        </div>
    );
};

export default MaintenanceView;
