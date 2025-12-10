import React from 'react';

export interface SelectOption {
  value: string | number;
  label: string;
  style?: React.CSSProperties;
}

interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  label?: string;
  options: (SelectOption | string | number)[];
  onChange: (value: string) => void; // Simplified onChange for ease of use
  placeholder?: string;
  containerClassName?: string;
}

const Select: React.FC<SelectProps> = ({ 
  label, 
  options, 
  onChange, 
  className = '', 
  containerClassName = '',
  placeholder,
  value,
  ...props 
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(e.target.value);
  };

  return (
    <div className={`flex flex-col ${containerClassName}`}>
      {label && (
        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          value={value}
          onChange={handleChange}
          className={`
            appearance-none w-full bg-white dark:bg-slate-800 
            border border-slate-300 dark:border-slate-700 
            text-slate-900 dark:text-white text-sm rounded-lg 
            focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 
            block p-2.5 pr-8 outline-none transition-colors
            disabled:bg-slate-100 disabled:text-slate-500 dark:disabled:bg-slate-900 dark:disabled:text-slate-600
            ${className}
          `}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((opt, idx) => {
            let optValue: string | number;
            let optLabel: React.ReactNode;
            let optStyle: React.CSSProperties | undefined;

            if (typeof opt === 'object' && opt !== null) {
                const optionObj = opt as SelectOption;
                optValue = optionObj.value;
                optLabel = optionObj.label;
                optStyle = optionObj.style;
            } else {
                optValue = opt as string | number;
                optLabel = opt as React.ReactNode;
            }

            return (
              <option key={`${optValue}-${idx}`} value={optValue} style={optStyle}>
                {optLabel}
              </option>
            );
          })}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
          <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
            <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
          </svg>
        </div>
      </div>
    </div>
  );
};

export default Select;