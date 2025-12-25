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
  if (!connectionString) return res.status(500).json({ error: 'Config missing.' });
  
  const edgeConfig = createClient(connectionString);

  try {
    if (type === 'char' && id) {
      // 從 Edge Config 讀取動態連結指標
      const dynamicBlobUrl = await edgeConfig.get('structure_char_url') as string;
      if (!dynamicBlobUrl) return res.status(404).json({ error: 'Char URL pointer not found.' });

      const charRes = await fetch(dynamicBlobUrl);
      if (!charRes.ok) throw new Error('Blob fetch failed.');
      
      const charText = await charRes.text();
      if (!charText) throw new Error('Blob empty.');
      
      const allChars = JSON.parse(charText);
      const data = allChars[id as string];
      if (!data) return res.status(404).json({ error: 'Char data missing.' });
      return res.status(200).json(data);
    }

    let key = 'structure_global';
    if (type === 'unit' && id) {
      const safeId = getSafeUnitKey(id as string);
      if (!safeId) return res.status(404).json({ error: 'Unit unsupported.' });
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