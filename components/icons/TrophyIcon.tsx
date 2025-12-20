import React from 'react';

interface IconProps {
  className?: string;
}

const MusicNoteLogo: React.FC<IconProps> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
  >
    {/* Stylized Eighth Note (八分音符) */}
    <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h6V3h-8z" />
  </svg>
);

export default MusicNoteLogo;