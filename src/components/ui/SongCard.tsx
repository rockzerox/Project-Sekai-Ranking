import React, { useState } from 'react';
import { getAssetUrl, getChar } from '../../utils/gameUtils';
import { UNIT_MASTER } from '../../config/constants';
import { Info, X } from 'lucide-react';

export interface SongCardProps {
    songId: string;
    eventId: number;
    eventName: string;
    title: string;
    unit: string;
    banner: string;
    lyricist: string;
    composer: string;
    arranger: string;
    mv2d: string | null;
    mv3d: string | null;
    isActive?: boolean;
    variant?: 'full' | 'compact';
    onClick?: () => void;
}

const SongCard: React.FC<SongCardProps> = ({
    songId,
    eventId,
    eventName,
    title,
    unit,
    banner,
    lyricist,
    composer,
    arranger,
    mv2d,
    mv3d,
    isActive = false,
    variant = 'full',
    onClick
}) => {
    const [showInfo, setShowInfo] = useState(false);
    const unitLabel = UNIT_MASTER[unit]?.name || "Unknown";
    const unitLogo = getAssetUrl(unit, 'unit');
    const bannerChar = getChar(banner);
    const bannerImg = (banner !== '-') ? getAssetUrl(banner, 'character') : null;
    const eventBannerUrl = getAssetUrl(eventId.toString(), 'event');
    const songCoverUrl = `https://raw.githubusercontent.com/rockzerox/Storage/refs/heads/main/Project-Sekai-Ranking/songs/${songId.padStart(3, '0')}.webp`;

    if (variant === 'compact') {
        return (
            <div 
                className={`w-full h-full bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden relative group cursor-pointer border border-slate-200 dark:border-slate-700 transition-all duration-300 ${isActive ? 'ring-2 ring-cyan-500' : ''}`}
                onClick={onClick}
            >
                <img 
                    src={songCoverUrl} 
                    alt={title} 
                    className="w-full h-full object-cover"
                    onError={(e) => e.currentTarget.style.display = 'none'} 
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                    <p className="text-white text-xs font-bold truncate text-center">{title}</p>
                </div>
            </div>
        );
    }

    const renderInfoTable = () => (
        <div className="flex flex-col gap-2 text-sm">
            {/* Event ID */}
            <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-700/50 pb-2 border-dashed shrink-0">
                <span className="text-slate-500 dark:text-slate-400 font-bold text-xs uppercase tracking-wider w-16 shrink-0">期數</span>
                <span className="truncate font-medium text-slate-900 dark:text-slate-100">第 {eventId} 期</span>
            </div>

            {/* Event Name */}
            <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-700/50 pb-2 border-dashed shrink-0">
                <span className="text-slate-500 dark:text-slate-400 font-bold text-xs uppercase tracking-wider w-16 shrink-0">活動名稱</span>
                <span className="truncate font-medium text-slate-900 dark:text-slate-100" title={eventName}>{eventName}</span>
            </div>

            {/* Unit */}
            <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-700/50 pb-2 border-dashed shrink-0">
                <span className="text-slate-500 dark:text-slate-400 font-bold text-xs uppercase tracking-wider w-16 shrink-0">團體</span>
                <div className="flex items-center gap-2 min-w-0">
                    {unitLogo && <img src={unitLogo} alt={unitLabel} className="w-5 h-5 object-contain" />}
                    <span 
                        className="truncate font-medium" 
                        style={{ color: UNIT_MASTER[unit]?.color || 'inherit' }}
                        title={unitLabel}
                    >
                        {unitLabel}
                    </span>
                </div>
            </div>

            {/* Banner */}
            <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-700/50 pb-2 border-dashed shrink-0">
                <span className="text-slate-500 dark:text-slate-400 font-bold text-xs uppercase tracking-wider w-16 shrink-0">Banner</span>
                <div className="flex items-center gap-2 min-w-0">
                    {bannerImg ? (
                        <img 
                            src={bannerImg} 
                            alt={bannerChar?.name} 
                            className="w-6 h-6 rounded-full object-cover border-2"
                            style={{ borderColor: bannerChar?.color || '#e2e8f0' }}
                        />
                    ) : (
                        <span className="text-xs text-slate-400">-</span>
                    )}
                    {banner !== '-' && (
                        <span 
                            className="truncate font-medium"
                            style={{ color: bannerChar?.color || 'inherit' }}
                        >
                            {bannerChar?.name}
                        </span>
                    )}
                </div>
            </div>

            {/* Lyricist */}
            <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-700/50 pb-2 border-dashed shrink-0">
                <span className="text-slate-500 dark:text-slate-400 font-bold text-xs uppercase tracking-wider w-16 shrink-0">作詞</span>
                <span className="truncate text-slate-900 dark:text-slate-100 font-mono text-xs" title={lyricist}>{lyricist}</span>
            </div>

            {/* Composer */}
            <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-700/50 pb-2 border-dashed shrink-0">
                <span className="text-slate-500 dark:text-slate-400 font-bold text-xs uppercase tracking-wider w-16 shrink-0">作曲</span>
                <span className="truncate text-slate-900 dark:text-slate-100 font-mono text-xs" title={composer}>{composer}</span>
            </div>

            {/* Arranger */}
            <div className="flex items-center gap-3 pb-2 shrink-0">
                <span className="text-slate-500 dark:text-slate-400 font-bold text-xs uppercase tracking-wider w-16 shrink-0">編曲</span>
                <span className="truncate text-slate-900 dark:text-slate-100 font-mono text-xs" title={arranger}>{arranger}</span>
            </div>
        </div>
    );

    const renderMvButtons = () => (
        <>
            {mv2d ? (
                <a 
                    href={mv2d} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-cyan-500 hover:text-white dark:hover:bg-cyan-600 hover:border-cyan-500 text-slate-600 dark:text-slate-300 py-2 rounded-lg text-center text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 group"
                    onClick={(e) => e.stopPropagation()}
                >
                    <svg className="w-4 h-4 text-red-500 group-hover:text-white transition-colors" fill="currentColor" viewBox="0 0 24 24"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" /></svg>
                    2DMV
                </a>
            ) : (
                <div className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-300 dark:text-slate-700 py-2 rounded-lg text-center text-xs font-bold cursor-not-allowed opacity-50 flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" /></svg>
                    2DMV
                </div>
            )}
            
            {mv3d ? (
                <a 
                    href={mv3d} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-cyan-500 hover:text-white dark:hover:bg-cyan-600 hover:border-cyan-500 text-slate-600 dark:text-slate-300 py-2 rounded-lg text-center text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 group"
                    onClick={(e) => e.stopPropagation()}
                >
                    <svg className="w-4 h-4 text-red-500 group-hover:text-white transition-colors" fill="currentColor" viewBox="0 0 24 24"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" /></svg>
                    3DMV
                </a>
            ) : (
                <div className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-300 dark:text-slate-700 py-2 rounded-lg text-center text-xs font-bold cursor-not-allowed opacity-50 flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" /></svg>
                    3DMV
                </div>
            )}
        </>
    );

    return (
        <div 
            className={`w-full h-full bg-slate-50 dark:bg-slate-900 rounded-2xl shadow-xl overflow-hidden flex flex-col border-2 border-slate-200 dark:border-slate-700 transition-all duration-300 ${isActive ? 'ring-4 ring-cyan-500/50 shadow-cyan-500/20' : ''}`}
            onClick={onClick}
        >
            {/* Header: Song Name */}
            <div className="h-14 md:h-16 flex items-center justify-center bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 md:px-6 relative overflow-hidden shrink-0">
                {/* Speaker Mesh Pattern Effect for Header */}
                <div className="absolute inset-0 opacity-5 pointer-events-none" 
                     style={{ backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)', backgroundSize: '4px 4px' }} 
                />
                <h2 className="text-xl md:text-2xl font-black text-slate-800 dark:text-white truncate text-center w-full tracking-tight relative z-10" title={title}>
                    {title}
                </h2>
            </div>

            {/* Body */}
            <div className="flex-1 relative flex flex-col md:flex-row overflow-hidden bg-white dark:bg-slate-950">
                
                {/* Left (Desktop) / Top (Mobile): Song Image */}
                <div className="w-full md:w-5/12 shrink-0 md:p-5 flex flex-col gap-4">
                    {/* Song Image Container */}
                    <div className="w-full aspect-square p-6 md:p-0 relative">
                        <div className="w-full h-full rounded-xl overflow-hidden shadow-lg border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 relative group">
                            <img 
                                src={songCoverUrl} 
                                alt={title} 
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                onError={(e) => e.currentTarget.style.display = 'none'} 
                            />
                            <div className="absolute inset-0 ring-1 ring-inset ring-black/10 dark:ring-white/10 rounded-xl pointer-events-none" />
                            
                            {/* Mobile Info Toggle Button - Floating on Image */}
                            <button 
                                onClick={(e) => { e.stopPropagation(); setShowInfo(true); }}
                                className="md:hidden absolute top-2 right-2 z-30 p-2 bg-black/50 backdrop-blur-md rounded-full text-white border border-white/20 shadow-lg hover:bg-black/70 transition-all"
                            >
                                <Info size={18} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right (Desktop) / Bottom (Mobile): Details */}
                <div className="w-full md:w-7/12 flex flex-col md:p-5 md:pl-0">
                    
                    {/* Event Banner - Always Visible */}
                    <div className="px-6 pb-2 md:p-0 md:mb-4">
                        <div className="w-full h-20 md:h-28 rounded-lg overflow-hidden shadow-md border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 shrink-0 relative group flex items-center justify-center">
                             <img 
                                src={eventBannerUrl} 
                                alt={eventName} 
                                className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
                                onError={(e) => e.currentTarget.style.display = 'none'} 
                            />
                        </div>
                    </div>

                    {/* Mobile MV Buttons - Below Banner */}
                    <div className="px-6 pb-6 md:hidden flex gap-3">
                        {renderMvButtons()}
                    </div>

                    {/* Desktop Info Table & Buttons */}
                    <div className="hidden md:flex flex-1 flex-col min-h-0">
                        {/* Info Table */}
                        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                            {renderInfoTable()}
                        </div>

                        {/* Desktop Buttons */}
                        <div className="flex gap-3 mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 shrink-0">
                            {renderMvButtons()}
                        </div>
                    </div>
                </div>

                {/* Mobile Info Overlay */}
                <div className={`md:hidden absolute inset-0 z-50 bg-slate-50/95 dark:bg-slate-900/95 backdrop-blur-md transition-transform duration-300 flex flex-col ${showInfo ? 'translate-y-0' : 'translate-y-full'}`}>
                    <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
                        <span className="font-bold text-slate-700 dark:text-slate-200">詳細資訊</span>
                        <button 
                            onClick={(e) => { e.stopPropagation(); setShowInfo(false); }}
                            className="p-2 bg-slate-200 dark:bg-slate-800 rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-6">
                        {renderInfoTable()}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default SongCard;
