
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

  return (
    <div className="bg-slate-900/70 p-4 rounded-lg">
      <div className="flex justify-around items-end h-64 space-x-1 border-b border-l border-slate-700 pb-1 pl-1">
        {data.map((item, index) => {
          const barHeight = maxValue > 0 ? (item.value / maxValue) * 100 : 0;
          return (
            <div key={index} className="flex-1 h-full flex flex-col justify-end items-center group relative pt-4">
              <div
                className={`w-full ${barColor} rounded-t-sm transition-all duration-300 ease-out hover:opacity-100 opacity-80`}
                style={{ height: `${barHeight}%` }}
                title={`${item.label}: ${valueFormatter(item.value)}`} // For accessibility
              >
                <div className="absolute bottom-full mb-2 w-max px-2 py-1 bg-slate-700 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none transform -translate-x-1/2 left-1/2 z-10">
                  {item.label}: {valueFormatter(item.value)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BarChart;
