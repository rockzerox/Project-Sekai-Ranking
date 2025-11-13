
import React from 'react';

interface ChartData {
  label: string;
  value: number;
}

interface LineChartProps {
  data: ChartData[];
  lineColor?: string;
  valueFormatter?: (value: number) => string;
}

const LineChart: React.FC<LineChartProps> = ({ data, lineColor = 'cyan', valueFormatter = (v) => v.toLocaleString() }) => {
  if (!data || data.length < 2) {
    return <p className="text-slate-400 text-center py-10">Not enough data to draw a line chart.</p>;
  }

  const width = 500;
  const height = 200;

  const maxValue = Math.max(...data.map(item => item.value));
  const minValue = Math.min(...data.map(item => item.value));
  const valueRange = maxValue - minValue === 0 ? 1 : maxValue - minValue;

  const points = data.map((item, index) => {
    const x = (index / (data.length - 1)) * width;
    const y = height - ((item.value - minValue) / valueRange) * height;
    return { x, y };
  });

  const pathD = points.map((point, index) => {
    if (index === 0) return `M ${point.x},${point.y}`;
    return `L ${point.x},${point.y}`;
  }).join(' ');

  return (
    <div className="bg-slate-900/70 p-4 rounded-lg flex justify-center items-center">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
        <path d={pathD} fill="none" stroke={`var(--color-${lineColor}-500, #06b6d4)`} strokeWidth="2" />
        <defs>
            <style>
                {`
                :root {
                    --color-cyan-500: #06b6d4;
                    --color-sky-500: #0ea5e9;
                    --color-sky-600: #0284c7;
                    --color-sky-700: #0369a1;
                    --color-emerald-500: #10b981;
                    --color-emerald-600: #059669;
                    --color-emerald-700: #047857;
                    --color-amber-500: #f59e0b;
                    --color-amber-600: #d97706;
                    --color-amber-700: #b45309;
                    --color-indigo-500: #6366f1;
                }
                `}
            </style>
        </defs>
        {points.map((point, index) => (
          <g key={index} className="group">
            <circle cx={point.x} cy={point.y} r="8" fill="transparent" />
            <circle cx={point.x} cy={point.y} r="3" fill={`var(--color-${lineColor}-500, #06b6d4)`} className="opacity-0 group-hover:opacity-100 transition-opacity" />
            <foreignObject x={point.x - 50} y={point.y - 40} width="100" height="30" className="opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              <div className="w-max max-w-[100px] px-2 py-1 bg-slate-700 text-white text-xs rounded">
                <p className="truncate">{data[index].label}</p>
                <p className="font-bold">{valueFormatter(data[index].value)}</p>
              </div>
            </foreignObject>
          </g>
        ))}
      </svg>
    </div>
  );
};

export default LineChart;
