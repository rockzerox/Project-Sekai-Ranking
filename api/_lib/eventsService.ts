import { supabase } from './supabase';
import eventDetailJson from '../../src/data/eventDetail.json';

const eventDetails = eventDetailJson as Record<string, any>;

const parseUnitId = (rawUnit: any, fallback: number | null): number | null => {
  if (rawUnit !== undefined && rawUnit !== null && rawUnit !== '-' && rawUnit !== '') {
    const num = Number(rawUnit);
    return isNaN(num) ? fallback : num;
  }
  return fallback;
};

const parseFourStarCards = (rawCards: any, fallback: string[] | null): string[] | null => {
  if (typeof rawCards === 'string' && rawCards.trim() !== '' && rawCards !== '-') {
    return rawCards.split(',').map((s: string) => s.trim()).filter(Boolean);
  }
  if (rawCards === '-') return null;
  return fallback;
};

const parseBanner = (rawBanner: any, fallback: string | null): string | null => {
  if (rawBanner !== undefined && rawBanner !== null && rawBanner !== '') {
    return String(rawBanner);
  }
  return fallback;
};

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
    const detail = eventDetails[id];
    const isWl = Array.isArray(apiEvent.chapters) && apiEvent.chapters.length > 0;
    const currentExtra = (existingEvent?.extra_data && typeof existingEvent.extra_data === 'object') ? existingEvent.extra_data : {};
    const updatedExtra = isWl ? { ...currentExtra, chapters: apiEvent.chapters } : currentExtra;
    
    return {
      id: Number(id),
      name: apiEvent.name ?? existingEvent?.name ?? null,
      start_at: apiEvent.start_at ?? existingEvent?.start_at ?? null,
      aggregate_at: apiEvent.aggregate_at ?? existingEvent?.aggregate_at ?? null,
      closed_at: apiEvent.closed_at ?? existingEvent?.closed_at ?? null,
      ranking_announce_at: apiEvent.ranking_announce_at ?? existingEvent?.ranking_announce_at ?? null,
      // 企劃屬性：優先自 eventDetail.json 注入，若未配置則平滑回退至 existingEvent 現存值或 null
      unit_id: parseUnitId(detail?.unit, existingEvent?.unit_id ?? null),
      banner: parseBanner(detail?.banner, existingEvent?.banner ?? null),
      four_star_cards: parseFourStarCards(detail?.['4starcard'], existingEvent?.four_star_cards ?? null),
      event_type: isWl ? 'world_link' : (detail?.type || (existingEvent?.event_type ?? null)),
      story_type: detail?.storyType || (existingEvent?.story_type ?? null),
      card_type: detail?.cardType || (existingEvent?.card_type ?? null),
      tag: detail?.tag || (existingEvent?.tag ?? null),
      extra_data: Object.keys(updatedExtra).length > 0 ? updatedExtra : null
    };
  });

  // 3. 批次 Upsert
  const { error } = await supabase.from('events').upsert(upsertData);
  if (error) throw new Error(`Failed to upsert events: ${error.message}`);
  console.log(`Successfully synced ${upsertData.length} events.`);
};
