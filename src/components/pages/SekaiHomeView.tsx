import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getAssetUrl, getChar } from '../../utils/gameUtils';
import { ViewType } from '../../types';
import { UI_TEXT } from '../../config/uiText';
import TrophyIcon from '../../components/icons/TrophyIcon';

interface Feature {
    id: string;
    title: string;
    description: string;
    icon: React.ReactNode;
    charColor: string;
    charId?: string; // 角色 ID
}

interface FeatureSection {
    category: string;
    color: string;
    features: Feature[];
}

interface SekaiHomeViewProps {
    setCurrentView: (view: ViewType) => void;
    sections: FeatureSection[];
    setViewStyle: (style: 'sekai' | 'classic') => void;
}

// 漂浮三角形粒子定義
interface FloatingShard {
    id: number;
    x: number;
    y: number;
    size: number;
    rotate: number;
    duration: number;
    delay: number;
    color: string;
}

const SekaiHomeView: React.FC<SekaiHomeViewProps> = ({
    setCurrentView,
    sections,
    setViewStyle
}) => {
    const [activeIndex, setActiveIndex] = useState(0);
    const [hoveredFeature, setHoveredFeature] = useState<string | null>(null);

    // 隨機生成 15 個 Sekai 幾何三角形碎片
    const shards = useMemo((): FloatingShard[] => {
        const shardColors = [
            'rgba(56, 189, 248, 0.12)',  // 藍色
            'rgba(244, 63, 94, 0.12)',   // 粉色
            'rgba(16, 185, 129, 0.12)',  // 綠色
            'rgba(168, 85, 247, 0.12)',  // 紫色
            'rgba(245, 158, 11, 0.12)',  // 橙色
        ];
        return Array.from({ length: 15 }, (_, i) => ({
            id: i,
            x: Math.random() * 100,
            y: Math.random() * 100,
            size: Math.random() * 60 + 30,
            rotate: Math.random() * 360,
            duration: Math.random() * 20 + 20,
            delay: Math.random() * -20,
            color: shardColors[i % shardColors.length]
        }));
    }, []);

    // 5 個大世界球的類別定義與其對應的配色
    const activeSection = sections[activeIndex];

    // 3D 橢圓軌道參數
    const A = 680; // 橫向半徑 (X 軸) - 大幅拉寬以填滿左右空白，對齊 1080p+ 寬屏
    const B = 130; // 縱向半徑 (Y 軸) - 拉高以增加 3D 立體公轉感

    return (
        <div className="relative w-full min-h-[85vh] flex flex-col justify-between items-center overflow-hidden py-4 select-none">
            
            {/* 1. 動態幾何碎片背景 */}
            <div className="absolute inset-0 pointer-events-none z-0">
                {shards.map((shard) => (
                    <motion.div
                        key={shard.id}
                        className="absolute aspect-square opacity-70"
                        style={{
                            left: `${shard.x}%`,
                            top: `${shard.y}%`,
                            width: `${shard.size}px`,
                            background: `linear-gradient(135deg, ${shard.color} 0%, transparent 100%)`,
                            clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
                            mixBlendMode: 'screen',
                            filter: `drop-shadow(0 0 10px ${shard.color.replace('0.12', '0.38')})`,
                        }}
                        animate={{
                            y: [0, -40, 0],
                            rotate: [shard.rotate, shard.rotate + 360],
                            scale: [1, 1.15, 1],
                        }}
                        transition={{
                            duration: shard.duration,
                            repeat: Infinity,
                            delay: shard.delay,
                            ease: "easeInOut",
                        }}
                    />
                ))}
            </div>

            {/* 右上角切換按鈕 */}
            <div className="absolute top-2 right-4 z-40">
                <button
                    onClick={() => setViewStyle('classic')}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white/80 dark:bg-slate-900/90 text-[11px] font-bold text-slate-700 dark:text-slate-300 rounded-full border border-slate-300/60 dark:border-slate-700/60 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-md backdrop-blur-md"
                >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" /></svg>
                    經典網頁風格
                </button>
            </div>

            {/* 2. 頂部網站標題及說明 (與舊版經典首頁一致，適配深淺色模式) */}
            <div className="w-full text-center py-6 px-4 z-30 select-text max-w-[900px] mx-auto mt-4">
                {/* 標題列：[ICON][站名][ICON] 佈局，與舊版經典首頁完全一致 */}
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

                <p className="text-sm text-slate-500 dark:text-slate-400 font-bold max-w-[700px] mx-auto leading-relaxed">
                    {UI_TEXT.home.description}
                </p>
            </div>

            {/* 這裡改為彈性拉開頂部與中間輪播的距離 */}
            <div className="flex-1"></div>

            {/* 3. 3D 橢圓形軌道世界球 Carousel (最大寬度放大至 1800px，高度拉伸至 450px，底端 mb 加大為 16 以拉開下方免責聲明距離) */}
            <div className="relative w-full max-w-[1800px] h-[450px] flex items-end justify-center z-20 mt-4 mb-16">

                {(() => {
                    const sekaiImages = ['LNsekai.png', 'MMJsekai.png', 'VBSsekai.png', 'WSsekai.png', '25sekai.png'];
                    return sections.map((section, index) => {
                        // 計算此世界球在橢圓上的角度偏移
                        // activeIndex 就定位於正下方正中央 (θ = Math.PI / 2)
                        const angleOffset = ((index - activeIndex) * 2 * Math.PI) / 5;
                        const theta = angleOffset + Math.PI / 2;

                        const x = A * Math.cos(theta);
                        const y = B * Math.sin(theta);
                        
                        // 用 sin 決定 Z 軸深度 (值在 -1 到 1 之間)
                        const depthFactor = (Math.sin(theta) + 1) / 2; // 0 (後) 到 1 (前)
                        
                        const scale = 0.72 + 0.28 * depthFactor; // 後方球體 size 較小
                        const opacity = 0.45 + 0.55 * depthFactor; // 後方較暗
                        const zIndex = Math.round(10 + 20 * depthFactor);
                        const isCenter = index === activeIndex;

                        return (
                            <div
                                key={section.category}
                                className="absolute transition-all duration-700 ease-out flex flex-col items-center justify-center cursor-pointer"
                                style={{
                                    transform: `translate3d(${x}px, ${y}px, 0) scale(${scale})`,
                                    opacity: opacity,
                                    zIndex: zIndex,
                                    bottom: '90px', // 配合 B 半徑拉高，底部間距適度增加
                                }}
                                onClick={() => {
                                    if (!isCenter) {
                                        setActiveIndex(index);
                                        setHoveredFeature(null);
                                    }
                                }}
                            >
                                {/* 世界球體本體 (做成圓形窗戶，露出矩形圖片的一部分) */}
                                <div
                                    className={`w-48 h-48 rounded-full border relative overflow-hidden group transition-all duration-500 shadow-2xl flex items-center justify-center ${
                                        isCenter 
                                            ? 'border-transparent' 
                                            : 'border-slate-300/40 dark:border-slate-600/40 hover:border-slate-400/60 dark:hover:border-slate-500/60 hover:scale-105 bg-white/20 dark:bg-slate-900/10'
                                    }`}
                                    style={{
                                        boxShadow: isCenter 
                                            ? `0 0 45px ${section.color}25, inset 0 0 25px ${section.color}30`
                                            : 'inset 0 0 15px rgba(0, 0, 0, 0.4)',
                                    }}
                                >
                                    {/* 背景 Sekai 圖片 (object-cover 達到窗戶局部可見，Hover 時平滑放大) */}
                                    <img
                                        src={`https://raw.githubusercontent.com/rockzerox/Storage/refs/heads/main/Project-Sekai-Ranking/SekaiWorld/${sekaiImages[index]}`}
                                        alt=""
                                        className="w-full h-full object-cover transition-transform duration-700 ease-out scale-105 group-hover:scale-115"
                                    />

                                    {/* 水晶球發光與色彩遮罩 (Glow Overlay) */}
                                    <div 
                                        className="absolute inset-0 rounded-full transition-all duration-500 pointer-events-none"
                                        style={{
                                            background: isCenter 
                                                ? `radial-gradient(circle at center, transparent 30%, ${section.color}25 80%, ${section.color}45 100%)`
                                                : 'radial-gradient(circle at center, transparent 65%, rgba(15, 23, 42, 0.4) 100%)',
                                        }}
                                    />

                                    {/* 動態外發光光環 */}
                                    {isCenter && (
                                        <div 
                                            className="absolute inset-0 rounded-full animate-pulse opacity-20 border-2"
                                            style={{ borderColor: section.color }}
                                        />
                                    )}
                                </div>

                                {/* 世界球體下方藥丸標籤 (像遊戲內的世界切換標籤，文字大小升級至 text-base) */}
                                <div 
                                    className={`mt-4 px-6 py-2.5 rounded-full border transition-all duration-500 select-none shadow-md text-center text-xl font-black tracking-wider whitespace-nowrap bg-white/90 dark:bg-slate-950/85 ${
                                        isCenter 
                                            ? '' 
                                            : 'text-slate-500 dark:text-slate-400 border-slate-300/40 dark:border-slate-700/40 shadow-sm'
                                    }`}
                                    style={{
                                        borderColor: isCenter ? `${section.color}60` : undefined,
                                        color: isCenter ? section.color : undefined,
                                        textShadow: isCenter ? `0 0 6px ${section.color}30` : 'none',
                                        boxShadow: isCenter ? `0 0 15px ${section.color}15` : undefined,
                                    }}
                                >
                                    {section.category}
                                </div>
                            </div>
                        );
                    });
                })()}

                {/* 4. 下方世界球兩側動態橫幅及子按鈕 (橫幅拉大到 w-[1550px] 配合 A=680，h-36 配合 flex-col 上下排列) */}
                <div className="absolute left-1/2 -translate-x-1/2 bottom-[-55px] z-30 flex items-center justify-center w-[1550px] h-36">
                    
                    {/* 左側延伸橫幅 - padding 縮減為 pr-16 讓按鈕與世界球更緊密靠攏 */}
                    <div className="flex-1 flex justify-end items-center pr-16 relative h-full">
                        {/* 半透明玻璃背景橫條 - 寬度縮短至 450px，右側向內移至 165px */}
                        <div 
                            className="absolute right-[165px] top-1/2 -translate-y-1/2 w-[450px] h-[3px] opacity-40"
                            style={{ background: `linear-gradient(to left, ${activeSection.color}, transparent)` }}
                        />
                        
                        {/* 修改為垂直排列 flex-col gap-4，右邊距縮小為 mr-2 */}
                        <div className="flex flex-col gap-4 relative z-10 mr-2 items-end justify-center h-full">
                            {activeSection.features.slice(0, 2).map((feat) => {
                                const isHovered = hoveredFeature === feat.id;
                                return (
                                    <div 
                                        key={feat.id} 
                                        className="relative flex items-center"
                                        onMouseEnter={() => setHoveredFeature(feat.id)}
                                        onMouseLeave={() => setHoveredFeature(null)}
                                    >
                                        {/* 鋼鐵人 HUD 左側延伸懸浮說明面板 (寬高放大至 320px * 110px，適配深淺色模式) */}
                                        <AnimatePresence>
                                            {isHovered && (
                                                <motion.div
                                                    initial={{ width: 0, opacity: 0 }}
                                                    animate={{ width: 320, opacity: 1 }}
                                                    exit={{ width: 0, opacity: 0 }}
                                                    transition={{ duration: 0.25, ease: "easeOut" }}
                                                    className="absolute right-[115%] top-1/2 -translate-y-1/2 h-[110px] bg-white/95 dark:bg-slate-950/75 border rounded-xl p-3.5 flex flex-col justify-center overflow-hidden backdrop-blur-md shadow-lg text-left"
                                                    style={{ 
                                                        borderColor: feat.charColor,
                                                        boxShadow: `0 0 15px ${feat.charColor}20`,
                                                    }}
                                                >
                                                    <span className="text-xs md:text-sm font-black uppercase tracking-widest mb-1.5" style={{ color: feat.charColor }}>
                                                        {feat.title}
                                                    </span>
                                                    <p className="text-[11px] md:text-xs text-slate-600 dark:text-slate-300 font-bold leading-relaxed line-clamp-3">
                                                        {feat.description}
                                                    </p>
                                                    {/* HUD 折角 */}
                                                    <div className="absolute top-0 right-0 w-1.5 h-1.5 border-t border-r" style={{ borderColor: feat.charColor }}></div>
                                                    <div className="absolute bottom-0 right-0 w-1.5 h-1.5 border-b border-r" style={{ borderColor: feat.charColor }}></div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>

                                        {/* 按鈕本體 (尺寸擴展為 w-56 h-14，字體 text-base，whitespace-nowrap 防止換行) */}
                                        <button
                                            onClick={() => setCurrentView(feat.id as ViewType)}
                                            className="w-56 h-14 rounded-full bg-white/75 dark:bg-slate-900/60 hover:bg-slate-50/90 dark:hover:bg-slate-800/80 text-base font-black text-slate-800 dark:text-slate-200 border flex items-center justify-between px-4 transition-all shadow-md gap-2 whitespace-nowrap"
                                            style={{ 
                                                borderColor: isHovered ? feat.charColor : 'rgba(71, 85, 105, 0.25)',
                                                boxShadow: isHovered ? `0 0 10px ${feat.charColor}25` : 'none'
                                            }}
                                        >
                                            <div className="flex items-center gap-2.5 min-w-0">
                                                <span className="flex-shrink-0" style={{ color: feat.charColor }}>{feat.icon}</span>
                                                <span className="truncate">{feat.title.split(' ')[0]}</span>
                                            </div>

                                            {feat.charId && (
                                                <img 
                                                    src={getAssetUrl(feat.charId, 'character')}
                                                    alt=""
                                                    className="w-8 h-8 rounded-full border border-slate-300 dark:border-slate-700 bg-slate-100/50 flex-shrink-0 shadow-sm"
                                                />
                                            )}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* 中央主選中球體的空位佔位元 (配合球體與半徑放大改為 w-80) */}
                    <div className="w-80 h-full flex-shrink-0 pointer-events-none"></div>

                    {/* 右側延伸橫幅 - padding 縮減為 pl-16 讓按鈕與世界球更緊密靠攏 */}
                    <div className="flex-1 flex justify-start items-center pl-16 relative h-full">
                        {/* 半透明玻璃背景橫條 - 寬度縮短至 450px，左側向內移至 165px */}
                        <div 
                            className="absolute left-[165px] top-1/2 -translate-y-1/2 w-[450px] h-[3px] opacity-40"
                            style={{ background: `linear-gradient(to right, ${activeSection.color}, transparent)` }}
                        />

                        {/* 修改為垂直排列 flex-col gap-4，左邊距縮小為 ml-2 */}
                        <div className="flex flex-col gap-4 relative z-10 ml-2 items-start justify-center h-full">
                            {activeSection.features.slice(2, 3).map((feat) => {
                                const isHovered = hoveredFeature === feat.id;
                                return (
                                    <div 
                                        key={feat.id} 
                                        className="relative flex items-center"
                                        onMouseEnter={() => setHoveredFeature(feat.id)}
                                        onMouseLeave={() => setHoveredFeature(null)}
                                    >
                                        {/* 按鈕本體 (尺寸擴展為 w-56 h-14，功能名稱字體升級為 text-base，右側加入角色圓形頭像) */}
                                        <button
                                            onClick={() => setCurrentView(feat.id as ViewType)}
                                            className="w-56 h-14 rounded-full bg-white/75 dark:bg-slate-900/60 hover:bg-slate-50/90 dark:hover:bg-slate-800/80 text-base font-black text-slate-800 dark:text-slate-200 border flex items-center justify-between px-4 transition-all shadow-md gap-2 whitespace-nowrap"
                                            style={{ 
                                                borderColor: isHovered ? feat.charColor : 'rgba(71, 85, 105, 0.25)',
                                                boxShadow: isHovered ? `0 0 10px ${feat.charColor}25` : 'none'
                                            }}
                                        >
                                            <div className="flex items-center gap-2.5 min-w-0">
                                                <span className="flex-shrink-0" style={{ color: feat.charColor }}>{feat.icon}</span>
                                                <span className="truncate">{feat.title.split(' ')[0]}</span>
                                            </div>

                                            {feat.charId && (
                                                <img 
                                                    src={getAssetUrl(feat.charId, 'character')}
                                                    alt=""
                                                    className="w-8 h-8 rounded-full border border-slate-300 dark:border-slate-700 bg-slate-100/50 flex-shrink-0 shadow-sm"
                                                />
                                            )}
                                        </button>

                                        {/* 鋼鐵人 HUD 右側延伸懸浮說明面板 (寬高放大至 320px * 110px，適配深淺色模式) */}
                                        <AnimatePresence>
                                            {isHovered && (
                                                <motion.div
                                                    initial={{ width: 0, opacity: 0 }}
                                                    animate={{ width: 320, opacity: 1 }}
                                                    exit={{ width: 0, opacity: 0 }}
                                                    transition={{ duration: 0.25, ease: "easeOut" }}
                                                    className="absolute left-[115%] top-1/2 -translate-y-1/2 h-[110px] bg-white/95 dark:bg-slate-950/75 border rounded-xl p-3.5 flex flex-col justify-center overflow-hidden backdrop-blur-md shadow-lg text-left"
                                                    style={{ 
                                                        borderColor: feat.charColor,
                                                        boxShadow: `0 0 15px ${feat.charColor}20`,
                                                    }}
                                                >
                                                    <span className="text-xs md:text-sm font-black uppercase tracking-widest mb-1.5" style={{ color: feat.charColor }}>
                                                        {feat.title}
                                                    </span>
                                                    <p className="text-[11px] md:text-xs text-slate-600 dark:text-slate-300 font-bold leading-relaxed line-clamp-3">
                                                        {feat.description}
                                                    </p>
                                                    {/* HUD 折角 */}
                                                    <div className="absolute top-0 left-0 w-1.5 h-1.5 border-t border-l" style={{ borderColor: feat.charColor }}></div>
                                                    <div className="absolute bottom-0 left-0 w-1.5 h-1.5 border-b border-l" style={{ borderColor: feat.charColor }}></div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                );
                            })}
                            
                            {/* 空白佔位元以保持對稱的上下高度排版 */}
                            {activeSection.features.length < 4 && (
                                <div className="w-56 h-14 pointer-events-none opacity-0"></div>
                            )}
                        </div>
                    </div>

                </div>

            </div>

            {/* 這裡改為彈性拉開中間輪播與底部的距離 */}
            <div className="flex-1"></div>

            {/* 5. 底部非官方免責聲明 (常駐顯示在正中間下方，適配深淺色模式) */}
            <div className="w-full text-center py-4 z-30 select-text">
                <p className="text-[10px] text-slate-500 dark:text-slate-500 font-bold leading-normal">
                    {UI_TEXT.common.unofficialLabel} • {UI_TEXT.common.dataBy} <a href="https://hisekai.org" target="_blank" rel="noopener noreferrer" className="text-cyan-600 hover:text-cyan-500 dark:text-cyan-500 dark:hover:text-cyan-400 transition-colors underline decoration-dotted">Hi Sekai API</a>
                </p>
            </div>

        </div>
    );
};

export default SekaiHomeView;
