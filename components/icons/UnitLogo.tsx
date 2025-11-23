
import React from 'react';

interface UnitLogoProps {
  unitName: string;
  className?: string;
}

const UnitLogo: React.FC<UnitLogoProps> = ({ unitName, className }) => {
  const commonProps = {
    className,
    fill: "currentColor",
    viewBox: "0 0 24 24",
    xmlns: "http://www.w3.org/2000/svg"
  };

  if (unitName === '混活') {
      return <span className="text-[10px] font-bold leading-none select-none">混活</span>;
  }

  switch (unitName) {
    case "Leo/need":
      // Shooting Star / Constellation Vibe
      return (
        <svg {...commonProps}>
          <path d="M12 0.5L15.5 8.5L24 9.5L17.5 15.5L19.5 24L12 19.5L4.5 24L6.5 15.5L0 9.5L8.5 8.5L12 0.5Z" transform="scale(0.9) translate(1,1)" />
        </svg>
      );
    case "MORE MORE JUMP!":
      // 3-Leaf Clover (Hearts)
      return (
        <svg {...commonProps}>
           <path d="M12 12.5C12 12.5 9 8 6.5 8C4 8 2 10 2 12.5C2 15 4 17.5 6.5 17.5C9 17.5 12 12.5 12 12.5Z" transform="rotate(0 12 12.5)" />
           <path d="M12 12.5C12 12.5 15 8 17.5 8C20 8 22 10 22 12.5C22 15 20 17.5 17.5 17.5C15 17.5 12 12.5 12 12.5Z" transform="rotate(0 12 12.5)" />
           <path d="M12 12.5C12 12.5 16 13 16 16C16 19 14 21 12 21C10 21 8 19 8 16C8 13 12 12.5 12 12.5Z" transform="translate(0,-2)" />
           <path d="M12 12.5 V 23" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    case "Vivid BAD SQUAD":
      // Graffiti / Lightning Style
      return (
        <svg {...commonProps}>
           <path d="M4 2 L8 2 L11 10 L14 2 L18 2 L13 14 L16 22 L11 22 L8 14 L5 22 L0 22 L3 14 Z" />
           <path d="M18 4 L24 6 L22 12 L18 4 Z" opacity="0.6" />
        </svg>
      );
    case "Wonderlands × showtime":
      // Bouncy Crown
      return (
        <svg {...commonProps}>
           <path d="M2 16 L5 6 L10 12 L14 6 L19 12 L22 6 L22 18 Q12 21 2 18 Z" />
           <circle cx="5" cy="6" r="1.5" />
           <circle cx="14" cy="6" r="1.5" />
           <circle cx="22" cy="6" r="1.5" />
        </svg>
      );
    case "25點,nightcord見":
      // Geometric Flower / 4 Diamonds
      return (
        <svg {...commonProps}>
           <path d="M12 11 L15 6 L18 11 L15 16 Z" transform="translate(-3, -2)" />
           <path d="M12 11 L17 14 L12 19 L7 14 Z" transform="translate(0, -3)" />
           <path d="M12 11 L9 16 L6 11 L9 6 Z" transform="translate(3, -2)" />
           <path d="M12 11 L7 8 L12 3 L17 8 Z" transform="translate(0, 3)" />
           <circle cx="12" cy="12" r="1.5" />
        </svg>
      );
    case "Virtual Singer":
      // Sharp Digital V
      return (
        <svg {...commonProps}>
           <path d="M2 4 H7 L12 16 L17 4 H22 L14 22 H10 L2 4 Z" />
           <rect x="9" y="2" width="6" height="2" />
        </svg>
      );
    default:
      // Fallback
      return (
        <svg {...commonProps}>
           <circle cx="12" cy="12" r="10" />
        </svg>
      );
  }
};

export default UnitLogo;
