import { useState, useEffect } from 'react';
import { EventSummary } from '../types';
import { API_BASE_URL } from '../constants';
import { fetchJsonWithBigInt } from './useRankings';

export const useEventList = () => {
    const [events, setEvents] = useState<EventSummary[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;
        const fetchEvents = async () => {
            try {
                // 修正：路徑為 /event/list，不帶 /tw
                const data: EventSummary[] = await fetchJsonWithBigInt(`${API_BASE_URL}/event/list`);
                if (isMounted && data) {
                    const sortedData = data.sort((a, b) => b.id - a.id);
                    setEvents(sortedData);
                    setError(null);
                }
            } catch (err) {
                if (isMounted) {
                    setError('無法載入活動列表。');
                    console.error(err);
                }
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };
        fetchEvents();
        return () => { isMounted = false; };
    }, []);

    return { events, isLoading, error };
};