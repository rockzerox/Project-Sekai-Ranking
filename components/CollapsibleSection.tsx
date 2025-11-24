
import React from 'react';

interface CollapsibleSectionProps {
  title: React.ReactNode;
  children: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({ title, children, isOpen, onToggle }) => {
  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-lg overflow-hidden mb-4 transition-shadow hover:shadow-cyan-500/10">
      <button
        onClick={onToggle}
        className="w-full flex justify-between items-center p-4 text-left font-bold text-lg text-white hover:bg-slate-700/50 transition-colors"
        aria-expanded={isOpen}
        aria-controls={`collapsible-content`}
      >
        <span className="flex-1 flex items-center gap-2 overflow-hidden">{title}</span>
        <svg
          className={`w-6 h-6 transform transition-transform duration-300 ${isOpen ? 'rotate-180' : ''} flex-shrink-0 ml-2`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <div className={`collapsible-content ${isOpen ? 'open' : ''}`}>
        <div className="p-4 border-t border-slate-700">
          {children}
        </div>
      </div>
    </div>
  );
};

export default CollapsibleSection;
