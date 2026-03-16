import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getEventById } from '../../src/services/eventsService';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { id } = req.query;
  
  if (!id || Array.isArray(id)) {
    return res.status(400).json({ error: "Invalid event ID" });
  }

  try {
    const event = await getEventById(id);
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).send(event);
  } catch (error) {
    console.error(`Error in Vercel API /api/event/${id}:`, error);
    return res.status(500).json({ error: `Failed to fetch event ${id}` });
  }
}
