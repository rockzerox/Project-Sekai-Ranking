import React, { useState, useCallback } from 'react';
import { NAV_GROUPS, NavGroup } from '../../config/navConfig';
import { ViewType } from '../../types';

interface MobileTabBarProps {
    currentView: ViewType;
    setCurrentView: (view: ViewType) => void;
}

// Tab icons (simplified 24px, one per category)
const TAB_ICONS: Record<string, React.ReactNode> = {
    ranking: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
    ),
    analysis: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
    ),
    character: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    ),
    player: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1m0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
    ),
    tools: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
    ),
};

// Map category string → icon key
const getCategoryKey = (category: string): string => {
    if (category.includes('查榜')) return 'ranking';
    if (category.includes('分析')) return 'analysis';
    if (category.includes('推角')) return 'character';
    if (category.includes('玩家')) return 'player';
    return 'tools';
};

// Short label for the tab bar
const getShortLabel = (category: string): string => {
    const match = category.match(/^([\u4e00-\u9fff]+)/);
    return match ? match[1] : category.slice(0, 2);
};

const SubMenuPanel: React.FC<{
    group: NavGroup;
    currentView: ViewType;
    onSelect: (view: ViewType) => void;
    onClose: () => void;
}> = ({ group, currentView, onSelect, onClose }) => {
    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px] animate-fadeIn"
                onClick={onClose}
            />

            {/* Panel */}
            <div className="fixed bottom-16 left-0 right-0 z-50 mx-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden animate-slideUp">
                {/* Panel Header */}
                <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 flex items-center gap-2">
                    <div className="w-1.5 h-5 rounded-full" style={{ backgroundColor: group.color }} />
                    <span className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                        {group.category}
                    </span>
                </div>

                {/* Items */}
                <div className="py-2">
                    {group.items.map((item) => {
                        const isActive = currentView === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => onSelect(item.id)}
                                className={`
                                    w-full flex items-center gap-4 px-4 py-3.5 text-left transition-all
                                    ${isActive
                                        ? 'bg-slate-50 dark:bg-slate-700/50'
                                        : 'hover:bg-slate-50 dark:hover:bg-slate-700/30 active:bg-slate-100 dark:active:bg-slate-700/60'
                                    }
                                    group relative
                                `}
                            >
                                {/* Left accent bar */}
                                <div
                                    className={`absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full transition-opacity ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-40'}`}
                                    style={{ backgroundColor: item.charColor }}
                                />

                                {/* Icon */}
                                <div
                                    className="flex-shrink-0 transition-colors"
                                    style={{ color: isActive ? item.charColor : undefined }}
                                >
                                    {item.icon}
                                </div>

                                {/* Label */}
                                <span
                                    className={`font-bold text-sm transition-colors ${isActive ? '' : 'text-slate-700 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white'}`}
                                    style={isActive ? { color: item.charColor } : undefined}
                                >
                                    {item.label}
                                </span>

                                {/* Active check */}
                                {isActive && (
                                    <svg className="w-4 h-4 ml-auto flex-shrink-0" style={{ color: item.charColor }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                    </svg>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>
        </>
    );
};

const MobileTabBar: React.FC<MobileTabBarProps> = ({ currentView, setCurrentView }) => {
    const [openGroupIdx, setOpenGroupIdx] = useState<number | null>(null);

    const handleTabPress = useCallback((idx: number, group: NavGroup) => {
        // If only one item, navigate directly
        if (group.items.length === 1) {
            setCurrentView(group.items[0].id);
            setOpenGroupIdx(null);
            return;
        }
        setOpenGroupIdx(prev => prev === idx ? null : idx);
    }, [setCurrentView]);

    const handleSelect = useCallback((view: ViewType) => {
        setCurrentView(view);
        setOpenGroupIdx(null);
    }, [setCurrentView]);

    const handleClose = useCallback(() => setOpenGroupIdx(null), []);

    return (
        <>
            {/* Sub-menu panel */}
            {openGroupIdx !== null && (
                <SubMenuPanel
                    group={NAV_GROUPS[openGroupIdx]}
                    currentView={currentView}
                    onSelect={handleSelect}
                    onClose={handleClose}
                />
            )}

            {/* Tab Bar */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 h-16 bg-white/80 dark:bg-slate-900/85 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 flex items-stretch">
                {NAV_GROUPS.map((group, idx) => {
                    const isGroupActive = group.items.some(item => item.id === currentView);
                    const isOpen = openGroupIdx === idx;
                    const categoryKey = getCategoryKey(group.category);
                    const shortLabel = getShortLabel(group.category);

                    return (
                        <button
                            key={group.category}
                            onClick={() => handleTabPress(idx, group)}
                            className="flex-1 flex flex-col items-center justify-center gap-0.5 transition-all active:scale-90 relative"
                            aria-label={group.category}
                        >
                            {/* Active dot */}
                            {(isGroupActive || isOpen) && (
                                <span
                                    className="absolute top-1.5 w-1 h-1 rounded-full"
                                    style={{ backgroundColor: group.color }}
                                />
                            )}

                            {/* Icon */}
                            <span
                                className={`transition-colors duration-200 ${!(isGroupActive || isOpen) ? 'text-slate-400 dark:text-slate-500' : ''}`}
                                style={{ color: (isGroupActive || isOpen) ? group.color : undefined }}
                            >
                                {TAB_ICONS[categoryKey]}
                            </span>

                            {/* Label */}
                            <span
                                className={`text-[10px] font-black tracking-tight transition-colors duration-200 ${!(isGroupActive || isOpen) ? 'text-slate-400 dark:text-slate-500' : ''}`}
                                style={{ color: (isGroupActive || isOpen) ? group.color : undefined }}
                            >
                                {shortLabel}
                            </span>
                        </button>
                    );
                })}
            </nav>
        </>
    );
};

export default MobileTabBar;
