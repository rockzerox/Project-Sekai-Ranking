
import React from 'react';

interface IconProps {
  className?: string;
}

const TrophyIcon: React.FC<IconProps> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
  >
    <path
      fillRule="evenodd"
      d="M16.5 3A3.75 3.75 0 0012.75 0h-1.5A3.75 3.75 0 007.5 3v2.25H6a3 3 0 00-3 3v2.25a3 3 0 003 3h1.5v3.75a3 3 0 003 3h3a3 3 0 003-3V13.5H18a3 3 0 003-3V8.25a3 3 0 00-3-3h-1.5V3zm-3 1.5V3a2.25 2.25 0 00-2.25-2.25h-1.5A2.25 2.25 0 007.5 3v1.5h6z"
      clipRule="evenodd"
    />
    <path d="M3 12.75a.75.75 0 000 1.5h18a.75.75 0 000-1.5H3z" />
  </svg>
);

export default TrophyIcon;
