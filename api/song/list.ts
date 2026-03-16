import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSongsData } from '../../src/services/dataService';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const songs = await getSongsData();
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).send(songs);
  } catch (error) {
    console.error("Error in Vercel API /api/song/list:", error);
    return res.status(500).json({ error: "Failed to fetch songs data" });
  }
}
