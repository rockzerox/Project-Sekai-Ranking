import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import SongCard, { SongCardProps } from './SongCard';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface SongCarouselProps {
    songs: SongCardProps[];
}

const SongCarousel: React.FC<SongCarouselProps> = ({ songs }) => {
    const [activeIndex, setActiveIndex] = useState(0);

    // Reset index if songs change drastically
    useEffect(() => {
        if (activeIndex >= songs.length) {
            setActiveIndex(0);
        }
    }, [songs.length]);

    const handleNext = useCallback(() => {
        setActiveIndex((prev) => (prev + 1) % songs.length);
    }, [songs.length]);

    const handlePrev = useCallback(() => {
        setActiveIndex((prev) => (prev - 1 + songs.length) % songs.length);
    }, [songs.length]);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft') handlePrev();
            if (e.key === 'ArrowRight') handleNext();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleNext, handlePrev]);

    const onPanEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        const threshold = 50;
        if (info.offset.x > threshold) {
            handlePrev();
        } else if (info.offset.x < -threshold) {
            handleNext();
        }
    };

    if (songs.length === 0) return <div className="text-center py-20 text-slate-500 text-xl font-medium">沒有符合條件的曲目</div>;

    // Determine how many neighbors to show based on total songs
    // We want up to 3 neighbors on each side, but no duplicates
    const maxNeighbors = Math.min(3, Math.floor((songs.length - 1) / 2));
    const offsets = [];
    for (let i = -maxNeighbors; i <= maxNeighbors; i++) {
        offsets.push(i);
    }

    const getStyle = (offset: number) => {
        const absOffset = Math.abs(offset);
        const isCenter = offset === 0;
        
        // Z-index: Center is highest
        const zIndex = 50 - absOffset * 10;
        
        // Opacity
        const opacity = 1 - absOffset * 0.2;
        
        // Scale
        const scale = isCenter ? 1 : 1 - absOffset * 0.15;
        
        // X Position
        // Center: 0
        // Neighbors need to be spaced out
        // We use a non-linear spacing to create depth or just linear
        // Let's use linear for simplicity but wider for the first step to clear the center card
        let x = 0;
        if (offset !== 0) {
            const direction = offset > 0 ? 1 : -1;
            const baseSpacing = 550; // Distance from center to first neighbor
            const stepSpacing = 220; // Distance between neighbors
            
            x = direction * (baseSpacing + (absOffset - 1) * stepSpacing);
        }

        return { zIndex, opacity, scale, x };
    };

    // Helper to get song cover for previews
    const getSongCover = (index: number) => {
        const song = songs[index];
        if (!song) return '';
        return `https://raw.githubusercontent.com/rockzerox/Storage/refs/heads/main/Project-Sekai-Ranking/songs/${song.songId.padStart(3, '0')}.webp`;
    };

    const prevIndex = (activeIndex - 1 + songs.length) % songs.length;
    const nextIndex = (activeIndex + 1) % songs.length;

    return (
        <motion.div 
            className="relative w-full h-[750px] flex justify-center items-center overflow-hidden bg-slate-900 rounded-[3rem] border-8 border-slate-800 shadow-2xl ring-1 ring-white/10 group touch-pan-y"
            onPanEnd={onPanEnd}
        >
            {/* Speaker Mesh Texture Background */}
            <div className="absolute inset-0 opacity-30 pointer-events-none" 
                 style={{ 
                     backgroundImage: 'radial-gradient(#000 15%, transparent 16%), radial-gradient(#000 15%, transparent 16%)', 
                     backgroundSize: '6px 6px', 
                     backgroundPosition: '0 0, 3px 3px',
                     backgroundColor: '#1e293b'
                 }} 
            />
            
            {/* Decorative Screws */}
            <div className="absolute top-6 left-6 w-4 h-4 rounded-full bg-slate-700 shadow-inner border border-slate-600 flex items-center justify-center z-20">
                <div className="w-2 h-0.5 bg-slate-900 rotate-45"></div>
                <div className="w-2 h-0.5 bg-slate-900 -rotate-45 absolute"></div>
            </div>
            <div className="absolute top-6 right-6 w-4 h-4 rounded-full bg-slate-700 shadow-inner border border-slate-600 flex items-center justify-center z-20">
                <div className="w-2 h-0.5 bg-slate-900 rotate-45"></div>
                <div className="w-2 h-0.5 bg-slate-900 -rotate-45 absolute"></div>
            </div>
            <div className="absolute bottom-6 left-6 w-4 h-4 rounded-full bg-slate-700 shadow-inner border border-slate-600 flex items-center justify-center z-20">
                <div className="w-2 h-0.5 bg-slate-900 rotate-45"></div>
                <div className="w-2 h-0.5 bg-slate-900 -rotate-45 absolute"></div>
            </div>
            <div className="absolute bottom-6 right-6 w-4 h-4 rounded-full bg-slate-700 shadow-inner border border-slate-600 flex items-center justify-center z-20">
                <div className="w-2 h-0.5 bg-slate-900 rotate-45"></div>
                <div className="w-2 h-0.5 bg-slate-900 -rotate-45 absolute"></div>
            </div>

            {/* Mobile Top Navigation Previews */}
            <div className="absolute top-12 left-0 right-0 flex justify-between px-8 md:hidden z-30">
                {/* Prev Preview */}
                <div 
                    onClick={(e) => { e.stopPropagation(); handlePrev(); }}
                    className="flex flex-col items-center gap-1 cursor-pointer opacity-70 hover:opacity-100 transition-opacity"
                >
                    <div className="w-16 h-16 rounded-lg border-2 border-slate-600 overflow-hidden shadow-lg bg-slate-800">
                        <img 
                            src={getSongCover(prevIndex)} 
                            alt="Previous" 
                            className="w-full h-full object-cover"
                            onError={(e) => e.currentTarget.style.display = 'none'}
                        />
                    </div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">PREV</span>
                </div>

                {/* Next Preview */}
                <div 
                    onClick={(e) => { e.stopPropagation(); handleNext(); }}
                    className="flex flex-col items-center gap-1 cursor-pointer opacity-70 hover:opacity-100 transition-opacity"
                >
                    <div className="w-16 h-16 rounded-lg border-2 border-slate-600 overflow-hidden shadow-lg bg-slate-800">
                        <img 
                            src={getSongCover(nextIndex)} 
                            alt="Next" 
                            className="w-full h-full object-cover"
                            onError={(e) => e.currentTarget.style.display = 'none'}
                        />
                    </div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">NEXT</span>
                </div>
            </div>

            {/* Items */}
            <div className="relative w-full h-full flex justify-center items-center perspective-1000 z-10">
                <AnimatePresence initial={false} mode="popLayout">
                    {offsets.map((offset) => {
                        const safeIndex = ((activeIndex + offset) % songs.length + songs.length) % songs.length;
                        const song = songs[safeIndex];
                        const style = getStyle(offset);
                        const isCenter = offset === 0;

                        if (!song) return null;

                        return (
                            <motion.div
                                key={song.songId} // Key by songId for smooth sliding
                                layout
                                initial={{ 
                                    x: style.x + (offset > 0 ? 100 : -100), 
                                    opacity: 0, 
                                    scale: style.scale * 0.8 
                                }}
                                animate={{
                                    x: style.x,
                                    scale: style.scale,
                                    opacity: style.opacity,
                                    zIndex: style.zIndex,
                                }}
                                exit={{ 
                                    opacity: 0,
                                    scale: 0.5,
                                    transition: { duration: 0.2 }
                                }}
                                transition={{ 
                                    type: "spring", 
                                    stiffness: 300, 
                                    damping: 30,
                                    mass: 1
                                }}
                                className="absolute flex justify-center items-center cursor-pointer"
                                style={{
                                    width: isCenter ? 900 : 300,
                                    height: isCenter ? 550 : 300,
                                    // Use max-width for responsiveness
                                    maxWidth: '90vw',
                                }}
                                onClick={() => {
                                    if (!isCenter) {
                                        if (offset > 0) handleNext();
                                        else handlePrev();
                                    }
                                }}
                            >
                                <SongCard 
                                    {...song} 
                                    variant={isCenter ? 'full' : 'compact'} 
                                    isActive={isCenter}
                                />
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>

            {/* Controls */}
            <button 
                onClick={(e) => { e.stopPropagation(); handlePrev(); }}
                className="hidden md:block absolute left-4 md:left-8 top-1/2 -translate-y-1/2 p-4 bg-slate-800/80 rounded-full shadow-lg hover:bg-slate-700 transition-all hover:scale-110 z-[60] backdrop-blur-sm border border-slate-700 group ring-1 ring-white/10"
                aria-label="Previous Song"
            >
                <ChevronLeft className="w-8 h-8 text-slate-200 group-hover:text-cyan-400 transition-colors" />
            </button>
            <button 
                onClick={(e) => { e.stopPropagation(); handleNext(); }}
                className="hidden md:block absolute right-4 md:right-8 top-1/2 -translate-y-1/2 p-4 bg-slate-800/80 rounded-full shadow-lg hover:bg-slate-700 transition-all hover:scale-110 z-[60] backdrop-blur-sm border border-slate-700 group ring-1 ring-white/10"
                aria-label="Next Song"
            >
                <ChevronRight className="w-8 h-8 text-slate-200 group-hover:text-cyan-400 transition-colors" />
            </button>

            {/* Pagination Dots (Optional, but nice for context) */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-[60]">
                {songs.length <= 20 && songs.map((_, idx) => (
                    <div 
                        key={idx}
                        className={`w-2 h-2 rounded-full transition-all ${idx === activeIndex ? 'bg-cyan-500 w-6 shadow-[0_0_10px_rgba(6,182,212,0.5)]' : 'bg-slate-700'}`}
                    />
                ))}
                {songs.length > 20 && (
                    <div className="px-4 py-1 bg-black/50 text-white text-xs rounded-full backdrop-blur-sm border border-white/10 font-mono">
                        {activeIndex + 1} / {songs.length}
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default SongCarousel;
