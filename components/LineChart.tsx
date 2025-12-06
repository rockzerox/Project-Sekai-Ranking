import React, { useMemo, useState, useEffect } from 'react';

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
  safeThreshold?: number; // Green line/zone
  safeRankCutoff?: number; 
  giveUpThreshold?: number; // Red line/zone
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

  if (!data || data.length < 2) {
    return <p className="text-slate-400 text-center py-10">Not enough data to draw a line chart.</p>;
  }

  // 1. Sort data
  const sortedData = useMemo(() => {
      return [...data].sort((a, b) => (a.rank || 0) - (b.rank || 0));
  }, [data]);

  // Determine filtering status
  const hasFiltering = useMemo(() => sortedData.some(d => d.isHighlighted === false), [sortedData]);

  // 2. Determine Range
  const maxScore = Math.max(...sortedData.map(d => d.value));
  const minScore = Math.min(...sortedData.map(d => d.value));
  
  const yDomainMin = Math.max(0, minScore - (maxScore - minScore) * 0.05);
  const yDomainMax = maxScore + (maxScore - minScore) * 0.1;
  const yRange = yDomainMax - yDomainMin || 1;

  const minRank = sortedData[0].rank || 1;
  const maxRank = sortedData[sortedData.length - 1].rank || sortedData.length;
  
  // Variant Flags
  const isTrend = variant === 'trend';
  const isHighlights = variant === 'highlights';
  // If not Trend or Highlights, default to standard Linear (Live Top 100 / Past Top 100)

  // Chart Height
  const containerHeightClass = isTrend ? "h-64 md:h-[500px]" : "h-48 md:h-64"; 

  // Axis Logic
  const getXPercent = (rank: number) => {
      if (isTrend) {
          // Trend: Linear 1..EventID
          const range = maxRank - minRank;
          if (range === 0) return 50;
          return ((rank - minRank) / range) * 100;
      }

      if (isHighlights) {
          // Highlights: Split-Linear (100-1000, 1000-10000)
          // Range A: 100-1000 -> 0-50%
          // Range B: 1000-10000 -> 50-100%
          if (rank <= 1000) {
              const rMin = 100; 
              const rMax = 1000;
              let ratio = (rank - rMin) / (rMax - rMin);
              ratio = Math.max(0, Math.min(1, ratio));
              return ratio * 50;
          } else {
              const rMin = 1000;
              const rMax = 10000; // Hard cap visual at 10000
              let ratio = (rank - rMin) / (rMax - rMin);
              ratio = Math.max(0, Math.min(1, ratio));
              return 50 + (ratio * 50);
          }
      }

      // Default (Live Top 100 / Past): Standard Linear 1-100
      const range = maxRank - minRank;
      if (range === 0) return 50;
      return ((rank - minRank) / range) * 100;
  };

  const getYPercent = (score: number) => {
      return 100 - ((score - yDomainMin) / yRange) * 100;
  };

  // 4. Generate Points
  const points = sortedData.map(d => ({
      x: getXPercent(d.rank || 0),
      y: getYPercent(d.value),
      ...d
  }));

  // 5. Generate Paths
  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  // 6. Generate Grid Lines
  const yGridLines = [0, 0.25, 0.5, 0.75, 1].map(ratio => {
      const val = yDomainMin + (yRange * ratio);
      const y = 100 - (ratio * 100);
      return { y, label: axisFormatter(val) };
  });

  // X-Axis Grid
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
      if (isMobile) {
          xGridRanks = [100, 500, 1000, 5000, 10000];
      }
  } else {
      xGridRanks = [1, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
  }
  
  xGridRanks = xGridRanks.filter(r => r <= maxRank && r >= minRank);
  xGridRanks = Array.from(new Set(xGridRanks)).sort((a, b) => a - b);

  return (
    <div className="bg-slate-900/70 p-4 pb-12 rounded-lg w-full border border-slate-800">
      <div className={`${containerHeightClass} w-full relative transition-all duration-300`}>
            <div className="absolute -top-3 left-12 text-[10px] text-cyan-400 font-bold uppercase tracking-wider">
                {yAxisLabel}
            </div>

            <div className="absolute left-0 top-0 bottom-0 w-12 flex flex-col justify-between text-[10px] text-slate-500 font-mono py-2 pointer-events-none">
                 {yGridLines.slice().reverse().map((grid, i) => (
                     <span key={i} className="truncate text-right pr-2 -mt-2">{grid.label}</span>
                 ))}
            </div>

            <div className="absolute left-12 right-4 top-0 bottom-6">
                <svg 
                    viewBox="0 0 100 100" 
                    className="w-full h-full overflow-visible" 
                    preserveAspectRatio="none"
                >
                     <defs>
                        <style>
                            {`
                            :root {
                                --color-cyan-500: #06b6d4;
                            }
                            `}
                        </style>
                        <pattern id="safeZonePattern" patternUnits="userSpaceOnUse" width="10" height="10" patternTransform="rotate(45)">
                            <line x1="0" y1="0" x2="0" y2="10" stroke="#10b981" strokeWidth="2" opacity="0.15" />
                        </pattern>
                        <pattern id="giveUpZonePattern" patternUnits="userSpaceOnUse" width="10" height="10" patternTransform="rotate(-45)">
                            <line x1="0" y1="0" x2="0" y2="10" stroke="#f43f5e" strokeWidth="2" opacity="0.15" />
                        </pattern>
                    </defs>

                    {/* Safe Zone Shading */}
                    {safeThreshold !== undefined && safeRankCutoff !== undefined && (
                        <rect
                            x="0"
                            y="0"
                            width={getXPercent(safeRankCutoff)}
                            height={100}
                            fill="url(#safeZonePattern)"
                            className="transition-all duration-500"
                        />
                    )}

                    {/* Give Up Zone Shading */}
                    {giveUpThreshold !== undefined && giveUpRankCutoff !== undefined && (
                        <rect
                            x={getXPercent(giveUpRankCutoff)}
                            y="0"
                            width={100 - getXPercent(giveUpRankCutoff)}
                            height={100}
                            fill="url(#giveUpZonePattern)"
                            className="transition-all duration-500"
                        />
                    )}

                    {/* Y Grid Lines */}
                    {yGridLines.map((grid, i) => (
                        <line 
                            key={`h-${i}`} 
                            x1="0" y1={grid.y} x2="100" y2={grid.y} 
                            stroke="#334155" 
                            strokeWidth="0.5" 
                            vectorEffect="non-scaling-stroke"
                            strokeOpacity="0.2"
                        />
                    ))}

                    {/* X Grid Lines */}
                    {xGridRanks.map((rank, i) => {
                        const x = getXPercent(rank);
                        return (
                             <g key={`v-${i}`}>
                                <line 
                                    x1={x} y1="0" x2={x} y2="100" 
                                    stroke="#334155" 
                                    strokeWidth="0.5" 
                                    vectorEffect="non-scaling-stroke"
                                    strokeOpacity="0.2"
                                />
                             </g>
                        );
                    })}

                    {/* Split Axis Divider for Highlights */}
                    {isHighlights && (
                        <line 
                            x1="50" y1="0" x2="50" y2="100" 
                            stroke="#94a3b8" 
                            strokeWidth="1" 
                            strokeDasharray="4 4"
                            vectorEffect="non-scaling-stroke"
                            opacity="0.5"
                        />
                    )}
                    
                    {/* Path */}
                    <path 
                        d={pathD} 
                        fill="none" 
                        stroke={hasFiltering ? "#94a3b8" : `var(--color-${lineColor}-500, #06b6d4)`} 
                        strokeWidth={isTrend ? 1.5 : 2} 
                        vectorEffect="non-scaling-stroke"
                        strokeOpacity={hasFiltering ? 0.4 : 1}
                        className="drop-shadow-sm transition-all duration-300"
                        strokeDasharray={isHighlights ? "4 4" : "none"} // Dash for highlights
                    />

                    {/* Mean Line */}
                    {meanValue !== undefined && (
                        <g>
                            <line 
                                x1="0" y1={getYPercent(meanValue)} x2="100" y2={getYPercent(meanValue)} 
                                stroke="#a855f7" 
                                strokeWidth="1.5" 
                                strokeDasharray="5 3"
                                vectorEffect="non-scaling-stroke"
                            />
                        </g>
                    )}

                    {/* Median Line */}
                    {medianValue !== undefined && (
                        <g>
                            <line 
                                x1="0" y1={getYPercent(medianValue)} x2="100" y2={getYPercent(medianValue)} 
                                stroke="#f59e0b" 
                                strokeWidth="1.5" 
                                strokeDasharray="3 2"
                                vectorEffect="non-scaling-stroke"
                            />
                        </g>
                    )}

                    {/* Safety Line */}
                    {safeThreshold !== undefined && (
                        <g>
                            <line 
                                x1="0" y1={getYPercent(safeThreshold)} x2="100" y2={getYPercent(safeThreshold)} 
                                stroke="#10b981" 
                                strokeWidth="1" 
                                strokeDasharray="4 2" 
                                strokeOpacity="0.7"
                                vectorEffect="non-scaling-stroke"
                            />
                        </g>
                    )}

                    {/* Give Up Line */}
                    {giveUpThreshold !== undefined && (
                        <g>
                            <line 
                                x1="0" y1={getYPercent(giveUpThreshold)} x2="100" y2={getYPercent(giveUpThreshold)} 
                                stroke="#f43f5e" 
                                strokeWidth="1" 
                                strokeDasharray="4 2" 
                                strokeOpacity="0.7"
                                vectorEffect="non-scaling-stroke"
                            />
                        </g>
                    )}

                </svg>

                {/* SCATTER POINTS */}
                {hasFiltering && points.map((point, index) => {
                    if (!point.isHighlighted) return null;
                    return (
                        <div 
                            key={`dot-${index}`}
                            className="absolute w-1.5 h-1.5 rounded-full -ml-[3px] -mt-[3px] shadow-sm pointer-events-none z-10 border border-white/20"
                            style={{ 
                                left: `${point.x}%`, 
                                top: `${point.y}%`,
                                backgroundColor: point.pointColor || "#06b6d4"
                            }}
                        />
                    );
                })}

                {/* HIT AREAS */}
                {points.map((point, index) => (
                     <div 
                        key={`hit-${index}`}
                        className="absolute w-3 h-3 -ml-[6px] -mt-[6px] rounded-full cursor-pointer z-20 hover:bg-white/10 group"
                        style={{ left: `${point.x}%`, top: `${point.y}%` }}
                     >
                        <div className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-[200px] px-2 py-1 bg-slate-700 text-white text-xs rounded shadow-xl z-30 border border-slate-600 pointer-events-none">
                            <p className="font-bold text-cyan-300 text-[10px] mb-0.5">
                                {isTrend ? `第 ${point.rank} 期` : `Rank ${point.rank}`}
                            </p>
                            <p className="truncate font-medium text-slate-200 mb-0.5">{data[index].label}</p>
                            <p className="font-bold text-center">{valueFormatter(data[index].value)}</p>
                            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-700"></div>
                        </div>
                     </div>
                ))}
            </div>

             {/* X-Axis Labels */}
            <div className="absolute left-12 right-4 bottom-0 h-6 overflow-visible">
                 {xGridRanks.map((rank, i) => {
                     const x = getXPercent(rank);
                     
                     // Optimization for mobile labels
                     if (isMobile && isHighlights) {
                         if (![100, 1000, 10000, 50000].includes(rank)) return null;
                     }

                     return (
                        <div 
                            key={`xl-${i}`}
                            className="absolute top-1 transform -translate-x-1/2 text-[10px] text-slate-500 font-mono"
                            style={{ left: `${x}%` }}
                        >
                            {rank >= 1000 ? `${rank/1000}k` : rank}
                        </div>
                     );
                 })}
                 
                 {/* Year Labels */}
                 {isTrend && yearTicks.map((tick, i) => (
                     <div 
                        key={`year-${i}`}
                        className="absolute top-5 transform -translate-x-1/2 text-[10px] text-slate-400 font-bold border-l border-slate-700 pl-1"
                        style={{ left: `${tick.x}%` }}
                     >
                         {tick.year}
                     </div>
                 ))}
            </div>

             <div className="absolute bottom-0 right-4 text-[10px] text-slate-400 font-bold uppercase tracking-wider transform translate-y-full mt-1">
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

export default LineChart;