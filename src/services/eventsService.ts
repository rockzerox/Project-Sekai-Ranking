import { createClient } from '@supabase/supabase-js';
import eventDetailJson from '../data/eventDetail.json';

const HISEKAI_API_BASE = process.env.HISEKAI_API_BASE || 'https://api.hisekai.org/tw';
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey || '');

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
  const eventDetailMap = eventDetailJson as any;

  // 1. 合併 API 與 eventDetail.json 的所有 ID
  const allEventIds = new Set([
    ...apiEvents.map((e: any) => String(e.id)),
    ...Object.keys(eventDetailMap)
  ]);

  // 2. 取得現有 events 資料
  const { data: existingEvents } = await supabase.from('events').select('*');
  const existingEventsMap = new Map(existingEvents?.map((e: any) => [String(e.id), e]));

  // 3. 準備 upsert 資料 (實作 COALESCE 邏輯)
  const upsertData = Array.from(allEventIds).map((id) => {
    const apiEvent = apiEvents.find((e: any) => String(e.id) === id);
    const existingEvent = existingEventsMap.get(id);
    
    // COALESCE 邏輯：優先用新值 (API)，新值是 null/undefined 就保留舊值 (existing)
    return {
      id: Number(id),
      name: apiEvent?.name ?? existingEvent?.name ?? null,
      start_at: apiEvent?.start_at ?? existingEvent?.start_at ?? null,
      aggregate_at: apiEvent?.aggregate_at ?? existingEvent?.aggregate_at ?? null,
      closed_at: apiEvent?.closed_at ?? existingEvent?.closed_at ?? null,
      // 靜態欄位保留舊值
      unit_id: existingEvent?.unit_id ?? null,
      banner_id: existingEvent?.banner_id ?? null,
      story_type: existingEvent?.story_type ?? null
    };
  });

  // 4. 批次 Upsert
  const { error } = await supabase.from('events').upsert(upsertData);
  if (error) throw new Error(`Failed to upsert events: ${error.message}`);
  console.log(`Successfully synced ${upsertData.length} events.`);
};
