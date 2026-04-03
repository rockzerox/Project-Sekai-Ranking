import React, { useState, useEffect } from 'react';

interface EventHeaderCountdownProps {
    targetDate: string;
    className?: string;
    /** bare=true: \u88f8\u6587\u5b57\u6a21\u5f0f\uff0c\u4e0d\u5305\u542b\u5916\u6846\u6a23\u5f0f\uff0c\u9069\u7528\u65bc\u624b\u6a5f\u7aef\u7dca\u6e4a\u4f48\u5c40 */
    bare?: boolean;
}

const EventHeaderCountdown: React.FC<EventHeaderCountdownProps> = ({ targetDate, className = '', bare = false }) => {
    const [timeLeft, setTimeLeft] = useState('00\u65e5:00\u6642:00\u5206:00\u79d2');
    useEffect(() => {
        const calculateTime = () => {
            const now = new Date().getTime();
            const target = new Date(targetDate).getTime();
            const distance = target - now;
            if (distance <= 0) {
                setTimeLeft('00\u65e5:00\u6642:00\u5206:00\u79d2');
                return;
            }
            const days = Math.floor(distance / (1000 * 60 * 60 * 24));
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);
            setTimeLeft(`${String(days).padStart(2, '0')}\u65e5:${String(hours).padStart(2, '0')}\u6642:${String(minutes).padStart(2, '0')}\u5206:${String(seconds).padStart(2, '0')}\u79d2`);
        };
        calculateTime();
        const interval = setInterval(calculateTime, 1000);
        return () => clearInterval(interval);
    }, [targetDate]);

    if (bare) {
        return (
            <span className={`font-mono font-bold text-slate-500 dark:text-slate-400 ${className}`}>
                {timeLeft}
            </span>
        );
    }

    return (
        <div className={`inline-block font-mono text-sm sm:text-base font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded border border-slate-300 dark:border-slate-600 ${className}`}>
            {timeLeft}
        </div>
    );
};

export default EventHeaderCountdown;

