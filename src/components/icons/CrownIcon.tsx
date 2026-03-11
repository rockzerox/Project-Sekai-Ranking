
import React from 'react';

interface IconProps {
  className?: string;
}

// Final Simple Crown Icon
const FinalCrownIcon: React.FC<IconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M5.16 10.03L2 14.24l4.24-.01 1.76-3.06-2.84-1.14zM18.84 10.03l-2.84 1.14 1.76 3.06L22 14.23l-3.16-4.2zM12 2l-4.24 7.33L12 12l4.24-2.67L12 2zM7.91 15.68L12 13.33l4.09 2.35-1.4-4.81L12 12l-2.69-1.13-1.4 4.81zM8.24 17.11l-2.47 4.28h12.46l-2.47-4.28L12 19.46l-3.76-2.35z"/>
    </svg>
);


export default FinalCrownIcon;
