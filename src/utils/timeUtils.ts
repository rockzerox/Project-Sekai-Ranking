
import { MS_PER_DAY, WL_ROUND1_ANNIVERSARY_YEAR } from '../config/constants';
import { WorldLinkChapterLive } from '../types';

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

// ─── World Link Round Algorithm ──────────────────────────────────────────────

/**
 * 動態推導 World Link 輪次 (Round)
 * 基準：以台服 3 週年 (2024-09-30) 為 Round 1 基準，免維護即時推導
 * @param startAt 活動開始時間 (ISO8601 string)
 * @param overrideRound 可選覆寫 (未來安全閥)
 */
export function getWlRound(startAt: string, overrideRound?: number): number {
    if (overrideRound !== undefined && overrideRound > 0) return overrideRound;
    const d = new Date(startAt);
    const y = d.getUTCFullYear();
    // 每年 9/30 00:00:00 UTC (月份索引 8 代表 9 月)
    const annivUtc = Date.UTC(y, 8, 30, 0, 0, 0, 0);
    const annivYear = d.getTime() >= annivUtc ? y : y - 1;
    const round = annivYear - (WL_ROUND1_ANNIVERSARY_YEAR - 1); // annivYear - 2023
    return Math.max(1, round);
}

// ─── World Link Chapter Timing ───────────────────────────────────────────────

export type WlChapterStatus = 'not_started' | 'warming' | 'active' | 'calculating' | 'ended';

export interface WlChapterTiming {
    charId: string;
    startAt: string;         // ISO string — chapter starts
    aggregateAt: string;     // ISO string — chapter ends (used as "aggregate")
    rankingAnnounceAt: string; // ISO string — +10 min after aggregateAt
    status: WlChapterStatus;
    chapterOrder?: number;
}

const WARM_MS = 3 * 60 * 1000;   // 3 minutes
const CALC_MS = 10 * 60 * 1000;  // 10 minutes

/**
 * Computes per-chapter timing & status for a World Link event.
 * Pure function — pass in the current timestamp as `now`.
 */
export function getWlChapterTimings(
    chapters: WorldLinkChapterLive[] | { charId: string; startAt: string; aggregateAt: string; closedAt?: string; chapterOrder?: number }[] | undefined,
    now: number
): WlChapterTiming[] {
    if (!chapters || chapters.length === 0) return [];

    return chapters.map((ch: any) => {
        const charId = String(ch.character ?? ch.charId ?? ch.gameCharacterId);
        const start = new Date(ch.start_at || ch.startAt).getTime();
        const end = new Date(ch.aggregate_at || ch.aggregateAt || ch.closed_at || ch.closedAt || start + 86400000).getTime();
        const announce = end + CALC_MS;

        let status: WlChapterStatus;
        if      (now < start)          status = 'not_started';
        else if (now < start + WARM_MS) status = 'warming';
        else if (now < end)             status = 'active';
        else if (now < announce)        status = 'calculating';
        else                            status = 'ended';

        return {
            charId,
            startAt: new Date(start).toISOString(),
            aggregateAt: new Date(end).toISOString(),
            rankingAnnounceAt: new Date(announce).toISOString(),
            status,
            chapterOrder: ch.chapter ?? ch.chapterOrder,
        };
    });
}
