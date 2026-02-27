
import React from 'react';

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label?: string;
  onChange: (value: string) => void;
  containerClassName?: string;
}

const Input: React.FC<InputProps> = ({ 
  label, 
  onChange, 
  className = '', 
  containerClassName = '',
  type = 'text',
  ...props 
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  return (
    <div className={`flex flex-col ${containerClassName}`}>
      {label && (
        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">
          {label}
        </label>
      )}
      <input
        type={type}
        onChange={handleChange}
        className={`
          w-full bg-white dark:bg-slate-800 
          border border-slate-300 dark:border-slate-700 
          text-slate-900 dark:text-white text-sm rounded-lg 
          focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 
          block p-2.5 outline-none transition-colors
          disabled:bg-slate-100 disabled:text-slate-500 dark:disabled:bg-slate-900
          ${className}
        `}
        {...props}
      />
    </div>
  );
};

export default Input;
