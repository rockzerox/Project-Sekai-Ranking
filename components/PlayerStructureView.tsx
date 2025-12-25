
import React from 'react';
import { CHARACTERS } from '../constants';

const PlayerStructureView: React.FC = () => {
    const emuColor = CHARACTERS['鳳笑夢'].color;

    return (
        <div className="w-full min-h-[60vh] flex flex-col items-center justify-center animate-fadeIn text-center p-6">
            <div className="relative mb-8">
                <div 
                    className="w-24 h-24 rounded-3xl flex items-center justify-center bg-white dark:bg-slate-800 shadow-xl border-2 animate-bounce"
                    style={{ borderColor: emuColor, color: emuColor }}
                >
                    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                </div>
                <div className="absolute -bottom-2 -right-2 bg-amber-500 text-white text-[10px] font-black px-2 py-1 rounded-full shadow-lg">
                    COMING SOON
                </div>
            </div>
            
            <h2 className="text-3xl font-black text-slate-800 dark:text-white mb-4 tracking-tight">
                玩家排名結構 <span style={{ color: emuColor }}>施工中</span>
            </h2>
            
            <p className="text-slate-500 dark:text-slate-400 max-w-md leading-relaxed font-bold">
                我們正在開發利用「不重複率」來量化排名流動性的分析工具。<br/>
                這項功能將揭示不同團體與角色活動中的階級固化情形，敬請期待！
            </p>

            <div className="mt-10 flex gap-3">
                <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: emuColor }}></div>
                <div className="w-2 h-2 rounded-full animate-pulse delay-75" style={{ backgroundColor: emuColor }}></div>
                <div className="w-2 h-2 rounded-full animate-pulse delay-150" style={{ backgroundColor: emuColor }}></div>
            </div>
        </div>
    );
};

export default PlayerStructureView;
