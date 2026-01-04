
import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: React.ReactNode;
  action?: React.ReactNode;
  style?: React.CSSProperties;
}

const Card: React.FC<CardProps> = ({ children, className = '', title, action, style }) => {
  return (
    <div 
      className={`bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm transition-colors duration-300 flex flex-col ${className}`}
      style={style}
    >
      {title && (
        <div className="px-4 py-3 sm:px-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center flex-shrink-0">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            {title}
          </h3>
          {action && <div>{action}</div>}
        </div>
      )}
      <div className="p-4 sm:p-6 flex-1 w-full min-h-0">
        {children}
      </div>
    </div>
  );
};

export default Card;
