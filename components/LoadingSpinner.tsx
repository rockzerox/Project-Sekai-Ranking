
import React from 'react';

const LoadingSpinner: React.FC = () => {
  return (
    <div className="flex justify-center items-center py-20">
      <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
      <p className="ml-4 text-slate-300 text-lg">Loading Rankings...</p>
    </div>
  );
};

export default LoadingSpinner;
