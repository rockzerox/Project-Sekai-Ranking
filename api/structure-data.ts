import { createClient } from '@vercel/edge-config';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const UNIT_KEY_MAP: Record<string, string> = {
  "Leo/need": "leo_need",
  "MORE MORE JUMP!": "more_more_jump",
  "Vivid BAD SQUAD": "vivid_bad_squad",
  "Wonderlands × Showtime": "wonderlands_showtime",
  "25點，Nightcord見。": "25ji"
};

function getSafeUnitKey(unitName: string): string | null {
  return UNIT_KEY_MAP[unitName] || null;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { type, id } = req.query;
  const connectionString = process.env.EDGE_CONFIG;
  
  try {
    // 角色數據分流至 Blob
    if (type === 'char' && id) {
      const blobBase = 'https://kilyz3e8atuyf098.public.blob.vercel-storage.com';
      const charRes = await fetch(`${blobBase}/structure_chars.json`);
      if (!charRes.ok) throw new Error('Blob storage unavailable.');
      const allChars = await charRes.json();
      const data = allChars[id as string];
      if (!data) return res.status(404).json({ error: 'Character data not found.' });
      return res.status(200).json(data);
    }

    // Global 與 Unit 留在 Edge Config
    if (!connectionString) throw new Error('Edge Config not configured.');
    const edgeConfig = createClient(connectionString);
    let key = 'structure_global';

    if (type === 'unit' && id) {
      const safeId = getSafeUnitKey(id as string);
      if (!safeId) return res.status(404).json({ error: 'Unit not supported.' });
      key = `structure_unit_${safeId}`;
    }

    const data = await edgeConfig.get(key);
    if (!data) return res.status(404).json({ error: 'Data not found.' });

    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
    return res.status(200).json(data);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}