import React, { useState, useEffect } from 'react';

const CountdownTimer: React.FC<{ targetDate: string }> = ({ targetDate }) => {
    const [timeLeft, setTimeLeft] = useState('');
    useEffect(() => {
        const interval = setInterval(() => {
            const now = new Date().getTime();
            const target = new Date(targetDate).getTime();
            const distance = target - now;
            if (distance < 0) {
                setTimeLeft('即將公佈');
                clearInterval(interval);
                return;
            }
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);
            setTimeLeft(`${hours}小時 ${minutes}分 ${seconds}秒`);
        }, 1000);
        return () => clearInterval(interval);
    }, [targetDate]);
    return <span className="font-mono text-xl sm:text-2xl font-bold text-cyan-600 dark:text-cyan-400">{timeLeft}</span>;
};

export default CountdownTimer;
