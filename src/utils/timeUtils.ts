
import { MS_PER_DAY } from '../config/constants';

export const calculatePreciseDuration = (start: string, aggregate: string): number => {
    const s = new Date(start).getTime();
    const a = new Date(aggregate).getTime();
    return Math.max(0.01, (a - s) / MS_PER_DAY);
};

export const calculateDisplayDuration = (start: string, aggregate: string): number => {
    return Math.ceil(calculatePreciseDuration(start, aggregate));
};

export const getEventStatus = (start: string, aggregate: string, closed: string, announce: string): string => {
    const now = Date.now();
    const s = new Date(start).getTime();
    const a = new Date(aggregate).getTime();
    const an = new Date(announce).getTime();
    if (now < s) return 'upcoming';
    if (now < a) return 'live';
    if (now < an) return 'aggregating';
    return 'past';
};
