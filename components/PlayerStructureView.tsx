import React, { useState, useEffect, useMemo } from 'react';
import { CHARACTER_MASTER, UNIT_MASTER, getAssetUrl } from '../constants';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';

interface UKPoint {
    k: number;
    u: number;
}

interface StructureData {
    name?: string;
    charId?: string;
    eventCount: number;
    data: number[];
    updatedAt: string;
}

const PlayerStructureView: React.FC = () => {
    const [filter, setFilter] = useState<{ type: 'global' | 'unit' | 'char', id: string }>({ type: 'global', id: '' });
    const [data, setData] = useState<StructureData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [hoveredPoint, setHoveredPoint] = useState<UKPoint | null>(null);

    const SUPPORTED_UNITS = ["Leo/need", "MORE MORE JUMP!", "Vivid BAD SQUAD", "Wonderlands × Showtime", "25點，Nightcord見。"];

    const themeColor = useMemo(() => {
        if (filter.type === 'unit') return UNIT_MASTER[filter.id]?.color || '#06b6d4';
        if (filter.type === 'char') return CHARACTER_MASTER[filter.id]?.color || '#06b6d4';
        return '#06b6d4'; 
    }, [filter]);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const url = `/api/structure-data?type=${filter.type}${filter.id ? `&id=${encodeURIComponent(filter.id)}` : ''}`;
                const res = await fetch(url);
                if (!res.ok) throw new Error('無法取得該分類的結構數據');
                const json = await res.json();
                setData(json);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [filter]);

    const chartContent = useMemo(() => {
        if (!data || !data.data || data.data.length === 0) return null;
        const points = data.data;
        const width = 1000;
        const height = 320; // 壓縮高度，原本 400
        const padding = { top: 20, right: 30, bottom: 40, left: 50 };

        const getX = (k: number) => padding.left + ((k - 1) / 99) * (width - padding.left - padding.right);
        const getY = (u: number) => padding.top + (1 - u / 100) * (height - padding.top - padding.bottom);

        const pathD = points.map((u, i) => `${i === 0 ? 'M' : 'L'} ${getX(i + 1)} ${getY(u)}`).join(' ');
        const areaD = `${pathD} L ${getX(100)} ${getY(0)} L ${getX(1)} ${getY(0)} Z`;

        return { getX, getY, pathD, areaD, width, height, padding };
    }, [data]);

    const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
        if (!chartContent || !data) return;
        const svg = e.currentTarget;
        const rect = svg.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * chartContent.width;
        const k = Math.round(((x - chartContent.padding.left) / (chartContent.width - chartContent.padding.left - chartContent.padding.right)) * 99) + 1;
        const clampedK = Math.max(1, Math.min(100, k));
        const u = data.data[clampedK - 1];
        if (u !== undefined) setHoveredPoint({ k: clampedK, u });
    };

    const currentTitle = filter.type === 'global' ? '整體遊戲' : (filter.type === 'unit' ? filter.id : CHARACTER_MASTER[filter.id]?.name);

    return (
        <div className="w-full animate-fadeIn pb-4 max-w-[1400px] mx-auto">
            <div className="mb-4">
                <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-1 tracking-tight">玩家排名結構 (Player Structure)</h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm font-bold">分析排名競爭的「不重複率」，量化各名次區間的階級固化與流動情形。</p>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-3 mb-4 shadow-sm">
                <div className="flex flex-wrap gap-4 items-center">
                    <button 
                        onClick={() => setFilter({ type: 'global', id: '' })}
                        className={`px-6 py-1.5 rounded-xl font-black text-sm transition-all border ${filter.type === 'global' ? 'bg-slate-900 text-white border-transparent shadow-lg' : 'bg-transparent text-slate-500 border-slate-200 dark:border-slate-700 hover:border-slate-400'}`}
                    >
                        All
                    </button>

                    <div className="h-8 w-px bg-slate-200 dark:bg-slate-700"></div>

                    <div className="flex gap-2">
                        {SUPPORTED_UNITS.map(unit => (
                            <button 
                                key={unit}
                                onClick={() => setFilter({ type: 'unit', id: unit })}
                                className={`p-1 rounded-xl border-2 transition-all ${filter.type === 'unit' && filter.id === unit ? 'scale-110 shadow-md bg-slate-50 dark:bg-slate-700' : 'opacity-40 grayscale hover:opacity-100 hover:grayscale-0'}`}
                                style={{ borderColor: filter.type === 'unit' && filter.id === unit ? UNIT_MASTER[unit].color : 'transparent' }}
                            >
                                <img src={getAssetUrl(unit, 'unit')} alt={unit} className="w-8 h-8 object-contain" />
                            </button>
                        ))}
                    </div>

                    <div className="h-8 w-px bg-slate-200 dark:bg-slate-700"></div>

                    <div className="flex flex-wrap gap-1 flex-1">
                        {Object.values(CHARACTER_MASTER).slice(0, 20).map(char => (
                            <button 
                                key={char.id}
                                onClick={() => setFilter({ type: 'char', id: char.id })}
                                className={`w-7 h-7 rounded-full border-2 transition-all relative overflow-hidden ${filter.type === 'char' && filter.id === char.id ? 'scale-110 z-10 shadow-lg ring-1 ring-offset-1 dark:ring-offset-slate-900' : 'opacity-30 grayscale hover:opacity-100 hover:grayscale-0'}`}
                                style={{ borderColor: filter.type === 'char' && filter.id === char.id ? char.color : 'transparent' }}
                            >
                                <img src={getAssetUrl(char.id, 'character')} alt={char.name} className="w-full h-full object-cover" />
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xl overflow-hidden relative mb-4">
                {isLoading && (
                    <div className="absolute inset-0 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm z-20 flex items-center justify-center">
                        <LoadingSpinner />
                    </div>
                )}

                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                    <div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">名次流動曲線</span>
                        <h3 className="text-xl font-black flex items-center gap-2" style={{ color: themeColor }}>
                            {currentTitle}
                            <span className="text-sm font-bold text-slate-400">前 K 名不重複率 U(K)</span>
                        </h3>
                    </div>
                    <div className="text-right">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">統計活動期數</span>
                        <span className="text-lg font-black font-mono" style={{ color: themeColor }}>
                            {data?.eventCount || 0} <span className="text-xs font-bold text-slate-400">期</span>
                        </span>
                    </div>
                </div>

                <div className="p-4 sm:px-10 sm:py-6 relative group min-h-[250px]">
                    {chartContent && data && (
                        <svg 
                            viewBox={`0 0 ${chartContent.width} ${chartContent.height}`} 
                            className="w-full h-auto overflow-visible select-none"
                            onMouseMove={handleMouseMove}
                            onMouseLeave={() => setHoveredPoint(null)}
                        >
                            {[0, 25, 50, 75, 100].map(val => (
                                <g key={val}>
                                    <line x1={chartContent.padding.left} y1={chartContent.getY(val)} x2={chartContent.width - chartContent.padding.right} y2={chartContent.getY(val)} stroke="currentColor" className="text-slate-100 dark:text-slate-800" strokeWidth="1" />
                                    <text x={chartContent.padding.left - 10} y={chartContent.getY(val)} className="text-[14px] fill-slate-400 font-mono font-bold" textAnchor="end" alignmentBaseline="middle">{val}%</text>
                                </g>
                            ))}
                            {[1, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map(k => (
                                <text key={k} x={chartContent.getX(k)} y={chartContent.height - 10} className="text-[14px] fill-slate-400 font-mono font-bold" textAnchor="middle">{k}</text>
                            ))}
                            <text x={chartContent.width / 2 + 20} y={chartContent.height + 5} className="text-[12px] fill-slate-300 font-black uppercase tracking-widest" textAnchor="middle">名次範圍 (Rank K)</text>

                            <path d={chartContent.areaD} fill={themeColor} fillOpacity="0.05" className="transition-all duration-700" />
                            <path d={chartContent.pathD} fill="none" stroke={themeColor} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="transition-all duration-700 drop-shadow-lg" />

                            {hoveredPoint && (
                                <g className="animate-fadeIn">
                                    <line x1={chartContent.getX(hoveredPoint.k)} y1={chartContent.padding.top} x2={chartContent.getX(hoveredPoint.k)} y2={chartContent.height - chartContent.padding.bottom} stroke={themeColor} strokeWidth="1" strokeDasharray="4 4" />
                                    <circle cx={chartContent.getX(hoveredPoint.k)} cy={chartContent.getY(hoveredPoint.u)} r="6" fill={themeColor} stroke="white" strokeWidth="2" />
                                    <rect x={chartContent.getX(hoveredPoint.k) - 45} y={chartContent.getY(hoveredPoint.u) - 50} width="90" height="40" rx="8" fill="#1e293b" />
                                    <text x={chartContent.getX(hoveredPoint.k)} y={chartContent.getY(hoveredPoint.u) - 25} textAnchor="middle" className="fill-white font-mono font-black text-[16px]">{hoveredPoint.u}%</text>
                                </g>
                            )}
                        </svg>
                    )}
                    {!isLoading && error && <div className="py-10 text-center"><ErrorMessage message={error} /></div>}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-100 dark:bg-slate-800/40 rounded-2xl p-4 border border-slate-200 dark:border-slate-700">
                    <h4 className="text-md font-black text-slate-800 dark:text-white mb-2 flex items-center gap-2">
                        <svg className="w-4 h-4 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        指標判讀說明
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-bold">
                        U(K) 數值越高，代表參與該名次區間的玩家重疊度越低，反映較強的流動性與競爭廣度；若數值趨近於 0%，則代表該名次長期被特定小眾玩家佔據，階級固化嚴重。
                    </p>
                </div>
                <div className="bg-slate-100 dark:bg-slate-800/40 rounded-2xl p-4 border border-slate-200 dark:border-slate-700">
                   <h4 className="text-md font-black text-slate-800 dark:text-white mb-2">統計公式與更新</h4>
                   <div className="bg-white dark:bg-slate-900/60 p-2 rounded-xl border border-slate-200 dark:border-slate-800 mb-2">
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-200 font-mono">U(K) = (前 K 名不重複玩家數 / (活動數 × K)) × 100%</p>
                    </div>
                   <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                       數據更新於：{data ? new Date(data.updatedAt).toLocaleString() : 'N/A'}
                   </p>
                </div>
            </div>
        </div>
    );
};

export default PlayerStructureView;