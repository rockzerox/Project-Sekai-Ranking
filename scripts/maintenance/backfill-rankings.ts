// scripts/backfill-rankings.ts
import { sb, HISEKAI, sleep } from '../_client';

const DELAY_MS = 800; // 每次請求間隔，避免對 hisekai 造成壓力
const BIGINT_REGEX = /"([^"]+)"\s*:\s*(-?\d{15,})(?=[,}\s])/g;

async function fetchWithBigInt(url: string) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
    const text = await res.text();
    const sanitized = text.replace(BIGINT_REGEX, '"$1": "$2"');
    return JSON.parse(sanitized);
}

async function upsertPlayers(entries: any[]) {
    const rows = entries.map(r => {
        const userId = r.userId ? String(r.userId) : String(r.user?.id || '');
        if (!userId) return null;
        return {
            user_id: userId,
            user_name: r.name || r.user?.display_name || 'Unknown',
            last_seen_at: new Date().toISOString(),
        };
    }).filter((r): r is any => r !== null);
    
    if (rows.length === 0) return;
    
    // 分段寫入防爆
    for (let i = 0; i < rows.length; i += 500) {
        await sb.from('players').upsert(rows.slice(i, i+500), {
            onConflict: 'user_id',
        });
    }
}

async function upsertRankings(eventId: number, entries: any[], chapterCharId = -1) {
    const rows = entries.map(r => {
        const userId = r.userId ? String(r.userId) : String(r.user?.id || '');
        if (!userId) return null;
        return {
            event_id: eventId,
            chapter_char_id: chapterCharId,
            rank: r.rank,
            score: r.score,
            user_id: userId,
            last_played_at: r.lastPlayedAt ?? null,
            raw_user_card: r.userCard ?? r.last_player_info ?? null,
        };
    }).filter((r): r is any => r !== null);
    
    if (rows.length === 0) return;
    
    // 分段寫入
    for (let i = 0; i < rows.length; i += 500) {
        const { error } = await sb.from('event_rankings').upsert(rows.slice(i, i + 500), {
            onConflict: 'event_id,chapter_char_id,rank',
        });
        if (error) throw error;
    }
}

async function run() {
    const { data: events } = await sb
        .from('events')
        .select('id')
        .not('closed_at', 'is', null)
        .order('id', { ascending: false });

    const { data: done } = await sb
        .from('event_border_stats')
        .select('event_id');
    const doneIds = new Set(done?.map(d => d.event_id) ?? []);

    const todo = (events ?? []).filter(e => !doneIds.has(e.id));

    // 取得命令列參數限制數量
    const limit = process.argv[2] ? parseInt(process.argv[2], 10) : todo.length;
    const processing = todo.slice(0, limit);

    console.log(`已完成：${doneIds.size}，待處理：${todo.length}，本次處理：${processing.length}`);

    for (let i = 0; i < processing.length; i++) {
        const { id } = processing[i];
        try {
            const j1 = await fetchWithBigInt(`${HISEKAI}/event/${id}/top100`);
            const top100 = j1.rankings ?? j1.top_100_player_rankings ?? [];
            await upsertPlayers(top100);
            await upsertRankings(id, top100, -1);

            for (const ch of j1.userWorldBloomChapterRankings ?? []) {
                const entries = ch.rankings ?? [];
                await upsertPlayers(entries);
                await upsertRankings(id, entries, ch.gameCharacterId);
            }
            await sleep(DELAY_MS);

            const j2 = await fetchWithBigInt(`${HISEKAI}/event/${id}/border`);
            const borders = j2.borderRankings ?? j2.border_player_rankings ?? [];
            await upsertPlayers(borders);
            await upsertRankings(id, borders, -1);

            for (const ch of j2.userWorldBloomChapterRankingBorders ?? []) {
                const entries = ch.borderRankings ?? [];
                await upsertPlayers(entries);
                await upsertRankings(id, entries, ch.gameCharacterId);
            }

            const allBorders = [...top100, ...borders];
            const getScore = (rank: number) =>
                allBorders.find(b => b.rank === rank)?.score ?? null;

            const { data: eventInfo } = await sb
                .from('events')
                .select('start_at, aggregate_at')
                .eq('id', id)
                .single();

            const durationDays = eventInfo?.start_at && eventInfo?.aggregate_at
                ? (new Date(eventInfo.aggregate_at).getTime() -
                    new Date(eventInfo.start_at).getTime()) / 86400000
                : 0;

            await sb.from('event_border_stats').upsert({
                event_id: id,
                duration_days: durationDays,
                top1: getScore(1),
                top10: getScore(10),
                top50: getScore(50),
                top100: getScore(100),
                border_200: getScore(200),
                border_300: getScore(300),
                border_400: getScore(400),
                border_500: getScore(500),
                border_1000: getScore(1000),
                border_2000: getScore(2000),
                border_5000: getScore(5000),
                border_10000: getScore(10000),
            }, { onConflict: 'event_id' });

            console.log(`[${i + 1}/${todo.length}] ✅ event ${id}`);
            await sleep(DELAY_MS);

        } catch (e) {
            console.error(`[${i + 1}/${todo.length}] ❌ event ${id}:`, e);
        }
    }
    console.log('🎉 回填完成');
}

run().catch(console.error);
