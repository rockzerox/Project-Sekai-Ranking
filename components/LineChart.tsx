
import React, { useMemo, useState, useEffect } from 'react';

interface ChartData {
  label: string;
  value: number;
  rank?: number;
}

interface LineChartProps {
  data: ChartData[];
  lineColor?: string;
  valueFormatter?: (value: number) => string;
  yAxisFormatter?: (value: number) => string;
  xAxisLabel?: string;
  yAxisLabel?: string;
}

const LineChart: React.FC<LineChartProps> = ({ 
  data, 
  lineColor = 'cyan', 
  valueFormatter = (v) => v.toLocaleString(),
  yAxisFormatter,
  xAxisLabel = 'Rank',
  yAxisLabel = 'Value'
}) => {
  // Use default formatter for axis if specific one not provided
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

  // 1. Sort data by rank (or index if rank missing)
  const sortedData = useMemo(() => {
      return [...data].sort((a, b) => (a.rank || 0) - (b.rank || 0));
  }, [data]);

  // 2. Determine Range
  const maxScore = Math.max(...sortedData.map(d => d.value));
  const minScore = Math.min(...sortedData.map(d => d.value));
  // Add padding to Y axis (10% top, 5% bottom)
  const yDomainMin = Math.max(0, minScore - (maxScore - minScore) * 0.05);
  const yDomainMax = maxScore + (maxScore - minScore) * 0.1;
  const yRange = yDomainMax - yDomainMin || 1;

  const maxRank = sortedData[sortedData.length - 1].rank || sortedData.length;
  const hasHighlights = maxRank > 100;

  // 3. Hybrid Scale Logic
  // Split Ratio: Percentage of width dedicated to Top 100
  // Adjusted to 75% per user request to emphasize Top 100
  const splitRatio = 75; 

  const getXPercent = (rank: number) => {
      if (!hasHighlights) {
          // Simple Linear 0-100 for standard charts (e.g. 1H count, or if no borders fetched)
          // rank 1 -> 0%, rank 100 -> 100%
          return ((rank - 1) / (maxRank - 1)) * 100;
      }

      if (rank <= 100) {
          // Linear part (1-100 maps to 0-75%)
          return ((rank - 1) / 99) * splitRatio;
      } else {
          // Logarithmic part (100-Max maps to 75-100%)
          const logMin = Math.log(100);
          const logMax = Math.log(maxRank);
          const logVal = Math.log(rank);
          const ratio = (logVal - logMin) / (logMax - logMin);
          return splitRatio + (ratio * (100 - splitRatio));
      }
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
  const solidPoints = points.filter(p => (p.rank || 0) <= 100);
  const dashedPoints = points.filter(p => (p.rank || 0) >= 100);

  // Create SVG path d attribute
  const createPath = (pts: typeof points) => {
      if (pts.length < 2) return '';
      return pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  };

  const solidPathD = createPath(solidPoints);
  const dashedPathD = createPath(dashedPoints);

  // 6. Generate Grid Lines
  // Y-Axis Grid (5 horizontal lines)
  const yGridLines = [0, 0.25, 0.5, 0.75, 1].map(ratio => {
      const val = yDomainMin + (yRange * ratio);
      const y = 100 - (ratio * 100);
      return { y, label: axisFormatter(val) };
  });

  // X-Axis Grid
  let xGridRanks: number[] = [];
  if (hasHighlights) {
      // Linear Section: 1, 10, 20... 100
      const linearSteps = [1, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
      // Log Section: major steps
      // Filter log steps based on screen width to prevent overlap
      let logSteps = [200, 500, 1000, 2000, 5000, 10000, 20000, 50000];
      
      if (isMobile) {
          // Reduce density for mobile
          logSteps = [1000, 5000, 10000, 50000];
      }
      
      logSteps = logSteps.filter(r => r <= maxRank);
      xGridRanks = [...linearSteps, ...logSteps];
  } else {
      // Standard charts (Rank 1-100 linear)
      xGridRanks = [1, 25, 50, 75, 100];
  }
  // Filter visible within range
  xGridRanks = xGridRanks.filter(r => r <= maxRank);

  return (
    <div className="bg-slate-900/70 p-4 pb-8 rounded-lg w-full border border-slate-800">
      <div className="h-64 w-full relative">
            {/* Y-Axis Label Title */}
            <div className="absolute -top-3 left-12 text-[10px] text-cyan-400 font-bold uppercase tracking-wider">
                {yAxisLabel}
            </div>

            {/* Y-Axis Labels (Absolute positioning for layout) */}
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
                                --color-sky-500: #0ea5e9;
                                --color-emerald-500: #10b981;
                                --color-amber-500: #f59e0b;
                                --color-indigo-500: #6366f1;
                            }
                            `}
                        </style>
                    </defs>

                    {/* Grid Lines */}
                    {/* Horizontal Y */}
                    {yGridLines.map((grid, i) => (
                        <line 
                            key={`h-${i}`} 
                            x1="0" y1={grid.y} x2="100" y2={grid.y} 
                            stroke="#334155" 
                            strokeWidth="0.5" 
                            vectorEffect="non-scaling-stroke"
                        />
                    ))}

                    {/* Vertical X */}
                    {xGridRanks.map((rank, i) => {
                        const x = getXPercent(rank);
                        return (
                             <g key={`v-${i}`}>
                                <line 
                                    x1={x} y1="0" x2={x} y2="100" 
                                    stroke="#334155" 
                                    strokeWidth="0.5" 
                                    vectorEffect="non-scaling-stroke"
                                    strokeDasharray={rank === 100 && hasHighlights ? "4 4" : "none"} // Highlight split
                                />
                             </g>
                        );
                    })}

                    {/* Broken Axis Indicator at Rank 100 */}
                    {hasHighlights && (
                        <line 
                            x1={splitRatio} y1="0" x2={splitRatio} y2="100" 
                            stroke="#94a3b8" 
                            strokeWidth="1" 
                            strokeDasharray="2 2"
                            vectorEffect="non-scaling-stroke"
                            opacity="0.5"
                        />
                    )}
                    
                    {/* Paths */}
                    <path 
                        d={solidPathD} 
                        fill="none" 
                        stroke={`var(--color-${lineColor}-500, #06b6d4)`} 
                        strokeWidth="2" 
                        vectorEffect="non-scaling-stroke"
                        className="drop-shadow-sm"
                    />
                    
                    {hasHighlights && (
                        <path 
                            d={dashedPathD} 
                            fill="none" 
                            stroke={`var(--color-${lineColor}-500, #06b6d4)`} 
                            strokeWidth="2" 
                            strokeDasharray="3 3"
                            vectorEffect="non-scaling-stroke"
                            className="opacity-80"
                        />
                    )}

                    {/* Hit Areas for Tooltips (Invisible) */}
                    {points.map((point, index) => (
                         <circle 
                            key={`hit-${index}`}
                            cx={point.x} 
                            cy={point.y} 
                            r="6"
                            fill="transparent"
                            stroke="none"
                            className="cursor-pointer"
                        />
                    ))}
                </svg>
            </div>

             {/* X-Axis Labels */}
            <div className="absolute left-12 right-4 bottom-0 h-6 overflow-visible">
                 {xGridRanks.map((rank, i) => {
                     const x = getXPercent(rank);
                     
                     // Smart label filtering to prevent overlap
                     if (hasHighlights) {
                        // For Top 100 Linear section
                        if (rank > 1 && rank < 100) {
                            if (isMobile) {
                                // Mobile: Only show 1, 50, 100 in linear part
                                if (rank !== 50) return null;
                            } else {
                                // Desktop: Show 20, 40, 60, 80
                                if (rank % 20 !== 0) return null; 
                            }
                        }
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
            </div>

            {/* X-Axis Label Title */}
             <div className="absolute bottom-0 right-4 text-[10px] text-slate-400 font-bold uppercase tracking-wider transform translate-y-full mt-1">
                {xAxisLabel}
            </div>

            {/* Tooltip Overlay */}
            <div className="absolute left-12 right-4 top-0 bottom-6 pointer-events-none">
                 {points.map((point, index) => (
                     <div 
                        key={`tooltip-${index}`}
                        className="absolute w-2 h-2 -ml-1 -mt-1 rounded-full pointer-events-auto group"
                        style={{ left: `${point.x}%`, top: `${point.y}%` }}
                     >
                        {/* Invisible larger hit area for tooltip triggering */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-transparent"></div>
                        
                        {/* Tooltip Content */}
                        <div className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-[200px] px-2 py-1 bg-slate-700 text-white text-xs rounded shadow-xl z-20 border border-slate-600">
                            <p className="font-bold text-cyan-300 text-[10px] mb-0.5">Rank {point.rank}</p>
                            <p className="truncate font-medium text-slate-200 mb-0.5">{data[index].label.split(' ')[1] || data[index].label}</p>
                            <p className="font-bold text-center">{valueFormatter(data[index].value)}</p>
                            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-700"></div>
                        </div>
                     </div>
                 ))}
            </div>
      </div>
    </div>
  );
};

export default LineChart;
