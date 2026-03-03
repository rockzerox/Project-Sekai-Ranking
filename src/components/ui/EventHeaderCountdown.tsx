import React, { useState, useEffect } from 'react';

interface EventHeaderCountdownProps {
    targetDate: string;
    className?: string;
}

const EventHeaderCountdown: React.FC<EventHeaderCountdownProps> = ({ targetDate, className = '' }) => {
    const [timeLeft, setTimeLeft] = useState('00日:00時:00分:00秒');
    useEffect(() => {
        const calculateTime = () => {
            const now = new Date().getTime();
            const target = new Date(targetDate).getTime();
            const distance = target - now;
            if (distance <= 0) {
                setTimeLeft('00日:00時:00分:00秒');
                return;
            }
            const days = Math.floor(distance / (1000 * 60 * 60 * 24));
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);
            setTimeLeft(`${String(days).padStart(2, '0')}日:${String(hours).padStart(2, '0')}時:${String(minutes).padStart(2, '0')}分:${String(seconds).padStart(2, '0')}秒`);
        };
        calculateTime();
        const interval = setInterval(calculateTime, 1000);
        return () => clearInterval(interval);
    }, [targetDate]);
    return (
        <div className={`inline-block font-mono text-sm sm:text-base font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded border border-slate-300 dark:border-slate-600 ${className}`}>
            {timeLeft}
        </div>
    );
};

export default EventHeaderCountdown;
