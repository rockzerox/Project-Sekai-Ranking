import React from 'react';
import { CHARACTERS } from '../../config/constants';
import { getAssetUrl } from '../../utils/gameUtils';
import { WlChapterStatus } from '../../utils/timeUtils';

export interface WorldLinkChapterTab {
    charId: string;
    status?: WlChapterStatus;
    startAt?: string;
}

interface WorldLinkTabsProps {
    chapters: WorldLinkChapterTab[];
    activeChapter: string;
    onChapterChange: (charId: string) => void;
}

const WorldLinkTabs: React.FC<WorldLinkTabsProps> = ({
    chapters,
    activeChapter,
    onChapterChange
}) => {
    return (
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            {/* 總榜 tab */}
            <button
                onClick={(e) => { e.stopPropagation(); onChapterChange('all'); }}
                className={`px-3 py-1 text-xs font-bold rounded-full transition-all whitespace-nowrap border flex-shrink-0 ${
                    activeChapter === 'all'
                        ? 'bg-slate-700 text-white border-transparent shadow-md'
                        : 'bg-transparent text-slate-50 dark:text-slate-400 border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
            >
                總榜<span className="hidden sm:inline"> (Total)</span>
            </button>

            {chapters.map((ct) => {
                const isActive    = activeChapter === ct.charId;
                const char        = CHARACTERS[ct.charId];
                const isDisabled  = ct.status === 'not_started' || ct.status === 'warming';
                const canClick    = !isDisabled;

                let tooltip = '';
                if (ct.status === 'not_started' && ct.startAt) {
                    tooltip = `${new Date(ct.startAt).toLocaleString('zh-TW', {
                        month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit'
                    })} 開始`;
                } else if (ct.status === 'warming') {
                    tooltip = '資料尚未就緒，請稍後';
                }

                return (
                    <div key={ct.charId} className="relative group/tab flex-shrink-0">
                        <button
                            disabled={!canClick}
                            onClick={(e) => { e.stopPropagation(); if (canClick) onChapterChange(ct.charId); }}
                            className={`flex items-center gap-1.5 px-2 py-1 text-xs font-bold rounded-full transition-all whitespace-nowrap border ${
                                isDisabled
                                    ? 'opacity-30 grayscale cursor-not-allowed bg-transparent text-slate-400 border-slate-600'
                                    : isActive
                                        ? 'text-white border-transparent shadow-md'
                                        : 'bg-transparent text-slate-50 dark:text-slate-400 border-slate-300 dark:border-slate-600 hover:opacity-80'
                            }`}
                            style={{ 
                                backgroundColor: isActive ? (char?.color || '#999') : 'transparent',
                                borderColor: isActive ? 'transparent' : undefined
                            }}
                        >
                            {getAssetUrl(ct.charId, 'character') && (
                                <img
                                    src={getAssetUrl(ct.charId, 'character')}
                                    alt=""
                                    className="w-4 h-4 rounded-full border border-white/30"
                                />
                            )}
                            <span className="hidden sm:inline">{char?.name || ct.charId}</span>
                        </button>

                        {tooltip && (
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5
                                bg-slate-900/95 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap
                                pointer-events-none opacity-0 group-hover/tab:opacity-100 transition-opacity z-50">
                                {tooltip}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default WorldLinkTabs;
