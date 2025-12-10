
import React from 'react';
import CrownIcon from '../icons/CrownIcon';

export interface ColumnDefinition {
  header: string;
  className?: string;
}

interface DashboardTableProps<T> {
  title: React.ReactNode;
  headerAction?: React.ReactNode;
  color?: string; // e.g., 'bg-yellow-500'
  columns: ColumnDefinition[];
  data: T[];
  renderRow: (item: T, index: number) => React.ReactNode;
  emptyMessage?: string;
  className?: string;
  subtitle?: string;
}

const DashboardTable = <T,>({
  title,
  headerAction,
  color = 'bg-slate-500',
  columns,
  data,
  renderRow,
  emptyMessage = '暫無資料 (No Data)',
  className = '',
  subtitle
}: DashboardTableProps<T>) => {
  const textColorClass = color.replace('bg-', 'text-');

  return (
    <div className={`bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden shadow-lg h-full flex flex-col transition-colors duration-300 ${className}`}>
        <div className={`px-3 py-3 ${color} bg-opacity-10 border-b border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-start sm:items-center flex-shrink-0 min-h-[56px]`}>
            <div className="flex items-center flex-1 min-w-0 mr-2 mb-2 sm:mb-0">
                <div className="flex flex-col">
                    <h3 className={`font-bold ${textColorClass} truncate mr-2`}>{title}</h3>
                    {subtitle && (
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">
                            {subtitle}
                        </span>
                    )}
                </div>
                {headerAction && <div className="mt-1 sm:mt-0">{headerAction}</div>}
            </div>
            <CrownIcon className={`w-5 h-5 ${textColorClass} flex-shrink-0 hidden sm:block`} />
        </div>
        <div className="overflow-x-auto flex-1 custom-scrollbar">
            <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 uppercase sticky top-0 z-10">
                    <tr>
                        {columns.map((col, idx) => (
                            <th key={idx} className={`px-3 py-2 ${col.className || ''}`}>
                                {col.header}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {data.length > 0 ? (
                        data.map((item, idx) => renderRow(item, idx))
                    ) : (
                        <tr>
                            <td colSpan={columns.length} className="px-3 py-4 text-center text-slate-500">
                                {emptyMessage}
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    </div>
  );
};

export default DashboardTable;
