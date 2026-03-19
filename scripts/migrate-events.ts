// scripts/migrate-events.ts
import { sb, HISEKAI } from './_client';
import eventDetailJson from '../src/data/eventDetail.json';
import wlDetailJson from '../src/data/WorldLinkDetail.json';

async function run() {
    const res = await fetch(`${HISEKAI}/event/list`);
    const apiEvents: any[] = await res.json();
    console.log(`API 回傳 ${apiEvents.length} 筆活動`);

    const eventDetailMap = eventDetailJson as any;
    const allEventIds = new Set([
        ...apiEvents.map((e: any) => String(e.id)),
        ...Object.keys(eventDetailMap)
    ]);

    // 取得現有 events 資料
    const { data: existingEvents } = await sb.from('events').select('*');
    const existingEventsMap = new Map(existingEvents?.map((e: any) => [String(e.id), e]));

    const rows = Array.from(allEventIds).map(id => {
        const apiEvent = apiEvents.find((e: any) => String(e.id) === id);
        const existingEvent = existingEventsMap.get(id);
        const detail = eventDetailMap[id] ?? {};

        return {
            id: Number(id),
            name: apiEvent?.name ?? existingEvent?.name ?? null,
            start_at: apiEvent?.start_at ?? existingEvent?.start_at ?? null,
            aggregate_at: apiEvent?.aggregate_at ?? existingEvent?.aggregate_at ?? null,
            closed_at: apiEvent?.closed_at ?? existingEvent?.closed_at ?? null,
            ranking_announce_at: apiEvent?.ranking_announce_at ?? existingEvent?.ranking_announce_at ?? null,
            event_type: detail.type ?? existingEvent?.event_type ?? null,
            unit_id: (Number(detail.unit) || existingEvent?.unit_id) ?? null,
            story_type: detail.storyType ?? existingEvent?.story_type ?? null,
            card_type: detail.cardType ?? existingEvent?.card_type ?? null,
            banner: detail.banner ?? existingEvent?.banner ?? null,
            tag: detail.tag ?? existingEvent?.tag ?? null,
        };
    });

    const BATCH = 50;
    for (let i = 0; i < rows.length; i += BATCH) {
        const { error } = await sb.from('events').upsert(
            rows.slice(i, i + BATCH),
            { onConflict: 'id' }
        );
        if (error) throw error;
        console.log(`events: ${Math.min(i + BATCH, rows.length)}/${rows.length}`);
    }
    console.log('✅ events done');

    const allEventIdsSet = new Set(rows.map(r => r.id));
    const wlRows = Object.entries(wlDetailJson as any)
        .map(([id, info]: any) => ({
            event_id: Number(id),
            round: info.round,
            ch_order: info.chorder,
            ch_d_avg: info.chDavg ?? null,
            is_final: info.isfinal ?? false,
        }))
        .filter(row => allEventIdsSet.has(row.event_id));
    const { error: e2 } = await sb
        .from('world_link_details')
        .upsert(wlRows, { onConflict: 'event_id' });
    if (e2) throw e2;
    console.log(`✅ world_link_details done: ${wlRows.length} 筆`);
}

run().catch(console.error);
