
import React from 'react';

interface IconProps {
  className?: string;
}

const CrownIcon: React.FC<IconProps> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
  >
    <path
      fillRule="evenodd"
      d="M18.97 18.03a.75.75 0 01.53 1.28l-4.5 4.5a.75.75 0 01-1.06 0l-4.5-4.5a.75.75 0 111.06-1.06l3.22 3.22V5.25a.75.75 0 011.5 0v14.19l3.22-3.22a.75.75 0 01.53-.22zm-8.44-9.28a.75.75 0 00-1.06 0L4.94 13.28a.75.75 0 001.06 1.06L9 11.31V21a.75.75 0 001.5 0V11.31l2.97 2.97a.75.75 0 001.06-1.06l-4.5-4.5z"
      clipRule="evenodd"
    />
    <path d="M12 2.25a.75.75 0 00-.75.75v6a.75.75 0 001.5 0V3a.75.75 0 00-.75-.75z" />
  </svg>
);

// Corrected Crown Icon
const BetterCrownIcon: React.FC<IconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M12 2L8.5 8.5L2 9.25L7.25 14L5.5 20.5L12 17L18.5 20.5L16.75 14L22 9.25L15.5 8.5L12 2Z" />
        <path d="M12 2L13 5.5L15.5 6L13.5 8.5L14 11L12 9.5L10 11L10.5 8.5L8.5 6L11 5.5L12 2Z" opacity="0.5"/>
    </svg>
);

// Final Simple Crown Icon
const FinalCrownIcon: React.FC<IconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M5.16 10.03L2 14.24l4.24-.01 1.76-3.06-2.84-1.14zM18.84 10.03l-2.84 1.14 1.76 3.06L22 14.23l-3.16-4.2zM12 2l-4.24 7.33L12 12l4.24-2.67L12 2zM7.91 15.68L12 13.33l4.09 2.35-1.4-4.81L12 12l-2.69-1.13-1.4 4.81zM8.24 17.11l-2.47 4.28h12.46l-2.47-4.28L12 19.46l-3.76-2.35z"/>
    </svg>
);


export default FinalCrownIcon;
