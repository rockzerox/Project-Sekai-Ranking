import React, { useMemo, useState, useEffect } from 'react';
import { getAssetUrl } from '../constants';

interface ChartData {
  label: string;
  value: number;
  rank?: number;
  isHighlighted?: boolean;
  pointColor?: string;
  year?: number;
}

type ChartVariant = 'live' | 'trend' | 'highlights' | 'default';

interface LineChartProps {
  data: ChartData[];
  variant?: ChartVariant;
  lineColor?: string;
  valueFormatter?: (value: number) => string;
  yAxisFormatter?: (value: number) => string;
  xAxisLabel?: string;
  yAxisLabel?: string;
  meanValue?: number;
  medianValue?: number;
  safeThreshold?: number; 
  safeRankCutoff?: number; 
  giveUpThreshold?: number; 
  giveUpRankCutoff?: number; 
}

const LineChart: React.FC<LineChartProps> = ({ 
  data, 
  variant = 'default',
  lineColor = 'cyan', 
  valueFormatter = (v) => v.toLocaleString(),
  yAxisFormatter,
  xAxisLabel = 'Rank',
  yAxisLabel = 'Value',
  meanValue,
  medianValue,
  safeThreshold,
  safeRankCutoff,
  giveUpThreshold,
  giveUpRankCutoff
}) => {
  const axisFormatter = yAxisFormatter || valueFormatter;
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const sortedData = useMemo(() => {
      if (variant === 'highlights') {
          return [...data]
              .filter(d => (d.rank || 0) <= 10000 && d.value > 0)
              .sort((a, b) => (a.rank || 0) - (b.rank || 0));
      }
      return [...data].sort((a, b) => (a.rank || 0) - (b.rank || 0));
  }, [data, variant]);

  if (!sortedData || sortedData.length < 2) {
    return <p className="text-slate-400 text-center py-10">Not enough data to draw a chart.</p>;
  }

  const hasFiltering = useMemo(() => sortedData.some(d => d.isHighlighted === false), [sortedData]);

  const maxScore = Math.max(...sortedData.map(d => d.value));
  const minScore = Math.min(...sortedData.map(d => d.value));
  
  const yDomainMin = Math.max(0, minScore - (maxScore - minScore) * 0.05);
  const yDomainMax = maxScore + (maxScore - minScore) * 0.1;
  const yRange = yDomainMax - yDomainMin || 1;

  // 判斷線條是否在顯示範圍內
  const isSafeLineVisible = safeThreshold !== undefined && safeThreshold >= yDomainMin && safeThreshold <= yDomainMax;
  const isGiveUpLineVisible = giveUpThreshold !== undefined && giveUpThreshold >= yDomainMin && giveUpThreshold <= yDomainMax;

  const minRank = sortedData[0].rank || 1;
  const maxRank = sortedData[sortedData.length - 1].rank || sortedData.length;
  
  const isTrend = variant === 'trend';
  const isHighlights = variant === 'highlights';

  const containerHeightClass = isTrend ? "h-64 md:h-[500px]" : "h-48 md:h-64"; 

  const getXPercent = (rank: number) => {
      if (isTrend) {
          const range = maxRank - minRank;
          if (range === 0) return 50;
          return ((rank - minRank) / range) * 100;
      }

      if (isHighlights) {
          if (rank <= 1000) {
              const rMin = 100; 
              const rMax = 1000;
              let ratio = (rank - rMin) / (rMax - rMin);
              ratio = Math.max(0, Math.min(1, ratio));
              return ratio * 50;
          } else {
              const rMin = 1000;
              const rMax = 10000; 
              let ratio = (rank - rMin) / (rMax - rMin);
              ratio = Math.max(0, Math.min(1, ratio));
              return 50 + (ratio * 50);
          }
      }

      const range = maxRank - minRank;
      if (range === 0) return 50;
      return ((rank - minRank) / range) * 100;
  };

  const getYPercent = (score: number) => {
      return 100 - ((score - yDomainMin) / yRange) * 100;
  };

  const points = sortedData.map(d => ({
      x: getXPercent(d.rank || 0),
      y: getYPercent(d.value),
      ...d
  }));

  const pathD = useMemo(() => {
      if (isHighlights) {
          let path = "";
          for (let i = 0; i < sortedData.length - 1; i++) {
              const p1 = sortedData[i];
              const p2 = sortedData[i+1];
              if (i === 0) path += `M ${getXPercent(p1.rank!)} ${getYPercent(p1.value)}`;
              const steps = 30; 
              for (let j = 1; j <= steps; j++) {
                  const t_linear = j / steps; 
                  const t_curved = (1 - Math.cos(t_linear * Math.PI)) / 2;
                  const currentRank = p1.rank! + (p2.rank! - p1.rank!) * t_linear;
                  let interpolatedScore;
                  if (p1.value <= 0 || p2.value <= 0) {
                       interpolatedScore = p1.value + (p2.value - p1.value) * t_curved;
                  } else {
                       const lnY1 = Math.log(p1.value);
                       const lnY2 = Math.log(p2.value);
                       const lnY = lnY1 + (lnY2 - lnY1) * t_curved;
                       interpolatedScore = Math.exp(lnY);
                  }
                  path += ` L ${getXPercent(currentRank)} ${getYPercent(interpolatedScore)}`;
              }
          }
          return path;
      } else {
          return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
      }
  }, [sortedData, isHighlights, points]);

  const yGridLines = [0, 0.25, 0.5, 0.75, 1].map(ratio => {
      const val = yDomainMin + (yRange * ratio);
      const y = 100 - (ratio * 100);
      return { y, label: axisFormatter(val) };
  });

  let xGridRanks: number[] = [];
  let yearTicks: { x: number, year: number }[] = [];
  
  if (isTrend) {
      for (let i = minRank; i <= maxRank; i++) {
          if (i % 9 === 0) xGridRanks.push(i);
      }
      let lastYear = -1;
      sortedData.forEach(d => {
          if (d.year && d.year !== lastYear) {
              yearTicks.push({ x: getXPercent(d.rank || 0), year: d.year });
              lastYear = d.year;
          }
      });
  } else if (isHighlights) {
      xGridRanks = [100, 200, 300, 400, 500, 1000, 2000, 3000, 4000, 5000, 6000, 7000, 8000, 9000, 10000];
      if (isMobile) xGridRanks = [100, 500, 1000, 5000, 10000];
  } else {
      xGridRanks = [1, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
  }
  
  xGridRanks = xGridRanks.filter(r => r <= maxRank && r >= minRank);
  xGridRanks = Array.from(new Set(xGridRanks)).sort((a, b) => a - b);

  return (
    <div className="bg-slate-900/70 p-4 pb-12 rounded-lg w-full border border-slate-800">
      <div className={`${containerHeightClass} w-full relative transition-all duration-300`}>
            <div className="absolute -top-3 left-12 md:left-16 text-[10px] md:text-sm text-cyan-400 font-bold uppercase tracking-wider">
                {yAxisLabel}
            </div>

            <div className="absolute left-0 top-0 bottom-0 w-12 md:w-16 flex flex-col justify-between text-[10px] md:text-xs text-slate-500 font-mono py-2 pointer-events-none">
                 {yGridLines.slice().reverse().map((grid, i) => (
                     <span key={i} className="truncate text-right pr-2 -mt-2">{grid.label}</span>
                 ))}
            </div>

            <div className="absolute left-12 md:left-16 right-4 top-0 bottom-6">
                <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible" preserveAspectRatio="none">
                     <defs>
                        <style>{`:root { --color-cyan-500: #06b6d4; }`}</style>
                    </defs>

                    {/* 安全區渲染 */}
                    {isSafeLineVisible && safeThreshold !== undefined && safeRankCutoff !== undefined && (
                        <rect x="0" y="0" width={getXPercent(safeRankCutoff)} height={100} fill="rgba(16, 185, 129, 0.2)" className="transition-all duration-500" />
                    )}

                    {/* 死心區渲染 - 修改點：增加 isGiveUpLineVisible 判斷 */}
                    {isGiveUpLineVisible && giveUpThreshold !== undefined && giveUpRankCutoff !== undefined && (
                        <rect x={getXPercent(giveUpRankCutoff)} y="0" width={100 - getXPercent(giveUpRankCutoff)} height={100} fill="rgba(244, 63, 94, 0.2)" className="transition-all duration-500" />
                    )}

                    {yGridLines.map((grid, i) => (
                        <line key={`h-${i}`} x1="0" y1={grid.y} x2="100" y2={grid.y} stroke="#475569" strokeWidth="0.5" vectorEffect="non-scaling-stroke" strokeOpacity="0.6" />
                    ))}

                    {isHighlights && (
                        <line x1="50" y1="0" x2="50" y2="100" stroke="#94a3b8" strokeWidth="1" strokeDasharray="4 4" vectorEffect="non-scaling-stroke" opacity="0.5" />
                    )}
                    
                    <path d={pathD} fill="none" stroke={hasFiltering ? "#94a3b8" : `var(--color-${lineColor}-500, #06b6d4)`} strokeWidth={isTrend ? 1.5 : 2} vectorEffect="non-scaling-stroke" strokeOpacity={hasFiltering ? 0.4 : 1} className="drop-shadow-sm transition-all duration-300" strokeDasharray="none" />

                    {meanValue !== undefined && (
                        <line x1="0" y1={getYPercent(meanValue)} x2="100" y2={getYPercent(meanValue)} stroke="#a855f7" strokeWidth="1.5" strokeDasharray="5 3" vectorEffect="non-scaling-stroke" />
                    )}

                    {medianValue !== undefined && (
                        <line x1="0" y1={getYPercent(medianValue)} x2="100" y2={getYPercent(medianValue)} stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="3 2" vectorEffect="non-scaling-stroke" />
                    )}

                    {/* 安全線顯示 */}
                    {isSafeLineVisible && safeThreshold !== undefined && (
                        <line x1="0" y1={getYPercent(safeThreshold)} x2="100" y2={getYPercent(safeThreshold)} stroke="#10b981" strokeWidth="1" strokeDasharray="4 2" strokeOpacity="0.7" vectorEffect="non-scaling-stroke" />
                    )}

                    {/* 死心線顯示 - 修改點：增加 isGiveUpLineVisible 判斷 */}
                    {isGiveUpLineVisible && giveUpThreshold !== undefined && (
                        <line x1="0" y1={getYPercent(giveUpThreshold)} x2="100" y2={getYPercent(giveUpThreshold)} stroke="#f43f5e" strokeWidth="1" strokeDasharray="4 2" strokeOpacity="0.7" vectorEffect="non-scaling-stroke" />
                    )}
                </svg>

                {hasFiltering && points.map((point, index) => {
                    if (!point.isHighlighted) return null;
                    return (
                        <div key={`dot-${index}`} className="absolute w-1.5 h-1.5 rounded-full -ml-[3px] -mt-[3px] shadow-sm pointer-events-none z-10 border border-white/20" style={{ left: `${point.x}%`, top: `${point.y}%`, backgroundColor: point.pointColor || "#06b6d4" }} />
                    );
                })}

                {points.map((point, index) => {
                    const eventLogoUrl = isTrend ? getAssetUrl(point.rank?.toString(), 'event') : undefined;
                    
                    let tooltipLeft = "50%";
                    let tooltipTranslate = "-50%";
                    let arrowLeft = "50%";

                    if (point.x > 70) {
                        tooltipLeft = "calc(100% - 12px)";
                        tooltipTranslate = "-100%";
                        arrowLeft = "90%";
                    } else if (point.x < 20) {
                        tooltipLeft = "0%";
                        tooltipTranslate = "0%";
                        arrowLeft = "10%";
                    }

                    return (
                        <div key={`hit-${index}`} className="absolute w-4 h-4 -ml-[8px] -mt-[8px] rounded-full cursor-pointer z-20 hover:bg-white/10 group" style={{ left: `${point.x}%`, top: `${point.y}%` }}>
                            <div 
                                className={`hidden group-hover:flex absolute bottom-full mb-3 ${isMobile ? 'w-[210px]' : 'w-64'} bg-slate-900/95 text-white p-3 rounded-xl shadow-2xl z-50 border border-slate-700 pointer-events-none backdrop-blur-md animate-fadeIn flex-col gap-2`}
                                style={{ left: tooltipLeft, transform: `translateX(${tooltipTranslate})` }}
                            >
                                <div className="flex justify-between items-center border-b border-slate-700/50 pb-2 mb-1">
                                    <span className="text-xs font-mono text-cyan-400 font-black">
                                        {isTrend ? `第 ${point.rank} 期` : `Rank ${point.rank}`}
                                    </span>
                                </div>
                                
                                {eventLogoUrl && (
                                    <div className="w-full bg-white/5 rounded-lg p-1.5 flex justify-center">
                                        <img src={eventLogoUrl} alt="logo" className="h-14 w-auto object-contain" onError={(e) => e.currentTarget.style.display = 'none'} />
                                    </div>
                                )}

                                <div className="font-black text-sm leading-tight text-center" style={{ color: point.pointColor || 'inherit' }}>
                                    {point.label}
                                </div>
                                
                                <div className="flex flex-col gap-1 mt-1 bg-black/30 p-2 rounded-lg border border-white/5">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">分數 (Score)</span>
                                        <span className="text-sm font-mono font-black text-white">
                                            {valueFormatter(point.value)}
                                        </span>
                                    </div>
                                </div>
                                <div className="absolute top-full border-[6px] border-transparent border-t-slate-900/95 -translate-x-1/2" style={{ left: arrowLeft }}></div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="absolute left-12 md:left-16 right-4 bottom-0 h-6 overflow-visible">
                 {xGridRanks.map((rank, i) => {
                     const x = getXPercent(rank);
                     if (isMobile && isHighlights && ![100, 1000, 10000].includes(rank)) return null;
                     return (
                        <div key={`xl-${i}`} className="absolute top-1 transform -translate-x-1/2 text-[10px] md:text-xs text-slate-500 font-mono" style={{ left: `${x}%` }}>
                            {rank >= 1000 ? `${rank/1000}k` : rank}
                        </div>
                     );
                 })}
                 
                 {isTrend && yearTicks.map((tick, i) => (
                     <div key={`year-${i}`} className="absolute top-5 transform -translate-x-1/2 text-[10px] md:text-xs text-slate-400 font-bold border-l border-slate-700 pl-1" style={{ left: `${tick.x}%` }}>
                         {tick.year}
                     </div>
                 ))}
            </div>

             <div className="absolute bottom-0 right-4 text-[10px] md:text-sm text-slate-400 font-bold uppercase tracking-wider transform translate-y-full mt-1">
                {xAxisLabel}
            </div>
      </div>
      
      {isMobile && (
          <div className="mt-4 p-2 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs text-center rounded border border-amber-200 dark:border-amber-800">
              建議橫向觀看以獲得最佳體驗 (Landscape mode recommended)
          </div>
      )}
    </div>
  );
};

export default React.memo(LineChart);