// scripts/migrate-songs.ts
import { sb } from './_client';
import songJson from '../src/data/song.json';

async function run() {
    // 1. 取得現有所有 events ID
    const { data: events } = await sb.from('events').select('id');
    const eventIds = new Set(events?.map(e => e.id));

    // 2. 轉換並過濾歌曲資料
    const rows = Object.entries(songJson as any)
        .map(([key, s]: any) => ({
            music_id: Number(key),
            event_id: s.eventId ?? null, // 若 eventId 為 null 則允許
            title: s.title,
            lyricist: s.lyricist ?? null,
            composer: s.composer ?? null,
            arranger: s.arranger ?? null,
            mv2d_url: s.mv2d ?? null,
            mv3d_url: s.mv3d ?? null,
        }))
        // 只有當 event_id 存在且 events 表中沒有該 ID 時，才過濾掉（或設為 null）
        .filter(s => s.event_id === null || eventIds.has(s.event_id));

    // 3. 批次 Upsert
    const BATCH = 100;
    for (let i = 0; i < rows.length; i += BATCH) {
        const { error } = await sb.from('songs').upsert(
            rows.slice(i, i + BATCH),
            { onConflict: 'music_id' }
        );
        if (error) throw error;
        console.log(`songs: ${Math.min(i + BATCH, rows.length)}/${rows.length}`);
    }
    console.log('✅ songs done');
}

run().catch(console.error);
