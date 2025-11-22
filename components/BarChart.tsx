
import React from 'react';

interface ChartData {
  label: string;
  value: number;
}

interface BarChartProps {
  data: ChartData[];
  barColor?: string;
  valueFormatter?: (value: number) => string;
}

const BarChart: React.FC<BarChartProps> = ({ data, barColor = 'bg-cyan-500', valueFormatter = (v) => v.toLocaleString() }) => {
  if (!data || data.length === 0) {
    return <p className="text-slate-400 text-center py-10">No data available for this chart.</p>;
  }

  const maxValue = Math.max(...data.map(item => item.value), 0);
  // Determine minimum width to ensure bars are readable on mobile
  // Approx 25px per bar, minimum 100% width
  const minContainerWidth = Math.max(100, data.length * 24);

  return (
    <div className="bg-slate-900/70 p-4 rounded-lg w-full overflow-hidden">
      <div className="h-64 w-full overflow-x-auto custom-scrollbar">
        <div 
            className="flex justify-around items-end h-full space-x-1 border-b border-l border-slate-700 pb-1 pl-1"
            style={{ minWidth: `${minContainerWidth}px` }}
        >
            {data.map((item, index) => {
            const barHeight = maxValue > 0 ? (item.value / maxValue) * 100 : 0;
            return (
                <div key={index} className="flex-1 h-full flex flex-col justify-end items-center group relative pt-4">
                <div
                    className={`w-full ${barColor} rounded-t-sm transition-all duration-300 ease-out hover:opacity-100 opacity-80 relative`}
                    style={{ height: `${barHeight}%` }}
                    title={`${item.label}: ${valueFormatter(item.value)}`}
                >
                    {/* Tooltip */}
                    <div className="absolute bottom-full mb-2 w-max max-w-[150px] px-2 py-1 bg-slate-700 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none transform -translate-x-1/2 left-1/2 z-20 shadow-xl break-words whitespace-normal text-center">
                         <span className="block font-semibold mb-0.5">{item.label}</span>
                         {valueFormatter(item.value)}
                         <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-700"></div>
                    </div>
                </div>
                </div>
            );
            })}
        </div>
      </div>
    </div>
  );
};

export default BarChart;
