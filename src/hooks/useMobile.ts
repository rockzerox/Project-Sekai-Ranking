import { useState, useEffect } from 'react';

/**
 * useMobile — 統一手機斷點偵測 Hook
 * 預設斷點 640px（Tailwind `sm:`），與字體/分頁切換對齊
 * 注意：App.tsx 的框架層切換（Sidebar/MobileHome）使用 768px，保持不變
 */
export const useMobile = (breakpoint = 640): boolean => {
    const [isMobile, setIsMobile] = useState(() => window.innerWidth < breakpoint);

    useEffect(() => {
        const handler = () => setIsMobile(window.innerWidth < breakpoint);
        window.addEventListener('resize', handler);
        return () => window.removeEventListener('resize', handler);
    }, [breakpoint]);

    return isMobile;
};
