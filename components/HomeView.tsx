
import React from 'react';
import TrophyIcon from './icons/TrophyIcon';

interface HomeViewProps {
    setCurrentView: (view: 'live' | 'past' | 'comparison' | 'analysis' | 'worldLink' | 'playerAnalysis') => void;
}

const HomeView: React.FC<HomeViewProps> = ({ setCurrentView }) => {
    const features = [
        {
            id: 'live',
            title: '現時活動 (Live Events)',
            description: '查看目前正在進行中的活動即時排名、分數預測及時速分析。',
            icon: (
                <svg className="w-8 h-8 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
            ),
            color: 'hover:border-cyan-500 hover:shadow-cyan-500/10'
        },
        {
            id: 'past',
            title: '歷代活動 (Past Events)',
            description: '瀏覽 Project Sekai 台服過往所有活動的榜單紀錄與詳細資訊。',
            icon: (
                <svg className="w-8 h-8 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
            color: 'hover:border-indigo-500 hover:shadow-indigo-500/10'
        },
        {
            id: 'comparison',
            title: '活動比較分析 (Event Comparison)',
            description: '選擇任意兩期過往活動，透過圖表比較其分數線趨勢與競爭激烈程度。',
            icon: (
                <svg className="w-8 h-8 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                </svg>
            ),
            color: 'hover:border-pink-500 hover:shadow-pink-500/10'
        },
        {
            id: 'analysis',
            title: '活動榜線排名 (Rank Ranking)',
            description: '查詢歷代活動在特定排名 (如 Top 100, Top 1000) 的最高分紀錄排行。',
            icon: (
                <svg className="w-8 h-8 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
            ),
            color: 'hover:border-amber-500 hover:shadow-amber-500/10'
        },
        {
            id: 'worldLink',
            title: 'World Link 分析',
            description: '針對 World Link 特殊活動類型的綜合分析，包含各角色章節排名。',
            icon: (
                <svg className="w-8 h-8 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
            color: 'hover:border-emerald-500 hover:shadow-emerald-500/10'
        },
        {
            id: 'playerAnalysis',
            title: '活躍玩家分析 (Player Analysis)',
            description: '分析歷代活動中的活躍玩家，查看上榜次數最多的玩家排行。',
            icon: (
                <svg className="w-8 h-8 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
            ),
            color: 'hover:border-violet-500 hover:shadow-violet-500/10'
        }
    ];

    return (
        <div className="w-full animate-fadeIn py-8 px-4 max-w-6xl mx-auto">
            <div className="text-center mb-12">
                <div className="inline-block p-4 bg-cyan-500/10 rounded-full mb-4">
                    <TrophyIcon className="w-16 h-16 text-cyan-600 dark:text-cyan-400" />
                </div>
                <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
                    歡迎來到 Hisekai TW 排名資訊站
                </h1>
                <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
                    提供 Project Sekai 台服最完整的排名數據查詢、歷代活動存檔以及多維度的數據分析工具。
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {features.map((feature) => (
                    <button
                        key={feature.id}
                        onClick={() => setCurrentView(feature.id as any)}
                        className={`text-left bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-all duration-300 group hover:-translate-y-1 hover:shadow-lg ${feature.color}`}
                    >
                        <div className="flex items-center gap-4 mb-4">
                            <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg group-hover:bg-white dark:group-hover:bg-slate-600 transition-colors">
                                {feature.icon}
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                                {feature.title.split('(')[0]}
                            </h3>
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                            {feature.description}
                        </p>
                    </button>
                ))}
            </div>
            
            <div className="mt-16 text-center text-sm text-slate-400 dark:text-slate-500">
                <p>非官方粉絲製作網站 • Data powered by Hisekai API</p>
            </div>
        </div>
    );
};

export default HomeView;
