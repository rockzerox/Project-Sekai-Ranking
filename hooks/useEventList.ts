
import { useState, useEffect } from 'react';
import { EventSummary } from '../types';

export const useEventList = () => {
    const [events, setEvents] = useState<EventSummary[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;

        const fetchEvents = async () => {
            try {
                const response = await fetch('https://api.hisekai.org/event/list');
                if (!response.ok) {
                    throw new Error('Failed to fetch event list');
                }
                const data: EventSummary[] = await response.json();
                
                if (isMounted) {
                    // Sort by ID descending (newest first) by default
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
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };

        fetchEvents();

        return () => {
            isMounted = false;
        };
    }, []);

    return { events, isLoading, error };
};
