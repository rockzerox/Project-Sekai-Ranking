
import React from 'react';
import TrophyIcon from './icons/TrophyIcon';
import { CHARACTERS } from '../constants';
import { UI_TEXT } from '../constants/uiText';

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
            category: UI_TEXT.sidebar.categories.ranking,
            color: "#4455DD",
            features: [
                { id: 'live', title: UI_TEXT.home.features.live.title, description: UI_TEXT.home.features.live.desc, charColor: CHARACTERS['1'].color, icon: <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg> },
                { id: 'past', title: UI_TEXT.home.features.past.title, description: UI_TEXT.home.features.past.desc, charColor: CHARACTERS['2'].color, icon: <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
                { id: 'distribution', title: UI_TEXT.home.features.distribution.title, description: UI_TEXT.home.features.distribution.desc, charColor: CHARACTERS['3'].color, icon: <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4h7v7H4z M13 4h7v7h-7z M4 13h7v7H4z M13 13h7v7h-7z" /></svg> }
            ]
        },
        {
            category: UI_TEXT.sidebar.categories.analysis,
            color: "#88DD44",
            features: [
                { id: 'comparison', title: UI_TEXT.home.features.comparison.title, description: UI_TEXT.home.features.comparison.desc, charColor: CHARACTERS['5'].color, icon: <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 18l4-6 4 4 10-10 M3 14l4-6 4 4 10-10" /></svg> },
                { id: 'analysis', title: UI_TEXT.home.features.analysis.title, description: UI_TEXT.home.features.analysis.desc, charColor: CHARACTERS['6'].color, icon: <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 20h16M6 20v-4h3v4M11 20v-8h3v8M16 20v-13h3v13" /></svg> },
                { id: 'trend', title: UI_TEXT.home.features.trend.title, description: UI_TEXT.home.features.trend.desc, charColor: CHARACTERS['7'].color, icon: <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg> }
            ]
        },
        {
            category: UI_TEXT.sidebar.categories.character,
            color: "#EE1166",
            features: [
                { id: 'worldLink', title: UI_TEXT.home.features.worldLink.title, description: UI_TEXT.home.features.worldLink.desc, charColor: CHARACTERS['9'].color, icon: <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
                { id: 'unitAnalysis', title: UI_TEXT.home.features.unitAnalysis.title, description: UI_TEXT.home.features.unitAnalysis.desc, charColor: '#00BBDD', icon: <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg> },
                { id: 'characterAnalysis', title: UI_TEXT.home.features.characterAnalysis.title, description: UI_TEXT.home.features.characterAnalysis.desc, charColor: '#FF7722', icon: <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg> }
            ]
        },
        {
            category: UI_TEXT.sidebar.categories.player,
            color: "#FF9900",
            features: [
                { id: 'playerAnalysis', title: UI_TEXT.home.features.playerAnalysis.title, description: UI_TEXT.home.features.playerAnalysis.desc, charColor: CHARACTERS['13'].color, icon: <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1m0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg> },
                { id: 'playerStructure', title: UI_TEXT.home.features.playerStructure.title, description: UI_TEXT.home.features.playerStructure.desc, charColor: CHARACTERS['14'].color, icon: <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg> },
                { id: 'playerProfile', title: UI_TEXT.home.features.playerProfile.title, description: UI_TEXT.home.features.playerProfile.desc, charColor: CHARACTERS['15'].color, icon: <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7z M7 10h2 M7 14h6" /></svg> }
            ]
        },
        {
            category: UI_TEXT.sidebar.categories.tools,
            color: "#884499",
            features: [
                { id: 'resourceEstimator', title: UI_TEXT.home.features.resourceEstimator.title, description: UI_TEXT.home.features.resourceEstimator.desc, charColor: CHARACTERS['17'].color, icon: <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg> },
                { id: 'mySekaiMining', title: UI_TEXT.home.features.mySekaiMining.title, description: UI_TEXT.home.features.mySekaiMining.desc, charColor: '#8888CC', icon: <svg className="w-7 h-7" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="2" fill="none"/><circle cx="9" cy="10" r="1.5" fill="currentColor"/><circle cx="15" cy="10" r="1.5" fill="currentColor"/><path d="M10 15h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg> },
            ]
        }
    ];

    return (
        <div className="w-full animate-fadeIn py-6 px-4 max-w-[1800px] mx-auto">
            <div className="text-center mb-10">
                {/* 標題列：[ICON][站名][ICON] 佈局 */}
                <div className="flex items-center justify-center gap-4 mb-4">
                    <div className="p-2.5 bg-cyan-500/10 rounded-full ring-2 ring-cyan-500/10 transition-transform hover:rotate-12 duration-500">
                        <TrophyIcon className="w-8 h-8 text-cyan-600 dark:text-cyan-400" />
                    </div>
                    
                    <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                        {UI_TEXT.home.title}
                    </h1>
                    
                    <div className="p-2.5 bg-cyan-500/10 rounded-full ring-2 ring-cyan-500/10 transition-transform hover:-rotate-12 duration-500">
                        <TrophyIcon className="w-8 h-8 text-cyan-600 dark:text-cyan-400" />
                    </div>
                </div>

                <p className="text-sm text-slate-500 dark:text-slate-400 max-w-3xl mx-auto font-bold leading-relaxed px-4">
                    {UI_TEXT.home.description}
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-6 xl:gap-8">
                {sections.map((section, sIdx) => (
                    <div key={sIdx} className="space-y-5">
                        <div className="px-4 py-3 rounded-2xl border-2 font-black text-xl uppercase tracking-[0.1em] text-center shadow-lg transition-all" style={{ backgroundColor: `${section.color}15`, color: section.color, borderColor: `${section.color}50` }}>{section.category}</div>
                        <div className="space-y-3">
                            {section.features.map((feature) => (
                                <button key={feature.id} onClick={() => setCurrentView(feature.id as any)} className="w-full text-left bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 transition-all duration-300 shadow-sm flex flex-col group hover:shadow-2xl hover:-translate-y-1.5 active:scale-95 min-h-[110px]" onMouseEnter={(e) => e.currentTarget.style.borderColor = `${feature.charColor}80`} onMouseLeave={(e) => e.currentTarget.style.borderColor = ''}>
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
                <p>{UI_TEXT.common.unofficialLabel} • {UI_TEXT.common.dataBy} <a href="https://hisekai.org" target="_blank" rel="noopener noreferrer" className="text-cyan-500 hover:text-cyan-400 transition-colors underline decoration-dotted">Hi Sekai API</a></p>
            </div>
        </div>
    );
};

export default HomeView;
