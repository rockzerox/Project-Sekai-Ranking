
import { MS_PER_DAY } from '../config/constants';
import { WorldLinkInfo } from '../types';

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

// ─── World Link Chapter Timing ───────────────────────────────────────────────

export type WlChapterStatus = 'not_started' | 'warming' | 'active' | 'calculating' | 'ended';

export interface WlChapterTiming {
    charId: string;
    startAt: string;         // ISO string — chapter starts
    aggregateAt: string;     // ISO string — chapter ends (used as "aggregate")
    rankingAnnounceAt: string; // ISO string — +10 min after aggregateAt
    status: WlChapterStatus;
}

const WARM_MS = 3 * 60 * 1000;   // 3 minutes
const CALC_MS = 10 * 60 * 1000;  // 10 minutes

/**
 * Computes per-chapter timing & status for a World Link event.
 * Pure function — pass in the current timestamp as `now`.
 */
export function getWlChapterTimings(
    wlInfo: WorldLinkInfo,
    eventStartAt: string,
    now: number
): WlChapterTiming[] {
    const base = new Date(eventStartAt).getTime();
    const chunkMs = wlInfo.chDavg * 86400000;

    return wlInfo.chorder.map((charId, i) => {
        const start    = base + i * chunkMs;
        const end      = base + (i + 1) * chunkMs;
        const announce = end + CALC_MS;

        let status: WlChapterStatus;
        if      (now < start)          status = 'not_started';
        else if (now < start + WARM_MS) status = 'warming';
        else if (now < end)             status = 'active';
        else if (now < announce)        status = 'calculating';
        else                            status = 'ended';

        return {
            charId,
            startAt:            new Date(start).toISOString(),
            aggregateAt:        new Date(end).toISOString(),
            rankingAnnounceAt:  new Date(announce).toISOString(),
            status,
        };
    });
}
