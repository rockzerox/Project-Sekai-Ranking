
import React from 'react';
import TrophyIcon from './icons/TrophyIcon';
import { CHARACTERS } from '../constants';

interface HomeViewProps {
    setCurrentView: (view: any) => void;
}

interface Feature {
    id: string;
    title: string;
    description: string;
    icon: React.ReactNode;
    charColor: string;
}

interface FeatureSection {
    category: string;
    color: string;
    features: Feature[];
}

const HomeView: React.FC<HomeViewProps> = ({ setCurrentView }) => {
    const sections: FeatureSection[] = [
        {
            category: "查榜 SEKAI",
            color: "#4455DD", // L/n Blue
            features: [
                { id: 'live', title: '現時活動', description: '查看目前正在進行中的活動即時排名、分數預測及時速分析。', charColor: CHARACTERS['星乃一歌'].color, icon: <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg> },
                { id: 'past', title: '歷代活動', description: '瀏覽 Project Sekai 台服過往所有活動的榜單紀錄與詳細資訊。', charColor: CHARACTERS['天馬咲希'].color, icon: <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
                { id: 'distribution', title: '活動分布概況', description: '檢視活動時間分布，呈現角色/團體的活動密集度與空窗期。', charColor: CHARACTERS['望月穗波'].color, icon: <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4h7v7H4z M13 4h7v7h-7z M4 13h7v7H4z M13 13h7v7h-7z" /></svg> }
            ]
        },
        {
            category: "分析 SEKAI",
            color: "#88DD44", // MMJ Green
            features: [
                { id: 'comparison', title: '活動比較分析', description: '選擇任兩期過往活動，透過圖表比較分數線趨勢與競爭激烈程度。', charColor: CHARACTERS['花里實乃理'].color, icon: <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 18l4-6 4 4 10-10 M3 14l4-6 4 4 10-10" /></svg> },
                { id: 'analysis', title: '活動榜線排名', description: '查詢歷代活動在特定排名的最高分紀錄排行。', charColor: CHARACTERS['桐谷遙'].color, icon: <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 20h16M6 20v-4h3v4M11 20v-8h3v8M16 20v-13h3v13" /></svg> },
                { id: 'trend', title: '活動榜線趨勢', description: '以折線圖觀察歷代活動特定排名分數隨期數變化的趨勢。', charColor: CHARACTERS['桃井愛莉'].color, icon: <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg> }
            ]
        },
        {
            category: "推角 SEKAI",
            color: "#EE1166", // VBS Pink
            features: [
                { id: 'worldLink', title: 'World Link 分析', description: 'World Link 特殊活動類型的綜合分析，包含各角色章節排名。', charColor: CHARACTERS['小豆澤心羽'].color, icon: <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
                { id: 'unitAnalysis', title: '團推分析', description: '以團體角度整合統計數據，分析歷代活動的熱度與參與度。', charColor: '#00BBDD', icon: <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg> },
                { id: 'characterAnalysis', title: '推角分析', description: '以角色視角整合統計數據，分析 Banner 活動的熱度分佈。', charColor: '#FF7722', icon: <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg> }
            ]
        },
        {
            category: "玩家 SEKAI",
            color: "#FF9900", // WxS Orange
            features: [
                { id: 'playerAnalysis', title: '活躍玩家分析', description: '分析歷代活動中的活躍玩家，查看上榜次數最多的玩家排行。', charColor: CHARACTERS['天馬司'].color, icon: <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1m0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg> },
                { id: 'playerProfile', title: '玩家狀態查詢', description: '查詢該玩家的詳細資料、綜合力組成與歌曲通關狀況。', charColor: CHARACTERS['鳳笑夢'].color, icon: <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7z M7 10h2 M7 14h6" /></svg> }
            ]
        },
        {
            category: "工具 SEKAI",
            color: "#884499", // 25ji Purple
            features: [
                { id: 'resourceEstimator', title: '預估資源計算機', description: '依據過往活動分數預估未來活動所需的大補充罐數。', charColor: CHARACTERS['宵崎奏'].color, icon: <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg> }
            ]
        }
    ];

    return (
        <div className="w-full animate-fadeIn py-6 px-4 max-w-[1800px] mx-auto">
            <div className="text-center mb-12">
                <div className="inline-block p-4 bg-cyan-500/10 rounded-full mb-4 ring-4 ring-cyan-500/10">
                    <TrophyIcon className="w-12 h-12 text-cyan-600 dark:text-cyan-400" />
                </div>
                <h1 className="text-4xl font-black text-slate-900 dark:text-white mb-3 tracking-tight">Hi Sekai TW Rankings</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 max-w-3xl mx-auto font-bold leading-relaxed">
                    提供 Project Sekai 台服最完整的排名數據查詢、歷代活動存檔以及多維度的數據分析工具。
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-6 xl:gap-8">
                {sections.map((section, sIdx) => (
                    <div key={sIdx} className="space-y-5">
                        {/* Group Header - Full Border and text-xl */}
                        <div 
                            className="px-4 py-3 rounded-2xl border-2 font-black text-xl uppercase tracking-[0.1em] text-center shadow-lg transition-all" 
                            style={{ 
                                backgroundColor: `${section.color}15`, 
                                color: section.color, 
                                borderColor: `${section.color}50`
                            }}
                        >
                            {section.category}
                        </div>
                        
                        <div className="space-y-3">
                            {section.features.map((feature) => (
                                <button 
                                    key={feature.id} 
                                    onClick={() => setCurrentView(feature.id as any)} 
                                    className="w-full text-left bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 transition-all duration-300 shadow-sm flex flex-col group hover:shadow-2xl hover:-translate-y-1.5 active:scale-95 min-h-[110px]" 
                                    onMouseEnter={(e) => e.currentTarget.style.borderColor = `${feature.charColor}80`} 
                                    onMouseLeave={(e) => e.currentTarget.style.borderColor = ''}
                                >
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 group-hover:bg-white dark:group-hover:bg-slate-700 transition-colors flex-shrink-0" style={{ color: feature.charColor }}>{feature.icon}</div>
                                        <h3 className="text-lg font-black text-slate-800 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400 leading-tight" style={{ color: feature.charColor }}>{feature.title}</h3>
                                    </div>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 font-bold leading-relaxed px-1">{feature.description}</p>
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
            <div className="mt-16 text-center text-xs text-slate-400 dark:text-slate-500 font-bold">
                <p>非官方粉絲製作網站 • Data by <a href="https://hisekai.org" target="_blank" rel="noopener noreferrer" className="text-cyan-500 hover:text-cyan-400 transition-colors underline decoration-dotted">Hi Sekai API</a></p>
            </div>
        </div>
    );
};

export default HomeView;
