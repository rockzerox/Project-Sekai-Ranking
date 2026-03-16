import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getEventsList } from '../../src/services/eventsService';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const events = await getEventsList();
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).send(events);
  } catch (error) {
    console.error("Error in Vercel API /api/event/list:", error);
    return res.status(500).json({ error: "Failed to fetch events list" });
  }
}
