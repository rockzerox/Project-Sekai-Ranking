import { supabase } from './supabase';

const HISEKAI_API_BASE = process.env.HISEKAI_API_BASE || 'https://api.hisekai.org/tw';

export const getEventsList = async () => {
  try {
    const response = await fetch(`${HISEKAI_API_BASE}/event/list`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Error fetching events list:', error);
    throw error;
  }
};

export const getEventById = async (eventId: number) => {
  try {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single();
    if (error) throw error;
    return data;
  } catch (error) {
    console.error(`Error fetching event ${eventId}:`, error);
    throw error;
  }
};

export const syncEvents = async () => {
  console.log('Starting events synchronization...');
  const apiEvents = await getEventsList();

  // 1. 取得現有 events 資料
  const { data: existingEvents } = await supabase.from('events').select('*');
  const existingEventsMap = new Map(existingEvents?.map((e: any) => [String(e.id), e]));

  // 2. 準備 upsert 資料
  const upsertData = apiEvents.map((apiEvent: any) => {
    const id = String(apiEvent.id);
    const existingEvent = existingEventsMap.get(id);
    
    return {
      id: Number(id),
      name: apiEvent.name ?? existingEvent?.name ?? null,
      start_at: apiEvent.start_at ?? existingEvent?.start_at ?? null,
      aggregate_at: apiEvent.aggregate_at ?? existingEvent?.aggregate_at ?? null,
      closed_at: apiEvent.closed_at ?? existingEvent?.closed_at ?? null,
      // 靜態欄位保留舊值，修正為正確的資料庫欄位名稱
      unit_id: existingEvent?.unit_id ?? null,
      banner: existingEvent?.banner ?? null, // 修正：從 banner_id 改為 banner
      event_type: existingEvent?.event_type ?? null, // 修正：確保 event_type 正確同步
      story_type: existingEvent?.story_type ?? null
    };
  });

  // 3. 批次 Upsert
  const { error } = await supabase.from('events').upsert(upsertData);
  if (error) throw new Error(`Failed to upsert events: ${error.message}`);
  console.log(`Successfully synced ${upsertData.length} events.`);
};
